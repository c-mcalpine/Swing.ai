import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useUserProfile, useRecentSessions, useUserAchievements, useAllAchievements } from '../hooks/useProfile';
import { DEV_USER_ID } from '../config/devUser';
import '../styles/screens/ProfileScreen.css';

function ProfileScreen() {
  const navigate = useNavigate();

  // TODO: Replace with actual user ID from auth context
  const userId = DEV_USER_ID;

  // Fetch data using hooks
  const { data: profileData, loading: profileLoading, error: profileError } = useUserProfile(userId);
  const { data: sessionsData, loading: sessionsLoading } = useRecentSessions(userId, 3);
  const { data: userAchievements, loading: achievementsLoading } = useUserAchievements(userId);
  const { data: allAchievements, loading: allAchievementsLoading } = useAllAchievements();

  const isLoading = profileLoading || sessionsLoading || achievementsLoading || allAchievementsLoading;

  // Format member since date
  const formatMemberSince = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Format session date/time
  const formatSessionDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Map profile data
  const profile = profileData ? {
    username: profileData.username || 'Golfer',
    location: profileData.location || 'Unknown Location',
    memberSince: formatMemberSince(profileData.member_since || profileData.created_at),
    avatar: profileData.avatar_url || 'https://via.placeholder.com/150',
    badge: profileData.badge || 'PLAYER',
    rank: profileData.rank_title || 'Beginner',
    xp: profileData.xp || 0,
    xpMax: ((profileData.xp || 0) + (profileData.xp_to_next || 0)) || 100,
    nextRank: profileData.next_rank_title || 'Next Level',
    overallScore: profileData.overall_score || 0,
    tempoScore: profileData.tempo_score || 0,
    speedScore: profileData.speed_score || 0,
    planeScore: profileData.plane_score || 0,
    rotationScore: profileData.rotation_score || 0,
    balanceScore: profileData.balance_score || 0,
    powerScore: profileData.power_score || 0
  } : null;

  // Merge user achievements with all achievements
  const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
  const badges = allAchievements?.map(achievement => {
    const userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id);
    return {
      id: achievement.id,
      icon: achievement.icon || 'emoji_events',
      name: achievement.name,
      color: achievement.color || 'yellow',
      unlocked: unlockedIds.has(achievement.id),
      unlockedAt: userAchievement?.unlocked_at
    };
  }).sort((a, b) => {
    // Sort: unlocked first, then by unlock date
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    if (a.unlocked && b.unlocked) {
      return new Date(b.unlockedAt) - new Date(a.unlockedAt);
    }
    return 0;
  }) || [];

  // Map recent sessions
  const recentSessions = sessionsData?.map(session => ({
    id: session.id,
    title: session.title,
    subtitle: `${formatSessionDate(session.started_at)} • ${session.swings_count || 0} Swings`,
    grade: session.grade || 'N/A',
    gradeColor: session.grade_color || 'primary',
    speed: session.avg_speed_mph ? `${session.avg_speed_mph} mph` : 'N/A',
    image: session.thumbnail_url || 'https://via.placeholder.com/400x200'
  })) || [];

  const xpPercentage = profile ? Math.min(100, (profile.xp / profile.xpMax) * 100) : 0;

  // Calculate radar chart points from scores (0-100)
  // Convert scores to SVG coordinates
  const getRadarPoint = (score, angle, centerX = 150, centerY = 110, maxRadius = 90) => {
    const radius = (score / 100) * maxRadius;
    const radians = (angle - 90) * Math.PI / 180; // -90 to start at top
    const x = centerX + radius * Math.cos(radians);
    const y = centerY + radius * Math.sin(radians);
    return { x, y };
  };

  const radarPoints = profile ? [
    getRadarPoint(profile.tempoScore, 0),      // Top
    getRadarPoint(profile.speedScore, 60),     // Top-right
    getRadarPoint(profile.planeScore, 120),    // Bottom-right
    getRadarPoint(profile.rotationScore, 180), // Bottom
    getRadarPoint(profile.balanceScore, 240),  // Bottom-left
    getRadarPoint(profile.powerScore, 300)     // Top-left
  ] : [];

  const radarPointsStr = radarPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Loading state
  if (isLoading) {
    return (
      <div className="profile-screen">
        <header className="profile-screen__header">
          <h2 className="profile-screen__title">Profile</h2>
          <button className="profile-screen__settings-btn">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </header>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div className="spinner" />
          <p>Loading profile...</p>
        </div>
        <BottomNav activePage="profile" />
      </div>
    );
  }

  // Error state
  if (profileError) {
    const isRLSError = profileError.code === '42501' || 
                       profileError.message?.includes('permission denied');
    
    return (
      <div className="profile-screen">
        <header className="profile-screen__header">
          <h2 className="profile-screen__title">Profile</h2>
          <button className="profile-screen__settings-btn">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </header>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          flexDirection: 'column',
          gap: '1rem',
          padding: '2rem'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--error)' }}>
            {isRLSError ? 'lock' : 'error'}
          </span>
          <p style={{ textAlign: 'center' }}>
            {isRLSError ? 'Permission denied. Check RLS policies.' : 'Failed to load profile.'}
          </p>
          <button 
            className="profile-screen__settings-btn" 
            onClick={() => window.location.reload()}
            style={{ padding: '0.5rem 1rem' }}
          >
            Retry
          </button>
        </div>
        <BottomNav activePage="profile" />
      </div>
    );
  }

  // No profile found
  if (!profile) {
    return (
      <div className="profile-screen">
        <header className="profile-screen__header">
          <h2 className="profile-screen__title">Profile</h2>
          <button className="profile-screen__settings-btn">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </header>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          flexDirection: 'column',
          gap: '1rem',
          padding: '2rem'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--warning)' }}>
            person_off
          </span>
          <p style={{ textAlign: 'center' }}>No profile found for this user.</p>
        </div>
        <BottomNav activePage="profile" />
      </div>
    );
  }

  return (
    <div className="profile-screen">
      {/* Top App Bar */}
      <header className="profile-screen__header">
        <h2 className="profile-screen__title">Profile</h2>
        <button className="profile-screen__settings-btn">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      {/* Profile Header */}
      <div className="profile-screen__profile-header">
        <div className="profile-screen__avatar-wrapper">
          <div 
            className="profile-screen__avatar"
            style={{ backgroundImage: `url('${profile.avatar}')` }}
          />
          <div className="profile-screen__badge">{profile.badge}</div>
        </div>
        <div className="profile-screen__profile-info">
          <h1 className="profile-screen__username">{profile.username}</h1>
          <p className="profile-screen__meta">
            {profile.location} • Member since {profile.memberSince}
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="profile-screen__section">
        <div className="profile-screen__progress-card">
          <div className="profile-screen__progress-header">
            <div>
              <p className="profile-screen__progress-label">Current Rank</p>
              <p className="profile-screen__rank-title">{profile.rank}</p>
            </div>
            <p className="profile-screen__xp-text">
              {profile.xp} <span className="profile-screen__xp-max">/ {profile.xpMax} XP</span>
            </p>
          </div>
          <div className="profile-screen__progress-bar-container">
            <div 
              className="profile-screen__progress-bar-fill"
              style={{ width: `${xpPercentage}%` }}
            >
              <div className="profile-screen__progress-bar-pulse" />
            </div>
          </div>
          <p className="profile-screen__next-rank">Next: {profile.nextRank}</p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="profile-screen__section">
        <div className="profile-screen__section-header">
          <h2 className="profile-screen__section-title">Swing DNA</h2>
          <button className="profile-screen__view-history">View History</button>
        </div>

        <div className="profile-screen__stats-card">
          <div className="profile-screen__stats-glow" />
          <div className="profile-screen__overall-score">
            <span className="profile-screen__score-label">Overall Score</span>
            <span className="profile-screen__score-value">
              {profile.overallScore}
              <span className="profile-screen__score-max">/100</span>
            </span>
          </div>

          {/* Radar Chart */}
          <div className="profile-screen__radar-container">
            <svg className="profile-screen__radar-svg" viewBox="0 0 300 220">
              {/* Grid Lines */}
              <polygon
                className="profile-screen__radar-grid"
                fill="none"
                points="150,20 270,80 270,180 150,220 30,180 30,80"
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeWidth="1"
              />
              <polygon
                className="profile-screen__radar-grid"
                fill="none"
                points="150,60 222,96 222,156 150,180 78,156 78,96"
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeWidth="1"
              />
              <line className="profile-screen__radar-grid" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" x1="150" x2="150" y1="110" y2="20" />
              <line className="profile-screen__radar-grid" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" x1="150" x2="270" y1="110" y2="80" />
              <line className="profile-screen__radar-grid" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" x1="150" x2="270" y1="110" y2="180" />
              <line className="profile-screen__radar-grid" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" x1="150" x2="150" y1="110" y2="220" />
              <line className="profile-screen__radar-grid" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" x1="150" x2="30" y1="110" y2="180" />
              <line className="profile-screen__radar-grid" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" x1="150" x2="30" y1="110" y2="80" />
              
              {/* Data Shape */}
              <polygon
                className="profile-screen__radar-data-fill"
                points={radarPointsStr}
              />
              <polygon
                className="profile-screen__radar-data-stroke"
                fill="none"
                points={radarPointsStr}
              />
              
              {/* Data Points */}
              {radarPoints.map((point, idx) => (
                <circle 
                  key={idx}
                  cx={point.x} 
                  cy={point.y} 
                  fill="#13ec5b" 
                  r="4" 
                />
              ))}
            </svg>
            
            {/* Labels */}
            <div className="profile-screen__radar-label profile-screen__radar-label--top">TEMPO</div>
            <div className="profile-screen__radar-label profile-screen__radar-label--top-right">SPEED</div>
            <div className="profile-screen__radar-label profile-screen__radar-label--bottom-right">PLANE</div>
            <div className="profile-screen__radar-label profile-screen__radar-label--bottom">ROTATION</div>
            <div className="profile-screen__radar-label profile-screen__radar-label--bottom-left">BALANCE</div>
            <div className="profile-screen__radar-label profile-screen__radar-label--top-left">POWER</div>
          </div>
        </div>
      </div>

      {/* Trophy Case */}
      <div className="profile-screen__trophy-section">
        <h2 className="profile-screen__section-title">Trophy Case</h2>
        {badges.length > 0 ? (
          <div className="profile-screen__badges">
            {badges.map((badge) => (
              <div 
                key={badge.id} 
                className={`profile-screen__badge-item ${
                  !badge.unlocked ? 'profile-screen__badge-item--locked' : ''
                }`}
              >
                <div 
                  className={`profile-screen__badge-circle profile-screen__badge-circle--${badge.unlocked ? badge.color : 'locked'}`}
                >
                  <span className="material-symbols-outlined profile-screen__badge-icon">
                    {badge.unlocked ? badge.icon : 'lock'}
                  </span>
                </div>
                <span className="profile-screen__badge-name">{badge.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
            No achievements yet. Complete lessons and drills to earn badges!
          </p>
        )}
      </div>

      {/* Recent Sessions */}
      <div className="profile-screen__section">
        <h2 className="profile-screen__section-title">Recent Sessions</h2>
        {recentSessions.length > 0 ? (
          <div className="profile-screen__sessions">
            {recentSessions.map((session) => (
              <div key={session.id} className="profile-screen__session-card">
                <div 
                  className="profile-screen__session-image"
                  style={{ backgroundImage: `url('${session.image}')` }}
                >
                  <div className="profile-screen__session-overlay" />
                  <span className="material-symbols-outlined profile-screen__session-play">
                    play_circle
                  </span>
                </div>
                <div className="profile-screen__session-info">
                  <h3 className="profile-screen__session-title">{session.title}</h3>
                  <p className="profile-screen__session-subtitle">{session.subtitle}</p>
                </div>
                <div className="profile-screen__session-stats">
                  <div 
                    className={`profile-screen__session-grade profile-screen__session-grade--${session.gradeColor}`}
                  >
                    {session.grade}
                  </div>
                  <span className="profile-screen__session-speed">{session.speed}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
            No practice sessions yet. Start practicing to see your history here!
          </p>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activePage="profile" />
    </div>
  );
}

export default ProfileScreen;

