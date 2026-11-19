import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import data from '../data/country_year.json'
import { addTooltip } from '../chartTooltip'

const countries = data.filter(d => d.year === 2024)
  .sort((a, b) => a.country.localeCompare(b.country))

export default function CountryHistoryChart({ selectedCountry, onCountrySelect }) {
  const chartRef = useRef(null)
  const country = countries.find(d => d.iso3 === selectedCountry)

  useEffect(() => {
    const history = data.filter(d => d.iso3 === selectedCountry)
    const margin = { top: 20, right: 25, bottom: 55, left: 65 }
    const width = 700 - margin.left - margin.right
    const height = 350 - margin.top - margin.bottom
    const svg = d3.select(chartRef.current).attr('viewBox', '0 0 700 350')
    svg.selectAll('*').remove()
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3.scaleLinear().domain([1990, 2024]).range([0, width])
    const y = d3.scaleLinear().domain([0, d3.max(history, d => d.fertility) * 1.1])
      .nice().range([height, 0])

    chart.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''))
    chart.append('g').attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickValues([1990, 2000, 2010, 2020, 2024]))
    chart.append('g').call(d3.axisLeft(y).ticks(5))
    chart.append('path').datum(history)
      .attr('fill', 'none').attr('stroke', '#1a7774').attr('stroke-width', 3)
      .attr('d', d3.line().x(d => x(d.year)).y(d => y(d.fertility)))

    chart.selectAll('circle').data(history).join('circle')
      .attr('cx', d => x(d.year)).attr('cy', d => y(d.fertility))
      .attr('r', 5).attr('fill', '#1a7774')
    const focus = chart.append('circle')
      .attr('r', 7).attr('fill', '#1a7774')
      .style('display', 'none')
    const step = width / (history.length - 1)
    const hits = chart.selectAll('.trend-hit').data(history).join('rect')
      .attr('class', 'trend-hit')
      .attr('x', d => x(d.year) - step / 2)
      .attr('y', 0).attr('width', step).attr('height', height)
      .attr('pointer-events', 'all')
      .attr('tabindex', 0)
      .attr('aria-label', d => `${d.year}: ${d.fertility.toFixed(2)} births per woman`)
    function highlight(d) {
      focus.attr('cx', x(d.year)).attr('cy', y(d.fertility)).style('display', null)
    }
    hits.on('mouseover.highlight', (event, d) => highlight(d))
      .on('focus.highlight', (event, d) => highlight(d))
      .on('mouseout.highlight', () => focus.style('display', 'none'))
      .on('blur.highlight', () => focus.style('display', 'none'))
    addTooltip(hits, chartRef.current, d =>
      `${d.country}, ${d.year}\nFertility: ${d.fertility.toFixed(2)} births per woman`
    )

    chart.append('text').attr('x', width / 2).attr('y', height + 44)
      .attr('text-anchor', 'middle').text('Year')
    chart.append('text').attr('transform', 'rotate(-90)')
      .attr('x', -height / 2).attr('y', -48)
      .attr('text-anchor', 'middle').text('Births per woman')
  }, [selectedCountry])

  return (
    <section className="chart-card">
      <h2>{country?.country} fertility history</h2>
      <label>Economy:{' '}
        <select value={selectedCountry} onChange={e => onCountrySelect(e.target.value)}>
          {countries.map(d => <option key={d.iso3} value={d.iso3}>{d.country}</option>)}
        </select>
      </label>
      <svg ref={chartRef} role="img" aria-label={`Fertility history for ${country?.country}, 1990 to 2024`} />
      <div className="chart-tooltip" aria-hidden="true" />
      <p className="chart-readout" aria-live="polite">Hover or focus a mark to see its exact values.</p>
      <p className="chart-source">1990–2024 main sample. Source: World Bank WDI.</p>
    </section>
  )
}
