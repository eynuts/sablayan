import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { clearAdminSession, hydrateAdminSession, logOutAdmin, signInAdminWithEmailPassword } from './firebase'

const AdminAuthContext = createContext(null)

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)

  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }

  return context
}

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true
    let timeoutId

    const hydrateWithTimeout = async () => {
      try {
        const hydrationPromise = hydrateAdminSession()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Hydration timeout')), 5000)
        )
        
        const session = await Promise.race([hydrationPromise, timeoutPromise])
        
        if (!active) {
          return
        }

        setUser(session)
        setIsAdmin(session?.role === 'admin')

        // Allow both admin and moderator roles to access admin area
        if (session && !['admin', 'moderator'].includes(session.role)) {
          clearAdminSession()
        }
      } catch (error) {
        console.error('Failed to hydrate admin session:', error)
        if (active) {
          setUser(null)
          setIsAdmin(false)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    hydrateWithTimeout()

    return () => {
      active = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const loginWithEmail = async (email, password) => {
    const session = await signInAdminWithEmailPassword(email, password)
    setUser(session)
    setIsAdmin(session?.role === 'admin')
    return session
  }

  const logout = async () => {
    await logOutAdmin()
    setUser(null)
    setIsAdmin(false)
  }

  const value = useMemo(() => ({
    user,
    loading,
    isAdmin,
    loginWithEmail,
    logout
  }), [user, loading, isAdmin])

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export default AdminAuthContext
