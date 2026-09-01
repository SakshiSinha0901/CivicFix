import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import IssueCard from '../components/IssueCard.jsx'
import { API_BASE_URL } from '../config.js'
import './MyReports.css'

// The three real statuses an issue can have, plus "all" as the default tab.
// Order matters -- it's the order the tiles render in. `iconBg`/`iconColor`
// give each tile's icon circle the same tint as that status's badge
// elsewhere in the app (IssueCard, Issue Detail) -- "all" isn't a real
// status, so it gets the same neutral treatment as the category badge
// instead of a status color, and (per the developer's request) the same
// plain white card as the other three rather than a solid fill.
const STATUS_TABS = [
  { key: 'all', label: 'All Reports', iconBg: '#f9f8f2', iconBorder: '#e6e2d2', iconColor: '#211f18' },
  { key: 'reported', label: 'Reported', iconBg: '#f6e2d3', iconColor: '#9c4a1d' },
  { key: 'in_progress', label: 'In Progress', iconBg: '#f4ecc9', iconColor: '#7a5c12' },
  { key: 'resolved', label: 'Resolved', iconBg: '#dfe8cd', iconColor: '#45571f' },
]

function TabIcon({ tabKey, color }) {
  if (tabKey === 'all') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h16M4 6h16M4 18h16" />
      </svg>
    )
  }
  if (tabKey === 'reported') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l2.5 2.5" />
      </svg>
    )
  }
  if (tabKey === 'in_progress') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function MyReports() {
  const { token, isLoggedIn } = useAuth()

  const [issues, setIssues] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoading(false)
      return
    }

    async function fetchMyIssues() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/issues/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Something went wrong while loading your reports.')
          return
        }

        setIssues(data.issues)
      } catch (err) {
        setError('Could not reach the server. Is it running?')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyIssues()
  }, [isLoggedIn, token])

  if (!isLoggedIn) {
    return (
      <div className="myreports-locked">
        <h1>Log in to see your reports</h1>
        <p className="myreports-subtitle">Everything you've reported will show up here.</p>
        <Link to="/login" className="myreports-locked-btn">
          Log In
        </Link>
      </div>
    )
  }

  // Counting and filtering happen client-side against the one fetch above --
  // the whole list is small enough per user that a second request per tab
  // isn't worth it. This logic is unchanged from before -- only the tiles'
  // markup/styling below is new.
  const counts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === 'all' ? issues.length : issues.filter((issue) => issue.status === tab.key).length
    return acc
  }, {})

  const visibleIssues = activeTab === 'all' ? issues : issues.filter((issue) => issue.status === activeTab)

  return (
    <div className="myreports-page">
      {/* Purely decorative -- same hand-drawn dashed-route family used
          elsewhere (Signup/Login, Issue Detail's corner doodle). */}
      <svg className="myreports-doodle" width="140" height="110" viewBox="0 0 140 110" aria-hidden="true">
        <path
          d="M120 8 C 95 8, 108 40, 76 44 C 48 48, 56 76, 92 84"
          fill="none"
          stroke="#211f18"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="1 12"
        />
        <circle cx="120" cy="8" r="6" fill="#e8622c" />
      </svg>

      <div className="myreports-header">
        <div>
          <h1>My Reports</h1>
          <p className="myreports-subtitle">Everything you've reported, in one place.</p>
        </div>
      </div>

      {!isLoading && !error && issues.length > 0 && (
        <div className="myreports-tiles">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`myreports-tile ${activeTab === tab.key ? 'myreports-tile-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span
                className="myreports-tile-icon"
                style={{ background: tab.iconBg, border: tab.iconBorder ? `1.5px solid ${tab.iconBorder}` : 'none' }}
              >
                <TabIcon tabKey={tab.key} color={tab.iconColor} />
              </span>
              <span className="myreports-tile-count">{counts[tab.key]}</span>
              <span className="myreports-tile-label">{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {isLoading && <p className="myreports-status">Loading your reports…</p>}
      {error && <p className="myreports-status myreports-status-error">{error}</p>}

      {!isLoading && !error && issues.length === 0 && (
        <div className="myreports-empty">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#9a927c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span className="myreports-empty-text">You haven't reported anything yet</span>
          <Link to="/report" className="myreports-empty-btn">
            + Report an Issue
          </Link>
        </div>
      )}

      {!isLoading && !error && issues.length > 0 && visibleIssues.length === 0 && (
        <p className="myreports-status">No reports with this status yet.</p>
      )}

      {!isLoading && !error && visibleIssues.length > 0 && (
        <div className="myreports-grid">
          {visibleIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  )
}

export default MyReports
