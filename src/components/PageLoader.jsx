import './PageLoader.css'

// PageLoader component displays a loading spinner with customizable title and text
// It can be rendered as a full-screen overlay or inline within a container
const PageLoader = ({
  title = 'Sablayan Adventure Camp', // Default title displayed below the spinner
  text = 'Loading...', // Default loading text
  fullScreen = true // Determines if the loader covers the full screen or is inline
}) => {
  return (
    // Main container with conditional class for full-screen or inline display
    <div className={`page-loader ${fullScreen ? 'fullscreen' : 'inline'}`}>
      <div className="page-loader-content">
        {/* Animated spinner element */}
        <div className="page-loader-spinner"></div>
        {/* Customizable title */}
        <h2 className="page-loader-title">{title}</h2>
        {/* Customizable loading text */}
        <p className="page-loader-text">{text}</p>
      </div>
    </div>
  )
}

export default PageLoader
