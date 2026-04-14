// Revenue management page for admins.
// Loads bookings and lets the admin confirm or mark payments as paid.
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

  const handleConfirmPayment = async (id) => {
    try {
      await update(ref(db, `bookings/${id}`), { paymentStatus: 'confirmed' })
      alert('Payment confirmed successfully!')
    } catch (error) {
      console.error('Error confirming payment:', error)
      alert('Failed to confirm payment.')
    }
  }

  const handleMarkAsPaid = async (id) => {
    try {
      await update(ref(db, `bookings/${id}`), { paymentStatus: 'paid' })
      alert('Payment marked as paid!')
    } catch (error) {
      console.error('Error marking payment:', error)
      alert('Failed to update payment.')
    }
  }

  const stats = {
    total: payments.length,
    pending: payments.filter((payment) => payment.paymentStatus === 'pending').length,
    confirmed: payments.filter((payment) => payment.paymentStatus === 'confirmed').length,
    paid: payments.filter((payment) => payment.paymentStatus === 'paid').length,
    cancelled: payments.filter((payment) => payment.paymentStatus === 'cancelled').length,
    totalRevenue: payments.reduce((sum, payment) => sum + Number(payment.depositAmount || 0), 0)
  }

  const filteredPayments = payments.filter((payment) => {
    const fullName = `${payment.firstName || ''} ${payment.lastName || ''}`.toLowerCase()
    const search = searchTerm.toLowerCase()

    const matchesSearch = (
      fullName.includes(search) ||
      (payment.referenceNumber || '').toLowerCase().includes(search) ||
      (payment.room?.title || '').toLowerCase().includes(search)
    )

    const matchesStatus = statusFilter === 'all' || payment.paymentStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    const statusMeta = getPaymentStatusMeta(status)
    const statusClasses = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      paid: 'status-paid',
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
        <div className="stat-card paid">
          <div className="stat-icon">
            <i className="fas fa-check-double"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.paid}</h3>
            <p>Paid</p>
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
            <p>Total Revenue</p>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by name, reference, or room..."
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
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="revenue-table">
          <thead>
            <tr>
              <th>Guest Name</th>
              <th>Room</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Amount</th>
              <th>Reference #</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
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
                  <td data-label="Room">{payment.room?.title || 'N/A'}</td>
                  <td data-label="Check-in">{payment.checkIn ? new Date(payment.checkIn).toLocaleDateString('en-PH') : 'N/A'}</td>
                  <td data-label="Check-out">{payment.checkOut ? new Date(payment.checkOut).toLocaleDateString('en-PH') : 'N/A'}</td>
                  <td className="amount" data-label="Amount">{formatCurrency(payment.depositAmount)}</td>
                  <td className="reference" data-label="Ref #">{payment.referenceNumber || 'N/A'}</td>
                  <td data-label="Status">{getStatusBadge(payment.paymentStatus)}</td>
                  <td className="actions" data-label="Actions">
                    <div className="action-buttons-wrapper">
                      {payment.paymentStatus === 'pending' && (
                        <button
                          className="action-btn confirm"
                          onClick={() => handleConfirmPayment(payment.id)}
                          title="Confirm Payment"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                      {(payment.paymentStatus === 'confirmed' || payment.paymentStatus === 'pending') && (
                        <button
                          className="action-btn paid"
                          onClick={() => handleMarkAsPaid(payment.id)}
                          title="Mark as Paid"
                        >
                          <i className="fas fa-check-double"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminRevenue
