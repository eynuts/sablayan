import { initializeApp } from 'firebase/app'
import { getDatabase, get, set, ref, update } from 'firebase/database'
import crypto from 'crypto'

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
const db = getDatabase(app)

const encodeBase64 = (buffer) => {
  return Buffer.from(buffer).toString('base64')
}

const createSalt = () => {
  const bytes = crypto.randomBytes(16)
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
}

const hashPassword = async (password, salt) => {
  const encoder = new TextEncoder()
  const payload = encoder.encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', payload)
  return encodeBase64(digest)
}

const resetAdminPassword = async () => {
  try {
    const email = 'admin@gmail.com'
    const password = 'password123'
    
    console.log('Finding admin account...')
    
    // Find admin user by email
    const usersSnapshot = await get(ref(db, 'users'))
    if (!usersSnapshot.exists()) {
      console.error('No users found in database')
      process.exit(1)
    }

    const users = usersSnapshot.val()
    let adminUid = null
    
    for (const [uid, user] of Object.entries(users)) {
      if (user.email?.toLowerCase() === email.toLowerCase() && user.role === 'admin') {
        adminUid = uid
        break
      }
    }

    if (!adminUid) {
      console.error('Admin account not found')
      process.exit(1)
    }

    console.log(`Found admin account: ${adminUid}`)

    // Create new password hash
    const passwordSalt = createSalt()
    const passwordHash = await hashPassword(password, passwordSalt)

    // Update admin password
    await update(ref(db, `users/${adminUid}`), {
      passwordSalt,
      passwordHash,
      updatedAt: new Date().toISOString()
    })

    console.log('✓ Admin password reset successfully!')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    process.exit(0)
  } catch (error) {
    console.error('Error resetting admin password:', error)
    process.exit(1)
  }
}

resetAdminPassword()
