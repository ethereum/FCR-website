/**
 * Block Simulation Animation — Dual-Bar Format
 * - Main simulation: Two bars (With FCR vs Without FCR), 64 blocks
 * - Assumption 1: FCR Client vs Head of Chain — async failure + fallback
 * - Assumption 2: FCR Client vs Head of Chain — adversary failure + fallback
 */

const NORMAL_TOTAL_SLOTS = 64
const NORMAL_MAX_TICKS = 68   // 64 + 4 buffer for finalization snap
const NORMAL_TICK_SPEED = 200 // ms per tick

const ASSUMPTION_TOTAL_SLOTS = 40
const ASSUMPTION_TICK_SPEED = 700

const SLOTS_PER_EPOCH = 32

const TICK_SPEEDS = { normal: NORMAL_TICK_SPEED, async: ASSUMPTION_TICK_SPEED, adversary: ASSUMPTION_TICK_SPEED }

// SVG icons
const ICON_PLAY = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>'
const ICON_PAUSE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/></svg>'
const ICON_RESTART = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>'

// ─── Helpers ───

function formatTime(seconds) {
  if (seconds < 60) return `~${String(seconds).padStart(2, '0')}s`
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `~${String(min).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`
}

function renderBadge(text, type) {
  const cls = type === 'ok' ? 'sim-badge-ok' : type === 'warn' ? 'sim-badge-warn' : 'sim-badge-info'
  return `<span class="sim-badge ${cls}">${text}</span>`
}

function renderCallout(text, type) {
  if (!text) return ''
  const cls = type === 'warn' ? 'sim-callout-warn' : 'sim-callout-ok'
  return `<div class="sim-callout ${cls}"><span>${text}</span></div>`
}

// ─── Main Simulation: Dual-bar (With FCR / Without FCR) ───

function computeNormal(tick) {
  const N = NORMAL_TOTAL_SLOTS
  const headBlock = tick > 0 ? Math.min(tick - 1, N - 1) : null
  const proposed = Math.min(tick, N)
  const finalizationTick = N + 3 // finalize after all blocks proposed + small lag

  // Top bar (With FCR): confirmed as head passes
  const fcrBar = Array.from({ length: N }).map((_, i) => {
    if (i >= proposed) return { status: 'empty' }
    if (tick >= finalizationTick) return { status: 'finalized' }
    if (headBlock !== null && i <= headBlock) return { status: 'confirmed' }
    return { status: 'proposed' }
  })

  // Bottom bar (Without FCR): proposed (gray) until finalization, then all green
  const finBar = Array.from({ length: N }).map((_, i) => {
    if (i >= proposed) return { status: 'empty' }
    if (tick >= finalizationTick) return { status: 'finalized' }
    return { status: 'proposed' }
  })

  const fcrConfirmed = headBlock !== null ? headBlock + 1 : 0
  const allFinalized = tick >= finalizationTick
  const finConfirmed = allFinalized ? N : 0

  const elapsedSec = Math.min(tick, N) * 12
  const elapsedText = tick > 0 ? formatTime(elapsedSec) : ''

  return {
    type: 'normal-dual',
    fcrBar,
    finBar,
    headBlock,
    elapsedText,
    fcrConfirmed,
    finConfirmed,
    allFinalized,
    tick
  }
}

function renderControls(controls) {
  const { scenarioKey, isPlaying, tick, maxTicks } = controls
  const playIcon = isPlaying ? ICON_PAUSE : ICON_PLAY

  if (tick === 0) {
    return `<button class="sim-btn-start" id="sim-play-${scenarioKey}">${playIcon}<span>Start simulation</span></button>`
  }
  if (tick >= maxTicks) {
    return `<button class="sim-btn-sm" id="sim-play-${scenarioKey}">${ICON_RESTART}<span>Replay</span></button>`
  }
  // Running/paused: compact controls on the right
  return `<div class="sim-controls-inline">
    <button class="sim-icon-btn sim-icon-btn-sm" id="sim-restart-${scenarioKey}" title="Restart">${ICON_RESTART}</button>
    <button class="sim-icon-btn sim-icon-btn-sm" id="sim-play-${scenarioKey}" title="${isPlaying ? 'Pause' : 'Resume'}">${playIcon}</button>
  </div>`
}

function renderNormalChain(state, controls) {
  const { fcrBar, finBar, headBlock, elapsedText, fcrConfirmed, finConfirmed, allFinalized, tick } = state
  const N = NORMAL_TOTAL_SLOTS

  let html = '<div class="sim-unified">'

  // Header
  html += '<div class="sim-unified-header">'
  html += '<span class="sim-unified-title">Ethereum Block Chain</span>'
  html += '</div>'

  // ── Top bar: With FCR ──
  html += '<div class="sim-dual-section">'
  html += `<div class="sim-dual-section-header"><span class="sim-dual-section-label sim-dual-section-label-fcr">With FCR</span><span class="sim-dual-section-counter">confirmed: ${fcrConfirmed}</span></div>`
  html += '<div class="sim-dual-bar-wrap">'

  // Head bubble on top bar (green = confirmed, green = finalized)
  if (headBlock !== null && headBlock >= 0) {
    const pct = Math.min(((headBlock + 0.5) / N) * 100, 98)
    const elapsedSec = (headBlock + 1) * 12
    const label = allFinalized ? 'Finalized' : 'Confirmed'
    const bubbleClass = allFinalized ? 'sim-head-bubble sim-head-bubble-green' : 'sim-head-bubble sim-head-bubble-confirmed'
    html += `<div class="${bubbleClass}" style="left:${pct}%">`
    html += `<span class="sim-head-bubble-text">Block ${headBlock + 1} · ${formatTime(elapsedSec)} · ${label}</span>`
    html += '<div class="sim-head-bubble-arrow"></div>'
    html += '</div>'
  }

  html += '<div class="sim-bar">'
  for (let i = 0; i < SLOTS_PER_EPOCH && i < fcrBar.length; i++) {
    html += `<div class="sim-bar-seg ${fcrBar[i].status}"></div>`
  }
  html += '<div class="sim-epoch-divider"></div>'
  for (let i = SLOTS_PER_EPOCH; i < SLOTS_PER_EPOCH * 2 && i < fcrBar.length; i++) {
    html += `<div class="sim-bar-seg ${fcrBar[i].status}"></div>`
  }
  html += '</div>'

  html += '<div class="sim-bar-labels">'
  html += '<span class="sim-bar-epoch-label">Epoch 1</span>'
  html += '<span class="sim-bar-epoch-label">Epoch 2</span>'
  html += '</div>'

  html += '</div>' // .sim-dual-bar-wrap

  // Status pills
  html += '<div class="sim-dual-pills-center">'
  if (fcrConfirmed > 0 && !allFinalized) {
    html += '<span class="sim-status-pill sim-status-confirmed">FCR Confirmed ~13s</span>'
    html += '<span class="sim-status-pill sim-status-waiting">Finality: waiting...</span>'
  } else if (allFinalized) {
    html += '<span class="sim-status-pill sim-status-confirmed">FCR Confirmed ~13s</span>'
    html += '<span class="sim-status-pill sim-status-finalized">Finalized ~13m</span>'
  }
  html += '</div>'
  html += '</div>' // .sim-dual-section

  // Gap between bars
  html += '<div class="sim-dual-gap"></div>'

  // ── Bottom bar: Without FCR ──
  html += '<div class="sim-dual-section">'
  html += `<div class="sim-dual-section-header"><span class="sim-dual-section-label">Without FCR</span><span class="sim-dual-section-counter">confirmed: ${finConfirmed}</span></div>`
  html += '<div class="sim-dual-bar-wrap">'

  // Head bubble on bottom bar (gray = still waiting, green = finalized)
  if (headBlock !== null && headBlock >= 0) {
    const pct = Math.min(((headBlock + 0.5) / N) * 100, 98)
    const elapsedSec = (headBlock + 1) * 12
    const label = allFinalized ? 'Finalized' : 'Still waiting...'
    const bubbleClass = allFinalized ? 'sim-head-bubble sim-head-bubble-green' : 'sim-head-bubble sim-head-bubble-gray'
    html += `<div class="${bubbleClass}" style="left:${pct}%">`
    html += `<span class="sim-head-bubble-text">Block ${headBlock + 1} · ${formatTime(elapsedSec)} · ${label}</span>`
    html += '<div class="sim-head-bubble-arrow"></div>'
    html += '</div>'
  }

  html += '<div class="sim-bar">'
  for (let i = 0; i < SLOTS_PER_EPOCH && i < finBar.length; i++) {
    html += `<div class="sim-bar-seg ${finBar[i].status}"></div>`
  }
  html += '<div class="sim-epoch-divider"></div>'
  for (let i = SLOTS_PER_EPOCH; i < SLOTS_PER_EPOCH * 2 && i < finBar.length; i++) {
    html += `<div class="sim-bar-seg ${finBar[i].status}"></div>`
  }
  html += '</div>'

  html += '<div class="sim-bar-labels">'
  html += '<span class="sim-bar-epoch-label">Epoch 1</span>'
  html += '<span class="sim-bar-epoch-label">Epoch 2</span>'
  html += '</div>'

  html += '</div>' // .sim-dual-bar-wrap

  // Status pills
  html += '<div class="sim-dual-pills-center">'
  if (!allFinalized) {
    html += '<span class="sim-status-pill sim-status-waiting">Finality: waiting...</span>'
  } else {
    html += '<span class="sim-status-pill sim-status-finalized">Finalized ~13m</span>'
  }
  html += '</div>'
  html += '</div>' // .sim-dual-section

  // Bottom time / summary area (inside the box)
  html += '<div class="sim-bottom-area">'
  if (allFinalized && tick >= NORMAL_MAX_TICKS - 2) {
    html += '<div class="sim-summary-highlight">'
    html += '<div class="sim-summary-highlight-inner">'
    html += '<div class="sim-summary-stat"><span class="sim-summary-value sim-summary-value-fcr">~13s</span><span class="sim-summary-label">With FCR (1 slot)</span></div>'
    html += '<div class="sim-summary-vs">vs</div>'
    html += '<div class="sim-summary-stat"><span class="sim-summary-value sim-summary-value-fin">~13m</span><span class="sim-summary-label">Without FCR (64 slots)</span></div>'
    html += '</div>'
    html += '<div class="sim-summary-tagline">That\'s a <strong>~60x improvement</strong> in confirmation time.</div>'
    html += '<div class="sim-summary-replay">' + renderControls(controls) + '</div>'
    html += '</div>'
  } else if (tick > 0) {
    html += '<div class="sim-elapsed-bar">'
    html += `<span class="sim-elapsed-time">${elapsedText}</span>`
    html += '</div>'
    html += '<div class="sim-elapsed-controls">' + renderControls(controls) + '</div>'
  } else {
    html += '<div class="sim-elapsed-bar">'
    html += renderControls(controls)
    html += '</div>'
  }
  html += '</div>'

  html += '</div>' // .sim-unified

  return html
}

// ─── Assumption Simulations: FCR Client vs Head of Chain ───

function computeAssumption(tick, failAt, scenarioType) {
  const N = ASSUMPTION_TOTAL_SLOTS
  // Head of chain advances every 2 ticks (slower than FCR)
  const headChainBlock = Math.min(Math.floor(tick / 2), N - 1)
  // FCR confirms every tick (faster) until failure
  const fcrHead = Math.min(tick, N - 1)

  const failed = tick >= failAt
  const reorgTick = failAt + 2 // 2-tick delay: reorg flash
  const fallbackTick = failAt + 5 // 5-tick delay before fallback (longer to show reorg)
  const fellBack = tick >= fallbackTick
  const showReorg = scenarioType === 'async' && failed && tick >= reorgTick && !fellBack

  // FCR bar (top)
  const fcrBar = Array.from({ length: N }).map((_, i) => {
    if (!failed) {
      // Normal: FCR confirms up to fcrHead
      if (i <= fcrHead) return { status: 'confirmed' }
      return { status: 'empty' }
    }
    if (!fellBack) {
      // Failed but not yet fallen back
      if (scenarioType === 'async' && showReorg && i >= failAt - 3 && i < failAt) {
        // Async: last few confirmed blocks flash red to show potential reorg
        return { status: 'reorged' }
      }
      if (i < failAt) return { status: 'confirmed' }
      return { status: 'empty' }
    }
    // After fallback: match head of chain (green), advance together
    const postFallbackHead = headChainBlock
    if (i <= postFallbackHead) return { status: 'finalized' } // green = tracking head of chain
    return { status: 'empty' }
  })

  // Head of chain bar (bottom)
  const headBar = Array.from({ length: N }).map((_, i) => {
    if (i <= headChainBlock) return { status: 'finalized' } // green
    return { status: 'empty' }
  })

  // Warning message
  let warning = null
  if (failed && !fellBack) {
    if (scenarioType === 'async') {
      warning = showReorg
        ? 'Asynchrony undetected — confirmed blocks may be reorganized'
        : 'Network conditions asynchronous — falling back to head of chain'
    } else {
      warning = '>25% adversarial stake — liveness compromised'
    }
  }

  // Tooltip label for top bar
  let fcrTooltipLabel
  if (!failed) {
    fcrTooltipLabel = scenarioType === 'async' ? 'Synchronous · Confirmed' : 'Confirmed'
  } else if (!fellBack) {
    fcrTooltipLabel = scenarioType === 'async' ? 'Asynchronous' : '>25% adversarial'
  } else {
    fcrTooltipLabel = 'Head of chain'
  }

  return {
    type: 'assumption-dual',
    fcrBar,
    headBar,
    fcrHead: failed ? (fellBack ? headChainBlock : failAt - 1) : fcrHead,
    headChainBlock,
    failAt,
    failed,
    fellBack,
    showReorg,
    warning,
    fcrTooltipLabel,
    scenarioType,
    tick,
    elapsed: tick * 12
  }
}

// Randomize failure points once per simulation instance
let asyncFailAt = null
let adversaryFailAt = null

function randomizeFailPoints() {
  asyncFailAt = 18 + Math.floor(Math.random() * 12) // 18–29
  adversaryFailAt = 28 + Math.floor(Math.random() * 10) // 28–37
}

function computeAsync(tick) {
  if (asyncFailAt === null) randomizeFailPoints()
  return computeAssumption(tick, asyncFailAt, 'async')
}

function computeAdversary(tick) {
  if (adversaryFailAt === null) randomizeFailPoints()
  return computeAssumption(tick, adversaryFailAt, 'adversary')
}

function renderAssumptionDualBar(state, controls) {
  const { fcrBar, headBar, fcrHead, headChainBlock, failAt, failed, fellBack, warning, fcrTooltipLabel, tick, elapsed } = state
  const N = fcrBar.length

  let html = '<div class="sim-unified sim-assumption-unified" style="padding:16px;position:relative">'

  // ── Top bar: FCR Client ──
  html += '<div class="sim-dual-row" id="sim-fcr-row">'
  html += '<div class="sim-dual-label">FCR Client</div>'
  html += '<div class="sim-dual-bar-wrap" style="padding-top:28px" data-bar="fcr">'

  // Head bubble on top bar with contextual label
  if (fcrHead >= 0) {
    const pct = Math.min(((fcrHead + 0.5) / N) * 100, 98)
    const bubbleClass = fellBack
      ? 'sim-head-bubble sim-head-bubble-green'
      : (failed ? 'sim-head-bubble sim-head-bubble-red' : 'sim-head-bubble sim-head-bubble-confirmed')
    html += `<div class="${bubbleClass}" style="left:${pct}%">`
    html += `<span class="sim-head-bubble-text">Block ${fcrHead + 1} · ${fcrTooltipLabel}</span>`
    html += '<div class="sim-head-bubble-arrow"></div>'
    html += '</div>'
  }

  html += '<div class="sim-bar">'
  for (let i = 0; i < N; i++) {
    const failMark = (failed && i === failAt - 1) ? ' border-right:2px dashed #cc3333;' : ''
    html += `<div class="sim-bar-seg ${fcrBar[i].status}" style="${failMark}"></div>`
  }
  html += '</div>' // .sim-bar
  html += '</div>' // .sim-dual-bar-wrap
  html += '</div>' // .sim-dual-row

  // Warning badge + fallback arrow
  if (warning) {
    html += '<div class="sim-fallback-indicator">'
    html += `<div class="sim-warning-badge">\u26a0 ${warning}</div>`
    html += '<div class="sim-fallback-arrow">\u2193</div>'
    html += '</div>'
  } else if (fellBack) {
    html += '<div class="sim-fallback-indicator">'
    html += `<div class="sim-fallback-arrow-done">\u2193 ${state.scenarioType === 'async' ? 'Fell back to finalized block' : 'Deferred to head of chain'}</div>`
    html += '</div>'
  }

  // Gap
  html += '<div style="height:8px"></div>'

  // ── Bottom bar: Head of Chain ──
  html += '<div class="sim-dual-row" id="sim-head-row">'
  html += '<div class="sim-dual-label" style="color:#22aa44">Head of Chain</div>'
  html += '<div class="sim-dual-bar-wrap" style="padding-top:28px" data-bar="head">'

  // Head bubble on bottom bar (always green)
  if (headChainBlock >= 0) {
    const pct = Math.min(((headChainBlock + 0.5) / N) * 100, 98)
    const headLabel = (failed && fellBack) ? 'Head of the chain \u2713' : 'Head of the chain'
    html += `<div class="sim-head-bubble sim-head-bubble-green" style="left:${pct}%">`
    html += `<span class="sim-head-bubble-text">${headLabel} · ${formatTime(elapsed)}</span>`
    html += '<div class="sim-head-bubble-arrow"></div>'
    html += '</div>'
  }

  html += '<div class="sim-bar">'
  for (let i = 0; i < N; i++) {
    html += `<div class="sim-bar-seg ${headBar[i].status}"></div>`
  }
  html += '</div>' // .sim-bar
  html += '</div>' // .sim-dual-bar-wrap
  html += '</div>' // .sim-dual-row

  // Callout inside box
  if (fellBack) {
    if (state.scenarioType === 'async') {
      html += renderCallout(
        '\u2713 FCR detected asynchrony and fell back to the finalized block. If asynchrony goes undetected, a confirmed block may be reorganized.',
        'ok'
      )
    } else {
      html += renderCallout(
        '\u2713 FCR fell back to head of chain. Liveness lost — confirmations stalled. Under adversarial conditions combined with network issues, safety may also be at risk.',
        'ok'
      )
    }
  } else if (failed) {
    if (state.scenarioType === 'async' && state.showReorg) {
      html += renderCallout(
        '\u26a0 Confirmed blocks being reorganized — brief asynchrony went undetected.',
        'warn'
      )
    } else {
      html += renderCallout(
        '\u26a0 FCR cannot confirm new blocks. Falling back to head of chain...',
        'warn'
      )
    }
  }

  // Controls
  html += '<div class="sim-bottom-area">'
  if (tick > 0) {
    html += '<div class="sim-elapsed-bar">'
    html += `<span class="sim-elapsed-time">${formatTime(elapsed)}</span>`
    html += '</div>'
    html += '<div class="sim-elapsed-controls">' + renderControls(controls) + '</div>'
  } else {
    html += '<div class="sim-elapsed-bar">'
    html += renderControls(controls)
    html += '</div>'
  }
  html += '</div>'

  html += '</div>' // .sim-unified

  return html
}

// ─── Scenario definitions ───

const SCENARIOS = {
  normal: {
    label: 'FCR vs Finality',
    desc: 'Two bars advance together: with FCR (orange = confirmed) vs without FCR (gray = waiting). At finalization, both turn green.',
    compute: computeNormal,
    legend: ['proposed', 'confirmed', 'finalized'],
    maxTicks: NORMAL_MAX_TICKS
  },
  async: {
    label: 'Async Failure',
    desc: 'FCR confirms blocks faster, but when network goes asynchronous, confirmed blocks may be reorganized before FCR falls back.',
    compute: computeAsync,
    legend: ['confirmed', 'finalized'],
    maxTicks: ASSUMPTION_TOTAL_SLOTS * 2 + 6
  },
  adversary: {
    label: '>25% Adversary',
    desc: 'With >25% adversarial stake, FCR loses liveness. Combined with network issues, safety may also be at risk.',
    compute: computeAdversary,
    legend: ['confirmed', 'finalized'],
    maxTicks: ASSUMPTION_TOTAL_SLOTS * 2 + 6
  }
}

// ─── Simulation class ───

export class BlockSimulation {
  constructor(container, scenarioKey) {
    this.container = container
    this.scenarioKey = scenarioKey || 'normal'
    this.scenario = SCENARIOS[this.scenarioKey]
    this.tick = 0
    this.isPlaying = false
    this.animFrameId = null
    this.lastTickTime = 0
    this.isMobile = window.innerWidth < 640
    this.tickSpeed = TICK_SPEEDS[this.scenarioKey] || 900

    this.render()
    this.updateDisplay()
  }

  render() {
    const isNormal = this.scenarioKey === 'normal'
    this.container.innerHTML = `
      <div class="space-y-3">
        <p class="text-text-muted text-sm" id="sim-desc-${this.scenarioKey}"></p>
        <div class="flex flex-wrap gap-3 text-[11px] text-text-muted" id="sim-legend-${this.scenarioKey}"></div>
        <div id="sim-viewport-${this.scenarioKey}" class="sim-viewport${isNormal ? ' sim-viewport-normal' : ''}"></div>
      </div>
    `

    this.container.querySelector(`#sim-desc-${this.scenarioKey}`).textContent = this.scenario.desc
    this.renderLegend()
  }

  renderLegend() {
    const defs = {
      proposed: { color: '#737373', label: 'Proposed (unconfirmed)' },
      confirmed: { color: '#F05F36', label: 'Confirmed (FCR)' },
      finalized: { color: '#22aa44', label: 'Finalized / Head of Chain' }
    }
    const items = this.scenario.legend
    this.container.querySelector(`#sim-legend-${this.scenarioKey}`).innerHTML = items.map(k => {
      const d = defs[k]
      const style = `width:14px;height:14px;border-radius:4px;background:${d.color}`
      return `<div class="flex items-center gap-1.5"><div style="${style}"></div><span>${d.label}</span></div>`
    }).join('')
  }

  play() {
    if (this.tick >= this.scenario.maxTicks) this.tick = 0
    this.isPlaying = true
    this.lastTickTime = performance.now()
    this.updateDisplay()
    this.animFrameId = requestAnimationFrame(t => this.loop(t))
  }

  pause() {
    this.isPlaying = false
    if (this.animFrameId) { cancelAnimationFrame(this.animFrameId); this.animFrameId = null }
    this.updateDisplay()
  }

  restart() {
    this.pause()
    this.tick = 0
    // Re-randomize failure points on restart
    if (this.scenarioKey === 'async' || this.scenarioKey === 'adversary') {
      asyncFailAt = null
      adversaryFailAt = null
    }
    this.updateDisplay()
  }

  loop(now) {
    if (!this.isPlaying) return
    if (now - this.lastTickTime >= this.tickSpeed) {
      this.lastTickTime = now
      this.tick++
      if (this.tick > this.scenario.maxTicks) { this.tick = this.scenario.maxTicks; this.pause(); return }
      this.updateDisplay()
    }
    this.animFrameId = requestAnimationFrame(t => this.loop(t))
  }

  updateDisplay() {
    const state = this.scenario.compute(this.tick)
    const viewport = this.container.querySelector(`#sim-viewport-${this.scenarioKey}`)

    const controls = {
      scenarioKey: this.scenarioKey,
      isPlaying: this.isPlaying,
      tick: this.tick,
      maxTicks: this.scenario.maxTicks
    }

    let html = ''
    if (state.type === 'normal-dual') {
      html += renderNormalChain(state, controls)
    } else if (state.type === 'assumption-dual') {
      html += renderAssumptionDualBar(state, controls)
    }

    viewport.innerHTML = html

    // Re-bind events
    const playBtn = this.container.querySelector(`#sim-play-${this.scenarioKey}`)
    const restartBtn = this.container.querySelector(`#sim-restart-${this.scenarioKey}`)
    if (playBtn) playBtn.addEventListener('click', () => this.isPlaying ? this.pause() : this.play())
    if (restartBtn) restartBtn.addEventListener('click', () => this.restart())
  }
}
