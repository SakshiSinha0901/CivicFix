import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './IssueDetail.css'

const STATUS_LABELS = {
  reported: 'Reported',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

const STATUS_CLASSES = {
  reported: 'badge-status-reported',
  in_progress: 'badge-status-in-progress',
  resolved: 'badge-status-resolved',
}

function timeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000)
  const units = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ]
  for (const unit of units) {
    const count = Math.floor(seconds / unit.seconds)
    if (count >= 1) return `${count} ${unit.label}${count > 1 ? 's' : ''} ago`
  }
  return 'just now'
}

function IssueDetail() {
  // useParams() reads the ":id" part of the current URL -- visiting
  // "/issues/5" makes `id` equal "5" here.
  const { id } = useParams()
  const { token, isLoggedIn } = useAuth()

  const [issue, setIssue] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Separate from the issue itself: local state just for the upvote button's
  // behavior, since the server doesn't tell us up front whether THIS visitor
  // already upvoted -- we only find that out if they try and get a 409 back.
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [upvoteMessage, setUpvoteMessage] = useState('')
  const [isUpvoting, setIsUpvoting] = useState(false)

  // [id] as the dependency means "re-run this fetch if the id in the URL
  // ever changes" -- e.g. if someone navigates from one issue straight to
  // another without a full page reload.
  useEffect(() => {
    async function fetchIssue() {
      setIsLoading(true)
      setError('')
      try {
        const response = await fetch(`http://localhost:3000/api/issues/${id}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Something went wrong while loading this issue.')
          return
        }

        setIssue(data.issue)
      } catch (err) {
        setError('Could not reach the server. Is it running?')
      } finally {
        setIsLoading(false)
      }
    }

    fetchIssue()
  }, [id])

  async function handleUpvote() {
    if (!isLoggedIn) {
      setUpvoteMessage('Log in to upvote this issue.')
      return
    }

    setIsUpvoting(true)
    setUpvoteMessage('')

    try {
      // The Authorization header is how the server checks WHO is making
      // this request -- "Bearer <token>" is the standard format for sending
      // a JWT. Our requireAuth middleware on the backend reads this exact
      // header to verify the token and identify the logged-in user.
      const response = await fetch(`http://localhost:3000/api/issues/${id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()

      if (response.status === 409) {
        // Our backend already enforces "one upvote per person" -- this is
        // just that same rule surfacing here as a friendly message instead
        // of letting someone spam the button.
        setHasUpvoted(true)
        setUpvoteMessage('You already upvoted this issue.')
        return
      }

      if (!response.ok) {
        setUpvoteMessage(data.error || 'Something went wrong while upvoting.')
        return
      }

      // Success -- bump the count we're showing by 1 locally, instead of
      // re-fetching the whole issue from the server again.
      setHasUpvoted(true)
      setIssue((prev) => ({
        ...prev,
        upvote_count: Number(prev.upvote_count) + 1,
      }))
    } catch (err) {
      setUpvoteMessage('Could not reach the server. Is it running?')
    } finally {
      setIsUpvoting(false)
    }
  }

  if (isLoading) {
    return <p className="issue-detail-status">Loading issue…</p>
  }

  if (error) {
    return <p className="issue-detail-status issue-detail-status-error">{error}</p>
  }

  if (!issue) {
    return null
  }

  return (
    <div className="issue-detail-page">
      <div className="issue-detail-column">
        <Link to="/" className="issue-detail-back">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back to all issues</span>
        </Link>

        <div className="issue-detail-card">
          {issue.photo_url ? (
            <img className="issue-detail-photo" src={issue.photo_url} alt={issue.title} />
          ) : (
            <div className="issue-detail-photo issue-detail-photo-empty">No photo provided</div>
          )}

          <div className="issue-detail-content">
            <div className="issue-detail-badges">
              <span className="badge badge-category">{issue.category}</span>
              <span className={`badge ${STATUS_CLASSES[issue.status] || 'badge-status-reported'}`}>
                {STATUS_LABELS[issue.status] || issue.status}
              </span>
            </div>

            <h1 className="issue-detail-title">{issue.title}</h1>

            <div className="issue-detail-meta">
              <span className="issue-detail-meta-item">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                {issue.location}
              </span>
              <span className="issue-detail-meta-item">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                Reported {timeAgo(issue.created_at)}
              </span>
            </div>

            <div className="issue-detail-divider" />

            {issue.description ? (
              <p className="issue-detail-description">{issue.description}</p>
            ) : (
              <p className="issue-detail-description issue-detail-description-empty">
                No description provided.
              </p>
            )}

            <button
              type="button"
              className="issue-detail-upvote"
              onClick={handleUpvote}
              disabled={isUpvoting || hasUpvoted}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              <span>
                {hasUpvoted ? 'Upvoted' : 'Upvote'} · {issue.upvote_count ?? 0}
              </span>
            </button>

            {upvoteMessage && <p className="issue-detail-upvote-message">{upvoteMessage}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IssueDetail
