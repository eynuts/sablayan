import { useEffect, useState } from 'react'
import { onValue, ref, set } from 'firebase/database'
import { db } from '../../firebase'
import './AdminZipline.css'

const AdminZipline = () => {
  const [loading, setLoading] = useState(true)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState('success')
  const [isSaving, setIsSaving] = useState(false)
  const [ziplineSettings, setZiplineSettings] = useState({
    localPrice: 0,
    touristPrice: 0,
    dailyLimit: 0,
    stats: {
      length: '1.7 KM',
      duration: '15-20 MIN',
      height: '300 FT',
      type: 'Island-to-Island'
    }
  })

  const showAlert = (message, type = 'success') => {
    setAlertMessage(message)
    setAlertType(type)
    setShowAlertModal(true)
  }

  useEffect(() => {
    const settingsRef = ref(db, 'zipline')
    const unsubscribe = onValue(
      settingsRef,
      (snapshot) => {
        try {
          const data = snapshot.val()
          if (data) {
            setZiplineSettings(prev => ({
              ...prev,
              localPrice: data.localPrice || 0,
              touristPrice: data.touristPrice || 0,
              dailyLimit: data.dailyLimit || 0,
              stats: data.stats || prev.stats
            }))
          } else {
            // No data in database yet, keep default values
            setZiplineSettings(prev => ({
              ...prev,
              localPrice: 0,
              touristPrice: 0,
              dailyLimit: 0
            }))
          }
        } catch (error) {
          console.error('Error loading zipline settings:', error)
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        console.error('Firebase error:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleSaveSettings = async (e) => {
    e.preventDefault()

    if (!ziplineSettings.localPrice || !ziplineSettings.touristPrice || !ziplineSettings.dailyLimit) {
      showAlert('Please fill in all fields with valid numbers.', 'error')
      return
    }

    if (ziplineSettings.localPrice <= 0 || ziplineSettings.touristPrice <= 0 || ziplineSettings.dailyLimit <= 0) {
      showAlert('All prices and limits must be greater than 0.', 'error')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        localPrice: Number(ziplineSettings.localPrice),
        touristPrice: Number(ziplineSettings.touristPrice),
        dailyLimit: Number(ziplineSettings.dailyLimit),
        stats: ziplineSettings.stats,
        updatedAt: new Date().toISOString()
      }

      await set(ref(db, 'zipline'), payload)
      showAlert('Zipline settings saved successfully!', 'success')
    } catch (error) {
      console.error(error)
      showAlert('Failed to save zipline settings. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return <div className="zipline-loading">Loading zipline settings...</div>
  }

  return (
    <div className="admin-zipline-container">
      <div className="zipline-card">
        <div className="zipline-header">
          <div className="header-content">
            <h2>
              <i className="fas fa-wind"></i> Zipline Management
            </h2>
            <p>Manage zipline pricing and daily reservation limits</p>
          </div>
        </div>

        <form className="zipline-form" onSubmit={handleSaveSettings}>
          {/* Pricing Section */}
          <div className="form-section">
            <h3 className="section-title">
              <i className="fas fa-tag"></i> Pricing
            </h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="localPrice">Sablayeño Price (Local Residents)</label>
              {ziplineSettings.localPrice > 0 ? (
                <small className="current-value">✓ Current saved: ₱{ziplineSettings.localPrice}</small>
              ) : (
                <small className="no-value">No price set yet</small>
              )}
              <div className="price-input-wrapper">
                <span className="peso-sign">₱</span>
                <input
                  id="localPrice"
                  type="number"
                  placeholder={ziplineSettings.localPrice > 0 ? ziplineSettings.localPrice.toString() : 'e.g., 300'}
                  value={ziplineSettings.localPrice || ''}
                  onChange={(e) =>
                    setZiplineSettings(prev => ({
                      ...prev,
                      localPrice: e.target.value ? Number(e.target.value) : 0
                    }))
                  }
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="touristPrice">Tourist Price</label>
              {ziplineSettings.touristPrice > 0 ? (
                <small className="current-value">✓ Current saved: ₱{ziplineSettings.touristPrice}</small>
              ) : (
                <small className="no-value">No price set yet</small>
              )}
              <div className="price-input-wrapper">
                <span className="peso-sign">₱</span>
                <input
                  id="touristPrice"
                  type="number"
                  placeholder={ziplineSettings.touristPrice > 0 ? ziplineSettings.touristPrice.toString() : 'e.g., 500'}
                  value={ziplineSettings.touristPrice || ''}
                  onChange={(e) =>
                    setZiplineSettings(prev => ({
                      ...prev,
                      touristPrice: e.target.value ? Number(e.target.value) : 0
                    }))
                  }
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Reservation Limit Section */}
          <div className="form-section">
            <h3 className="section-title">
              <i className="fas fa-calendar"></i> Daily Reservation Limit
            </h3>
          </div>

          <div className="form-group full">
            <label htmlFor="dailyLimit">Maximum Reservations Per Day</label>
            {ziplineSettings.dailyLimit > 0 && (
              <small className="current-value">Current: {ziplineSettings.dailyLimit} people/day</small>
            )}
            <input
              id="dailyLimit"
              type="number"
              placeholder={ziplineSettings.dailyLimit > 0 ? ziplineSettings.dailyLimit : 'e.g., 20'}
              value={ziplineSettings.dailyLimit || ''}
              onChange={(e) =>
                setZiplineSettings(prev => ({
                  ...prev,
                  dailyLimit: e.target.value ? Number(e.target.value) : 0
                }))
              }
              min="1"
              required
            />
            <small>Set the maximum number of people who can book the zipline per day</small>
          </div>

          {/* Activity Stats Section */}
          <div className="form-section">
            <h3 className="section-title">
              <i className="fas fa-info-circle"></i> Activity Information
            </h3>
          </div>

          <div className="stats-display">
            <div className="stat-row">
              <label>Length:</label>
              <span>{ziplineSettings.stats.length}</span>
            </div>
            <div className="stat-row">
              <label>Duration:</label>
              <span>{ziplineSettings.stats.duration}</span>
            </div>
            <div className="stat-row">
              <label>Height:</label>
              <span>{ziplineSettings.stats.height}</span>
            </div>
            <div className="stat-row">
              <label>Type:</label>
              <span>{ziplineSettings.stats.type}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="submit"
              className="save-btn"
              disabled={isSaving}
            >
              <i className="fas fa-save"></i> {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="alert-modal-overlay" onClick={() => setShowAlertModal(false)}>
          <div className={`alert-modal alert-modal-${alertType}`} onClick={(e) => e.stopPropagation()}>
            <div className="alert-modal-icon">
              <i className={`fas fa-${alertType === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
            </div>
            <div className="alert-modal-content">
              <h3>{alertType === 'success' ? 'Success!' : 'Error'}</h3>
              <p>{alertMessage}</p>
            </div>
            <button
              className="alert-modal-close"
              onClick={() => setShowAlertModal(false)}
              aria-label="Close alert"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminZipline
