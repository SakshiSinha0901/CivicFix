import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import heroIllustration from '../assets/landing-hero-illustration.jpg'
import './LandingHero.css'

// This page is intentionally ONE fixed screen, not a normal scrolling page.
// Scrolling/swiping over it never moves the page itself -- we capture that
// input ourselves and turn it into a 0..1 "progress" number instead, which
// crossfades the hero text and the How It Works panel on top of a
// background illustration that never moves, blurs differently, or changes.
// Shown at "/" only to logged-out visitors (App.jsx decides that).
function LandingHero() {
  const stageRef = useRef(null)
  const touchStartY = useRef(0)
  const [progress, setProgress] = useState(0)
  const [navbarHeight, setNavbarHeight] = useState(80)
  const [reducedMotion, setReducedMotion] = useState(false)

  // On a narrow/phone screen, the "How it works" section (3 stacked cards
  // of text) is taller than a phone screen -- but the hijacked-scroll stage
  // above has a FIXED height and no scrolling of its own, so anything
  // taller than it just gets clipped at the bottom. Rather than trying to
  // squeeze that content to fit, mobile gets the same plain, fully-
  // scrollable fallback that reduced-motion visitors already get below --
  // it's simply the right layout for a short, narrow screen either way.
  const [isMobile, setIsMobile] = useState(false)

  // Measure the real Navbar's height instead of hardcoding a number, so
  // this keeps working even if Navbar's own padding ever changes later.
  useEffect(() => {
    const navbar = document.querySelector('.navbar')
    if (navbar) setNavbarHeight(navbar.offsetHeight)
  }, [])

  // Respect the "reduce motion" setting a visitor's OS can have turned on --
  // for them, this page skips the scroll-hijacking entirely (see the
  // fallback render below) instead of forcing the animation on everyone.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(query.matches)
  }, [])

  // Same idea as the reduced-motion check above, but for screen width.
  // matchMedia's own "change" event (rather than a one-off check) means
  // this also updates live if someone resizes the browser or rotates a
  // device, instead of only being correct at the moment the page first
  // loaded.
  useEffect(() => {
    const query = window.matchMedia('(max-width: 700px)')
    setIsMobile(query.matches)

    function handleChange(e) {
      setIsMobile(e.matches)
    }

    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  const useStaticLayout = reducedMotion || isMobile

  useEffect(() => {
    if (useStaticLayout) return // the plain fallback further down handles this case

    const stage = stageRef.current
    if (!stage) return

    // This page has nothing below it to scroll to (Navbar + stage together
    // fill the screen), but some browsers still attempt a small elastic
    // "rubber-band" scroll on wheel/touch input -- this prevents that.
    document.body.style.overflow = 'hidden'

    function addDelta(deltaY) {
      setProgress((prev) => Math.min(1, Math.max(0, prev + deltaY / 700)))
    }

    function onWheel(e) {
      e.preventDefault()
      addDelta(e.deltaY)
    }

    function onTouchStart(e) {
      touchStartY.current = e.touches[0]?.clientY ?? 0
    }

    function onTouchMove(e) {
      const y = e.touches[0]?.clientY ?? touchStartY.current
      const deltaY = touchStartY.current - y
      touchStartY.current = y
      addDelta(deltaY)
      e.preventDefault()
    }

    // { passive: false } is the important part -- browsers default
    // wheel/touchmove listeners to "passive" for scroll performance, which
    // silently ignores preventDefault() unless we explicitly opt out here.
    stage.addEventListener('wheel', onWheel, { passive: false })
    stage.addEventListener('touchstart', onTouchStart, { passive: true })
    stage.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      document.body.style.overflow = ''
      stage.removeEventListener('wheel', onWheel)
      stage.removeEventListener('touchstart', onTouchStart)
      stage.removeEventListener('touchmove', onTouchMove)
    }
  }, [useStaticLayout])

  if (useStaticLayout) {
    return (
      <div className="landing-static">
        <HeroContent />
        <HowItWorksContent />
      </div>
    )
  }

  const heroOpacity = 1 - Math.min(1, Math.max(0, progress / 0.4))
  const howOpacity = Math.min(1, Math.max(0, (progress - 0.55) / 0.35))

  return (
    <div className="landing-stage" ref={stageRef} style={{ height: `calc(100vh - ${navbarHeight}px)` }}>
      <img className="stage-bg" src={heroIllustration} alt="" aria-hidden="true" />
      <div className="stage-scrim" />

      <div
        className="stage-layer"
        style={{
          opacity: heroOpacity,
          transform: `translateY(${-(1 - heroOpacity) * 18}px)`,
          pointerEvents: heroOpacity < 0.05 ? 'none' : 'auto',
        }}
      >
        <HeroContent />
      </div>

      <div
        className="stage-layer"
        style={{
          opacity: howOpacity,
          transform: `translateY(${(1 - howOpacity) * 18}px)`,
          pointerEvents: howOpacity < 0.05 ? 'none' : 'auto',
        }}
      >
        <HowItWorksContent />
      </div>

      <div className="stage-scroll-cue" style={{ opacity: progress < 0.05 ? 1 : 0 }}>
        <span>Scroll to see how it works</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6f6a5c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      <div className="stage-back-cue" style={{ opacity: progress > 0.95 ? 1 : 0 }}>
        Scroll up to go back
      </div>
    </div>
  )
}

function HeroContent() {
  return (
    <div className="hero-content">
      <span className="hero-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#43541b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2 L14.5 9 L22 9 L16 13.5 L18 21 L12 16.5 L6 21 L8 13.5 L2 9 L9.5 9 Z" />
        </svg>
        Free for every neighborhood
      </span>

      <h1>The easiest way to report what's broken.</h1>
      <p className="hero-tagline">No forms to hunt down — just snap a photo and go.</p>

      <Link to="/signup" className="hero-cta">
        Sign Up for Free
      </Link>
      <p className="hero-trust">See it. Snap it. Get it fixed.</p>
    </div>
  )
}

function HowItWorksContent() {
  return (
    <div className="how-content">
      <p className="how-eyebrow">How it works</p>
      <h2>From spotted to fixed, in three steps</h2>
      <div className="how-steps">
        <div className="how-step">
          <div className="how-step-number">1</div>
          <h3>Report it</h3>
          <p>Snap a photo of the issue, add its location and a short description — takes less than a minute.</p>
        </div>
        <div className="how-step">
          <div className="how-step-number">2</div>
          <h3>Track it</h3>
          <p>Your report moves from Reported to In Progress as it gets picked up, right from your My Reports page.</p>
        </div>
        <div className="how-step">
          <div className="how-step-number">3</div>
          <h3>See it resolved</h3>
          <p>Once it's fixed, the status updates to Resolved — and your neighbors can see it too.</p>
        </div>
      </div>
    </div>
  )
}

export default LandingHero
