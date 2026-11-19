import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import data from '../data/country_year.json'
import { addTooltip } from '../chartTooltip'

const countries = d3.groups(data, d => d.iso3)
  .map(([iso3, history]) => ({
    iso3,
    name: history[0].country,
    history: history.sort((a, b) => a.year - b.year),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

const median = d3.rollups(data, rows => d3.median(rows, d => d.fertility), d => d.year)
  .map(([year, fertility]) => ({ year, fertility }))
  .sort((a, b) => a.year - b.year)

export default function AllCountryFertilityChart({ selectedCountry, onCountrySelect }) {
  const chartRef = useRef(null)
  const selected = countries.find(d => d.iso3 === selectedCountry)
  const first = selected.history[0]
  const last = selected.history[selected.history.length - 1]

  useEffect(() => {
    const margin = { top: 20, right: 25, bottom: 55, left: 55 }
    const width = 760 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom
    const svg = d3.select(chartRef.current).attr('viewBox', '0 0 760 400')
    svg.selectAll('*').remove()
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3.scaleLinear().domain([1990, 2024]).range([0, width])
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.fertility)])
      .nice().range([height, 0])
    const line = d3.line().x(d => x(d.year)).y(d => y(d.fertility))

    chart.append('rect').attr('width', width).attr('height', height)
      .attr('fill', '#fbfcfd').attr('pointer-events', 'none')
    chart.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''))
    chart.append('g').attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickValues([1990, 2000, 2010, 2020, 2024]).tickFormat(d3.format('d')))
    chart.append('g').call(d3.axisLeft(y).ticks(5))

    const lines = chart.selectAll('.country-line').data(countries).join('path')
      .attr('class', 'country-line')
      .attr('d', d => line(d.history))
      .attr('fill', 'none').attr('stroke', '#7896a3')
      .attr('stroke-width', 1).attr('opacity', 0.04)

    chart.append('path').datum(median)
      .attr('d', line).attr('fill', 'none')
      .attr('stroke', '#fff').attr('stroke-width', 6)
    const medianLine = chart.append('path').datum(median)
      .attr('class', 'median-line').attr('d', line).attr('fill', 'none')
      .attr('stroke', '#1a7774').attr('stroke-width', 3)

    chart.append('path').datum(selected.history)
      .attr('d', line).attr('fill', 'none')
      .attr('stroke', '#fff').attr('stroke-width', 6)
    chart.append('path').datum(selected.history)
      .attr('d', line).attr('fill', 'none')
      .attr('stroke', '#17324a').attr('stroke-width', 3)
    chart.selectAll('.selected-end').data([first, last]).join('circle')
      .attr('class', 'selected-end')
      .attr('cx', d => x(d.year)).attr('cy', d => y(d.fertility))
      .attr('r', 4.5).attr('fill', '#17324a')

    const hitLines = chart.selectAll('.country-hit').data([
      ...countries, { iso3: 'median', name: 'Median', history: median },
    ]).join('path')
      .attr('class', 'country-hit')
      .attr('d', d => line(d.history))
      .attr('fill', 'none').attr('stroke', 'transparent')
      .attr('stroke-width', d => d.iso3 === selectedCountry || d.iso3 === 'median' ? 10 : 5)
      .attr('pointer-events', 'stroke')
      .attr('tabindex', 0)
      .attr('aria-label', d => `${d.name} fertility history, 1990 to 2024`)
    function highlight(d) {
      chart.classed('has-hover', d.iso3 !== '')
      lines.classed('is-active', row => row.iso3 === d.iso3)
      medianLine.classed('is-active', d.iso3 === 'median')
    }
    hitLines.on('mouseover.highlight', (event, d) => highlight(d))
      .on('focus.highlight', (event, d) => highlight(d))
      .on('mouseout.highlight', () => highlight({ iso3: '' }))
      .on('blur.highlight', () => highlight({ iso3: '' }))
    // The SVG's scroll wrapper is between it and the chart card.
    addTooltip(hitLines, chartRef.current.parentNode, d =>
      `${d.name}\n1990: ${d.history[0].fertility.toFixed(2)} births per woman\n` +
      `2024: ${d.history[d.history.length - 1].fertility.toFixed(2)} births per woman`
    )

    chart.append('text').attr('x', width / 2).attr('y', height + 44)
      .attr('text-anchor', 'middle').text('Year')
    chart.append('text').attr('transform', 'rotate(-90)')
      .attr('x', -height / 2).attr('y', -39)
      .attr('text-anchor', 'middle').text('Births per woman')
  }, [selectedCountry, selected, first, last])

  return (
    <section className="chart-card all-country-card">
      <div className="all-country-header">
        <div>
          <h2>182 paths, one broad shift</h2>
          <p>Fertility fell across many economies, but their paths differ. Hover a line to explore it.</p>
        </div>
        <label>Highlight economy
          <select value={selectedCountry} onChange={e => onCountrySelect(e.target.value)}>
            {countries.map(d => <option key={d.iso3} value={d.iso3}>{d.name}</option>)}
          </select>
        </label>
      </div>
      <div className="all-country-summary">
        <div className="summary-country"><span>Selected economy</span><strong>{selected.name}</strong></div>
        <div><span>1990</span><strong>{first.fertility.toFixed(2)}</strong></div>
        <div><span>2024</span><strong>{last.fertility.toFixed(2)}</strong></div>
        <small>Births per woman</small>
      </div>
      <div className="opening-legend" aria-hidden="true">
        <span><i className="country-swatch" />Economies</span>
        <span><i className="median-swatch" />Median</span>
        <span><i className="selected-swatch" />Selected economy</span>
      </div>
      <div className="all-country-chart-scroll">
        <svg ref={chartRef} role="img" aria-label={`Fertility paths for 182 economies from 1990 to 2024. Median and ${selected.name} are highlighted.`} />
      </div>
      <div className="chart-tooltip" aria-hidden="true" />
      <p className="chart-readout" aria-live="polite">Hover or focus a line to see its endpoint values.</p>
      <p className="chart-source">182 economies, 1990–2024. The median gives each economy equal weight. Source: World Bank WDI.</p>
    </section>
  )
}
