import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import data from '../data/country_year.json'
import { addTooltip } from '../chartTooltip'

const colors = d3.scaleOrdinal(d3.schemeTableau10)

export default function OverviewChart({ selectedCountry, onCountrySelect }) {
  const [year, setYear] = useState(2024)
  const scatterRef = useRef(null)
  const fertilityRef = useRef(null)
  const gdpRef = useRef(null)
  const country = data.find(d => d.iso3 === selectedCountry)

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
      .attr('fill', d => colors(d.region)).attr('opacity', 0.8)
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
    for (const [ref, key, label] of [
      [fertilityRef, 'fertility', 'Births per woman'],
      [gdpRef, 'gdp_pc', 'GDP per person (constant 2015 US$)'],
    ]) {
      const svg = d3.select(ref.current).attr('viewBox', '0 0 300 150')
      svg.selectAll('*').remove()
      const chart = svg.append('g').attr('transform', 'translate(42,10)')
      const x = d3.scaleLinear().domain([1990, 2024]).range([0, 240])
      const y = d3.scaleLinear().domain([0, d3.max(history, d => d[key]) * 1.1])
        .nice().range([105, 0])
      chart.append('g').attr('transform', 'translate(0,105)')
        .call(d3.axisBottom(x).tickValues([1990, 2000, 2010, 2024]).tickFormat(d3.format('d')))
      chart.append('g').call(d3.axisLeft(y).ticks(3).tickFormat(key === 'gdp_pc' ? d3.format('~s') : d3.format('~g')))
      chart.append('path').datum(history).attr('fill', 'none').attr('stroke', '#e69500')
        .attr('stroke-width', 2.5)
        .attr('d', d3.line().x(d => x(d.year)).y(d => y(d[key])))
      chart.selectAll('circle').data([history[0], history[history.length - 1]]).join('circle')
        .attr('cx', d => x(d.year)).attr('cy', d => y(d[key]))
        .attr('r', 3.5).attr('fill', '#e69500')
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
          <p>1990–2024 · 35 annual observations</p>
          <h3>Fertility</h3>
          <svg ref={fertilityRef} role="img" aria-label={`Fertility history for ${country?.country}`} />
          <h3>GDP per person</h3>
          <svg ref={gdpRef} role="img" aria-label={`GDP per person history for ${country?.country}`} />
        </div>
      </div>
      <p className="chart-source">Dot colors show World Bank regions. Select a dot to follow that economy. Source: World Bank WDI.</p>
    </section>
  )
}
