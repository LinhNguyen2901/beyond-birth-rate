import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import data from '../data/country_year.json'
import { addTooltip } from '../chartTooltip'

const start = data.filter(d => d.year === 1990)
const end = new Map(data.filter(d => d.year === 2024).map(d => [d.iso3, d]))
const changes = start.map(before => {
  const after = end.get(before.iso3)
  return {
    country: before.country,
    fertility: before.fertility - after.fertility,
    mortality: before.mortality - after.mortality,
    gdp: 100 * (after.gdp_pc / before.gdp_pc - 1),
  }
})

export default function CountryChangeChart({ initialIndicator = 'mortality' }) {
  const chartRef = useRef(null)
  const [indicator, setIndicator] = useState(initialIndicator)

  useEffect(() => {
    const margin = { top: 20, right: 25, bottom: 70, left: 65 }
    const width = 700 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom
    const svg = d3.select(chartRef.current).attr('viewBox', '0 0 700 400')
    svg.selectAll('*').remove()
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3.scaleLinear().domain(d3.extent(changes, d => d[indicator]))
      .nice().range([0, width])
    const y = d3.scaleLinear().domain(d3.extent(changes, d => d.fertility))
      .nice().range([height, 0])

    chart.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''))
    chart.append('g').attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(6))
    chart.append('g').call(d3.axisLeft(y).ticks(5))

    const dots = chart.selectAll('circle').data(changes).join('circle')
      .attr('cx', d => x(d[indicator])).attr('cy', d => y(d.fertility))
      .attr('r', 6).attr('fill', '#6878b7').attr('opacity', 0.72)
      .attr('tabindex', 0)
      .attr('aria-label', d => `${d.country}: fertility reduction ${d.fertility.toFixed(2)}, ${indicator} change ${d[indicator].toFixed(1)}`)
    addTooltip(dots, chartRef.current, d =>
      `${d.country}\nFertility reduction: ${d.fertility.toFixed(2)} births per woman\n` +
      `${indicator === 'mortality' ? 'Mortality reduction' : 'GDP growth'}: ${d[indicator].toFixed(1)}${indicator === 'gdp' ? '%' : ' deaths per 1,000'}`
    )

    chart.append('text').attr('x', width / 2).attr('y', height + 50)
      .attr('text-anchor', 'middle').text(indicator === 'mortality'
        ? 'Under-five mortality reduction (per 1,000 live births)'
        : 'GDP per person growth (%)')
    chart.append('text').attr('transform', 'rotate(-90)')
      .attr('x', -height / 2).attr('y', -48)
      .attr('text-anchor', 'middle').text('Fertility reduction (births per woman)')
  }, [indicator])

  return (
    <section className="chart-card">
      <h2>Did economies change together?</h2>
      <p>Each dot compares the same economy in 1990 and 2024.</p>
      <label>Compare fertility reduction with:{' '}
        <select value={indicator} onChange={e => setIndicator(e.target.value)}>
          <option value="mortality">Child mortality reduction</option>
          <option value="gdp">GDP per person growth</option>
        </select>
      </label>
      <svg ref={chartRef} role="img" aria-label={`1990 to 2024 economy changes: fertility and ${indicator}`} />
      <div className="chart-tooltip" aria-hidden="true" />
      <p className="chart-readout" aria-live="polite">Hover or focus a mark to see its exact values.</p>
      <p className="chart-source">182 economies, 1990–2024. Endpoint changes are different from the single-year comparison above. Source: World Bank WDI.</p>
    </section>
  )
}
