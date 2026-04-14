// Admin dashboard home page.
// Shows high-level booking, room, user, and revenue summaries for quick oversight.
import { useEffect, useMemo, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db, syncExpiredPendingBookings } from '../../firebase'
import {
  formatCurrency,
  getOccupancyStats,
  getRecentActivity,
  getRelativeTime,
  getRevenueSeries,
  normalizeBookings,
  normalizeRooms,
  normalizeUsers
} from './adminData'
import './AdminHome.css'

const AdminHome = () => {
  const [bookings, setBookings] = useState([])
  const [rooms, setRooms] = useState([])
  const [usersData, setUsersData] = useState(null)

  useEffect(() => {
    const bookingsRef = ref(db, 'bookings')
    const roomsRef = ref(db, 'rooms')
    const usersRef = ref(db, 'users')

    const unsubscribeBookings = onValue(bookingsRef, (snapshot) => {
      const normalizedBookings = normalizeBookings(snapshot.val())
      setBookings(normalizedBookings)
      void syncExpiredPendingBookings(normalizedBookings)
    }, (error) => {
      console.error('Firebase error loading dashboard bookings:', error)
      setBookings([])
    })

    const unsubscribeRooms = onValue(roomsRef, (snapshot) => {
      setRooms(normalizeRooms(snapshot.val()))
    }, (error) => {
      console.error('Firebase error loading dashboard rooms:', error)
      setRooms([])
    })

    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      setUsersData(snapshot.val())
    }, (error) => {
      console.error('Firebase error loading dashboard users:', error)
      setUsersData(null)
    })

    return () => {
      unsubscribeBookings()
      unsubscribeRooms()
      unsubscribeUsers()
    }
  }, [])

  // Derive aggregated data for dashboard cards and charts.
  const users = useMemo(() => normalizeUsers(usersData, bookings), [usersData, bookings])
  const occupancy = useMemo(() => getOccupancyStats(rooms, bookings), [rooms, bookings])
  const recentActivity = useMemo(() => getRecentActivity(bookings, users), [bookings, users])
  const revenueSeries = useMemo(() => getRevenueSeries(bookings, 7), [bookings])

  const maxRevenueValue = Math.max(...revenueSeries.map((item) => item.value), 0)
  const confirmedRevenue = bookings
    .filter((booking) => ['confirmed', 'paid'].includes(booking.paymentStatus))
    .reduce((sum, booking) => sum + Number(booking.depositAmount || 0), 0)
  const pendingBookings = bookings.filter((booking) => booking.paymentStatus === 'pending').length
  const activeUsers = users.filter((user) => user.status === 'active').length

  const stats = [
    {
      id: 'bookings',
      label: 'Total Bookings',
      value: bookings.length.toLocaleString('en-PH'),
      icon: 'fa-calendar-check',
      color: '#d94e28',
      trend: pendingBookings > 0 ? `${pendingBookings} pending approval` : 'No pending approvals'
    },
    {
      id: 'revenue',
      label: 'Confirmed Revenue',
      value: formatCurrency(confirmedRevenue),
      icon: 'fa-peso-sign',
      color: '#22c55e',
      trend: `${revenueSeries.filter((item) => item.value > 0).length} active revenue days`
    },
    {
      id: 'users',
      label: 'Active Users',
      value: activeUsers.toLocaleString('en-PH'),
      icon: 'fa-users',
      color: '#a8d5ba',
      trend: `${users.length.toLocaleString('en-PH')} total tracked guests`
    },
    {
      id: 'occupancy',
      label: 'Room Occupancy',
      value: `${occupancy.percentage}%`,
      icon: 'fa-bed',
      color: '#122b36',
      trend: `${occupancy.occupied} of ${occupancy.total} rooms occupied today`
    }
  ]

  return (
    <div className="admin-home-container">
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.id} className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <span className="stat-trend">{stat.trend}</span>
            </div>
            <div className="stat-body">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-main-grid">
        <div className="admin-card chart-card">
          <div className="card-header">
            <h3>Revenue Overview</h3>
            <span className="chart-filter">Last 7 Days</span>
          </div>
          <div className="chart-placeholder">
            <div className="placeholder-bars">
              {revenueSeries.map((item) => (
                <div
                  key={item.label}
                  className="bar"
                  style={{
                    height: `${maxRevenueValue === 0 ? 12 : Math.max(12, Math.round((item.value / maxRevenueValue) * 100))}%`
                  }}
                  title={`${item.label}: ${formatCurrency(item.value)}`}
                ></div>
              ))}
            </div>
            <div className="chart-labels">
              {revenueSeries.map((item) => (
                <span key={item.label}>{item.label}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-card activity-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <span className="view-all-btn">{recentActivity.length} items</span>
          </div>
          <div className="activity-list">
            {recentActivity.length === 0 ? (
              <div className="activity-item">
                <div className="activity-content">
                  <p><strong>No recent activity yet.</strong> New bookings and signups will appear here.</p>
                </div>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-status-dot ${activity.status}`}></div>
                  <div className="activity-content">
                    <p><strong>{activity.user}</strong> {activity.action} <span>{activity.target}</span></p>
                    <span className="activity-time">{getRelativeTime(activity.time)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="admin-card quick-actions-card">
        <h3>Live Snapshot</h3>
        <div className="actions-grid">
          <button className="quick-action-btn" type="button">
            <i className="fas fa-calendar-alt"></i>
            <span>{bookings.filter((booking) => booking.paymentStatus === 'pending').length} Pending Bookings</span>
          </button>
          <button className="quick-action-btn" type="button">
            <i className="fas fa-bed"></i>
            <span>{rooms.filter((room) => room.status === 'available').length} Available Rooms</span>
          </button>
          <button className="quick-action-btn" type="button">
            <i className="fas fa-user-plus"></i>
            <span>{users.filter((user) => user.role !== 'admin').length} Registered Guests</span>
          </button>
          <button className="quick-action-btn" type="button">
            <i className="fas fa-receipt"></i>
            <span>{formatCurrency(bookings.reduce((sum, booking) => sum + Number(booking.depositAmount || 0), 0))} Deposits Logged</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminHome
