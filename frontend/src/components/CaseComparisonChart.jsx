import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import data from '../data/country_year.json'
import educationData from '../data/education_year.json'
import { addTooltip } from '../chartTooltip'
import { measureColors } from '../chartColors'

const education = new Map(educationData.map(d => [`${d.iso3}-${d.year}`, d.education]))
const year2001 = new Map(data.filter(d => d.year === 2001).map(d => [d.iso3, d]))
const year2023 = new Map(data.filter(d => d.year === 2023).map(d => [d.iso3, d]))

const rows = [...year2001.values()].filter(start =>
  year2023.has(start.iso3) &&
  education.has(`${start.iso3}-2001`) &&
  education.has(`${start.iso3}-2023`)
).map(start => {
  const end = year2023.get(start.iso3)
  return {
    start, end,
    values: [
      Math.log(start.gdp_pc), Math.log(end.gdp_pc),
      start.mortality, end.mortality,
      education.get(`${start.iso3}-2001`), education.get(`${start.iso3}-2023`),
    ],
  }
})

const spreads = rows[0].values.map((_, index) => d3.deviation(rows, d => d.values[index]))
const cases = []

for (let i = 0; i < rows.length; i++) {
  for (let j = i + 1; j < rows.length; j++) {
    const first = rows[i]
    const second = rows[j]
    const distance = Math.sqrt(d3.mean(first.values.map((value, index) =>
      ((value - second.values[index]) / spreads[index]) ** 2
    )))
    const startGap = Math.abs(first.start.fertility - second.start.fertility)
    const endGap = Math.abs(first.end.fertility - second.end.fertility)

    if (distance <= 0.35 && startGap <= 0.5 && endGap - startGap >= 0.5) {
      cases.push({
        codes: [first.start.iso3, second.start.iso3],
        names: [first.start.country, second.start.country],
        startGap, endGap,
        growth: endGap - startGap,
      })
    }
  }
}

cases.sort((a, b) => b.growth - a.growth)
const shortlist = []
const used = new Set()
for (const pair of cases) {
  if (pair.codes.some(code => used.has(code))) continue
  shortlist.push(pair)
  pair.codes.forEach(code => used.add(code))
  if (shortlist.length === 8) break
}

const selectedCodes = new Set(shortlist.flatMap(pair => pair.codes))
const chartYears = data.filter(d => selectedCodes.has(d.iso3) && d.year >= 2001 && d.year <= 2023)
const educationYears = educationData.filter(d => selectedCodes.has(d.iso3) && d.year >= 2001 && d.year <= 2023)
const maxFertility = d3.max(chartYears, d => d.fertility)
const fertilityLimit = maxFertility <= 4 ? 4 : maxFertility <= 6 ? 6 : Math.ceil(maxFertility / 2) * 2
const gdpRange = d3.extent(chartYears, d => d.gdp_pc)
const axisLimits = {
  fertility: [0, fertilityLimit],
  gdp_pc: [gdpRange[0] * 0.8, gdpRange[1] * 1.2],
  mortality: [0, Math.ceil(d3.max(chartYears, d => d.mortality) / 25) * 25],
  education: [0, Math.ceil(d3.max(educationYears, d => d.education) / 25) * 25],
}

const measures = [
  { key: 'fertility', title: 'Fertility', unit: 'Births per woman' },
  { key: 'gdp_pc', title: 'GDP per person', unit: 'Constant 2015 US$ · log scale' },
  { key: 'mortality', title: 'Under-five mortality', unit: 'Deaths per 1,000 births' },
  { key: 'education', title: 'Female secondary enrollment', unit: 'Gross enrollment (%)' },
]

export default function CaseComparisonChart() {
  const [caseIndex, setCaseIndex] = useState(0)
  const chartsRef = useRef(null)
  const pair = shortlist[caseIndex]

  useEffect(() => {
    if (!pair) return
    const histories = pair.codes.map(code => data.filter(d => d.iso3 === code && d.year >= 2001 && d.year <= 2023))

    d3.select(chartsRef.current).selectAll('svg').each(function (_, index) {
      const measure = measures[index]
      const width = 520
      const height = 300
      const margin = { top: 14, right: 18, bottom: 42, left: 64 }
      const plotWidth = width - margin.left - margin.right
      const plotHeight = height - margin.top - margin.bottom
      const svg = d3.select(this).attr('viewBox', `0 0 ${width} ${height}`)
      svg.selectAll('*').remove()
      const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)
      const x = d3.scaleLinear().domain([2001, 2023]).range([0, plotWidth])
      const y = measure.key === 'gdp_pc'
        ? d3.scaleLog().domain(axisLimits.gdp_pc).range([plotHeight, 0])
        : d3.scaleLinear().domain(axisLimits[measure.key]).range([plotHeight, 0])
      const yTicks = measure.key === 'gdp_pc'
        ? [500, 1000, 3000, 10000, 30000, 100000]
        : y.ticks(4)
      const line = d3.line().defined(d => d.value != null)
        .x(d => x(d.year)).y(d => y(d.value))

      chart.append('g').attr('class', 'grid')
        .call(d3.axisLeft(y).tickValues(yTicks).tickSize(-plotWidth).tickFormat(''))
      chart.append('g').attr('transform', `translate(0, ${plotHeight})`)
        .call(d3.axisBottom(x).tickValues([2001, 2010, 2020, 2023]).tickFormat(d3.format('d')))
      chart.append('g').call(d3.axisLeft(y).tickValues(yTicks).tickFormat(measure.key === 'gdp_pc' ? d3.format('~s') : d3.format('~f')))

      histories.forEach((history, countryIndex) => {
        const points = history.map(d => ({
          year: d.year,
          value: measure.key === 'education' ? education.get(`${d.iso3}-${d.year}`) : d[measure.key],
        }))
        chart.append('path').datum(points).attr('class', 'case-line')
          .attr('fill', 'none').attr('stroke', measureColors[measure.key]).attr('stroke-width', 3)
          .attr('stroke-dasharray', countryIndex === 0 ? null : '8 5')
          .attr('d', line)

        const marks = chart.selectAll(`.case-point-${countryIndex}`).data(points.filter(d => d.value != null))
          .join('circle').attr('class', `case-point-${countryIndex}`)
          .attr('cx', d => x(d.year)).attr('cy', d => y(d.value))
          .attr('r', 5).attr('fill', measureColors[measure.key]).attr('opacity', 0)
          .attr('tabindex', 0)
          .attr('aria-label', d => `${pair.names[countryIndex]}, ${d.year}, ${measure.title}: ${d.value.toFixed(1)}`)
        marks.on('mouseover.show', function () { d3.select(this).attr('opacity', 1) })
          .on('focus.show', function () { d3.select(this).attr('opacity', 1) })
          .on('mouseout.show', function () { d3.select(this).attr('opacity', 0) })
          .on('blur.show', function () { d3.select(this).attr('opacity', 0) })
        addTooltip(marks, this, d =>
          `${pair.names[countryIndex]}, ${d.year}\n${measure.title}: ${d.value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${measure.unit}`
        )
      })
    })
  }, [pair])

  if (!pair) return null

  return (
    <section className="chart-card case-card">
      <h2>Similar on paper, different fertility paths</h2>
      <p>These pairs were selected because their fertility gaps widened. They are interesting contrasts, not typical outcomes. Income, mortality, and education were used to find similar pairs; fertility was compared afterward.</p>
      <label>Choose a pair
        <select value={caseIndex} onChange={e => setCaseIndex(Number(e.target.value))}>
          {shortlist.map((item, index) =>
            <option key={item.codes.join('-')} value={index}>{item.names.join(' / ')}</option>
          )}
        </select>
      </label>
      <div className="case-summary">
        <span>Fertility gap</span>
        <strong>{pair.startGap.toFixed(2)} <small>in 2001</small> → {pair.endGap.toFixed(2)} <small>in 2023</small></strong>
      </div>
      <div className="peer-legend">
        {pair.names.map((name, index) =>
          <span key={name}><i style={{ borderColor: '#17324a', borderTopStyle: index === 0 ? 'solid' : 'dashed' }} />{name} ({index === 0 ? 'solid' : 'dashed'})</span>
        )}
      </div>
      <div className="case-grid" ref={chartsRef}>
        {measures.map(measure =>
          <div className="case-panel" key={measure.key}>
            <h3>{measure.title}</h3>
            <p>{measure.unit}</p>
            <svg role="img" aria-label={`${measure.title} histories for ${pair.names.join(' and ')}`} />
            <div className="chart-tooltip" aria-hidden="true" />
            <p className="chart-readout" aria-live="polite">Hover or focus a point for its value.</p>
          </div>
        )}
      </div>
      <p className="chart-source">From {rows.length} economies with complete 2001 and 2023 values, these {shortlist.length} pairs meet the comparison rules. The six development values are scaled; pairs must have distance ≤ 0.35, a 2001 fertility gap ≤ 0.5, and gap growth ≥ 0.5 births per woman. Fertility is not part of the similarity score. Education can have missing years between the endpoints. Each panel keeps the same axes across cases; GDP uses a log scale. Source: World Bank WDI.</p>
    </section>
  )
}
