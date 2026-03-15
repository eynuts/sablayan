import { useState } from 'react'
import { Routes, Route, Link, useLocation, Outlet } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import divingImg from '../../assets/images/diving.webp'
import activityVideo from '../../assets/images/activity.mp4'
import ziplineImg from '../../assets/images/zipline.webp'
import Diving from './Diving'
import Zipline from './Zipline'
import './Activity.css'

const Activity = () => {
  const location = useLocation()
  
  // Check if it's a sub-route
  if (location.pathname !== '/activity') {
    return <Outlet />
  }

  const activities = [
    {
      id: 'zipline',
      title: 'Island-to-Island Zipline',
      subtitle: 'Asia\'s Longest Over-water Zipline',
      shortDesc: 'Fly 1.7km over crystal clear waters connecting two islands. Experience breathtaking ocean views and an adrenaline rush like no other.',
      image: ziplineImg,
      link: '/activity/zipline',
      theme: 'zipline',
      duration: '15-20 mins',
      age: '8+ years'
    },
    {
      id: 'diving',
      title: 'Apo Reef Diving',
      subtitle: 'World-Class Marine Sanctuary',
      shortDesc: 'Explore the pristine Apo Reef, one of the best dive sites in the Philippines. Discover vibrant coral reefs and diverse marine life.',
      image: divingImg,
      link: '/activity/diving',
      theme: 'diving',
      duration: '3-4 hours',
      age: '10+ years'
    }
  ]

  return (
    <div className="activity-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="activity-hero">
        <video 
          className="activity-hero-video" 
          autoPlay 
          muted 
          loop 
          playsInline
        >
          <source src={activityVideo} type="video/mp4" />
        </video>
        <div className="activity-hero-overlay"></div>
        <div className="activity-hero-content">
          <span className="section-tag">Sablayan Adventure Camp</span>
          <h1>Adventures Await</h1>
          <p>Discover thrilling experiences in paradise</p>
        </div>
      </section>

      {/* Activities Section - Brief Version */}
      <section className="activities-section">
        <div className="section-container">
          <div className="activities-brief-grid">
            {activities.map((activity) => (
              <Link key={activity.id} to={activity.link} className={`activity-brief-card ${activity.theme}`}>
                <div className="brief-card-image">
                  <img src={activity.image} alt={activity.title} />
                  <div className="brief-card-overlay"></div>
                  <div className="brief-card-content">
                    <span className="brief-subtitle">{activity.subtitle}</span>
                    <h2>{activity.title}</h2>
                    <p className="brief-description">{activity.shortDesc}</p>
                    <div className="brief-meta">
                      <span><i className="fas fa-clock"></i> {activity.duration}</span>
                      <span><i className="fas fa-user"></i> {activity.age}</span>
                    </div>
                    <span className="brief-cta">Learn More <i className="fas fa-arrow-right"></i></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="experience-section">
        <div className="section-container">
          <div className="experience-content">
            <span className="section-tag">Why Choose Us</span>
            <h2>Unforgettable Experiences</h2>
            <p>At Sablayan Adventure Camp, we combine raw island adrenaline with refined coastal hospitality. Whether you're seeking thrill or tranquility, we have something for everyone.</p>
            <div className="experience-stats">
              <div className="stat-box">
                <span className="stat-number">1.7km</span>
                <span className="stat-label">Zipline Length</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">100+</span>
                <span className="stat-label">Dive Sites</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">15+</span>
                <span className="stat-label">Years Experience</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">10k+</span>
                <span className="stat-label">Happy Guests</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="activity-cta">
        <div className="section-container">
          <div className="cta-box">
            <h2>Ready for Adventure?</h2>
            <p>Book your activity now and experience the thrill of Sablayan Adventure Camp</p>
            <Link to="/booking" className="cta-book-btn">
              Book Now <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

const ActivityPage = () => {
  return (
    <Routes>
      <Route index element={<Activity />} />
      <Route path="diving" element={<Diving />} />
      <Route path="zipline" element={<Zipline />} />
    </Routes>
  )
}

export default ActivityPage
