import { useEffect, useState } from 'react'
import { onValue, ref, remove, update } from 'firebase/database'
import { db, syncExpiredPendingBookings } from '../../firebase'
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

  const handleConfirmBooking = async (id) => {
    try {
      await update(ref(db, `bookings/${id}`), { 
        paymentStatus: 'confirmed',
        bookingStatus: 'confirmed'
      })
      alert('Booking confirmed successfully!')
    } catch (error) {
      console.error('Error confirming booking:', error)
      alert('Failed to confirm booking.')
    }
  }

  const handleRevertBooking = async (id) => {
    try {
      await update(ref(db, `bookings/${id}`), { 
        paymentStatus: 'pending',
        bookingStatus: 'pending'
      })
      alert('Booking reverted to pending!')
    } catch (error) {
      console.error('Error reverting booking:', error)
      alert('Failed to revert booking.')
    }
  }

  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) {
      return
    }

    try {
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
    activeStays: bookings.filter((booking) => ['confirmed', 'paid'].includes(booking.paymentStatus) && getBookingOperationalStatus(booking).phase === 'active').length,
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
                    <option value="paid">Paid</option>
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
                              onClick={() => handleConfirmBooking(booking.id)}
                              title="Confirm Booking"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                          {booking.paymentStatus === 'confirmed' && (
                            <button
                              className="revert-btn"
                              onClick={() => handleRevertBooking(booking.id)}
                              title="Revert to Pending"
                            >
                              <i className="fas fa-undo"></i>
                            </button>
                          )}
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteBooking(booking.id)}
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
        <div className="booking-modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="booking-modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="booking-modal-header">
              <h3>Booking Details</h3>
              <button className="modal-close-btn" onClick={() => setSelectedBooking(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="booking-modal-body">
              <div className="booking-detail-section">
                <h4>Guest Information</h4>
                <p><strong>Name:</strong> {`${selectedBooking.firstName || ''} ${selectedBooking.lastName || ''}`.trim() || 'Guest'}</p>
                <p><strong>Email:</strong> {selectedBooking.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedBooking.phone || 'N/A'}</p>
              </div>
              {selectedBooking.type === 'zipline' ? (
                <>
                  <div className="booking-detail-section">
                    <h4>Activity Details</h4>
                    <p><strong>Activity:</strong> {selectedBooking.activity?.title || 'Zipline Adventure'}</p>
                    <p><strong>Experience Type:</strong> {selectedBooking.ziplineType === 'local' ? 'Sablayeño Rate' : 'Tourist Rate'}</p>
                    <p><strong>Price per person:</strong> {formatCurrency(selectedBooking.activity?.price)}</p>
                    <p><strong>Description:</strong> {selectedBooking.activity?.description}</p>
                  </div>
                  <div className="booking-detail-section">
                    <h4>Activity Date</h4>
                    <p><strong>Date:</strong> {formatDate(selectedBooking.date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><strong>Duration:</strong> 15-20 minutes</p>
                    <p><strong>Activity status:</strong> <span className={`status ${getBookingOperationalStatus(selectedBooking).tone}`}>{getBookingOperationalStatus(selectedBooking).label}</span></p>
                    <p><strong>Status detail:</strong> {getBookingOperationalStatus(selectedBooking).details}</p>
                    <p><strong>Number of Participants:</strong> {selectedBooking.guests || 0}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="booking-detail-section">
                    <h4>Room Details</h4>
                    <p><strong>Room:</strong> {selectedBooking.room?.title || 'N/A'} {selectedBooking.room?.subtitle ? `(${selectedBooking.room.subtitle})` : ''}</p>
                    <p><strong>Price per night:</strong> {formatCurrency(selectedBooking.room?.price)}</p>
                  </div>
                  <div className="booking-detail-section">
                    <h4>Booking Dates</h4>
                    <p><strong>Check-in:</strong> {formatDate(selectedBooking.checkIn, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><strong>Check-out:</strong> {formatDate(selectedBooking.checkOut, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><strong>Stay status:</strong> <span className={`status ${getBookingOperationalStatus(selectedBooking).tone}`}>{getBookingOperationalStatus(selectedBooking).label}</span></p>
                    <p><strong>Status detail:</strong> {getBookingOperationalStatus(selectedBooking).details}</p>
                    <p><strong>Number of Guests:</strong> {selectedBooking.guests || 0}</p>
                  </div>
                </>
              )}
              <div className="booking-detail-section">
                <h4>Payment Information</h4>
                <p><strong>Reference Number:</strong> {selectedBooking.referenceNumber || 'N/A'}</p>
                <p><strong>Deposit Amount:</strong> {formatCurrency(selectedBooking.depositAmount)}</p>
                <p><strong>Payment Status:</strong> <span className={`status ${getPaymentStatusMeta(selectedBooking.paymentStatus).tone}`}>{getPaymentStatusMeta(selectedBooking.paymentStatus).label}</span></p>
                {selectedBooking.paymentReceiptUrl && (
                  <p>
                    <strong>Receipt:</strong>{' '}
                    <a href={selectedBooking.paymentReceiptUrl} target="_blank" rel="noreferrer">
                      View uploaded receipt
                    </a>
                  </p>
                )}
              </div>
              {selectedBooking.message && (
                <div className="booking-detail-section">
                  <h4>Special Requests/Message</h4>
                  <p>{selectedBooking.message}</p>
                </div>
              )}
              <div className="booking-modal-actions">
                {selectedBooking.paymentStatus === 'pending' && (
                  <button
                    className="confirm-btn-large"
                    onClick={() => {
                      handleConfirmBooking(selectedBooking.id)
                      setSelectedBooking(null)
                    }}
                  >
                    <i className="fas fa-check"></i> Confirm Payment
                  </button>
                )}
                {selectedBooking.paymentStatus === 'confirmed' && (
                  <button
                    className="revert-btn-large"
                    onClick={() => {
                      handleRevertBooking(selectedBooking.id)
                      setSelectedBooking(null)
                    }}
                  >
                    <i className="fas fa-undo"></i> Revert to Pending
                  </button>
                )}
                <button
                  className="delete-btn-large"
                  onClick={() => {
                    handleDeleteBooking(selectedBooking.id)
                    setSelectedBooking(null)
                  }}
                >
                  <i className="fas fa-trash-alt"></i> Delete Booking
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
