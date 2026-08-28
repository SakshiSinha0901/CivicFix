import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ReportIssue from './pages/ReportIssue.jsx'
import MyReports from './pages/MyReports.jsx'
import IssueDetail from './pages/IssueDetail.jsx'

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
        <Route path="/issues/:id" element={<IssueDetail />} />
      </Routes>
    </>
  )
}

export default App
