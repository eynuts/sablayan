import { createContext, useContext, useEffect, useState } from 'react'
import { onValue, ref, push, update, get } from 'firebase/database'
import { db } from './firebase'
import { useAuth } from './AuthContext'

const NotificationContext = createContext()

// Helper function to send notification to a user by email (primarily for admin use)
export const sendNotificationByEmail = async (userEmail, type, title, message, data = {}) => {
  try {
    // Get all users and find the one with the matching email
    const usersRef = ref(db, 'users')
    const snapshot = await get(usersRef)
    
    if (snapshot.exists()) {
      const users = snapshot.val()
      const userId = Object.entries(users).find(([_, user]) => user.email === userEmail)?.[0]
      
      if (userId) {
        const notificationsRef = ref(db, `notifications/${userId}`)
        await push(notificationsRef, {
          type,
          title,
          message,
          data,
          timestamp: new Date().toISOString(),
          read: false
        })
        return true
      }
    }
    
    // If user not found in users collection, try using email as a fallback path
    const notificationId = userEmail.replace(/[.@]/g, '_')
    const notificationsRef = ref(db, `notificationsByEmail/${notificationId}`)
    await push(notificationsRef, {
      type,
      title,
      message,
      data,
      timestamp: new Date().toISOString(),
      read: false
    })
    return true
  } catch (error) {
    console.error('Error sending notification:', error)
    return false
  }
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Listen for notifications in Firebase
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    const notificationsRef = ref(db, `notifications/${user.uid}`)
    const unsubscribe = onValue(
      notificationsRef,
      (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const notificationsList = Object.entries(data).map(([id, notification]) => ({
            id,
            ...notification
          }))
          // Sort by timestamp descending (newest first)
          notificationsList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          setNotifications(notificationsList)
          
          // Count unread notifications
          const unread = notificationsList.filter(n => !n.read).length
          setUnreadCount(unread)
        } else {
          setNotifications([])
          setUnreadCount(0)
        }
      },
      (error) => console.error('Error loading notifications:', error)
    )

    return () => unsubscribe()
  }, [user])

  // Add a new notification
  const addNotification = async (type, title, message, data = {}) => {
    if (!user) return

    try {
      const notificationsRef = ref(db, `notifications/${user.uid}`)
      await push(notificationsRef, {
        type, // 'booking', 'cancel', 'approval', 'admin_action', etc.
        title,
        message,
        data,
        timestamp: new Date().toISOString(),
        read: false
      })
    } catch (error) {
      console.error('Error adding notification:', error)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!user) return

    try {
      const notificationRef = ref(db, `notifications/${user.uid}/${notificationId}`)
      await update(notificationRef, { read: true })
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return

    try {
      for (const notification of notifications) {
        if (!notification.read) {
          const notificationRef = ref(db, `notifications/${user.uid}/${notification.id}`)
          await update(notificationRef, { read: true })
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
