import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useUserProfile, useStreak } from '../hooks/useProfile'
import { useDailyLesson } from '../hooks/useLessonProgress'
import { useQuickDrills } from '../hooks/useDrillAssignment'
import { DEV_USER_ID } from '../config/devUser'
import '../styles/screens/HomeScreen.css'

function HomeScreen() {
  const navigate = useNavigate()
  
  // TODO: Replace with actual user ID from auth context when auth is implemented
  const userId = DEV_USER_ID

  // Fetch data using hooks
  const { data: profile, loading: profileLoading, error: profileError } = useUserProfile(userId)
  const { streak, loading: streakLoading } = useStreak(userId)
  const { data: dailyLessonData, loading: lessonLoading } = useDailyLesson(userId)
  const { data: quickDrillsData, loading: drillsLoading } = useQuickDrills(userId, 2)

  // Loading state
  const isLoading = profileLoading || streakLoading || lessonLoading || drillsLoading

  // Calculate percentile from rank (placeholder logic)
  const getPercentile = (level) => {
    if (!level) return 'Top 50%'
    if (level >= 10) return 'Top 5%'
    if (level >= 7) return 'Top 10%'
    if (level >= 5) return 'Top 25%'
    return 'Top 50%'
  }

  // Default values
  const user = profile ? {
    name: profile.username || 'Golfer',
    level: profile.level || 1,
    currentXP: profile.xp || 0,
    maxXP: ((profile.xp || 0) + (profile.xp_to_next || 0)) || 100,
    streak: streak,
    rank: profile.rank_title || 'Beginner',
    percentile: getPercentile(profile.level),
    profileImage: profile.avatar_url || 'https://via.placeholder.com/150'
  } : null

  const dailyLesson = dailyLessonData?.lesson ? {
    id: dailyLessonData.lesson.id,
    title: dailyLessonData.lesson.name,
    description: dailyLessonData.lesson.description || 'Complete this lesson to improve your swing',
    duration: `${dailyLessonData.lesson.duration_min || 15} mins`,
    location: dailyLessonData.lesson.location || 'Any Location',
    xp: dailyLessonData.lesson.xp_reward || 50,
    image: dailyLessonData.lesson.thumbnail_url || 'https://via.placeholder.com/400x200'
  } : null

  const quickDrills = quickDrillsData?.map(assignment => ({
    id: assignment.drill_id,
    title: assignment.drill.name,
    description: assignment.drill.objective || assignment.drill.description || 'Practice drill',
    duration: `${assignment.drill.min_duration_min || 5}m`,
    xp: assignment.drill.xp_reward || 10,
    image: assignment.drill.thumbnail_url || 'https://via.placeholder.com/300x200'
  })) || []

  const xpPercentage = user ? Math.min(100, (user.currentXP / user.maxXP) * 100) : 0
  const xpToNextLevel = user ? (profile.xp_to_next || 0) : 0

  const handleStartLesson = () => {
    if (dailyLesson) {
      navigate(`/lesson/${dailyLesson.id}`)
    }
  }

  const handleViewPlan = () => {
    navigate('/plan')
  }

  const handleQuickDrill = (drillId) => {
    navigate(`/drill/${drillId}`)
  }

  const handleCaptureSwing = () => {
    navigate('/capture')
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="home-screen">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div className="spinner" />
          <p>Loading your personalized dashboard...</p>
        </div>
        <BottomNav activePage="home" />
      </div>
    )
  }

  // Show specific error messages
  if (profileError) {
    const isRLSError = profileError.code === '42501' || 
                       profileError.message?.includes('permission denied') ||
                       profileError.message?.includes('policy');
    
    const errorTitle = isRLSError 
      ? 'Permission Denied (RLS Policy)' 
      : 'Database Error';
    
    const errorMessage = isRLSError
      ? 'Row Level Security is blocking access. You need to disable RLS or add a read policy for the profiles table in Supabase.'
      : profileError.message || 'Failed to load profile data';
    
    console.error('[HomeScreen] Profile error details:', {
      code: profileError.code,
      message: profileError.message,
      isRLS: isRLSError
    });

    return (
      <div className="home-screen">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '1rem',
          padding: '2rem',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--error)' }}>
            {isRLSError ? 'lock' : 'error'}
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{errorTitle}</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{errorMessage}</p>
          {isRLSError && (
            <div style={{ 
              background: 'var(--surface-elevated)', 
              padding: '1rem', 
              borderRadius: '8px',
              width: '100%',
              textAlign: 'left',
              fontSize: '0.875rem',
              fontFamily: 'monospace'
            }}>
              <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Quick Fix (SQL Editor):</p>
              <code>ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;</code>
            </div>
          )}
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            Error code: {profileError.code || 'Unknown'}
          </p>
          <button 
            className="home-screen__lesson-btn" 
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem' }}
          >
            Retry
          </button>
        </div>
        <BottomNav activePage="home" />
      </div>
    )
  }

  // Show message if no user profile row exists (data is null but no error)
  if (!user) {
    return (
      <div className="home-screen">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '1rem',
          padding: '2rem',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--warning)' }}>
            person_off
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>No Profile Found</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            No profile row exists in the database for this user ID.
          </p>
          <div style={{ 
            background: 'var(--surface-elevated)', 
            padding: '1rem', 
            borderRadius: '8px',
            width: '100%',
            textAlign: 'left',
            fontSize: '0.875rem'
          }}>
            <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>User ID:</p>
            <code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{userId}</code>
            <p style={{ marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>
              Make sure you have a row in the <code>profiles</code> table with this user_id.
            </p>
          </div>
        </div>
        <BottomNav activePage="home" />
      </div>
    )
  }

  return (
    <div className="home-screen">
      {/* Header Section */}
      <header className="home-screen__header">
        <div className="home-screen__header-content">
          <div className="home-screen__profile">
            <div className="home-screen__profile-avatar-wrapper">
              <div 
                className="home-screen__profile-avatar"
                style={{ backgroundImage: `url(${user.profileImage})` }}
                role="img"
                aria-label="Profile picture"
              />
              <div className="home-screen__profile-level">
                Lvl {user.level}
              </div>
            </div>
            <div className="home-screen__profile-info">
              <span className="home-screen__profile-greeting">Good Morning,</span>
              <h1 className="home-screen__profile-name">{user.name}</h1>
            </div>
          </div>
          <button className="home-screen__notification-btn" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
            <span className="home-screen__notification-badge" aria-label="Unread notifications"></span>
          </button>
        </div>
      </header>

      {/* Gamification Dashboard */}
      <section className="home-screen__gamification">
        {/* Status Pills */}
        <div className="home-screen__status-pills">
          <div className="home-screen__status-pill">
            <span className="material-symbols-outlined filled home-screen__status-icon home-screen__status-icon--fire">
              local_fire_department
            </span>
            <span className="home-screen__status-text">{user.streak} Day Streak</span>
          </div>
          <div className="home-screen__status-pill">
            <span className="material-symbols-outlined filled home-screen__status-icon home-screen__status-icon--rank">
              military_tech
            </span>
            <span className="home-screen__status-text">{user.rank}</span>
          </div>
          <div className="home-screen__status-pill">
            <span className="material-symbols-outlined filled home-screen__status-icon home-screen__status-icon--trend">
              trending_up
            </span>
            <span className="home-screen__status-text">{user.percentile}</span>
          </div>
        </div>

        {/* XP Progress Card */}
        <div className="home-screen__xp-card">
          <div className="home-screen__xp-card-trophy">
            <span className="material-symbols-outlined filled">emoji_events</span>
          </div>
          <div className="home-screen__xp-card-header">
            <div className="home-screen__xp-card-level">
              <h3 className="home-screen__xp-card-label">Current Level</h3>
              <p className="home-screen__xp-card-level-num">Level {user.level}</p>
            </div>
            <div className="home-screen__xp-card-stats">
              <span className="home-screen__xp-current">{user.currentXP}</span>
              <span className="home-screen__xp-max"> / {user.maxXP} XP</span>
            </div>
          </div>
          <div className="home-screen__xp-progress">
            <div className="home-screen__xp-progress-bar">
              <div 
                className="home-screen__xp-progress-fill" 
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
            <p className="home-screen__xp-remaining">{xpToNextLevel} XP to Level {user.level + 1}</p>
          </div>
        </div>
      </section>

      {/* Capture Swing CTA */}
      <section className="home-screen__capture-cta">
        <button 
          className="home-screen__capture-btn"
          onClick={handleCaptureSwing}
        >
          <span className="material-symbols-outlined filled">videocam</span>
          <span>Capture Swing</span>
        </button>
      </section>

      <div className="home-screen__divider" />

      {/* Today's Practice Section */}
      <section className="home-screen__practice">
        <div className="home-screen__practice-header">
          <h2 className="home-screen__practice-title">Today's Practice</h2>
          <button 
            className="home-screen__practice-link"
            onClick={handleViewPlan}
          >
            View Plan
          </button>
        </div>

        {/* Hero Lesson Card */}
        {dailyLesson ? (
          <div className="home-screen__hero-lesson">
            <div className="home-screen__lesson-card home-screen__lesson-card--hero">
              <div 
                className="home-screen__lesson-image"
                style={{ backgroundImage: `url(${dailyLesson.image})` }}
                role="img"
                aria-label="Daily recommended lesson"
              >
                <div className="home-screen__lesson-image-overlay" />
                <div className="home-screen__lesson-badge">
                  <span className="material-symbols-outlined">star</span>
                  Daily Recommended
                </div>
              </div>
              <div className="home-screen__lesson-content">
                <div className="home-screen__lesson-header">
                  <div>
                    <h3 className="home-screen__lesson-title">{dailyLesson.title}</h3>
                    <p className="home-screen__lesson-description">{dailyLesson.description}</p>
                  </div>
                </div>
                <div className="home-screen__lesson-meta">
                  <div className="home-screen__lesson-meta-item">
                    <span className="material-symbols-outlined">timer</span>
                    {dailyLesson.duration}
                  </div>
                  <div className="home-screen__lesson-meta-item">
                    <span className="material-symbols-outlined">golf_course</span>
                    {dailyLesson.location}
                  </div>
                  <div className="home-screen__lesson-xp">
                    +{dailyLesson.xp} XP
                  </div>
                </div>
                <button 
                  className="home-screen__lesson-btn"
                  onClick={handleStartLesson}
                >
                  <span className="material-symbols-outlined filled">play_arrow</span>
                  Start Daily Lesson
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="home-screen__hero-lesson">
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              background: 'var(--surface-elevated)',
              borderRadius: '12px'
            }}>
              <p>No daily lesson available yet. Check back soon!</p>
            </div>
          </div>
        )}

        {/* Quick Drills Carousel */}
        <div className="home-screen__quick-drills">
          <h3 className="home-screen__quick-drills-title">Quick Drills</h3>
          {quickDrills.length > 0 ? (
            <div className="home-screen__quick-drills-scroll">
              {quickDrills.map((drill) => (
                <div 
                  key={drill.id}
                  className="home-screen__drill-card"
                  onClick={() => handleQuickDrill(drill.id)}
                >
                  <div 
                    className="home-screen__drill-image"
                    style={{ backgroundImage: `url(${drill.image})` }}
                    role="img"
                    aria-label={drill.title}
                  />
                  <div className="home-screen__drill-content">
                    <h4 className="home-screen__drill-title">{drill.title}</h4>
                    <p className="home-screen__drill-description">{drill.description}</p>
                    <div className="home-screen__drill-meta">
                      <span className="home-screen__drill-duration">
                        <span className="material-symbols-outlined">schedule</span>
                        {drill.duration}
                      </span>
                      <span className="home-screen__drill-xp">+{drill.xp} XP</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              background: 'var(--surface-elevated)',
              borderRadius: '12px',
              marginTop: '1rem'
            }}>
              <p>No drills assigned yet. Complete your first lesson to unlock drills!</p>
            </div>
          )}
        </div>
      </section>

      {/* Bottom Navigation */}
      <BottomNav activePage="home" />
    </div>
  )
}

export default HomeScreen

