import * as d3 from 'd3'

// Give D3 marks the same visible tooltip for mouse and keyboard focus.
export function addTooltip(marks, svgElement, format) {
  const card = d3.select(svgElement.parentNode)
  const tooltip = card.select('.chart-tooltip')
  const readout = card.select('.chart-readout')
  tooltip.classed('visible', false)
  readout.text('Hover or focus a mark to see its exact values.').classed('has-value', false)

  function move(event) {
    const point = event.currentTarget.getBoundingClientRect()
    const x = event.type.startsWith('mouse') ? event.clientX : point.right
    const y = event.type.startsWith('mouse') ? event.clientY : point.top
    tooltip
      .style('left', `${Math.max(8, Math.min(x + 14, window.innerWidth - 240))}px`)
      .style('top', `${Math.max(8, Math.min(y + 14, window.innerHeight - 130))}px`)
  }

  function show(event, d) {
    const value = format(d)
    tooltip.text(value).classed('visible', true)
    readout.text(value.replaceAll('\n', '  ·  ')).classed('has-value', true)
    d3.select(event.currentTarget).classed('is-active', true)
    move(event)
  }

  function hide(event) {
    tooltip.classed('visible', false)
    d3.select(event.currentTarget).classed('is-active', false)
  }

  marks
    .on('mouseover.tooltip', show)
    .on('mousemove.tooltip', move)
    .on('mouseout.tooltip', hide)
    .on('focus.tooltip', show)
    .on('blur.tooltip', hide)
}
