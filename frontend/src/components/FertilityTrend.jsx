import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import data from '../data/fertility_trend.json'

export default function FertilityTrendChart() {
  const chartRef = useRef(null)

  useEffect(() => {
    const margin = { top: 20, right: 30, bottom: 55, left: 65 }
    const width = 700 - margin.left - margin.right
    const height = 380 - margin.top - margin.bottom

    const svg = d3.select(chartRef.current)
      .attr('viewBox', '0 0 700 380')

    svg.selectAll('*').remove() 

    const chart = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const xScale = d3.scaleLinear()
      .domain([1990, 2024])
      .range([0, width])

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.fertility)])
      .nice()
      .range([height, 0])

    chart.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale).tickValues([1990, 2000, 2010, 2020, 2024]))

    chart.append('g')
      .call(d3.axisLeft(yScale).ticks(5))

    chart.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#345f9d')
      .attr('stroke-width', 3)
      .attr('d', d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.fertility))
      )

    chart.append('text')
      .attr('x', width / 2)
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .text('Year')

    chart.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -48)
      .attr('text-anchor', 'middle')
      .text('Births per woman')
  }, [])

  return (
    <section className="chart-card">
      <h2>Fertility has fallen since 1990</h2>
      <p>Median across 182 economies with complete data, 1990–2024.</p>
      <svg ref={chartRef} role="img"
        aria-label="Median fertility fell from 1990 to 2024" />
      <p className="chart-source">Source: World Bank WDI</p>
    </section>
  )
}