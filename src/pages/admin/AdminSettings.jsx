// Site and booking settings management page.
// Loads general settings from Firebase and allows admins to save updated values.
import { useEffect, useState } from 'react'
import { onValue, ref, set } from 'firebase/database'
import { BOOKING_TIMEZONE, CHECK_IN_TIME, CHECK_OUT_TIME } from '../../utils/bookingPolicy'
import { db, changePassword } from '../../firebase'
import { useAdminAuth } from '../../AdminAuthContext'
import ChangePasswordModal from '../profile/ChangePasswordModal'
import './AdminSettings.css'

const AdminSettings = () => {
  const { user } = useAdminAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [settings, setSettings] = useState({
    siteName: 'Sablayan Adventure Camp',
    siteEmail: 'sablayanadventurecamp@gmail.com',
    phone: '+63 912 345 6789',
    address: 'Poblacion, Sablayan, Occidental Mindoro, Philippines',
    timezone: BOOKING_TIMEZONE,
    currency: 'PHP',
    checkInTime: CHECK_IN_TIME,
    checkOutTime: CHECK_OUT_TIME,
    seniorDiscountPercent: 0,
    childDiscountPercent: 0,
    pwdDiscountPercent: 0
  })

  useEffect(() => {
    const settingsRef = ref(db, 'settings/general')
    const unsubscribe = onValue(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings((prev) => ({
            ...prev,
            ...snapshot.val(),
            seniorDiscountPercent: Number(snapshot.val().seniorDiscountPercent || 0),
            childDiscountPercent: Number(snapshot.val().childDiscountPercent || 0),
            pwdDiscountPercent: Number(snapshot.val().pwdDiscountPercent || 0)
          }))
        }

        setLoading(false)
      },
      (error) => {
        console.error('Error loading admin settings:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSave = async () => {
    const seniorDiscountPercent = Number(settings.seniorDiscountPercent || 0)
    const childDiscountPercent = Number(settings.childDiscountPercent || 0)
    const pwdDiscountPercent = Number(settings.pwdDiscountPercent || 0)

    if (seniorDiscountPercent < 0 || seniorDiscountPercent > 100 || childDiscountPercent < 0 || childDiscountPercent > 100 || pwdDiscountPercent < 0 || pwdDiscountPercent > 100) {
      alert('Discount percentages must be between 0 and 100.')
      return
    }

    setIsSaving(true)

    try {
      await set(ref(db, 'settings/general'), {
        ...settings,
        seniorDiscountPercent,
        childDiscountPercent,
        pwdDiscountPercent,
        updatedAt: new Date().toISOString()
      })

      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearBookings = () => {
    setIsClearDataModalOpen(true)
  }

  const confirmClearBookings = async () => {
    setIsSaving(true)
    try {
      const bookingsRef = ref(db, 'bookings')
      await set(bookingsRef, null)
      alert('All bookings have been cleared successfully!')
      setIsClearDataModalOpen(false)
    } catch (error) {
      console.error('Failed to clear bookings:', error)
      alert('Failed to clear bookings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetSystem = () => {
    setIsResetModalOpen(true)
  }

  const confirmResetSystem = async () => {
    setIsSaving(true)
    try {
      const defaultSettings = {
        siteName: 'Sablayan Adventure Camp',
        siteEmail: 'sablayanadventurecamp@gmail.com',
        phone: '+63 912 345 6789',
        address: 'Poblacion, Sablayan, Occidental Mindoro, Philippines',
        timezone: BOOKING_TIMEZONE,
        currency: 'PHP',
        checkInTime: CHECK_IN_TIME,
        checkOutTime: CHECK_OUT_TIME,
        seniorDiscountPercent: 0,
        childDiscountPercent: 0,
        pwdDiscountPercent: 0
      }

      await set(ref(db, 'settings/general'), defaultSettings)
      setSettings(defaultSettings)
      alert('System settings have been reset to default values!')
      setIsResetModalOpen(false)
    } catch (error) {
      console.error('Failed to reset system:', error)
      alert('Failed to reset settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (currentPassword, newPassword) => {
    setIsChangingPassword(true)

    try {
      await changePassword(user?.uid, currentPassword, newPassword)
      setPasswordChangeMessage('Password changed successfully.')
      setIsPasswordModalOpen(false)
      setTimeout(() => setPasswordChangeMessage(''), 3000)
    } catch (error) {
      console.error('Failed to change password:', error)
      throw error
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (loading) {
    return <div className="admin-settings-loading">Loading settings...</div>
  }

  return (
    <div className="admin-settings-container">
      {/* Tabs Navigation */}
      <div className="settings-tabs">
        <button 
          className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <i className="fas fa-cog"></i> General Settings
        </button>
        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <i className="fas fa-user"></i> Profile Settings
        </button>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <>
      <div className="admin-card">
        <div className="card-header">
          <h3>General Settings</h3>
          {(user?.role === 'admin' || user?.role === 'moderator') && (
            <button className="save-btn" onClick={handleSave} disabled={isSaving}>
              <i className="fas fa-save"></i> {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        <div className="settings-sections">
          {/* Site Information - Admin Only */}
          {user?.role === 'admin' && (
            <div className="settings-section">
              <h4><i className="fas fa-globe"></i> Site Information</h4>
              <div className="settings-grid">
                <div className="form-group">
                  <label>Site Name</label>
                  <input 
                    type="text" 
                    name="siteName"
                    value={settings.siteName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Email</label>
                  <input 
                    type="email" 
                    name="siteEmail"
                    value={settings.siteEmail}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={settings.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea 
                    name="address"
                    value={settings.address}
                    onChange={handleChange}
                    rows={2}
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {/* Booking Settings */}
          <div className="settings-section">
            <h4><i className="fas fa-calendar-alt"></i> Booking Settings</h4>
            <div className="settings-grid">
              <div className="form-group">
                <label>Timezone</label>
                <select 
                  name="timezone"
                  value={settings.timezone}
                  onChange={handleChange}
                >
                  <option value="Asia/Manila">Asia/Manila (PHT)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select 
                  name="currency"
                  value={settings.currency}
                  onChange={handleChange}
                >
                  <option value="PHP">PHP (Philippine Peso)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Check-in Time</label>
                <input 
                  type="time" 
                  name="checkInTime"
                  value={settings.checkInTime}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Check-out Time</label>
                <input 
                  type="time" 
                  name="checkOutTime"
                  value={settings.checkOutTime}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Matanda Discount (%)</label>
                <input
                  type="number"
                  name="seniorDiscountPercent"
                  value={settings.seniorDiscountPercent}
                  onChange={handleChange}
                  min="0"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>Bata Discount (%)</label>
                <input
                  type="number"
                  name="childDiscountPercent"
                  value={settings.childDiscountPercent}
                  onChange={handleChange}
                  min="0"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>PWD Discount (%)</label>
                <input
                  type="number"
                  name="pwdDiscountPercent"
                  value={settings.pwdDiscountPercent}
                  onChange={handleChange}
                  min="0"
                  max="100"
                />
              </div>
              <div className="form-group full-width">
                <label>Discount Notes</label>
                <textarea
                  value={`Matanda: ${settings.seniorDiscountPercent}% off | Bata: ${settings.childDiscountPercent}% off | PWD: ${settings.pwdDiscountPercent}% off\nSet 0 if you do not want to apply a discount.`}
                  readOnly
                  rows={2}
                ></textarea>
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* Danger Zone - Admin Only */}
      {user?.role === 'admin' && (
      <div className="admin-card danger-zone">
        <div className="card-header">
          <h3><i className="fas fa-exclamation-triangle"></i> Danger Zone</h3>
        </div>
        <div className="danger-actions">
          <div className="danger-item">
            <div>
              <h5>Clear All Bookings</h5>
              <p>Remove all booking data from the system</p>
            </div>
            <button className="danger-btn" onClick={handleClearBookings} disabled={isSaving}>
              {isSaving ? 'Clearing...' : 'Clear Data'}
            </button>
          </div>
          <div className="danger-item">
            <div>
              <h5>Reset System</h5>
              <p>Reset all settings to default values</p>
            </div>
            <button className="danger-btn" onClick={handleResetSystem} disabled={isSaving}>
              {isSaving ? 'Resetting...' : 'Reset'}
            </button>
          </div>
        </div>
      </div>
      )}
        </>
      )}

      {/* Profile Settings Tab */}
      {activeTab === 'profile' && (
        <div className="admin-card">
          <div className="card-header">
            <h3>Profile Settings</h3>
          </div>
          
          <div className="profile-settings-content">
            <div className="settings-section">
              <h4><i className="fas fa-key"></i> Security</h4>
              <div className="settings-grid">
                <div className="settings-item">
                  <div className="settings-item-info">
                    <h5>Change Password</h5>
                    <p>Update your account password to keep your account secure</p>
                  </div>
                  <button 
                    className="settings-action-btn"
                    onClick={() => setIsPasswordModalOpen(true)}
                  >
                    <i className="fas fa-edit"></i> Change Password
                  </button>
                </div>
              </div>
            </div>

            {passwordChangeMessage && (
              <p className="settings-message success-message">
                <i className="fas fa-check-circle"></i> {passwordChangeMessage}
              </p>
            )}
          </div>
        </div>
      )}

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handleChangePassword}
        isLoading={isChangingPassword}
      />

      {/* Clear Data Confirmation Modal */}
      {isClearDataModalOpen && (
        <div className="modal-overlay active" onClick={() => !isSaving && setIsClearDataModalOpen(false)}>
          <div className="modal-content danger-modal animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <div className="modal-header-bg" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}></div>
              <div className="header-content">
                <div className="user-avatar-premium" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  <i className="fas fa-exclamation-circle"></i>
                </div>
                <div className="header-text">
                  <h3>Clear All Bookings</h3>
                  <span className="user-id-tag">Danger Zone</span>
                </div>
              </div>
              <button className="close-btn-premium" onClick={() => !isSaving && setIsClearDataModalOpen(false)} disabled={isSaving}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body-premium">
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <i className="fas fa-trash-alt" style={{ fontSize: '3rem', color: '#dc2626', marginBottom: '1rem', display: 'block' }}></i>
                <h4 style={{ marginBottom: '1rem', color: '#1f2937' }}>Delete All Bookings?</h4>
                <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>This will permanently delete ALL bookings and reservations from the system.</p>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Rooms will NOT be deleted. This action cannot be undone.</p>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                  <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: 0 }}>
                    <i className="fas fa-shield-alt" style={{ marginRight: '0.5rem' }}></i>
                    <strong>Warning:</strong> This operation is irreversible. Make sure you have a backup before proceeding.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsClearDataModalOpen(false)} disabled={isSaving}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmClearBookings} disabled={isSaving}>
                {isSaving ? 'Clearing...' : 'Clear All Bookings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset System Confirmation Modal */}
      {isResetModalOpen && (
        <div className="modal-overlay active" onClick={() => !isSaving && setIsResetModalOpen(false)}>
          <div className="modal-content danger-modal animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <div className="modal-header-bg" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}></div>
              <div className="header-content">
                <div className="user-avatar-premium" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  <i className="fas fa-redo"></i>
                </div>
                <div className="header-text">
                  <h3>Reset System</h3>
                  <span className="user-id-tag">Danger Zone</span>
                </div>
              </div>
              <button className="close-btn-premium" onClick={() => !isSaving && setIsResetModalOpen(false)} disabled={isSaving}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body-premium">
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <i className="fas fa-redo" style={{ fontSize: '3rem', color: '#dc2626', marginBottom: '1rem', display: 'block' }}></i>
                <h4 style={{ marginBottom: '1rem', color: '#1f2937' }}>Reset All Settings?</h4>
                <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>This will reset all system settings to their default values.</p>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Your bookings and rooms will remain unchanged. This action cannot be undone.</p>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                  <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: 0 }}>
                    <i className="fas fa-shield-alt" style={{ marginRight: '0.5rem' }}></i>
                    <strong>Warning:</strong> This will reset site information, booking settings, and discounts. This action is irreversible.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsResetModalOpen(false)} disabled={isSaving}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmResetSystem} disabled={isSaving}>
                {isSaving ? 'Resetting...' : 'Reset System'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSettings
