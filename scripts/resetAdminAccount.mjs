import { initializeApp } from 'firebase/app'
import { getDatabase, get, set, ref, remove } from 'firebase/database'
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

const createSalt = () => {
  const bytes = crypto.randomBytes(16)
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
}

const hashPassword = (password, salt) => {
  const hash = crypto.createHash('sha256')
  hash.update(`${salt}:${password}`)
  return hash.digest('base64')
}

const resetAdminAccount = async () => {
  try {
    const email = 'admin@gmail.com'
    const password = 'password123'
    
    console.log('Resetting admin account...')
    
    // Find and delete all existing admin accounts
    const usersSnapshot = await get(ref(db, 'users'))
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val()
      const adminIds = []
      
      Object.entries(users).forEach(([uid, user]) => {
        if (user.email?.toLowerCase() === email.toLowerCase()) {
          adminIds.push(uid)
        }
      })
      
      for (const uid of adminIds) {
        console.log(`Deleting old admin account: ${uid}`)
        await remove(ref(db, `users/${uid}`))
      }
    }
    
    // Create new admin user object with correct password hashing
    const passwordSalt = createSalt()
    const passwordHash = hashPassword(password, passwordSalt)
    
    const adminUser = {
      email,
      displayName: 'Admin',
      name: 'Admin',
      firstName: 'Admin',
      lastName: '',
      photoURL: '',
      status: 'active',
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      passwordSalt,
      passwordHash
    }
    
    // Generate a unique ID and save the admin user
    const adminRef = ref(db, `users/admin_${Date.now()}`)
    await set(adminRef, adminUser)
    
    console.log('✓ Admin account reset successfully!')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    console.log(`Role: admin`)
    
    process.exit(0)
  } catch (error) {
    console.error('Error resetting admin account:', error)
    process.exit(1)
  }
}

resetAdminAccount()
