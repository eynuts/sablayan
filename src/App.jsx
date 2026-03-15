import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/home/Home'
import Accommodations from './pages/accommodations/Accommodations'
import Activity from './pages/activity/Activity'
import Location from './pages/location/Location'
import Booking from './pages/booking/Booking'
import Payment from './pages/payment/Payment'
import Admin from './pages/admin/Admin'
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

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/accommodations" element={<Accommodations />} />
        <Route path="/activity/*" element={<Activity />} />
        <Route path="/location" element={<Location />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  )
}

export default App
