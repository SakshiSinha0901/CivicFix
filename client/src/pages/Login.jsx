import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Login.css'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

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
        // e.g. "Invalid email or password."
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      // Login succeeded -- the server sent back a JWT (the signed "ID card"
      // we talked about) plus the user's basic info. We save both in the
      // browser's localStorage, which is just a small storage box built
      // into the browser that survives page reloads -- so the person
      // doesn't have to log in again every time they refresh the page.
      localStorage.setItem('civicfix_token', data.token)
      localStorage.setItem('civicfix_user', JSON.stringify(data.user))

      navigate('/')
    } catch (err) {
      setError('Could not reach the server. Is it running?')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
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
