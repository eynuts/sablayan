import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { hydrateGuestSession, logOut, signInWithEmailPassword, signUpWithEmailPassword } from './firebase'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    hydrateGuestSession()
      .then((session) => {
        if (active) {
          setUser(session)
        }
      })
      .catch((error) => {
        console.error('Failed to hydrate guest session:', error)
        if (active) {
          setUser(null)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const loginWithEmail = async (email, password) => {
    const session = await signInWithEmailPassword(email, password)
    setUser(session)
    return session
  }

  const signUpWithEmail = async (email, password, firstName, lastName) => {
    const session = await signUpWithEmailPassword(email, password, firstName, lastName)
    setUser(session)
    return session
  }

  const logout = async () => {
    await logOut()
    setUser(null)
  }

  const value = useMemo(() => ({
    user,
    loading,
    loginWithEmail,
    signUpWithEmail,
    logout,
    isAuthenticated: !!user
  }), [user, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
