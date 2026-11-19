import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import data from '../data/core_trends.json'
import educationData from '../data/education_year.json'
import { addTooltip } from '../chartTooltip'

const educationTrend = d3.rollups(educationData, rows => d3.median(rows, d => d.education), d => d.year)
  .map(([year, education]) => ({ year, education }))
  .sort((a, b) => a.year - b.year)

const measures = [
  { key: 'fertility', title: 'Fertility', unit: 'Births per woman', color: '#1a7774' },
  { key: 'mortality', title: 'Under-five mortality', unit: 'Deaths per 1,000 live births', color: '#d66a4f' },
  { key: 'gdp_pc', title: 'GDP per person', unit: 'Constant 2015 US$', color: '#6878b7' },
  { key: 'education', title: 'Female secondary enrollment', unit: 'Gross enrollment (%)', color: '#a4659b' },
]

function TrendChart({ measure }) {
  const chartRef = useRef(null)
  const chartData = measure.key === 'education' ? educationTrend : data
  const firstYear = chartData[0].year
  const lastYear = chartData[chartData.length - 1].year

  useEffect(() => {
    const margin = { top: 20, right: 25, bottom: 55, left: 65 }
    const width = 700 - margin.left - margin.right
    const height = 350 - margin.top - margin.bottom
    const svg = d3.select(chartRef.current).attr('viewBox', '0 0 700 350')
    svg.selectAll('*').remove()
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3.scaleLinear().domain([firstYear, lastYear]).range([0, width])
    const y = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d[measure.key]) * 1.05])
      .nice().range([height, 0])

    chart.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''))
    chart.append('g').attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickValues(measure.key === 'education'
        ? [2001, 2005, 2010, 2015, 2020, 2023]
        : [1990, 2000, 2010, 2020, 2024]))
    chart.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(
      measure.key === 'gdp_pc' ? d3.format('~s') : d3.format('~g')
    ))

    chart.append('path').datum(chartData)
      .attr('fill', 'none').attr('stroke', measure.color).attr('stroke-width', 3)
      .attr('d', d3.line().x(d => x(d.year)).y(d => y(d[measure.key])))
    chart.selectAll('.trend-point').data(chartData).join('circle')
      .attr('class', 'trend-point')
      .attr('cx', d => x(d.year)).attr('cy', d => y(d[measure.key]))
      .attr('r', 4.5).attr('fill', measure.color)
    const focus = chart.append('circle')
      .attr('r', 7).attr('fill', measure.color)
      .style('display', 'none')
    const step = width / (chartData.length - 1)
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

    chart.append('text').attr('x', width / 2).attr('y', height + 44)
      .attr('text-anchor', 'middle').text('Year')
    chart.append('text').attr('transform', 'rotate(-90)')
      .attr('x', -height / 2).attr('y', -48)
      .attr('text-anchor', 'middle').text(measure.unit)
  }, [measure, chartData, firstYear, lastYear])

  const format = measure.key === 'gdp_pc' ? d3.format('$,.0f') : d3.format(',.2f')
  const unit = measure.key === 'education' ? '%' : ''

  return (
    <section className="chart-card">
      <h2>{measure.title}</h2>
      <p>{measure.key === 'education'
        ? 'Median across economies with available education data each year, 2001–2023.'
        : 'Median across the same 182 economies, 1990–2024.'}</p>
      <p className="trend-values">{firstYear}: <strong>{format(chartData[0][measure.key])}{unit}</strong> &nbsp;→&nbsp; {lastYear}: <strong>{format(chartData[chartData.length - 1][measure.key])}{unit}</strong></p>
      <svg ref={chartRef} role="img" aria-label={`${measure.title} trend from ${firstYear} to ${lastYear}`} />
      <div className="chart-tooltip" aria-hidden="true" />
      <p className="chart-readout" aria-live="polite">Hover or focus a mark to see its exact values.</p>
      <p className="chart-source">{measure.key === 'education'
        ? 'Separate available-data sample; the number of economies varies by year. Gross enrollment can exceed 100%. Source: World Bank WDI.'
        : 'Economy medians, not population-weighted world totals. Source: World Bank WDI.'}</p>
    </section>
  )
}

export default function MedianTrends() {
  return <>{measures.map(measure => <TrendChart key={measure.key} measure={measure} />)}</>
}
