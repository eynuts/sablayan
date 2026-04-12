import './PageLoader.css'

const PageLoader = ({
  title = 'Sablayan Adventure Camp',
  text = 'Loading...',
  fullScreen = true
}) => {
  return (
    <div className={`page-loader ${fullScreen ? 'fullscreen' : 'inline'}`}>
      <div className="page-loader-content">
        <div className="page-loader-spinner"></div>
        <h2 className="page-loader-title">{title}</h2>
        <p className="page-loader-text">{text}</p>
      </div>
    </div>
  )
}

export default PageLoader
