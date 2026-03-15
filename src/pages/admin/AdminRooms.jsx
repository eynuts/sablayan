import { useState } from 'react'
import carmenImg from '../../assets/images/rooms/CARMEN.webp'
import carolinaImg from '../../assets/images/rooms/CAROLINA.webp'
import enriquetaImg from '../../assets/images/rooms/ENRIQUETA.webp'
import mariaImg from '../../assets/images/rooms/MARIA.webp'
import elviraImg from '../../assets/images/rooms/ELVIRA.webp'
import './AdminRooms.css'

const AdminRooms = () => {
  const [rooms] = useState([
    {
      id: 1,
      title: 'CAROLINA',
      subtitle: 'Fan Room',
      image: carolinaImg,
      price: 1500,
      capacity: '2 Guests',
      category: 'duplex',
      description: 'Carolina is a small duplex house with porch per room (fan room)',
      features: ['Fan Room', 'Small Duplex House', 'Private Porch', 'Free WiFi'],
      popular: false,
      status: 'available'
    },
    {
      id: 2,
      title: 'ENRIQUETA',
      subtitle: 'Deluxe Room',
      image: enriquetaImg,
      price: 4500,
      capacity: '2 Guests',
      category: 'house',
      description: 'Enriqueta House is a Deluxe aircon room.',
      features: ['Air Conditioning', 'Hot & Cold Shower', 'Free WiFi', 'TV'],
      popular: true,
      status: 'available'
    },
    {
      id: 3,
      title: 'MARIA',
      subtitle: 'Large Duplex',
      image: mariaImg,
      price: 5500,
      capacity: '4 Guests',
      category: 'duplex',
      description: 'Maria is a large duplex house with aircon and front porch',
      features: ['Air Conditioning', 'Front Porch', 'Hot & Cold Shower', 'TV'],
      popular: true,
      status: 'available'
    },
    {
      id: 4,
      title: 'ELVIRA',
      subtitle: 'Standard Room',
      image: elviraImg,
      price: 3500,
      capacity: '2 Guests',
      category: 'room',
      description: 'Elvira is a standard aircon room',
      features: ['Air Conditioning', 'Standard Room', 'Hot & Cold Shower', 'Free WiFi'],
      popular: false,
      status: 'maintenance'
    },
    {
      id: 5,
      title: 'CARMEN',
      subtitle: 'Dormitory',
      image: carmenImg,
      price: 8000,
      capacity: '8+ Guests',
      category: 'house',
      description: 'Carmen House is a Dormitory type with double deck beds and single beds.',
      features: ['Air Conditioning', 'Double Deck Beds', 'Common Bathroom', 'Large Group'],
      popular: false,
      status: 'available'
    }
  ])

  const [activeCategory, setActiveCategory] = useState('all')

  const categories = [
    { id: 'all', label: 'All Rooms' },
    { id: 'duplex', label: 'Duplex' },
    { id: 'house', label: 'Houses' },
    { id: 'room', label: 'Rooms' }
  ]

  const filteredRooms = activeCategory === 'all' 
    ? rooms 
    : rooms.filter(room => room.category === activeCategory)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(price)
  }

  const roomStats = {
    total: rooms.length,
    available: rooms.filter(r => r.status === 'available').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length
  }

  return (
    <div className="admin-rooms-container">
      {/* Rooms Stats Summary */}
      <div className="admin-stats-grid">
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
      </div>

      <div className="admin-card">
        <div className="card-header">
          <div className="header-left">
            <h3>Manage Accommodations</h3>
            <div className="filters-container">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <button className="add-btn">
            <i className="fas fa-plus"></i> Add New Room
          </button>
        </div>

        <div className="rooms-grid">
          {filteredRooms.map((room) => (
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
                    <button className="edit-btn" title="Edit Room">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="delete-btn" title="Delete Room">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminRooms