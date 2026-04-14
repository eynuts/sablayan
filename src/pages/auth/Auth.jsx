// ============================================
// AUTH COMPONENT - Login and Signup Page
// ============================================
// This file handles user authentication (sign in and sign up)

// React hooks for managing state and side effects
import { useState, useEffect } from 'react'
// React Router hooks for navigation and getting current URL info
import { useNavigate, useLocation } from 'react-router-dom'
// Custom hook that provides authentication functions
import { useAuth } from '../../AuthContext'
// Firebase helper functions for authentication
import { clearGuestSession, getAuthErrorMessage } from '../../firebase'
// UI components used in this page
import Navbar from '../../components/Navbar'           // Top navigation bar
import PageLoader from '../../components/PageLoader'   // Loading spinner
// Hero background image for the page
import heroImage from '../../assets/images/hero.webp'
// Utility function to preload images before showing the page
import { preloadImage } from '../../utils/pageLoad'
// CSS styles for this component
import './Auth.css'

const Auth = () => {
  // ============================================
  // STATE VARIABLES - Store component data
  // ============================================
  
  // Form input fields
  const [firstName, setFirstName] = useState('')    // User's first name (signup only)
  const [lastName, setLastName] = useState('')      // User's last name (signup only)
  const [email, setEmail] = useState('')            // User's email address
  const [password, setPassword] = useState('')      // User's password
  
  // UI state
  const [authError, setAuthError] = useState('')           // Error message to display
  const [isSignUpMode, setIsSignUpMode] = useState(false)  // Toggle between signin/signup
  const [isSigningIn, setIsSigningIn] = useState(false)    // Loading state during auth
  const [pageReady, setPageReady] = useState(false)        // Whether page assets are loaded
  
  // ============================================
  // HOOKS - Get functions and data from context
  // ============================================
  
  // useAuth() provides: user (current user data), loginWithEmail, signUpWithEmail
  const { user, loginWithEmail, signUpWithEmail } = useAuth()
  // navigate() - function to redirect to other pages
  const navigate = useNavigate()
  // location - info about current URL (used to redirect back after login)
  const location = useLocation()

  // ============================================
  // EFFECT 1: Lock scrolling on page mount
  // ============================================
  // This prevents the user from scrolling the page while on the auth screen
  // It creates a fixed, non-scrollable experience
  useEffect(() => {
    // Save the original overflow styles so we can restore them later
    const originalBodyOverflow = window.getComputedStyle(document.body).overflow
    const originalHtmlOverflow = window.getComputedStyle(document.documentElement).overflow
    
    // Disable scrolling on both body and html elements
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    
    // CLEANUP FUNCTION: Runs when component unmounts
    // This restores the original scroll behavior when leaving the page
    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
    }
  }, [])  // Empty dependency array = run once on mount

  // ============================================
  // EFFECT 2: Preload background image
  // ============================================
  // Preloads the hero background image before showing the page
  // This prevents the background from appearing slowly/in chunks
  useEffect(() => {
    let active = true  // Flag to prevent setting state if component unmounts

    // Preload the hero image, then mark page as ready
    preloadImage(heroImage).finally(() => {
      if (active) {
        setPageReady(true)  // Show the page once image is loaded
      }
    })

    // Cleanup: mark as inactive if component unmounts during loading
    return () => {
      active = false
    }
  }, [])  // Empty dependency array = run once on mount

  // ============================================
  // EFFECT 3: Redirect logged-in users
  // ============================================
  // If user is already logged in, automatically redirect them away from auth page
  // Admin users go to admin panel, regular users go to their intended destination
  useEffect(() => {
    if (user) {  // Check if user is logged in
      if (user.role === 'admin') {
        // Admin users are redirected to the admin dashboard
        navigate('/admin', { replace: true })
      } else {
        // Regular users: redirect to where they were trying to go, or home page
        const from = location.state?.from  // Get the page they came from (if any)
        const destination = from
          ? `${from.pathname || '/'}${from.search || ''}${from.hash || ''}`
          : '/'  // Default to home page
        navigate(destination, { replace: true })
      }
    }
  }, [user, navigate, location])  // Re-run when user, navigate, or location changes

  // ============================================
  // HANDLE AUTH - Process sign in or sign up
  // ============================================
  // This function is called when the form is submitted
  // It either creates a new account (signup) or logs in existing user (signin)
  const handleAuth = async (event) => {
    event.preventDefault()  // Prevent default form submission (page reload)
    setAuthError('')        // Clear any previous error messages
    setIsSigningIn(true)    // Show loading state on the button
    
    try {
      if (isSignUpMode) {
        // SIGN UP MODE: Create new user account
        await signUpWithEmail(
          email.trim(),      // Remove extra spaces from email
          password,          // Password as entered
          firstName.trim(),  // Remove extra spaces from first name
          lastName.trim()    // Remove extra spaces from last name
        )
      } else {
        // SIGN IN MODE: Log in existing user
        await loginWithEmail(email.trim(), password)
        // Note: Successful login triggers the useEffect above to redirect
      }
    } catch (error) {
      // Handle authentication errors
      console.error('Auth failed:', error)
      // Get user-friendly error message based on error type
      setAuthError(getAuthErrorMessage(error, isSignUpMode ? 'signup' : 'signin'))
      setIsSigningIn(false)  // Reset loading state so user can try again
    }
  }

  // ============================================
  // RENDER - JSX UI Structure
  // ============================================
  return (
    // Main wrapper - fixed position covering entire viewport
    <div className="auth-page-wrapper">
      {/* Show loading spinner while background image is loading */}
      {!pageReady && <PageLoader text="Loading sign-in experience..." />}
      
      {/* Navigation bar at the top */}
      <Navbar />
      
      {/* Main content area with hero background image */}
      <main className="auth-main" style={{ backgroundImage: `url(${heroImage})` }}>
        {/* Dark overlay on top of background image for better text readability */}
        <div className="auth-overlay"></div>
        
        {/* Container for the auth form - centered on screen */}
        <div className="auth-container animate-fade-in-up">
          {/* Glassmorphism card containing the form */}
          <div className="auth-card glass">
            {/* Header section - changes text based on signin/signup mode */}
            <div className="auth-header text-center">
              <h2>{isSignUpMode ? 'Join Our Adventure' : 'Welcome Back'}</h2>
              <p>{isSignUpMode ? 'Explore the wonders of Sablayan' : 'Sign in to manage your bookings'}</p>
            </div>

            {/* Authentication form - handles both signin and signup */}
            <form className="auth-form" onSubmit={handleAuth}>
              {/* Name fields - only shown in signup mode */}
              {isSignUpMode && (
                <div className="auth-name-row">
                  {/* First Name input */}
                  <div className="input-field">
                    <label>First Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}  // Update state on typing
                      required  // HTML5 validation - field must be filled
                    />
                  </div>
                  {/* Last Name input */}
                  <div className="input-field">
                    <label>Last Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Smith"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}  // Update state on typing
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email input field - shown in both modes */}
              <div className="input-field">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}  // Update state on typing
                  required  // HTML5 email validation
                />
              </div>

              {/* Password input field - shown in both modes */}
              <div className="input-field">
                <label>Password</label>
                <input
                  type="password"           // Hides characters (dots)
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}  // Update state on typing
                  required
                />
              </div>

              {/* Error message display - only shown when authError exists */}
              {authError && <div className="auth-error-msg">{authError}</div>}

              {/* Submit button - text changes based on mode and loading state */}
              <button type="submit" className="auth-primary-btn" disabled={isSigningIn}>
                {isSigningIn 
                  ? (isSignUpMode ? 'Creating account...' : 'Signing in...')  // Loading text
                  : (isSignUpMode ? 'Sign Up' : 'Sign In')                      // Default text
                }
              </button>
            </form>

            {/* Footer section with link to toggle between signin/signup */}
            <div className="auth-footer text-center">
              <p>
                {/* Question text changes based on current mode */}
                {isSignUpMode ? 'Already have an account?' : "Don't have an account?"}
                {/* Toggle button - switches between signin and signup modes */}
                <button 
                  className="auth-toggle-link" 
                  onClick={() => {
                    setIsSignUpMode(!isSignUpMode)  // Toggle the mode
                    setAuthError('')                 // Clear any errors when switching
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
