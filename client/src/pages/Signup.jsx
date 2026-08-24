import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('http://localhost:3000/api/auth/signup', {
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
      <div className="signup-card">
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
