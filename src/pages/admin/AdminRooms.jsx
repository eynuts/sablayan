// Rooms management page for admins.
// Includes inventory display, add/edit modal, image upload, and room details management.
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

  // Show temporary alert modal messages for create/edit/delete feedback.
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
        <div className="modal-overlay active" onClick={() => {
          if (!isSaving) {
            setShowAddModal(false)
            resetForm()
          }
        }}>
          <div className="modal-content admin-room-modal animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium minimal">
              <div className="header-content">
                <div className="user-avatar-premium">
                  <i className={isEditMode ? "fas fa-edit" : "fas fa-plus"}></i>
                </div>
                <div className="header-text">
                  <h3>{isEditMode ? 'Edit Accommodation' : 'New Accommodation'}</h3>
                  <span className="user-id-tag">{isEditMode ? `Editing: ${newRoom.title}` : 'Creating a new property'}</span>
                </div>
              </div>
              <button 
                className="close-btn-premium" 
                onClick={() => {
                  if (!isSaving) {
                    setShowAddModal(false)
                    resetForm()
                  }
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body-premium">
              <form id="add-room-form" onSubmit={handleAddRoom} className="premium-form-grid">
                
                {/* Image Section */}
                <div className="p-form-section">
                  <div className="p-section-header">
                    <i className="fas fa-image"></i>
                    <span>Property Visuals</span>
                  </div>
                  
                  {imagePreview ? (
                    <div className="p-image-preview-wrapper">
                      <img src={imagePreview} alt="Preview" />
                      <div className="p-image-overlay">
                        <button type="button" onClick={removeImage} className="p-remove-img">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="room-image-file" className="p-file-upload-zone">
                      <i className="fas fa-cloud-upload-alt"></i>
                      <div className="p-upload-text">
                        <span>Upload Property Image</span>
                        <small>Drag and drop or click to browse</small>
                      </div>
                    </label>
                  )}
                  <input
                    id="room-image-file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="p-hidden-file"
                    required={!isEditMode}
                  />
                </div>

                {/* Info Sections */}
                <div className="p-form-sections-grid">
                  <div className="p-form-column">
                    <div className="p-section-header">
                      <i className="fas fa-info-circle"></i>
                      <span>Details</span>
                    </div>
                    
                    <div className="p-form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        placeholder="e.g. CAROLINA"
                        value={newRoom.title}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="p-form-group">
                      <label>Subtitle / Type</label>
                      <input
                        type="text"
                        placeholder="e.g. Fan Room"
                        value={newRoom.subtitle}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, subtitle: e.target.value }))}
                      />
                    </div>

                    <div className="p-form-row">
                      <div className="p-form-group">
                        <label>Category</label>
                        <div className="p-select-wrapper">
                          <select
                            value={newRoom.category}
                            onChange={(e) => setNewRoom(prev => ({ ...prev, category: e.target.value }))}
                          >
                            <option value="room">Room</option>
                            <option value="duplex">Duplex</option>
                            <option value="house">House</option>
                          </select>
                          <i className="fas fa-chevron-down"></i>
                        </div>
                      </div>
                      <div className="p-form-group">
                        <label>Status</label>
                        <div className="p-select-wrapper">
                          <select
                            value={newRoom.status}
                            onChange={(e) => setNewRoom(prev => ({ ...prev, status: e.target.value }))}
                          >
                            <option value="available">Available</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                          <i className="fas fa-chevron-down"></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-form-column">
                    <div className="p-section-header">
                      <i className="fas fa-tags"></i>
                      <span>Pricing & Specs</span>
                    </div>

                    <div className="p-form-group">
                      <label>Price Per Night</label>
                      <div className="p-input-with-prefix">
                        <span className="p-prefix">₱</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={newRoom.price}
                          onChange={(e) => setNewRoom(prev => ({ ...prev, price: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="p-form-row">
                      <div className="p-form-group">
                        <label>Size (m²)</label>
                        <input
                          type="number"
                          placeholder="e.g. 25"
                          value={newRoom.size}
                          onChange={(e) => setNewRoom(prev => ({ ...prev, size: e.target.value }))}
                        />
                      </div>
                      <div className="p-form-group">
                        <label>Capacity</label>
                        <input
                          type="number"
                          value={newRoom.capacity}
                          onChange={(e) => setNewRoom(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                    </div>

                    <div className="p-form-group">
                      <label>Total Inventory</label>
                      <input
                        type="number"
                        value={newRoom.quantity}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-form-group full">
                  <label>Description</label>
                  <textarea
                    placeholder="Describe the property..."
                    value={newRoom.description}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>

                <div className="p-form-group full">
                  <label>Amenities & Features</label>
                  <div className="p-tag-input-wrapper">
                    <input
                      type="text"
                      placeholder="Type and press Enter to add..."
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyPress={handleFeatureKeyPress}
                    />
                    <button type="button" onClick={addFeature} className="p-add-tag-btn">
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                  <div className="p-tags-container">
                    {newRoom.features.map((feature, index) => (
                      <span key={index} className="p-tag">
                        {feature}
                        <i className="fas fa-times" onClick={() => removeFeature(index)}></i>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-form-group">
                  <label className="p-checkbox-label">
                    <input
                      type="checkbox"
                      checked={newRoom.popular}
                      onChange={(e) => setNewRoom(prev => ({ ...prev, popular: e.target.checked }))}
                    />
                    <span className="p-checkmark"></span>
                    <span>Feature as Popular</span>
                  </label>
                </div>
              </form>
            </div>
            
            <div className="modal-footer-premium">
              <button 
                type="button" 
                className="p-btn-secondary" 
                onClick={() => {
                  if (!isSaving) {
                    setShowAddModal(false)
                    resetForm()
                  }
                }} 
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="add-room-form" 
                className="p-btn-primary" 
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    {isEditMode ? 'Save Changes' : 'Create Room'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="modal-overlay active" onClick={() => setShowAlertModal(false)}>
          <div className={`modal-content modal-premium-compact animate-in alert-${alertType}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body-premium">
              <div className={`p-verify-icon alert-icon-${alertType}`}>
                <i className={`fas fa-${alertType === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
              </div>
              <h3 className="alert-title">{alertType === 'success' ? 'Operation Successful' : 'Error Occurred'}</h3>
              <p className="p-verify-text">{alertMessage}</p>
              <button 
                className="p-btn-primary full-width"
                onClick={() => setShowAlertModal(false)}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRooms
