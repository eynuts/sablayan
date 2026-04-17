import { initializeApp } from 'firebase/app'
import { getDatabase, get, push, ref, set, update } from 'firebase/database'
import { shouldAutoCancelReservation } from './utils/bookingPolicy'

const firebaseConfig = {
  apiKey: 'AIzaSyD53J1A089gk6ew08_f9I6BJnjcmU_6jXU',
  authDomain: 'sablayan-aa4f8.firebaseapp.com',
  projectId: 'sablayan-aa4f8',
  storageBucket: 'sablayan-aa4f8.firebasestorage.app',
  messagingSenderId: '683294991188',
  appId: '1:683294991188:web:7e16b120783302125cdec1',
  measurementId: 'G-NPW44M3P98',
  databaseURL: 'https://sablayan-aa4f8-default-rtdb.asia-southeast1.firebasedatabase.app'
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)

const GUEST_SESSION_KEY = 'sablayan_guest_session'
const ADMIN_SESSION_KEY = 'sablayan_admin_session'

const readSession = (key) => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error('Failed to read stored session:', error)
    return null
  }
}

const writeSession = (key, value) => {
  if (typeof window === 'undefined') {
    return
  }

  if (!value) {
    window.localStorage.removeItem(key)
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

const normalizeUserSession = (uid, user = {}) => ({
  uid,
  email: user.email || '',
  displayName: user.displayName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Guest',
  firstName: user.firstName || '',
  lastName: user.lastName || '',
  photoURL: user.photoURL || '',
  role: user.role || 'customer',
  status: user.status || 'active'
})

const encodeBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return window.btoa(binary)
}

const createSalt = () => {
  const bytes = new Uint8Array(16)
  window.crypto.getRandomValues(bytes)
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
}

const hashPassword = async (password, salt) => {
  const encoder = new TextEncoder()
  const payload = encoder.encode(`${salt}:${password}`)
  const digest = await window.crypto.subtle.digest('SHA-256', payload)
  return encodeBase64(digest)
}

const LEGACY_DEFAULT_PASSWORD = 'password123'

const findUserByEmail = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (!normalizedEmail) {
    return null
  }

  const snapshot = await get(ref(db, 'users'))
  if (!snapshot.exists()) {
    return null
  }

  const entries = Object.entries(snapshot.val())
  const match = entries.find(([, user]) => String(user?.email || '').trim().toLowerCase() === normalizedEmail)

  if (!match) {
    return null
  }

  const [uid, user] = match
  return {
    uid,
    user
  }
}

const setLastLogin = async (uid) => {
  await update(ref(db, `users/${uid}`), {
    lastLoginAt: new Date().toISOString()
  })
}

export const getStoredGuestSession = () => readSession(GUEST_SESSION_KEY)
export const getStoredAdminSession = () => readSession(ADMIN_SESSION_KEY)

export const clearGuestSession = () => writeSession(GUEST_SESSION_KEY, null)
export const clearAdminSession = () => writeSession(ADMIN_SESSION_KEY, null)

const resolvePasswordRecord = async (uid, user, password) => {
  if (user.passwordHash && user.passwordSalt) {
    return {
      passwordHash: user.passwordHash,
      passwordSalt: user.passwordSalt
    }
  }

  if (password !== LEGACY_DEFAULT_PASSWORD) {
    const error = new Error('Invalid email or password.')
    error.code = 'auth/invalid-credential'
    throw error
  }

  const passwordSalt = createSalt()
  const passwordHash = await hashPassword(password, passwordSalt)

  await update(ref(db, `users/${uid}`), {
    passwordSalt,
    passwordHash
  })

  return {
    passwordHash,
    passwordSalt
  }
}

export const signInWithEmailPassword = async (email, password) => {
  const match = await findUserByEmail(email)

  if (!match) {
    const error = new Error('User not found.')
    error.code = 'auth/user-not-found'
    throw error
  }

  const { uid, user } = match
  const { passwordHash, passwordSalt } = await resolvePasswordRecord(uid, user, password)
  const candidateHash = await hashPassword(password, passwordSalt)
  if (candidateHash !== passwordHash) {
    const error = new Error('Invalid email or password.')
    error.code = 'auth/invalid-credential'
    throw error
  }

  const session = normalizeUserSession(uid, user)
  writeSession(GUEST_SESSION_KEY, session)
  await setLastLogin(uid)
  return session
}

export const signInAdminWithEmailPassword = async (email, password) => {
  const match = await findUserByEmail(email)

  if (!match) {
    const error = new Error('User not found.')
    error.code = 'auth/user-not-found'
    throw error
  }

  const { uid, user } = match
  const { passwordHash, passwordSalt } = await resolvePasswordRecord(uid, user, password)
  const candidateHash = await hashPassword(password, passwordSalt)
  if (candidateHash !== passwordHash) {
    const error = new Error('Invalid email or password.')
    error.code = 'auth/invalid-credential'
    throw error
  }

  const session = normalizeUserSession(uid, user)
  writeSession(ADMIN_SESSION_KEY, session)
  await setLastLogin(uid)
  return session
}

export const verifyAdminPassword = async (email, password) => {
  const match = await findUserByEmail(email)

  if (!match) {
    const error = new Error('User not found.')
    error.code = 'auth/user-not-found'
    throw error
  }

  const { uid, user } = match
  const { passwordHash, passwordSalt } = await resolvePasswordRecord(uid, user, password)
  const candidateHash = await hashPassword(password, passwordSalt)
  if (candidateHash !== passwordHash) {
    const error = new Error('Invalid password.')
    error.code = 'auth/invalid-password'
    throw error
  }

  return true
}

export const signUpWithEmailPassword = async (email, password, firstName, lastName) => {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const trimmedFirstName = String(firstName || '').trim()
  const trimmedLastName = String(lastName || '').trim()

  if (!normalizedEmail) {
    const error = new Error('Invalid email.')
    error.code = 'auth/invalid-email'
    throw error
  }

  if (String(password || '').length < 6) {
    const error = new Error('Weak password.')
    error.code = 'auth/weak-password'
    throw error
  }

  const existing = await findUserByEmail(normalizedEmail)
  if (existing?.user?.passwordHash && existing?.user?.passwordSalt) {
    const error = new Error('Email already in use.')
    error.code = 'auth/email-already-in-use'
    throw error
  }
  const displayName = `${trimmedFirstName} ${trimmedLastName}`.trim()
  const passwordSalt = createSalt()
  const passwordHash = await hashPassword(password, passwordSalt)
  const createdAt = new Date().toISOString()
  let uid = existing?.uid
  let payload

  if (existing) {
    payload = {
      ...existing.user,
      email: normalizedEmail,
      displayName: displayName || existing.user.displayName || existing.user.name || '',
      name: displayName || existing.user.name || existing.user.displayName || '',
      firstName: trimmedFirstName || existing.user.firstName || '',
      lastName: trimmedLastName || existing.user.lastName || '',
      photoURL: existing.user.photoURL || '',
      status: existing.user.status || 'active',
      role: existing.user.role || 'customer',
      createdAt: existing.user.createdAt || createdAt,
      lastLoginAt: createdAt,
      passwordSalt,
      passwordHash
    }

    await update(ref(db, `users/${uid}`), payload)
  } else {
    const userRef = push(ref(db, 'users'))
    uid = userRef.key
    payload = {
      email: normalizedEmail,
      displayName,
      name: displayName,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      photoURL: '',
      status: 'active',
      role: 'customer',
      createdAt,
      lastLoginAt: createdAt,
      passwordSalt,
      passwordHash
    }

    await set(userRef, payload)
  }

  const session = normalizeUserSession(uid, payload)
  writeSession(GUEST_SESSION_KEY, session)
  return session
}

export const updateUserAccountProfile = async ({ uid, firstName = '', lastName = '', photoURL = '' }) => {
  if (!uid) {
    throw new Error('No authenticated user found.')
  }

  const userRef = ref(db, `users/${uid}`)
  const userSnapshot = await get(userRef)

  if (!userSnapshot.exists()) {
    throw new Error('User account could not be found.')
  }

  const currentUser = userSnapshot.val()
  const trimmedFirstName = firstName.trim()
  const trimmedLastName = lastName.trim()
  const displayName = `${trimmedFirstName} ${trimmedLastName}`.trim()
  const payload = {
    displayName: displayName || currentUser.displayName || '',
    name: displayName || currentUser.name || '',
    firstName: trimmedFirstName,
    lastName: trimmedLastName,
    photoURL: photoURL || currentUser.photoURL || '',
    updatedAt: new Date().toISOString()
  }

  await update(userRef, payload)

  const nextSession = normalizeUserSession(uid, {
    ...currentUser,
    ...payload
  })

  const guestSession = getStoredGuestSession()
  if (guestSession?.uid === uid) {
    writeSession(GUEST_SESSION_KEY, nextSession)
  }

  const adminSession = getStoredAdminSession()
  if (adminSession?.uid === uid) {
    writeSession(ADMIN_SESSION_KEY, nextSession)
  }

  return nextSession
}

export const hydrateGuestSession = async () => {
  const stored = getStoredGuestSession()
  if (!stored?.uid) {
    return null
  }

  const snapshot = await get(ref(db, `users/${stored.uid}`))
  if (!snapshot.exists()) {
    clearGuestSession()
    return null
  }

  const session = normalizeUserSession(stored.uid, snapshot.val())
  writeSession(GUEST_SESSION_KEY, session)
  return session
}

export const hydrateAdminSession = async () => {
  const stored = getStoredAdminSession()
  if (!stored?.uid) {
    return null
  }

  const snapshot = await get(ref(db, `users/${stored.uid}`))
  if (!snapshot.exists()) {
    clearAdminSession()
    return null
  }

  const session = normalizeUserSession(stored.uid, snapshot.val())
  writeSession(ADMIN_SESSION_KEY, session)
  return session
}

export const logOut = async () => {
  clearGuestSession()
}

export const logOutAdmin = async () => {
  clearAdminSession()
}

export const getAuthErrorMessage = (error, mode = 'signin') => {
  const code = String(error?.code || '').trim()

  if (mode === 'signup') {
    if (code === 'auth/email-already-in-use') {
      return 'That email is already registered. Try signing in instead.'
    }

    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.'
    }

    if (code === 'auth/weak-password') {
      return 'Password must be at least 6 characters long.'
    }
  }

  if (mode === 'signin') {
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.'
    }

    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Invalid email or password.'
    }

    if (code === 'auth/missing-password-record') {
      return 'This account was created before database login was enabled and does not have a password here yet.'
    }
  }

  return mode === 'signup'
    ? 'Sign up failed. Please check your details and try again.'
    : 'Sign in failed. Please try again.'
}

export const changePassword = async (uid, currentPassword, newPassword) => {
  if (!uid) {
    throw new Error('No authenticated user found.')
  }

  if (String(newPassword || '').length < 6) {
    const error = new Error('New password must be at least 6 characters long.')
    error.code = 'auth/weak-password'
    throw error
  }

  const userRef = ref(db, `users/${uid}`)
  const userSnapshot = await get(userRef)

  if (!userSnapshot.exists()) {
    throw new Error('User account could not be found.')
  }

  const user = userSnapshot.val()
  
  // Use the same password verification as signIn
  const { passwordHash, passwordSalt } = await resolvePasswordRecord(uid, user, currentPassword)
  const candidateHash = await hashPassword(currentPassword, passwordSalt)
  
  if (candidateHash !== passwordHash) {
    const error = new Error('Current password is incorrect.')
    error.code = 'auth/invalid-password'
    throw error
  }

  // Hash the new password with a new salt
  const newPasswordSalt = createSalt()
  const newPasswordHash = await hashPassword(newPassword, newPasswordSalt)

  await update(userRef, {
    passwordSalt: newPasswordSalt,
    passwordHash: newPasswordHash,
    updatedAt: new Date().toISOString()
  })

  return true
}

export const syncExpiredPendingBookings = async (bookings = []) => {
  const updates = {}

  bookings.forEach((booking) => {
    if (!booking?.id || !shouldAutoCancelReservation(booking)) {
      return
    }

    const isZipline = booking?.type === 'zipline'
    const reason = isZipline
      ? 'Activity date reached without completed payment.'
      : 'Check-in date reached without completed payment.'

    updates[`bookings/${booking.id}/paymentStatus`] = 'cancelled'
    updates[`bookings/${booking.id}/bookingStatus`] = 'cancelled'
    updates[`bookings/${booking.id}/cancelledAt`] = new Date().toISOString()
    updates[`bookings/${booking.id}/cancelReason`] = reason
  })

  if (Object.keys(updates).length === 0) {
    return false
  }

  await update(ref(db), updates)
  return true
}

export default app
