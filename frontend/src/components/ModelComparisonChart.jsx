import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import scores from '../data/model_scores.json'
import { addTooltip } from '../chartTooltip'

export default function ModelComparisonChart() {
  const chartRef = useRef(null)

  useEffect(() => {
    const margin = { top: 20, right: 40, bottom: 60, left: 170 }
    const width = 700 - margin.left - margin.right
    const height = 350 - margin.top - margin.bottom
    const svg = d3.select(chartRef.current).attr('viewBox', '0 0 700 350')
    svg.selectAll('*').remove()
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3.scaleLinear().domain([0, 1.1]).range([0, width])
    const y = d3.scaleBand().domain(scores.map(d => d.name))
      .range([0, height]).padding(0.25)

    chart.append('g').attr('class', 'grid')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(-height).tickFormat(''))
    chart.append('g').attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(5))
    chart.append('g').call(d3.axisLeft(y))

    const bars = chart.selectAll('rect').data(scores).join('rect')
      .attr('x', 0).attr('y', d => y(d.name))
      .attr('width', d => x(d.mae)).attr('height', y.bandwidth())
      .attr('fill', d => d.name === 'All three indicators' ? '#1a7774' : '#91a9be')

    chart.selectAll('.value').data(scores).join('text')
      .attr('class', 'value').attr('x', d => x(d.mae) + 6)
      .attr('y', d => y(d.name) + y.bandwidth() / 2 + 4)
      .text(d => d.mae.toFixed(3))

    // The full row is the hover target, as in the D3 tutorial example.
    const hits = chart.selectAll('.bar-hit').data(scores).join('rect')
      .attr('class', 'bar-hit').attr('x', -165)
      .attr('y', d => y(d.name) - 5)
      .attr('width', width + 200).attr('height', y.step())
      .attr('fill', 'transparent').attr('pointer-events', 'all')
      .attr('tabindex', 0)
      .attr('aria-label', d => `${d.name}: mean absolute error ${d.mae.toFixed(3)} births per woman`)
    hits.on('mouseover.highlight', (event, d) => bars.filter(row => row.name === d.name).classed('is-active', true))
      .on('focus.highlight', (event, d) => bars.filter(row => row.name === d.name).classed('is-active', true))
      .on('mouseout.highlight', () => bars.classed('is-active', false))
      .on('blur.highlight', () => bars.classed('is-active', false))
    addTooltip(hits, chartRef.current, d =>
      `${d.name}\nMean absolute error: ${d.mae.toFixed(3)} births per woman`
    )

    chart.append('text').attr('x', width / 2).attr('y', height + 48)
      .attr('text-anchor', 'middle').text('Mean absolute error (births per woman)')
  }, [])

  return (
    <section className="chart-card">
      <h2>How well can the indicators predict fertility?</h2>
      <p>Lower error is better. Forest models hold out entire economies in five folds.</p>
      <svg ref={chartRef} role="img" aria-label="Model errors for baseline and indicator combinations" />
      <div className="chart-tooltip" aria-hidden="true" />
      <p className="chart-readout" aria-live="polite">Hover or focus a mark to see its exact values.</p>
      <p className="chart-source">2001–2023 complete-data sample. Scores are recalculated from the current processed CSV with five country-held-out folds. Refresh the CSV and run the export script before finalizing. Prediction does not show cause.</p>
    </section>
  )
}
