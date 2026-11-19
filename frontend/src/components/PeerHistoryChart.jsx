import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import data from '../data/peer_history.json'
import { addTooltip } from '../chartTooltip'

const starts = data.filter(d => d.year === 2001)
const colors = d3.scaleOrdinal()
  .domain(['CAF', 'BFA', 'RWA', 'GIN', 'MOZ', 'TCD'])
  .range(['#b54132', '#345f9d', '#367a5b', '#8a5c9e', '#b57b30', '#586674'])

export default function PeerHistoryChart() {
  const chartRef = useRef(null)

  useEffect(() => {
    const margin = { top: 20, right: 25, bottom: 55, left: 65 }
    const width = 700 - margin.left - margin.right
    const height = 380 - margin.top - margin.bottom
    const svg = d3.select(chartRef.current).attr('viewBox', '0 0 700 380')
    svg.selectAll('*').remove()
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3.scaleLinear().domain([2001, 2023]).range([0, width])
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.fertility) * 1.1])
      .nice().range([height, 0])
    const line = d3.line().x(d => x(d.year)).y(d => y(d.fertility))

    chart.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''))
    chart.append('g').attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickValues([2001, 2005, 2010, 2015, 2020, 2023]))
    chart.append('g').call(d3.axisLeft(y).ticks(5))

    const groups = d3.groups(data, d => d.iso3)
    const lines = chart.selectAll('.peer-line').data(groups)
      .join('path').attr('class', 'peer-line')
      .attr('fill', 'none').attr('stroke', d => colors(d[0]))
      .attr('stroke-width', d => d[0] === 'CAF' ? 4 : 3)
      .attr('d', d => line(d[1]))
    const hitLines = chart.selectAll('.peer-hit').data(groups)
      .join('path').attr('class', 'peer-hit')
      .attr('fill', 'none').attr('stroke', 'transparent')
      .attr('stroke-width', 14).attr('pointer-events', 'stroke')
      .attr('d', d => line(d[1]))
      .attr('tabindex', 0)
      .attr('aria-label', d => `${d[1][0].country} fertility history, 2001 to 2023`)
    hitLines.on('mouseover.highlight', (event, d) => lines.filter(row => row[0] === d[0]).classed('is-active', true))
      .on('focus.highlight', (event, d) => lines.filter(row => row[0] === d[0]).classed('is-active', true))
      .on('mouseout.highlight', () => lines.classed('is-active', false))
      .on('blur.highlight', () => lines.classed('is-active', false))
    addTooltip(hitLines, chartRef.current, d =>
      `${d[1][0].country}\n2001: ${d[1][0].fertility.toFixed(2)} births per woman\n` +
      `2023: ${d[1][d[1].length - 1].fertility.toFixed(2)} births per woman`
    )

    chart.append('text').attr('x', width / 2).attr('y', height + 44)
      .attr('text-anchor', 'middle').text('Year')
    chart.append('text').attr('transform', 'rotate(-90)')
      .attr('x', -height / 2).attr('y', -48)
      .attr('text-anchor', 'middle').text('Births per woman')
  }, [])

  return (
    <section className="chart-card">
      <h2>Similar starting conditions, different paths</h2>
      <p>Central African Republic and five same-region peers closest on 2001 log GDP per person, child mortality, and female secondary enrollment.</p>
      <svg ref={chartRef} role="img" aria-label="Fertility histories for Central African Republic and five peers, 2001 to 2023" />
      <div className="chart-tooltip" aria-hidden="true" />
      <p className="chart-readout" aria-live="polite">Hover or focus a mark to see its exact values.</p>
      <div className="table-wrap">
        <table>
          <caption>Measured starting conditions in 2001</caption>
          <thead><tr><th>Economy</th><th>GDP/person ($)</th><th>Under-five deaths/1,000</th><th>Female enrollment (%)</th><th>Fertility</th></tr></thead>
          <tbody>{starts.map(d => <tr key={d.iso3}>
            <th><span className="legend-swatch" style={{ background: colors(d.iso3) }} />{d.country}</th>
            <td>{Math.round(d.gdp_pc)}</td><td>{d.mortality.toFixed(1)}</td>
            <td>{d.education.toFixed(1)}</td><td>{d.fertility.toFixed(2)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="chart-source">2001–2023 peer example. Similarity is based only on three measured indicators; it does not imply identical circumstances. Source: World Bank WDI.</p>
    </section>
  )
}
