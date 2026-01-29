import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import '../styles/screens/SwingAnalysisScreen.css'

function SwingAnalysisScreen() {
  const navigate = useNavigate()
  const [isPlaying, setIsPlaying] = useState(false)

  const analysisData = {
    score: 88,
    rating: 'Excellent',
    club: '7 Iron',
    date: 'Oct 24, 10:42 AM',
    xpEarned: 50,
    level: 12,
    levelProgress: 70,
    videoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzPuwk7pwMrT7Gwi7wr72hCTjq5hVYIxSCkS_E9gpJTXslTzmNUz8UUt1C_fYsoqHl3L_wXW99vIMqtJOFItFPc81Q-aXxuZV6-CmEAvHwdxzO3vYV-QZM-t5QwbTvONTQL6lKdRkzM2r2ghzK2Dcnfy1Bs3AlSZp9aZseD_RTobnpraaBkOABPcH_bW1KL-Aeae7y6wJ-VwkAVhFRA-mVG4QrbQNpNXMdANwq9tArLZ9EotF8_oJ6rtqDmwiaBTcI-qs0oJUBLN4',
    goodPoints: ['Perfect Tempo (3.0:1)', 'Straight Left Arm', 'Great Balance'],
    focusAreas: ['Early Extension', 'Open Club Face'],
    coachTip: 'You are extending your hips too early in the downswing. Try the chair drill to maintain posture.',
    drillName: 'Chair Drill',
    metrics: [
      { label: 'Club Head Speed', value: '98 mph', percentage: 85, status: 'good' },
      { label: 'Hip Rotation', value: '42°', note: 'Optimal', percentage: 92, status: 'good' },
      { label: 'Attack Angle', value: '-2.3°', note: 'Steep', percentage: 15, status: 'warning', centered: true }
    ]
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleShare = () => {
    // Share functionality
    console.log('Share analysis')
  }

  const handlePlayVideo = () => {
    setIsPlaying(!isPlaying)
  }

  const handleStartDrill = () => {
    navigate('/drill/chair-drill')
  }

  const handleNextSwing = () => {
    navigate('/record')
  }

  return (
    <div className="analysis-screen">
      {/* Top App Bar */}
      <div className="analysis-screen__top-bar">
        <button className="analysis-screen__icon-btn" onClick={handleBack} aria-label="Go back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="analysis-screen__title-area">
          <h2 className="analysis-screen__club">{analysisData.club}</h2>
          <span className="analysis-screen__date">{analysisData.date}</span>
        </div>
        <button className="analysis-screen__icon-btn" onClick={handleShare} aria-label="Share">
          <span className="material-symbols-outlined">share</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="analysis-screen__content">
        {/* Score Ring */}
        <div className="analysis-screen__score-section">
          <div className="analysis-screen__score-ring">
            <div className="analysis-screen__score-glow" />
            <svg className="analysis-screen__score-svg" viewBox="0 0 100 100">
              <circle
                className="analysis-screen__score-bg"
                cx="50"
                cy="50"
                fill="none"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
              />
              <circle
                className="analysis-screen__score-progress"
                cx="50"
                cy="50"
                fill="none"
                r="45"
                stroke="currentColor"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * analysisData.score) / 100}
                strokeLinecap="round"
                strokeWidth="8"
              />
            </svg>
            <div className="analysis-screen__score-text">
              <span className="analysis-screen__score-number">{analysisData.score}</span>
              <span className="analysis-screen__score-rating">{analysisData.rating}</span>
            </div>
          </div>
        </div>

        {/* XP Banner */}
        <div className="analysis-screen__xp-banner">
          <div className="analysis-screen__xp-content">
            <div className="analysis-screen__xp-left">
              <div className="analysis-screen__xp-icon">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <div className="analysis-screen__xp-info">
                <span className="analysis-screen__xp-earned">+{analysisData.xpEarned} XP Earned</span>
                <div className="analysis-screen__xp-progress">
                  <div className="analysis-screen__xp-progress-fill" style={{ width: `${analysisData.levelProgress}%` }} />
                </div>
              </div>
            </div>
            <span className="analysis-screen__xp-level">Lvl {analysisData.level} Golfer</span>
          </div>
        </div>

        {/* Video Playback */}
        <div className="analysis-screen__video-card" onClick={handlePlayVideo}>
          <div 
            className="analysis-screen__video-bg"
            style={{ backgroundImage: `url(${analysisData.videoUrl})` }}
          />
          <div className="analysis-screen__video-overlay" />
          <div className="analysis-screen__video-play">
            <button className="analysis-screen__play-btn" aria-label="Play video">
              <span className="material-symbols-outlined">play_arrow</span>
            </button>
          </div>
          <div className="analysis-screen__video-badge">
            <span>AI Analysis On</span>
          </div>
        </div>

        {/* The Good */}
        <div className="analysis-screen__card">
          <div className="analysis-screen__card-header">
            <span className="material-symbols-outlined analysis-screen__card-icon--good">check_circle</span>
            <h3 className="analysis-screen__card-title">The Good</h3>
          </div>
          <div className="analysis-screen__chips">
            {analysisData.goodPoints.map((point, index) => (
              <div key={index} className="analysis-screen__chip analysis-screen__chip--good">
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Focus Area */}
        <div className="analysis-screen__card analysis-screen__card--focus">
          <div className="analysis-screen__card-decoration">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div className="analysis-screen__card-header">
            <span className="material-symbols-outlined analysis-screen__card-icon--warning">error</span>
            <h3 className="analysis-screen__card-title">Focus Area</h3>
          </div>
          <div className="analysis-screen__chips">
            {analysisData.focusAreas.map((area, index) => (
              <div key={index} className="analysis-screen__chip analysis-screen__chip--warning">
                <span>{area}</span>
              </div>
            ))}
          </div>
          {/* Coach Tip */}
          <div className="analysis-screen__coach-tip">
            <p className="analysis-screen__coach-tip-text">
              <strong>Coach Tip:</strong> {analysisData.coachTip}
            </p>
            <Button
              variant="primary"
              size="medium"
              fullWidth
              icon={<span className="material-symbols-outlined">play_circle</span>}
              iconPosition="left"
              onClick={handleStartDrill}
            >
              Start "{analysisData.drillName}"
            </Button>
          </div>
        </div>

        {/* Metrics Breakdown */}
        <div className="analysis-screen__card">
          <h3 className="analysis-screen__card-title">Metrics Breakdown</h3>
          <div className="analysis-screen__metrics">
            {analysisData.metrics.map((metric, index) => (
              <div key={index} className="analysis-screen__metric">
                <div className="analysis-screen__metric-header">
                  <span className="analysis-screen__metric-label">{metric.label}</span>
                  <span className={`analysis-screen__metric-value ${metric.status === 'warning' ? 'analysis-screen__metric-value--warning' : ''}`}>
                    {metric.value}
                    {metric.note && (
                      <span className="analysis-screen__metric-note"> ({metric.note})</span>
                    )}
                  </span>
                </div>
                <div className="analysis-screen__metric-bar">
                  {metric.centered ? (
                    <>
                      <div className="analysis-screen__metric-bar-center" />
                      <div 
                        className="analysis-screen__metric-bar-fill analysis-screen__metric-bar-fill--warning"
                        style={{ width: `${metric.percentage}%` }}
                      />
                    </>
                  ) : (
                    <div 
                      className="analysis-screen__metric-bar-fill"
                      style={{ width: `${metric.percentage}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="analysis-screen__bottom-bar">
        <Button
          variant="secondary"
          size="large"
          fullWidth
          icon={<span className="material-symbols-outlined">arrow_forward</span>}
          iconPosition="right"
          onClick={handleNextSwing}
        >
          Next Swing
        </Button>
      </div>
    </div>
  )
}

export default SwingAnalysisScreen

