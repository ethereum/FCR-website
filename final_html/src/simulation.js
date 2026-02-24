/**
 * Block Simulation Animation
 * Three scenarios: FCR vs Finality, Async Failure, >25% Adversary
 */

const TICK_MS = 900
const TOTAL_SLOTS = 12

const SCENARIOS = {
  normal: {
    label: 'FCR vs Finality',
    description: 'FCR confirms each slot instantly. Finality lags ~8 slots behind.',
    getBlockState(slot, tick) {
      // FCR confirms immediately, finality lags 8 slots
      const confirmedSlot = tick
      const finalizedSlot = Math.max(0, tick - 8)
      const blocks = []
      for (let i = 0; i <= Math.min(tick, TOTAL_SLOTS - 1); i++) {
        let state = 'proposed'
        if (i <= finalizedSlot) state = 'finalized'
        else if (i <= confirmedSlot) state = 'confirmed'
        blocks.push({ slot: i, state })
      }
      return { blocks, confirmedSlot: Math.min(confirmedSlot, TOTAL_SLOTS - 1), finalizedSlot, callout: null }
    }
  },
  async_failure: {
    label: 'Async Failure',
    description: 'After 5 normal slots, attestations are delayed. FCR stalls and resets to finalized.',
    getBlockState(slot, tick) {
      const failAt = 5
      const blocks = []
      const finalizedSlot = Math.max(0, Math.min(tick, failAt) - 8)
      let confirmedSlot

      if (tick <= failAt) {
        confirmedSlot = tick
        for (let i = 0; i <= Math.min(tick, TOTAL_SLOTS - 1); i++) {
          let state = 'proposed'
          if (i <= finalizedSlot) state = 'finalized'
          else if (i <= confirmedSlot) state = 'confirmed'
          blocks.push({ slot: i, state })
        }
        return { blocks, confirmedSlot, finalizedSlot, callout: null }
      }

      // After failure: blocks after failAt become stale, confirmed resets to finalized
      confirmedSlot = Math.max(0, finalizedSlot)
      for (let i = 0; i <= Math.min(tick, TOTAL_SLOTS - 1); i++) {
        let state
        if (i <= finalizedSlot) state = 'finalized'
        else if (i <= failAt) state = 'confirmed'
        else state = 'stale'
        blocks.push({ slot: i, state })
      }

      // After stalling, reset confirmed pointer back to finalized
      const callout = tick === failAt + 1
        ? 'Attestations delayed — FCR stalls'
        : tick >= failAt + 2
          ? 'Confirmed pointer resets to finalized block'
          : null

      return { blocks, confirmedSlot, finalizedSlot, callout }
    }
  },
  adversary: {
    label: '>25% Adversary',
    description: 'After 5 normal slots, an adversary withholds votes. FCR stalls (liveness failure). Resets to finalized.',
    getBlockState(slot, tick) {
      const failAt = 5
      const blocks = []
      const finalizedSlot = Math.max(0, Math.min(tick, failAt) - 8)
      let confirmedSlot

      if (tick <= failAt) {
        confirmedSlot = tick
        for (let i = 0; i <= Math.min(tick, TOTAL_SLOTS - 1); i++) {
          let state = 'proposed'
          if (i <= finalizedSlot) state = 'finalized'
          else if (i <= confirmedSlot) state = 'confirmed'
          blocks.push({ slot: i, state })
        }
        return { blocks, confirmedSlot, finalizedSlot, callout: null, showVotes: false }
      }

      confirmedSlot = Math.max(0, finalizedSlot)
      for (let i = 0; i <= Math.min(tick, TOTAL_SLOTS - 1); i++) {
        let state
        if (i <= finalizedSlot) state = 'finalized'
        else if (i <= failAt) state = 'confirmed'
        else state = 'stale'
        blocks.push({ slot: i, state })
      }

      const callout = tick === failAt + 1
        ? 'Adversary withholds votes — liveness failure'
        : tick >= failAt + 2
          ? 'FCR stalls. No incorrect confirmation issued.'
          : null

      return { blocks, confirmedSlot, finalizedSlot, callout, showVotes: true, failAt }
    }
  }
}

export class BlockSimulation {
  constructor(container) {
    this.container = container
    this.scenario = 'normal'
    this.tick = 0
    this.isPlaying = false
    this.animFrameId = null
    this.lastTickTime = 0

    this.render()
    this.setScenario('normal')
  }

  render() {
    this.container.innerHTML = `
      <div class="space-y-6">
        <!-- Tabs -->
        <div class="flex flex-wrap gap-2">
          <button class="sim-tab active" data-scenario="normal">FCR vs Finality</button>
          <button class="sim-tab" data-scenario="async_failure">Async Failure</button>
          <button class="sim-tab" data-scenario="adversary">&gt;25% Adversary</button>
        </div>

        <!-- Description -->
        <p class="text-text-muted text-sm" id="sim-description"></p>

        <!-- Viewport -->
        <div class="relative bg-text/5 rounded-2xl p-6 md:p-8 min-h-[160px]" id="sim-viewport">
          <div class="flex gap-3 items-end pb-8 overflow-x-auto" id="sim-blocks"></div>
          <div id="sim-votes" class="mt-4 hidden"></div>
        </div>

        <!-- Callout -->
        <div class="text-sm font-medium text-primary h-6" id="sim-callout"></div>

        <!-- Progress bar -->
        <div class="sim-progress">
          <div class="sim-progress-bar" id="sim-progress" style="width: 0%"></div>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-4">
          <button class="bg-primary text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-primary-dark transition-colors" id="sim-play">Play</button>
          <button class="border-2 border-primary text-primary text-sm font-medium px-4 py-2 rounded-full hover:bg-primary hover:text-background transition-colors" id="sim-restart">Restart</button>
          <span class="text-text-muted text-xs ml-auto" id="sim-slot-label">Slot 0 / ${TOTAL_SLOTS - 1}</span>
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap gap-4 text-xs text-text-muted">
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded bg-[#d1d5db]"></div>
            <span>Proposed</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded bg-primary"></div>
            <span>Confirmed (FCR)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded bg-green"></div>
            <span>Finalized</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded border-2 border-dashed border-[#d1d5db]"></div>
            <span>Stale</span>
          </div>
        </div>
      </div>
    `

    // Bind events
    this.container.querySelectorAll('.sim-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.setScenario(tab.dataset.scenario)
      })
    })

    this.container.querySelector('#sim-play').addEventListener('click', () => {
      if (this.isPlaying) {
        this.pause()
      } else {
        this.play()
      }
    })

    this.container.querySelector('#sim-restart').addEventListener('click', () => {
      this.restart()
    })
  }

  setScenario(name) {
    this.scenario = name
    this.tick = 0
    this.isPlaying = false

    // Update tabs
    this.container.querySelectorAll('.sim-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.scenario === name)
    })

    // Update description
    this.container.querySelector('#sim-description').textContent = SCENARIOS[name].description

    // Update play button
    this.container.querySelector('#sim-play').textContent = 'Play'

    this.updateDisplay()
  }

  play() {
    if (this.tick >= TOTAL_SLOTS - 1) {
      this.tick = 0
    }
    this.isPlaying = true
    this.container.querySelector('#sim-play').textContent = 'Pause'
    this.lastTickTime = performance.now()
    this.animFrameId = requestAnimationFrame((t) => this.loop(t))
  }

  pause() {
    this.isPlaying = false
    this.container.querySelector('#sim-play').textContent = 'Play'
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }

  restart() {
    this.pause()
    this.tick = 0
    this.updateDisplay()
  }

  loop(currentTime) {
    if (!this.isPlaying) return

    if (currentTime - this.lastTickTime >= TICK_MS) {
      this.lastTickTime = currentTime
      this.tick++

      if (this.tick >= TOTAL_SLOTS) {
        this.tick = TOTAL_SLOTS - 1
        this.pause()
        return
      }

      this.updateDisplay()
    }

    this.animFrameId = requestAnimationFrame((t) => this.loop(t))
  }

  updateDisplay() {
    const scenario = SCENARIOS[this.scenario]
    const state = scenario.getBlockState(this.tick, this.tick)
    const blocksContainer = this.container.querySelector('#sim-blocks')
    const votesContainer = this.container.querySelector('#sim-votes')
    const calloutEl = this.container.querySelector('#sim-callout')
    const progressEl = this.container.querySelector('#sim-progress')
    const slotLabel = this.container.querySelector('#sim-slot-label')

    // Render blocks
    let blocksHtml = ''
    state.blocks.forEach(block => {
      const hasConfirmedPtr = block.slot === state.confirmedSlot && block.state !== 'stale'
      const hasFinalizedPtr = block.slot === state.finalizedSlot && state.finalizedSlot >= 0
      blocksHtml += `
        <div class="relative">
          <div class="sim-block ${block.state}">${block.slot}</div>
          ${hasConfirmedPtr ? '<div class="sim-pointer confirmed-ptr">CONFIRMED</div>' : ''}
          ${hasFinalizedPtr && block.slot !== state.confirmedSlot ? '<div class="sim-pointer finalized-ptr">FINALIZED</div>' : ''}
          ${hasFinalizedPtr && block.slot === state.confirmedSlot ? '' : ''}
        </div>
      `
    })
    blocksContainer.innerHTML = blocksHtml

    // Render vote dots for adversary scenario
    if (this.scenario === 'adversary' && state.showVotes) {
      votesContainer.classList.remove('hidden')
      let votesHtml = '<div class="text-xs text-text-muted mb-2 font-medium">Attestation weight per slot:</div><div class="flex gap-3">'
      state.blocks.forEach(block => {
        if (block.slot > state.failAt) {
          votesHtml += '<div class="flex gap-0.5">'
          for (let i = 0; i < 6; i++) {
            const cls = i < 2 ? 'adversary' : (i < 4 ? 'honest' : 'pending')
            votesHtml += `<div class="sim-vote-dot ${cls}"></div>`
          }
          votesHtml += '</div>'
        } else {
          votesHtml += '<div class="flex gap-0.5">'
          for (let i = 0; i < 6; i++) {
            votesHtml += `<div class="sim-vote-dot honest"></div>`
          }
          votesHtml += '</div>'
        }
      })
      votesHtml += '</div>'
      votesContainer.innerHTML = votesHtml
    } else {
      votesContainer.classList.add('hidden')
      votesContainer.innerHTML = ''
    }

    // Callout
    calloutEl.textContent = state.callout || ''

    // Progress
    const progress = (this.tick / (TOTAL_SLOTS - 1)) * 100
    progressEl.style.width = `${progress}%`

    // Slot label
    slotLabel.textContent = `Slot ${this.tick} / ${TOTAL_SLOTS - 1}`
  }
}
