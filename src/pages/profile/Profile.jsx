import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { onValue, ref } from 'firebase/database'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import PageLoader from '../../components/PageLoader'
import { useAuth } from '../../AuthContext'
import { db, syncExpiredPendingBookings, updateUserAccountProfile } from '../../firebase'
import { uploadToCloudinaryUnsigned } from '../../utils/cloudinary'
import { formatCurrency, formatDate, getBookingOperationalStatus, getPaymentStatusMeta, normalizeBookings } from '../admin/adminData'
import './Profile.css'

const getStayMessage = (phase) => {
  if (phase === 'active') {
    return 'Your reservation is currently in effect.'
  }

  if (phase === 'upcoming') {
    return 'This reservation is confirmed for a future stay.'
  }

  if (phase === 'completed') {
    return 'This stay has already been completed.'
  }

  if (phase === 'cancelled') {
    return 'This reservation was cancelled because the check-in time passed without completed payment.'
  }

  return 'Reservation schedule is still being prepared.'
}

const getApprovalStatus = (booking) => {
  const paymentStatus = (booking?.paymentStatus || '').trim().toLowerCase()
  const bookingStatus = (booking?.bookingStatus || '').trim().toLowerCase()

  if (paymentStatus === 'pending' || bookingStatus === 'pending') {
    return {
      label: 'Pending Approval',
      tone: 'pending'
    }
  }

  if (paymentStatus === 'cancelled' || bookingStatus === 'cancelled') {
    return {
      label: 'Cancelled',
      tone: 'cancelled'
    }
  }

  return {
    label: 'Confirmed',
    tone: 'confirmed'
  }
}

const Profile = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    const parts = (user?.displayName || '').trim().split(/\s+/).filter(Boolean)
    setFirstName(parts[0] || '')
    setLastName(parts.slice(1).join(' '))
    setAvatarPreview(user?.photoURL || '')
  }, [user])

  useEffect(() => {
    const bookingsRef = ref(db, 'bookings')

    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      try {
        const normalizedBookings = normalizeBookings(snapshot.val())
        setBookings(normalizedBookings)
        void syncExpiredPendingBookings(normalizedBookings)
      } catch (error) {
        console.error('Error loading guest bookings:', error)
        setBookings([])
      } finally {
        setBookingsLoading(false)
      }
    }, (error) => {
      console.error('Firebase error loading guest bookings:', error)
      setBookings([])
      setBookingsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const guestBookings = useMemo(() => {
    const email = user?.email?.trim().toLowerCase()
    const userId = user?.uid || ''

    return bookings
      .filter((booking) => {
        const bookingEmail = booking.email?.trim().toLowerCase()
        return (email && bookingEmail === email) || (userId && booking.userId === userId)
      })
      .sort((left, right) => {
        const leftPending = getApprovalStatus(left).tone === 'pending' ? 1 : 0
        const rightPending = getApprovalStatus(right).tone === 'pending' ? 1 : 0

        if (leftPending !== rightPending) {
          return rightPending - leftPending
        }

        return new Date(right.createdAt || right.checkIn || 0).getTime() - new Date(left.createdAt || left.checkIn || 0).getTime()
      })
  }, [bookings, user])

  const stats = useMemo(() => ({
    total: guestBookings.length,
    active: guestBookings.filter((booking) => getBookingOperationalStatus(booking).phase === 'active').length,
    upcoming: guestBookings.filter((booking) => getBookingOperationalStatus(booking).phase === 'upcoming').length,
    pending: guestBookings.filter((booking) => booking.paymentStatus === 'pending').length
  }), [guestBookings])

  const avatarLetter = (firstName || user?.displayName || user?.email || 'G').charAt(0).toUpperCase()

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0] || null
    setAvatarFile(file)
    setSaveMessage('')

    if (!file) {
      setAvatarPreview(user?.photoURL || '')
      return
    }

    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleProfileSave = async (event) => {
    event.preventDefault()
    setSaveMessage('')

    if (!firstName.trim() || !lastName.trim()) {
      setSaveMessage('Please enter both first name and last name.')
      return
    }

    setIsSaving(true)

    try {
      let nextPhotoURL = user?.photoURL || ''

      if (avatarFile) {
        const uploadResult = await uploadToCloudinaryUnsigned(avatarFile)
        nextPhotoURL = uploadResult.secure_url || nextPhotoURL
      }

      await updateUserAccountProfile({
        uid: user?.uid,
        firstName,
        lastName,
        photoURL: nextPhotoURL
      })

      setAvatarFile(null)
      setAvatarPreview(nextPhotoURL)
      setSaveMessage('Profile updated successfully.')
    } catch (error) {
      console.error('Failed to update profile:', error)
      setSaveMessage('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="profile-page">
      {bookingsLoading && <PageLoader text="Loading your profile..." />}
      <Navbar />

      <section className="profile-hero">
        <div className="profile-hero-overlay"></div>
        <div className="profile-hero-content">
          <span className="section-tag">Guest Account</span>
          <h1>{user?.displayName || 'Guest Profile'}</h1>
          <p>See your account details and review the reservations connected to your signed-in email.</p>
        </div>
      </section>

      <main className="profile-main-section">
        <div className="section-container">
          <div className="profile-header-card">
            <div className="profile-header-copy">
              <span className="profile-kicker">My Account</span>
              <h2>{user?.displayName || 'Guest Profile'}</h2>
              <p>Reservations made while signed in to this account will appear here automatically.</p>
            </div>
            <div className="profile-header-chip">
              <span className={`profile-avatar ${avatarPreview ? 'has-image' : ''}`} aria-hidden="true">
                {avatarPreview ? <img src={avatarPreview} alt="" /> : avatarLetter}
              </span>
              <div>
                <strong>{user?.displayName || 'Guest'}</strong>
                <p>{user?.email || 'No email available'}</p>
              </div>
            </div>
          </div>

          <div className="profile-grid">
            <aside className="profile-panel account-panel">
              <div className="profile-panel-heading">
                <span className="section-tag">Account</span>
                <h2>Your Details</h2>
              </div>
              <form className="profile-edit-form" onSubmit={handleProfileSave}>
                <div className="profile-avatar-editor">
                  <span className={`profile-avatar profile-avatar-large ${avatarPreview ? 'has-image' : ''}`} aria-hidden="true">
                    {avatarPreview ? <img src={avatarPreview} alt="" /> : avatarLetter}
                  </span>
                  <label className="profile-avatar-upload">
                    <span>Change Avatar</span>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                </div>

                <div className="profile-form-row">
                  <div className="profile-form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div className="profile-form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <div className="profile-form-group">
                  <label htmlFor="profileEmail">Email</label>
                  <input
                    id="profileEmail"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    readOnly
                  />
                </div>

                {saveMessage && <p className="profile-save-message">{saveMessage}</p>}

                <div className="profile-form-actions">
                  <button type="submit" className="profile-primary-link profile-action-btn" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                  <Link to="/booking" className="profile-secondary-link">Book a New Stay</Link>
                </div>
              </form>
            </aside>

            <section className="profile-panel summary-panel">
              <div className="profile-panel-heading">
                <span className="section-tag">Overview</span>
                <h2>Reservation Snapshot</h2>
              </div>
              <div className="profile-stats-grid">
                <article className="profile-stat-tile">
                  <span>Total Reservations</span>
                  <strong>{stats.total}</strong>
                </article>
                <article className="profile-stat-tile">
                  <span>Active Stay</span>
                  <strong>{stats.active}</strong>
                </article>
                <article className="profile-stat-tile">
                  <span>Upcoming</span>
                  <strong>{stats.upcoming}</strong>
                </article>
                <article className="profile-stat-tile">
                  <span>Pending Payment</span>
                  <strong>{stats.pending}</strong>
                </article>
              </div>
            </section>
          </div>

          <section id="reservations" className="profile-panel bookings-panel">
            <div className="bookings-panel-header">
              <div>
                <span className="section-tag">Reservations</span>
                <h2>My Reservations</h2>
                <p>Your stays below are filtered to the currently signed-in account.</p>
              </div>
              <Link to="/booking" className="profile-secondary-link">Make Reservation</Link>
            </div>

            {guestBookings.length === 0 ? (
              <div className="profile-empty-state">
                <i className="fas fa-calendar-times"></i>
                <h3>No reservations yet</h3>
                <p>Once you complete a booking, it will appear here automatically.</p>
              </div>
            ) : (
              <div className="profile-booking-list">
                {guestBookings.map((booking) => {
                  const stayStatus = getBookingOperationalStatus(booking)
                  const approvalStatus = getApprovalStatus(booking)
                  const paymentStatus = getPaymentStatusMeta(booking.paymentStatus)
                  const isZipline = booking.type === 'zipline'

                  return (
                    <article className="profile-booking-card" key={booking.id}>
                      <div className="profile-booking-card-top">
                        <div>
                          {isZipline ? (
                            <>
                              <h3><i className="fas fa-wind"></i> {booking.activity?.title || 'Zipline Adventure'}</h3>
                              <p>{booking.ziplineType === 'local' ? 'Sablayeño Rate' : 'Tourist Rate'} • {booking.activity?.description || 'Zipline Experience'}</p>
                            </>
                          ) : (
                            <>
                              <h3><i className="fas fa-bed"></i> {booking.room?.title || 'Reserved Room'}</h3>
                              <p>{booking.room?.subtitle || 'Accommodation'}</p>
                            </>
                          )}
                        </div>
                        <span className={`profile-status-badge ${stayStatus.tone}`}>{stayStatus.label}</span>
                      </div>

                      <div className="profile-booking-meta">
                        {isZipline ? (
                          <>
                            <div>
                              <span>Adventure Date</span>
                              <strong>{formatDate(booking.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                            </div>
                            <div>
                              <span>Duration</span>
                              <strong>15-20 minutes</strong>
                            </div>
                            <div>
                              <span>Participants</span>
                              <strong>{booking.guests || 0}</strong>
                            </div>
                            <div>
                              <span>Deposit</span>
                              <strong>{formatCurrency(booking.depositAmount)}</strong>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <span>Check-in</span>
                              <strong>{formatDate(booking.checkIn, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                            </div>
                            <div>
                              <span>Check-out</span>
                              <strong>{formatDate(booking.checkOut, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                            </div>
                            <div>
                              <span>Guests</span>
                              <strong>{booking.guests || 0}</strong>
                            </div>
                            <div>
                              <span>Deposit</span>
                              <strong>{formatCurrency(booking.depositAmount)}</strong>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="profile-booking-card-bottom">
                        <p>{getStayMessage(stayStatus.phase)}</p>
                        <span className={`profile-payment-badge ${approvalStatus.tone}`}>
                          {paymentStatus.label === 'cancelled' ? 'Cancelled' : approvalStatus.label}
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Profile
