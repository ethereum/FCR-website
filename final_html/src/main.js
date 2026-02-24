import './style.css'
import { BlockSimulation } from './simulation.js'

// Handle sticky header state
function handleStickyHeader() {
  const headerInner = document.getElementById('header-inner')
  const headerNav = document.getElementById('header-nav')
  const subtitle = document.getElementById('header-subtitle')
  if (!headerInner || !subtitle) return

  let isSticky = false

  function checkScroll() {
    const scrollY = window.scrollY
    const shouldBeSticky = scrollY > 50

    if (shouldBeSticky !== isSticky) {
      isSticky = shouldBeSticky

      if (isSticky) {
        // Sticky state: show border, smaller nav font
        headerInner.classList.remove('border-transparent')
        headerInner.classList.add('border-primary')
        if (headerNav) headerNav.classList.add('sticky')
      } else {
        // Normal state: hide border, normal nav font
        headerInner.classList.remove('border-primary')
        headerInner.classList.add('border-transparent')
        if (headerNav) headerNav.classList.remove('sticky')
      }
    }
  }

  window.addEventListener('scroll', checkScroll, { passive: true })
  checkScroll() // Initial check
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

// Lazy-init simulation when it scrolls into view
function initSimulation() {
  const container = document.getElementById('sim-container')
  if (!container) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          new BlockSimulation(container)
          observer.disconnect()
        }
      })
    },
    { rootMargin: '200px' }
  )

  observer.observe(container)
}

// Run on load
document.addEventListener('DOMContentLoaded', () => {
  handleStickyHeader()
  handleScrollSpy()
  initSimulation()
})
