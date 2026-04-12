import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../AuthContext'
import { clearGuestSession } from '../../firebase'
import Navbar from '../../components/Navbar'
import PageLoader from '../../components/PageLoader'
import { getAuthErrorMessage } from '../../firebase'
import heroImage from '../../assets/images/hero.webp'
import { preloadImage } from '../../utils/pageLoad'
import './Auth.css'

const Auth = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [pageReady, setPageReady] = useState(false)
  
  const { user, loginWithEmail, signUpWithEmail } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Lock body and html scroll on mount
  useEffect(() => {
    const originalBodyOverflow = window.getComputedStyle(document.body).overflow
    const originalHtmlOverflow = window.getComputedStyle(document.documentElement).overflow
    
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
    }
  }, [])

  useEffect(() => {
    let active = true

    preloadImage(heroImage).finally(() => {
      if (active) {
        setPageReady(true)
      }
    })

    return () => {
      active = false
    }
  }, [])

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        // For admin users, redirect to admin panel
        navigate('/admin', { replace: true })
      } else {
        // For guest users, redirect to original destination or home
        const from = location.state?.from
        const destination = from
          ? `${from.pathname || '/'}${from.search || ''}${from.hash || ''}`
          : '/'
        navigate(destination, { replace: true })
      }
    }
  }, [user, navigate, location])

  const handleAuth = async (event) => {
    event.preventDefault()
    setAuthError('')
    setIsSigningIn(true)
    try {
      if (isSignUpMode) {
        await signUpWithEmail(email.trim(), password, firstName.trim(), lastName.trim())
      } else {
        const session = await loginWithEmail(email.trim(), password)
        // If user is an admin, they'll be redirected by the useEffect
        // Redirection handled by useEffect
      }
    } catch (error) {
      console.error('Auth failed:', error)
      setAuthError(getAuthErrorMessage(error, isSignUpMode ? 'signup' : 'signin'))
      setIsSigningIn(false)
    }
  }

  return (
    <div className="auth-page-wrapper">
      {!pageReady && <PageLoader text="Loading sign-in experience..." />}
      <Navbar />
      
      <main className="auth-main" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="auth-overlay"></div>
        
        <div className="auth-container animate-fade-in-up">
          <div className="auth-card glass">
            <div className="auth-header text-center">
              <h2>{isSignUpMode ? 'Join Our Adventure' : 'Welcome Back'}</h2>
              <p>{isSignUpMode ? 'Explore the wonders of Sablayan' : 'Sign in to manage your bookings'}</p>
            </div>

            <form className="auth-form" onSubmit={handleAuth}>
              {isSignUpMode && (
                <div className="auth-name-row">
                  <div className="input-field">
                    <label>First Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-field">
                    <label>Last Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Smith"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="input-field">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {authError && <div className="auth-error-msg">{authError}</div>}

              <button type="submit" className="auth-primary-btn" disabled={isSigningIn}>
                {isSigningIn 
                  ? (isSignUpMode ? 'Creating account...' : 'Signing in...') 
                  : (isSignUpMode ? 'Sign Up' : 'Sign In')
                }
              </button>
            </form>

            <div className="auth-footer text-center">
              <p>
                {isSignUpMode ? 'Already have an account?' : "Don't have an account?"}
                <button 
                  className="auth-toggle-link" 
                  onClick={() => {
                    setIsSignUpMode(!isSignUpMode)
                    setAuthError('')
                  }}
                >
                  {isSignUpMode ? 'Sign In' : 'Sign Up Now'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Auth
