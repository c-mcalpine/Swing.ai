import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useWeeklyLeaderboard, useMyWeeklyRank } from '../hooks/useLeaderboard';
import { useChallengesWithProgress } from '../hooks/useChallenges';
import { DEV_USER_ID } from '../config/devUser';
import '../styles/screens/ChallengeLeaderboardScreen.css';

function ChallengeLeaderboardScreen() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('leaderboards');
  const [activeFilter, setActiveFilter] = useState('global');

  // Fetch leaderboard data
  const { data: leaderboardData, loading: leaderboardLoading, error: leaderboardError } = useWeeklyLeaderboard(50);
  const { data: myRankData, loading: myRankLoading } = useMyWeeklyRank(DEV_USER_ID);
  const { data: challengesData, loading: challengesLoading } = useChallengesWithProgress(DEV_USER_ID);

  const isLoading = leaderboardLoading || myRankLoading;

  // Format points with commas
  const formatPoints = (points) => {
    return points.toLocaleString();
  };

  // Calculate percentile
  const calculatePercentile = (rank, total) => {
    if (!rank || !total) return 'Top 50%';
    const percentile = Math.ceil((rank / total) * 100);
    if (percentile <= 5) return 'Top 5%';
    if (percentile <= 10) return 'Top 10%';
    if (percentile <= 25) return 'Top 25%';
    return `Top ${percentile}%`;
  };

  // Split leaderboard into podium (top 3) and rankings (4+)
  const podium = leaderboardData?.slice(0, 3).map(player => ({
    rank: player.rank_week,
    name: player.username,
    points: formatPoints(player.xp_week),
    avatar: player.avatar_url || 'https://via.placeholder.com/150',
    badge: player.badge,
    rankTitle: player.rank_title
  })) || [];

  // Fill podium with placeholders if needed
  while (podium.length < 3) {
    podium.push({
      rank: podium.length + 1,
      name: 'Awaiting...',
      points: '0',
      avatar: 'https://via.placeholder.com/150',
      badge: null,
      rankTitle: null
    });
  }

  // Reorder podium for display: [2nd, 1st, 3rd]
  const displayPodium = podium.length === 3 ? [podium[1], podium[0], podium[2]] : podium;

  const rankings = leaderboardData?.slice(3).map(player => ({
    rank: player.rank_week,
    name: player.username,
    rankTitle: player.rank_title || 'Golfer',
    points: formatPoints(player.xp_week),
    trend: 'neutral', // TODO: Add week-over-week tracking
    avatar: player.avatar_url || 'https://via.placeholder.com/150',
    badge: player.badge
  })) || [];

  const myRank = myRankData ? {
    rank: myRankData.rank_week,
    name: 'You',
    badge: myRankData.badge || 'Player',
    percentile: calculatePercentile(myRankData.rank_week, leaderboardData?.length),
    points: formatPoints(myRankData.xp_week),
    avatar: myRankData.avatar_url || 'https://via.placeholder.com/150'
  } : null;


  return (
    <div className="challenge-leaderboard-screen">
      {/* Header */}
      <header className="challenge-leaderboard-screen__header">
        <div className="challenge-leaderboard-screen__header-top">
          <div className="challenge-leaderboard-screen__icon-badge challenge-leaderboard-screen__icon-badge--trophy">
            <span className="material-symbols-outlined">trophy</span>
          </div>
          <h2 className="challenge-leaderboard-screen__title">Arena</h2>
          <div className="challenge-leaderboard-screen__icon-badge">
            <span className="material-symbols-outlined">notifications</span>
          </div>
        </div>

        {/* Segmented Control */}
        <div className="challenge-leaderboard-screen__segmented-wrapper">
          <div className="challenge-leaderboard-screen__segmented">
            <button
              className={`challenge-leaderboard-screen__segment ${
                activeView === 'leaderboards' ? 'challenge-leaderboard-screen__segment--active' : ''
              }`}
              onClick={() => setActiveView('leaderboards')}
            >
              Leaderboards
            </button>
            <button
              className={`challenge-leaderboard-screen__segment ${
                activeView === 'events' ? 'challenge-leaderboard-screen__segment--active' : ''
              }`}
              onClick={() => setActiveView('events')}
            >
              Events
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="challenge-leaderboard-screen__filters">
          <button
            className={`challenge-leaderboard-screen__filter ${
              activeFilter === 'global' ? 'challenge-leaderboard-screen__filter--active' : ''
            }`}
            onClick={() => setActiveFilter('global')}
          >
            Global
          </button>
          <button
            className={`challenge-leaderboard-screen__filter ${
              activeFilter === 'friends' ? 'challenge-leaderboard-screen__filter--active' : ''
            }`}
            onClick={() => setActiveFilter('friends')}
          >
            Friends
          </button>
          <button
            className={`challenge-leaderboard-screen__filter ${
              activeFilter === 'club' ? 'challenge-leaderboard-screen__filter--active' : ''
            }`}
            onClick={() => setActiveFilter('club')}
          >
            Club
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="challenge-leaderboard-screen__content">
        {/* Loading State */}
        {activeView === 'leaderboards' && isLoading && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '400px',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div className="spinner" />
            <p>Loading leaderboard...</p>
          </div>
        )}

        {/* Error State */}
        {activeView === 'leaderboards' && !isLoading && leaderboardError && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '400px',
            flexDirection: 'column',
            gap: '1rem',
            padding: '2rem'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--error)' }}>
              error
            </span>
            <p style={{ textAlign: 'center' }}>Failed to load leaderboard. Check RLS policies.</p>
          </div>
        )}

        {/* Leaderboards View */}
        {activeView === 'leaderboards' && !isLoading && !leaderboardError && (
          <>

            {/* Podium Section */}
            <div className="challenge-leaderboard-screen__podium">
              <div className="challenge-leaderboard-screen__podium-glow" />
              <div className="challenge-leaderboard-screen__podium-players">
                {displayPodium.map((player) => (
              <div
                key={player.rank}
                className={`challenge-leaderboard-screen__podium-player ${
                  player.rank === 1 ? 'challenge-leaderboard-screen__podium-player--first' : ''
                }`}
              >
                <div className="challenge-leaderboard-screen__podium-avatar-wrapper">
                  {player.rank === 1 && (
                    <div className="challenge-leaderboard-screen__crown">
                      <span className="material-symbols-outlined">crown</span>
                    </div>
                  )}
                  <div
                    className={`challenge-leaderboard-screen__podium-avatar-ring ${
                      player.rank === 1 ? 'challenge-leaderboard-screen__podium-avatar-ring--first' : ''
                    } ${
                      player.rank === 3 ? 'challenge-leaderboard-screen__podium-avatar-ring--third' : ''
                    }`}
                  >
                    <div
                      className="challenge-leaderboard-screen__podium-avatar"
                      style={{ backgroundImage: `url('${player.avatar}')` }}
                    />
                  </div>
                  <div
                    className={`challenge-leaderboard-screen__podium-rank ${
                      player.rank === 1 ? 'challenge-leaderboard-screen__podium-rank--first' : ''
                    }`}
                  >
                    #{player.rank}
                  </div>
                </div>
                  <div className="challenge-leaderboard-screen__podium-info">
                    <p className="challenge-leaderboard-screen__podium-name">{player.name}</p>
                    {player.badge && (
                      <span style={{ 
                        fontSize: '0.625rem', 
                        padding: '0.125rem 0.375rem', 
                        borderRadius: '4px',
                        background: 'var(--primary)',
                        color: 'white',
                        fontWeight: '600',
                        marginTop: '0.125rem'
                      }}>
                        {player.badge}
                      </span>
                    )}
                    <p className="challenge-leaderboard-screen__podium-points">{player.points} pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>


            {/* List Header */}
            <div className="challenge-leaderboard-screen__list-header">
              <span>Golfer</span>
              <span>Score</span>
            </div>

            {/* Ranking List */}
            <div className="challenge-leaderboard-screen__rankings">
              {rankings.length > 0 ? (
                rankings.map((player, index) => (
                  <div
                    key={player.rank}
                    className={`challenge-leaderboard-screen__rank-card ${
                      index === rankings.length - 1 ? 'challenge-leaderboard-screen__rank-card--faded' : ''
                    }`}
                  >
                    <span className="challenge-leaderboard-screen__rank-number">{player.rank}</span>
                    <div
                      className="challenge-leaderboard-screen__rank-avatar"
                      style={{ backgroundImage: `url('${player.avatar}')` }}
                    />
                    <div className="challenge-leaderboard-screen__rank-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <p className="challenge-leaderboard-screen__rank-name">{player.name}</p>
                        {player.badge && (
                          <span style={{ 
                            fontSize: '0.625rem', 
                            padding: '0.125rem 0.375rem', 
                            borderRadius: '4px',
                            background: 'var(--primary-dim)',
                            color: 'var(--primary)',
                            fontWeight: '600'
                          }}>
                            {player.badge}
                          </span>
                        )}
                      </div>
                      <p className="challenge-leaderboard-screen__rank-handicap">
                        {player.rankTitle}
                      </p>
                    </div>
                    <div className="challenge-leaderboard-screen__rank-score">
                      <p className="challenge-leaderboard-screen__rank-points">{player.points}</p>
                      <span className="challenge-leaderboard-screen__rank-trend challenge-leaderboard-screen__rank-trend--neutral">
                        -
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No rankings to display yet
                </p>
              )}
            </div>
          </>
        )}

        {/* Events View */}
        {activeView === 'events' && (
          <div style={{ padding: '1rem' }}>
            {challengesLoading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '300px',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div className="spinner" />
                <p>Loading challenges...</p>
              </div>
            ) : challengesData?.length > 0 ? (
              challengesData.map(({ instance, progress }) => {
                const progressPercent = progress 
                  ? Math.min(100, (progress.progress_value / instance.challenge.target_value) * 100)
                  : 0;
                
                return (
                  <div 
                    key={instance.id}
                    style={{
                      background: 'var(--surface-elevated)',
                      borderRadius: '12px',
                      padding: '1rem',
                      marginBottom: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                          {instance.challenge.title}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {instance.challenge.description}
                        </p>
                      </div>
                      {progress?.is_completed && (
                        <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>
                          check_circle
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        <span>{progress ? Math.floor(progress.progress_value) : 0} / {instance.challenge.target_value} {instance.challenge.metric_type}</span>
                        <span style={{ color: 'var(--primary)' }}>+{instance.challenge.reward_xp} XP</span>
                      </div>
                      <div style={{ 
                        height: '6px', 
                        background: 'var(--surface)', 
                        borderRadius: '3px', 
                        overflow: 'hidden' 
                      }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${progressPercent}%`, 
                          background: 'linear-gradient(90deg, var(--primary), var(--primary-bright))',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem 1rem',
                color: 'var(--text-secondary)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '1rem' }}>
                  emoji_events
                </span>
                <p>No active challenges at the moment</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Check back soon for new events!
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Sticky My Rank - Only show on leaderboards view */}
      {activeView === 'leaderboards' && myRank && (
        <div className="challenge-leaderboard-screen__my-rank-wrapper">
          <div className="challenge-leaderboard-screen__my-rank">
            <div className="challenge-leaderboard-screen__my-rank-highlight" />
            <span className="challenge-leaderboard-screen__my-rank-number">{myRank.rank}</span>
            <div
              className="challenge-leaderboard-screen__my-rank-avatar"
              style={{ backgroundImage: `url('${myRank.avatar}')` }}
            />
            <div className="challenge-leaderboard-screen__my-rank-info">
              <div className="challenge-leaderboard-screen__my-rank-name-row">
                <p className="challenge-leaderboard-screen__my-rank-name">{myRank.name}</p>
                <span className="challenge-leaderboard-screen__my-rank-badge">{myRank.badge}</span>
              </div>
              <p className="challenge-leaderboard-screen__my-rank-percentile">{myRank.percentile}</p>
            </div>
            <div className="challenge-leaderboard-screen__my-rank-score">
              <p className="challenge-leaderboard-screen__my-rank-points">{myRank.points}</p>
              <p className="challenge-leaderboard-screen__my-rank-label">pts</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav activePage="challenge" />
    </div>
  );
}

export default ChallengeLeaderboardScreen;

