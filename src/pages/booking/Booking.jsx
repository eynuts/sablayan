// Booking page imports and helper utilities.
// This page supports both room reservations and zipline activity bookings.
// It reads room and pricing data from Firebase, validates user input,
// calculates discounts and deposit amounts, and forwards booking info
// to the payment page.
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { onValue, ref } from 'firebase/database'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useAuth } from '../../AuthContext'
import PageLoader from '../../components/PageLoader'
import { db } from '../../firebase'
import { preloadImage } from '../../utils/pageLoad'
import { CHECK_IN_TIME, CHECK_OUT_TIME, formatPolicyTime } from '../../utils/bookingPolicy'
import './Booking.css'

// clampNumber ensures we never exceed min/max bounds when the guest counts
// are updated via inputs or buttons.
const clampNumber = (value, min, max) => Math.min(Math.max(Number(value) || 0, min), max)

const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) {
    return 0
  }

  const start = new Date(checkIn)
  const end = new Date(checkOut)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Number.isFinite(diffDays) && diffDays > 0 ? diffDays : 0
}

const calculateZiplinePricing = ({
  pricePerPerson,
  totalGuests,
  seniorGuests,
  childGuests,
  seniorDiscountPercent,
  childDiscountPercent
}) => {
  const normalizedTotalGuests = clampNumber(totalGuests, 1, 10)
  const normalizedSeniorGuests = clampNumber(seniorGuests, 0, normalizedTotalGuests)
  const normalizedChildGuests = clampNumber(childGuests, 0, normalizedTotalGuests - normalizedSeniorGuests)
  const regularGuests = Math.max(normalizedTotalGuests - (normalizedSeniorGuests + normalizedChildGuests), 0)

  const baseAmount = Number(pricePerPerson || 0) * normalizedTotalGuests
  const seniorDiscountAmount = Math.round(Number(pricePerPerson || 0) * normalizedSeniorGuests * (Number(seniorDiscountPercent || 0) / 100))
  const childDiscountAmount = Math.round(Number(pricePerPerson || 0) * normalizedChildGuests * (Number(childDiscountPercent || 0) / 100))
  const discountAmount = seniorDiscountAmount + childDiscountAmount
  const totalAmount = Math.max(baseAmount - discountAmount, 0)
  const depositAmount = Math.round(totalAmount * 0.5)

  return {
    totalGuests: normalizedTotalGuests,
    seniorGuests: normalizedSeniorGuests,
    childGuests: normalizedChildGuests,
    regularGuests,
    baseAmount,
    seniorDiscountAmount,
    childDiscountAmount,
    discountAmount,
    totalAmount,
    depositAmount
  }
}

// Main booking page component.
// Uses URL query params to select room or zipline mode, loads live pricing
// settings from Firebase, and builds the booking form.
const Booking = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const roomParam = searchParams.get('room')
  const typeParam = searchParams.get('type')
  const [rooms, setRooms] = useState([])
  const [ziplineSettings, setZiplineSettings] = useState({
    localPrice: 300,
    touristPrice: 500,
    dailyLimit: 20
  })
  const [discountSettings, setDiscountSettings] = useState({
    seniorDiscountPercent: 0,
    childDiscountPercent: 0
  })
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [bookingType, setBookingType] = useState(() => {
    if (roomParam) {
      return 'room'
    }

    if (typeParam === 'room' || typeParam === 'zipline') {
      return typeParam
    }

    return 'zipline'
  })
  const [currentRoomId, setCurrentRoomId] = useState(roomParam || '')
  const [ziplineType, setZiplineType] = useState('tourist')
  const [showActivitySelector, setShowActivitySelector] = useState(false)
  const [pageReady, setPageReady] = useState(false)
  // booking form data holds both room booking fields and zipline booking fields.
  // Fields that are not used by the active booking type remain available
  // so switching between room and zipline does not lose user input.
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    checkIn: '',
    checkOut: '',
    date: '',
    guests: 1,
    seniorGuests: 0,
    childGuests: 0,
    message: ''
  })

  // Sync user profile values into the form when the signed-in user changes.
  // This keeps the booking form pre-filled with the authenticated user's name/email.
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: user?.displayName || prev.name,
      email: user?.email || ''
    }))
  }, [user])

  // Determine initial booking mode from query parameters.
  // ?room=ROOM_ID means room booking, otherwise type=room or type=zipline can set the mode.
  useEffect(() => {
    if (roomParam) {
      setBookingType('room')
      setCurrentRoomId(roomParam)
      return
    }

    if (typeParam === 'room') {
      setBookingType('room')
      return
    }

    if (typeParam === 'zipline') {
      setBookingType('zipline')
    }
  }, [roomParam, typeParam])

  // Load zipline pricing configuration from Firebase.
  // The data source supplies local/tourist rates and the daily capacity limit.
  useEffect(() => {
    const ziplineRef = ref(db, 'zipline')
    const unsubscribe = onValue(
      ziplineRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          setZiplineSettings({
            localPrice: data.localPrice || 300,
            touristPrice: data.touristPrice || 500,
            dailyLimit: data.dailyLimit || 20
          })
        }
      },
      (error) => {
        console.error('Error loading zipline settings:', error)
      }
    )

    return () => unsubscribe()
  }, [])

  // Load discount percentages from general settings.
  // These values are used to calculate senior and child discounts for zipline bookings.
  useEffect(() => {
    const settingsRef = ref(db, 'settings/general')
    const unsubscribe = onValue(
      settingsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setDiscountSettings({
            seniorDiscountPercent: 0,
            childDiscountPercent: 0
          })
          return
        }

        const data = snapshot.val()
        setDiscountSettings({
          seniorDiscountPercent: Number(data.seniorDiscountPercent || 0),
          childDiscountPercent: Number(data.childDiscountPercent || 0)
        })
      },
      (error) => {
        console.error('Error loading discount settings:', error)
      }
    )

    return () => unsubscribe()
  }, [])

  // Load room inventory from Firebase and normalize the response.
  // Each room is mapped to a consistent shape with title, price, capacity, image, and features.
  useEffect(() => {
    const roomsRef = ref(db, 'rooms')

    const unsubscribe = onValue(roomsRef, (snapshot) => {
      try {
        const data = snapshot.val()
        if (!data) {
          setRooms([])
          setRoomsLoading(false)
          return
        }

        const mappedRooms = Object.entries(data).map(([id, room]) => ({
          id,
          title: room.title || 'Room',
          subtitle: room.subtitle || 'Accommodation',
          description: room.description || 'No description available.',
          price: Number(room.price || 0),
          priceLabel: `PHP ${Number(room.price || 0).toLocaleString('en-PH')}`,
          priceUnit: '/night',
          capacity: room.capacity || 'N/A',
          image: room.image || '',
          amenities: Array.isArray(room.features) ? room.features : []
        }))

        mappedRooms.sort((a, b) => a.title.localeCompare(b.title))
        setRooms(mappedRooms)
      } catch (error) {
        console.error('Error loading booking rooms:', error)
        setRooms([])
      } finally {
        setRoomsLoading(false)
      }
    }, (error) => {
      console.error('Firebase error loading booking rooms:', error)
      setRooms([])
      setRoomsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Determine the currently selected room or zipline price.
  const currentRoom = rooms.find((room) => room.id === currentRoomId) || null
  const currentPrice = bookingType === 'room'
    ? (currentRoom?.price || 0)
    : (ziplineType === 'local' ? ziplineSettings.localPrice : ziplineSettings.touristPrice)

  // Calculate number of nights for room bookings only.
  const nights = useMemo(() => calculateNights(formData.checkIn, formData.checkOut), [formData.checkIn, formData.checkOut])

  // Calculate zipline pricing based on guest counts and discount rates.
  const ziplinePricing = useMemo(() => (
    calculateZiplinePricing({
      pricePerPerson: currentPrice,
      totalGuests: formData.guests,
      seniorGuests: formData.seniorGuests,
      childGuests: formData.childGuests,
      seniorDiscountPercent: discountSettings.seniorDiscountPercent,
      childDiscountPercent: discountSettings.childDiscountPercent
    })
  ), [
    currentPrice,
    formData.childGuests,
    formData.guests,
    formData.seniorGuests,
    discountSettings.childDiscountPercent,
    discountSettings.seniorDiscountPercent
  ])

  // Once room data is loaded, verify the selected room ID and
  // preload the room image before showing the page content.
  useEffect(() => {
    if (roomsLoading) {
      return
    }

    if (currentRoomId && !currentRoom) {
      setCurrentRoomId('')
      setFormData((prev) => ({
        ...prev,
        room: ''
      }))
      return
    }

    if (!currentRoom?.image) {
      setPageReady(true)
      return
    }

    let active = true
    setPageReady(false)

    preloadImage(currentRoom.image).finally(() => {
      if (active) {
        setPageReady(true)
      }
    })

    return () => {
      active = false
    }
  }, [currentRoom, currentRoomId, roomsLoading])

  // Handle controlled form input changes.
  // This keeps formData in sync with the user's input and also ensures
  // guest totals remain consistent when sub-counts are changed.
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      if (name === 'guests') {
        const nextGuests = Number(value || 0)
        const nextSeniorGuests = Math.min(Number(prev.seniorGuests || 0), nextGuests)
        const remainingGuests = Math.max(nextGuests - nextSeniorGuests, 0)
        const nextChildGuests = Math.min(Number(prev.childGuests || 0), remainingGuests)

        return {
          ...prev,
          guests: value,
          seniorGuests: nextSeniorGuests,
          childGuests: nextChildGuests
        }
      }

      if (name === 'seniorGuests') {
        const nextSeniorGuests = Math.min(Number(value || 0), Number(prev.guests || 0))
        const remainingGuests = Math.max(Number(prev.guests || 0) - nextSeniorGuests, 0)
        const nextChildGuests = Math.min(Number(prev.childGuests || 0), remainingGuests)

        return {
          ...prev,
          seniorGuests: nextSeniorGuests,
          childGuests: nextChildGuests
        }
      }

      if (name === 'childGuests') {
        const maxChildGuests = Math.max(Number(prev.guests || 0) - Number(prev.seniorGuests || 0), 0)
        return {
          ...prev,
          childGuests: Math.min(Number(value || 0), maxChildGuests)
        }
      }

      return {
        ...prev,
        [name]: value
      }
    })
  }

  // Open the modal that lets the user choose a room or zipline option.
  const handleRoomSelect = () => {
    setShowActivitySelector(true)
  }

  // Handle selection of a room or zipline activity.
  // If a room is picked, switch to room booking mode and store the room ID.
  // If a zipline rate is picked, switch to zipline mode and set the type.
  const handleActivityChoice = (item) => {
    if (item.type === 'room') {
      setBookingType('room')
      setCurrentRoomId(item.id)
    } else {
      setBookingType('zipline')
      setZiplineType(item.type)
    }
    setShowActivitySelector(false)
  }

  // Final booking submission handler.
  // Validates required fields based on the current booking type,
  // then navigates to /payment with prepared booking information.
  const handleSubmit = (e) => {
    e.preventDefault()

    if (!user?.email) {
      alert('Please sign in before making a booking.')
      navigate('/auth', { state: { from: { pathname: '/booking', search: window.location.search } } })
      return
    }

    if (bookingType === 'room') {
      if (!currentRoom) {
        alert('Please select a room first!')
        return
      }

      if (!formData.checkIn || !formData.checkOut) {
        alert('Please select both check-in and check-out dates.')
        return
      }

      if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
        alert('Check-out date must be after check-in date.')
        return
      }

      const bookingData = {
        type: 'room',
        name: formData.name,
        email: user.email,
        phone: formData.phone,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guests: formData.guests,
        message: formData.message,
        room: currentRoom,
        roomId: currentRoom.id,
        depositAmount: Math.round(currentRoom.price * 0.5)
      }

      navigate('/payment', { state: { bookingData } })
    } else {
      if (!formData.date) {
        alert('Please select a date for your zipline adventure.')
        return
      }

      const price = ziplineType === 'local' ? ziplineSettings.localPrice : ziplineSettings.touristPrice

      const bookingData = {
        type: 'zipline',
        name: formData.name,
        email: user.email,
        phone: formData.phone,
        date: formData.date,
        guests: ziplinePricing.totalGuests,
        seniorGuests: ziplinePricing.seniorGuests,
        childGuests: ziplinePricing.childGuests,
        regularGuests: ziplinePricing.regularGuests,
        ziplineType: ziplineType,
        message: formData.message,
        activity: {
          title: 'Zipline Adventure',
          price: price,
          description: `Zipline experience - ${ziplineType === 'local' ? 'Sablayeño' : 'Tourist'} Rate`
        },
        baseAmount: ziplinePricing.baseAmount,
        discountAmount: ziplinePricing.discountAmount,
        totalAmount: ziplinePricing.totalAmount,
        seniorDiscountPercent: discountSettings.seniorDiscountPercent,
        childDiscountPercent: discountSettings.childDiscountPercent,
        seniorDiscountAmount: ziplinePricing.seniorDiscountAmount,
        childDiscountAmount: ziplinePricing.childDiscountAmount,
        depositAmount: ziplinePricing.depositAmount
      }

      navigate('/payment', { state: { bookingData } })
    }
  }

  // Update guest counts with +/- buttons while preserving valid totals.
  // Senior and child counts always stay within the current total guest limit.
  const updateGuestCount = (field, delta) => {
    setFormData((prev) => {
      if (field === 'guests') {
        const nextGuests = clampNumber(Number(prev.guests || 0) + delta, 1, 10)
        const nextSeniorGuests = Math.min(Number(prev.seniorGuests || 0), nextGuests)
        const remainingGuests = Math.max(nextGuests - nextSeniorGuests, 0)
        const nextChildGuests = Math.min(Number(prev.childGuests || 0), remainingGuests)

        return {
          ...prev,
          guests: nextGuests,
          seniorGuests: nextSeniorGuests,
          childGuests: nextChildGuests
        }
      }

      if (field === 'seniorGuests') {
        const maxSeniorGuests = Number(prev.guests || 0)
        const nextSeniorGuests = clampNumber(Number(prev.seniorGuests || 0) + delta, 0, maxSeniorGuests)
        const remainingGuests = Math.max(Number(prev.guests || 0) - nextSeniorGuests, 0)
        const nextChildGuests = Math.min(Number(prev.childGuests || 0), remainingGuests)

        return {
          ...prev,
          seniorGuests: nextSeniorGuests,
          childGuests: nextChildGuests
        }
      }

      if (field === 'childGuests') {
        const maxChildGuests = Math.max(Number(prev.guests || 0) - Number(prev.seniorGuests || 0), 0)
        const nextChildGuests = clampNumber(Number(prev.childGuests || 0) + delta, 0, maxChildGuests)
        return {
          ...prev,
          childGuests: nextChildGuests
        }
      }

      return prev
    })
  }

  return (
    <div className="booking-page">
      {(!pageReady || roomsLoading) && <PageLoader text="Loading available rooms..." />}
      <Navbar />

      <motion.section
        className="booking-hero"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={prefersReducedMotion ? false : { opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="booking-hero-overlay"></div>
        <div className="booking-hero-content">
          <span className="section-tag">Sablayan Adventure Camp</span>
          <h1>Book Your Stay</h1>
          <p>Reserve your perfect accommodation in paradise</p>
        </div>
      </motion.section>

      <section className="booking-main-section">
        <div className="section-container">
          <div className="booking-layout">
            <motion.div
              className="booking-form-card"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className="booking-form-header">
                <h3>Complete Your Booking</h3>
                <p>Fill in your details to reserve your room</p>
              </div>

              <div className="booking-auth-notice">
                <i className="fas fa-shield-alt"></i>
                <p>
                  Reservations are tied to your signed-in account. The booking email will use
                  <strong> {user?.email}</strong>.
                </p>
              </div>

              {bookingType === 'room' && (
                <div className="booking-policy-strip">
                  <div className="booking-policy-item">
                    <span className="booking-policy-label">Check-in</span>
                    <strong>{formatPolicyTime(CHECK_IN_TIME)}</strong>
                  </div>
                  <div className="booking-policy-item">
                    <span className="booking-policy-label">Check-out</span>
                    <strong>{formatPolicyTime(CHECK_OUT_TIME)}</strong>
                  </div>
                </div>
              )}

              <form className="booking-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Account Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+63 9XX XXX XXXX"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Guests</label>
                    <div className="guest-picker">
                      <button type="button" className="guest-btn" onClick={() => updateGuestCount('guests', -1)} aria-label="Decrease guests">
                        <i className="fas fa-minus"></i>
                      </button>
                      <div className="guest-value" aria-live="polite">
                        <strong>{ziplinePricing.totalGuests}</strong>
                        <span>Total</span>
                      </div>
                      <button type="button" className="guest-btn" onClick={() => updateGuestCount('guests', 1)} aria-label="Increase guests">
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                    <div className="guest-hint">Max 10 guests per booking.</div>
                  </div>
                </div>

                {bookingType === 'zipline' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Matanda</label>
                      <div className="guest-picker compact">
                        <button type="button" className="guest-btn" onClick={() => updateGuestCount('seniorGuests', -1)} aria-label="Decrease matanda">
                          <i className="fas fa-minus"></i>
                        </button>
                        <div className="guest-value" aria-live="polite">
                          <strong>{ziplinePricing.seniorGuests}</strong>
                          <span>{discountSettings.seniorDiscountPercent}% off</span>
                        </div>
                        <button type="button" className="guest-btn" onClick={() => updateGuestCount('seniorGuests', 1)} aria-label="Increase matanda">
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Bata</label>
                      <div className="guest-picker compact">
                        <button type="button" className="guest-btn" onClick={() => updateGuestCount('childGuests', -1)} aria-label="Decrease bata">
                          <i className="fas fa-minus"></i>
                        </button>
                        <div className="guest-value" aria-live="polite">
                          <strong>{ziplinePricing.childGuests}</strong>
                          <span>{discountSettings.childDiscountPercent}% off</span>
                        </div>
                        <button type="button" className="guest-btn" onClick={() => updateGuestCount('childGuests', 1)} aria-label="Increase bata">
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                      <div className="guest-hint subtle">
                        Regular: <strong>{ziplinePricing.regularGuests}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {bookingType === 'zipline' && (
                  <div className="booking-auth-notice">
                    <i className="fas fa-tags"></i>
                    <p>
                      Matanda discount: <strong>{discountSettings.seniorDiscountPercent}% off</strong> and
                      bata discount: <strong>{discountSettings.childDiscountPercent}% off</strong>.
                    </p>
                  </div>
                )}

                <div className="form-row">
                  {bookingType === 'room' ? (
                    <>
                      <div className="form-group">
                        <label htmlFor="checkIn">Check-in Date</label>
                        <input
                          type="date"
                          id="checkIn"
                          name="checkIn"
                          value={formData.checkIn || ''}
                          onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="checkOut">Check-out Date</label>
                        <input
                          type="date"
                          id="checkOut"
                          name="checkOut"
                          value={formData.checkOut || ''}
                          onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <div className="form-group" style={{ width: '100%' }}>
                      <label htmlFor="date">Activity Date</label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="message">Special Requests</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Any special requests..."
                    rows="3"
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn">
                  <i className="fas fa-credit-card"></i>
                  Pay {bookingType === 'zipline' ? `₱${ziplinePricing.depositAmount.toLocaleString('en-PH')}` : ''}
                </button>
              </form>
            </motion.div>

            <motion.div
              className="room-display-card"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut', delay: prefersReducedMotion ? 0 : 0.05 }}
            >
              <div className="room-display-header">
                <span className="section-tag">{bookingType === 'room' ? 'Your Selected Room' : 'Zipline Adventure'}</span>
                <h3>
                  {bookingType === 'room'
                    ? currentRoom
                      ? currentRoom.title
                      : 'No Room Selected'
                    : `${ziplineType === 'local' ? 'Sablayeño' : 'Tourist'} Rate`}
                </h3>
              </div>

              <div className={`room-display-image ${!currentRoom && bookingType === 'room' ? 'empty' : ''}`}>
                {bookingType === 'room' ? (
                  currentRoom ? (
                    <img src={currentRoom.image} alt={currentRoom.title} />
                  ) : (
                    <div className="empty-room-placeholder">
                      <i className="fas fa-bed"></i>
                      <span>Select a room to continue</span>
                    </div>
                  )
                ) : (
                  <div className="zipline-placeholder">
                    <i className="fas fa-wind"></i>
                    <span>Asia's Longest Over-water Zipline</span>
                  </div>
                )}
              </div>

              {bookingType === 'room' ? (
                currentRoom && (
                  <div className="room-display-details">
                    <div className="room-display-price">
                      <span className="price-amount">{currentRoom.priceLabel}</span>
                      <span className="price-unit">{currentRoom.priceUnit}</span>
                    </div>

                    <p className="room-display-description">{currentRoom.description}</p>

                    <div className="pricing-breakdown">
                      <div className="pricing-row">
                        <span>Nights</span>
                        <strong>{nights || '—'}</strong>
                      </div>
                      <div className="pricing-row">
                        <span>Deposit (50%)</span>
                        <strong>₱{Math.round((currentRoom?.price || 0) * 0.5).toLocaleString('en-PH')}</strong>
                      </div>
                    </div>

                    <div className="room-display-capacity">
                      <i className="fas fa-user-friends"></i>
                      <span>{currentRoom.capacity}</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="room-display-details">
                  <div className="room-display-price">
                    <span className="price-amount">₱{ziplineType === 'local' ? ziplineSettings.localPrice : ziplineSettings.touristPrice}</span>
                    <span className="price-unit">/person</span>
                  </div>

                  <p className="room-display-description">
                    {ziplineType === 'local'
                      ? 'Special rate for local residents of Sablayan. Valid ID Required.'
                      : 'Standard rate for all visitors and tourists. Insurance included.'}
                  </p>

                  <div className="room-display-capacity">
                    <i className="fas fa-info-circle"></i>
                    <span>1.7 km over water • 15-20 minutes</span>
                  </div>

                  <div className="booking-policy-strip">
                    <div className="booking-policy-item">
                      <span className="booking-policy-label">Matanda</span>
                      <strong>{discountSettings.seniorDiscountPercent}% off</strong>
                    </div>
                    <div className="booking-policy-item">
                      <span className="booking-policy-label">Bata</span>
                      <strong>{discountSettings.childDiscountPercent}% off</strong>
                    </div>
                  </div>

                  <div className="pricing-breakdown">
                    <div className="pricing-row">
                      <span>Base</span>
                      <strong>₱{ziplinePricing.baseAmount.toLocaleString('en-PH')}</strong>
                    </div>
                    <div className="pricing-row">
                      <span>Discount</span>
                      <strong className={ziplinePricing.discountAmount > 0 ? 'negative' : ''}>-₱{ziplinePricing.discountAmount.toLocaleString('en-PH')}</strong>
                    </div>
                    <div className="pricing-row total">
                      <span>Total</span>
                      <strong>₱{ziplinePricing.totalAmount.toLocaleString('en-PH')}</strong>
                    </div>
                    <div className="pricing-row deposit">
                      <span>Deposit (50%)</span>
                      <strong>₱{ziplinePricing.depositAmount.toLocaleString('en-PH')}</strong>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                className={`choose-room-btn ${(bookingType === 'room' && currentRoom) || bookingType === 'zipline' ? 'has-room' : ''}`}
                onClick={handleRoomSelect}
              >
                <i className={`fas fa-${bookingType === 'room' ? 'bed' : 'wind'}`}></i>
                {bookingType === 'room' ? 'Choose Room' : 'Change Activity'}
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showActivitySelector && (
          <motion.div
            className="room-selector-overlay"
            onClick={() => setShowActivitySelector(false)}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={prefersReducedMotion ? false : { opacity: 1 }}
            exit={prefersReducedMotion ? false : { opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="room-selector-modal"
              onClick={(e) => e.stopPropagation()}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
              animate={prefersReducedMotion ? false : { opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
            <div className="room-selector-header">
              <h3>Select Your Experience</h3>
              <button className="close-btn" onClick={() => setShowActivitySelector(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Tabs for Rooms vs Zipline */}
            <div className="activity-tabs">
              <button
                className={`activity-tab ${bookingType === 'room' ? 'active' : ''}`}
                onClick={() => setBookingType('room')}
              >
                <i className="fas fa-bed"></i> Rooms
              </button>
              <button
                className={`activity-tab ${bookingType === 'zipline' ? 'active' : ''}`}
                onClick={() => setBookingType('zipline')}
              >
                <i className="fas fa-wind"></i> Zipline
              </button>
            </div>

            <div className="room-selector-grid">
              {bookingType === 'room' ? (
                rooms.map((room) => (
                  <div
                    key={room.id}
                    className={`room-selector-card ${currentRoomId === room.id ? 'current' : ''}`}
                    onClick={() => handleActivityChoice({ type: 'room', id: room.id })}
                  >
                    <img src={room.image} alt={room.title} />
                    <div className="room-selector-card-content">
                      <h4>{room.title}</h4>
                      <p>{room.description}</p>
                      <div className="room-selector-info">
                        <span className="price">{room.priceLabel}{room.priceUnit}</span>
                        <span className="capacity"><i className="fas fa-user"></i> {room.capacity}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div
                    className={`room-selector-card ${ziplineType === 'local' ? 'current' : ''}`}
                    onClick={() => handleActivityChoice({ type: 'local' })}
                  >
                    <div className="zipline-card-image">
                      <i className="fas fa-wind"></i>
                    </div>
                    <div className="room-selector-card-content">
                      <h4>Sablayeño Rate</h4>
                      <p>Special rate for local residents of Sablayan. Valid ID Required.</p>
                      <div className="room-selector-info">
                        <span className="price">₱{ziplineSettings.localPrice}/person</span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`room-selector-card ${ziplineType === 'tourist' ? 'current' : ''}`}
                    onClick={() => handleActivityChoice({ type: 'tourist' })}
                  >
                    <div className="zipline-card-image popular">
                      <i className="fas fa-star"></i>
                    </div>
                    <div className="room-selector-card-content">
                      <h4>Tourist Rate</h4>
                      <p>Standard rate for all visitors and tourists. Insurance included.</p>
                      <div className="room-selector-info">
                        <span className="price">₱{ziplineSettings.touristPrice}/person</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {!roomsLoading && bookingType === 'room' && rooms.length === 0 && (
                <div className="empty-room-placeholder">
                  <i className="fas fa-bed"></i>
                  <span>No rooms available right now</span>
                </div>
              )}
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="contact-section">
        <div className="section-container">
          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-phone-alt"></i>
              </div>
              <h3>Call Us</h3>
              <p>+63 939 933 8315</p>
              <p>+63 995 340 7818</p>
            </div>
            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <h3>Email Us</h3>
              <p>info@sablayanadventurecamp.com</p>
            </div>
            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3>Visit Us</h3>
              <p>Sablayan, Occidental Mindoro</p>
              <p>Philippines</p>
            </div>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="section-container">
          <div className="faq-header">
            <span className="section-tag">Questions?</span>
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>What time is check-in and check-out?</h4>
              <p>Check-in starts at {formatPolicyTime(CHECK_IN_TIME)} and check-out is by {formatPolicyTime(CHECK_OUT_TIME)}.</p>
            </div>
            <div className="faq-item">
              <h4>What is the best time to visit?</h4>
              <p>The best time to visit Sablayan is during the dry season from November to May, with March to May being the warmest months.</p>
            </div>
            <div className="faq-item">
              <h4>How do I get there?</h4>
              <p>You can fly to Manila, then take a bus or van to Sablayan. The journey takes approximately 4-5 hours.</p>
            </div>
            <div className="faq-item">
              <h4>What should I bring?</h4>
              <p>Bring sunscreen, swimwear, comfortable clothes, and a camera. We provide diving and zipline equipment.</p>
            </div>
            <div className="faq-item">
              <h4>Is there parking available?</h4>
              <p>Yes, we have free parking available for guests at our resort.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Booking
