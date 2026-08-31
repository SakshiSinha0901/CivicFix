import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import IssueCard from '../components/IssueCard.jsx'
import './Home.css'

// Same four categories as the Report Issue form's dropdown -- kept in sync
// by hand since they're not shared from one file yet (a small "known gaps"
// item, not worth a bigger refactor just for four values).
const CATEGORIES = ['Pothole', 'Garbage', 'Broken Streetlight', 'Water Leakage']

function Home() {
  const [issues, setIssues] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // What the dropdown/search box currently show vs. what's actually been
  // sent to the server are kept separate on purpose -- see the debounce
  // comment below for why locationSearch needs its own "settled" copy.
  const [category, setCategory] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [debouncedLocation, setDebouncedLocation] = useState('')

  // Debouncing: without this, typing "maple" would fire five separate
  // requests to the server, one per keystroke (m, ma, map, mapl, maple).
  // Instead, every keystroke resets a 400ms timer, and only once typing
  // actually pauses does debouncedLocation update -- which is the only
  // thing the fetch effect below actually listens to.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedLocation(locationSearch)
    }, 400)

    return () => clearTimeout(timeoutId)
  }, [locationSearch])

  // Re-fetches from the server whenever category or the settled location
  // search changes -- filtering happens on the backend (see GET /api/issues
  // in routes/issues.js), not by hiding rows in the browser, so we ask the
  // server for exactly the issues we want instead of downloading everything.
  useEffect(() => {
    async function fetchIssues() {
      setIsLoading(true)
      setError('')

      try {
        const params = new URLSearchParams()
        if (category) params.set('category', category)
        if (debouncedLocation) params.set('location', debouncedLocation)

        const query = params.toString()
        const url = `http://localhost:3000/api/issues${query ? `?${query}` : ''}`

        const response = await fetch(url)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Something went wrong while loading issues.')
          return
        }

        setIssues(data.issues)
      } catch (err) {
        setError('Could not reach the server. Is it running?')
      } finally {
        setIsLoading(false)
      }
    }

    fetchIssues()
  }, [category, debouncedLocation])

  const hasActiveFilters = category !== '' || locationSearch !== ''

  function clearFilters() {
    setCategory('')
    setLocationSearch('')
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <div>
          <h1>Issues reported near you</h1>
          <p className="home-subtitle">Browse what's already been reported, or add a new one.</p>
        </div>
        <Link to="/report" className="home-report-btn">
          + Report Issue
        </Link>
      </div>

      <div className="home-filters">
        <div className="home-filter-field">
          <label htmlFor="filter-category">Category</label>
          <select id="filter-category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="home-filter-field">
          <label htmlFor="filter-location">Location</label>
          <input
            id="filter-location"
            type="text"
            placeholder="Search by street, area..."
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
          />
        </div>

        {hasActiveFilters && (
          <button type="button" className="home-filters-clear" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {isLoading && <p className="home-status">Loading issues…</p>}
      {error && <p className="home-status home-status-error">{error}</p>}

      {!isLoading && !error && issues.length === 0 && (
        <p className="home-status">
          {hasActiveFilters
            ? 'No issues match these filters.'
            : 'No issues reported yet — be the first to report one!'}
        </p>
      )}

      {!isLoading && !error && issues.length > 0 && (
        <div className="home-grid">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Home
