import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import data from '../data/country_year.json'
import educationData from '../data/education_year.json'
import { addTooltip } from '../chartTooltip'
import { measureColors } from '../chartColors'

const start = data.filter(d => d.year === 1990)
const end = new Map(data.filter(d => d.year === 2024).map(d => [d.iso3, d]))
const changes = start.map(before => {
  const after = end.get(before.iso3)
  return {
    country: before.country,
    fertility: 100 * (after.fertility / before.fertility - 1),
    mortality: 100 * (after.mortality / before.mortality - 1),
    gdp: 100 * (after.gdp_pc / before.gdp_pc - 1),
  }
})

const educationEnd = new Map(educationData.filter(d => d.year === 2023).map(d => [d.iso3, d]))
const educationChanges = educationData.filter(d => d.year === 2001 && educationEnd.has(d.iso3))
  .map(before => {
    const after = educationEnd.get(before.iso3)
    return {
      country: before.country,
      fertility: 100 * (after.fertility / before.fertility - 1),
      education: after.education - before.education,
    }
  })

export default function CountryChangeChart({ initialIndicator = 'gdp', onExplore }) {
  const chartRef = useRef(null)
  const [indicator, setIndicator] = useState(initialIndicator)
  const [chartSize, setChartSize] = useState({ width: 700, height: 340 })
  const points = indicator === 'education' ? educationChanges : changes
  const period = indicator === 'education' ? '2001–2023' : '1990–2024'

  useEffect(() => {
    if (!chartRef.current.closest('.story-stage')) return
    const observer = new ResizeObserver(entries => {
      const width = Math.round(entries[0].contentRect.width)
      const height = Math.round(entries[0].contentRect.height)
      if (width > 120 && height > 120) {
        setChartSize(current => current.width === width && current.height === height ? current : { width, height })
      }
    })
    observer.observe(chartRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const margin = { top: 20, right: 25, bottom: 70, left: 65 }
    const width = chartSize.width - margin.left - margin.right
    const height = chartSize.height - margin.top - margin.bottom
    const svg = d3.select(chartRef.current).attr('viewBox', `0 0 ${chartSize.width} ${chartSize.height}`)
    svg.selectAll('*').remove()
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)
    const x = d3.scaleLinear().domain([Math.min(0, d3.min(points, d => d[indicator])), Math.max(0, d3.max(points, d => d[indicator]))]).nice().range([0, width])
    const y = d3.scaleLinear().domain([Math.min(0, d3.min(points, d => d.fertility)), Math.max(0, d3.max(points, d => d.fertility))]).nice().range([height, 0])
    const signed = value => value > 0 ? `+${d3.format(',.0f')(value)}` : d3.format(',.0f')(value)
    chart.append('rect')
      .attr('x', indicator === 'mortality' ? 0 : x(0)).attr('y', y(0))
      .attr('width', indicator === 'mortality' ? x(0) : width - x(0)).attr('height', height - y(0))
      .attr('fill', measureColors[indicator === 'gdp' ? 'gdp_pc' : indicator])
      .attr('opacity', 0.08).attr('pointer-events', 'none')
    chart.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''))
    chart.append('g').attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${signed(d)}${indicator === 'education' ? '' : '%'}`))
    chart.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d => `${signed(d)}%`))
    chart.append('line').attr('x1', 0).attr('x2', width).attr('y1', y(0)).attr('y2', y(0))
      .attr('stroke', '#8297a8').attr('stroke-dasharray', '4 4')
    chart.append('line').attr('x1', x(0)).attr('x2', x(0)).attr('y1', 0).attr('y2', height)
      .attr('stroke', '#8297a8').attr('stroke-dasharray', '4 4')
    const dots = chart.selectAll('circle').data(points).join('circle')
      .attr('cx', d => x(d[indicator])).attr('cy', d => y(d.fertility))
      .attr('r', 6).attr('fill', measureColors[indicator === 'gdp' ? 'gdp_pc' : indicator]).attr('opacity', 0.72)
      .attr('tabindex', 0)
      .attr('aria-label', d => `${d.country}: fertility change ${d.fertility.toFixed(1)} percent, ${indicator} change ${d[indicator].toFixed(1)} ${indicator === 'education' ? 'percentage points' : 'percent'}`)
    addTooltip(dots, chartRef.current, d =>
      `${d.country}\nFertility change: ${d3.format('+.1f')(d.fertility)}%\n` +
      (indicator === 'education'
        ? `Enrollment change: ${d3.format('+.1f')(d.education)} percentage points`
        : `${indicator === 'mortality' ? 'Mortality change' : 'GDP change'}: ${d3.format('+.1f')(d[indicator])}%`)
    )
    chart.append('text').attr('x', width / 2).attr('y', height + 50)
      .attr('text-anchor', 'middle').text(indicator === 'mortality'
        ? 'Under-five mortality change (%)'
        : indicator === 'education' ? 'Female secondary enrollment change (percentage points)' : 'GDP per person change (%)')
    chart.append('text').attr('transform', 'rotate(-90)')
      .attr('x', -height / 2).attr('y', -48)
      .attr('text-anchor', 'middle').text('Fertility change (%)')
  }, [indicator, points, chartSize])

  return (
    <section className="chart-card">
      <div className="chart-top">
      <p>Each dot compares one country at the start and end of {period}.</p>
      <p className="selection-note">Shaded area: {indicator === 'mortality' ? 'mortality and fertility both fell.' : indicator === 'gdp' ? 'income rose while fertility fell.' : 'enrollment rose while fertility fell.'}</p>
      <label>Compare fertility change with:{' '}
        <select value={indicator} onChange={e => {
          setIndicator(e.target.value)
          onExplore?.(e.target.options[e.target.selectedIndex].text)
        }}>
          <option value="gdp">GDP per person change (%)</option>
          <option value="mortality">Child mortality change (%)</option>
          <option value="education">Female enrollment change (percentage points)</option>
        </select>
      </label>
      </div>
      <svg ref={chartRef} role="img" aria-label={`${period} country changes: fertility and ${indicator}`} />
      <div className="chart-tooltip" aria-hidden="true" />
      <p className="chart-readout" aria-live="polite">Hover or focus a mark to see its exact values.</p>
      <p className="chart-source">{points.length} countries, {period}. Percent change = (end − start) / start × 100. {indicator === 'education' && 'Enrollment uses end − start in percentage points, with a separate sample available at both endpoints. '}These comparisons do not establish cause. Source: World Bank WDI.</p>
    </section>
  )
}
