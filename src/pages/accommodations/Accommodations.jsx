import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import carmenImg from '../../assets/images/rooms/CARMEN.webp'
import carolinaImg from '../../assets/images/rooms/CAROLINA.webp'
import enriquetaImg from '../../assets/images/rooms/ENRIQUETA.webp'
import mariaImg from '../../assets/images/rooms/MARIA.webp'
import elviraImg from '../../assets/images/rooms/ELVIRA.webp'
import './Accommodations.css'

const Accommodations = () => {
  const [selectedRoom, setSelectedRoom] = useState(null)

  const rooms = [
    {
      id: 'carolina',
      name: 'CAROLINA',
      image: carolinaImg,
      description: 'Carolina is a small duplex house with porch per room (fan room)',
      amenities: ['Fan Room', 'Small Duplex House', 'Private Porch', 'Free WiFi'],
      capacity: '2 Guests',
      size: '20 sqm',
      price: '₱1,500 / night'
    },
    {
      id: 'enriqueta',
      name: 'ENRIQUETA',
      image: enriquetaImg,
      description: 'Enriqueta House is a Deluxe aircon room.',
      amenities: ['Air Conditioning', 'Deluxe Room', 'Hot & Cold Shower', 'Free WiFi', 'TV'],
      capacity: '2 Guests',
      size: '30 sqm',
      price: '₱4,500 / night'
    },
    {
      id: 'maria',
      name: 'MARIA',
      image: mariaImg,
      description: 'Maria is a large duplex house with aircon and front porch',
      amenities: ['Air Conditioning', 'Large Duplex House', 'Front Porch', 'Hot & Cold Shower', 'Free WiFi', 'TV'],
      capacity: '4 Guests',
      size: '45 sqm',
      price: '₱5,500 / night'
    },
    {
      id: 'elvira',
      name: 'ELVIRA',
      image: elviraImg,
      description: 'Elvira is a standard aircon room',
      amenities: ['Air Conditioning', 'Standard Room', 'Hot & Cold Shower', 'Free WiFi', 'TV'],
      capacity: '2 Guests',
      size: '25 sqm',
      price: '₱3,500 / night'
    },
    {
      id: 'carmen',
      name: 'CARMEN',
      image: carmenImg,
      description: 'Carmen House is a Dormitory type with double deck beds and single beds good for 8 or more people (with aircon and a common bathroom)',
      amenities: ['Air Conditioning', 'Dormitory Type', 'Double Deck Beds', 'Single Beds', 'Common Bathroom', 'Free WiFi'],
      capacity: '8+ Guests',
      size: '60 sqm',
      price: '₱8,000 / night'
    }
  ]

  return (
    <div className="accommodations-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="rooms-hero">
        <div className="rooms-hero-overlay"></div>
        <div className="rooms-hero-content">
          <span className="section-tag">Sablayan Adventure Camp</span>
          <h1>Island Accommodations</h1>
          <p>Rest in paradise with our thoughtfully designed rooms and villas</p>
        </div>
      </section>

      {/* Rooms Grid Section */}
      <section className="rooms-section">
        <div className="section-container">
          <div className="rooms-grid">
            {rooms.map(room => (
              <div key={room.id} className="room-card" onClick={() => setSelectedRoom(room)}>
                <div className="room-image-wrapper">
                  <img src={room.image} alt={room.name} />
                  <div className="room-overlay">
                    <span className="view-details-btn">View Details</span>
                  </div>
                </div>
                <div className="room-info">
                  <h3>{room.name}</h3>
                  <p className="room-description">{room.description}</p>
                  <div className="room-meta">
                    <span><i className="fas fa-user"></i> {room.capacity}</span>
                    <span><i className="fas fa-ruler-combined"></i> {room.size}</span>
                  </div>
                  <div className="room-price">{room.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Room Details Modal */}
      {selectedRoom && (
        <div className="room-modal-overlay" onClick={() => setSelectedRoom(null)}>
          <div className="room-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedRoom(null)}>
              <i className="fas fa-times"></i>
            </button>
            <div className="modal-content">
              <div className="modal-image">
                <img src={selectedRoom.image} alt={selectedRoom.name} />
              </div>
              <div className="modal-details">
                <span className="modal-tag">Room Details</span>
                <h2>{selectedRoom.name}</h2>
                <p className="modal-description">{selectedRoom.description}</p>
                
                <div className="modal-meta">
                  <div className="meta-item">
                    <i className="fas fa-user"></i>
                    <span>Capacity: {selectedRoom.capacity}</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-ruler-combined"></i>
                    <span>Size: {selectedRoom.size}</span>
                  </div>
                </div>

                <div className="modal-amenities">
                  <h4>Amenities</h4>
                  <div className="amenities-list">
                    {selectedRoom.amenities.map((amenity, index) => (
                      <span key={index} className="amenity-tag">
                        <i className="fas fa-check"></i> {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="modal-footer">
                  <div className="modal-price">
                    <span className="price-label">Starting from</span>
                    <span className="price-value">{selectedRoom.price}</span>
                  </div>
                  <Link to={`/booking?room=${selectedRoom.id}`} className="book-room-btn">Book Now</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Amenities Section */}
      <section className="resort-amenities">
        <div className="section-container">
          <div className="amenities-header">
            <span className="section-tag">Resort Amenities</span>
            <h2>Everything You Need</h2>
          </div>
          <div className="amenities-grid">
            <div className="amenity-item">
              <i className="fas fa-utensils"></i>
              <h4>Restaurant</h4>
              <p>Fresh seafood and local Filipino cuisine</p>
            </div>
            <div className="amenity-item">
              <i className="fas fa-swimming-pool"></i>
              <h4>Pool</h4>
              <p>Infinity pool overlooking the ocean</p>
            </div>
            <div className="amenity-item">
              <i className="fas fa-wifi"></i>
              <h4>Free WiFi</h4>
              <p>High-speed internet throughout the resort</p>
            </div>
            <div className="amenity-item">
              <i className="fas fa-parking"></i>
              <h4>Parking</h4>
              <p>Free secure parking for guests</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; {new Date().getFullYear()} Sablayan Adventure Camp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Accommodations
