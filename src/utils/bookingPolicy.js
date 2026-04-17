export const CHECK_IN_TIME = '14:00'
export const CHECK_OUT_TIME = '12:00'
export const BOOKING_TIMEZONE = 'Asia/Manila'

const formatParts = (date) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOOKING_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  return formatter.formatToParts(date).reduce((parts, part) => {
    if (part.type !== 'literal') {
      parts[part.type] = part.value
    }

    return parts
  }, {})
}

export const formatPolicyTime = (value) => {
  if (!value) {
    return 'N/A'
  }

  const [hours = '0', minutes = '0'] = value.split(':')
  const formatted = new Date(2000, 0, 1, Number(hours), Number(minutes))

  return formatted.toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit'
  })
}

export const getBookingDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) {
    return null
  }

  const [year, month, day] = dateValue.split('-').map(Number)
  const [hours, minutes] = timeValue.split(':').map(Number)

  if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) {
    return null
  }

  const base = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0))
  const baseParts = formatParts(base)
  const requestedMinutes = (hours * 60) + minutes
  const baseMinutes = (Number(baseParts.hour || 0) * 60) + Number(baseParts.minute || 0)

  return new Date(base.getTime() + ((requestedMinutes - baseMinutes) * 60000))
}

export const getReservationWindow = (booking) => {
  const isZipline = booking?.type === 'zipline'
  
  if (isZipline) {
    // For zipline, the activity starts at the booking date (using CHECK_IN_TIME as the activity window start)
    // and we check if the date has passed
    return {
      startsAt: getBookingDateTime(booking?.date, CHECK_IN_TIME),
      endsAt: getBookingDateTime(booking?.date, '23:59')
    }
  }
  
  // For room bookings
  return {
    startsAt: getBookingDateTime(booking?.checkIn, CHECK_IN_TIME),
    endsAt: getBookingDateTime(booking?.checkOut, CHECK_OUT_TIME)
  }
}

export const isSettledPaymentStatus = (status = '') => String(status).trim().toLowerCase() === 'confirmed'

export const shouldAutoCancelReservation = (booking, now = new Date()) => {
  const { startsAt } = getReservationWindow(booking)
  const paymentStatus = String(booking?.paymentStatus || '').trim().toLowerCase()
  const bookingStatus = String(booking?.bookingStatus || '').trim().toLowerCase()

  if (!startsAt) {
    return false
  }

  if (paymentStatus === 'cancelled' || bookingStatus === 'cancelled') {
    return false
  }

  if (isSettledPaymentStatus(paymentStatus)) {
    return false
  }

  return now >= startsAt
}

export const getResolvedPaymentStatus = (booking, now = new Date()) => (
  shouldAutoCancelReservation(booking, now)
    ? 'cancelled'
    : String(booking?.paymentStatus || 'pending').trim().toLowerCase()
)

export const getResolvedBookingStatus = (booking, now = new Date()) => (
  shouldAutoCancelReservation(booking, now)
    ? 'cancelled'
    : String(booking?.bookingStatus || 'pending').trim().toLowerCase()
)

export const getReservationPhase = (booking, now = new Date()) => {
  // If booking is already cancelled (by payment status or booking status), always show cancelled
  const paymentStatus = String(booking?.paymentStatus || '').trim().toLowerCase()
  const bookingStatus = String(booking?.bookingStatus || '').trim().toLowerCase()
  
  if (paymentStatus === 'cancelled' || bookingStatus === 'cancelled') {
    return 'cancelled'
  }

  if (shouldAutoCancelReservation(booking, now)) {
    return 'cancelled'
  }

  const { startsAt, endsAt } = getReservationWindow(booking)

  if (!startsAt || !endsAt) {
    return 'unscheduled'
  }

  if (now < startsAt) {
    return 'upcoming'
  }

  if (now >= endsAt) {
    return 'completed'
  }

  return 'active'
}
