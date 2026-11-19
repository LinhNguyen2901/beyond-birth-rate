import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import data from '../data/education_year.json'
import { addTooltip } from '../chartTooltip'

// Keep both axes fixed while the year changes.
const educationMax = d3.max(data, d => d.education)
const fertilityMax = d3.max(data, d => d.fertility)

export default function EducationChart() {
  const chartRef = useRef(null)
  const [year, setYear] = useState(2023)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setYear(current => current === 2023 ? 2001 : current + 1)
    }, 550)
    return () => window.clearInterval(timer)
  }, [playing])

  useEffect(() => {
    const points = data.filter(d => d.year === year)
    const margin = { top: 20, right: 25, bottom: 70, left: 65 }
    const width = 700 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom
    const svg = d3.select(chartRef.current).attr('viewBox', '0 0 700 400')
    svg.selectAll('*').remove()
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3.scaleLinear().domain([0, educationMax])
      .nice().range([0, width])
    const y = d3.scaleLinear().domain([0, fertilityMax])
      .nice().range([height, 0])

    chart.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''))
    chart.append('g').attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(6))
    chart.append('g').call(d3.axisLeft(y).ticks(5))

    const dots = chart.selectAll('circle').data(points).join('circle')
      .attr('cx', d => x(d.education)).attr('cy', d => y(d.fertility))
      .attr('r', 6).attr('fill', '#a4659b').attr('opacity', 0.75)
      .attr('tabindex', 0)
      .attr('aria-label', d => `${d.country}: education ${d.education.toFixed(1)} percent, fertility ${d.fertility.toFixed(2)}`)
    addTooltip(dots, chartRef.current, d =>
      `${d.country} (${d.region.trim()})\n` +
      `Female secondary enrollment: ${d.education.toFixed(1)}%\n` +
      `Fertility: ${d.fertility.toFixed(2)} births per woman`
    )

    chart.append('text').attr('x', width / 2).attr('y', height + 50)
      .attr('text-anchor', 'middle').text('Female secondary gross enrollment (%)')
    chart.append('text').attr('transform', 'rotate(-90)')
      .attr('x', -height / 2).attr('y', -48)
      .attr('text-anchor', 'middle').text('Births per woman')
  }, [year])

  return (
    <section className="chart-card">
      <h2>Education and fertility</h2>
      <p>This is a separate 2001–2023 sample with complete data for all four indicators. The axes stay fixed as you change years.</p>
      <label>Year: {year}{' '}
        <span className="range-end">2001</span>
        <input type="range" min="2001" max="2023" value={year}
          onChange={e => { setPlaying(false); setYear(Number(e.target.value)) }} />
        <span className="range-end">2023</span>
      </label>
      <button type="button" onClick={() => setPlaying(value => !value)}>
        {playing ? 'Pause years' : 'Play years'}
      </button>
      <button type="button" className="secondary-button" onClick={() => {
        setPlaying(false)
        setYear(2023)
      }}>Reset view</button>
      <svg ref={chartRef} role="img" aria-label={`Education and fertility in ${year}`} />
      <div className="chart-tooltip" aria-hidden="true" />
      <p className="chart-readout" aria-live="polite">Hover or focus a mark to see its exact values.</p>
      <p className="chart-source">{data.filter(d => d.year === year).length} economies in {year}. Gross enrollment can exceed 100%. Source: World Bank WDI.</p>
    </section>
  )
}
