import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../AuthContext'
import AdminBooking from './AdminBooking'
import AdminHome from './AdminHome'
import AdminRevenue from './AdminRevenue'
import AdminRooms from './AdminRooms'
import AdminUsers from './AdminUsers'
import AdminSettings from './AdminSettings'
import './Admin.css'

const AdminDashboard = () => {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()

  const handleTabClick = (tab) => {
    setActiveTab(tab)
    // Only close sidebar on mobile (less than 1024px)
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false)
    }
  }

  // TEMPORARY: Allow all users to access for development
  const isAdmin = true;

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loader"></div>
        <p>Verifying admin access...</p>
      </div>
    )
  }

  // Show "Not Authorized" instead of redirecting immediately so the user knows why
  if (!isAdmin) {
    return (
      <div className="not-authorized-page">
        <div className="auth-card">
          <i className="fas fa-lock"></i>
          <h1>Access Denied</h1>
          <p>You do not have administrative privileges to access this area.</p>
          <div className="user-info-box">
            <p>Logged in as: <strong>{user?.email || 'Not logged in'}</strong></p>
          </div>
          <p className="hint">Please contact the system administrator or login with an authorized account.</p>
          <a href="/" className="back-home-btn">Return to Website</a>
        </div>
      </div>
    )
  }

  return (
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Floating hamburger button - top left */}
      <button className="floating-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <span className={`burger-icon ${sidebarOpen ? 'active' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
      {/* Sidebar overlay for mobile */}
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
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => handleTabClick('dashboard')}
          >
            <i className="fas fa-th-large"></i> <span>Dashboard</span>
          </button>
          <button 
            className={activeTab === 'bookings' ? 'active' : ''} 
            onClick={() => handleTabClick('bookings')}
          >
            <i className="fas fa-calendar-check"></i> <span>Bookings</span>
          </button>
          <button 
            className={activeTab === 'revenue' ? 'active' : ''} 
            onClick={() => handleTabClick('revenue')}
          >
            <i className="fas fa-chart-line"></i> <span>Revenue</span>
          </button>
          <button 
            className={activeTab === 'rooms' ? 'active' : ''} 
            onClick={() => handleTabClick('rooms')}
          >
            <i className="fas fa-bed"></i> <span>Manage Rooms</span>
          </button>
          <button 
            className={activeTab === 'users' ? 'active' : ''} 
            onClick={() => handleTabClick('users')}
          >
            <i className="fas fa-users"></i> <span>Users</span>
          </button>
          <button 
            className={activeTab === 'settings' ? 'active' : ''} 
            onClick={() => handleTabClick('settings')}
          >
            <i className="fas fa-cog"></i> <span>Settings</span>
          </button>
          <button 
            className="exit-btn" 
            onClick={() => navigate('/')}
          >
            <i className="fas fa-sign-out-alt"></i> <span>Exit to Home</span>
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
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Admin" />
            ) : (
              <div className="admin-avatar-placeholder">
                <i className="fas fa-user-shield"></i>
              </div>
            )}
          </div>
        </header>

        <div className="admin-content">
          {activeTab === 'dashboard' && (
            <AdminHome />
          )}

          {activeTab === 'bookings' && (
            <AdminBooking />
          )}

          {activeTab === 'revenue' && (
            <AdminRevenue />
          )}

          {activeTab === 'rooms' && (
            <AdminRooms />
          )}

          {activeTab === 'users' && (
            <AdminUsers />
          )}

          {activeTab === 'settings' && (
            <AdminSettings />
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
