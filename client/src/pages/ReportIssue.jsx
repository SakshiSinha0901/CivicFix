import { useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE_URL } from '../config.js'
import './ReportIssue.css'

const CATEGORIES = ['Pothole', 'Garbage', 'Broken Streetlight', 'Water Leakage']
const MAX_PHOTO_BYTES = 5 * 1024 * 1024 // 5MB -- matches the limit set on the backend (uploadMiddleware.js)

function ReportIssue() {
  const { token, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    category: CATEGORIES[0],
    location: '',
    description: '',
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Shared by both "click to choose a file" and "drag a file onto the box" --
  // both end up with a File object, this is just where we validate it and
  // turn it into a preview.
  function acceptPhoto(file) {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('That photo is too large -- please choose one under 5MB.')
      return
    }

    setError('')
    setPhotoFile(file)
    // URL.createObjectURL makes a temporary local link to the file still
    // sitting on the user's device, purely so <img> can show a preview --
    // nothing is uploaded anywhere yet, that only happens on submit.
    setPhotoPreviewUrl(URL.createObjectURL(file))
  }

  function handleFileInputChange(e) {
    acceptPhoto(e.target.files[0])
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    acceptPhoto(e.dataTransfer.files[0])
  }

  function removePhoto() {
    setPhotoFile(null)
    setPhotoPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // FormData instead of JSON.stringify -- this is what lets a real file
      // ride along with the text fields in one request. We deliberately do
      // NOT set a Content-Type header here: the browser sets it itself
      // (multipart/form-data with a boundary string), and setting it by
      // hand would leave out that boundary and break the upload.
      const body = new FormData()
      body.append('title', form.title)
      body.append('category', form.category)
      body.append('location', form.location)
      body.append('description', form.description)
      if (photoFile) {
        body.append('photo', photoFile)
      }

      const response = await fetch(`${API_BASE_URL}/api/issues`, {
        method: 'POST',
        headers: {
          // Same pattern as everywhere else -- the server reads WHO is
          // reporting this from the token, never from anything in the body.
          Authorization: `Bearer ${token}`,
        },
        body,
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      // Send the reporter straight to their new issue's page, same as how
      // Signup sends a new account to Login rather than leaving them stuck
      // on the form they just finished.
      navigate(`/issues/${data.issue.id}`)
    } catch (err) {
      setError('Could not reach the server. Is it running?')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reporting requires an account (CLAUDE.md: "keeps every report
  // accountable to a real user") -- same idea as the upvote button showing
  // a message instead of doing nothing when a logged-out visitor clicks it,
  // just applied to a whole page instead of a button.
  if (!isLoggedIn) {
    return (
      <div className="report-wrap">
        <div className="report-card report-card-locked">
          <h1>Log in to report an issue</h1>
          <p className="report-subtitle">
            Reports are tied to your account so we know who reported what.
          </p>
          <Link to="/login" className="report-locked-btn">
            Log In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="report-wrap">
      <div className="report-shell">

        {/* Left: the actual form */}
        <div className="report-panel">
          <div className="auth-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>

          <h1>Report an Issue</h1>
          <p className="report-subtitle">Spotted something broken nearby? Tell us what's wrong and where.</p>

          <form className="report-form" onSubmit={handleSubmit}>
            <div className="report-field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Broken streetlight on Maple Rd"
                required
              />
            </div>

            <div className="report-row">
              <div className="report-field">
                <label htmlFor="category">Category</label>
                <select id="category" name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report-field">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Maple Rd & 3rd St"
                  required
                />
              </div>
            </div>

            <div className="report-field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                placeholder="Add any details that would help someone find and fix it."
              />
            </div>

            <div className="report-field">
              <label htmlFor="photo">
                Photo <span className="report-photo-tag">optional</span>
              </label>

              <input
                ref={fileInputRef}
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="report-photo-input"
              />

              {!photoPreviewUrl ? (
                <label
                  htmlFor="photo"
                  className={`report-photo-drop ${isDragging ? 'report-photo-drop-active' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9a927c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="M17 8l-5-5-5 5" />
                    <path d="M12 3v12" />
                  </svg>
                  <span>Drag a photo here, or click to upload</span>
                </label>
              ) : (
                <div className="report-photo-preview">
                  <img src={photoPreviewUrl} alt="Selected upload preview" />
                  <div className="report-photo-preview-info">
                    <span>{photoFile.name}</span>
                    <button type="button" className="report-photo-remove" onClick={removePhoto}>
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="report-error">{error}</p>}

            <button type="submit" className="report-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Reporting…' : 'Report Issue'}
            </button>
          </form>
        </div>

        {/* Right: purely decorative illustrated panel, same hand-drawn
            doodle vocabulary as Signup/Login -- no effect on the form. */}
        <div className="report-illustration">
          <svg className="report-illustration-doodle" width="320" height="320" viewBox="0 0 320 320" aria-hidden="true">
            <path
              d="M20 260 C 60 220, 40 160, 100 140 C 160 120, 150 60, 220 40"
              fill="none"
              stroke="#211f18"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="1 14"
            />
            <circle cx="20" cy="260" r="10" fill="#43541b" />
            <circle cx="220" cy="40" r="10" fill="#e8622c" />
          </svg>

          <div className="report-illustration-content">
            <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="56" fill="#ffffff" stroke="#e6e2d2" strokeWidth="2" />
              <g transform="translate(30,30)">
                <path d="M42 6 L48 12 L18 42 L8 44 L10 34 Z" fill="none" stroke="#43541b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 52 L52 52" stroke="#e8622c" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 8" />
              </g>
            </svg>
            <span className="report-illustration-caption">let's get it fixed</span>
            <span className="report-illustration-text">
              Every report you file helps your neighborhood get noticed and fixed faster.
            </span>
          </div>

          <svg className="report-illustration-hazard" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9c4a1d" strokeWidth="2.5" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3 L21.5 20 L2.5 20 Z" />
            <line x1="12" y1="9" x2="12" y2="14" />
            <circle cx="12" cy="17" r="0.8" fill="#9c4a1d" />
          </svg>
        </div>

      </div>
    </div>
  )
}

export default ReportIssue
