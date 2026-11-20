import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import data from '../data/core_trends.json'
import educationData from '../data/education_year.json'
import { addTooltip } from '../chartTooltip'
import { measureColors } from '../chartColors'

const educationTrend = d3.rollups(educationData, rows => d3.median(rows, d => d.education), d => d.year)
  .map(([year, education]) => ({ year, education }))
  .sort((a, b) => a.year - b.year)

const measures = [
  { key: 'fertility', title: 'Fertility', unit: 'Births per woman', color: measureColors.fertility },
  { key: 'gdp_pc', title: 'GDP per person', unit: 'Constant 2015 US$', color: measureColors.gdp_pc },
  { key: 'mortality', title: 'Under-five mortality', unit: 'Deaths per 1,000 live births', color: measureColors.mortality },
  { key: 'education', title: 'Female secondary enrollment', unit: 'Gross enrollment (%)', color: measureColors.education },
]

function TrendChart({ measure }) {
  const chartRef = useRef(null)
  const [size, setSize] = useState({ width: 520, height: 180 })
  const chartData = measure.key === 'education' ? educationTrend : data
  const firstYear = chartData[0].year
  const lastYear = chartData[chartData.length - 1].year

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(chartRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const margin = { top: 12, right: 20, bottom: 30, left: 48 }
    const width = size.width - margin.left - margin.right
    const height = size.height - margin.top - margin.bottom
    const svg = d3.select(chartRef.current).attr('viewBox', `0 0 ${size.width} ${size.height}`)
    svg.selectAll('*').remove()
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3.scaleLinear().domain([firstYear, lastYear]).range([0, width])
    const y = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d[measure.key]) * 1.05])
      .nice().range([height, 0])

    chart.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(3).tickSize(-width).tickFormat(''))
    chart.append('g').attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickValues(measure.key === 'education'
        ? [2001, 2010, 2020, 2023] : [1990, 2000, 2010, 2024]).tickFormat(d3.format('d')))
    chart.append('g').call(d3.axisLeft(y).ticks(3).tickFormat(
      measure.key === 'gdp_pc' ? d3.format('~s') : d3.format('~g')
    ))

    chart.append('path').datum(chartData).attr('fill', measure.color).attr('opacity', 0.07)
      .attr('d', d3.area().x(d => x(d.year)).y0(height).y1(d => y(d[measure.key])))
    chart.append('path').datum(chartData)
      .attr('fill', 'none').attr('stroke', measure.color).attr('stroke-width', 3)
      .attr('d', d3.line().x(d => x(d.year)).y(d => y(d[measure.key])))
    chart.selectAll('.trend-point').data([chartData[0], chartData[chartData.length - 1]]).join('circle')
      .attr('class', 'trend-point')
      .attr('cx', d => x(d.year)).attr('cy', d => y(d[measure.key]))
      .attr('r', 4.5).attr('fill', measure.color)
    const focus = chart.append('circle')
      .attr('r', 7).attr('fill', measure.color)
      .style('display', 'none')
    const step = x(1991) - x(1990)
    const hits = chart.selectAll('.trend-hit').data(chartData).join('rect')
      .attr('class', 'trend-hit')
      .attr('x', d => x(d.year) - step / 2)
      .attr('y', 0).attr('width', step).attr('height', height)
      .attr('pointer-events', 'all')
      .attr('tabindex', 0)
      .attr('aria-label', d => `${d.year}: ${d[measure.key]} ${measure.unit}`)
    function highlight(d) {
      focus.attr('cx', x(d.year)).attr('cy', y(d[measure.key])).style('display', null)
    }
    hits.on('mouseover.highlight', (event, d) => highlight(d))
      .on('focus.highlight', (event, d) => highlight(d))
      .on('mouseout.highlight', () => focus.style('display', 'none'))
      .on('blur.highlight', () => focus.style('display', 'none'))
    const valueFormat = d3.format(measure.key === 'gdp_pc' ? '$,.0f' : ',.2f')
    addTooltip(hits, chartRef.current, d => `${d.year}\n${measure.title}: ${valueFormat(d[measure.key])}${measure.key === 'education' ? '%' : ''}`)

  }, [measure, chartData, firstYear, lastYear, size])

  const format = measure.key === 'gdp_pc' ? d3.format('$,.0f') : d3.format(',.2f')
  const unit = measure.key === 'education' ? '%' : ''

  return (
    <section className="chart-card median-panel" style={{ borderTopColor: measure.color }}>
      <h3>{measure.title}</h3>
      <p className="median-unit">{measure.unit}</p>
      <p className="trend-values">{firstYear}: <strong>{format(chartData[0][measure.key])}{unit}</strong> &nbsp;→&nbsp; {lastYear}: <strong>{format(chartData[chartData.length - 1][measure.key])}{unit}</strong></p>
      <svg ref={chartRef} role="img" aria-label={`${measure.title} trend from ${firstYear} to ${lastYear}`} />
      <div className="chart-tooltip" aria-hidden="true" />
      <p className="chart-readout" aria-live="polite">Hover or focus a mark to see its exact values.</p>
    </section>
  )
}

export default function MedianTrends() {
  return (
    <div className="median-overview">
      <div className="median-grid">{measures.map(measure => <TrendChart key={measure.key} measure={measure} />)}</div>
      <p className="median-source">Main sample: 182 economies, 1990–2024. Education: available data, 2001–2023; coverage varies and gross enrollment can exceed 100%. Medians weight economies equally. Source: World Bank WDI.</p>
    </div>
  )
}
