import './style.css'

// Animate hero number from 0 to 13
function animateNumber() {
  const element = document.getElementById('hero-number')
  if (!element) return

  const target = 13
  const duration = 1500
  const start = performance.now()

  function update(currentTime) {
    const elapsed = currentTime - start
    const progress = Math.min(elapsed / duration, 1)

    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3)
    const current = Math.round(easeOut * target)

    element.textContent = current

    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }

  requestAnimationFrame(update)
}

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
        // Sticky state: hide subtitle, show border, smaller nav font
        subtitle.style.opacity = '0'
        subtitle.style.height = '0'
        subtitle.style.overflow = 'hidden'
        headerInner.classList.remove('border-transparent')
        headerInner.classList.add('border-primary')
        if (headerNav) headerNav.classList.add('sticky')
      } else {
        // Normal state: show subtitle, hide border, normal nav font
        subtitle.style.opacity = '1'
        subtitle.style.height = 'auto'
        subtitle.style.overflow = 'visible'
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

// Run on load
document.addEventListener('DOMContentLoaded', () => {
  animateNumber()
  handleStickyHeader()
  handleScrollSpy()
})
