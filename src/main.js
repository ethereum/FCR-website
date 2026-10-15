import './style.css'

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

// Animate stat numbers counting up from 0
function initCountUp() {
  const els = document.querySelectorAll('[data-count-to]')
  if (!els.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

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

  function setOpen(open) {
    menu.classList.toggle('hidden', !open)
    menu.classList.toggle('flex', open)
    toggle.classList.toggle('menu-open', open)
    toggle.setAttribute('aria-expanded', String(open))
  }
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'))
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)))
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false)
      toggle.focus()
    }
  })
  window.matchMedia('(min-width: 1024px)').addEventListener('change', event => {
    if (event.matches) setOpen(false)
  })
}

// Run on load
document.addEventListener('DOMContentLoaded', () => {
  handleScrollSpy()
  initCountUp()
  handleMobileMenu()

})
