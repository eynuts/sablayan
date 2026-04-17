// Shared helpers for admin dashboard pages.
// Includes formatting, normalizing Firebase data, status helpers, and analytics utilities.
import {
  getReservationPhase,
  getReservationWindow,
  getResolvedBookingStatus,
  getResolvedPaymentStatus
} from '../../utils/bookingPolicy'

export const formatCurrency = (value = 0) => (
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(Number(value) || 0)
)

export const formatDate = (value, options) => {
  if (!value) {
    return 'N/A'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A'
  }

  return parsed.toLocaleDateString('en-PH', options)
}

export const normalizeBookings = (data) => {
  if (!data) {
    return []
  }

  return Object.entries(data)
    .map(([id, booking]) => ({
      id,
      ...booking,
      paymentStatus: getResolvedPaymentStatus(booking),
      bookingStatus: getResolvedBookingStatus(booking),
      depositAmount: Number(booking?.depositAmount || 0),
      guests: Number(booking?.guests || 0)
    }))
    .sort((a, b) => {
      const left = new Date(b.createdAt || b.checkIn || 0).getTime()
      const right = new Date(a.createdAt || a.checkIn || 0).getTime()
      return left - right
    })
}

export const getPaymentStatusMeta = (status = '') => {
  const normalizedStatus = String(status || 'pending').trim().toLowerCase()

  if (normalizedStatus === 'confirmed') {
    return {
      label: 'confirmed',
      tone: 'confirmed',
      icon: 'fa-check-circle'
    }
  }

  if (normalizedStatus === 'cancelled') {
    return {
      label: 'cancelled',
      tone: 'cancelled',
      icon: 'fa-ban'
    }
  }

  return {
    label: 'pending',
    tone: 'pending',
    icon: 'fa-clock'
  }
}

export const normalizeRooms = (data) => {
  if (!data) {
    return []
  }

  return Object.entries(data)
    .map(([id, room]) => ({
      id,
      ...room,
      price: Number(room?.price || 0),
      features: Array.isArray(room?.features) ? room.features : []
    }))
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
}

const buildGuestKey = (booking) => {
  const email = (booking?.email || '').trim().toLowerCase()
  if (email) {
    return `email:${email}`
  }

  const fullName = `${booking?.firstName || ''} ${booking?.lastName || ''}`.trim().toLowerCase()
  return fullName ? `name:${fullName}` : ''
}

const isUserActive = (lastActive) => {
  if (!lastActive) {
    return false
  }
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000
  const lastActiveDate = new Date(lastActive).getTime()
  return lastActiveDate > thirtyMinutesAgo
}

export const normalizeUsers = (usersData, bookings, authUser) => {
  const usersMap = new Map()

  if (usersData) {
    Object.entries(usersData).forEach(([id, user]) => {
      const email = (user?.email || '').trim().toLowerCase()
      const name = user?.name || user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown User'
      const key = email ? `email:${email}` : `id:${id}`
      const lastActive = user?.lastActive || user?.lastLoginAt || null
      const resolvedStatus = lastActive ? (isUserActive(lastActive) ? 'active' : 'inactive') : (user?.status || 'active')

      usersMap.set(key, {
        id,
        name,
        email: user?.email || 'N/A',
        phone: user?.phone || 'N/A',
        role: user?.role || 'customer',
        status: resolvedStatus,
        lastActive,
        joinedDate: user?.joinedDate || user?.createdAt || null,
        totalBookings: Number(user?.totalBookings || 0)
      })
    })
  }

  bookings.forEach((booking) => {
    const key = buildGuestKey(booking)
    if (!key) {
      return
    }

    const fullName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || booking.name || 'Guest'
    const existing = usersMap.get(key)

    if (existing) {
      usersMap.set(key, {
        ...existing,
        phone: existing.phone === 'N/A' ? booking.phone || 'N/A' : existing.phone,
        joinedDate: existing.joinedDate || booking.createdAt || booking.checkIn || null,
        totalBookings: existing.totalBookings + 1
      })
      return
    }

    usersMap.set(key, {
      id: booking.id,
      name: fullName,
      email: booking.email || 'N/A',
      phone: booking.phone || 'N/A',
      role: 'customer',
      status: 'active',
      joinedDate: booking.createdAt || booking.checkIn || null,
      totalBookings: 1
    })
  })

  if (authUser?.email) {
    const key = `email:${authUser.email.trim().toLowerCase()}`
    const existing = usersMap.get(key)
    const lastActive = existing?.lastActive || authUser.metadata?.lastSignInTime || null
    // Admin is active if currently authenticated (logged in), otherwise check lastActive timestamp
    const adminStatus = 'active'
    usersMap.set(key, {
      id: authUser.uid || existing?.id || key,
      name: authUser.displayName || existing?.name || 'Admin User',
      email: authUser.email,
      phone: existing?.phone || 'N/A',
      role: existing?.role || 'admin',
      status: adminStatus,
      lastActive: lastActive,
      joinedDate: existing?.joinedDate || authUser.metadata?.creationTime || null,
      totalBookings: existing?.totalBookings || 0
    })
  }

  return Array.from(usersMap.values()).sort((a, b) => {
    const left = (a.name || '').localeCompare(b.name || '')
    return left
  })
}

export const getOccupancyStats = (rooms, bookings) => {
  const availableRooms = rooms.filter((room) => room.status !== 'maintenance')
  const now = new Date()

  const occupiedRoomIds = new Set(
    bookings
      .filter((booking) => booking.paymentStatus === 'confirmed')
      .filter((booking) => getReservationPhase(booking, now) === 'active')
      .map((booking) => booking.roomId || booking.room?.id || booking.room?.title)
      .filter(Boolean)
  )

  const total = availableRooms.length
  const occupied = total === 0
    ? 0
    : availableRooms.filter((room) => occupiedRoomIds.has(room.id) || occupiedRoomIds.has(room.title)).length

  return {
    occupied,
    total,
    percentage: total === 0 ? 0 : Math.round((occupied / total) * 100)
  }
}

export const getBookingOperationalStatus = (booking, now = new Date()) => {
  const phase = getReservationPhase(booking, now)
  const { startsAt, endsAt } = getReservationWindow(booking)

  if (phase === 'cancelled') {
    return {
      phase,
      label: 'Cancelled',
      tone: 'cancelled',
      details: booking?.cancelReason || 'Reservation was cancelled because check-in time passed without completed payment'
    }
  }

  if (phase === 'active') {
    return {
      phase,
      label: 'Checked in',
      tone: 'active',
      details: startsAt
        ? `Started ${startsAt.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
        : 'Reservation is already in effect'
    }
  }

  if (phase === 'upcoming') {
    return {
      phase,
      label: 'Upcoming',
      tone: 'upcoming',
      details: startsAt
        ? `Starts ${startsAt.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
        : 'Awaiting check-in time'
    }
  }

  if (phase === 'completed') {
    return {
      phase,
      label: 'Checked out',
      tone: 'completed',
      details: endsAt
        ? `Ended ${endsAt.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
        : 'Reservation already ended'
    }
  }

  return {
    phase,
    label: 'Schedule needed',
    tone: 'unscheduled',
    details: 'Missing valid stay dates'
  }
}

export const getRevenueSeries = (bookings, days = 7) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - 1 - index))
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)

    const value = bookings
      .filter((booking) => booking.paymentStatus === 'confirmed')
      .filter((booking) => {
        const createdAt = new Date(booking.createdAt || booking.checkIn || 0)
        return createdAt >= date && createdAt < nextDate
      })
      .reduce((sum, booking) => sum + Number(booking.depositAmount || 0), 0)

    return {
      label: date.toLocaleDateString('en-PH', { weekday: 'short' }),
      value
    }
  })
}

export const getRecentActivity = (bookings, users) => {
  const bookingActivity = bookings.map((booking) => {
    const guestName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || booking.name || 'Guest'
    const roomName = booking.room?.title || 'Room booking'
    const createdAt = booking.createdAt || booking.checkIn || null

    let action = 'submitted a booking for'
    let status = 'pending'

    if (booking.paymentStatus === 'cancelled') {
      action = 'had a booking auto-cancelled for'
      status = 'cancelled'
    } else if (booking.paymentStatus === 'confirmed') {
      action = 'confirmed payment for'
      status = 'confirmed'
    }

    return {
      id: `booking-${booking.id}`,
      user: guestName,
      action,
      target: roomName,
      time: createdAt,
      status
    }
  })

  const userActivity = users
    .filter((user) => user.joinedDate)
    .map((user) => ({
      id: `user-${user.id}`,
      user: user.name,
      action: 'joined the platform',
      target: 'New account',
      time: user.joinedDate,
      status: 'new'
    }))

  return [...bookingActivity, ...userActivity]
    .filter((entry) => entry.time)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 6)
}

export const getRelativeTime = (value) => {
  if (!value) {
    return 'Unknown time'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time'
  }

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) {
    return 'Just now'
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  }

  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}
