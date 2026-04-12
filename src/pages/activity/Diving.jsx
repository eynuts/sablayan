import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import PageLoader from '../../components/PageLoader'
import divingVideo from '../../assets/images/diving.mp4'
import apoImg from '../../assets/images/diving/apo.webp'
import whaleImg from '../../assets/images/diving/whale.webp'
import rentalImg from '../../assets/images/diving/rental.webp'
import { preloadImages } from '../../utils/pageLoad'
import './Diving.css'

const Diving = () => {
  const [imagesReady, setImagesReady] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    let active = true

    preloadImages([apoImg, whaleImg, rentalImg]).finally(() => {
      if (active) {
        setImagesReady(true)
      }
    })

    return () => {
      active = false
    }
  }, [])

  const courses = [
    { name: 'INTRO TO DIVE COURSE', icon: 'fas fa-mask' },
    { name: 'SCUBA OPEN WATER COURSE', icon: 'fas fa-swimmer' },
    { name: 'RESCUE DIVING COURSE', icon: 'fas fa-life-ring' },
    { name: 'DIVE MASTER COURSE', icon: 'fas fa-anchor' },
    { name: 'ADVANCE SCUBA OPEN WATER COURSE', icon: 'fas fa-water' }
  ]

  const equipment = [
    'BCD', 'Regulator', 'Wet Suit', 'Mask & Snorkel', 'Fins', 'Boots', 'Weights with Belt', 'Tank with Air', 'Complete set (3 tanks)', 'Boat'
  ]

  return (
    <div className="diving-page">
      {(!imagesReady || !videoReady) && (
        <PageLoader text="Loading diving highlights..." />
      )}
      <Navbar />
      
      {/* Hero Section */}
      <section className="diving-hero">
        <video 
          className="diving-hero-video" 
          autoPlay 
          muted 
          loop 
          playsInline
          preload="auto"
          onLoadedData={() => setVideoReady(true)}
        >
          <source src={divingVideo} type="video/mp4" />
        </video>
        <div className="diving-hero-overlay"></div>
        <div className="diving-hero-content">
          <span className="section-tag">Apo Reef Marine Sanctuary</span>
          <h1>Dive into Paradise</h1>
          <p>Explore the majestic waters of the Philippines</p>
        </div>
      </section>

      {/* Intro Section - Apo Reef Diving */}
      <section className="diving-intro">
        <div className="section-container">
          <div className="intro-grid">
            <div className="intro-image-wrapper">
              <img src={apoImg} alt="Apo Reef Diving" className="intro-img" />
            </div>
            <div className="intro-text">
              <span className="section-tag">Explore Apo Reef</span>
              <h2>Apo Reef Diving</h2>
              <p className="highlight-p">The fishing ban within Apo Reef has been a challenge for local fishermen, but eco-tourism is helping to compensate. This shift supports a more ecologically responsible system for sustaining this world-renowned natural park.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Whale Shark Section */}
      <section className="whale-shark-section">
        <div className="whale-shark-overlay"></div>
        <div className="section-container">
          <div className="whale-shark-content">
            <div className="whale-shark-text">
              <span className="section-tag">Nature's Surprise</span>
              <h2>The Gentle Giant</h2>
              <p>The Whale Sharks, locally known as "Butanding," have made a surprising and welcome appearance in the clear waters of Sablayan. Previously more common in Bicol, these majestic creatures are now gracing our shores, offering a truly magical encounter for our visitors.</p>
              <div className="whale-shark-features">
                <div className="feature-item">
                  <i className="fas fa-water"></i>
                  <span>Crystal Clear Waters</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-shield-alt"></i>
                  <span>Protected Sanctuary</span>
                </div>
              </div>
            </div>
            <div className="whale-shark-visual">
              <img src={whaleImg} alt="Whale Shark" />
            </div>
          </div>
        </div>
      </section>

      {/* Diving Courses Section */}
      <section className="diving-courses">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-tag">Professional Training</span>
            <h2>Diving Courses</h2>
            <p>Sablayan Adventure Camp offers the following professional courses to enhance your skills.</p>
          </div>
          <div className="courses-grid">
            {courses.map((course, index) => (
              <div key={index} className="course-card">
                <div className="course-icon">
                  <i className={course.icon}></i>
                </div>
                <h4>{course.name}</h4>
                <div className="course-badge">PADI Certified</div>
              </div>
            ))}
          </div>
          <p className="rates-notice">* Rates are subject to change without prior notice</p>
        </div>
      </section>

      {/* Equipment Rental Section */}
      <section className="equipment-rental">
        <div className="section-container">
          <div className="rental-grid">
            <div className="rental-text">
              <span className="section-tag">Gear Up</span>
              <h2>Equipment Rental</h2>
              <p>We provide high-quality diving equipment available for rental per day to ensure your safety and comfort underwater.</p>
              <ul className="equipment-list">
                {equipment.map((item, index) => (
                  <li key={index}><i className="fas fa-check-circle"></i> {item}</li>
                ))}
              </ul>
            </div>
            <div className="rental-image">
              <img src={rentalImg} alt="Diving Equipment" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Diving
