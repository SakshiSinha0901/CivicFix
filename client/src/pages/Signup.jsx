import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { API_BASE_URL } from '../config.js'
import papersIllustration from '../assets/papers-illustration.png'
import './Signup.css'

function Signup() {
  // "Controlled inputs": React keeps the current value of every field in
  // this one `form` object, and each keystroke updates it. This is what
  // lets us read the values later and send them to the server.
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault() // stop the browser's normal "reload the page" behavior
    setError('')

    // A name should be made of letters, not digits -- catches something like
    // typing "12345" into this field by mistake. Spaces, hyphens, and
    // apostrophes are allowed too, since real names use them ("Mary-Jane",
    // "O'Brien"). This regex is a "test": ^ and $ mean "the WHOLE string,
    // start to finish, must match" -- not just some piece of it.
    const NAME_PATTERN = /^[A-Za-z][A-Za-z\s'-]*$/
    if (!NAME_PATTERN.test(form.name.trim())) {
      setError('Full name can only contain letters (no numbers or symbols).')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()

      if (!response.ok) {
        // The server sends back { error: "..." } when something's wrong,
        // e.g. "An account with this email already exists."
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      // Signup succeeded. The signup route doesn't log you in automatically
      // (only /login does that), so we send the new user to the Login page.
      navigate('/login')
    } catch (err) {
      // This runs if the server isn't reachable at all (e.g. it's not running).
      setError('Could not reach the server. Is it running?')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="signup-wrap">
      {/* Everything below this comment, up to the card, is purely decorative
          hand-drawn artwork sitting in the page background -- it has no
          effect on the form, its state, or what gets submitted. */}
      <svg className="auth-doodle auth-doodle-route auth-doodle-route-left" width="360" height="300" viewBox="0 0 360 300">
        <path d="M20 30 C 90 30, 60 90, 130 100 C 200 110, 170 170, 90 190 C 40 205, 60 250, 130 260" fill="none" stroke="#211f18" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 14" />
        <circle cx="20" cy="30" r="11" fill="#43541b" />
        <text x="20" y="35" textAnchor="middle" className="auth-doodle-label">A</text>
        <g transform="translate(130,260)">
          <circle r="11" fill="#e8622c" />
          <text x="0" y="5" textAnchor="middle" className="auth-doodle-label">B</text>
        </g>
        <g transform="translate(130,100)">
          <path d="M0 -14 L12 8 L-12 8 Z" fill="none" stroke="#9c4a1d" strokeWidth="2.5" strokeLinejoin="round" />
          <text x="0" y="4" textAnchor="middle" className="auth-doodle-hazard">!</text>
        </g>
      </svg>
      <span className="auth-doodle-caption auth-doodle-caption-left">spot it &amp; report it</span>

      <img
        className="auth-doodle auth-illustration auth-illustration-signup"
        src={papersIllustration}
        alt=""
        aria-hidden="true"
      />
      <span className="auth-doodle-caption auth-doodle-caption-right">fixed by the community</span>

      <div className="signup-card">
        <div className="auth-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </div>

        <h1>Create your account</h1>
        <p className="signup-subtitle">
          Join CivicFix to report issues and track them through to resolved.
        </p>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="signup-field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Priya Sharma"
              required
            />
          </div>

          <div className="signup-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="signup-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
            <span className="signup-hint">At least 8 characters.</span>
          </div>

          {error && <p className="signup-error">{error}</p>}

          <button type="submit" className="signup-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Sign Up'}
          </button>

          <div className="signup-divider" />

          <p className="signup-footer">
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Signup
