import { useState } from 'react'
import './AdminSettings.css'

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Sablayan Adventure Camp',
    siteEmail: 'sablayanadventurecamp@gmail.com',
    phone: '+63 912 345 6789',
    address: 'Poblacion, Sablayan, Occidental Mindoro, Philippines',
    timezone: 'Asia/Manila',
    currency: 'PHP',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    maintenanceMode: false,
    emailNotifications: true,
    smsNotifications: true
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSave = () => {
    alert('Settings saved successfully!')
  }

  return (
    <div className="admin-settings-container">
      <div className="admin-card">
        <div className="card-header">
          <h3>General Settings</h3>
          <button className="save-btn" onClick={handleSave}>
            <i className="fas fa-save"></i> Save Changes
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
            </div>
          </div>

          {/* System Settings */}
          <div className="settings-section">
            <h4><i className="fas fa-cog"></i> System Settings</h4>
            <div className="settings-grid">
              <div className="form-group">
                <label className="toggle-label">
                  <span>Maintenance Mode</span>
                  <span className="toggle-desc">Put the site in maintenance mode</span>
                </label>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    name="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={handleChange}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="form-group">
                <label className="toggle-label">
                  <span>Email Notifications</span>
                  <span className="toggle-desc">Receive email notifications for bookings</span>
                </label>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    name="emailNotifications"
                    checked={settings.emailNotifications}
                    onChange={handleChange}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="form-group">
                <label className="toggle-label">
                  <span>SMS Notifications</span>
                  <span className="toggle-desc">Receive SMS notifications for bookings</span>
                </label>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    name="smsNotifications"
                    checked={settings.smsNotifications}
                    onChange={handleChange}
                  />
                  <span className="slider"></span>
                </label>
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
            <button className="danger-btn">Clear Data</button>
          </div>
          <div className="danger-item">
            <div>
              <h5>Reset System</h5>
              <p>Reset all settings to default values</p>
            </div>
            <button className="danger-btn">Reset</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings