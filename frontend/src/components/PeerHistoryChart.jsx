import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import data from '../data/country_year.json'
import educationData from '../data/education_year.json'
import { addTooltip } from '../chartTooltip'
import { measureColors, selectionColor } from '../chartColors'

const colors = [selectionColor, measureColors.fertility, '#438f8c', '#145653', '#619e9b', '#306b68']
const dashes = [null, null, '9 4', '3 4', '12 4 3 4', '2 3']
const education2001 = new Map(educationData.filter(d => d.year === 2001).map(d => [d.iso3, d.education]))
const education2023 = new Map(educationData.filter(d => d.year === 2023).map(d => [d.iso3, d.education]))
const end2023 = new Map(data.filter(d => d.year === 2023).map(d => [d.iso3, d]))
const choices = data.filter(d => d.year === 2001 && education2001.has(d.iso3))
  .map(d => ({ ...d, education: education2001.get(d.iso3) }))
  .sort((a, b) => a.country.localeCompare(b.country))
const spreads = {
  income: d3.deviation(choices, d => Math.log(d.gdp_pc)),
  mortality: d3.deviation(choices, d => d.mortality),
  education: d3.deviation(choices, d => d.education),
}

export default function PeerHistoryChart() {
  const chartRef = useRef(null)
  const [selectedCountry, setSelectedCountry] = useState('CAF')
  const [chartWidth, setChartWidth] = useState(700)
  const countries = useMemo(() => {
    const chosen = choices.find(d => d.iso3 === selectedCountry)
    const peers = choices.filter(d => d.iso3 !== selectedCountry && d.region === chosen.region)
      .map(d => ({
        ...d,
        distance: Math.hypot(
          (Math.log(d.gdp_pc) - Math.log(chosen.gdp_pc)) / spreads.income,
          (d.mortality - chosen.mortality) / spreads.mortality,
          (d.education - chosen.education) / spreads.education,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5)
    return [chosen, ...peers].map((start, index) => ({
      iso3: start.iso3,
      color: colors[index],
      dash: dashes[index],
      start,
      end: end2023.get(start.iso3),
      educationEnd: education2023.get(start.iso3),
      history: data.filter(d => d.iso3 === start.iso3 && d.year >= 2001 && d.year <= 2023),
    }))
  }, [selectedCountry])

  useEffect(() => {
    const observer = new ResizeObserver(entries => setChartWidth(Math.round(entries[0].contentRect.width)))
    observer.observe(chartRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const margin = { top: 20, right: 25, bottom: 55, left: 65 }
    const width = chartWidth - margin.left - margin.right
    const height = 380 - margin.top - margin.bottom
    const svg = d3.select(chartRef.current).attr('viewBox', `0 0 ${chartWidth} 380`)
    svg.selectAll('*').remove()
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3.scaleLinear().domain([2001, 2023]).range([0, width])
    const y = d3.scaleLinear().domain([0, 8]).range([height, 0])
    const line = d3.line().x(d => x(d.year)).y(d => y(d.fertility))

    chart.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(4).tickSize(-width).tickFormat(''))
    chart.append('g').attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickValues(chartWidth < 500 ? [2001, 2010, 2023] : [2001, 2005, 2010, 2015, 2020, 2023]))
    chart.append('g').call(d3.axisLeft(y).ticks(4))

    const lines = chart.selectAll('.peer-line').data(countries).join('path')
      .attr('class', 'peer-line').attr('fill', 'none')
      .attr('stroke', d => d.color).attr('stroke-width', d => d.iso3 === selectedCountry ? 4 : 3)
      .attr('stroke-dasharray', d => d.dash)
      .attr('d', d => line(d.history))
    const hits = chart.selectAll('.peer-hit').data(countries).join('path')
      .attr('class', 'peer-hit').attr('fill', 'none')
      .attr('stroke', 'transparent').attr('stroke-width', 14)
      .attr('pointer-events', 'stroke').attr('d', d => line(d.history))
      .attr('tabindex', 0)
      .attr('aria-label', d => `${d.start.country} fertility history, 2001 to 2023`)
    hits.on('mouseover.highlight', (event, d) => lines.filter(row => row.iso3 === d.iso3).classed('is-active', true))
      .on('focus.highlight', (event, d) => lines.filter(row => row.iso3 === d.iso3).classed('is-active', true))
      .on('mouseout.highlight', () => lines.classed('is-active', false))
      .on('blur.highlight', () => lines.classed('is-active', false))
    addTooltip(hits, chartRef.current, d =>
      `${d.start.country}\n2001: ${d.history[0].fertility.toFixed(2)} births per woman\n` +
      `2023: ${d.history[d.history.length - 1].fertility.toFixed(2)} births per woman`
    )

    chart.append('text').attr('x', width / 2).attr('y', height + 44)
      .attr('text-anchor', 'middle').text('Year')
    chart.append('text').attr('transform', 'rotate(-90)')
      .attr('x', -height / 2).attr('y', -48)
      .attr('text-anchor', 'middle').text('Births per woman')
  }, [countries, selectedCountry, chartWidth])

  return (
    <section className="chart-card">
      <h2>Fertility since 2001</h2>
      <p>The chart adds up to five countries from the same region that were most similar in 2001.</p>
      <div className="peer-main">
        <div className="peer-plot">
          <div className="peer-controls">
            <label style={{ borderLeftColor: colors[0] }}>Choose a country
              <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}>
                {choices.map(d => <option key={d.iso3} value={d.iso3}>{d.country}</option>)}
              </select>
            </label>
          </div>
          <svg ref={chartRef} role="img" aria-label={`Fertility histories for ${countries[0].start.country} and ${countries.length - 1} nearby peers, 2001 to 2023`} />
          <div className="chart-tooltip" aria-hidden="true" />
          <p className="chart-readout" aria-live="polite">Hover or focus a line to see its endpoint values.</p>
        </div>
        <div className="peer-values">
          <h3>How conditions changed <span>2001 → 2023</span></h3>
          {countries.map((d, index) => <div className="peer-value" key={d.iso3}>
            <strong><i style={{ borderColor: d.color, borderTopStyle: d.dash ? 'dashed' : 'solid' }} />{d.start.country}{index === 0 && ' (chosen)'}</strong>
            <div>
              <span>Income <b>${Math.round(d.start.gdp_pc).toLocaleString()} → ${Math.round(d.end.gdp_pc).toLocaleString()}</b></span>
              <span>Under-5 /1k <b>{d.start.mortality.toFixed(1)} → {d.end.mortality.toFixed(1)}</b></span>
              <span>Enrollment <b>{d.start.education.toFixed(1)}% → {d.educationEnd == null ? '—' : `${d.educationEnd.toFixed(1)}%`}</b></span>
              <span>Fertility <b>{d.start.fertility.toFixed(2)} → {d.end.fertility.toFixed(2)}</b></span>
            </div>
          </div>)}
          {countries.some(d => d.educationEnd == null) &&
            <p className="peer-missing-note">— means no 2023 enrollment data.</p>}
        </div>
      </div>
      <p className="chart-source">Peers are closest on scaled 2001 log income, under-five mortality, and female secondary enrollment. 124 countries qualify. These measures don't capture everything about a country. Source: World Bank WDI.</p>
    </section>
  )
}
