// Revenue management page for admins.
// Loads bookings and lets the admin confirm payment statuses.
import { useEffect, useState } from 'react'
import { onValue, ref, update } from 'firebase/database'
import { db, syncExpiredPendingBookings } from '../../firebase'
import PageLoader from '../../components/PageLoader'
import { formatCurrency, getPaymentStatusMeta, normalizeBookings } from './adminData'
import './AdminRevenue.css'

const AdminRevenue = () => {
  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const bookingsRef = ref(db, 'bookings')
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      try {
        const normalizedPayments = normalizeBookings(snapshot.val())
        setPayments(normalizedPayments)
        void syncExpiredPendingBookings(normalizedPayments)
      } catch (error) {
        console.error('Error loading revenue data:', error)
        setPayments([])
      } finally {
        setPaymentsLoading(false)
      }
    }, (error) => {
      console.error('Firebase error loading revenue data:', error)
      setPayments([])
      setPaymentsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment)
    setViewModalOpen(true)
  }

  const handleDeletePayment = (payment) => {
    setSelectedPayment(payment)
    setDeleteModalOpen(true)
  }

  const confirmDeletePayment = async () => {
    if (!selectedPayment) return

    setIsDeleting(true)
    try {
      await update(ref(db, `bookings/${selectedPayment.id}`), { deleted: true, deletedAt: new Date().toISOString() })
      alert('Booking deleted successfully!')
      setDeleteModalOpen(false)
      setSelectedPayment(null)
    } catch (error) {
      console.error('Error deleting booking:', error)
      alert('Failed to delete booking.')
    } finally {
      setIsDeleting(false)
    }
  }

  const closeViewModal = () => {
    setViewModalOpen(false)
    setSelectedPayment(null)
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setSelectedPayment(null)
  }

  const stats = {
    total: payments.length,
    pending: payments.filter((payment) => payment.paymentStatus === 'pending').length,
    confirmed: payments.filter((payment) => payment.paymentStatus === 'confirmed').length,
    cancelled: payments.filter((payment) => payment.paymentStatus === 'cancelled').length,
    totalRevenue: payments.reduce((sum, payment) => sum + Number(payment.depositAmount || 0), 0),
    roomBookings: payments.filter((payment) => payment.type === 'room').length,
    ziplineBookings: payments.filter((payment) => payment.type === 'zipline').length,
    totalGuests: payments.reduce((sum, payment) => sum + Number(payment.guests || 0), 0),
    totalAmount: payments.reduce((sum, payment) => sum + Number(payment.totalAmount || payment.depositAmount || 0), 0)
  }

  const filteredPayments = payments.filter((payment) => {
    const fullName = `${payment.firstName || ''} ${payment.lastName || ''}`.toLowerCase()
    const search = searchTerm.toLowerCase()

    const matchesSearch = (
      fullName.includes(search) ||
      (payment.referenceNumber || '').toLowerCase().includes(search) ||
      (payment.room?.title || '').toLowerCase().includes(search) ||
      (payment.activity?.title || '').toLowerCase().includes(search) ||
      (payment.ziplineType || '').toLowerCase().includes(search)
    )

    const matchesStatus = statusFilter === 'all' || payment.paymentStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    const statusMeta = getPaymentStatusMeta(status)
    const statusClasses = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      cancelled: 'status-cancelled'
    }

    return (
      <span className={`status-badge ${statusClasses[statusMeta.tone] || 'status-pending'}`}>
        {statusMeta.label}
      </span>
    )
  }

  if (paymentsLoading) {
    return (
      <PageLoader
        title="Revenue"
        text="Loading payments and revenue summaries..."
        fullScreen={false}
      />
    )
  }

  return (
    <div className="admin-revenue">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-receipt"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Bookings</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-bed"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.roomBookings}</h3>
            <p>Room Bookings</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-wind"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.ziplineBookings}</h3>
            <p>Zipline Bookings</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.totalGuests}</h3>
            <p>Total Guests</p>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card confirmed">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.confirmed}</h3>
            <p>Confirmed</p>
          </div>
        </div>
        <div className="stat-card cancelled">
          <div className="stat-icon">
            <i className="fas fa-ban"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.cancelled}</h3>
            <p>Cancelled</p>
          </div>
        </div>
        <div className="stat-card revenue">
          <div className="stat-icon">
            <i className="fas fa-peso-sign"></i>
          </div>
          <div className="stat-info">
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Deposit Collected</p>
          </div>
        </div>
        <div className="stat-card revenue">
          <div className="stat-icon">
            <i className="fas fa-coins"></i>
          </div>
          <div className="stat-info">
            <h3>{formatCurrency(stats.totalAmount)}</h3>
            <p>Total Amount</p>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by name, reference, room, or activity..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="filter-group">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="revenue-table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Type</th>
              <th>Details</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  <i className="fas fa-inbox"></i>
                  <p>No revenue data found in the database.</p>
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className="guest-name" data-label="Guest">
                    <div className="name-cell">
                      <i className="fas fa-user"></i>
                      <span>{`${payment.firstName || ''} ${payment.lastName || ''}`.trim() || 'Guest'}</span>
                    </div>
                  </td>
                  <td data-label="Type">
                    <span className={`booking-type type-${payment.type || 'room'}`}>
                      <i className={`fas fa-${payment.type === 'zipline' ? 'wind' : 'bed'}`}></i>
                      {payment.type === 'zipline' ? 'Zipline' : 'Room'}
                    </span>
                  </td>
                  <td className="details-cell" data-label="Details">
                    <div className="details-main">
                      {payment.type === 'zipline' 
                        ? payment.activity?.title || 'Zipline'
                        : payment.room?.title || 'N/A'}
                    </div>
                    <div className="details-sub">
                      {payment.type === 'zipline' 
                        ? (payment.date ? new Date(payment.date).toLocaleDateString('en-PH') : '—')
                        : `${payment.checkIn ? new Date(payment.checkIn).toLocaleDateString('en-PH') : '—'} → ${payment.checkOut ? new Date(payment.checkOut).toLocaleDateString('en-PH') : '—'}`
                      }
                    </div>
                  </td>
                  <td className="amount-cell" data-label="Amount">
                    <div className="amount-main">{formatCurrency(payment.depositAmount)}</div>
                    <div className="amount-sub">Total: {formatCurrency(payment.totalAmount)}</div>
                  </td>
                  <td data-label="Status">{getStatusBadge(payment.paymentStatus)}</td>
                  <td className="actions" data-label="Actions">
                    <div className="action-buttons-wrapper">
                      <button
                        className="action-btn view"
                        onClick={() => handleViewPayment(payment)}
                        title="View Details"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeletePayment(payment)}
                        title="Delete Booking"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {viewModalOpen && selectedPayment && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal-content view-booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title-group">
                <div className={`type-badge type-${selectedPayment.type || 'room'}`}>
                  <i className={`fas fa-${selectedPayment.type === 'zipline' ? 'wind' : 'bed'}`}></i>
                </div>
                <div>
                  <h2>Booking Details</h2>
                  <p className="subtitle">Reference: {selectedPayment.referenceNumber || 'N/A'}</p>
                </div>
              </div>
              <button className="modal-close" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              {/* Summary Card */}
              <div className="summary-card">
                <div className="summary-main">
                  <div className="summary-info">
                    <span className="summary-label">Total Amount</span>
                    <h2 className="summary-value">{formatCurrency(selectedPayment.totalAmount)}</h2>
                  </div>
                  <div className="summary-status">
                    {getStatusBadge(selectedPayment.paymentStatus)}
                  </div>
                </div>
                <div className="summary-footer">
                  <div className="footer-item">
                    <i className="fas fa-calendar-check"></i>
                    <span>Deposit: {formatCurrency(selectedPayment.depositAmount)}</span>
                  </div>
                  <div className="footer-item">
                    <i className="fas fa-credit-card"></i>
                    <span>Balance: {formatCurrency((selectedPayment.totalAmount || 0) - (selectedPayment.depositAmount || 0))}</span>
                  </div>
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-section">
                  <h3><i className="fas fa-user-circle"></i> Guest Information</h3>
                  <div className="info-group">
                    <div className="info-item">
                      <span className="label">Full Name</span>
                      <span className="value">{selectedPayment.firstName} {selectedPayment.lastName}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Contact Number</span>
                      <span className="value">{selectedPayment.phone || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Email Address</span>
                      <span className="value">{selectedPayment.email || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3><i className="fas fa-info-circle"></i> Booking Details</h3>
                  <div className="info-group">
                    <div className="info-item">
                      <span className="label">Type</span>
                      <span className="value text-capitalize">{selectedPayment.type || 'Room'}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">{selectedPayment.type === 'zipline' ? 'Activity' : 'Room Name'}</span>
                      <span className="value">{selectedPayment.type === 'zipline' ? selectedPayment.activity?.title : selectedPayment.room?.title}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Schedule</span>
                      <span className="value">
                        {selectedPayment.type === 'zipline' 
                          ? (selectedPayment.date ? new Date(selectedPayment.date).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—')
                          : (
                            <div className="date-range">
                              <span>{selectedPayment.checkIn ? new Date(selectedPayment.checkIn).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '—'}</span>
                              <i className="fas fa-arrow-right"></i>
                              <span>{selectedPayment.checkOut ? new Date(selectedPayment.checkOut).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                            </div>
                          )
                        }
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Guests</span>
                      <span className="value">
                        <i className="fas fa-users"></i> {selectedPayment.guests || 1} {Number(selectedPayment.guests) > 1 ? 'Guests' : 'Guest'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedPayment.notes && (
                <div className="detail-section notes-section">
                  <h3><i className="fas fa-sticky-note"></i> Special Requests</h3>
                  <div className="notes-content">
                    {selectedPayment.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary full-width-mobile" onClick={closeViewModal}>
                <i className="fas fa-times-circle"></i> Close
              </button>
              {selectedPayment.paymentStatus === 'pending' && (
                <button className="btn-primary full-width-mobile" onClick={() => {/* Future: confirm action */}}>
                  <i className="fas fa-check-double"></i> Process Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && selectedPayment && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Booking</h2>
              <button className="modal-close" onClick={closeDeleteModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="confirm-message">
                <i className="fas fa-exclamation-circle"></i>
                <p>Are you sure you want to delete this booking?</p>
                <p className="text-muted">Guest: {selectedPayment.firstName} {selectedPayment.lastName}</p>
                <p className="text-muted">This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeDeleteModal} disabled={isDeleting}>Cancel</button>
              <button className="btn-danger" onClick={confirmDeletePayment} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRevenue
