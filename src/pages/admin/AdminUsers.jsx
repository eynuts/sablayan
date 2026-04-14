// User management page for admins.
// Combines user profile data and booking history to display guest metrics.
import { useEffect, useMemo, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db, syncExpiredPendingBookings } from '../../firebase'
import { useAdminAuth } from '../../AdminAuthContext'
import { formatDate, normalizeBookings, normalizeUsers } from './adminData'
import './AdminUsers.css'

const AdminUsers = () => {
  const { user } = useAdminAuth()
  const [bookings, setBookings] = useState([])
  const [usersData, setUsersData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const bookingsRef = ref(db, 'bookings')
    const usersRef = ref(db, 'users')

    const unsubscribeBookings = onValue(bookingsRef, (snapshot) => {
      const normalizedBookings = normalizeBookings(snapshot.val())
      setBookings(normalizedBookings)
      void syncExpiredPendingBookings(normalizedBookings)
    }, (error) => {
      console.error('Firebase error loading booking users:', error)
      setBookings([])
    })

    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      setUsersData(snapshot.val())
    }, (error) => {
      console.error('Firebase error loading users:', error)
      setUsersData(null)
    })

    return () => {
      unsubscribeBookings()
      unsubscribeUsers()
    }
  }, [])

  const users = useMemo(() => normalizeUsers(usersData, bookings, user), [usersData, bookings, user])

  const filteredUsers = users.filter((item) => {
    const matchesSearch = (
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: users.length,
    active: users.filter((item) => item.status === 'active').length,
    inactive: users.filter((item) => item.status === 'inactive').length,
    admins: users.filter((item) => item.role === 'admin').length
  }

  return (
    <div className="admin-users-container">
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#166534' }}>
            <i className="fas fa-user-check"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.active}</h3>
            <p>Active Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#991b1b' }}>
            <i className="fas fa-user-slash"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.inactive}</h3>
            <p>Inactive Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef9c3', color: '#854d0e' }}>
            <i className="fas fa-user-shield"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.admins}</h3>
            <p>Administrators</p>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="card-header">
          <div className="header-left">
            <h3>User Management</h3>
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <select
              className="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-users-slash"></i>
            <p>No users found in the database yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Bookings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((item) => (
                  <tr key={item.id}>
                    <td data-label="User">
                      <div className="user-info">
                        <div className="user-avatar">
                          {(item.name || 'U').charAt(0)}
                        </div>
                        <div className="user-details">
                          <span className="user-name">{item.name}</span>
                          <span className="user-email">{item.email}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Contact">
                      <span className="contact-info">{item.phone || 'N/A'}</span>
                    </td>
                    <td data-label="Role">
                      <span className={`role-badge ${item.role}`}>
                        {item.role === 'admin' ? <i className="fas fa-shield-alt"></i> : <i className="fas fa-user"></i>}
                        {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge ${item.status}`}>
                        <i className={`fas ${item.status === 'active' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    <td data-label="Joined">
                      <span className="date">{formatDate(item.joinedDate)}</span>
                    </td>
                    <td data-label="Bookings">
                      <span className="booking-count">{item.totalBookings || 0}</span>
                    </td>
                    <td data-label="Actions">
                      <div className="action-btns">
                        <button className="view-btn" title="View Details" disabled>
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="edit-btn" title="Edit User" disabled>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="delete-btn" title="Delete User" disabled>
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
    </div>
  )
}

export default AdminUsers
