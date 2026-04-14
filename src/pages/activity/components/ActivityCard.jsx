import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { createRevealVariants, cardHoverMotion } from '../activityMotion'

const ActivityCard = ({ activity, index }) => {
  const reducedMotion = useReducedMotion()

  return (
    <motion.article
      className={`activity-showcase-card ${activity.theme}`}
      variants={createRevealVariants(reducedMotion, index * 0.08)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      whileHover={cardHoverMotion(reducedMotion)}
    >
      {/* Activity image panel with gradient overlay and badge */}
      <div className="activity-showcase-media">
        <img src={activity.image} alt={activity.title} />
        <div className="activity-showcase-gradient"></div>
        <div className="activity-showcase-badge">{activity.badge}</div>
      </div>

      <div className="activity-showcase-content">
        <div className="activity-showcase-copy">
          <span className="activity-showcase-subtitle">{activity.subtitle}</span>
          <h2>{activity.title}</h2>
          <p>{activity.shortDesc}</p>
        </div>

        <div className="activity-showcase-meta">
          <div className="activity-meta-pills">
            <span><i className="fas fa-clock"></i>{activity.duration}</span>
            <span><i className="fas fa-user"></i>{activity.age}</span>
          </div>
          <div className="activity-meta-highlights">
            {activity.highlights.map((highlight) => (
              <span key={highlight} className="highlight-tag">{highlight}</span>
            ))}
          </div>
        </div>

        <div className="activity-showcase-actions">
          <Link to={activity.link} className="activity-card-primary">
            View details
            <i className="fas fa-arrow-right"></i>
          </Link>
          <Link to="/booking" className="activity-card-secondary">
            Book this activity
          </Link>
        </div>
      </div>
    </motion.article>
  )
}

export default ActivityCard
