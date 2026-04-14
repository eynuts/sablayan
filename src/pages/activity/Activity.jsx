import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Link, useLocation, Outlet } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import PageLoader from '../../components/PageLoader'
import divingImg from '../../assets/images/diving.webp'
import activityVideo from '../../assets/images/activity.mp4'
import ziplineImg from '../../assets/images/zipline.webp'
import Diving from './Diving'
import Zipline from './Zipline'
import { preloadImages } from '../../utils/pageLoad'
import ActivityHubHero from './components/ActivityHubHero'
import ActivityCard from './components/ActivityCard'
import ActivityStickyNav from './components/ActivityStickyNav'
import { createRevealVariants, createStaggerContainer } from './activityMotion'
import './Activity.css'

const Activity = () => {
  const location = useLocation()
  const reducedMotion = useReducedMotion()

  // Loading state for the page hero images and background video.
  const [imagesReady, setImagesReady] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  // Track the active section on the page for the sticky navigation.
  const [activeSection, setActiveSection] = useState('zipline')
  const [showStickyNav, setShowStickyNav] = useState(false)

  // Preload the hero activity images before showing the page content.
  useEffect(() => {
    let active = true

    preloadImages([divingImg, ziplineImg]).finally(() => {
      if (active) {
        setImagesReady(true)
      }
    })

    return () => {
      active = false
    }
  }, [])

  // Data for the activity cards shown in the hub page.
  const activities = useMemo(
    () => [
      {
        id: 'zipline',
        title: 'Island-to-Island Zipline',
        subtitle: 'Asia\'s Longest Over-water Zipline',
        shortDesc:
          'Fly 1.7km over crystal clear waters connecting two islands with a guided, high-impact experience that balances adrenaline and scenery.',
        image: ziplineImg,
        link: '/activity/zipline',
        theme: 'zipline',
        duration: '15-20 mins',
        age: '8+ years',
        badge: 'High Thrill',
        highlights: ['1.7km Length', 'Island to Island', 'Over-water']
      },
      {
        id: 'diving',
        title: 'Apo Reef Diving',
        subtitle: 'World-Class Marine Sanctuary',
        shortDesc:
          'Explore a calmer, immersive side of Sablayan with reef discovery, marine life encounters, and one of the country\'s most memorable dive settings.',
        image: divingImg,
        link: '/activity/diving',
        theme: 'diving',
        duration: '3-4 hours',
        age: '10+ years',
        badge: 'Signature Nature',
        highlights: ['Marine Sanctuary', 'Crystal Clear Water', 'Diverse Species']
      }
    ],
    []
  )

  const heroFacts = useMemo(
    () => [
      { label: 'Signature experiences', value: '2 curated' },
      { label: 'Best for groups & couples', value: 'All-day ready' },
      { label: 'From quick thrills to deep dives', value: '15 mins - 4 hrs' }
    ],
    []
  )

  const stats = useMemo(
    () => [
      { number: '1.7km', label: 'Zipline Length', icon: 'fa-wind' },
      { number: '100+', label: 'Dive Spots Nearby', icon: 'fa-water' },
      { number: '15+', label: 'Years Experience', icon: 'fa-award' },
      { number: '10k+', label: 'Happy Guests', icon: 'fa-smile' }
    ],
    []
  )

  const stickyItems = useMemo(
    () => [
      { id: 'zipline', label: 'Zipline' },
      { id: 'diving', label: 'Diving' },
      { id: 'activity-why-us', label: 'Why us' },
      { id: 'activity-booking', label: 'Book' }
    ],
    []
  )

  // Track scroll position and visible sections for the sticky nav.
  useEffect(() => {
    if (location.pathname !== '/activity') {
      return undefined
    }

    const trackedIds = stickyItems.map((item) => item.id)
    const sections = trackedIds
      .map((id) => document.getElementById(id))
      .filter(Boolean)

    const heroSection = document.getElementById('activity-overview')

    const handleScroll = () => {
      const heroBottom = heroSection?.getBoundingClientRect().bottom ?? 0
      setShowStickyNav(heroBottom < 140)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visibleEntries.length > 0) {
          setActiveSection(visibleEntries[0].target.id)
        }
      },
      {
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0.2, 0.35, 0.5, 0.7]
      }
    )

    sections.forEach((section) => observer.observe(section))
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [location.pathname, stickyItems])

  // Render nested routes for the activity sub-pages.
  if (location.pathname !== '/activity') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: reducedMotion ? 0 : 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reducedMotion ? 0 : -18 }}
          transition={{ duration: reducedMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="activity-page">
      {/* Loader overlays until hero images and video are ready */}
      {(!imagesReady || !videoReady) && <PageLoader text="Loading adventures..." />}

      <Navbar />

      {/* Background video hero layer shown behind the activity hub content. */}
      <section className="activity-hero-media">
        <video
          className="activity-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setVideoReady(true)}
        >
          <source src={activityVideo} type="video/mp4" />
        </video>
      </section>

      <ActivityHubHero facts={heroFacts} />
      <ActivityStickyNav items={stickyItems} activeId={activeSection} isVisible={showStickyNav} />

      {/* Activity cards section with reveal animation and CTA text. */}
      <motion.section
        className="activities-section"
        id="activity-cards"
        variants={createStaggerContainer(reducedMotion, 0.12)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.12 }}
      >
        <div className="section-container">
          <motion.div className="section-header section-header-split" variants={createRevealVariants(reducedMotion)}>
            <div>
              <span className="section-tag">Our Adventures</span>
              <h2>Choose a pace that fits your day.</h2>
            </div>
            <p>
              Start with a quick thrill or go deep into the marine side of Sablayan. Each option below now gives you a clearer path to details and booking.
            </p>
          </motion.div>

          <div className="activities-showcase-grid">
            {activities.map((activity, index) => (
              <section key={activity.id} id={activity.id}>
                <ActivityCard activity={activity} index={index} />
              </section>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Why choose us section with stats cards. */}
      <motion.section
        className="experience-section"
        id="activity-why-us"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
        variants={createStaggerContainer(reducedMotion, 0.1)}
      >
        <div className="experience-bg-decoration"></div>
        <div className="section-container">
          <motion.div className="experience-content" variants={createRevealVariants(reducedMotion)}>
            <span className="section-tag">Why Choose Us</span>
            <h2>Designed to feel premium before, during, and after the activity.</h2>
            <p>
              Sablayan Adventure Camp blends island adrenaline with a calmer, more polished guest experience so the page feels easier to browse and the destination feels easier to trust.
            </p>

            <div className="experience-stats-grid">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="stat-card"
                  variants={createRevealVariants(reducedMotion, index * 0.06)}
                  whileHover={reducedMotion ? {} : { y: -6 }}
                >
                  <div className="stat-icon-wrapper">
                    <i className={`fas ${stat.icon}`}></i>
                  </div>
                  <span className="stat-number">{stat.number}</span>
                  <span className="stat-label">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Bottom call-to-action section. */}
      <motion.section
        className="activity-cta"
        id="activity-booking"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={createRevealVariants(reducedMotion)}
      >
        <div className="section-container">
          <div className="cta-box">
            <div className="cta-content">
              <span className="cta-kicker">Ready when you are</span>
              <h2>Make the next click feel obvious.</h2>
              <p>Head straight to booking once you know your activity, or explore each experience page for rates, highlights, and details first.</p>
              <div className="cta-actions">
                <Link to="/booking" className="cta-book-btn">
                  <span>Book Your Adventure</span>
                  <i className="fas fa-arrow-right"></i>
                </Link>
                <Link to="/activity/zipline" className="cta-text-link">
                  Browse featured activity
                </Link>
              </div>
            </div>
            <div className="cta-side-panel">
              <div className="cta-side-stat">
                <span className="cta-side-label">Best for quick thrills</span>
                <strong>Zipline</strong>
              </div>
              <div className="cta-side-stat">
                <span className="cta-side-label">Best for immersive nature</span>
                <strong>Diving</strong>
              </div>
              <Link to="/booking" className="cta-inline-link">
                <span>Book Your Adventure</span>
                <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="cta-decoration"></div>
          </div>
        </div>
      </motion.section>

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
