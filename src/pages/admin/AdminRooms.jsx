import { useEffect, useMemo, useState } from 'react'
import { onValue, ref, remove, set } from 'firebase/database'
import { db } from '../../firebase'
import { uploadToCloudinaryUnsigned } from '../../utils/cloudinary'
import PageLoader from '../../components/PageLoader'
import './AdminRooms.css'

const AdminRooms = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [newRoom, setNewRoom] = useState({
    title: '',
    subtitle: '',
    capacity: 2,
    quantity: 1,
    size: '',
    category: 'room',
    description: '',
    features: [],
    price: '',
    status: 'available',
    popular: false
  })
  const [featureInput, setFeatureInput] = useState('')
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState('success')

  useEffect(() => {
    const roomsRef = ref(db, 'rooms')
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      try {
        const data = snapshot.val()
        if (!data) {
          setRooms([])
          setLoading(false)
          return
        }

        const mapped = Object.entries(data).map(([id, room]) => ({
          id,
          ...room,
          features: Array.isArray(room.features) ? room.features : []
        }))
        mapped.sort((a, b) => a.title.localeCompare(b.title))
        setRooms(mapped)
      } catch (error) {
        console.error('Error loading admin rooms:', error)
        setRooms([])
      } finally {
        setLoading(false)
      }
    }, (error) => {
      console.error('Firebase error loading admin rooms:', error)
      setRooms([])
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(price)
  }

  const showAlert = (message, type = 'success') => {
    setAlertMessage(message)
    setAlertType(type)
    setShowAlertModal(true)
  }

  const roomStats = {
    total: rooms.length,
    available: rooms.filter(r => r.status === 'available').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length
  }

  const resetForm = () => {
    setNewRoom({
      title: '',
      subtitle: '',
      capacity: 2,
      quantity: 1,
      size: '',
      category: 'room',
      description: '',
      features: [],
      price: '',
      status: 'available',
      popular: false
    })
    setFeatureInput('')
    setImageFile(null)
    setImagePreview(null)
    setIsEditMode(false)
    setEditingRoomId(null)
  }

  const createSlug = (title) => title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    const fileInput = document.querySelector('.admin-room-form input[type="file"]')
    if (fileInput) fileInput.value = ''
  }

  const addFeature = () => {
    const trimmedFeature = featureInput.trim()
    if (trimmedFeature && !newRoom.features.includes(trimmedFeature)) {
      setNewRoom(prev => ({
        ...prev,
        features: [...prev.features, trimmedFeature]
      }))
      setFeatureInput('')
    }
  }

  const removeFeature = (index) => {
    setNewRoom(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const handleFeatureKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addFeature()
    }
  }

  const openEditModal = (room) => {
    const guestCount = parseInt(room.capacity) || 2
    const roomSize = room.size ? room.size.match(/[\d.]+/)?.[0] || '' : ''
    setNewRoom({
      title: room.title,
      subtitle: room.subtitle || '',
      capacity: guestCount,
      quantity: room.quantity || 1,
      size: roomSize,
      category: room.category,
      description: room.description,
      features: Array.isArray(room.features) ? room.features : [],
      price: room.price || '',
      status: room.status || 'available',
      popular: room.popular || false
    })
    setImagePreview(room.image)
    setImageFile(null)
    setFeatureInput('')
    setIsEditMode(true)
    setEditingRoomId(room.id)
    setShowAddModal(true)
  }

  const handleAddRoom = async (e) => {
    e.preventDefault()
    if (!newRoom.title || !newRoom.description || !newRoom.price) {
      showAlert('Please fill in title, description, and price.', 'error')
      return
    }
    if (!isEditMode && !imageFile) {
      showAlert('Please upload an image for the new room.', 'error')
      return
    }

    setIsSaving(true)
    try {
      let imageUrl = imagePreview

      // Upload new image only if a new file is selected (in either add or edit mode)
      if (imageFile) {
        const uploadResult = await uploadToCloudinaryUnsigned(imageFile)
        imageUrl = uploadResult.secure_url
      }

      const slug = isEditMode ? editingRoomId : createSlug(newRoom.title)
      if (!slug) {
        showAlert('Please use a valid room title.', 'error')
        return
      }

      const payload = {
        title: newRoom.title.trim().toUpperCase(),
        subtitle: newRoom.subtitle.trim() || 'Room',
        image: imageUrl,
        price: Number(newRoom.price),
        capacity: `${newRoom.capacity} Guest${newRoom.capacity !== 1 ? 's' : ''}`,
        quantity: Number(newRoom.quantity),
        size: newRoom.size ? `${Number(newRoom.size)} m²` : '',
        category: newRoom.category,
        description: newRoom.description.trim(),
        features: Array.isArray(newRoom.features) ? newRoom.features : [],
        popular: Boolean(newRoom.popular),
        status: newRoom.status,
        ...(isEditMode ? { updatedAt: new Date().toISOString() } : { createdAt: new Date().toISOString() })
      }

      await set(ref(db, `rooms/${slug}`), payload)
      setShowAddModal(false)
      resetForm()
      showAlert(isEditMode ? 'Room updated successfully!' : 'Room added successfully!', 'success')
    } catch (error) {
      console.error(error)
      showAlert(`Failed to ${isEditMode ? 'update' : 'add'} room. Please try again.`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRoom = async (roomId, title) => {
    const confirmed = window.confirm(`Delete room "${title}"?`)
    if (!confirmed) return

    try {
      await remove(ref(db, `rooms/${roomId}`))
      showAlert('Room deleted successfully!', 'success')
    } catch (error) {
      console.error(error)
      showAlert('Failed to delete room.', 'error')
    }
  }

  return (
    <div className="admin-rooms-container">
      {loading && (
        <PageLoader
          title="Accommodations"
          text="Loading room inventory and availability..."
          fullScreen={false}
        />
      )}

      {/* Rooms Stats Summary */}
      {!loading && <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            <i className="fas fa-bed"></i>
          </div>
          <div className="stat-info">
            <h3>{roomStats.total}</h3>
            <p>Total Accommodations</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#166534' }}>
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <h3>{roomStats.available}</h3>
            <p>Available for Booking</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#991b1b' }}>
            <i className="fas fa-tools"></i>
          </div>
          <div className="stat-info">
            <h3>{roomStats.maintenance}</h3>
            <p>Under Maintenance</p>
          </div>
        </div>
      </div>}

      {!loading && <div className="admin-card">
        <div className="card-header">
          <div className="header-left">
            <h3>Manage Accommodations</h3>
          </div>
          <button className="add-btn" onClick={() => setShowAddModal(true)}>
            <i className="fas fa-plus"></i> Add New Room
          </button>
        </div>

        <div className="rooms-grid">
          {rooms.map((room) => (
            <div key={room.id} className="room-admin-card">
              <div className="room-image-wrapper">
                <img src={room.image} alt={room.title} />
                <div className="room-badges">
                  {room.popular && <span className="badge popular">Popular</span>}
                  <span className="badge type">{room.subtitle}</span>
                  <span className={`badge status ${room.status}`}>{room.status}</span>
                </div>
              </div>
              <div className="room-info">
                <h4>{room.title}</h4>
                <p className="capacity">{room.capacity}</p>
                <p className="description">{room.description}</p>
                <div className="room-features">
                  {room.features.slice(0, 3).map((feature, i) => (
                    <span key={i} className="feature-tag">{feature}</span>
                  ))}
                </div>
                <div className="room-footer">
                  <div className="price">
                    <span className="amount">{formatPrice(room.price)}</span>
                    <span className="unit">/night</span>
                  </div>
                  <div className="actions">
                    <button
                      className="edit-btn"
                      title="Edit Room"
                      onClick={() => openEditModal(room)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="delete-btn"
                      title="Delete Room"
                      onClick={() => handleDeleteRoom(room.id, room.title)}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {rooms.length === 0 && (
            <div className="admin-rooms-empty">No rooms found.</div>
          )}
        </div>
      </div>}

      {showAddModal && (
        <div className="admin-room-modal-overlay" onClick={() => {
          if (!isSaving) {
            setShowAddModal(false)
            resetForm()
          }
        }}>
          <div className="admin-room-modal" onClick={(e) => e.stopPropagation()}>
            <h4>
              <i className="fas fa-plus-circle" style={{ color: 'var(--admin-primary)' }}></i>
              {isEditMode ? 'Edit Room' : 'Add New Room'}
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => {
                  if (!isSaving) {
                    setShowAddModal(false)
                    resetForm()
                  }
                }}
                style={{ 
                  marginLeft: 'auto', 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '1.25rem', 
                  color: '#94a3b8', 
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s ease'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </h4>
            <div className="admin-room-modal-content">
              <form id="add-room-form" onSubmit={handleAddRoom} className="admin-room-form">
                
                {/* Image Section */}
                <div className="form-section">
                  <h5 className="form-section-title">
                    <i className="fas fa-image"></i> Room Image
                  </h5>
                </div>

                {imagePreview ? (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <div className="image-preview-overlay">
                        <button type="button" onClick={removeImage}>
                          <i className="fas fa-trash-alt"></i> Remove Image
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="room-image-file" className="file-input-label">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>Click to upload or drag and drop</span>
                    <small>PNG, JPG, GIF up to 10MB</small>
                  </label>
                )}

                <input
                  id="room-image-file"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input"
                  required={!isEditMode}
                />

                {/* Basic Information */}
                <div className="form-section">
                  <h5 className="form-section-title">
                    <i className="fas fa-info-circle"></i> Basic Information
                  </h5>
                </div>

                <div className="form-group required">
                  <label htmlFor="title">Room Title</label>
                  <input
                    id="title"
                    type="text"
                    placeholder="e.g., CAROLINA"
                    value={newRoom.title}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subtitle">Subtitle</label>
                  <input
                    id="subtitle"
                    type="text"
                    placeholder="e.g., Fan Room"
                    value={newRoom.subtitle}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, subtitle: e.target.value }))}
                  />
                </div>

                <div className="form-group required">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    value={newRoom.category}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="room">Room</option>
                    <option value="duplex">Duplex</option>
                    <option value="house">House</option>
                  </select>
                </div>

                <div className="form-group required">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={newRoom.status}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="form-group full required">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    placeholder="Describe the room in detail..."
                    value={newRoom.description}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>

                {/* Room Specifications */}
                <div className="form-section">
                  <h5 className="form-section-title">
                    <i className="fas fa-ruler-combined"></i> Room Specifications
                  </h5>
                </div>

                <div className="form-group required">
                  <label htmlFor="price">Price Per Night</label>
                  <div className="price-input-wrapper">
                    <span className="peso-sign">₱</span>
                    <input
                      id="price"
                      type="number"
                      placeholder="e.g., 2500"
                      value={newRoom.price}
                      onChange={(e) => setNewRoom(prev => ({ ...prev, price: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="size">Room Size (m²)</label>
                  <input
                    id="size"
                    type="number"
                    placeholder="e.g., 25"
                    value={newRoom.size}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, size: e.target.value }))}
                    step="0.5"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="capacity">Number of Guests</label>
                  <div className="number-stepper">
                    <button
                      type="button"
                      className="stepper-btn decrease"
                      onClick={() => setNewRoom(prev => ({ ...prev, capacity: Math.max(1, prev.capacity - 1) }))}
                      disabled={newRoom.capacity <= 1}
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <input
                      id="capacity"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={newRoom.capacity}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(20, parseInt(e.target.value.replace(/\D/g, '')) || 1))
                        setNewRoom(prev => ({ ...prev, capacity: val }))
                      }}
                      className="stepper-input"
                    />
                    <button
                      type="button"
                      className="stepper-btn increase"
                      onClick={() => setNewRoom(prev => ({ ...prev, capacity: Math.min(20, prev.capacity + 1) }))}
                      disabled={newRoom.capacity >= 20}
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="quantity">Quantity (Number of Rooms)</label>
                  <div className="number-stepper">
                    <button
                      type="button"
                      className="stepper-btn decrease"
                      onClick={() => setNewRoom(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                      disabled={newRoom.quantity <= 1}
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <input
                      id="quantity"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={newRoom.quantity}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(100, parseInt(e.target.value.replace(/\D/g, '')) || 1))
                        setNewRoom(prev => ({ ...prev, quantity: val }))
                      }}
                      className="stepper-input"
                    />
                    <button
                      type="button"
                      className="stepper-btn increase"
                      onClick={() => setNewRoom(prev => ({ ...prev, quantity: Math.min(100, prev.quantity + 1) }))}
                      disabled={newRoom.quantity >= 100}
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>

                <div className="form-group full">
                  <label htmlFor="features">Features</label>
                  <div className="features-input-group">
                    <div className="features-input-wrapper">
                      <input
                        id="features"
                        type="text"
                        placeholder="Type a feature and press Enter (e.g., Air Conditioning)"
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        onKeyPress={handleFeatureKeyPress}
                      />
                      <button
                        type="button"
                        className="add-feature-btn"
                        onClick={addFeature}
                        title="Add feature"
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                    {newRoom.features.length > 0 && (
                      <div className="features-tags">
                        {newRoom.features.map((feature, index) => (
                          <span key={index} className="feature-tag-item">
                            {feature}
                            <button
                              type="button"
                              className="remove-feature-btn"
                              onClick={() => removeFeature(index)}
                              title="Remove feature"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Options */}
                <label className="admin-room-checkbox">
                  <input
                    type="checkbox"
                    checked={newRoom.popular}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, popular: e.target.checked }))}
                  />
                  <span>
                    <i className="fas fa-star" style={{ color: 'var(--admin-primary)' }}></i>
                    Mark as Popular
                  </span>
                </label>
              </form>
            </div>

            {/* Form Actions Footer (Outside form but part of modal) */}
            <div className="admin-room-form-actions">
              <button 
                type="button" 
                onClick={() => {
                  if (!isSaving) {
                    setShowAddModal(false)
                    resetForm()
                  }
                }} 
                disabled={isSaving}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
              <button 
                type="submit" 
                form="add-room-form" 
                className="primary" 
                disabled={isSaving}
              >
                <i className="fas fa-save"></i> {isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Room' : 'Save Room')}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default AdminRooms
