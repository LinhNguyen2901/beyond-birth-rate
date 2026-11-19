import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import data from '../data/core_trends.json'
import { addTooltip } from '../chartTooltip'

const measures = [
  { key: 'fertility', title: 'Fertility', unit: 'Births per woman', color: '#1a7774' },
  { key: 'mortality', title: 'Under-five mortality', unit: 'Deaths per 1,000 live births', color: '#d66a4f' },
  { key: 'gdp_pc', title: 'GDP per person', unit: 'Constant 2015 US$', color: '#6878b7' },
]

function TrendChart({ measure }) {
  const chartRef = useRef(null)

  useEffect(() => {
    const margin = { top: 20, right: 25, bottom: 55, left: 65 }
    const width = 700 - margin.left - margin.right
    const height = 350 - margin.top - margin.bottom
    const svg = d3.select(chartRef.current).attr('viewBox', '0 0 700 350')
    svg.selectAll('*').remove()
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3.scaleLinear().domain([1990, 2024]).range([0, width])
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[measure.key]) * 1.05])
      .nice().range([height, 0])

    chart.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''))
    chart.append('g').attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickValues([1990, 2000, 2010, 2020, 2024]))
    chart.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(
      measure.key === 'gdp_pc' ? d3.format('~s') : d3.format('~g')
    ))

    chart.append('path').datum(data)
      .attr('fill', 'none').attr('stroke', measure.color).attr('stroke-width', 3)
      .attr('d', d3.line().x(d => x(d.year)).y(d => y(d[measure.key])))
    chart.selectAll('.trend-point').data(data).join('circle')
      .attr('class', 'trend-point')
      .attr('cx', d => x(d.year)).attr('cy', d => y(d[measure.key]))
      .attr('r', 4.5).attr('fill', measure.color)
    const focus = chart.append('circle')
      .attr('r', 7).attr('fill', measure.color)
      .style('display', 'none')
    const step = width / (data.length - 1)
    const hits = chart.selectAll('.trend-hit').data(data).join('rect')
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
    addTooltip(hits, chartRef.current, d => `${d.year}\n${measure.title}: ${valueFormat(d[measure.key])}`)

    chart.append('text').attr('x', width / 2).attr('y', height + 44)
      .attr('text-anchor', 'middle').text('Year')
    chart.append('text').attr('transform', 'rotate(-90)')
      .attr('x', -height / 2).attr('y', -48)
      .attr('text-anchor', 'middle').text(measure.unit)
  }, [measure])

  const format = measure.key === 'gdp_pc' ? d3.format('$,.0f') : d3.format(',.2f')

  return (
    <section className="chart-card">
      <h2>{measure.title}</h2>
      <p>Median across the same 182 economies, 1990–2024.</p>
      <p className="trend-values">1990: <strong>{format(data[0][measure.key])}</strong> &nbsp;→&nbsp; 2024: <strong>{format(data[data.length - 1][measure.key])}</strong></p>
      <svg ref={chartRef} role="img" aria-label={`${measure.title} trend from 1990 to 2024`} />
      <div className="chart-tooltip" aria-hidden="true" />
      <p className="chart-readout" aria-live="polite">Hover or focus a mark to see its exact values.</p>
      <p className="chart-source">Economy medians, not population-weighted world totals. Source: World Bank WDI.</p>
    </section>
  )
}

export default function MedianTrends() {
  return <>{measures.map(measure => <TrendChart key={measure.key} measure={measure} />)}</>
}
