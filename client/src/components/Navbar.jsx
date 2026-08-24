import { NavLink } from 'react-router-dom'
import './Navbar.css'

// The Navbar is a "component" — a self-contained, reusable piece of UI.
// We only write it once here, and every page can reuse it just by
// rendering <Navbar /> — that's the whole point of components in React.
function Navbar() {
  const navLinkClass = ({ isActive }) =>
    isActive ? 'nav-link nav-link-active' : 'nav-link'

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        <span>CivicFix</span>
      </NavLink>

      <div className="navbar-links">
        <NavLink to="/" end className={navLinkClass}>
          Home
        </NavLink>
        <NavLink to="/report" className={navLinkClass}>
          Report Issue
        </NavLink>
        <NavLink to="/my-reports" className={navLinkClass}>
          My Reports
        </NavLink>
      </div>

      <div className="navbar-actions">
        <NavLink to="/login" className="btn btn-outline">
          Log In
        </NavLink>
        <NavLink to="/signup" className="btn btn-solid">
          Sign Up
        </NavLink>
      </div>
    </nav>
  )
}

export default Navbar
