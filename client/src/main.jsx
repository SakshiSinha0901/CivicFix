import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// BrowserRouter wraps the whole app once, right here, so that every
// component inside <App /> is allowed to use React Router's tools
// (like the <NavLink> we used in Navbar.jsx) to move between pages.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
