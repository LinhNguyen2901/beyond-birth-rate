import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import data from '../data/country_year.json'
import educationData from '../data/education_year.json'
import { addTooltip } from '../chartTooltip'
import { measureColors, selectionColor } from '../chartColors'

const colors = [selectionColor, measureColors.fertility, '#438f8c', '#145653', '#619e9b', '#306b68']
const dashes = [null, null, '9 4', '3 4', '12 4 3 4', '2 3']
const education2001 = new Map(educationData.filter(d => d.year === 2001).map(d => [d.iso3, d.education]))
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
      history: data.filter(d => d.iso3 === start.iso3 && d.year >= 2001 && d.year <= 2023),
    }))
  }, [selectedCountry])

  useEffect(() => {
    const margin = { top: 20, right: 25, bottom: 55, left: 65 }
    const width = 700 - margin.left - margin.right
    const height = 380 - margin.top - margin.bottom
    const svg = d3.select(chartRef.current).attr('viewBox', '0 0 700 380')
    svg.selectAll('*').remove()
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3.scaleLinear().domain([2001, 2023]).range([0, width])
    const y = d3.scaleLinear().domain([0, 8]).range([height, 0])
    const line = d3.line().x(d => x(d.year)).y(d => y(d.fertility))

    chart.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(4).tickSize(-width).tickFormat(''))
    chart.append('g').attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickValues([2001, 2005, 2010, 2015, 2020, 2023]))
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
  }, [countries, selectedCountry])

  return (
    <section className="chart-card">
      <h2>Compare fertility paths</h2>
      <p>Choose one economy. Up to five economies from the same region with the closest measured starting conditions in 2001 appear automatically.</p>
      <div className="peer-controls">
        <label style={{ borderLeftColor: colors[0] }}>Choose an economy
          <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}>
            {choices.map(d => <option key={d.iso3} value={d.iso3}>{d.country}</option>)}
          </select>
        </label>
      </div>
      <div className="peer-legend">
        {countries.map((d, index) => <span key={d.iso3}><i style={{ borderColor: d.color, borderTopStyle: d.dash ? 'dashed' : 'solid' }} />{d.start.country}{index === 0 && ' (chosen)'}</span>)}
      </div>
      <svg ref={chartRef} role="img" aria-label={`Fertility histories for ${countries[0].start.country} and ${countries.length - 1} nearby peers, 2001 to 2023`} />
      <div className="chart-tooltip" aria-hidden="true" />
      <p className="chart-readout" aria-live="polite">Hover or focus a line to see its endpoint values.</p>
      <div className="table-wrap">
        <table>
          <caption>Measured starting conditions in 2001</caption>
          <thead><tr><th>Economy</th><th>GDP/person ($)</th><th>Under-five deaths/1,000</th><th>Female enrollment (%)</th><th>Fertility</th></tr></thead>
          <tbody>{countries.map((d, index) => <tr key={d.iso3}>
            <th><span className="legend-swatch" style={{ background: d.color }} />{d.start.country}{index === 0 && ' (chosen)'}</th>
            <td>{Math.round(d.start.gdp_pc).toLocaleString()}</td><td>{d.start.mortality.toFixed(1)}</td>
            <td>{d.start.education.toFixed(1)}</td><td>{d.start.fertility.toFixed(2)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="chart-source">Peers share the chosen economy's World Bank region and are closest on 2001 log GDP per person, under-five mortality, and female secondary enrollment after scaling each measure. Choices: 124 economies with all three measures in 2001. Fertility paths: 2001–2023 main sample. Similar measured values do not imply identical circumstances. Source: World Bank WDI.</p>
    </section>
  )
}
