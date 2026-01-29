import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import ProgressIndicator from '../components/ProgressIndicator'
import '../styles/screens/InitialSwingSetupScreen.css'

function InitialSwingSetupScreen() {
  const navigate = useNavigate()
  const [selectedClub, setSelectedClub] = useState('7 Iron')

  const clubs = ['7 Iron', 'Driver', 'Putter', 'Wedge']

  const handleStartRecording = () => {
    navigate('/record')
  }

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="swing-setup">
      {/* Camera Feed Background */}
      <div 
        className="swing-setup__background"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCs57TR4hk_CDpoqtSnP3_S1vcc3VyzmLD6iWUdDCjM8VgKoNQcF4FF-DvB3y83jf-xKL5MnmM5WU_00UptQ-xhg2nuPbnLlG8c3Fs60ACEVdti6qAlHv8QJK0FuoFShsHG_Vc_cMFoGRYUj2wFltaddGvJgge5NHmZ7cgTsBzBJ-0DFpnTahFDuwZrXIavoNH8s3oTIhtBYKyU7gfnomCGoyYZO6JoZ7phK95W2cb0Mw2Ut5CFErout6kI5ZlhODu3l7YLNMt7Ru8')"
        }}
      />

      {/* AR Grid Overlay */}
      <div className="swing-setup__ar-overlay">
        <div className="swing-setup__grid-box">
          {/* Corner Indicators */}
          <div className="swing-setup__corner swing-setup__corner--tl" />
          <div className="swing-setup__corner swing-setup__corner--tr" />
          <div className="swing-setup__corner swing-setup__corner--bl" />
          <div className="swing-setup__corner swing-setup__corner--br" />
          
          {/* Center Guide Lines */}
          <div className="swing-setup__guide-lines">
            <div className="swing-setup__guide-line swing-setup__guide-line--vertical" />
            <div className="swing-setup__guide-line swing-setup__guide-line--horizontal" />
          </div>

          {/* Live Feedback Pill */}
          <div className="swing-setup__feedback-pill">
            <span className="material-symbols-outlined filled">check_circle</span>
            <span>Phone Level</span>
          </div>
        </div>

        <h2 className="swing-setup__headline">Align yourself in the grid</h2>
      </div>

      {/* Top Navigation */}
      <div className="swing-setup__top-nav">
        <button className="swing-setup__icon-btn" onClick={handleBack} aria-label="Go back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="swing-setup__title-area">
          <span className="swing-setup__subtitle">Setup Wizard</span>
          <h2 className="swing-setup__title">Baseline Evaluation</h2>
        </div>
        <button className="swing-setup__icon-btn" aria-label="Help">
          <span className="material-symbols-outlined">help</span>
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="swing-setup__bottom-controls">
        <ProgressIndicator steps={3} currentStep={0} />

        {/* Instruction Card */}
        <div className="swing-setup__instruction-card">
          <div className="swing-setup__card-content">
            <div className="swing-setup__card-text">
              <div className="swing-setup__card-header">
                <span className="swing-setup__step-badge">Step 1</span>
                <p className="swing-setup__card-title">Position Camera</p>
              </div>
              <p className="swing-setup__card-description">
                Place your phone waist-high, 10ft back, facing the golfer directly.
              </p>
            </div>
            <div 
              className="swing-setup__card-image"
              style={{
                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuASvhXWs6vfib4yatHnnURWOa_NBFT0c21lYLwJ6-MzIh7vbay3HWHDo7RY4tuQ_J3v4Xdeda8vfad0XoNSaC9_zIZd1Zabn6n8VPW8Xs-1mEZCSdWEZgseK3hELLlkYqKhKQ0_M6EcoGkaUL1aqiRpneZsLpVxIFevSix6Y2xUrlVKwH_epYtnhf5ZwaWVMlAqM9ztGZF5aKc6pYLActSAcfNUS_ncePGZs1B2unjOts-0PKc2GYTdZfgKwBfgmDcjyVXTx6WcQXI')"
              }}
              role="img"
              aria-label="Phone on tripod setup illustration"
            />
          </div>

          <div className="swing-setup__card-divider" />

          {/* Club Selector */}
          <div className="swing-setup__club-selector">
            {clubs.map((club) => (
              <button
                key={club}
                className={`swing-setup__club-chip ${selectedClub === club ? 'swing-setup__club-chip--active' : ''}`}
                onClick={() => setSelectedClub(club)}
              >
                {selectedClub === club && (
                  <span className="material-symbols-outlined">sports_golf</span>
                )}
                <span>{club}</span>
              </button>
            ))}
            <button className="swing-setup__club-chip swing-setup__club-chip--more">
              <span className="material-symbols-outlined">expand_more</span>
            </button>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="swing-setup__action-wrapper">
          <Button
            variant="primary"
            size="large"
            fullWidth
            icon={<span className="material-symbols-outlined">videocam</span>}
            iconPosition="left"
            onClick={handleStartRecording}
          >
            Start Recording
          </Button>
        </div>
      </div>
    </div>
  )
}

export default InitialSwingSetupScreen

