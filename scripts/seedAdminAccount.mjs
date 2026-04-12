import { initializeApp } from 'firebase/app'
import { getDatabase, get, set, ref } from 'firebase/database'
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

const seedAdminAccount = async () => {
  try {
    const email = 'admin@gmail.com'
    const password = 'password123'
    
    console.log('Creating admin account...')
    
    // Check if admin already exists
    const usersSnapshot = await get(ref(db, 'users'))
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val()
      const adminExists = Object.values(users).some(
        (user) => user.email?.toLowerCase() === email.toLowerCase() && user.role === 'admin'
      )
      
      if (adminExists) {
        console.log('Admin account already exists!')
        process.exit(0)
      }
    }
    
    // Create password hash
    const passwordSalt = createSalt()
    const passwordHash = await hashPassword(password, passwordSalt)
    
    // Create admin user object
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
    
    console.log('✓ Admin account created successfully!')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    console.log(`Role: admin`)
    
    process.exit(0)
  } catch (error) {
    console.error('Error creating admin account:', error)
    process.exit(1)
  }
}

seedAdminAccount()
