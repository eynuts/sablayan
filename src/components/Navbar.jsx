import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import './Navbar.css'

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, login, logout } = useAuth()
  const location = useLocation()
  const userMenuRef = useRef(null)

  // Extract first name from displayName
  const getFirstName = (name) => {
    if (!name) return 'Alex'
    return name.split(' ')[0]
  }

  const firstName = getFirstName(user?.displayName)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
    if (!isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    document.body.style.overflow = 'auto'
  }

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${isMobileMenuOpen ? 'menu-open' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-main">Sablayan Adventure Camp</span>
            <span className="logo-sub">Resort & Dive Shop</span>
          </div>
        </Link>
        
        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/accommodations" className={isActive('/accommodations')}>Rooms</Link>
          <Link to="/activity/diving" className={isActive('/activity/diving')}>Diving</Link>
          <Link to="/activity/zipline" className={isActive('/activity/zipline')}>Zipline</Link>
          <Link to="/location" className={isActive('/location')}>Location</Link>
          <Link to="/booking" className={isActive('/booking')}>Bookings</Link>
        </div>

        <div className="navbar-actions">
          <button className="nav-icon-btn notification-btn">
            <i className="fas fa-bell"></i>
            <span className="notification-dot"></span>
          </button>
          
          {user ? (
            <div className="user-menu-container" ref={userMenuRef}>
              <div className="user-profile-trigger" onClick={toggleUserMenu}>
                <span className="user-name-display">{firstName}</span>
                <div className="user-avatar-wrapper theme-avatar">
                  <img 
                    src={user.photoURL || 'https://ui-avatars.com/api/?name=A&background=d94e28&color=fff'} 
                    alt={user.displayName || 'Alex'} 
                    className="user-avatar" 
                  />
                </div>
              </div>

              {isUserMenuOpen && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <p className="user-full-name">{user.displayName || 'Alex'}</p>
                    <p className="user-email">{user.email || 'alex@example.com'}</p>
                  </div>
                  <Link to="/profile" className="user-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                    <i className="fas fa-user-circle"></i> Profile Settings
                  </Link>
                  <Link to="/booking" className="user-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                    <i className="fas fa-calendar-alt"></i> My Bookings
                  </Link>
                  <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="user-dropdown-item logout-btn">
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="user-profile-trigger" onClick={login}>
              <span className="user-name-display">Alex</span>
              <div className="user-avatar-wrapper theme-avatar">
                <img src="https://ui-avatars.com/api/?name=A&background=d94e28&color=fff" alt="Alex" className="user-avatar" />
              </div>
            </div>
          )}
        </div>

        <button className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        {user && (
          <div className="mobile-user-info">
            <img 
              src={user.photoURL} 
              alt={user.displayName} 
              className="mobile-user-avatar"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=0077b6&color=fff`
              }}
            />
            <h3>{user.displayName}</h3>
            <p>{user.email}</p>
          </div>
        )}
        <div className="mobile-menu-links">
          <Link to="/" onClick={closeMobileMenu}>Home</Link>
          <Link to="/accommodations" onClick={closeMobileMenu}>Rooms</Link>
          <Link to="/activity" onClick={closeMobileMenu}>Activities</Link>
          <Link to="/location" onClick={closeMobileMenu}>Location</Link>
          <Link to="/booking" onClick={closeMobileMenu}>Bookings</Link>
          {user ? (
            <button onClick={() => { logout(); closeMobileMenu(); }} className="mobile-login-btn logout">
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          ) : (
            <button onClick={() => { login(); closeMobileMenu(); }} className="mobile-login-btn">
              <i className="fab fa-google"></i> Login
            </button>
          )}
        </div>
        <div className="mobile-menu-social">
          <a href="#"><i className="fab fa-instagram"></i></a>
          <a href="#"><i className="fab fa-facebook-f"></i></a>
          <a href="#"><i className="fab fa-twitter"></i></a>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
