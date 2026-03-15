import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useAuth } from '../../AuthContext'
import './Booking.css'

const Booking = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const roomParam = searchParams.get('room')
  
  // Map room IDs from URL to room index
  const roomIdToIndex = {
    'maria': 0,
    'carmen': 1,
    'carolina': 2,
    'enriqueta': 3
  }
  
  const initialRoomIndex = roomParam && roomIdToIndex[roomParam] !== undefined 
    ? roomIdToIndex[roomParam] 
    : null
  
  const [currentRoomIndex, setCurrentRoomIndex] = useState(initialRoomIndex)
  const [showRoomSelector, setShowRoomSelector] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    phone: '',
    date: '',
    guests: 1,
    room: roomParam || '',
    message: ''
  })

  const rooms = [
    {
      id: 'maria',
      name: 'Maria Room',
      description: 'Cozy garden-view room perfect for couples seeking a romantic getaway',
      price: '₱3,500',
      priceUnit: '/night',
      capacity: '2 Guests',
      image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=800&auto=format&fit=crop',
      amenities: ['King Bed', 'Garden View', 'Private Bathroom', 'Air Conditioning', 'TV']
    },
    {
      id: 'carmen',
      name: 'Carmen Room',
      description: 'Spacious room with balcony and refreshing sea breeze',
      price: '₱4,500',
      priceUnit: '/night',
      capacity: '4 Guests',
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800&auto=format&fit=crop',
      amenities: ['Queen Bed', 'Balcony', 'Sea View', 'Private Bathroom', 'Air Conditioning', 'TV']
    },
    {
      id: 'carolina',
      name: 'Carolina Room',
      description: 'Luxury suite with panoramic ocean views and premium amenities',
      price: '₱6,500',
      priceUnit: '/night',
      capacity: '4 Guests',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop',
      amenities: ['King Bed', 'Ocean View', 'Private Balcony', 'Mini Bar', 'Air Conditioning', 'Smart TV']
    },
    {
      id: 'enriqueta',
      name: 'Enriqueta Villa',
      description: 'Ultimate luxury private villa with infinity pool and butler service',
      price: '₱12,000',
      priceUnit: '/night',
      capacity: '6 Guests',
      image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=800&auto=format&fit=crop',
      amenities: ['2 King Beds', 'Private Pool', 'Ocean View', 'Full Kitchen', 'Living Area', 'Butler Service']
    }
  ]

  const currentRoom = currentRoomIndex !== null ? rooms[currentRoomIndex] : null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRoomSelect = () => {
    setShowRoomSelector(true)
  }

  const handleRoomChoice = (index) => {
    setCurrentRoomIndex(index)
    setFormData(prev => ({
      ...prev,
      room: rooms[index].id
    }))
    setShowRoomSelector(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (currentRoomIndex === null) {
      alert('Please select a room first!')
      return
    }
    
    // Navigate to payment page with booking data
    const bookingData = {
      name: formData.name,
      phone: formData.phone,
      date: formData.date,
      guests: formData.guests,
      room: currentRoom,
      roomId: currentRoom.id
    }
    
    navigate('/payment', { state: { bookingData } })
  }

  return (
    <div className="booking-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="booking-hero">
        <div className="booking-hero-overlay"></div>
        <div className="booking-hero-content">
          <span className="section-tag">Sablayan Adventure Camp</span>
          <h1>Book Your Stay</h1>
          <p>Reserve your perfect accommodation in paradise</p>
        </div>
      </section>

      {/* Main Booking Section */}
      <section className="booking-main-section">
        <div className="section-container">
          <div className="booking-layout">
            {/* Left Side - Form */}
            <div className="booking-form-card">
              <div className="booking-form-header">
                <h3>Complete Your Booking</h3>
                <p>Fill in your details to reserve your room</p>
              </div>

              <form className="booking-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone" 
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+63 9XX XXX XXXX"
                      required 
                    />
                  </div>
                </div>

                <div className="form-row single">
                  <div className="form-group">
                    <label htmlFor="date">Check-in Date</label>
                    <input 
                      type="date" 
                      id="date" 
                      name="date" 
                      value={formData.date}
                      onChange={handleChange}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="guests">Number of Guests</label>
                    <select 
                      id="guests" 
                      name="guests" 
                      value={formData.guests}
                      onChange={handleChange}
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Special Requests</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Any special requests..."
                    rows="3"
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn">
                  <i className="fas fa-credit-card"></i>
                  Pay
                </button>
              </form>
            </div>

            {/* Right Side - Room Display */}
            <div className="room-display-card">
              <div className="room-display-header">
                <span className="section-tag">Your Selected Room</span>
                <h3>{currentRoomIndex !== null ? currentRoom.name : 'No Room Selected'}</h3>
              </div>

              <div className={`room-display-image ${currentRoomIndex === null ? 'empty' : ''}`}>
                {currentRoomIndex !== null ? (
                  <img src={currentRoom.image} alt={currentRoom.name} />
                ) : (
                  <div className="empty-room-placeholder">
                    <i className="fas fa-bed"></i>
                    <span>Select a room to continue</span>
                  </div>
                )}
              </div>

              {currentRoomIndex !== null && (
                <div className="room-display-details">
                  <div className="room-display-price">
                    <span className="price-amount">{currentRoom.price}</span>
                    <span className="price-unit">{currentRoom.priceUnit}</span>
                  </div>

                  <p className="room-display-description">{currentRoom.description}</p>

                  <div className="room-display-capacity">
                    <i className="fas fa-user-friends"></i>
                    <span>{currentRoom.capacity}</span>
                  </div>
                </div>
              )}

              <button 
                type="button" 
                className={`choose-room-btn ${currentRoomIndex !== null ? 'has-room' : ''}`}
                onClick={handleRoomSelect}
              >
                <i className="fas fa-bed"></i>
                Choose Room
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Room Selector Modal */}
      {showRoomSelector && (
        <div className="room-selector-overlay" onClick={() => setShowRoomSelector(false)}>
          <div className="room-selector-modal" onClick={(e) => e.stopPropagation()}>
            <div className="room-selector-header">
              <h3>Select Your Room</h3>
              <button className="close-btn" onClick={() => setShowRoomSelector(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="room-selector-grid">
              {rooms.map((room, index) => (
                <div 
                  key={room.id}
                  className={`room-selector-card ${currentRoomIndex === index ? 'current' : ''}`}
                  onClick={() => handleRoomChoice(index)}
                >
                  <img src={room.image} alt={room.name} />
                  <div className="room-selector-card-content">
                    <h4>{room.name}</h4>
                    <p>{room.description}</p>
                    <div className="room-selector-info">
                      <span className="price">{room.price}{room.priceUnit}</span>
                      <span className="capacity"><i className="fas fa-user"></i> {room.capacity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contact Info Section */}
      <section className="contact-section">
        <div className="section-container">
          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-phone-alt"></i>
              </div>
              <h3>Call Us</h3>
              <p>+63 939 933 8315</p>
              <p>+63 995 340 7818</p>
            </div>
            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <h3>Email Us</h3>
              <p>info@sablayanadventurecamp.com</p>
            </div>
            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3>Visit Us</h3>
              <p>Sablayan, Occidental Mindoro</p>
              <p>Philippines</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="section-container">
          <div className="faq-header">
            <span className="section-tag">Questions?</span>
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>What is the best time to visit?</h4>
              <p>The best time to visit Sablayan is during the dry season from November to May, with March to May being the warmest months.</p>
            </div>
            <div className="faq-item">
              <h4>How do I get there?</h4>
              <p>You can fly to Manila, then take a bus or van to Sablayan. The journey takes approximately 4-5 hours.</p>
            </div>
            <div className="faq-item">
              <h4>What should I bring?</h4>
              <p>Bring sunscreen, swimwear, comfortable clothes, and a camera. We provide diving and zipline equipment.</p>
            </div>
            <div className="faq-item">
              <h4>Is there parking available?</h4>
              <p>Yes, we have free parking available for guests at our resort.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Booking
