import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getAuthErrorMessage } from '../firebase'
import './Navbar.css'

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const { user, loginWithEmail, signUpWithEmail, logout } = useAuth()
  const location = useLocation()
  const userMenuRef = useRef(null)
  const mobileUserMenuRef = useRef(null)

  const getFirstName = (name, fallbackEmail = '') => {
    const trimmedName = name?.trim()

    if (trimmedName) {
      return trimmedName.split(/\s+/)[0]
    }

    const emailName = fallbackEmail.split('@')[0]?.trim()
    if (emailName) {
      return emailName.split(/[._\s-]+/)[0]
    }

    return 'Account'
  }

  const getAvatarLetter = (name, fallbackEmail = '') => {
    const firstNameValue = getFirstName(name, fallbackEmail)
    return firstNameValue.charAt(0).toUpperCase()
  }

  const displayFirstName = getFirstName(user?.displayName, user?.email)
  const displayAvatarLetter = getAvatarLetter(user?.displayName, user?.email)
  const accountAvatarLetter = getAvatarLetter('', '')

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
      const isOutsideDesktop = userMenuRef.current && !userMenuRef.current.contains(event.target);
      const isOutsideMobile = mobileUserMenuRef.current && !mobileUserMenuRef.current.contains(event.target);
      
      if (isOutsideDesktop && isOutsideMobile) {
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
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
      document.documentElement.style.overflow = 'auto'
    }
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
  }

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  const handleEmailAuth = async (event) => {
    event.preventDefault()
    setAuthError('')
    setIsSigningIn(true)
    try {
      if (isSignUpMode) {
        await signUpWithEmail(email.trim(), password, firstName.trim(), lastName.trim())
      } else {
        await loginWithEmail(email.trim(), password)
      }
      setFirstName('')
      setLastName('')
      setEmail('')
      setPassword('')
      setIsUserMenuOpen(false)
    } catch (error) {
      console.error('Email auth failed:', error)
      setAuthError(getAuthErrorMessage(error, isSignUpMode ? 'signup' : 'signin'))
    } finally {
      setIsSigningIn(false)
    }
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
                <span className="user-name-display">{displayFirstName}</span>
                <div className="user-avatar-wrapper theme-avatar">
                  <span className="user-avatar-text" aria-hidden="true">{displayAvatarLetter}</span>
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
                  <Link to="/profile#reservations" className="user-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                    <i className="fas fa-calendar-alt"></i> My Bookings
                  </Link>
                  <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="user-dropdown-item logout-btn">
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="user-menu-container" ref={userMenuRef}>
                <div className="user-profile-trigger" onClick={toggleUserMenu}>
                  <span className="user-name-display">Account</span>
                <div className="user-avatar-wrapper theme-avatar">
                  <span className="user-avatar-text" aria-hidden="true">{accountAvatarLetter}</span>
                </div>
              </div>

              {isUserMenuOpen && (
                <div className="user-dropdown-menu auth-dropdown-menu">
                  <div className="user-dropdown-header">
                    <p className="user-full-name">{isSignUpMode ? 'Create Account' : 'Login With Email'}</p>
                  </div>
                  <form className="auth-dropdown-form" onSubmit={handleEmailAuth}>
                    {isSignUpMode && (
                      <>
                        <input
                          type="text"
                          placeholder="First name"
                          value={firstName}
                          onChange={(event) => setFirstName(event.target.value)}
                          required={isSignUpMode}
                        />
                        <input
                          type="text"
                          placeholder="Last name"
                          value={lastName}
                          onChange={(event) => setLastName(event.target.value)}
                          required={isSignUpMode}
                        />
                      </>
                    )}
                    <input
                      type="email"
                      placeholder="Email address"
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
                    {authError && <p className="auth-dropdown-error">{authError}</p>}
                    <button type="submit" className="auth-submit-btn" disabled={isSigningIn}>
                      {isSigningIn
                        ? (isSignUpMode ? 'Creating account...' : 'Signing in...')
                        : (isSignUpMode ? 'Sign Up' : 'Sign In')
                      }
                    </button>

                    <button
                      type="button"
                      className="auth-mode-toggle"
                      onClick={() => {
                        setAuthError('')
                        setFirstName('')
                        setLastName('')
                        setIsSignUpMode((previous) => !previous)
                      }}
                    >
                      {isSignUpMode ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                  </form>
                </div>
              )}
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
            <div className="mobile-user-avatar theme-avatar" aria-hidden="true">
              <span className="mobile-user-avatar-text">{displayAvatarLetter}</span>
            </div>
            <h3>{user.displayName}</h3>
            <p>{user.email}</p>
          </div>
        )}
        <div className="mobile-menu-links">
          <Link to="/" onClick={closeMobileMenu}>
            <i className="fas fa-home"></i> <span>Home</span>
          </Link>
          <Link to="/accommodations" onClick={closeMobileMenu}>
            <i className="fas fa-bed"></i> <span>Rooms</span>
          </Link>
          <Link to="/activity" onClick={closeMobileMenu}>
            <i className="fas fa-hiking"></i> <span>Activities</span>
          </Link>
          <Link to="/location" onClick={closeMobileMenu}>
            <i className="fas fa-map-marker-alt"></i> <span>Location</span>
          </Link>
          <Link to="/booking" onClick={closeMobileMenu}>
            <i className="fas fa-calendar-check"></i> <span>Bookings</span>
          </Link>
          {user && (
            <Link to="/profile" onClick={closeMobileMenu}>
              <i className="fas fa-user-circle"></i> <span>Profile</span>
            </Link>
          )}
          
          <div className="mobile-auth-container">
            {user ? (
              <div className="mobile-auth-authenticated">
                <button onClick={() => { logout(); closeMobileMenu(); }} className="mobile-login-btn logout">
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            ) : (
              <Link 
                to="/auth" 
                className="mobile-auth-trigger-container" 
                onClick={closeMobileMenu}
              >
                <div className="user-profile-trigger">
                  <span className="user-name-display">Account</span>
                  <div className="user-avatar-wrapper theme-avatar">
                    <span className="user-avatar-text" aria-hidden="true">{accountAvatarLetter}</span>
                  </div>
                </div>
              </Link>
            )}
          </div>
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
