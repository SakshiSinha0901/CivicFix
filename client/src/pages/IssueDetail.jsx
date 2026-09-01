import { Fragment, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE_URL } from '../config.js'
import './IssueDetail.css'

const STATUS_LABELS = {
  reported: 'Reported',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

// The order these appear in matters -- it's also the order of the stepper
// below, since the three real statuses always move left to right.
const STATUS_STEPS = ['reported', 'in_progress', 'resolved']

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

// Turns the issue's real `status` string into "done / current / upcoming"
// for each of the three steps, so the stepper always reflects the actual
// state machine (reported -> in_progress -> resolved) rather than anything
// invented. An unrecognized status falls back to step 0 rather than crashing.
function getStepState(status) {
  const currentIndex = Math.max(STATUS_STEPS.indexOf(status), 0)
  return STATUS_STEPS.map((step, index) => {
    if (index < currentIndex) return 'done'
    if (index === currentIndex) return 'current'
    return 'upcoming'
  })
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
        const response = await fetch(`${API_BASE_URL}/api/issues/${id}`)
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
      const response = await fetch(`${API_BASE_URL}/api/issues/${id}/upvote`, {
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

  const stepStates = getStepState(issue.status)

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
          {/* Purely decorative -- same hand-drawn dashed-route family used on
              Signup/Login, tucked into the corner so this page still feels
              part of the same illustrated CivicFix identity. */}
          <svg className="issue-detail-doodle" width="150" height="120" viewBox="0 0 150 120" aria-hidden="true">
            <path
              d="M130 10 C 100 10, 115 45, 80 50 C 50 54, 60 85, 100 92"
              fill="none"
              stroke="#211f18"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="1 12"
            />
            <circle cx="130" cy="10" r="6" fill="#e8622c" />
          </svg>

          <div className="issue-detail-top">
            <div className="issue-detail-photo-wrap">
              {issue.photo_url ? (
                <img className="issue-detail-photo" src={issue.photo_url} alt={issue.title} />
              ) : (
                <div className="issue-detail-photo issue-detail-photo-empty">No photo provided</div>
              )}
              <div className="issue-detail-photo-overlay" />
              <span className="issue-detail-category-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9c4a1d" strokeWidth="2.5" strokeLinejoin="round">
                  <path d="M12 3 L21.5 20 L2.5 20 Z" />
                  <line x1="12" y1="9" x2="12" y2="14" stroke="#9c4a1d" strokeWidth="2" />
                  <circle cx="12" cy="17" r="1" fill="#9c4a1d" />
                </svg>
                {issue.category}
              </span>
            </div>

            <div className="issue-detail-sidebar">
              <h1 className="issue-detail-title">{issue.title}</h1>
              <div className="issue-detail-underline" />

              <div className="issue-detail-stepper">
                <div className="issue-detail-stepper-track">
                  {STATUS_STEPS.map((step, index) => (
                    <Fragment key={step}>
                      <span className={`issue-detail-step-dot issue-detail-step-dot-${stepStates[index]}`} />
                      {index < STATUS_STEPS.length - 1 && (
                        <span
                          className={`issue-detail-step-line ${
                            stepStates[index + 1] !== 'upcoming' ? 'issue-detail-step-line-done' : ''
                          }`}
                        />
                      )}
                    </Fragment>
                  ))}
                </div>
                <div className="issue-detail-step-labels">
                  {STATUS_STEPS.map((step, index) => (
                    <span key={step} className={`issue-detail-step-label issue-detail-step-label-${stepStates[index]}`}>
                      {STATUS_LABELS[step]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="issue-detail-meta">
                <span className="issue-detail-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  {issue.location}
                </span>
                <span className="issue-detail-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="3.2" />
                    <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" />
                  </svg>
                  Reported by {issue.reporter_name}
                </span>
                <span className="issue-detail-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                  Reported {timeAgo(issue.created_at)}
                </span>
              </div>

              <div className="issue-detail-upvote-row">
                <button
                  type="button"
                  className="issue-detail-upvote"
                  onClick={handleUpvote}
                  disabled={isUpvoting || hasUpvoted}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                  <span>{hasUpvoted ? 'Upvoted' : 'Upvote'}</span>
                </button>
                <span className="issue-detail-upvote-count">{issue.upvote_count ?? 0}</span>
              </div>

              {upvoteMessage && <p className="issue-detail-upvote-message">{upvoteMessage}</p>}
            </div>
          </div>

          <div className="issue-detail-divider" />

          <div className="issue-detail-description-wrap">
            <span className="issue-detail-description-label">Description</span>
            {issue.description ? (
              <p className="issue-detail-description">{issue.description}</p>
            ) : (
              <p className="issue-detail-description issue-detail-description-empty">
                No description provided.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default IssueDetail
