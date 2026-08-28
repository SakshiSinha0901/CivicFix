import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import IssueCard from '../components/IssueCard.jsx'
import './Home.css'

function Home() {
  const [issues, setIssues] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // useEffect with an empty [] dependency list means "run this once, right
  // after the page first renders" -- exactly what we want for "go fetch
  // the issues as soon as someone lands on this page."
  useEffect(() => {
    async function fetchIssues() {
      try {
        const response = await fetch('http://localhost:3000/api/issues')
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
  }, [])

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

      {isLoading && <p className="home-status">Loading issues…</p>}
      {error && <p className="home-status home-status-error">{error}</p>}

      {!isLoading && !error && issues.length === 0 && (
        <p className="home-status">No issues reported yet — be the first to report one!</p>
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
