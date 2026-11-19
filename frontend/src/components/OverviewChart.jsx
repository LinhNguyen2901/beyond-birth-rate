import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import data from '../data/country_year.json'
import educationData from '../data/education_year.json'
import { addTooltip } from '../chartTooltip'
import { measureColors, selectionColor } from '../chartColors'

const historyMax = { fertility: 8, mortality: 500, education: 180 }

export default function OverviewChart({ selectedCountry, onCountrySelect }) {
  const [year, setYear] = useState(2024)
  const scatterRef = useRef(null)
  const fertilityRef = useRef(null)
  const gdpRef = useRef(null)
  const mortalityRef = useRef(null)
  const educationRef = useRef(null)
  const country = data.find(d => d.iso3 === selectedCountry)
  const educationCount = educationData.filter(d => d.iso3 === selectedCountry).length

  useEffect(() => {
    const current = data.filter(d => d.year === year)
    const svg = d3.select(scatterRef.current).attr('viewBox', '0 0 650 340')
    svg.selectAll('*').remove()
    const chart = svg.append('g').attr('transform', 'translate(55,15)')
    const width = 575
    const height = 270
    const x = d3.scaleLog().domain(d3.extent(data, d => d.gdp_pc)).range([0, width])
    const y = d3.scaleLinear().domain([0, 7.2]).range([height, 0])

    chart.append('g').attr('class', 'grid').call(d3.axisLeft(y).ticks(7).tickSize(-width).tickFormat(''))
    chart.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(5, '~s'))
    chart.append('g').call(d3.axisLeft(y).ticks(7))
    const dots = chart.selectAll('circle').data(current).join('circle')
      .attr('cx', d => x(d.gdp_pc)).attr('cy', d => y(d.fertility))
      .attr('r', d => d.iso3 === selectedCountry ? 7 : 4)
      .attr('fill', d => d.iso3 === selectedCountry ? selectionColor : measureColors.gdp_pc).attr('opacity', 0.8)
      .attr('tabindex', 0)
      .attr('aria-label', d => `${d.country}: ${d.fertility.toFixed(2)} births per woman, GDP per person $${Math.round(d.gdp_pc)}`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => onCountrySelect(d.iso3))
      .on('keydown', (event, d) => { if (event.key === 'Enter') onCountrySelect(d.iso3) })
    addTooltip(dots, scatterRef.current, d =>
      `${d.country}\nFertility: ${d.fertility.toFixed(2)} births per woman\nGDP per person: $${d3.format(',.0f')(d.gdp_pc)}`
    )
    dots.filter(d => d.iso3 === selectedCountry).raise()
    chart.append('text').attr('x', width / 2).attr('y', height + 48)
      .attr('text-anchor', 'middle').text('GDP per person (constant 2015 US$, log scale)')
    chart.append('text').attr('transform', 'rotate(-90)').attr('x', -height / 2)
      .attr('y', -40).attr('text-anchor', 'middle').text('Births per woman')
  }, [year, selectedCountry, onCountrySelect])

  useEffect(() => {
    const history = data.filter(d => d.iso3 === selectedCountry)
    const educationHistory = educationData.filter(d => d.iso3 === selectedCountry)
    for (const [ref, rows, key, label] of [
      [fertilityRef, history, 'fertility', 'Births per woman'],
      [gdpRef, history, 'gdp_pc', 'GDP per person (2015 US$, log scale)'],
      [mortalityRef, history, 'mortality', 'Under-five deaths per 1,000'],
      [educationRef, educationHistory, 'education', 'Female secondary enrollment (%)'],
    ]) {
      const svg = d3.select(ref.current).attr('viewBox', '0 0 300 150')
      svg.selectAll('*').remove()
      const chart = svg.append('g').attr('transform', 'translate(42,10)')
      const x = d3.scaleLinear().domain(key === 'education' ? [2001, 2023] : [1990, 2024]).range([0, 240])
      const y = key === 'gdp_pc'
        ? d3.scaleLog().domain([100, 300000]).range([105, 0])
        : d3.scaleLinear().domain([0, historyMax[key]]).range([105, 0])
      chart.append('g').attr('transform', 'translate(0,105)')
        .call(d3.axisBottom(x).tickValues(key === 'education'
          ? [2001, 2010, 2023] : [1990, 2000, 2010, 2024]).tickFormat(d3.format('d')))
      chart.append('g').call(d3.axisLeft(y).ticks(3).tickFormat(key === 'gdp_pc' ? d3.format('~s') : d3.format('~g')))
      if (rows.length) {
        chart.append('path').datum(rows).attr('fill', 'none').attr('stroke', measureColors[key])
          .attr('stroke-width', 2.5)
          .attr('d', d3.line().x(d => x(d.year)).y(d => y(d[key])))
        chart.selectAll('circle').data([rows[0], rows[rows.length - 1]]).join('circle')
          .attr('cx', d => x(d.year)).attr('cy', d => y(d[key]))
          .attr('r', 3.5).attr('fill', measureColors[key])
        const focus = chart.append('circle').attr('r', 5).attr('fill', measureColors[key]).style('display', 'none')
        const step = 240 / (key === 'education' ? 22 : 34)
        const hits = chart.selectAll('.trend-hit').data(rows).join('rect')
          .attr('class', 'trend-hit')
          .attr('x', d => x(d.year) - step / 2).attr('y', 0)
          .attr('width', step).attr('height', 105)
          .attr('pointer-events', 'all').attr('tabindex', 0)
          .attr('aria-label', d => `${d.year}: ${label} ${d[key].toFixed(2)}`)
        function highlight(d) {
          focus.attr('cx', x(d.year)).attr('cy', y(d[key])).style('display', null)
        }
        hits.on('mouseover.highlight', (event, d) => highlight(d))
          .on('focus.highlight', (event, d) => highlight(d))
          .on('mouseout.highlight', () => focus.style('display', 'none'))
          .on('blur.highlight', () => focus.style('display', 'none'))
        addTooltip(hits, ref.current, d => {
          const title = key === 'gdp_pc' ? 'GDP per person' : key === 'mortality'
            ? 'Under-five mortality' : key === 'education' ? 'Female secondary enrollment' : 'Fertility'
          const value = key === 'gdp_pc' ? `$${d3.format(',.0f')(d[key])}`
            : key === 'fertility' ? `${d[key].toFixed(2)} births per woman`
              : key === 'mortality' ? `${d[key].toFixed(1)} deaths per 1,000 live births`
                : `${d[key].toFixed(1)}%`
          return `${d.country}, ${d.year}\n${title}: ${value}`
        })
      }
      chart.append('text').attr('x', 0).attr('y', -1).text(label)
    }
  }, [selectedCountry])

  return (
    <section className="chart-card overview-card">
      <div className="overview-grid">
        <div>
          <h2>A &nbsp; Across economies</h2>
          <p>{year} · 182 economies · one dot per economy</p>
          <label>Year: {year} <input type="range" min="1990" max="2024" value={year}
            onChange={e => setYear(Number(e.target.value))} /></label>
          <svg ref={scatterRef} role="img" aria-label={`${year} fertility versus GDP per person across economies`} />
          <div className="chart-tooltip" aria-hidden="true" />
          <p className="chart-readout" aria-live="polite">Hover or focus a mark to see its exact values.</p>
        </div>
        <div>
          <h2>B &nbsp; Following {country?.country}</h2>
          <p>1990–2024 main sample · 35 annual observations</p>
          <p className="history-note">Each measure keeps the same axes when you choose another economy.</p>
          <div className="overview-history-grid">
            <div>
              <h3>Fertility</h3>
              <svg ref={fertilityRef} role="img" aria-label={`Fertility history for ${country?.country}`} />
              <div className="chart-tooltip" aria-hidden="true" />
              <p className="chart-readout" aria-live="polite">Hover or focus for exact values.</p>
            </div>
            <div>
              <h3>GDP per person</h3>
              <svg ref={gdpRef} role="img" aria-label={`GDP per person history for ${country?.country}`} />
              <div className="chart-tooltip" aria-hidden="true" />
              <p className="chart-readout" aria-live="polite">Hover or focus for exact values.</p>
            </div>
            <div>
              <h3>Under-five mortality</h3>
              <svg ref={mortalityRef} role="img" aria-label={`Under-five mortality history for ${country?.country}`} />
              <div className="chart-tooltip" aria-hidden="true" />
              <p className="chart-readout" aria-live="polite">Hover or focus for exact values.</p>
            </div>
            <div>
              <h3>Female secondary enrollment</h3>
              <svg ref={educationRef} role="img" aria-label={`Female secondary enrollment history for ${country?.country}`} />
              <div className="chart-tooltip" aria-hidden="true" />
              {educationCount > 0 && <p className="chart-readout" aria-live="polite">Hover or focus for exact values.</p>}
              <p className="history-note">Separate 2001–2023 sample{educationCount > 0 && ` · ${educationCount} observations`}. Gross enrollment can exceed 100%.</p>
            </div>
          </div>
        </div>
      </div>
      <p className="chart-source">Navy marks the selected economy. Select a dot to follow its history. Source: World Bank WDI.</p>
    </section>
  )
}
