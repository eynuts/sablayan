// Site and booking settings management page.
// Loads general settings from Firebase and allows admins to save updated values.
import { useEffect, useState } from 'react'
import { onValue, ref, set } from 'firebase/database'
import { BOOKING_TIMEZONE, CHECK_IN_TIME, CHECK_OUT_TIME } from '../../utils/bookingPolicy'
import { db } from '../../firebase'
import './AdminSettings.css'

const AdminSettings = () => {
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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

  const handleClearBookings = async () => {
    const confirm = window.confirm(
      'WARNING: This will delete ALL bookings/reservations. Rooms will NOT be deleted.\n\nAre you absolutely sure? This action cannot be undone.'
    )

    if (!confirm) return

    setIsSaving(true)
    try {
      const bookingsRef = ref(db, 'bookings')
      await set(bookingsRef, null)
      alert('All bookings have been cleared successfully!')
    } catch (error) {
      console.error('Failed to clear bookings:', error)
      alert('Failed to clear bookings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetSystem = async () => {
    const confirm = window.confirm(
      'WARNING: This will reset all settings to default values.\n\nAre you absolutely sure? This action cannot be undone.'
    )

    if (!confirm) return

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
    } catch (error) {
      console.error('Failed to reset system:', error)
      alert('Failed to reset settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return <div className="admin-settings-loading">Loading settings...</div>
  }

  return (
    <div className="admin-settings-container">
      <div className="admin-card">
        <div className="card-header">
          <h3>General Settings</h3>
          <button className="save-btn" onClick={handleSave} disabled={isSaving}>
            <i className="fas fa-save"></i> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="settings-sections">
          {/* Site Information */}
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

      {/* Danger Zone */}
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
    </div>
  )
}

export default AdminSettings
