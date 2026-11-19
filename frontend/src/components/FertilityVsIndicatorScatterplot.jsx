import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import data from '../data/country_year.json'
import { addTooltip } from '../chartTooltip'

// Use all years for the axis ranges so points stay comparable as the year changes.
const gdpRange = d3.extent(data, d => d.gdp_pc)
const mortalityMax = d3.max(data, d => d.mortality)
const fertilityMax = d3.max(data, d => d.fertility)

export default function FertilityVsIndicatorScatterplot({ selectedCountry, onCountrySelect }) {
  const chartRef = useRef(null)
  const [year, setYear] = useState(2024)
  const [indicator, setIndicator] = useState('gdp_pc')
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setYear(current => current === 2024 ? 1990 : current + 1)
    }, 550)
    return () => window.clearInterval(timer)
  }, [playing])

  useEffect(() => {
    const points = data.filter(d => d.year === year)
    const margin = { top: 20, right: 25, bottom: 65, left: 60 }
    const width = 700 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    const svg = d3.select(chartRef.current)
      .attr('viewBox', '0 0 700 400')

    svg.selectAll('*').remove()

    const chart = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const xScale = indicator === 'gdp_pc'
      ? d3.scaleLog()
          .domain(gdpRange)
          .range([0, width])
      : d3.scaleLinear()
          .domain([0, mortalityMax])
          .nice()
          .range([0, width])

    const yScale = d3.scaleLinear()
      .domain([0, fertilityMax])
      .nice()
      .range([height, 0])

    chart.append('g').attr('class', 'grid')
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(''))
    chart.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale).ticks(5, '~s'))

    chart.append('g')
      .call(d3.axisLeft(yScale).ticks(5))

    const dots = chart.selectAll('circle')
      .data(points)
      .join('circle')
      .attr('cx', d => xScale(d[indicator]))
      .attr('cy', d => yScale(d.fertility))
      .attr('r', d => d.iso3 === selectedCountry ? 8 : 6)
      .attr('fill', d => d.iso3 === selectedCountry ? '#d66a4f' : '#1a7774')
      .attr('opacity', 0.75)
      .attr('tabindex', 0)
      .attr('aria-label', d => `${d.country}: ${d.fertility.toFixed(2)} births per woman`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => onCountrySelect(d.iso3))
      .on('keydown', (event, d) => {
        if (event.key === 'Enter') onCountrySelect(d.iso3)
      })
    addTooltip(dots, chartRef.current, d =>
      `${d.country} (${d.region.trim()})
Fertility: ${d.fertility.toFixed(2)} births per woman
GDP per person: $${d3.format(',.0f')(d.gdp_pc)}
Under-five mortality: ${d.mortality.toFixed(1)} per 1,000`
    )
    dots.filter(d => d.iso3 === selectedCountry).raise()

    chart.append('text')
      .attr('x', width / 2)
      .attr('y', height + 50)
      .attr('text-anchor', 'middle')
      .text(indicator === 'gdp_pc'
        ? 'GDP per person (constant 2015 US$, log scale)'
        : 'Under-five deaths per 1,000 live births')

    chart.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .text('Births per woman')
  }, [year, indicator, selectedCountry, onCountrySelect])

  return (
    <section className="chart-card">
      <h2>How do economies compare?</h2>
      <p>Each dot is one economy in the selected year. The axes stay fixed as you change years. Select a dot to see its fertility history.</p>

      <label>
        Year: {year}{' '}
        <span className="range-end">1990</span>
        <input type="range" min="1990" max="2024" value={year}
          onChange={e => { setPlaying(false); setYear(Number(e.target.value)) }} />
        <span className="range-end">2024</span>
      </label>

      <label>
        Compare with:{' '}
        <select value={indicator} onChange={e => setIndicator(e.target.value)}>
          <option value="gdp_pc">GDP per person</option>
          <option value="mortality">Child mortality</option>
        </select>
      </label>

      <button type="button" onClick={() => setPlaying(value => !value)}>
        {playing ? 'Pause years' : 'Play years'}
      </button>
      <button type="button" className="secondary-button" onClick={() => {
        setPlaying(false)
        setYear(2024)
        setIndicator('gdp_pc')
      }}>Reset view</button>

      <svg ref={chartRef} role="img"
        aria-label={`Scatterplot of fertility and ${indicator} in ${year}`} />
      <div className="chart-tooltip" aria-hidden="true" />
      <p className="chart-readout" aria-live="polite">Hover or focus a mark to see its exact values.</p>
      <p className="selection-note">Selected: <strong>{data.find(d => d.iso3 === selectedCountry)?.country}</strong></p>
      <p className="chart-source">
        182 economies in each year. Source: World Bank WDI.
      </p>
    </section>
  )
}
