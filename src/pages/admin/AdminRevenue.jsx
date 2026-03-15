import { useState, useEffect } from 'react'
import { ref, onValue, update } from 'firebase/database'
import { db } from '../../firebase'
import './AdminRevenue.css'

const AdminRevenue = () => {
  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Demo placeholder data
  const demoData = [
    {
      id: 'demo-1',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      room: { title: 'MARIA', subtitle: 'Large Duplex House with Aircon' },
      checkIn: '2026-03-20',
      checkOut: '2026-03-25',
      depositAmount: 5500,
      referenceNumber: 'GC123456789',
      paymentStatus: 'confirmed'
    },
    {
      id: 'demo-2',
      firstName: 'Maria',
      lastName: 'Santos',
      room: { title: 'ENRIQUETA', subtitle: 'Deluxe Aircon Room' },
      checkIn: '2026-03-22',
      checkOut: '2026-03-24',
      depositAmount: 4500,
      referenceNumber: 'GC987654321',
      paymentStatus: 'pending'
    },
    {
      id: 'demo-3',
      firstName: 'Pedro',
      lastName: 'Garcia',
      room: { title: 'CARMEN', subtitle: 'Dormitory Type - 8 Guests' },
      checkIn: '2026-04-01',
      checkOut: '2026-04-07',
      depositAmount: 8000,
      referenceNumber: 'GC456789123',
      paymentStatus: 'paid'
    },
    {
      id: 'demo-4',
      firstName: 'Ana',
      lastName: 'Reyes',
      room: { title: 'ELVIRA', subtitle: 'Standard Aircon Room' },
      checkIn: '2026-04-10',
      checkOut: '2026-04-15',
      depositAmount: 3500,
      referenceNumber: 'GC789123456',
      paymentStatus: 'confirmed'
    },
    {
      id: 'demo-5',
      firstName: 'Carlos',
      lastName: 'Mendoza',
      room: { title: 'CAROLINA', subtitle: 'Small Duplex - Fan Room' },
      checkIn: '2026-04-18',
      checkOut: '2026-04-21',
      depositAmount: 1500,
      referenceNumber: 'GC321654987',
      paymentStatus: 'pending'
    }
  ]

  useEffect(() => {
    const bookingsRef = ref(db, 'bookings')
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const paymentsList = Object.entries(data).map(([id, booking]) => ({
          id,
          ...booking
        }))
        setPayments(paymentsList)
      } else {
        // Use demo data when no real data exists
        setPayments(demoData)
      }
      setPaymentsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleConfirmPayment = async (id) => {
    try {
      const bookingRef = ref(db, `bookings/${id}`)
      await update(bookingRef, { paymentStatus: 'confirmed' })
      alert('Payment confirmed successfully!')
    } catch (error) {
      console.error('Error confirming payment:', error)
      alert('Failed to confirm payment.')
    }
  }

  const handleMarkAsPaid = async (id) => {
    try {
      const bookingRef = ref(db, `bookings/${id}`)
      await update(bookingRef, { paymentStatus: 'paid' })
      alert('Payment marked as paid!')
    } catch (error) {
      console.error('Error marking payment:', error)
      alert('Failed to update payment.')
    }
  }

  // Stats calculation
  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.paymentStatus === 'pending').length,
    confirmed: payments.filter(p => p.paymentStatus === 'confirmed').length,
    paid: payments.filter(p => p.paymentStatus === 'paid').length,
    totalRevenue: payments.reduce((acc, p) => acc + (p.depositAmount || 0), 0)
  }

  // Filtered payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      `${payment.firstName || ''} ${payment.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.referenceNumber && payment.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.room?.title && payment.room.title.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || payment.paymentStatus === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      paid: 'status-paid'
    }
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-pending'}`}>
        {status || 'pending'}
      </span>
    )
  }

  if (paymentsLoading) {
    return (
      <div className="admin-loading">
        <div className="loader"></div>
        <p>Loading revenue data...</p>
      </div>
    )
  }

  return (
    <div className="admin-revenue">
      {/* Stats Cards */}
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
        <div className="stat-card revenue">
          <div className="stat-icon">
            <i className="fas fa-peso-sign"></i>
          </div>
          <div className="stat-info">
            <h3>₱{stats.totalRevenue.toLocaleString()}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search by name, reference, or room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Revenue Table */}
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
                  <p>No revenue data found</p>
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className="guest-name" data-label="Guest">
                    <div className="name-cell">
                      <i className="fas fa-user"></i>
                      <span>{payment.firstName} {payment.lastName}</span>
                    </div>
                  </td>
                  <td data-label="Room">{payment.room?.title || 'N/A'}</td>
                  <td data-label="Check-in">{payment.checkIn ? new Date(payment.checkIn).toLocaleDateString() : 'N/A'}</td>
                  <td data-label="Check-out">{payment.checkOut ? new Date(payment.checkOut).toLocaleDateString() : 'N/A'}</td>
                  <td className="amount" data-label="Amount">₱{payment.depositAmount?.toLocaleString() || '0'}</td>
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
