import './style.css'
import { BlockSimulation } from './simulation.js'

// Handle fixed header — appears when scroll-content reaches the top of viewport
function handleStickyHeader() {
  const header = document.getElementById('header')
  const headerInner = document.getElementById('header-inner')
  const scrollContent = document.getElementById('scroll-content')
  if (!header || !headerInner || !scrollContent) return

  let isSticky = false

  function checkScroll() {
    const rect = scrollContent.getBoundingClientRect()
    const shouldBeSticky = rect.top <= 0

    if (shouldBeSticky !== isSticky) {
      isSticky = shouldBeSticky

      if (isSticky) {
        header.classList.remove('opacity-0')
        header.classList.add('opacity-100')
        headerInner.classList.remove('border-transparent')
        headerInner.classList.add('border-primary/20')
      } else {
        header.classList.remove('opacity-100')
        header.classList.add('opacity-0')
        headerInner.classList.remove('border-primary/20')
        headerInner.classList.add('border-transparent')
      }
    }
  }

  window.addEventListener('scroll', checkScroll, { passive: true })
  checkScroll()
}

// Scroll spy for navigation active states
function handleScrollSpy() {
  const sections = document.querySelectorAll('section[id]')
  const navLinks = document.querySelectorAll('.nav-link')

  if (!sections.length || !navLinks.length) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id')

          // Remove active from all links
          navLinks.forEach((link) => link.classList.remove('active'))

          // Add active to matching link
          const activeLink = document.querySelector(`.nav-link[href="#${id}"]`)
          if (activeLink) {
            activeLink.classList.add('active')
          }
        }
      })
    },
    {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    }
  )

  sections.forEach((section) => observer.observe(section))
}

// Lazy-init simulation when it scrolls into view, auto-play after delay
function initSimulation(containerId, scenarioKey) {
  const container = document.getElementById(containerId)
  if (!container) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sim = new BlockSimulation(container, scenarioKey)
          setTimeout(() => sim.play(), 500)
          observer.disconnect()
        }
      })
    },
    { rootMargin: '200px' }
  )

  observer.observe(container)
}

// Animate stat numbers counting up from 0
function initCountUp() {
  const els = document.querySelectorAll('[data-count-to]')
  if (!els.length) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target
          const target = parseInt(el.dataset.countTo)
          const prefix = el.dataset.countPrefix || ''
          const suffix = el.dataset.countSuffix || ''
          const duration = 1200
          const start = performance.now()

          function update(now) {
            const progress = Math.min((now - start) / duration, 1)
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = Math.round(eased * target)
            el.textContent = `${prefix}${current}${suffix}`
            if (progress < 1) requestAnimationFrame(update)
          }

          requestAnimationFrame(update)
          observer.unobserve(el)
        }
      })
    },
    { threshold: 0.5 }
  )

  els.forEach((el) => observer.observe(el))
}

// Mobile hamburger menu
function handleMobileMenu() {
  const toggle = document.getElementById('menu-toggle')
  const menu = document.getElementById('mobile-menu')
  if (!toggle || !menu) return

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.contains('flex')
    if (isOpen) {
      menu.classList.remove('flex')
      menu.classList.add('hidden')
      toggle.classList.remove('menu-open')
    } else {
      menu.classList.remove('hidden')
      menu.classList.add('flex')
      toggle.classList.add('menu-open')
    }
  })

  // Close menu when a link is clicked
  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('flex')
      menu.classList.add('hidden')
      toggle.classList.remove('menu-open')
    })
  })
}

// Run on load
document.addEventListener('DOMContentLoaded', () => {
  handleStickyHeader()
  handleScrollSpy()
  initCountUp()
  handleMobileMenu()

  // Main simulation: FCR vs Finality (positive case)
  initSimulation('sim-container', 'normal')

  // Assumptions section: failure simulations (hidden for now)
  // initSimulation('sim-async-container', 'async')
  // initSimulation('sim-adversary-container', 'adversary')
})
