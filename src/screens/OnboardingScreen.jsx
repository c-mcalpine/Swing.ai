import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import ProgressIndicator from '../components/ProgressIndicator'
import '../styles/screens/OnboardingScreen.css'

function OnboardingScreen() {
  const navigate = useNavigate()
  const [currentScreen, setCurrentScreen] = useState(0)
  const [selectedHand, setSelectedHand] = useState('right')
  const [selectedHandicap, setSelectedHandicap] = useState('11-20')

  const totalScreens = 4

  const handleNext = () => {
    if (currentScreen < totalScreens - 1) {
      setCurrentScreen(currentScreen + 1)
    } else {
      // Onboarding complete, navigate to setup
      navigate('/setup/swing')
    }
  }

  const handleBack = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1)
    }
  }

  const handleSkip = () => {
    navigate('/setup/swing')
  }

  const handleStart = () => {
    setCurrentScreen(1)
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 0:
        return <WelcomeScreen onStart={handleStart} />
      case 1:
        return <HowItWorksScreen onContinue={handleNext} onBack={handleBack} onSkip={handleSkip} currentStep={currentScreen} />
      case 2:
        return <PermissionsScreen onContinue={handleNext} onSkip={handleSkip} currentStep={currentScreen} />
      case 3:
        return (
          <ProfileSetupScreen 
            onComplete={handleNext}
            currentStep={currentScreen}
            selectedHand={selectedHand}
            setSelectedHand={setSelectedHand}
            selectedHandicap={selectedHandicap}
            setSelectedHandicap={setSelectedHandicap}
          />
        )
      default:
        return <WelcomeScreen onStart={handleStart} />
    }
  }

  return (
    <div className="onboarding-screen">
      {renderScreen()}
    </div>
  )
}

// Screen 1: Welcome
function WelcomeScreen({ onStart }) {
  return (
    <div className="onboarding-container onboarding-welcome">
      <div className="onboarding-welcome__bg">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQvCr82F7Vw5AKgdVftN3fu8DDp_gOCim0eG9d4lcDzVc97iNh4uYzNv-dU90EJecxy4QH5bCcs5W9oYoySKYdkem5-yD7fMCaMxgNE53vondvnOIPzT7r04l1WnRWTpm_7pwZE_JwV6cACb0KofkAWkTE8aVWnlyZr4isAwjPVtKTHXfWQOg_jO7mS9Ptkb5IWbNvHsHsl51oVQN1YcjLNLMYY1s-4FGwYgboQC7kI-SZx5x0OcFd2uJGWep9x0veXRAyWFF76n4"
          alt="Golfer silhouette swinging club at sunset"
          className="onboarding-welcome__bg-image"
        />
        <div className="onboarding-welcome__bg-overlay" />
      </div>

      <div className="onboarding-welcome__content">
        <div className="onboarding-welcome__logo">
          <div className="onboarding-welcome__logo-container">
            <span className="material-symbols-outlined">sports_golf</span>
            <span className="onboarding-welcome__logo-text">SwingAI</span>
          </div>
        </div>

        <div className="onboarding-welcome__text">
          <div className="onboarding-welcome__body">
            <span className="onboarding-welcome__badge">New Update</span>
            <h1 className="onboarding-welcome__title">
              Master Your <br />
              <span className="onboarding-welcome__title-gradient">Perfect Swing</span>
            </h1>
            <p className="onboarding-welcome__description">
              AI-powered analysis in your pocket. Track progress, fix faults, and drop your handicap starting today.
            </p>
          </div>

          <ProgressIndicator steps={4} currentStep={0} />

          <Button 
            variant="primary" 
            size="large" 
            fullWidth
            onClick={onStart}
            icon={<span className="material-symbols-outlined">arrow_forward</span>}
            iconPosition="right"
          >
            Start Training
          </Button>
        </div>
      </div>
    </div>
  )
}

// Screen 2: How It Works
function HowItWorksScreen({ onContinue, onBack, onSkip, currentStep }) {
  return (
    <div className="onboarding-container">
      <div className="onboarding-header">
        <button className="onboarding-back-btn" onClick={onBack} aria-label="Go back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <button className="onboarding-skip-btn" onClick={onSkip}>
          Skip
        </button>
      </div>

      <ProgressIndicator steps={4} currentStep={currentStep} />

      <div className="onboarding-main">
        <div className="onboarding-visual">
          <div className="onboarding-visual__glow" />
          <div className="onboarding-visual__card">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1IHbGJMiIEHnSipsCT9RyCmzpSJzGk7MhNs3wwRFplJbmJkcbD0MTDG_FyeAD3VqnfDIfnr1jFpUM8wBYmEbnX6PercxyLjOpzgwfMGXpUTqwKRsWbZV6qUu3WJCg43gT-ISQsrRTuczgIGWTK9cCk7O72NZ56OQ3sk4iFrq61XGs5i-6xMqsspAj6UraOgH1UeKqSzXha0qMELiHPjxM4dL-rVIFqk0Zhl9I_GxqF_gRYkui0ZhHyLACzJSUGkz5ap9kZpN_o5s"
              alt="Phone recording golf swing"
              className="onboarding-visual__image"
            />
            <div className="onboarding-visual__overlay" />
            <div className="onboarding-visual__icon-container">
              <div className="onboarding-visual__icon">
                <span className="material-symbols-outlined">videocam</span>
              </div>
              <div className="onboarding-visual__recording">
                <span className="onboarding-visual__recording-dot" />
                <span className="onboarding-visual__recording-text">RECORDING</span>
              </div>
            </div>
          </div>

          <div className="onboarding-text">
            <h2 className="onboarding-text__title">Analyze Instantly</h2>
            <p className="onboarding-text__description">
              Set up your phone 6-8 feet away. Our AI tracks 24 key body points to provide instant feedback on your posture and swing path.
            </p>
          </div>
        </div>
      </div>

      <div className="onboarding-footer">
        <Button variant="secondary" size="large" fullWidth onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  )
}

// Screen 3: Permissions
function PermissionsScreen({ onContinue, onSkip, currentStep }) {
  return (
    <div className="onboarding-container">
      <ProgressIndicator steps={4} currentStep={currentStep} />

      <div className="onboarding-main onboarding-main--top-aligned">
        <h1 className="onboarding-page-title">
          Let's see that <br />
          <span className="onboarding-page-title--accent">Swing</span>
        </h1>
        <p className="onboarding-page-description">
          To analyze your biomechanics, we need access to your camera. Your data is private and processed locally.
        </p>

        <div className="onboarding-permissions">
          <div className="onboarding-permission-card onboarding-permission-card--active">
            <div className="onboarding-permission-card__icon onboarding-permission-card__icon--active">
              <span className="material-symbols-outlined">photo_camera</span>
            </div>
            <div className="onboarding-permission-card__content">
              <h3 className="onboarding-permission-card__title">Camera Access</h3>
              <p className="onboarding-permission-card__description">
                Required to record swings and visualize shot tracer technology.
              </p>
            </div>
            <div className="onboarding-permission-card__check">
              <span className="material-symbols-outlined">check</span>
            </div>
          </div>

          <div className="onboarding-permission-card onboarding-permission-card--inactive">
            <div className="onboarding-permission-card__icon">
              <span className="material-symbols-outlined">notifications</span>
            </div>
            <div className="onboarding-permission-card__content">
              <h3 className="onboarding-permission-card__title">Notifications</h3>
              <p className="onboarding-permission-card__description">
                Get daily practice reminders and weekly progress reports.
              </p>
            </div>
            <div className="onboarding-permission-card__checkbox" />
          </div>
        </div>

        <div className="onboarding-privacy-note">
          <span className="material-symbols-outlined">lock</span>
          <p>We never share your videos without permission.</p>
        </div>
      </div>

      <div className="onboarding-footer">
        <Button variant="primary" size="large" fullWidth onClick={onContinue}>
          Enable Camera Access
        </Button>
        <button className="onboarding-text-btn" onClick={onSkip}>
          Not now
        </button>
      </div>
    </div>
  )
}

// Screen 4: Profile Setup
function ProfileSetupScreen({ onComplete, currentStep, selectedHand, setSelectedHand, selectedHandicap, setSelectedHandicap }) {
  const handicapRanges = {
    'Pro': '0-5',
    '0-10': '6-10',
    '11-20': '18-24',
    '20+': '25+'
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-profile-header">
        <ProgressIndicator steps={4} currentStep={currentStep} />
        <h1 className="onboarding-page-title">
          Build Your <br />Profile
        </h1>
      </div>

      <div className="onboarding-main onboarding-main--scrollable">
        {/* Dexterity */}
        <div className="onboarding-form-group">
          <label className="onboarding-form-label">Dexterity</label>
          <div className="onboarding-hand-selector">
            <button 
              className={`onboarding-hand-option ${selectedHand === 'right' ? 'onboarding-hand-option--active' : ''}`}
              onClick={() => setSelectedHand('right')}
            >
              {selectedHand === 'right' && (
                <div className="onboarding-hand-option__check">
                  <span className="material-symbols-outlined">check</span>
                </div>
              )}
              <span className="material-symbols-outlined onboarding-hand-option__icon">pan_tool_alt</span>
              <span className="onboarding-hand-option__label">Right Handed</span>
            </button>
            <button 
              className={`onboarding-hand-option ${selectedHand === 'left' ? 'onboarding-hand-option--active' : ''}`}
              onClick={() => setSelectedHand('left')}
            >
              {selectedHand === 'left' && (
                <div className="onboarding-hand-option__check">
                  <span className="material-symbols-outlined">check</span>
                </div>
              )}
              <span className="material-symbols-outlined onboarding-hand-option__icon onboarding-hand-option__icon--flipped">pan_tool_alt</span>
              <span className="onboarding-hand-option__label">Left Handed</span>
            </button>
          </div>
        </div>

        {/* Handicap */}
        <div className="onboarding-form-group">
          <div className="onboarding-form-header">
            <label className="onboarding-form-label">Estimated Handicap</label>
            <span className="onboarding-form-value">{handicapRanges[selectedHandicap]}</span>
          </div>
          <div className="onboarding-handicap-selector">
            {Object.keys(handicapRanges).map((range) => (
              <button
                key={range}
                className={`onboarding-handicap-option ${selectedHandicap === range ? 'onboarding-handicap-option--active' : ''}`}
                onClick={() => setSelectedHandicap(range)}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Slider visualization */}
          <div className="onboarding-slider">
            <div className="onboarding-slider__track" />
            <div className="onboarding-slider__fill" style={{ width: '60%' }} />
            <div className="onboarding-slider__thumb" style={{ left: '60%' }}>
              <div className="onboarding-slider__thumb-dot" />
            </div>
            <div className="onboarding-slider__labels">
              <span>Beginner</span>
              <span>Scratch</span>
            </div>
          </div>
        </div>

        {/* Reward Badge */}
        <div className="onboarding-reward">
          <div className="onboarding-reward__icon">
            <span className="material-symbols-outlined">emoji_events</span>
          </div>
          <div className="onboarding-reward__content">
            <p className="onboarding-reward__title">Profile Setup Reward</p>
            <p className="onboarding-reward__xp">+50 XP Pending</p>
          </div>
        </div>
      </div>

      <div className="onboarding-footer onboarding-footer--gradient">
        <Button variant="primary" size="large" fullWidth onClick={onComplete}>
          Finalize Profile
        </Button>
      </div>
    </div>
  )
}

export default OnboardingScreen

