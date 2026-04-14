import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { onValue, ref } from 'firebase/database'
import { db } from '../../firebase'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import PageLoader from '../../components/PageLoader'

// Assets
import ziplineHeroImg from '../../assets/images/ziplinehero.webp'
import ziplineImg1 from '../../assets/images/zipline/unnamed (8).webp'
import ziplineImg2 from '../../assets/images/zipline/unnamed (9).webp'
import ziplineImg3 from '../../assets/images/zipline/unnamed (10).webp'
import ziplineMain from '../../assets/images/zipline.webp'
import { preloadImages } from '../../utils/pageLoad'

// Styles
import './Zipline.css'

const Zipline = () => {
  const [pageReady, setPageReady] = useState(false)
  const [ziplineSettings, setZiplineSettings] = useState({
    localPrice: 300,
    touristPrice: 500,
    dailyLimit: 20
  })

  // Ensure the page starts at the top when this component mounts.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Subscribe to zipline settings from Firebase so the page shows current prices.
  useEffect(() => {
    const settingsRef = ref(db, 'zipline')
    const unsubscribe = onValue(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          setZiplineSettings({
            localPrice: data.localPrice || 300,
            touristPrice: data.touristPrice || 500,
            dailyLimit: data.dailyLimit || 20
          })
        }
      },
      (error) => {
        console.error('Error loading zipline settings:', error)
      }
    )

    return () => unsubscribe()
  }, [])

  // Preload hero and gallery images before showing the page content.
  useEffect(() => {
    let active = true

    preloadImages([
      ziplineHeroImg,
      ziplineImg1,
      ziplineImg2,
      ziplineImg3,
      ziplineMain
    ]).finally(() => {
      if (active) {
        setPageReady(true)
      }
    })

    return () => {
      active = false
    }
  }, [])

  const stats = [
    { label: 'Length', value: '1.7 KM', icon: 'fas fa-ruler-horizontal' },
    { label: 'Duration', value: '15-20 MIN', icon: 'fas fa-clock' },
    { label: 'Height', value: '300 FT', icon: 'fas fa-arrows-alt-v' },
    { label: 'Type', value: 'Island-to-Island', icon: 'fas fa-map-marked-alt' }
  ]

  const pricing = [
    {
      title: 'Sablayeño',
      price: ziplineSettings.localPrice.toString(),
      desc: 'Special rate for local residents of Sablayan.',
      features: ['Full Zipline Flight', 'Safety Equipment', 'Professional Guide', 'Valid ID Required'],
      type: 'local'
    },
    {
      title: 'Tourist',
      price: ziplineSettings.touristPrice.toString(),
      desc: 'Standard rate for all visitors and tourists.',
      features: ['Full Zipline Flight', 'Safety Equipment', 'Professional Guide', 'Insurance Included'],
      type: 'tourist',
      popular: true
    }
  ]

  const highlights = [
    {
      title: 'Asia\'s Longest Over-water Zipline',
      text: 'Experience the thrill of flying across 1.7km of turquoise waters connecting two islands.',
      icon: 'fas fa-award'
    },
    {
      title: 'Panoramic 360° Views',
      text: 'Breathtaking views of the Mindoro coastline and surrounding marine sanctuaries.',
      icon: 'fas fa-eye'
    },
    {
      title: 'Safety First Technology',
      text: 'Equipped with modern braking systems and certified gear for a secure adventure.',
      icon: 'fas fa-shield-alt'
    }
  ]

  return (
    <div className="zipline-v3">
      {!pageReady && <PageLoader text="Loading zipline views..." />}
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="zv3-hero">
        <div className="zv3-hero-image">
          <img src={ziplineHeroImg} alt="Zipline Hero" />
          <div className="zv3-hero-overlay"></div>
        </div>
        <div className="section-container">
          <div className="zv3-hero-content">
            <span className="zv3-badge">Adventure Awaits</span>
            <h1>
              Island-to-Island <br />
              <span>Zipline</span>
            </h1>
            <p>Soar above the turquoise waters of Sablayan on one of the longest over-water ziplines in Asia.</p>
            <div className="zv3-hero-btns">
              <Link to="/booking" className="zv3-btn-primary">
                Book Now
              </Link>
              <a href="#rates" className="zv3-btn-secondary">
                View Rates
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS BAR */}
      <section className="zv3-stats">
        <div className="section-container">
          <div className="zv3-stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="zv3-stat-card">
                <i className={stat.icon}></i>
                <div className="zv3-stat-info">
                  <span className="zv3-stat-value">{stat.value}</span>
                  <span className="zv3-stat-label">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. EXPERIENCE SECTION */}
      <section className="zv3-experience">
        <div className="section-container">
          <div className="zv3-exp-grid">
            <div className="zv3-exp-text">
              <span className="zv3-tag">The Experience</span>
              <h2>A Journey Between <br />Two Worlds</h2>
              <p className="zv3-lead">Disconnected from the ground, connected to the horizon.</p>
              <p>
                Our 1.7km island-to-island zipline offers more than just an adrenaline rush.
                It's a unique perspective of the Sablayan coastline, where you'll glide
                effortlessly over pristine coral reefs and deep blue waters.
              </p>
              <div className="zv3-exp-features">
                <div className="zv3-feature">
                  <i className="fas fa-check-circle"></i>
                  <span>Certified Safety Gear</span>
                </div>
                <div className="zv3-feature">
                  <i className="fas fa-check-circle"></i>
                  <span>Expert Adventure Guides</span>
                </div>
                <div className="zv3-feature">
                  <i className="fas fa-check-circle"></i>
                  <span>Eco-Friendly Operation</span>
                </div>
              </div>
            </div>
            <div className="zv3-exp-images">
              <div className="zv3-img-main">
                <img src={ziplineImg1} alt="Zipline Action" />
                <div className="zv3-img-badge">
                  <span className="val">1.7</span>
                  <span className="lbl">Kilometers</span>
                </div>
              </div>
              <div className="zv3-img-sub">
                <img src={ziplineImg2} alt="Zipline View" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. RATES SECTION */}
      <section className="zv3-rates" id="rates">
        <div className="section-container">
          <div className="zv3-section-header">
            <span className="zv3-tag">Pricing</span>
            <h2>Fair Rates for <br />Every Adventurer</h2>
          </div>
          <div className="zv3-rates-grid">
            {pricing.map((item, i) => (
              <div key={i} className={`zv3-rate-card ${item.type} ${item.popular ? 'popular' : ''}`}>
                {item.popular && <div className="zv3-popular-tag">Most Popular</div>}
                <div className="zv3-rate-header">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
                <div className="zv3-rate-price">
                  <span className="curr">₱</span>
                  <span className="amt">{item.price}</span>
                </div>
                <ul className="zv3-rate-features">
                  {item.features.map((feature) => (
                    <li key={feature}>
                      <i className="fas fa-check-circle"></i>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a href="/booking" className="zv3-rate-btn">
                  Book Now
                </a>
              </div>
            ))}
          </div>
          <div className="zv3-rates-notice">
            All pricing is based on current rates and is subject to change.
          </div>
        </div>
      </section>

      {/* 5. HIGHLIGHTS SECTION */}
      <section className="zv3-highlights">
        <div className="section-container">
          <div className="zv3-highlights-grid">
            {highlights.map((item) => (
              <div key={item.title} className="zv3-h-card">
                <div className="zv3-h-icon">
                  <i className={item.icon}></i>
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. GALLERY SECTION */}
      <section className="zv3-gallery">
        <div className="section-container">
          <div className="zv3-gallery-grid">
            <div className="zv3-gallery-item">
              <img src={ziplineImg1} alt="Zipline gallery image" />
            </div>
            <div className="zv3-gallery-item">
              <img src={ziplineImg2} alt="Zipline gallery image" />
            </div>
            <div className="zv3-gallery-item">
              <img src={ziplineImg3} alt="Zipline gallery image" />
            </div>
          </div>
        </div>
      </section>

      {/* 7. CTA SECTION */}
      <section className="zv3-cta">
        <div className="zv3-cta-bg">
          <img src={ziplineMain} alt="Zipline background" />
        </div>
        <div className="zv3-cta-overlay"></div>
        <div className="zv3-cta-content">
          <h2>Ready for an unforgettable ride?</h2>
          <p>Book your zipline adventure now and experience Sablayan from a breathtaking new angle.</p>
          <Link to="/booking" className="zv3-btn-primary large">
            Reserve Your Slot
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Zipline
