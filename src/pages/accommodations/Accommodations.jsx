import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, ref } from 'firebase/database'
import { db } from '../../firebase'
import Navbar from '../../components/Navbar'
import PageLoader from '../../components/PageLoader'
import './Accommodations.css'

// Timeout used to fail gracefully if room data takes too long to load
const ROOM_LOAD_TIMEOUT_MS = 12000

const Accommodations = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(null)

  // Fetch room data from Firebase and map it into view-friendly room objects
  useEffect(() => {
    let active = true
    const loadRooms = async () => {
      try {
        const roomsRef = ref(db, 'rooms')
        const snapshot = await Promise.race([
          get(roomsRef),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timed out while loading rooms.')), ROOM_LOAD_TIMEOUT_MS)
          })
        ])

        if (!active) {
          return
        }

        const data = snapshot.val()
        if (!data) {
          setRooms([])
          return
        }

        const mappedRooms = Object.entries(data).map(([id, room]) => ({
          id,
          name: room.title,
          image: room.image,
          description: room.description,
          amenities: Array.isArray(room.features) ? room.features : [],
          capacity: room.capacity || 'N/A',
          size: room.size || '',
          price: `PHP ${Number(room.price || 0).toLocaleString('en-PH')} / night`,
          popular: room.popular || false,
          status: room.status || 'available'
        }))

        mappedRooms.sort((a, b) => a.name.localeCompare(b.name))
        setRooms(mappedRooms)
        setLoadError('')
      } catch (error) {
        console.error('Error loading rooms:', error)
        setRooms([])
        const message = String(error?.message || '').toLowerCase()

        if (message.includes('permission_denied')) {
          setLoadError('Cannot load rooms because database read access is denied.')
        } else if (message.includes('timed out')) {
          setLoadError('Rooms are taking too long to load. Please refresh the page.')
        } else {
          setLoadError('Unable to load rooms right now. Please try again shortly.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadRooms()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="accommodations-page">
      {/* Show a loading overlay while room data is being fetched */}
      {loading && (
        <PageLoader text="Preparing your island getaway..." />
      )}
      <Navbar />

      {/* Hero banner for the accommodations page */}
      <section className="rooms-hero">
        <div className="rooms-hero-overlay"></div>
        <div className="rooms-hero-content">
          <span className="section-tag">Sablayan Adventure Camp</span>
          <h1>Island Accommodations</h1>
          <p>Rest in paradise with our thoughtfully designed rooms and villas</p>
        </div>
      </section>

      {/* Main rooms listing section */}
      <section className="rooms-section">
        <div className="section-container">
          {!loading && (
            <div className="rooms-grid">
              {rooms.map((room) => (
                <div key={room.id} className="room-card" onClick={() => setSelectedRoom(room)}>
                  <div className="room-image-wrapper">
                    <img src={room.image} alt={room.name} />
                    {(room.popular || room.status === 'maintenance') && (
                      <div className="room-badges">
                        {room.popular && <span className="badge popular">Popular</span>}
                        {room.status === 'maintenance' && <span className="badge maintenance">Maintenance</span>}
                      </div>
                    )}
                    <div className="room-overlay">
                      <span className="view-details-btn">View Details</span>
                    </div>
                  </div>
                  <div className="room-info">
                    <h3>{room.name}</h3>
                    <p className="room-description">{room.description}</p>
                    <div className="room-meta">
                      <span><i className="fas fa-user"></i> {room.capacity}</span>
                      {room.size && <span><i className="fas fa-ruler-combined"></i> {room.size}</span>}
                    </div>
                    <div className="room-price">{room.price}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && loadError && (
            <p className="rooms-empty-message">{loadError}</p>
          )}
          {!loading && !loadError && rooms.length === 0 && (
            <p className="rooms-empty-message">No rooms are available right now.</p>
          )}
        </div>
      </section>

      {/* Modal detail view for the selected room */}
      {/* Modal detail view for the selected room */}
      {selectedRoom && (
        <div className="room-modal-overlay" onClick={() => setSelectedRoom(null)}>
          <div className="room-modal" onClick={(e) => e.stopPropagation()}>
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
                  {selectedRoom.size && (
                    <div className="meta-item">
                      <i className="fas fa-ruler-combined"></i>
                      <span>Size: {selectedRoom.size}</span>
                    </div>
                  )}
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

                {selectedRoom.status === 'maintenance' && (
                  <div className="maintenance-alert">
                    <i className="fas fa-exclamation-circle"></i>
                    <div className="maintenance-alert-content">
                      <h4>Under Maintenance</h4>
                      <p>This room is currently unavailable. Please check back soon or contact us for alternative options.</p>
                    </div>
                  </div>
                )}

                <div className="modal-footer">
                  <div className="modal-price">
                    <span className="price-label">Starting from</span>
                    <span className="price-value">{selectedRoom.price}</span>
                  </div>
                  {selectedRoom.status === 'maintenance' ? (
                    <button className="book-room-btn disabled" disabled>
                      <i className="fas fa-tools"></i> Under Maintenance
                    </button>
                  ) : (
                    <Link to={`/booking?room=${selectedRoom.id}`} className="book-room-btn">Book Now</Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Simple page footer with copyright */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; {new Date().getFullYear()} Sablayan Adventure Camp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Accommodations
