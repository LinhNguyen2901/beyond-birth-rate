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

const incomeLimit = 500
const incomeOutliers = changes.filter(d => d.gdp > incomeLimit)

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

export default function CountryChangeChart({ initialIndicator: indicator = 'gdp' }) {
  const chartRef = useRef(null)
  const [showAllIncome, setShowAllIncome] = useState(false)
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
    const focusIncome = indicator === 'gdp' && !showAllIncome
    const visiblePoints = focusIncome ? points.filter(d => d.gdp <= incomeLimit) : points
    const x = d3.scaleLinear().domain(focusIncome
      ? [-100, incomeLimit]
      : [Math.min(0, d3.min(points, d => d[indicator])), Math.max(0, d3.max(points, d => d[indicator]))])
      .nice().range([0, width])
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
    const dots = chart.selectAll('circle').data(visiblePoints).join('circle')
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
  }, [indicator, points, chartSize, showAllIncome])

  return (
    <section className="chart-card">
      <div className="chart-top">
      <p className="selection-note">Shaded area: {indicator === 'mortality' ? 'mortality and fertility both fell.' : indicator === 'gdp' ? 'income rose while fertility fell.' : 'enrollment rose while fertility fell.'}</p>
      {indicator === 'gdp' && <div className="change-range">
        <div role="group" aria-label="Income change range">
          <button type="button" aria-pressed={!showAllIncome} onClick={() => {
            setShowAllIncome(false)
          }}>Main cluster</button>
          <button type="button" aria-pressed={showAllIncome} onClick={() => {
            setShowAllIncome(true)
          }}>All countries</button>
        </div>
        <p role="status">{showAllIncome
          ? `All ${points.length} countries shown.`
          : `${points.length - incomeOutliers.length} of ${points.length} shown · ${incomeOutliers.length} countries above +${incomeLimit}% are outside this view.`}</p>
      </div>}
      </div>
      <svg ref={chartRef} role="img" aria-label={`${period} country changes: fertility and ${indicator}${indicator === 'gdp' && !showAllIncome ? ', income range minus 100 to plus 500 percent' : ', all countries'}`} />
      <div className="chart-tooltip" aria-hidden="true" />
      <p className="chart-readout" aria-live="polite">Hover or focus a mark to see its exact values.</p>
      <p className="chart-source">{points.length} countries. Percent changes are relative to starting values.</p>
    </section>
  )
}
