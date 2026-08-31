import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import LandingHero from './pages/LandingHero.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ReportIssue from './pages/ReportIssue.jsx'
import MyReports from './pages/MyReports.jsx'
import IssueDetail from './pages/IssueDetail.jsx'
import { useAuth } from './context/AuthContext.jsx'

function App() {
  const { isLoggedIn } = useAuth()

  return (
    <>
      <Navbar />
      <Routes>
        {/* Logged-out visitors land on the marketing page (LandingHero);
            once logged in, "/" switches to the real Home issue feed. */}
        <Route path="/" element={isLoggedIn ? <Home /> : <LandingHero />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/report" element={<ReportIssue />} />
        <Route path="/my-reports" element={<MyReports />} />
        <Route path="/issues/:id" element={<IssueDetail />} />
      </Routes>
    </>
  )
}

export default App
