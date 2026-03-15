import { useState } from 'react'
import './AdminUsers.css'

const AdminUsers = () => {
  const [users] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+63 912 345 6789',
      role: 'customer',
      status: 'active',
      joinedDate: '2026-01-15',
      totalBookings: 3
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+63 918 987 6543',
      role: 'customer',
      status: 'active',
      joinedDate: '2026-02-20',
      totalBookings: 1
    },
    {
      id: 3,
      name: 'Michael Garcia',
      email: 'michael.garcia@example.com',
      phone: '+63 917 555 1234',
      role: 'customer',
      status: 'inactive',
      joinedDate: '2025-12-10',
      totalBookings: 0
    },
    {
      id: 4,
      name: 'Admin User',
      email: 'admin@sidell.com',
      phone: '+63 900 000 0000',
      role: 'admin',
      status: 'active',
      joinedDate: '2025-06-01',
      totalBookings: 0
    },
    {
      id: 5,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+63 916 444 5678',
      role: 'customer',
      status: 'active',
      joinedDate: '2026-03-01',
      totalBookings: 2
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    admins: users.filter(u => u.role === 'admin').length
  }

  return (
    <div className="admin-users-container">
      {/* Stats Grid */}
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

      {/* Users Table */}
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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button className="add-btn">
            <i className="fas fa-user-plus"></i> Add User
          </button>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-users-slash"></i>
            <p>No users found matching your criteria</p>
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
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td data-label="User">
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.name.charAt(0)}
                        </div>
                        <div className="user-details">
                          <span className="user-name">{user.name}</span>
                          <span className="user-email">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Contact">
                      <span className="contact-info">{user.phone}</span>
                    </td>
                    <td data-label="Role">
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? <i className="fas fa-shield-alt"></i> : <i className="fas fa-user"></i>}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge ${user.status}`}>
                        <i className={`fas ${user.status === 'active' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td data-label="Joined">
                      <span className="date">{new Date(user.joinedDate).toLocaleDateString('en-PH')}</span>
                    </td>
                    <td data-label="Bookings">
                      <span className="booking-count">{user.totalBookings}</span>
                    </td>
                    <td data-label="Actions">
                      <div className="action-btns">
                        <button className="view-btn" title="View Details">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="edit-btn" title="Edit User">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="delete-btn" title="Delete User">
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