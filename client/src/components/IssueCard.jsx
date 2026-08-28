import { Link } from 'react-router-dom'
import './IssueCard.css'

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
    if (count >= 1) {
      return `${count} ${unit.label}${count > 1 ? 's' : ''} ago`
    }
  }
  return 'just now'
}

// Same data and same destination link as before -- the only thing that
// changed here is WHERE the category and status show up. They used to sit
// as two small badges below the photo; now they sit directly on top of the
// photo (category as bold text top-left, status as a pill top-right), to
// match the new photo-cover card look. Nothing about what data is fetched
// or how the card links to the issue's detail page has changed.
function IssueCard({ issue }) {
  return (
    <Link to={`/issues/${issue.id}`} className="issue-card">
      <div className="issue-card-photo-wrap">
        {issue.photo_url ? (
          <img className="issue-card-photo" src={issue.photo_url} alt={issue.title} />
        ) : (
          <div className="issue-card-photo issue-card-photo-empty">No photo provided</div>
        )}
        <span className="issue-card-category-overlay">{issue.category}</span>
        <span className={`issue-card-status-overlay ${STATUS_CLASSES[issue.status] || 'badge-status-reported'}`}>
          {STATUS_LABELS[issue.status] || issue.status}
        </span>
      </div>

      <div className="issue-card-body">
        <span className="issue-card-title">{issue.title}</span>
        <span className="issue-card-time">{timeAgo(issue.created_at)}</span>

        <div className="issue-card-divider" />

        <div className="issue-card-footer">
          <div className="issue-card-upvote">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            <span>{issue.upvote_count ?? 0} upvotes</span>
          </div>
          <span className="issue-card-view">View details &rarr;</span>
        </div>
      </div>
    </Link>
  )
}

export default IssueCard
