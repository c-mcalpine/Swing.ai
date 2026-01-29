import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import '../styles/screens/PersonalizedPlanScreen.css'

function PersonalizedPlanScreen() {
  const navigate = useNavigate()

  const planData = {
    phase: 'Phase 2: Iron Play Mastery',
    week: 4,
    totalWeeks: 12,
    progress: 35,
    nextLesson: {
      title: 'Hip Rotation Drill',
      duration: '15 min',
      category: 'Iron Play',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6TsnhhK2aieXHkjdr2BIZ-RztPxcggaq7mX68jBwPcTJymVUk4SbAKKA_1n14ntt0gRnm-lmnvxEql86WG8bFa4cmvm2yTX5KxeNblhX7CmsIlgjwo2fJNn5pghTxcFH5RGugDSxChXA7GO7CxOUCkeLb4p7k6Nly-ssInHkUgT9q0xQG5gln-Yd7y_0wIrC60FW7bevrBxrfaA-ikeIu26cxuokvXyIsIjcAPnB0x_7cPc4JS2M2-4bTitMB3Ct_AewTKL_kjqA'
    },
    stats: [
      { label: 'Handicap', value: '14.2', change: '↓ 0.8 this month', icon: 'trending_down', changePositive: true },
      { label: 'Drills', value: '24', change: 'Completed total', icon: 'golf_course', changePositive: false }
    ],
    schedule: [
      { day: 'Mon', date: '12', title: 'Grip Basics', status: 'completed' },
      { day: 'Tue', date: '13', title: 'Smart Review', subtitle: 'Personalized quiz based on play', status: 'current' },
      { day: 'Wed', date: '14', title: 'Hip Rotation', subtitle: '15 min • Iron Play', status: 'locked' }
    ],
    goals: [
      { icon: 'sports_golf', title: 'Drive Distance > 250y', current: '235y', progress: 80, color: 'blue' },
      { icon: 'show_chart', title: 'Putting Avg < 30', current: '34', progress: 45, color: 'purple' }
    ]
  }

  const handleStartLesson = () => {
    navigate('/lesson/hip-rotation')
  }

  const handleReview = () => {
    navigate('/review')
  }

  return (
    <div className="plan-screen">
      {/* Top App Bar */}
      <div className="plan-screen__top-bar">
        <div className="plan-screen__top-controls">
          <button className="plan-screen__menu-btn" aria-label="Menu">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div 
            className="plan-screen__avatar"
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBrw5OCm3HZKFZyzmaf9QRxVcVTdEuSqZ7bkbwy6OZDUeovPexP4MLw9zZB530Pq153nMkD3ejUzOEyqXqF1AiIKYpviUOJwnco3UXZAz6toEjbiQ6_n9kU7tCR0oNd75cJ58CvUgrGq2RmXTiNa5kYZlxsO7-3P0aCHhdPVPj6UzoudlvXwigsl5QoRbFdNwBI2RG4Y_wpf-bkY6anA9JYz4UaZ2a67k6ZAIdWCyytWhC1fGxZ6N0K0Pjcu7Zgob2FpL4hcBHSePc')" }}
            role="img"
            aria-label="Profile avatar"
          />
        </div>
        <p className="plan-screen__page-title">Your Roadmap</p>
      </div>

      {/* Phase & Progress */}
      <div className="plan-screen__phase-section">
        <h2 className="plan-screen__phase-title">{planData.phase}</h2>
        <div className="plan-screen__phase-progress">
          <div className="plan-screen__progress-header">
            <p className="plan-screen__progress-label">Week {planData.week} of {planData.totalWeeks}</p>
            <p className="plan-screen__progress-percentage">{planData.progress}% Complete</p>
          </div>
          <div className="plan-screen__progress-bar">
            <div 
              className="plan-screen__progress-bar-fill"
              style={{ width: `${planData.progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="plan-screen__spacer" />

      {/* Today's Focus Card */}
      <div className="plan-screen__content">
        <div className="plan-screen__focus-card">
          <div 
            className="plan-screen__focus-image"
            style={{ backgroundImage: `url(${planData.nextLesson.image})` }}
          >
            <div className="plan-screen__focus-overlay">
              <span className="plan-screen__focus-badge">Next Up</span>
            </div>
          </div>
          <div className="plan-screen__focus-content">
            <div className="plan-screen__focus-header">
              <div>
                <p className="plan-screen__focus-title">{planData.nextLesson.title}</p>
                <p className="plan-screen__focus-subtitle">
                  {planData.nextLesson.duration} • {planData.nextLesson.category}
                </p>
              </div>
            </div>
            <div className="plan-screen__focus-spacer" />
            <Button
              variant="primary"
              size="medium"
              fullWidth
              icon={<span className="material-symbols-outlined">play_arrow</span>}
              iconPosition="left"
              onClick={handleStartLesson}
            >
              Start Lesson
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="plan-screen__stats">
          {planData.stats.map((stat, index) => (
            <div key={index} className="plan-screen__stat-card">
              <div className="plan-screen__stat-header">
                <span className="material-symbols-outlined plan-screen__stat-icon">{stat.icon}</span>
                <span className="plan-screen__stat-label">{stat.label}</span>
              </div>
              <p className="plan-screen__stat-value">{stat.value}</p>
              <p className={`plan-screen__stat-change ${stat.changePositive ? 'plan-screen__stat-change--positive' : ''}`}>
                {stat.change}
              </p>
            </div>
          ))}
        </div>

        <div className="plan-screen__spacer" />

        {/* Weekly Schedule */}
        <div className="plan-screen__section">
          <div className="plan-screen__section-header">
            <h3 className="plan-screen__section-title">Weekly Schedule</h3>
            <a className="plan-screen__section-link" href="#">View Calendar</a>
          </div>
          <div className="plan-screen__schedule">
            {planData.schedule.map((item, index) => (
              <div 
                key={index}
                className={`plan-screen__schedule-item ${
                  item.status === 'completed' ? 'plan-screen__schedule-item--completed' :
                  item.status === 'current' ? 'plan-screen__schedule-item--current' : ''
                }`}
              >
                {item.status === 'current' && <div className="plan-screen__schedule-indicator" />}
                <div className="plan-screen__schedule-date">
                  <span className={`plan-screen__schedule-day ${item.status === 'current' ? 'plan-screen__schedule-day--active' : ''}`}>
                    {item.day}
                  </span>
                  <span className={`plan-screen__schedule-num ${item.status === 'current' ? 'plan-screen__schedule-num--active' : ''}`}>
                    {item.date}
                  </span>
                </div>
                <div className="plan-screen__schedule-info">
                  <p className={`plan-screen__schedule-title ${item.status === 'completed' ? 'plan-screen__schedule-title--completed' : ''}`}>
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className={`plan-screen__schedule-subtitle ${item.status === 'completed' ? 'plan-screen__schedule-subtitle--completed' : ''}`}>
                      {item.subtitle}
                    </p>
                  )}
                  {item.status === 'completed' && (
                    <p className="plan-screen__schedule-status">Completed</p>
                  )}
                </div>
                {item.status === 'completed' && (
                  <div className="plan-screen__schedule-check">
                    <span className="material-symbols-outlined">check</span>
                  </div>
                )}
                {item.status === 'current' && (
                  <button className="plan-screen__schedule-btn" onClick={handleReview}>
                    Review
                  </button>
                )}
                {item.status === 'locked' && (
                  <div className="plan-screen__schedule-lock">
                    <span className="material-symbols-outlined">lock</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="plan-screen__spacer" />

        {/* Long-Term Goals */}
        <div className="plan-screen__section">
          <h3 className="plan-screen__section-title">Long-Term Goals</h3>
          <div className="plan-screen__goals">
            {planData.goals.map((goal, index) => (
              <div key={index} className="plan-screen__goal-card">
                <div className="plan-screen__goal-header">
                  <div className="plan-screen__goal-left">
                    <div className={`plan-screen__goal-icon plan-screen__goal-icon--${goal.color}`}>
                      <span className="material-symbols-outlined">{goal.icon}</span>
                    </div>
                    <div>
                      <p className="plan-screen__goal-title">{goal.title}</p>
                      <p className="plan-screen__goal-current">Current: {goal.current}</p>
                    </div>
                  </div>
                  <span className={`plan-screen__goal-percentage plan-screen__goal-percentage--${goal.color}`}>
                    {goal.progress}%
                  </span>
                </div>
                <div className="plan-screen__goal-progress">
                  <div 
                    className={`plan-screen__goal-progress-fill plan-screen__goal-progress-fill--${goal.color}`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            ))}
            <button className="plan-screen__add-goal-btn">
              <span className="material-symbols-outlined">add</span>
              <span>Add New Goal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activePage="home" />
    </div>
  )
}

export default PersonalizedPlanScreen

