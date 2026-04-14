// Footer component for the site, including branding, quick links, experiences, and contact details
import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          {/* Footer brand section with logo, description, and social media links */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="logo-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="logo-text">
                <span className="logo-main">Sablayan Adventure Camp</span>
                <span className="logo-sub">Resort & Dive Shop</span>
              </div>
            </Link>
            <p className="footer-description">
              Experience Asia's longest island-to-island zipline and world-class diving at Apo Reef. We provide the perfect blend of adrenaline and relaxation in Sablayan, Mindoro.
            </p>
            <div className="footer-social">
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
              <a href="#" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
            </div>
          </div>

          <div className="footer-links-group">
            <div className="footer-column">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/accommodations">Resort Stay</Link></li>
                <li><Link to="/booking">Bookings</Link></li>
                <li><Link to="/location">Our Location</Link></li>
                <li><Link to="/about">About Us</Link></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Experiences</h4>
              <ul>
                <li><Link to="/activity/zipline">Zipline Adventure</Link></li>
                <li><Link to="/activity/diving">Apo Reef Diving</Link></li>
                <li><Link to="/activity/snorkeling">Pandam Snorkeling</Link></li>
                <li><Link to="/activity/island-hopping">Island Hopping</Link></li>
                <li><Link to="/activity/sunset-cruise">Sunset Cruise</Link></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Contact Us</h4>
              <ul className="contact-list">
                <li>
                  <i className="fas fa-map-marker-alt"></i>
                  <span>Punta, Sablayan, Occidental Mindoro, Philippines</span>
                </li>
                <li>
                  <i className="fas fa-phone-alt"></i>
                  <span>+63 917 123 4567</span>
                </li>
                <li>
                  <i className="fas fa-envelope"></i>
                  <span>info@sablayanadventurecamp.com</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          {/* Bottom footer content with copyright and legal links */}
          <div className="footer-bottom-content">
            <p className="copyright">&copy; {new Date().getFullYear()} Sablayan Adventure Camp. All rights reserved.</p>
            <div className="footer-legal">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
