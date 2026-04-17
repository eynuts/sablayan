import { useState } from 'react'

const ChangePasswordModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    // Validation
    if (!currentPassword.trim()) {
      setError('Please enter your current password.')
      return
    }

    if (!newPassword.trim()) {
      setError('Please enter a new password.')
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password.')
      return
    }

    try {
      await onSubmit(currentPassword, newPassword)
      // Reset form on success
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message || 'Failed to change password.')
    }
  }

  const handleClose = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay active" onClick={handleClose}>
      <div className="modal-content profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-premium">
          <div className="modal-header-bg"></div>
          <div className="header-content">
            <div className="header-icon-wrapper">
              <i className="fas fa-key"></i>
            </div>
            <div className="header-text">
              <h3>Change Password</h3>
              <p className="header-subtitle">Secure your account with a new password</p>
            </div>
          </div>
          <button
            type="button"
            className="close-btn-premium"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-premium">
            <div className="p-form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <div className="password-input-wrapper">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label="Toggle password visibility"
                >
                  <i className={`fas fa-eye${showCurrentPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>

            <div className="p-form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-input-wrapper">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label="Toggle password visibility"
                >
                  <i className={`fas fa-eye${showNewPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>

            <div className="p-form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle password visibility"
                >
                  <i className={`fas fa-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>

            {error && (
              <div className="password-error-message">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="modal-footer-premium">
            <button
              type="button"
              className="p-btn-secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="p-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Updating...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle"></i> Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePasswordModal
