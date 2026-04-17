import { useState } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import PageLoader from '../../components/PageLoader'
import './Location.css'

const Location = () => {
  const [mapLoaded, setMapLoaded] = useState(false)

  return (
    <div className="location-page">
      {!mapLoaded && <PageLoader text="Loading map and directions..." />}
      <Navbar />
      
      {/* Hero Section */}
      <section className="location-hero">
        <div className="location-hero-overlay"></div>
        <div className="location-hero-content">
          <span className="section-tag">Find Us</span>
          <h1>Visit Sablayan Adventure Camp</h1>
          <p>Discover the hidden paradise of Occidental Mindoro</p>
        </div>
      </section>

      {/* Map Section */}
      <section className="map-section">
        <div className="section-container">
          <div className="map-container">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15560.81853082065!2d120.7468679!3d12.8300494!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bb84d72538861f%3A0x8e0b3c517e38e637!2sSablayan%20Adventure%20Camp%20Dive%20Shop!5e0!3m2!1sen!2sph!4v1773576977685!5m2!1sen!2sph" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Sablayan Adventure Camp Location"
              onLoad={() => setMapLoaded(true)}
            ></iframe>
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="location-contact-section">
        <div className="section-container">
          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3>Address</h3>
              <p>Sablayan Adventure Camp Dive Shop</p>
              <p>Sablayan, Occidental Mindoro</p>
              <p>Philippines</p>
            </div>
            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-phone-alt"></i>
              </div>
              <h3>Phone</h3>
              <p>+63 939 933 8315</p>
              <p>+63 995 340 7818</p>
            </div>
            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <h3>Email</h3>
              <p>info@sablayanadventurecamp.com</p>
            </div>
            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-clock"></i>
              </div>
              <h3>Hours</h3>
              <p>Open Daily</p>
              <p>7:00 AM - 8:00 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* Directions Section */}
      <section className="directions-section">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-tag">Getting Here</span>
            <h2>How to Get to Sablayan Adventure Camp</h2>
          </div>
          
          <div className="directions-grid">
            <div className="direction-card">
              <div className="direction-number">01</div>
              <h3>From Manila</h3>
              <p>Take a bus or van from Manila to Sablayan. The journey takes approximately 4-5 hours. Bus companies such as Ceres Tours and Jam Liner have regular trips to Sablayan.</p>
            </div>
            
            <div className="direction-card">
              <div className="direction-number">02</div>
              <h3>By Flight</h3>
              <p>Fly to Puerto Princesa City in Palawan, then take a ferry or fast craft to Mindoro. From the port, you can arrange a van or bus to Sablayan.</p>
            </div>
            
            <div className="direction-card">
              <div className="direction-number">03</div>
              <h3>Private Vehicle</h3>
              <p>Drive via San Jose to Sablayan. The road is well-maintained and scenic. Parking is available at our resort for guests.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Attractions */}
      <section className="nearby-section">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-tag">Explore More</span>
            <h2>Nearby Attractions</h2>
          </div>
          
          <div className="nearby-grid">
            <div className="nearby-card">
              <div className="nearby-icon">
                <i className="fas fa-water"></i>
              </div>
              <h3>Apo Reef</h3>
              <p>World-renowned diving and snorkeling destination, one of the largest coral reefs in the Philippines.</p>
            </div>
            
            <div className="nearby-card">
              <div className="nearby-icon">
                <i className="fas fa-mountain"></i>
              </div>
              <h3>Mt. Iglit-Bato National Park</h3>
              <p>Home to the endangered Tamaraw buffalo and beautiful mountain trails.</p>
            </div>
            
            <div className="nearby-card">
              <div className="nearby-icon">
                <i className="fas fa-tree"></i>
              </div>
              <h3>Panitian Mangrove</h3>
              <p>Explore the serene mangrove forests through kayaking or boat tours.</p>
            </div>
            
            <div className="nearby-card">
              <div className="nearby-icon">
                <i className="fas fa-umbrella-beach"></i>
              </div>
              <h3>White Sand Beaches</h3>
              <p>Discover pristine beaches and hidden coves along the coast of Sablayan.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="location-cta">
        <div className="section-container">
          <div className="cta-box">
            <h2>Ready to Visit?</h2>
            <p>Book your stay at Sablayan Adventure Camp and experience paradise</p>
            <div className="cta-buttons">
              <a href="/booking" className="cta-book-btn">
                Book Now <i className="fas fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Location
