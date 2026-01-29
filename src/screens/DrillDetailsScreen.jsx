import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import '../styles/screens/DrillDetailsScreen.css';

function DrillDetailsScreen() {
  const navigate = useNavigate();
  const [reps, setReps] = useState(0);
  const goalReps = 10;
  
  const drillData = {
    title: 'The Gate Drill',
    description: 'Improve your face control at impact by forcing the putter through a tight gate. This drill provides instant feedback on off-center strikes.',
    videoThumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIWsAWxVFVqgVuR-wCh0IYR4-2qHEnlFSkrr5ereCvRCaY3qQ93UwweuePmYV937CSYoX5NeZg-vEd0xfnfpu473DjPfqthGsTfAPOecATVgC3fMSa3a60kS54GVr2InYy058M13gY7A5yC8C09Fv5bmuGVEnxTjBdtICY3-_0R3oQMC6jWqMp2L0Vbrlnr6hijBPYabB2vWli9UcB-CUCcnz_ColoGxEwksKHQiOi9vXKiyOBHoUVIV4761yBsFYMTRXuZ4y7bvM',
    duration: '05:00',
    meta: [
      { icon: 'equalizer', label: 'Intermediate' },
      { icon: 'timer', label: '5 mins' },
      { icon: 'sports_golf', label: 'Putter' }
    ]
  };

  const steps = [
    {
      id: 1,
      title: 'Setup the Gate',
      description: 'Place two tees into the ground, just wider than your putter head, to create a narrow gate for your stroke. Leave about 1/4 inch of clearance on each side.',
      isOpen: true
    },
    {
      id: 2,
      title: 'Ball Position',
      description: 'Place the ball directly in the center of the gate. Ensure your eyes are directly over the ball for optimal alignment.',
      isOpen: false
    },
    {
      id: 3,
      title: 'Stroke Execution',
      description: 'Make your stroke. If you hit a tee, your face angle was either open or closed. Reset and try to pass through cleanly.',
      isOpen: false
    }
  ];

  const [expandedSteps, setExpandedSteps] = useState(
    steps.filter(step => step.isOpen).map(step => step.id)
  );

  const toggleStep = (stepId) => {
    setExpandedSteps(prev =>
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const incrementReps = () => {
    if (reps < goalReps) {
      setReps(prev => prev + 1);
    }
  };

  const decrementReps = () => {
    if (reps > 0) {
      setReps(prev => prev - 1);
    }
  };

  const handleRecordSwing = () => {
    navigate('/record');
  };

  const progressPercentage = (reps / goalReps) * 100;

  return (
    <div className="drill-details-screen">
      {/* Top App Bar */}
      <header className="drill-details-screen__header">
        <button 
          className="drill-details-screen__icon-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        
        <h2 className="drill-details-screen__header-title">Putting Essentials</h2>
        
        <button 
          className="drill-details-screen__icon-btn"
          aria-label="Help"
        >
          <span className="material-symbols-outlined">help_outline</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="drill-details-screen__content">
        {/* Video Player */}
        <div className="drill-details-screen__video-container">
          <div 
            className="drill-details-screen__video-player"
            style={{ backgroundImage: `url('${drillData.videoThumb}')` }}
          >
            <div className="drill-details-screen__video-overlay" />
            <button className="drill-details-screen__play-btn">
              <span className="material-symbols-outlined drill-details-screen__play-icon">
                play_arrow
              </span>
            </button>
            <div className="drill-details-screen__video-duration">
              {drillData.duration}
            </div>
          </div>
        </div>

        {/* Header & Meta Data */}
        <div className="drill-details-screen__info">
          <h1 className="drill-details-screen__title">{drillData.title}</h1>
          
          <div className="drill-details-screen__meta">
            {drillData.meta.map((item, index) => (
              <div key={index} className="drill-details-screen__meta-tag">
                <span className="material-symbols-outlined drill-details-screen__meta-icon">
                  {item.icon}
                </span>
                <p className="drill-details-screen__meta-label">{item.label}</p>
              </div>
            ))}
          </div>

          <p className="drill-details-screen__description">
            {drillData.description}
          </p>
        </div>

        {/* Instructions Accordion */}
        <div className="drill-details-screen__instructions">
          <h3 className="drill-details-screen__instructions-title">Step-by-Step</h3>
          
          <div className="drill-details-screen__steps">
            {steps.map((step) => (
              <details
                key={step.id}
                className="drill-details-screen__step"
                open={expandedSteps.includes(step.id)}
              >
                <summary 
                  className="drill-details-screen__step-header"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleStep(step.id);
                  }}
                >
                  <div className="drill-details-screen__step-header-content">
                    <div 
                      className={`drill-details-screen__step-number ${
                        step.id === 1 ? 'drill-details-screen__step-number--active' : ''
                      }`}
                    >
                      {step.id}
                    </div>
                    <p className="drill-details-screen__step-title">{step.title}</p>
                  </div>
                  <span 
                    className={`material-symbols-outlined drill-details-screen__step-chevron ${
                      expandedSteps.includes(step.id) ? 'drill-details-screen__step-chevron--open' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </summary>
                
                {expandedSteps.includes(step.id) && (
                  <div className="drill-details-screen__step-content">
                    <p className="drill-details-screen__step-description">
                      {step.description}
                    </p>
                  </div>
                )}
              </details>
            ))}
          </div>
        </div>
      </main>

      {/* Sticky Footer with Controls */}
      <div className="drill-details-screen__footer-wrapper">
        <div className="drill-details-screen__footer-gradient" />
        <footer className="drill-details-screen__footer">
          <div className="drill-details-screen__footer-content">
            {/* Progress Header */}
            <div className="drill-details-screen__progress-section">
              <div className="drill-details-screen__goal">
                <span className="drill-details-screen__goal-label">Goal</span>
                <span className="drill-details-screen__goal-value">{goalReps} Reps</span>
              </div>
              <div className="drill-details-screen__progress-bar-container">
                <div 
                  className="drill-details-screen__progress-bar-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Controls Grid */}
            <div className="drill-details-screen__controls">
              {/* Rep Counter */}
              <div className="drill-details-screen__counter">
                <button 
                  className="drill-details-screen__counter-btn drill-details-screen__counter-btn--minus"
                  onClick={decrementReps}
                  disabled={reps === 0}
                  aria-label="Decrease reps"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="drill-details-screen__counter-value">{reps}</span>
                <button 
                  className="drill-details-screen__counter-btn drill-details-screen__counter-btn--plus"
                  onClick={incrementReps}
                  disabled={reps === goalReps}
                  aria-label="Increase reps"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>

              {/* Record Button */}
              <button 
                className="drill-details-screen__record-btn"
                onClick={handleRecordSwing}
              >
                <span className="material-symbols-outlined drill-details-screen__record-icon">
                  videocam
                </span>
                <span>Record Swing</span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default DrillDetailsScreen;

