import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ReportIssue from './pages/ReportIssue.jsx'
import MyReports from './pages/MyReports.jsx'

// This is the "shared layout" we planned: the Navbar renders once here,
// outside of <Routes>, so it stays on screen no matter which page you're
// on. <Routes> below is React Router's way of saying "show a different
// page component depending on the current URL."
function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/report" element={<ReportIssue />} />
        <Route path="/my-reports" element={<MyReports />} />
      </Routes>
    </>
  )
}

export default App
