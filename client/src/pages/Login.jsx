import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import runningIllustration from '../assets/running-illustration.png'
import './Login.css'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      // Instead of writing to localStorage directly (like before), we now
      // hand the token/user to the shared AuthContext "bulletin board" --
      // it takes care of saving them AND instantly updates every component
      // reading from it, like the Navbar.
      login(data.token, data.user)

      navigate('/')
    } catch (err) {
      setError('Could not reach the server. Is it running?')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-wrap">
      {/* Same idea as the Signup page: purely decorative hand-drawn artwork
          in the background, mirrored left/right so the two auth pages feel
          like one consistent pair. None of this affects the form. */}
      <img
        className="auth-doodle auth-illustration auth-illustration-login"
        src={runningIllustration}
        alt=""
        aria-hidden="true"
      />
      <span className="auth-doodle-caption auth-doodle-caption-left">back to make things better</span>

      <svg className="auth-doodle auth-doodle-route auth-doodle-route-right" width="360" height="300" viewBox="0 0 360 300">
        <path d="M340 30 C 270 30, 300 90, 230 100 C 160 110, 190 170, 270 190 C 320 205, 300 250, 230 260" fill="none" stroke="#211f18" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 14" />
        <circle cx="340" cy="30" r="11" fill="#43541b" />
        <text x="340" y="35" textAnchor="middle" className="auth-doodle-label">A</text>
        <g transform="translate(230,260)">
          <circle r="11" fill="#e8622c" />
          <text x="0" y="5" textAnchor="middle" className="auth-doodle-label">B</text>
        </g>
        <g transform="translate(230,100)">
          <path d="M0 -14 L12 8 L-12 8 Z" fill="none" stroke="#9c4a1d" strokeWidth="2.5" strokeLinejoin="round" />
          <text x="0" y="4" textAnchor="middle" className="auth-doodle-hazard">!</text>
        </g>
      </svg>
      <span className="auth-doodle-caption auth-doodle-caption-right">every report counts</span>

      <div className="login-card">
        <div className="auth-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </div>

        <h1>Welcome back</h1>
        <p className="login-subtitle">
          Log in to report issues and track the ones you follow.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
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

          <div className="login-field">
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
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Log In'}
          </button>

          <div className="login-divider" />

          <p className="login-footer">
            New to CivicFix? <Link to="/signup">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Login
