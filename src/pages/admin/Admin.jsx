import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../AdminAuthContext'
import { getAuthErrorMessage } from '../../firebase'
import AdminBooking from './AdminBooking'
import AdminHome from './AdminHome'
import AdminRevenue from './AdminRevenue'
import AdminRooms from './AdminRooms'
import AdminZipline from './AdminZipline'
import AdminUsers from './AdminUsers'
import AdminSettings from './AdminSettings'
import './Admin.css'

const AdminDashboard = () => {
  const { user, loading, isAdmin, loginWithEmail, logout } = useAdminAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const getFirstName = (name, fallbackEmail = '') => {
    const trimmedName = name?.trim()

    if (trimmedName) {
      return trimmedName.split(/\s+/)[0]
    }

    const emailName = fallbackEmail.split('@')[0]?.trim()
    if (emailName) {
      return emailName.split(/[._\s-]+/)[0]
    }

    return 'Admin'
  }

  const adminAvatarLetter = getFirstName(user?.displayName, user?.email).charAt(0).toUpperCase()

  const handleTabClick = (tab) => {
    setActiveTab(tab)
    window.scrollTo(0, 0)
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false)
    }
  }

  const handleAdminLogin = async (event) => {
    event.preventDefault()
    setLoginError('')
    setIsSubmitting(true)

    try {
      await loginWithEmail(email.trim(), password)
      setEmail('')
      setPassword('')
    } catch (error) {
      console.error('Admin login failed:', error)
      setLoginError(getAuthErrorMessage(error, 'signin'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loader"></div>
        <p>Verifying admin access...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="not-authorized-page">
        <div className="auth-card">
          <i className="fas fa-user-shield"></i>
          <h1>Admin Login</h1>
          <p>This admin session is separate from the website account session.</p>

          <form className="auth-dropdown-form" onSubmit={handleAdminLogin}>
            <input
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {loginError && <p className="auth-dropdown-error">{loginError}</p>}

            <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign In to Admin'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="not-authorized-page">
        <div className="auth-card">
          <i className="fas fa-lock"></i>
          <h1>Access Denied</h1>
          <p>This account is signed in to admin separately, but it does not have administrator access.</p>
          <div className="user-info-box">
            <p>Admin session: <strong>{user.email || 'Unknown account'}</strong></p>
          </div>
          <div className="auth-dropdown-form">
            <button type="button" className="auth-submit-btn" onClick={logout}>
              Sign Out Admin
            </button>
          </div>
          <p className="hint">Use an account with `role: admin` in the database.</p>
          <a href="/" className="back-home-btn">Return to Website</a>
        </div>
      </div>
    )
  }

  return (
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <button className="floating-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <span className={`burger-icon ${sidebarOpen ? 'active' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-logo">
          <button className="burger-menu mobile-close-btn" onClick={() => setSidebarOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
          <button className="burger-menu desktop-only" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span className={`burger-icon ${sidebarOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          <h2 className="desktop-only">Sablayan Admin</h2>
          <h2 className="mobile-only">Admin</h2>
        </div>

        <nav className="admin-nav">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => handleTabClick('dashboard')}>
            <i className="fas fa-th-large"></i> <span>Dashboard</span>
          </button>
          <button className={activeTab === 'bookings' ? 'active' : ''} onClick={() => handleTabClick('bookings')}>
            <i className="fas fa-calendar-check"></i> <span>Bookings</span>
          </button>
          <button className={activeTab === 'revenue' ? 'active' : ''} onClick={() => handleTabClick('revenue')}>
            <i className="fas fa-chart-line"></i> <span>Revenue</span>
          </button>
          <button className={activeTab === 'rooms' ? 'active' : ''} onClick={() => handleTabClick('rooms')}>
            <i className="fas fa-bed"></i> <span>Manage Rooms</span>
          </button>
          <button className={activeTab === 'zipline' ? 'active' : ''} onClick={() => handleTabClick('zipline')}>
            <i className="fas fa-wind"></i> <span>Zipline</span>
          </button>
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => handleTabClick('users')}>
            <i className="fas fa-users"></i> <span>Users</span>
          </button>
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => handleTabClick('settings')}>
            <i className="fas fa-cog"></i> <span>Settings</span>
          </button>
          <button className="exit-btn" onClick={logout}>
            <i className="fas fa-sign-out-alt"></i> <span>Sign Out Admin</span>
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-info">
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h1>
            <p>Welcome back, {user?.displayName || 'Admin'}</p>
          </div>
          <div className="admin-user">
            <div className="admin-avatar-placeholder" aria-hidden="true">
              {adminAvatarLetter}
            </div>
          </div>
        </header>

        <div className="admin-content">
          {activeTab === 'dashboard' && <AdminHome />}
          {activeTab === 'bookings' && <AdminBooking />}
          {activeTab === 'revenue' && <AdminRevenue />}
          {activeTab === 'rooms' && <AdminRooms />}
          {activeTab === 'zipline' && <AdminZipline />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'settings' && <AdminSettings />}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
