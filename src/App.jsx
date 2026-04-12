import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './AuthContext'
import { AdminAuthProvider } from './AdminAuthContext'
import Home from './pages/home/Home'
import Accommodations from './pages/accommodations/Accommodations'
import Activity from './pages/activity/Activity'
import Location from './pages/location/Location'
import Booking from './pages/booking/Booking'
import Payment from './pages/payment/Payment'
import Profile from './pages/profile/Profile'
import Admin from './pages/admin/Admin'
import Auth from './pages/auth/Auth'
import './App.css'

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
    } else {
      const element = document.querySelector(hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [pathname, hash])

  return null
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return null
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  return children
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/accommodations" element={<Accommodations />} />
        <Route path="/activity/*" element={<Activity />} />
        <Route path="/location" element={<Location />} />
        <Route
          path="/booking"
          element={(
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/payment"
          element={(
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/profile"
          element={(
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin"
          element={(
            <AdminAuthProvider>
              <Admin />
            </AdminAuthProvider>
          )}
        />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </Router>
  )
}

export default App
