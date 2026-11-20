import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import data from '../data/country_year.json'
import educationData from '../data/education_year.json'
import { addTooltip } from '../chartTooltip'
import { measureColors } from '../chartColors'

// Use all years for the axis ranges so points stay comparable as the year changes.
const gdpRange = d3.extent(data, d => d.gdp_pc)
// The highest value is 332.4; leave room around it without stretching to 500.
const mortalityMax = 400
const fertilityMax = d3.max(data, d => d.fertility)
const educationMax = d3.max(educationData, d => d.education)
const historyCountries = new Set(data.map(d => d.iso3))

const measureNames = { gdp_pc: 'GDP per person', mortality: 'child mortality', education: 'female secondary enrollment' }

export default function FertilityVsIndicatorScatterplot({ selectedCountry, onCountrySelect, initialYear = 2024, initialIndicator = 'gdp_pc', onExplore }) {
  const chartRef = useRef(null)
  const [year, setYear] = useState(initialYear)
  const [indicator, setIndicator] = useState(initialIndicator)
  const [playing, setPlaying] = useState(false)
  const isEducation = indicator === 'education'
  const firstYear = isEducation ? 2001 : 1990
  const lastYear = isEducation ? 2023 : 2024
  const points = (isEducation ? educationData : data).filter(d => d.year === year)

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setYear(current => current === lastYear ? firstYear : current + 1)
    }, 550)
    return () => window.clearInterval(timer)
  }, [playing, firstYear, lastYear])

  useEffect(() => {
    const points = (indicator === 'education' ? educationData : data).filter(d => d.year === year)
    const margin = { top: 20, right: 25, bottom: 65, left: 60 }
    const width = 700 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    const svg = d3.select(chartRef.current)
      .attr('viewBox', '0 0 700 400')

    svg.selectAll('*').remove()

    const chart = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const xScale = indicator === 'gdp_pc'
      ? d3.scaleLog().domain(gdpRange).range([0, width])
      : d3.scaleLinear()
          .domain([0, indicator === 'education' ? educationMax : mortalityMax])
          .nice().range([0, width])

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
      .attr('fill', d => d.iso3 === selectedCountry ? '#17324a' : measureColors[indicator])
      .attr('opacity', 0.75)
      .attr('tabindex', 0)
      .attr('aria-label', d => `${d.country}: ${d.fertility.toFixed(2)} births per woman${historyCountries.has(d.iso3) ? '' : '; history unavailable'}`)
      .style('cursor', d => historyCountries.has(d.iso3) ? 'pointer' : 'default')
      .on('click', (event, d) => { if (historyCountries.has(d.iso3)) onCountrySelect(d.iso3) })
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' && historyCountries.has(d.iso3)) onCountrySelect(d.iso3)
      })
    addTooltip(dots, chartRef.current, d => indicator === 'education'
      ? `${d.country} (${d.region.trim()})
Fertility: ${d.fertility.toFixed(2)} births per woman
Female secondary enrollment: ${d.education.toFixed(1)}%${historyCountries.has(d.iso3) ? '' : '\nCountry history unavailable in the main sample'}`
      : `${d.country} (${d.region.trim()})
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
        : indicator === 'education'
          ? 'Female secondary gross enrollment (%)'
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
      <p>Each dot is one economy in the selected year. The axes stay fixed as you change years. Select a dot from the main sample to follow its history.</p>

      <label>
        Year: {year}{' '}
        <span className="range-end">{firstYear}</span>
        <input type="range" min={firstYear} max={lastYear} value={year}
          onChange={e => { setPlaying(false); setYear(Number(e.target.value)); onExplore?.(measureNames[indicator]) }} />
        <span className="range-end">{lastYear}</span>
      </label>

      <label>
        Compare with:{' '}
        <select value={indicator} onChange={e => {
          const next = e.target.value
          onExplore?.(measureNames[next])
          setPlaying(false)
          if (next === 'education') setYear(current => Math.max(2001, Math.min(2023, current)))
          setIndicator(next)
        }}>
          <option value="gdp_pc">GDP per person</option>
          <option value="mortality">Child mortality</option>
          <option value="education">Female secondary enrollment</option>
        </select>
      </label>
      {isEducation && <p className="coverage-note">{points.length} economies in {year} · separate education sample, 2001–2023</p>}

      <button type="button" onClick={() => { onExplore?.(measureNames[indicator]); setPlaying(value => !value) }}>
        {playing ? 'Pause years' : 'Play years'}
      </button>
      <button type="button" className="secondary-button" onClick={() => {
        onExplore?.(measureNames.gdp_pc)
        setPlaying(false)
        setYear(2024)
        setIndicator('gdp_pc')
      }}>Reset view</button>

      <svg ref={chartRef} role="img"
        aria-label={`Scatterplot of fertility and ${indicator} in ${year}`} />
      <div className="chart-tooltip" aria-hidden="true" />
      <p className="chart-readout" aria-live="polite">Hover or focus a mark to see its exact values.</p>
      <p className="selection-note">Selected: <strong>{data.find(d => d.iso3 === selectedCountry)?.country}</strong>{!points.some(d => d.iso3 === selectedCountry) && ' (not in this year’s sample)'}</p>
      <p className="chart-source">
        {isEducation
          ? `${points.length} economies in ${year}. Separate 2001–2023 available-data sample; gross enrollment can exceed 100%. Source: World Bank WDI.`
          : '182 economies in each year, 1990–2024. Source: World Bank WDI.'}
      </p>
    </section>
  )
}
