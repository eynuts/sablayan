import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import PageLoader from '../../components/PageLoader'
import heroImage from '../../assets/images/hero.webp'
import ziplineImage from '../../assets/images/zipline.webp'
import roomsImage from '../../assets/images/rooms.webp'
import divingImage from '../../assets/images/diving.webp'
import { preloadImages } from '../../utils/pageLoad'
import './Home.css'

const Home = () => {
  const [pageReady, setPageReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    preloadImages([
      heroImage,
      ziplineImage,
      roomsImage,
      divingImage,
      'https://i.pravatar.cc/150?u=sarah',
      'https://i.pravatar.cc/150?u=mark'
    ]).finally(() => {
      if (active) {
        setPageReady(true)
      }
    })

    return () => {
      active = false
    }
  }, [])

  const experiences = [
    {
      id: 3,
      title: 'Island-to-Island Zipline',
      tag: 'Adrenaline',
      icon: 'fas fa-bolt',
      sub1: '1.7 km Long Ride',
      sub2: 'Asia\'s Longest Over-water',
      sub3: 'Spectacular Views',
      image: ziplineImage,
      link: '/activity/zipline',
      theme: 'zipline'
    },
    {
      id: 1,
      title: 'Island Villas',
      tag: 'Stay',
      icon: 'fas fa-home',
      sub1: 'Mindoro Craftsmanship',
      sub2: 'Villas & Open Air Hall',
      image: roomsImage,
      link: '/accommodations',
      theme: 'resort'
    },
    {
      id: 2,
      title: 'Apo Reef Diving',
      tag: 'Discovery',
      icon: 'fas fa-water',
      sub1: 'Apo Reef Marine Sanctuary',
      sub2: 'Pandam Island Snorkeling',
      sub3: 'Resort-based Dive School',
      image: divingImage,
      link: '/activity/diving',
      theme: 'diving'
    }
  ]

  return (
    <div className="home-page">
      {!pageReady && <PageLoader text="Preparing your island welcome..." />}
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="hero-overlay"></div>
        
        <div className="hero-content">
          <h1 className="hero-title">Experience Asia's Longest<br />Island-to-Island Zipline</h1>
          <p className="hero-subtitle">Soar 1.7km across crystal clear waters at Sablayan Adventure Camp.</p>
          
          <div className="hero-cta-group">
            <button className="hero-primary-btn" onClick={() => navigate('/booking?type=zipline')}>Book Adventure</button>
            <button className="hero-secondary-btn" onClick={() => navigate('/activity')}>View Activities</button>
          </div>

          <div className="scroll-indicator">
            <span>Explore More</span>
            <div className="mouse">
              <div className="wheel"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-icon-circle">
              <i className="fas fa-bolt"></i>
            </div>
            <span className="stat-number">1.7km</span>
            <span className="stat-label">Longest Zipline</span>
          </div>
          <div className="stat-item">
            <div className="stat-icon-circle">
              <i className="fas fa-water"></i>
            </div>
            <span className="stat-number">50+</span>
            <span className="stat-label">Dive Spots</span>
          </div>
          <div className="stat-item">
            <div className="stat-icon-circle">
              <i className="fas fa-star"></i>
            </div>
            <span className="stat-number">4.9/5</span>
            <span className="stat-label">Guest Rating</span>
          </div>
          <div className="stat-item">
            <div className="stat-icon-circle">
              <i className="fas fa-shield-alt"></i>
            </div>
            <span className="stat-number">24/7</span>
            <span className="stat-label">Island Security</span>
          </div>
        </div>
      </section>

      {/* Explore Experiences Section */}
      <section className="explore-experiences">
        <div className="section-header-decorative">
          <span className="decorative-arrow left"></span>
          <span className="line"></span>
          <h2>Explore Experiences</h2>
          <span className="line"></span>
          <span className="decorative-arrow right"></span>
        </div>
        
        <div className="experiences-grid">
          {experiences.map(exp => (
            <div key={exp.id} className={`experience-card ${exp.theme}`}>
              <div className="card-image-wrapper">
                <img src={exp.image} alt={exp.title} className="card-bg-img" />
                <div className="card-overlay-gradient"></div>
                <div className="card-tag-badge">{exp.tag}</div>
                <div className="card-floating-icon">
                  <i className={exp.icon}></i>
                </div>
              </div>
              <div className="card-content-overlay">
                <div className="card-content-top">
                  <h3>{exp.title}</h3>
                  <div className="card-subs-reveal">
                    <p><i className="fas fa-check"></i> {exp.sub1}</p>
                    <p><i className="fas fa-check"></i> {exp.sub2}</p>
                    {exp.sub3 && <p><i className="fas fa-check"></i> {exp.sub3}</p>}
                  </div>
                </div>
                <div className="card-content-bottom">
                  <button className="interactive-explore-btn">
                    <span>Explore & Book</span>
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="amenities-section">
        <div className="section-container">
          <div className="amenities-header">
            <span className="section-tag">Premium Comfort</span>
            <h2>Why Choose Adventure Camp?</h2>
            <p>We blend raw island adrenaline with refined coastal hospitality.</p>
          </div>
          <div className="amenities-grid">
            <div className="amenity-item">
              <div className="amenity-icon">
                <i className="fas fa-wind"></i>
              </div>
              <h4>Pure Adrenaline</h4>
              <p>Home to the world-famous 1.7km zipline connecting two islands.</p>
            </div>
            <div className="amenity-item">
              <div className="amenity-icon">
                <i className="fas fa-fish"></i>
              </div>
              <h4>Marine Sanctuary</h4>
              <p>Direct access to the pristine Apo Reef Marine Natural Park.</p>
            </div>
            <div className="amenity-item">
              <div className="amenity-icon">
                <i className="fas fa-utensils"></i>
              </div>
              <h4>Local Dining</h4>
              <p>Freshly caught seafood and authentic Sablayan craftsmanship.</p>
            </div>
            <div className="amenity-item">
              <div className="amenity-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h4>Safe Haven</h4>
              <p>Peace of mind with 24/7 security and professional guides.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Guest Stories / Testimonials */}
      <section className="testimonials-section">
        <div className="testimonials-overlay"></div>
        <div className="section-container">
          <div className="testimonials-header">
            <h2>Guest Stories</h2>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card glass-card">
              <div className="quote-icon"><i className="fas fa-quote-left"></i></div>
              <p>"The zipline was absolutely breathtaking! Flying over the ocean between the islands is a memory I'll never forget. The staff were professional and made us feel safe throughout."</p>
              <div className="testimonial-author">
                <div className="author-img">
                  <img src="https://i.pravatar.cc/150?u=sarah" alt="Sarah J." />
                </div>
                <div className="author-info">
                  <strong>Sarah Jenkins</strong>
                  <span>Adventure Seeker</span>
                </div>
              </div>
            </div>
            <div className="testimonial-card glass-card">
              <div className="quote-icon"><i className="fas fa-quote-left"></i></div>
              <p>"A hidden gem in Mindoro. The diving at Apo Reef was world-class, and coming back to the island villa for a sunset dinner was the perfect way to end each day."</p>
              <div className="testimonial-author">
                <div className="author-img">
                  <img src="https://i.pravatar.cc/150?u=mark" alt="Mark T." />
                </div>
                <div className="author-info">
                  <strong>Mark Thompson</strong>
                  <span>Scuba Enthusiast</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta">
        <div className="cta-content">
          <h2>Ready to start your adventure?</h2>
          <p>Book your stay now and experience the thrill of a lifetime.</p>
          <div className="cta-buttons">
            <button className="cta-btn primary" onClick={() => navigate('/booking?type=room')}>Book Your Stay</button>
            <button className="cta-btn secondary" onClick={() => navigate('/activity')}>View Activities</button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Home
