/**
 * Block Simulation Animation — matches JSX reference
 * Tab 1: FCR vs Finality — two parallel chains
 * Tab 2: Async Failure — single chain with callout
 * Tab 3: >25% Adversary — single chain with vote dots + callout
 */

const TICK_MS = 900
const NUM_SLOTS = 10
const MAX_TICKS = [14, 16, 16]

// ─── Rendering helpers ───

function renderPtr(label, color) {
  return `<div style="text-align:center">
    <div style="font-size:8px;font-weight:700;letter-spacing:0.6px;color:${color};white-space:nowrap;margin-bottom:2px">${label}</div>
    <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${color};margin:0 auto"></div>
  </div>`
}

function renderBlock(status, label) {
  const colors = { empty: 'rgba(74,74,74,0.08)', proposed: '#737373', confirmed: '#F05F36', finalized: '#22aa44', stale: '#ccc' }
  if (status === 'empty') {
    return `<div style="width:40px;height:40px;border-radius:6px;background:${colors.empty};flex-shrink:0"></div>`
  }
  const border = status === 'stale' ? 'border:2px dashed #aaa;' : ''
  const opacity = status === 'stale' ? 'opacity:0.45;' : ''
  return `<div style="width:40px;height:40px;border-radius:6px;background:${colors[status] || '#737373'};${border}${opacity}display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0;transition:all 0.4s ease">${label}</div>`
}

function renderDots(filled, total, bad) {
  const color = bad ? '#cc3333' : '#F05F36'
  let html = '<div style="display:flex;gap:2px;justify-content:center;margin-top:6px">'
  for (let i = 0; i < total; i++) {
    const bg = i < filled ? color : 'rgba(74,74,74,0.12)'
    html += `<div style="width:6px;height:6px;border-radius:3px;background:${bg};transition:background 0.3s"></div>`
  }
  html += '</div>'
  return html
}

function renderBadge(text, type) {
  const styles = {
    ok: 'background:rgba(34,170,68,0.1);color:#22aa44',
    warn: 'background:rgba(204,51,51,0.08);color:#cc3333',
    info: 'background:rgba(74,74,74,0.06);color:#737373'
  }
  return `<span style="font-size:10px;font-weight:700;letter-spacing:0.4px;padding:3px 10px;border-radius:4px;${styles[type] || styles.info}">${text}</span>`
}

function renderCallout(text, type) {
  if (!text) return ''
  const isWarn = type === 'warn'
  const bg = isWarn ? 'rgba(204,51,51,0.05)' : 'rgba(34,170,68,0.05)'
  const border = isWarn ? '1px solid rgba(204,51,51,0.12)' : '1px solid rgba(34,170,68,0.12)'
  const color = isWarn ? '#cc3333' : '#22aa44'
  return `<div style="padding:10px 16px;border-radius:8px;margin-bottom:20px;background:${bg};border:${border}">
    <span style="font-size:12px;font-weight:600;color:${color};line-height:1.5">${text}</span>
  </div>`
}

function renderChain({ label, sublabel, badge, blocks, fcrAt, finAt, showVotes, votes }) {
  const slotW = 64
  const blockH = 40
  const gap = slotW - blockH

  let html = `<div style="margin-bottom:28px">`

  // Label row
  html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap">
    <span style="font-size:13px;font-weight:700;color:#000">${label}</span>
    ${sublabel ? `<span style="font-size:11px;color:#737373">${sublabel}</span>` : ''}
    ${badge ? renderBadge(badge.text, badge.type) : ''}
  </div>`

  // Slot numbers
  html += `<div style="display:flex;gap:${gap}px;margin-left:4px;margin-bottom:4px">`
  for (let i = 0; i < blocks.length; i++) {
    html += `<div style="width:${blockH}px;text-align:center;font-size:9px;color:#737373;font-weight:600">${i}</div>`
  }
  html += '</div>'

  // FCR pointer row (above blocks)
  html += `<div style="display:flex;gap:${gap}px;margin-left:4px;height:20px;margin-bottom:2px">`
  for (let i = 0; i < blocks.length; i++) {
    html += `<div style="width:${blockH}px;display:flex;justify-content:center">`
    if (i === fcrAt) html += renderPtr('CONFIRMED', '#F05F36')
    html += '</div>'
  }
  html += '</div>'

  // Blocks
  html += `<div style="display:flex;gap:${gap}px;margin-left:4px">`
  for (let i = 0; i < blocks.length; i++) {
    html += renderBlock(blocks[i].status, blocks[i].label)
  }
  html += '</div>'

  // Finalized pointer row (below blocks)
  html += `<div style="display:flex;gap:${gap}px;margin-left:4px;height:20px;margin-top:2px">`
  for (let i = 0; i < blocks.length; i++) {
    html += `<div style="width:${blockH}px;display:flex;justify-content:center">`
    if (i === finAt && finAt >= 0) html += renderPtr('FINALIZED', '#22aa44')
    html += '</div>'
  }
  html += '</div>'

  // Vote dots
  if (showVotes && votes) {
    html += `<div style="display:flex;gap:${gap}px;margin-left:4px;margin-top:2px">`
    for (let i = 0; i < votes.length; i++) {
      html += `<div style="width:${blockH}px">`
      if (votes[i] !== null) html += renderDots(votes[i].n, 6, votes[i].bad)
      html += '</div>'
    }
    html += '</div>'
  }

  html += '</div>'
  return html
}

// ─── Scenario logic (matches JSX reference) ───

function mkBlocks(n) {
  return Array.from({ length: NUM_SLOTS }).map((_, i) =>
    i < n ? { status: 'proposed', label: i } : { status: 'empty', label: '' }
  )
}

function computeNormal(tick) {
  const n = Math.min(tick, NUM_SLOTS)

  // FCR chain
  const fcrBlocks = mkBlocks(n).map((b, i) => {
    if (b.status === 'empty') return b
    if (i <= Math.max(tick - 8, -1)) return { ...b, status: 'finalized' }
    if (i <= tick - 1) return { ...b, status: 'confirmed' }
    return b
  })

  // Finality-only chain
  const finBlocks = mkBlocks(n).map((b, i) => {
    if (b.status === 'empty') return b
    if (i <= Math.max(tick - 8, -1)) return { ...b, status: 'finalized' }
    return b
  })

  const fcrPtr = n > 0 ? Math.min(tick - 1, n - 1) : -1
  const finPtr = Math.max(tick - 8, -1)
  const finPtrClamped = finPtr >= 0 && finPtr < n ? finPtr : -1

  return {
    type: 'dual',
    fcr: { label: 'With FCR', sublabel: 'confirmed pointer advances each slot', badge: n > 0 ? { text: 'CONFIRMING', type: 'ok' } : null, blocks: fcrBlocks, fcrAt: fcrPtr >= 0 ? fcrPtr : -1, finAt: finPtrClamped },
    ffg: { label: 'Without FCR', sublabel: 'wait ~2 epochs for finality (~64 slots)', badge: finPtrClamped >= 0 ? { text: 'FINALIZING', type: 'info' } : { text: 'WAITING', type: 'info' }, blocks: finBlocks, fcrAt: -1, finAt: finPtrClamped },
    callout: null
  }
}

function computeAsync(tick) {
  const asyncAt = 5, resetAt = 12, finSlot = 2
  const n = Math.min(tick, NUM_SLOTS)

  const blocks = mkBlocks(n).map((b, i) => {
    if (b.status === 'empty') return b
    if (tick >= resetAt && i > finSlot) return { ...b, status: 'stale' }
    if (i <= finSlot) return { ...b, status: 'finalized' }
    if (tick < asyncAt && i <= tick - 1) return { ...b, status: 'confirmed' }
    if (tick >= asyncAt && i < asyncAt && i <= asyncAt - 1) return { ...b, status: 'confirmed' }
    return b
  })

  let fcrPtr
  if (tick < 1) fcrPtr = -1
  else if (tick < asyncAt) fcrPtr = Math.min(tick - 1, n - 1)
  else if (tick < resetAt) fcrPtr = asyncAt - 1
  else fcrPtr = finSlot

  let sublabel, badge
  if (tick < asyncAt) { sublabel = 'confirming normally...'; badge = { text: 'CONFIRMING', type: 'ok' } }
  else if (tick < resetAt) { sublabel = 'attestations delayed, FCR frozen'; badge = { text: 'STALLED', type: 'warn' } }
  else { sublabel = 'reset to finalized'; badge = { text: 'RESET', type: 'info' } }

  let callout = null
  if (tick >= asyncAt && tick < resetAt)
    callout = { text: `\u26a0 Slot ${asyncAt}+: Attestations delayed beyond synchrony bound. FCR cannot verify LMD dominance. Confirmed pointer frozen at slot ${asyncAt - 1}.`, type: 'warn' }
  else if (tick >= resetAt)
    callout = { text: `\u2713 FCR resets confirmed pointer to last finalized block (slot ${finSlot}). Safety preserved \u2014 no invalid confirmation was made. Once synchrony resumes, FCR will begin confirming again.`, type: 'ok' }

  return {
    type: 'single',
    chain: { label: 'FCR under async conditions', sublabel, badge, blocks, fcrAt: fcrPtr, finAt: finSlot },
    callout
  }
}

function computeAdversary(tick) {
  const attackAt = 5, resetAt = 13, finSlot = 2
  const n = Math.min(tick, NUM_SLOTS)

  const blocks = mkBlocks(n).map((b, i) => {
    if (b.status === 'empty') return b
    if (tick >= resetAt && i > finSlot) return { ...b, status: 'stale' }
    if (i <= finSlot) return { ...b, status: 'finalized' }
    if (i < attackAt && i <= Math.min(tick - 1, attackAt - 1)) return { ...b, status: 'confirmed' }
    return b
  })

  let fcrPtr
  if (tick < 1) fcrPtr = -1
  else if (tick < attackAt) fcrPtr = Math.min(tick - 1, n - 1)
  else if (tick < resetAt) fcrPtr = attackAt - 1
  else fcrPtr = finSlot

  // Votes: 6 dots per slot. Before attack: 5/6 honest. After: 4/6 adversary-colored
  const votes = Array.from({ length: NUM_SLOTS }).map((_, i) => {
    if (i >= n) return null
    if (i >= attackAt) return { n: 4, bad: true }
    return { n: 5, bad: false }
  })

  let sublabel, badge
  if (tick < attackAt) { sublabel = 'confirming normally, >75% honest...'; badge = { text: 'CONFIRMING', type: 'ok' } }
  else if (tick < resetAt) { sublabel = 'adversary withholding votes'; badge = { text: 'STALLED', type: 'warn' } }
  else { sublabel = 'reset to finalized'; badge = { text: 'RESET', type: 'info' } }

  let callout = null
  if (tick >= attackAt && tick < resetAt)
    callout = { text: `\u26a0 Slot ${attackAt}+: Adversary (>25% stake) withholding attestations. Insufficient vote weight to pass confirmation. FCR cannot advance \u2014 this is a liveness failure, NOT a safety failure.`, type: 'warn' }
  else if (tick >= resetAt)
    callout = { text: `\u2713 FCR resets to finalized (slot ${finSlot}). Key point: the adversary stalled confirmation but could NOT reorg any previously confirmed block. Reorg would require >50% of active validators.`, type: 'ok' }

  return {
    type: 'single',
    chain: { label: 'FCR under >25% adversarial stake', sublabel, badge, blocks, fcrAt: fcrPtr, finAt: finSlot, showVotes: true, votes },
    callout
  }
}

// ─── Main class ───

const SCENARIOS = [
  { label: 'FCR vs Finality', desc: 'Normal conditions \u2014 FCR confirms in ~1 slot while finality takes ~2 epochs', compute: computeNormal, legend: ['proposed', 'confirmed', 'finalized'] },
  { label: 'Async Failure', desc: 'Network asynchrony causes attestations to arrive late. FCR stalls, then resets to finalized.', compute: computeAsync, legend: ['proposed', 'confirmed', 'finalized', 'stale'] },
  { label: '>25% Adversary', desc: 'Adversary withholds votes. FCR cannot confirm \u2014 liveness failure (not safety failure).', compute: computeAdversary, legend: ['proposed', 'confirmed', 'finalized', 'stale', 'adversary'] }
]

export class BlockSimulation {
  constructor(container) {
    this.container = container
    this.tabIdx = 0
    this.tick = 0
    this.isPlaying = false
    this.animFrameId = null
    this.lastTickTime = 0

    this.render()
    this.setTab(0)
  }

  render() {
    this.container.innerHTML = `
      <div class="space-y-5">
        <div class="flex flex-wrap gap-1" id="sim-tabs"></div>
        <p class="text-text-muted text-sm" id="sim-desc"></p>
        <div class="flex items-center gap-2">
          <button class="border border-text/12 bg-white text-text text-xs font-semibold px-3.5 py-1.5 rounded-md cursor-pointer hover:bg-text/5 transition-colors" id="sim-restart">Restart</button>
          <button class="border border-text/12 bg-white text-text text-xs font-semibold px-3.5 py-1.5 rounded-md cursor-pointer hover:bg-text/5 transition-colors" id="sim-play">Play</button>
        </div>
        <div class="flex flex-wrap gap-5 text-[11px] text-text-muted" id="sim-legend"></div>
        <div id="sim-viewport" style="min-height:280px;overflow:hidden"></div>
        <div class="flex items-center gap-3">
          <span class="text-[10px] text-text-muted font-semibold" style="width:60px" id="sim-slot">Slot 0</span>
          <div class="flex-1 h-1 rounded-sm" style="background:rgba(74,74,74,0.08)">
            <div class="h-1 rounded-sm bg-primary transition-[width] duration-400" id="sim-progress" style="width:0%"></div>
          </div>
        </div>
      </div>
    `

    this.container.querySelector('#sim-play').addEventListener('click', () => this.isPlaying ? this.pause() : this.play())
    this.container.querySelector('#sim-restart').addEventListener('click', () => this.restart())
  }

  renderTabs() {
    const el = this.container.querySelector('#sim-tabs')
    el.innerHTML = SCENARIOS.map((s, i) =>
      `<button class="sim-tab ${i === this.tabIdx ? 'active' : ''}" data-idx="${i}">${s.label}</button>`
    ).join('')
    el.querySelectorAll('.sim-tab').forEach(btn => {
      btn.addEventListener('click', () => this.setTab(parseInt(btn.dataset.idx)))
    })
  }

  renderLegend() {
    const defs = {
      proposed: { color: '#737373', label: 'Proposed' },
      confirmed: { color: '#F05F36', label: 'Confirmed (FCR)' },
      finalized: { color: '#22aa44', label: 'Finalized (FFG)' },
      stale: { color: '#ccc', label: 'Stale (reset)', border: '2px dashed #aaa', opacity: '0.5' },
      adversary: { color: '#cc3333', label: 'Adversarial votes' }
    }
    const items = SCENARIOS[this.tabIdx].legend
    this.container.querySelector('#sim-legend').innerHTML = items.map(k => {
      const d = defs[k]
      const style = `width:14px;height:14px;border-radius:4px;background:${d.color};${d.border ? 'border:' + d.border + ';' : ''}${d.opacity ? 'opacity:' + d.opacity + ';' : ''}`
      return `<div class="flex items-center gap-1.5"><div style="${style}"></div><span>${d.label}</span></div>`
    }).join('')
  }

  setTab(idx) {
    this.tabIdx = idx
    this.tick = 0
    this.isPlaying = false
    this.container.querySelector('#sim-play').textContent = 'Play'
    this.container.querySelector('#sim-desc').textContent = SCENARIOS[idx].desc
    this.renderTabs()
    this.renderLegend()
    this.updateDisplay()
  }

  play() {
    if (this.tick >= MAX_TICKS[this.tabIdx]) this.tick = 0
    this.isPlaying = true
    this.container.querySelector('#sim-play').textContent = 'Pause'
    this.lastTickTime = performance.now()
    this.animFrameId = requestAnimationFrame(t => this.loop(t))
  }

  pause() {
    this.isPlaying = false
    this.container.querySelector('#sim-play').textContent = 'Play'
    if (this.animFrameId) { cancelAnimationFrame(this.animFrameId); this.animFrameId = null }
  }

  restart() { this.pause(); this.tick = 0; this.updateDisplay() }

  loop(now) {
    if (!this.isPlaying) return
    if (now - this.lastTickTime >= TICK_MS) {
      this.lastTickTime = now
      this.tick++
      if (this.tick > MAX_TICKS[this.tabIdx]) { this.tick = MAX_TICKS[this.tabIdx]; this.pause(); return }
      this.updateDisplay()
    }
    this.animFrameId = requestAnimationFrame(t => this.loop(t))
  }

  updateDisplay() {
    const scenario = SCENARIOS[this.tabIdx]
    const state = scenario.compute(this.tick)
    const viewport = this.container.querySelector('#sim-viewport')

    let html = ''
    if (state.type === 'dual') {
      html += renderChain(state.fcr)
      html += renderChain(state.ffg)
    } else {
      html += renderChain(state.chain)
    }
    if (state.callout) html += renderCallout(state.callout.text, state.callout.type)
    viewport.innerHTML = html

    const max = MAX_TICKS[this.tabIdx]
    const pct = (Math.min(this.tick, max) / max) * 100
    this.container.querySelector('#sim-progress').style.width = `${pct}%`
    this.container.querySelector('#sim-slot').textContent = `Slot ${Math.min(this.tick, NUM_SLOTS)}`
  }
}
