import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Navbar.css'

function Navbar() {
  const { isLoggedIn, user, logout } = useAuth()
  const navigate = useNavigate()

  // Tracks whether the mobile dropdown menu is open. Only matters on
  // narrow screens -- on desktop the CSS ignores this entirely and the
  // links/buttons just sit inline in the row like before.
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinkClass = ({ isActive }) =>
    isActive ? 'nav-link nav-link-active' : 'nav-link'

  function handleLogout() {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  // Every link/button inside the mobile dropdown calls this on click, so
  // tapping one also closes the menu -- otherwise the dropdown would stay
  // open and sit on top of whichever page you just navigated to.
  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand" onClick={closeMenu}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#43541b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        <span>CivicFix</span>
      </NavLink>

      {/* Hamburger / close button. CSS hides this completely on desktop
          (see Navbar.css) and only shows it once the screen is too narrow
          for the full row of links and buttons. The aria-* attributes
          exist because visually this is just an icon -- they tell a
          screen reader what it actually does. */}
      <button
        type="button"
        className="navbar-toggle"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#211f18" strokeWidth="2.3" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#211f18" strokeWidth="2.3" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {/* On desktop, Navbar.css makes this wrapper "invisible" as a box
          (display: contents), so navbar-links and navbar-actions behave
          exactly as if they were direct children of <nav> -- the original
          layout is completely unchanged. Below the mobile breakpoint, it
          instead becomes a real dropdown panel, shown only while menuOpen
          is true. */}
      <div className={menuOpen ? 'navbar-menu navbar-menu-open' : 'navbar-menu'}>
        <div className="navbar-links">
          <NavLink to="/" end className={navLinkClass} onClick={closeMenu}>
            Home
          </NavLink>
          <NavLink to="/report" className={navLinkClass} onClick={closeMenu}>
            Report Issue
          </NavLink>
          <NavLink to="/my-reports" className={navLinkClass} onClick={closeMenu}>
            My Reports
          </NavLink>
        </div>

        <div className="navbar-actions">
          {isLoggedIn ? (
            <>
              <span className="navbar-greeting">Hi, {user.name.split(' ')[0]}</span>
              <button type="button" className="btn btn-outline" onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-outline" onClick={closeMenu}>
                Log In
              </NavLink>
              <NavLink to="/signup" className="btn btn-solid" onClick={closeMenu}>
                Sign Up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
