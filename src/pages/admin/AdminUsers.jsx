// User management page for admins.
// Combines user profile data and booking history to display guest metrics.
import { useEffect, useMemo, useState } from 'react'
import { onValue, ref, remove, update } from 'firebase/database'
import { db, syncExpiredPendingBookings, verifyAdminPassword } from '../../firebase'
import { useAdminAuth } from '../../AdminAuthContext'
import { formatDate, normalizeBookings, normalizeUsers } from './adminData'
import './AdminUsers.css'

const AdminUsers = () => {
  const { user } = useAdminAuth()
  const [bookings, setBookings] = useState([])
  const [usersData, setUsersData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false)

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

  const handleViewUser = (userData) => {
    setSelectedUser(userData)
    setViewModalOpen(true)
  }

  const closeViewModal = () => {
    setViewModalOpen(false)
    setSelectedUser(null)
  }

  const handleEditUser = (userData) => {
    setSelectedUser(userData)
    setEditFormData({
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      role: userData.role || 'customer'
    })
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setSelectedUser(null)
    setEditFormData({})
  }

  const handleDeleteUser = (selectedUser) => {
    setSelectedUser(selectedUser)
    setDeleteModalOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!selectedUser?.id) return

    setIsDeleting(true)
    try {
      await remove(ref(db, `users/${selectedUser.id}`))
      alert('User deleted successfully!')
      setDeleteModalOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user.')
    } finally {
      setIsDeleting(false)
    }
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setSelectedUser(null)
  }

  const saveEditUser = () => {
    // Open password confirmation modal instead of saving directly
    setPasswordModalOpen(true)
    setConfirmPassword('')
  }

  const verifyPasswordAndSave = async () => {
    if (!confirmPassword) {
      alert('Please enter your password.')
      return
    }

    setIsVerifyingPassword(true)
    try {
      // Verify password against database
      await verifyAdminPassword(user.email, confirmPassword)
      
      // Password is correct, proceed with saving user data
      await update(ref(db, `users/${selectedUser.id}`), {
        name: editFormData.name,
        phone: editFormData.phone,
        role: editFormData.role
      })
      
      alert('User updated successfully!')
      setPasswordModalOpen(false)
      setEditModalOpen(false)
      setSelectedUser(null)
      setEditFormData({})
      setConfirmPassword('')
    } catch (error) {
      console.error('Error verifying password or updating user:', error)
      if (error.code === 'auth/invalid-password') {
        alert('Incorrect password. Please try again.')
      } else if (error.code === 'auth/user-not-found') {
        alert('Admin account not found.')
      } else {
        alert('Failed to update user. Please try again.')
      }
    } finally {
      setIsVerifyingPassword(false)
    }
  }

  const closePasswordModal = () => {
    setPasswordModalOpen(false)
    setConfirmPassword('')
  }

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
                        <button className="view-btn" title="View Details" onClick={() => handleViewUser(item)}>
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="edit-btn" title="Edit User" onClick={() => handleEditUser(item)}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="delete-btn" title="Delete User" onClick={() => handleDeleteUser(item)} disabled={user?.role === 'moderator'}>
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

      {/* View User Modal */}
      {viewModalOpen && (
        <div className="modal-overlay active" onClick={closeViewModal}>
          <div className="modal-content view-user-modal animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <div className="modal-header-bg"></div>
              <div className="header-content">
                <div className="user-avatar-premium">
                  {(selectedUser?.name || 'U').charAt(0)}
                  <div className={`status-dot ${selectedUser?.status}`}></div>
                </div>
                <div className="header-text">
                  <h3>{selectedUser?.name || 'User Details'}</h3>
                  <span className="user-id-tag">ID: {selectedUser?.id?.substring(0, 12)}</span>
                </div>
              </div>
              <button className="close-btn-premium" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body-premium">
              <div className="info-sections">
                <div className="info-section">
                  <div className="section-header">
                    <i className="fas fa-info-circle"></i>
                    <span>Account Overview</span>
                  </div>
                  <div className="premium-info-grid">
                    <div className="p-info-item">
                      <label>Email Address</label>
                      <div className="p-value">{selectedUser?.email}</div>
                    </div>
                    <div className="p-info-item">
                      <label>Phone Number</label>
                      <div className="p-value">{selectedUser?.phone || 'Not provided'}</div>
                    </div>
                    <div className="p-info-item">
                      <label>Role / Access</label>
                      <div className="p-value">
                        <span className={`p-badge role ${selectedUser?.role}`}>
                          {selectedUser?.role === 'admin' ? <i className="fas fa-shield-alt"></i> : <i className="fas fa-user"></i>}
                          {selectedUser?.role}
                        </span>
                      </div>
                    </div>
                    <div className="p-info-item">
                      <label>Account Status</label>
                      <div className="p-value">
                        <span className={`p-badge status ${selectedUser?.status}`}>
                          {selectedUser?.status === 'active' ? <i className="fas fa-check"></i> : <i className="fas fa-times"></i>}
                          {selectedUser?.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <div className="section-header">
                    <i className="fas fa-history"></i>
                    <span>Platform Activity</span>
                  </div>
                  <div className="p-activity-grid">
                    <div className="p-activity-card">
                      <span className="p-act-label">Total Bookings</span>
                      <span className="p-act-value">{selectedUser?.totalBookings || 0}</span>
                    </div>
                    <div className="p-activity-card">
                      <span className="p-act-label">Joined On</span>
                      <span className="p-act-value small">{formatDate(selectedUser?.joinedDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer-premium">
              <button className="p-btn-secondary" onClick={closeViewModal}>
                Close
              </button>
              <button className="p-btn-primary" onClick={() => { closeViewModal(); setTimeout(() => handleEditUser(selectedUser), 100); }}>
                <i className="fas fa-user-edit"></i> Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalOpen && (
        <div className="modal-overlay active" onClick={closeEditModal}>
          <div className="modal-content edit-user-modal animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium minimal">
              <h3>Edit Account</h3>
              <button className="close-btn-premium" onClick={closeEditModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body-premium">
              <div className="premium-form">
                <div className="p-form-group">
                  <label><i className="fas fa-user"></i> Full Name</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="p-form-group disabled">
                  <label><i className="fas fa-envelope"></i> Email Address</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    disabled
                  />
                  <span className="input-note">Email cannot be changed</span>
                </div>
                <div className="p-form-group">
                  <label><i className="fas fa-phone"></i> Phone Number</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    placeholder="e.g. +63 912 345 6789"
                  />
                </div>
                <div className="p-form-group">
                  <label><i className="fas fa-user-shield"></i> System Role</label>
                  <div className="p-select-wrapper">
                    <select
                      value={editFormData.role || 'customer'}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    >
                      <option value="customer">Customer</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <i className="fas fa-chevron-down"></i>
                  </div>
                  {editFormData.role === 'moderator' && (
                    <div className="p-role-note info">
                      <i className="fas fa-info-circle"></i>
                      <span>Moderators have access to Bookings, Revenue, and Rooms.</span>
                    </div>
                  )}
                  {editFormData.role === 'admin' && (
                    <div className="p-role-note warning">
                      <i className="fas fa-exclamation-triangle"></i>
                      <span>Administrators have full system access. Use caution.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-footer-premium">
              <button className="p-btn-secondary" onClick={closeEditModal}>
                Discard
              </button>
              <button className="p-btn-primary" onClick={saveEditUser}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Confirmation Modal */}
      {passwordModalOpen && (
        <div className="modal-overlay active" onClick={closePasswordModal}>
          <div className="modal-content modal-premium-compact animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium minimal">
              <h3>Verify Identity</h3>
              <button className="close-btn-premium" onClick={closePasswordModal} disabled={isVerifyingPassword}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body-premium">
              <div className="p-verify-icon">
                <i className="fas fa-lock"></i>
              </div>
              <p className="p-verify-text">For security, please confirm your admin password to apply these changes.</p>
              <div className="p-form-group">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter your password"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isVerifyingPassword) {
                      verifyPasswordAndSave()
                    }
                  }}
                  disabled={isVerifyingPassword}
                  autoFocus
                  className="p-password-input"
                />
              </div>
            </div>
            <div className="modal-footer-premium">
              <button className="p-btn-secondary" onClick={closePasswordModal} disabled={isVerifyingPassword}>
                Cancel
              </button>
              <button className="p-btn-primary" onClick={verifyPasswordAndSave} disabled={isVerifyingPassword}>
                {isVerifyingPassword ? 'Verifying...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay active" onClick={closeDeleteModal}>
          <div className="modal-content modal-premium-danger animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium danger">
              <div className="danger-icon-wrapper">
                <i className="fas fa-user-minus"></i>
              </div>
              <h3>Delete Account?</h3>
              <button className="close-btn-premium" onClick={closeDeleteModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body-premium">
              <p className="danger-text">You are about to permanently delete <strong>{selectedUser?.name}</strong>. This action cannot be reversed.</p>
              <div className="p-danger-summary">
                <div className="p-summary-item">
                  <span>Email:</span>
                  <strong>{selectedUser?.email}</strong>
                </div>
                <div className="p-summary-item">
                  <span>Total Bookings:</span>
                  <strong>{selectedUser?.totalBookings || 0}</strong>
                </div>
              </div>
              <div className="p-danger-alert">
                <i className="fas fa-exclamation-circle"></i>
                <span>All associated profile data will be removed from the system.</span>
              </div>
            </div>
            <div className="modal-footer-premium">
              <button className="p-btn-secondary" onClick={closeDeleteModal} disabled={isDeleting}>
                Keep Account
              </button>
              <button className="p-btn-danger" onClick={confirmDeleteUser} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
