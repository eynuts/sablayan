const ActivityStickyNav = ({ items, activeId, isVisible }) => {
  // Render the small sticky section navigation on the activity hub page.
  return (
    <div className={`activity-sticky-nav ${isVisible ? 'visible' : ''}`} aria-hidden={!isVisible}>
      <div className="section-container">
        <nav className="activity-sticky-nav-inner" aria-label="Activity page sections">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={activeId === item.id ? 'active' : ''}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default ActivityStickyNav
