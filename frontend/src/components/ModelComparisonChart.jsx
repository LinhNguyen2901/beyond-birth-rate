import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import scoreData from '../data/model_scores.json'
import { addTooltip } from '../chartTooltip'
import { measureColors, selectionColor } from '../chartColors'

const scores = ['Median baseline', 'All three indicators', 'Without GDP', 'Without mortality', 'Without education']
  .map(name => scoreData.find(d => d.name === name))

const colors = {
  'Median baseline': '#8297a8',
  'All three indicators': selectionColor,
  'Without GDP': measureColors.gdp_pc,
  'Without education': measureColors.education,
  'Without mortality': measureColors.mortality,
}

const labels = {
  'Median baseline': 'Guess the median',
  'All three indicators': 'Use all three measures',
  'Without GDP': 'Leave out income',
  'Without education': 'Leave out education',
  'Without mortality': 'Leave out child mortality',
}
const baseline = scores.find(d => d.name === 'Median baseline')
const full = scores.find(d => d.name === 'All three indicators')
const improvement = Math.round((1 - full.mae / baseline.mae) * 100)

export default function ModelComparisonChart() {
  const chartRef = useRef(null)
  const [chartWidth, setChartWidth] = useState(760)

  useEffect(() => {
    const observer = new ResizeObserver(entries => setChartWidth(Math.round(entries[0].contentRect.width)))
    observer.observe(chartRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const compact = chartWidth < 500
    const margin = { top: 18, right: compact ? 26 : 48, bottom: 58, left: compact ? 145 : 205 }
    const width = chartWidth - margin.left - margin.right
    const height = 365 - margin.top - margin.bottom
    const svg = d3.select(chartRef.current).attr('viewBox', `0 0 ${chartWidth} 365`)
    svg.selectAll('*').remove()
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3.scaleLinear().domain([0, 1.15]).range([0, width])
    const y = d3.scaleBand().domain(scores.map(d => d.name))
      .range([0, height]).padding(0.25)

    chart.append('g').attr('class', 'grid')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(compact ? 3 : 5).tickSize(-height).tickFormat(''))
    chart.append('g').attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(compact ? 3 : 5))
    chart.append('g').call(d3.axisLeft(y).tickFormat(name => labels[name]))

    const bars = chart.selectAll('rect').data(scores).join('rect')
      .attr('x', 0).attr('y', d => y(d.name))
      .attr('width', d => x(d.mae)).attr('height', y.bandwidth())
      .attr('fill', d => colors[d.name])

    chart.selectAll('.value').data(scores).join('text')
      .attr('class', 'value').attr('x', d => x(d.mae) + 6)
      .attr('y', d => y(d.name) + y.bandwidth() / 2 + 4)
      .text(d => d.mae.toFixed(2))

    // The full row is the hover target, as in the D3 tutorial example.
    const hits = chart.selectAll('.bar-hit').data(scores).join('rect')
      .attr('class', 'bar-hit').attr('x', -margin.left + 5)
      .attr('y', d => y(d.name) - 5)
      .attr('width', width + margin.left + margin.right - 5).attr('height', y.step())
      .attr('fill', 'transparent').attr('pointer-events', 'all')
      .attr('tabindex', 0)
      .attr('aria-label', d => `${labels[d.name]}: average prediction miss ${d.mae.toFixed(3)} births per woman`)
    hits.on('mouseover.highlight', (event, d) => bars.filter(row => row.name === d.name).classed('is-active', true))
      .on('focus.highlight', (event, d) => bars.filter(row => row.name === d.name).classed('is-active', true))
      .on('mouseout.highlight', () => bars.classed('is-active', false))
      .on('blur.highlight', () => bars.classed('is-active', false))
    addTooltip(hits, chartRef.current, d =>
      `${labels[d.name]}\nAverage prediction miss: ${d.mae.toFixed(3)} births per woman`
    )

    chart.append('text').attr('x', width / 2).attr('y', height + 48)
      .attr('text-anchor', 'middle').text(compact ? 'Average miss (births per woman)' : 'Average prediction miss (births per woman)')
  }, [chartWidth])

  return (
    <section className="chart-card model-card">
      <p>Bars show average prediction error in births per woman. <strong>Shorter is better.</strong></p>
      <div className="model-main">
        <div className="model-explainer">
          <div className="model-takeaway">
            <div>
              <span>The main result</span>
              <strong>{improvement}% less error</strong>
              <p>Income, mortality, and education together roughly halve the average miss.</p>
            </div>
            <div className="model-before-after">
              <span>Median guess <strong>{baseline.mae.toFixed(2)}</strong></span>
              <span>All three measures <strong>{full.mae.toFixed(2)}</strong></span>
              <small>Births per woman off, on average</small>
            </div>
          </div>
          <p className="model-note">Without income, the error barely changes. Without child mortality, it rises the most. That does not tell us what causes fertility to change.</p>
        </div>
        <div className="model-plot">
          <h3>What if we leave one measure out?</h3>
          <p>The bottom bars use the color of the measure left out. Compare them with the navy bar.</p>
          <svg ref={chartRef} role="img" aria-label="Model errors for baseline and indicator combinations" />
          <div className="chart-tooltip" aria-hidden="true" />
          <p className="chart-readout" aria-live="polite">Hover or focus a mark to see its exact values.</p>
        </div>
      </div>
      <p className="chart-source">2001–2023 complete rows. Average absolute error across five rounds, each holding out entire countries. Source: World Bank WDI.</p>
    </section>
  )
}
