import { useState, useEffect } from 'react'
import { ref, onValue, update, remove } from 'firebase/database'
import { db } from '../../firebase'
import './AdminBooking.css'

const AdminBooking = () => {
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const handleConfirmBooking = async (id) => {
    try {
      const bookingRef = ref(db, `bookings/${id}`)
      await update(bookingRef, { paymentStatus: 'confirmed' })
      alert('Booking confirmed successfully!')
    } catch (error) {
      console.error('Error confirming booking:', error)
      alert('Failed to confirm booking.')
    }
  }

  const handleDeleteBooking = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const bookingRef = ref(db, `bookings/${id}`)
        await remove(bookingRef)
        alert('Booking deleted successfully!')
      } catch (error) {
        console.error('Error deleting booking:', error)
        alert('Failed to delete booking.')
      }
    }
  }

  // Stats calculation
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.paymentStatus === 'pending').length,
    confirmed: bookings.filter(b => b.paymentStatus === 'confirmed').length,
    revenue: bookings.reduce((acc, b) => acc + (b.depositAmount || 0), 0)
  }

  // Filtered bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      `${booking.firstName} ${booking.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.referenceNumber && booking.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || booking.paymentStatus === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Placeholder bookings data (for demo purposes when database is empty)
  const placeholderBookings = [
    {
      id: 'placeholder-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+63 912 345 6789',
      room: { title: 'MARIA', subtitle: 'Large Duplex', price: 5500 },
      checkIn: '2026-03-20T14:00:00.000Z',
      checkOut: '2026-03-22T11:00:00.000Z',
      guests: 4,
      referenceNumber: 'GC123456789',
      depositAmount: 2750,
      paymentStatus: 'confirmed',
      bookingStatus: 'confirmed',
      createdAt: '2026-03-15T10:00:00.000Z'
    },
    {
      id: 'placeholder-2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+63 918 987 6543',
      room: { title: 'CARMEN', subtitle: 'Dormitory', price: 8000 },
      checkIn: '2026-03-25T14:00:00.000Z',
      checkOut: '2026-03-28T11:00:00.000Z',
      guests: 8,
      referenceNumber: 'GC987654321',
      depositAmount: 4000,
      paymentStatus: 'pending',
      bookingStatus: 'confirmed',
      createdAt: '2026-03-16T09:30:00.000Z'
    },
    {
      id: 'placeholder-3',
      firstName: 'Michael',
      lastName: 'Garcia',
      email: 'michael.garcia@example.com',
      phone: '+63 917 555 1234',
      room: { title: 'CAROLINA', subtitle: 'Fan Room', price: 1500 },
      checkIn: '2026-04-01T14:00:00.000Z',
      checkOut: '2026-04-03T11:00:00.000Z',
      guests: 2,
      referenceNumber: 'GC456789123',
      depositAmount: 1500,
      paymentStatus: 'confirmed',
      bookingStatus: 'confirmed',
      createdAt: '2026-03-17T14:20:00.000Z'
    }
  ]

  // Fetch bookings from Firebase Realtime Database
  useEffect(() => {
    const bookingsRef = ref(db, 'bookings')
    
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      try {
        const data = snapshot.val()
        if (data) {
          // Convert object to array and add IDs
          const bookingsArray = Object.entries(data).map(([id, booking]) => ({
            id,
            ...booking
          }))
          // Sort by creation date (newest first)
          bookingsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          setBookings(bookingsArray)
        } else {
          // Use placeholder data when database is empty
          setBookings(placeholderBookings)
        }
      } catch (error) {
        console.error('Error fetching bookings:', error)
        // Fallback to placeholder data on error
        setBookings(placeholderBookings)
      } finally {
        setBookingsLoading(false)
      }
    }, (error) => {
      console.error('Firebase error:', error)
      // Use placeholder data on Firebase error
      setBookings(placeholderBookings)
      setBookingsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className="admin-booking-container">
      {/* Stats Grid */}
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
          <div className="stat-icon" style={{ background: '#f0f9ff', color: '#0077b6' }}>
            <i className="fas fa-peso-sign"></i>
          </div>
          <div className="stat-info">
            <h3>₱{stats.revenue.toLocaleString()}</h3>
            <p>Total Deposits</p>
          </div>
        </div>
      </div>

      {/* Bookings Table Card */}
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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>
          <button className="export-btn">
            <i className="fas fa-file-export"></i> Export Data
          </button>
        </div>

        {bookingsLoading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-calendar-times"></i>
            <p>No bookings found matching your criteria</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Guest Name</th>
                  <th>Room</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Guests</th>
                  <th>Reference #</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td data-label="Guest">
                      <div className="guest-info">
                        <span className="guest-name">{booking.firstName} {booking.lastName}</span>
                        <span className="guest-email">{booking.email}</span>
                      </div>
                    </td>
                    <td data-label="Room">{booking.room?.title} ({booking.room?.subtitle})</td>
                    <td data-label="Check In">{booking.checkIn ? new Date(booking.checkIn).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
                    <td data-label="Check Out">{booking.checkOut ? new Date(booking.checkOut).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
                    <td data-label="Guests">{booking.guests}</td>
                    <td data-label="Reference #">
                      <span className="reference-number">{booking.referenceNumber || 'N/A'}</span>
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge ${booking.paymentStatus === 'pending' ? 'pending' : 'confirmed'}`}>
                        <i className={`fas ${booking.paymentStatus === 'pending' ? 'fa-clock' : 'fa-check-circle'}`}></i>
                        {booking.paymentStatus === 'pending' ? 'Pending' : 'Confirmed'}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="booking-modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="booking-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="booking-modal-header">
              <h3>Booking Details</h3>
              <button className="modal-close-btn" onClick={() => setSelectedBooking(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="booking-modal-body">
              <div className="booking-detail-section">
                <h4>Guest Information</h4>
                <p><strong>Name:</strong> {selectedBooking.firstName} {selectedBooking.lastName}</p>
                <p><strong>Email:</strong> {selectedBooking.email}</p>
                <p><strong>Phone:</strong> {selectedBooking.phone || 'N/A'}</p>
              </div>
              <div className="booking-detail-section">
                <h4>Room Details</h4>
                <p><strong>Room:</strong> {selectedBooking.room?.title} ({selectedBooking.room?.subtitle})</p>
                <p><strong>Price per night:</strong> ₱{selectedBooking.room?.price?.toLocaleString()}</p>
              </div>
              <div className="booking-detail-section">
                <h4>Booking Dates</h4>
                <p><strong>Check-in:</strong> {selectedBooking.checkIn ? new Date(selectedBooking.checkIn).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                <p><strong>Check-out:</strong> {selectedBooking.checkOut ? new Date(selectedBooking.checkOut).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                <p><strong>Number of Guests:</strong> {selectedBooking.guests}</p>
              </div>
              <div className="booking-detail-section">
                <h4>Payment Information</h4>
                <p><strong>Reference Number:</strong> {selectedBooking.referenceNumber || 'N/A'}</p>
                <p><strong>Deposit Amount:</strong> ₱{selectedBooking.depositAmount?.toLocaleString()}</p>
                <p><strong>Payment Status:</strong> <span className={`status ${selectedBooking.paymentStatus === 'pending' ? 'pending' : 'confirmed'}`}>{selectedBooking.paymentStatus === 'pending' ? 'Pending' : 'Confirmed'}</span></p>
              </div>
              {selectedBooking.specialRequests && (
                <div className="booking-detail-section">
                  <h4>Special Requests</h4>
                  <p>{selectedBooking.specialRequests}</p>
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