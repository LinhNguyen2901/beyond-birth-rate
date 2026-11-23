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
  'Median baseline': 'Baseline: median',
  'All three indicators': 'Full model: all three indicators',
  'Without GDP': 'Leave out income',
  'Without education': 'Leave out female education',
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
      .attr('aria-label', d => `${labels[d.name]}: average absolute prediction error ${d.mae.toFixed(3)} births per woman`)
    hits.on('mouseover.highlight', (event, d) => bars.filter(row => row.name === d.name).classed('is-active', true))
      .on('focus.highlight', (event, d) => bars.filter(row => row.name === d.name).classed('is-active', true))
      .on('mouseout.highlight', () => bars.classed('is-active', false))
      .on('blur.highlight', () => bars.classed('is-active', false))
    addTooltip(hits, chartRef.current, d =>
      `${labels[d.name]}\nAverage prediction error: ${d.mae.toFixed(3)} births per woman`
    )

    chart.append('text').attr('x', width / 2).attr('y', height + 48)
      .attr('text-anchor', 'middle').text(compact ? 'Average error (births per woman)' : 'Average prediction error (births per woman)')
  }, [chartWidth])

  return (
    <section className="chart-card model-card">
      <div className="model-main">
        <div className="model-left">
          <div className="model-takeaway">
            <div>
              <span>Main result</span>
              <strong>{improvement}% lower error vs. baseline</strong>
              <p>Child mortality and female secondary enrollment improved predictions the most while income added little. The model was still off by about 0.5 births per woman on average, suggesting there are other factors to consider.</p>
            </div>
          </div>
          <p className="chart-source model-source">World Bank WDI, 2001–2023.</p>
        </div>
        <div className="model-plot">
          <svg ref={chartRef} role="img" aria-label={`Average prediction error in births per woman: ${baseline.mae.toFixed(2)} when predicting the training data's median fertility rate for every country, versus ${full.mae.toFixed(2)} using income, child mortality, and education. The last three bars leave out one measure each. Shorter bars are better.`} />
          <div className="chart-tooltip" aria-hidden="true" />
          <p className="chart-readout" aria-live="polite">Hover or focus a mark to see its exact values.</p>
          <p className="model-error-note">An error of 0.5 means predicting 3.0 births per woman when the actual rate was 3.5. Shorter bars mean smaller average errors.</p>
        </div>
      </div>
      <details className="model-method">
        <summary>How were the predictions tested?</summary>
        <p>We trained a random forest on country-year records from 2001–2023 and tested it on countries it had not seen, repeating this in five rounds. Every model used the same records. Records missing fertility, income, child mortality, or female secondary enrollment were excluded, so the result may not represent countries with less complete data.</p>
      </details>
    </section>
  )
}
