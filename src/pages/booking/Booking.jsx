import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { onValue, ref } from 'firebase/database'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useAuth } from '../../AuthContext'
import PageLoader from '../../components/PageLoader'
import { db } from '../../firebase'
import { preloadImage } from '../../utils/pageLoad'
import { CHECK_IN_TIME, CHECK_OUT_TIME, formatPolicyTime } from '../../utils/bookingPolicy'
import './Booking.css'

const Booking = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const roomParam = searchParams.get('room')
  const [rooms, setRooms] = useState([])
  const [ziplineSettings, setZiplineSettings] = useState({
    localPrice: 300,
    touristPrice: 500,
    dailyLimit: 20
  })
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [bookingType, setBookingType] = useState(roomParam ? 'room' : 'zipline')
  const [currentRoomId, setCurrentRoomId] = useState(roomParam || '')
  const [ziplineType, setZiplineType] = useState('tourist')
  const [showActivitySelector, setShowActivitySelector] = useState(false)
  const [pageReady, setPageReady] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    checkIn: '',
    checkOut: '',
    date: '',
    guests: 1,
    message: ''
  })

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: user?.displayName || prev.name,
      email: user?.email || ''
    }))
  }, [user])

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

  const currentRoom = rooms.find((room) => room.id === currentRoomId) || null
  const currentPrice = bookingType === 'room' ? (currentRoom?.price || 0) : (ziplineType === 'local' ? ziplineSettings.localPrice : ziplineSettings.touristPrice)

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRoomSelect = () => {
    setShowActivitySelector(true)
  }

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
        guests: formData.guests,
        ziplineType: ziplineType,
        message: formData.message,
        activity: {
          title: 'Zipline Adventure',
          price: price,
          description: `Zipline experience - ${ziplineType === 'local' ? 'Sablayeño' : 'Tourist'} Rate`
        },
        depositAmount: Math.round(price * formData.guests * 0.5)
      }

      navigate('/payment', { state: { bookingData } })
    }
  }

  return (
    <div className="booking-page">
      {(!pageReady || roomsLoading) && <PageLoader text="Loading available rooms..." />}
      <Navbar />

      <section className="booking-hero">
        <div className="booking-hero-overlay"></div>
        <div className="booking-hero-content">
          <span className="section-tag">Sablayan Adventure Camp</span>
          <h1>Book Your Stay</h1>
          <p>Reserve your perfect accommodation in paradise</p>
        </div>
      </section>

      <section className="booking-main-section">
        <div className="section-container">
          <div className="booking-layout">
            <div className="booking-form-card">
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
                    <label htmlFor="guests">Number of Guests</label>
                    <select
                      id="guests"
                      name="guests"
                      value={formData.guests}
                      onChange={handleChange}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Guest' : 'Guests'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

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
                  Pay
                </button>
              </form>
            </div>

            <div className="room-display-card">
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
            </div>
          </div>
        </div>
      </section>

      {showActivitySelector && (
        <div className="room-selector-overlay" onClick={() => setShowActivitySelector(false)}>
          <div className="room-selector-modal" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </div>
      )}

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
