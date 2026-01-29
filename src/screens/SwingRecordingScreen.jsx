import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/screens/SwingRecordingScreen.css'

function SwingRecordingScreen() {
  const navigate = useNavigate()
  const [selectedClub, setSelectedClub] = useState('7 Iron')
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  const clubs = ['Driver', '7 Iron', 'Wedge', 'Putter']

  const handleClose = () => {
    navigate(-1)
  }

  const handleRecord = () => {
    if (!isRecording) {
      setIsRecording(true)
      // Simulate recording for 3 seconds then navigate to analysis
      setTimeout(() => {
        setIsRecording(false)
        navigate('/analysis')
      }, 3000)
    }
  }

  return (
    <div className="recording-screen">
      {/* Camera Feed Background */}
      <div className="recording-screen__camera-feed">
        {/* Golfer Silhouette Overlay */}
        <div className="recording-screen__silhouette-overlay">
          <svg 
            className="recording-screen__silhouette" 
            viewBox="0 0 200 400"
          >
            <path 
              d="M100,50 C110,50 120,60 120,70 C120,80 110,90 100,90 C90,90 80,80 80,70 C80,60 90,50 100,50 Z M100,90 L100,180 M100,180 L70,250 M100,180 L130,250 M70,140 L130,140" 
              strokeDasharray="8 4"
            />
          </svg>
        </div>

        {/* Grid Lines */}
        <div className="recording-screen__grid-lines">
          <div className="recording-screen__grid-line recording-screen__grid-line--h1" />
          <div className="recording-screen__grid-line recording-screen__grid-line--h2" />
          <div className="recording-screen__grid-line recording-screen__grid-line--v1" />
          <div className="recording-screen__grid-line recording-screen__grid-line--v2" />
        </div>
      </div>

      {/* UI Overlay */}
      <div className="recording-screen__ui-overlay">
        {/* Top Bar */}
        <div className="recording-screen__top-bar">
          <div className="recording-screen__top-controls">
            <button 
              className="recording-screen__icon-btn"
              onClick={handleClose}
              aria-label="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="recording-screen__title">Camera Setup</h2>
            <div className="recording-screen__top-right">
              <button 
                className={`recording-screen__flash-btn ${flashEnabled ? 'recording-screen__flash-btn--active' : ''}`}
                onClick={() => setFlashEnabled(!flashEnabled)}
                aria-label="Toggle flash"
              >
                <span className="material-symbols-outlined filled">flash_on</span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="recording-screen__instructions">
            <div className="recording-screen__instruction-pill">
              <span className="material-symbols-outlined">smartphone</span>
              <p>Place phone waist-height, 10ft back</p>
            </div>
          </div>
        </div>

        {/* Center Area */}
        <div className="recording-screen__center">
          <h2 className={`recording-screen__align-text ${isRecording ? 'recording-screen__align-text--recording' : ''}`}>
            {isRecording ? 'RECORDING...' : 'ALIGN GOLFER HERE'}
          </h2>
        </div>

        {/* Bottom Controls */}
        <div className="recording-screen__bottom-controls">
          {/* Club Selection */}
          <div className="recording-screen__club-section">
            <div className="recording-screen__club-header">
              <span className="recording-screen__club-label">Select Club</span>
              <button className="recording-screen__edit-bag-btn">Edit Bag</button>
            </div>
            <div className="recording-screen__club-chips">
              {clubs.map((club) => (
                <button
                  key={club}
                  className={`recording-screen__club-chip ${selectedClub === club ? 'recording-screen__club-chip--active' : ''}`}
                  onClick={() => setSelectedClub(club)}
                >
                  {selectedClub === club && (
                    <span className="material-symbols-outlined">sports_golf</span>
                  )}
                  <span>{club}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Camera Controls */}
          <div className="recording-screen__camera-controls">
            <button className="recording-screen__control-btn" aria-label="Gallery">
              <span className="material-symbols-outlined">photo_library</span>
            </button>
            
            <button 
              className={`recording-screen__record-btn ${isRecording ? 'recording-screen__record-btn--recording' : ''}`}
              onClick={handleRecord}
              aria-label={isRecording ? 'Recording' : 'Start recording'}
              disabled={isRecording}
            >
              <div className="recording-screen__record-btn-inner" />
              <span className="material-symbols-outlined">videocam</span>
            </button>
            
            <button className="recording-screen__control-btn" aria-label="Flip camera">
              <span className="material-symbols-outlined">flip_camera_ios</span>
            </button>
          </div>

          {/* Helper Text */}
          <p className="recording-screen__helper-text">
            Tap to start or say "Hey Coach, Record"
          </p>
        </div>
      </div>
    </div>
  )
}

export default SwingRecordingScreen

