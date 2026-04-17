// Booking management page for admins.
// Fetches booking records from Firebase and provides search, filter, and action controls.
import { useEffect, useState } from 'react'
import { onValue, ref, remove, update } from 'firebase/database'
import { db, syncExpiredPendingBookings } from '../../firebase'
import { sendNotificationByEmail } from '../../NotificationContext'
import PageLoader from '../../components/PageLoader'
import { formatCurrency, formatDate, getBookingOperationalStatus, getPaymentStatusMeta, normalizeBookings } from './adminData'
import './AdminBooking.css'

const AdminBooking = () => {
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    const bookingsRef = ref(db, 'bookings')

    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      try {
        const normalizedBookings = normalizeBookings(snapshot.val())
        setBookings(normalizedBookings)
        void syncExpiredPendingBookings(normalizedBookings)
      } catch (error) {
        console.error('Error fetching bookings:', error)
        setBookings([])
      } finally {
        setBookingsLoading(false)
      }
    }, (error) => {
      console.error('Firebase error:', error)
      setBookings([])
      setBookingsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Update booking status to confirmed in Firebase.
  const handleConfirmBooking = async (id, booking) => {
    try {
      await update(ref(db, `bookings/${id}`), { 
        paymentStatus: 'confirmed',
        bookingStatus: 'confirmed'
      })

      // Send notification to user
      if (booking?.email) {
        const bookingType = booking.type === 'room' ? 'Room Reservation' : 'Zipline Activity'
        await sendNotificationByEmail(
          booking.email,
          'approval',
          'Booking Approved!',
          `Your ${bookingType} booking has been approved and confirmed.`,
          { bookingId: id, status: 'confirmed' }
        )
      }

      // Send booking approval email
      if (booking && booking.email) {
        try {
          const fullName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Guest'
          const bookingType = booking.type === 'room' 
            ? (booking.room?.title || 'Room') 
            : (booking.activity?.title || 'Zipline Adventure')
          const bookingDate = booking.type === 'room' ? booking.checkIn : booking.date
          
          const emailResponse = await fetch('https://sablayan-backend.onrender.com/emailjs/booking-approval', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: fullName,
              email: booking.email,
              booking_type: bookingType,
              date: bookingDate,
              guests: booking.guests.toString(),
              amount: booking.depositAmount.toString(),
              receipt_id: booking.referenceNumber || booking.id
            })
          })

          const emailResult = await emailResponse.json()
          if (emailResult.success) {
            console.log('✓ Approval email sent successfully')
          } else {
            console.warn('Email sending failed:', emailResult.error)
          }
        } catch (emailError) {
          console.warn('Email service error:', emailError)
        }
      }

      alert('Booking confirmed successfully!')
    } catch (error) {
      console.error('Error confirming booking:', error)
      alert('Failed to confirm booking.')
    }
  }

  const handleRevertBooking = async (id, booking) => {
    try {
      await update(ref(db, `bookings/${id}`), { 
        paymentStatus: 'pending',
        bookingStatus: 'pending'
      })

      // Send notification to user
      if (booking?.email) {
        const bookingType = booking.type === 'room' ? 'Room Reservation' : 'Zipline Activity'
        await sendNotificationByEmail(
          booking.email,
          'admin_action',
          'Booking Status Updated',
          `Your ${bookingType} booking status has been reverted to pending and requires re-approval.`,
          { bookingId: id, status: 'pending' }
        )
      }

      // Send booking status update email (Reverted to Pending)
      if (booking && booking.email) {
        try {
          const fullName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Guest'
          const bookingType = booking.type === 'room' 
            ? (booking.room?.title || 'Room') 
            : (booking.activity?.title || 'Zipline Adventure')
          const bookingDate = booking.type === 'room' ? booking.checkIn : booking.date

          const emailResponse = await fetch('https://sablayan-backend.onrender.com/emailjs/booking-status-update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: fullName,
              email: booking.email,
              booking_type: bookingType,
              date: bookingDate,
              guests: booking.guests.toString(),
              status: 'Reverted to Pending'
            })
          })

          const emailResult = await emailResponse.json()
          if (emailResult.success) {
            console.log('✓ Status update email sent successfully')
          } else {
            console.warn('Email sending failed:', emailResult.error)
          }
        } catch (emailError) {
          console.warn('Email service error:', emailError)
        }
      }

      alert('Booking reverted to pending!')
    } catch (error) {
      console.error('Error reverting booking:', error)
      alert('Failed to revert booking.')
    }
  }

  const handleCancelBooking = async (id, booking) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    try {
      await update(ref(db, `bookings/${id}`), { 
        paymentStatus: 'cancelled',
        bookingStatus: 'cancelled'
      })

      // Send notification to user
      if (booking?.email) {
        const bookingType = booking.type === 'room' ? 'Room Reservation' : 'Zipline Activity'
        await sendNotificationByEmail(
          booking.email,
          'cancel',
          'Booking Cancelled',
          `Your ${bookingType} booking has been cancelled.`,
          { bookingId: id, status: 'cancelled' }
        )
      }

      alert('Booking cancelled successfully!')
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking.')
    }
  }

  const handleDeclineBooking = async (id, booking) => {
    if (!window.confirm('Are you sure you want to decline this booking?')) {
      return
    }

    try {
      await update(ref(db, `bookings/${id}`), { 
        paymentStatus: 'declined',
        bookingStatus: 'declined'
      })

      // Send notification to user
      if (booking?.email) {
        const bookingType = booking.type === 'room' ? 'Room Reservation' : 'Zipline Activity'
        await sendNotificationByEmail(
          booking.email,
          'cancel',
          'Booking Declined',
          `Your ${bookingType} booking has been declined. Please contact support for more information.`,
          { bookingId: id, status: 'declined' }
        )
      }

      // Send booking status update email (Declined)
      if (booking && booking.email) {
        try {
          const fullName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Guest'
          const bookingType = booking.type === 'room' 
            ? (booking.room?.title || 'Room') 
            : (booking.activity?.title || 'Zipline Adventure')
          const bookingDate = booking.type === 'room' ? booking.checkIn : booking.date

          const emailResponse = await fetch('https://sablayan-backend.onrender.com/emailjs/booking-status-update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: fullName,
              email: booking.email,
              booking_type: bookingType,
              date: bookingDate,
              guests: booking.guests.toString(),
              status: 'Declined'
            })
          })

          const emailResult = await emailResponse.json()
          if (emailResult.success) {
            console.log('✓ Decline email sent successfully')
          } else {
            console.warn('Email sending failed:', emailResult.error)
          }
        } catch (emailError) {
          console.warn('Email service error:', emailError)
        }
      }

      alert('Booking declined successfully!')
    } catch (error) {
      console.error('Error declining booking:', error)
      alert('Failed to decline booking.')
    }
  }

  const handleDeleteBooking = async (id, booking) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) {
      return
    }

    try {
      // Send notification to user before deleting
      if (booking?.email) {
        const bookingType = booking.type === 'room' ? 'Room Reservation' : 'Zipline Activity'
        await sendNotificationByEmail(
          booking.email,
          'cancel',
          'Booking Deleted',
          `Your ${bookingType} booking has been deleted.`,
          { bookingId: id, status: 'deleted' }
        )
      }

      await remove(ref(db, `bookings/${id}`))
      alert('Booking deleted successfully!')
    } catch (error) {
      console.error('Error deleting booking:', error)
      alert('Failed to delete booking.')
    }
  }

  const stats = {
    total: bookings.length,
    rooms: bookings.filter((booking) => booking.type !== 'zipline').length,
    ziplines: bookings.filter((booking) => booking.type === 'zipline').length,
    pending: bookings.filter((booking) => booking.paymentStatus === 'pending').length,
    confirmed: bookings.filter((booking) => booking.paymentStatus === 'confirmed').length,
    cancelled: bookings.filter((booking) => booking.paymentStatus === 'cancelled').length,
    activeStays: bookings.filter((booking) => booking.paymentStatus === 'confirmed' && getBookingOperationalStatus(booking).phase === 'active').length,
    revenue: bookings.reduce((sum, booking) => sum + Number(booking.depositAmount || 0), 0)
  }

  const filteredBookings = bookings.filter((booking) => {
    const fullName = `${booking.firstName || ''} ${booking.lastName || ''}`.toLowerCase()
    const matchesSearch = (
      fullName.includes(searchTerm.toLowerCase()) ||
      (booking.referenceNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    const matchesStatus = statusFilter === 'all' || booking.paymentStatus === statusFilter
    const matchesType = typeFilter === 'all' || (typeFilter === 'room' && booking.type !== 'zipline') || (typeFilter === 'zipline' && booking.type === 'zipline')

    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="admin-booking-container">
      {bookingsLoading && (
        <PageLoader
          title="Bookings"
          text="Loading bookings and guest records..."
          fullScreen={false}
        />
      )}

      {!bookingsLoading && (
        <div className="admin-stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="stat-info">
              <h3>{stats.total}</h3>
              <p>Total Bookings</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
              <i className="fas fa-bed"></i>
            </div>
            <div className="stat-info">
              <h3>{stats.rooms}</h3>
              <p>Room Reservations</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dbeafe', color: '#0284c7' }}>
              <i className="fas fa-wind"></i>
            </div>
            <div className="stat-info">
              <h3>{stats.ziplines}</h3>
              <p>Zipline Bookings</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef9c3', color: '#854d0e' }}>
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <h3>{stats.pending}</h3>
              <p>Pending Payment</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dcfce7', color: '#166534' }}>
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <h3>{stats.confirmed}</h3>
              <p>Confirmed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}>
              <i className="fas fa-ban"></i>
            </div>
            <div className="stat-info">
              <h3>{stats.cancelled}</h3>
              <p>Cancelled</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
              <i className="fas fa-door-open"></i>
            </div>
            <div className="stat-info">
              <h3>{stats.activeStays}</h3>
              <p>Active Stays</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f0f9ff', color: '#0077b6' }}>
              <i className="fas fa-peso-sign"></i>
            </div>
            <div className="stat-info">
              <h3>{formatCurrency(stats.revenue)}</h3>
              <p>Total Deposits</p>
            </div>
          </div>
        </div>
      )}

      {!bookingsLoading && (
        <div className="admin-card">
          <div className="card-header">
            <div className="header-left">
              <h3>Recent Bookings</h3>
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search guest or ref#"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="filter-group">
                <div className="filter-wrapper">
                  <select
                    className="status-filter"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="filter-wrapper">
                  <select
                    className="type-filter"
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                  >
                    <option value="all">All Types ({stats.total})</option>
                    <option value="room">Room Only ({stats.rooms})</option>
                    <option value="zipline">Zipline Only ({stats.ziplines})</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times"></i>
              <p>No bookings found in the database for this filter.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Guest Name</th>
                    <th>Activity Type</th>
                    <th>{typeFilter === 'zipline' ? 'Date' : 'Check In'}</th>
                    {typeFilter !== 'zipline' && <th>Check Out</th>}
                    <th>Guests</th>
                    <th>Reference #</th>
                    <th>Status</th>
                    <th>Pay Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => {
                    const stayStatus = getBookingOperationalStatus(booking)
                    const paymentStatus = getPaymentStatusMeta(booking.paymentStatus)
                    const isZipline = booking.type === 'zipline'

                    return (
                    <tr key={booking.id}>
                      <td data-label="Guest">
                        <div className="guest-info">
                          <span className="guest-name">{`${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Guest'}</span>
                          <span className="guest-email">{booking.email || 'No email provided'}</span>
                        </div>
                      </td>
                      <td data-label="Activity Type">
                        <span className={`activity-badge ${isZipline ? 'zipline' : 'room'}`}>
                          <i className={`fas fa-${isZipline ? 'wind' : 'bed'}`}></i>
                          {isZipline ? 'Zipline' : 'Room'}
                        </span>
                      </td>
                      <td data-label={isZipline ? 'Date' : 'Check In'}>
                        {isZipline ? formatDate(booking.date, { month: 'short', day: 'numeric', year: 'numeric' }) : formatDate(booking.checkIn, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      {(typeFilter === 'all' || !isZipline) && <td data-label="Check Out">{!isZipline && formatDate(booking.checkOut, { month: 'short', day: 'numeric', year: 'numeric' })}</td>}
                      <td data-label="Guests">{booking.guests || 0}</td>
                      <td data-label="Reference #">
                        <span className="reference-number">{booking.referenceNumber || 'N/A'}</span>
                      </td>
                      <td data-label="Status">
                        <div className="stay-status-cell">
                          <span className={`status-badge ${stayStatus.tone}`}>
                            <i className={`fas ${stayStatus.phase === 'active' ? 'fa-door-open' : stayStatus.phase === 'completed' ? 'fa-flag-checkered' : stayStatus.phase === 'upcoming' ? 'fa-hourglass-start' : stayStatus.phase === 'cancelled' ? 'fa-ban' : 'fa-exclamation-circle'}`}></i>
                            {stayStatus.label}
                          </span>
                        </div>
                      </td>
                      <td data-label="Pay Status">
                        <span className={`status-badge ${paymentStatus.tone}`}>
                          <i className={`fas ${paymentStatus.icon}`}></i>
                          {paymentStatus.label}
                        </span>
                      </td>
                      <td data-label="Action">
                        <div className="action-btns">
                          <button className="view-btn" onClick={() => setSelectedBooking(booking)} title="View Details">
                            <i className="fas fa-eye"></i>
                          </button>
                          {booking.paymentStatus === 'pending' && (
                            <button
                              className="confirm-btn"
                              onClick={() => handleConfirmBooking(booking.id, booking)}
                              title="Confirm Booking"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                          {booking.paymentStatus === 'confirmed' && (
                            <button
                              className="revert-btn"
                              onClick={() => handleRevertBooking(booking.id, booking)}
                              title="Revert to Pending"
                            >
                              <i className="fas fa-undo"></i>
                            </button>
                          )}
                          {booking.paymentStatus !== 'cancelled' && (
                            <button
                              className="decline-btn"
                              onClick={() => handleDeclineBooking(booking.id, booking)}
                              title="Decline Booking"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteBooking(booking.id, booking)}
                            title="Delete Booking"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedBooking && (
        <div className="modal-overlay active" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content booking-details-modal animate-in" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header-premium">
              <div className="modal-header-bg"></div>
              <div className="header-content">
                <div className="user-avatar-premium">
                  <i className={`fas fa-${selectedBooking.type === 'zipline' ? 'wind' : 'bed'}`}></i>
                </div>
                <div className="header-text">
                  <h3>Booking Details</h3>
                  <span className="user-id-tag">REF: {selectedBooking.referenceNumber || 'N/A'}</span>
                </div>
              </div>
              <button className="close-btn-premium" onClick={() => setSelectedBooking(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body-premium">
              <div className="booking-premium-grid">
                
                {/* Left Column: Guest & Stay Info */}
                <div className="booking-column">
                  <div className="p-info-section">
                    <div className="p-section-header">
                      <i className="fas fa-user-circle"></i>
                      <span>Guest Information</span>
                    </div>
                    <div className="p-detail-card">
                      <div className="p-detail-item">
                        <label>Full Name</label>
                        <span className="p-detail-value">{`${selectedBooking.firstName || ''} ${selectedBooking.lastName || ''}`.trim() || 'Guest'}</span>
                      </div>
                      <div className="p-detail-item">
                        <label>Email Address</label>
                        <span className="p-detail-value">{selectedBooking.email || 'N/A'}</span>
                      </div>
                      <div className="p-detail-item">
                        <label>Phone Number</label>
                        <span className="p-detail-value">{selectedBooking.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-info-section">
                    <div className="p-section-header">
                      <i className="fas fa-calendar-check"></i>
                      <span>Schedule & Status</span>
                    </div>
                    <div className="p-detail-card">
                      {selectedBooking.type === 'zipline' ? (
                        <div className="p-detail-item">
                          <label>Activity Date</label>
                          <span className="p-detail-value">{formatDate(selectedBooking.date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                      ) : (
                        <div className="p-form-row">
                          <div className="p-detail-item">
                            <label>Check-in</label>
                            <span className="p-detail-value">{formatDate(selectedBooking.checkIn, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                          <div className="p-detail-item">
                            <label>Check-out</label>
                            <span className="p-detail-value">{formatDate(selectedBooking.checkOut, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      )}
                      <div className="p-detail-item">
                        <label>Stay Operational Status</label>
                        <span className={`p-badge status ${getBookingOperationalStatus(selectedBooking).tone}`}>
                          {getBookingOperationalStatus(selectedBooking).label}
                        </span>
                        <p className="p-status-note">{getBookingOperationalStatus(selectedBooking).details}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Property & Payment */}
                <div className="booking-column">
                  <div className="p-info-section">
                    <div className="p-section-header">
                      <i className="fas fa-tag"></i>
                      <span>Reservation Details</span>
                    </div>
                    <div className="p-detail-card highlight">
                      {selectedBooking.type === 'zipline' ? (
                        <>
                          <div className="p-detail-item">
                            <label>Activity</label>
                            <span className="p-detail-value">{selectedBooking.activity?.title || 'Zipline Adventure'}</span>
                          </div>
                          <div className="p-detail-item">
                            <label>Experience Type</label>
                            <span className="p-badge role customer">{selectedBooking.ziplineType === 'local' ? 'Sablayeño' : 'Tourist'} Rate</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-detail-item">
                            <label>Accommodation</label>
                            <span className="p-detail-value">{selectedBooking.room?.title || 'N/A'}</span>
                            <small className="p-sub-value">{selectedBooking.room?.subtitle}</small>
                          </div>
                        </>
                      )}
                      <div className="p-form-row">
                        <div className="p-detail-item">
                          <label>Guests</label>
                          <span className="p-detail-value">{selectedBooking.guests || 0} Total</span>
                        </div>
                        <div className="p-detail-item">
                          <label>Payment</label>
                          <span className={`p-badge status ${getPaymentStatusMeta(selectedBooking.paymentStatus).tone}`}>
                            {getPaymentStatusMeta(selectedBooking.paymentStatus).label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-info-section">
                    <div className="p-section-header">
                      <i className="fas fa-receipt"></i>
                      <span>Financial Summary</span>
                    </div>
                    <div className="p-detail-card financial">
                      <div className="p-financial-row">
                        <span>Deposit Amount Paid</span>
                        <strong className="p-amount">{formatCurrency(selectedBooking.depositAmount)}</strong>
                      </div>
                      {selectedBooking.type === 'zipline' && (
                        <div className="p-financial-breakdown">
                          <div className="p-breakdown-item">
                            <span>Base Total</span>
                            <span>{formatCurrency(selectedBooking.baseAmount)}</span>
                          </div>
                          <div className="p-breakdown-item discount">
                            <span>Total Discounts</span>
                            <span>-{formatCurrency(selectedBooking.discountAmount)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Width Sections */}
              <div className="booking-full-sections">
                {selectedBooking.paymentReceiptUrl && (
                  <div className="p-info-section">
                    <div className="p-section-header">
                      <i className="fas fa-camera"></i>
                      <span>Payment Verification</span>
                    </div>
                    <div className="p-receipt-preview-premium">
                      <img src={selectedBooking.paymentReceiptUrl} alt="Receipt" />
                      <div className="p-receipt-overlay">
                        <a href={selectedBooking.paymentReceiptUrl} target="_blank" rel="noreferrer" className="p-btn-view-full">
                          <i className="fas fa-expand-alt"></i>
                          Open Full Image
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBooking.message && (
                  <div className="p-info-section">
                    <div className="p-section-header">
                      <i className="fas fa-comment-alt"></i>
                      <span>Special Requests</span>
                    </div>
                    <div className="p-message-box">
                      {selectedBooking.message}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer-premium">
              <button className="p-btn-secondary" onClick={() => setSelectedBooking(null)}>
                Close
              </button>
              <div className="footer-actions-group">
                {selectedBooking.paymentStatus === 'pending' && (
                  <button
                    className="p-btn-primary"
                    onClick={() => {
                      handleConfirmBooking(selectedBooking.id, selectedBooking)
                      setSelectedBooking(null)
                    }}
                  >
                    <i className="fas fa-check-circle"></i> Confirm Booking
                  </button>
                )}
                {selectedBooking.paymentStatus === 'confirmed' && (
                  <button
                    className="p-btn-secondary"
                    onClick={() => {
                      handleRevertBooking(selectedBooking.id, selectedBooking)
                      setSelectedBooking(null)
                    }}
                  >
                    <i className="fas fa-undo"></i> Revert to Pending
                  </button>
                )}
                {selectedBooking.paymentStatus !== 'cancelled' && (
                  <button
                    className="p-btn-danger outline"
                    onClick={() => {
                      handleDeclineBooking(selectedBooking.id, selectedBooking)
                      setSelectedBooking(null)
                    }}
                  >
                    <i className="fas fa-times-circle"></i> Decline
                  </button>
                )}
                <button
                  className="p-btn-danger"
                  onClick={() => {
                    handleDeleteBooking(selectedBooking.id, selectedBooking)
                    setSelectedBooking(null)
                  }}
                >
                  <i className="fas fa-trash-alt"></i> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBooking
