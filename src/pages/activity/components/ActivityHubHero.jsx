import { motion, useReducedMotion } from 'framer-motion'
import { createRevealVariants, createStaggerContainer } from '../activityMotion'

const ActivityHubHero = ({ facts }) => {
  const reducedMotion = useReducedMotion()

  // Stagger the entrance of hero content pieces when motion is allowed.
  const containerVariants = createStaggerContainer(reducedMotion, 0.1)

  return (
    <section className="activity-hero" id="activity-overview">
      <div className="activity-hero-overlay"></div>
      <div className="activity-hero-orb activity-hero-orb-one"></div>
      <div className="activity-hero-orb activity-hero-orb-two"></div>
      <div className="section-container activity-hero-shell">
        {/* Main hero content with motion reveal effects. */}
        <motion.div
          className="activity-hero-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.span className="section-tag" variants={createRevealVariants(reducedMotion)}>
            Sablayan Adventure Camp
          </motion.span>
          <motion.h1 variants={createRevealVariants(reducedMotion, 0.04)}>
            Adventures that feel cinematic before you even book them.
          </motion.h1>
          <motion.p variants={createRevealVariants(reducedMotion, 0.08)}>
            Discover Sablayan&apos;s signature experiences through a cleaner, faster activity hub with clearer next steps,
            calmer motion, and more immersive storytelling.
          </motion.p>
          <motion.div className="activity-hero-actions" variants={createRevealVariants(reducedMotion, 0.12)}>
            <a href="#activity-cards" className="activity-primary-btn">
              Explore Activities
            </a>
            <a href="#activity-booking" className="activity-secondary-btn">
              Plan Your Booking
            </a>
          </motion.div>
        </motion.div>

        {/* Quick facts panel sits beside the hero content. */}
        <motion.aside
          className="activity-hero-panel"
          variants={createRevealVariants(reducedMotion, 0.16)}
          initial="hidden"
          animate="visible"
        >
          <span className="activity-panel-eyebrow">Quick Facts</span>
          <div className="activity-facts-grid">
            {facts.map((fact) => (
              <div key={fact.label} className="activity-fact-card">
                <span className="activity-fact-value">{fact.value}</span>
                <span className="activity-fact-label">{fact.label}</span>
              </div>
            ))}
          </div>
          <div className="activity-panel-note">
            From laid-back reef discovery to high-adrenaline island crossings, each activity is built for memorable first impressions.
          </div>
        </motion.aside>
      </div>
    </section>
  )
}

export default ActivityHubHero
