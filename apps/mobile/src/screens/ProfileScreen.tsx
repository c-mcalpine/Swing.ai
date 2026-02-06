import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Polygon, Line, Circle } from 'react-native-svg';
import { useAuth } from '@/lib/AuthContext';
import { useUserProfile } from '@/hooks/useProfile';
import { useRecentSessions } from '@/hooks/useSessions';
import { useUserAchievements, useAllAchievements } from '@/hooks/useAchievements';
import { BottomNav } from '@/components/BottomNav';
import { colors, spacing } from '@/styles/tokens';

/**
 * Profile Screen - User profile with stats, achievements, and recent sessions
 * Matches web design exactly with radar chart
 */
export function ProfileScreen() {
  const navigation = useNavigation();
  const { userId } = useAuth();

  // Fetch data using hooks
  const { data: profileData, loading: profileLoading, error: profileError } = useUserProfile();
  const { data: sessionsData, loading: sessionsLoading } = useRecentSessions(userId, 3);
  const { data: userAchievements, loading: achievementsLoading } = useUserAchievements(userId);
  const { data: allAchievements, loading: allAchievementsLoading } = useAllAchievements();

  const isLoading =
    profileLoading || sessionsLoading || achievementsLoading || allAchievementsLoading;

  // Format member since date
  const formatMemberSince = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Format session date/time
  const formatSessionDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Map profile data
  const profile = profileData
    ? {
        username: profileData.username || 'Golfer',
        location: profileData.location || 'Unknown Location',
        memberSince: formatMemberSince(
          (profileData as any).member_since || profileData.created_at
        ),
        avatar: profileData.avatar_url || 'https://via.placeholder.com/150',
        badge: (profileData as any).badge || 'PLAYER',
        rank: profileData.rank_title || 'Beginner',
        xp: profileData.xp || 0,
        xpMax: (profileData.xp || 0) + (profileData.xp_to_next || 0) || 100,
        nextRank: (profileData as any).next_rank_title || 'Next Level',
        overallScore: (profileData as any).overall_score || 0,
        tempoScore: (profileData as any).tempo_score || 0,
        speedScore: (profileData as any).speed_score || 0,
        planeScore: (profileData as any).plane_score || 0,
        rotationScore: (profileData as any).rotation_score || 0,
        balanceScore: (profileData as any).balance_score || 0,
        powerScore: (profileData as any).power_score || 0,
      }
    : null;

  // Merge user achievements with all achievements
  const unlockedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || []);
  const badges =
    allAchievements
      ?.map((achievement) => {
        const userAchievement = userAchievements?.find((ua) => ua.achievement_id === achievement.id);
        return {
          id: achievement.id,
          icon: achievement.icon || '🏆',
          name: achievement.name,
          color: achievement.color || 'yellow',
          unlocked: unlockedIds.has(achievement.id),
          unlockedAt: userAchievement?.unlocked_at,
        };
      })
      .sort((a, b) => {
        // Sort: unlocked first, then by unlock date
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        if (a.unlocked && b.unlocked) {
          return (
            new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime()
          );
        }
        return 0;
      }) || [];

  // Map recent sessions
  const recentSessions =
    sessionsData?.map((session) => ({
      id: session.id,
      title: session.title,
      subtitle: `${formatSessionDate(session.started_at)} • ${session.swings_count || 0} Swings`,
      grade: (session as any).grade || 'N/A',
      gradeColor: (session as any).grade_color || 'primary',
      speed: (session as any).avg_speed_mph
        ? `${(session as any).avg_speed_mph} mph`
        : 'N/A',
      image: (session as any).thumbnail_url || 'https://via.placeholder.com/400x200',
    })) || [];

  const xpPercentage = profile ? Math.min(100, (profile.xp / profile.xpMax) * 100) : 0;

  // Calculate radar chart points from scores (0-100)
  const getRadarPoint = (
    score: number,
    angle: number,
    centerX = 150,
    centerY = 110,
    maxRadius = 90
  ) => {
    const radius = (score / 100) * maxRadius;
    const radians = ((angle - 90) * Math.PI) / 180; // -90 to start at top
    const x = centerX + radius * Math.cos(radians);
    const y = centerY + radius * Math.sin(radians);
    return { x, y };
  };

  const radarPoints = profile
    ? [
        getRadarPoint(profile.tempoScore, 0), // Top
        getRadarPoint(profile.speedScore, 60), // Top-right
        getRadarPoint(profile.planeScore, 120), // Bottom-right
        getRadarPoint(profile.rotationScore, 180), // Bottom
        getRadarPoint(profile.balanceScore, 240), // Bottom-left
        getRadarPoint(profile.powerScore, 300), // Top-left
      ]
    : [];

  const radarPointsStr = radarPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
        <BottomNav />
      </View>
    );
  }

  // Error state
  if (profileError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorMessage}>Failed to load profile.</Text>
        </View>
        <BottomNav />
      </View>
    );
  }

  // No profile found
  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>👤</Text>
          <Text style={styles.errorMessage}>No profile found for this user.</Text>
        </View>
        <BottomNav />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <SafeAreaView style={styles.safeAreaTop}>
        <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
      </SafeAreaView>

      {/* Scrollable Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{profile.badge}</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{profile.username}</Text>
            <Text style={styles.meta}>
              {profile.location} • Member since {profile.memberSince}
            </Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.section}>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressLabel}>CURRENT RANK</Text>
                <Text style={styles.rankTitle}>{profile.rank}</Text>
              </View>
              <Text style={styles.xpText}>
                {profile.xp} <Text style={styles.xpMax}>/ {profile.xpMax} XP</Text>
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${xpPercentage}%` }]} />
            </View>
            <Text style={styles.nextRank}>Next: {profile.nextRank}</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Swing DNA</Text>
            <TouchableOpacity>
              <Text style={styles.viewHistory}>View History</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statsGlow} />
            <View style={styles.overallScore}>
              <Text style={styles.scoreLabel}>Overall Score</Text>
              <Text style={styles.scoreValue}>
                {profile.overallScore}
                <Text style={styles.scoreMax}>/100</Text>
              </Text>
            </View>

            {/* Radar Chart */}
            <View style={styles.radarContainer}>
              <Svg width="100%" height="100%" viewBox="0 0 300 220" style={styles.radarSvg}>
                {/* Grid Lines */}
                <Polygon
                  fill="none"
                  points="150,20 270,80 270,180 150,220 30,180 30,80"
                  stroke="white"
                  strokeOpacity="0.1"
                  strokeWidth="1"
                />
                <Polygon
                  fill="none"
                  points="150,60 222,96 222,156 150,180 78,156 78,96"
                  stroke="white"
                  strokeOpacity="0.1"
                  strokeWidth="1"
                />
                <Line stroke="white" strokeOpacity="0.1" strokeWidth="1" x1="150" x2="150" y1="110" y2="20" />
                <Line stroke="white" strokeOpacity="0.1" strokeWidth="1" x1="150" x2="270" y1="110" y2="80" />
                <Line stroke="white" strokeOpacity="0.1" strokeWidth="1" x1="150" x2="270" y1="110" y2="180" />
                <Line stroke="white" strokeOpacity="0.1" strokeWidth="1" x1="150" x2="150" y1="110" y2="220" />
                <Line stroke="white" strokeOpacity="0.1" strokeWidth="1" x1="150" x2="30" y1="110" y2="180" />
                <Line stroke="white" strokeOpacity="0.1" strokeWidth="1" x1="150" x2="30" y1="110" y2="80" />

                {/* Data Shape */}
                <Polygon fill={colors.primary} fillOpacity="0.2" points={radarPointsStr} />
                <Polygon
                  fill="none"
                  points={radarPointsStr}
                  stroke={colors.primary}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {radarPoints.map((point, idx) => (
                  <Circle key={idx} cx={point.x} cy={point.y} fill={colors.primary} r="4" />
                ))}
              </Svg>

              {/* Labels */}
              <Text style={[styles.radarLabel, styles.radarLabelTop]}>TEMPO</Text>
              <Text style={[styles.radarLabel, styles.radarLabelTopRight]}>SPEED</Text>
              <Text style={[styles.radarLabel, styles.radarLabelBottomRight]}>PLANE</Text>
              <Text style={[styles.radarLabel, styles.radarLabelBottom]}>ROTATION</Text>
              <Text style={[styles.radarLabel, styles.radarLabelBottomLeft]}>BALANCE</Text>
              <Text style={[styles.radarLabel, styles.radarLabelTopLeft]}>POWER</Text>
            </View>
          </View>
        </View>

        {/* Trophy Case */}
        <View style={styles.trophySection}>
          <Text style={styles.sectionTitle}>Trophy Case</Text>
          {badges.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badges}
            >
              {badges.map((badge) => (
                <View
                  key={badge.id}
                  style={[styles.badgeItem, !badge.unlocked && styles.badgeItemLocked]}
                >
                  <View
                    style={[
                      styles.badgeCircle,
                      badge.unlocked
                        ? styles[`badgeCircle${badge.color.charAt(0).toUpperCase() + badge.color.slice(1)}` as keyof typeof styles]
                        : styles.badgeCircleLocked,
                    ]}
                  >
                    <Text style={styles.badgeIcon}>
                      {badge.unlocked ? badge.icon : '🔒'}
                    </Text>
                  </View>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No achievements yet. Complete lessons and drills to earn badges!
              </Text>
            </View>
          )}
        </View>

        {/* Recent Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {recentSessions.length > 0 ? (
            <View style={styles.sessions}>
              {recentSessions.map((session) => (
                <TouchableOpacity key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionImageWrapper}>
                    <Image source={{ uri: session.image }} style={styles.sessionImage} />
                    <View style={styles.sessionOverlay} />
                    <Text style={styles.sessionPlay}>▶️</Text>
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle} numberOfLines={1}>
                      {session.title}
                    </Text>
                    <Text style={styles.sessionSubtitle}>{session.subtitle}</Text>
                  </View>
                  <View style={styles.sessionStats}>
                    <View
                      style={[
                        styles.sessionGrade,
                        session.gradeColor === 'primary'
                          ? styles.sessionGradePrimary
                          : styles.sessionGradeYellow,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sessionGradeText,
                          session.gradeColor === 'primary'
                            ? styles.sessionGradeTextPrimary
                            : styles.sessionGradeTextYellow,
                        ]}
                      >
                        {session.grade}
                      </Text>
                    </View>
                    <Text style={styles.sessionSpeed}>{session.speed}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No practice sessions yet. Start practicing to see your history here!
              </Text>
            </View>
          )}
        </View>

        {/* Bottom padding for nav */}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeAreaTop: {
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: 16,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 34, 22, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  settingsIcon: {
    fontSize: 24,
  },

  // Content
  content: {
    flex: 1,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '700',
  },
  profileInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  meta: {
    color: colors.gray[400],
    fontSize: 14,
    marginTop: 4,
  },

  // Progress Card
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  progressCard: {
    backgroundColor: '#1c271f',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  progressLabel: {
    color: colors.gray[400],
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  rankTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  xpText: {
    fontFamily: 'monospace',
    fontWeight: '500',
    color: colors.white,
  },
  xpMax: {
    color: colors.gray[400],
    fontSize: 14,
  },
  progressBarContainer: {
    position: 'relative',
    height: 12,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 9999,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },
  nextRank: {
    textAlign: 'right',
    color: colors.gray[400],
    fontSize: 12,
    marginTop: 8,
  },

  // Stats Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  viewHistory: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: '#1c271f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  statsGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -96 }, { translateY: -96 }],
    width: 192,
    height: 192,
    backgroundColor: 'rgba(19, 236, 91, 0.05)',
    borderRadius: 96,
  },
  overallScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreLabel: {
    color: colors.gray[300],
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.primary,
  },
  scoreMax: {
    fontSize: 18,
    color: colors.gray[500],
    fontWeight: '400',
  },

  // Radar Chart
  radarContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarSvg: {
    width: '100%',
    height: '100%',
  },
  radarLabel: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '700',
  },
  radarLabelTop: {
    top: 0,
    left: '50%',
    transform: [{ translateX: -20 }],
    color: colors.primary,
  },
  radarLabelTopRight: {
    top: '25%',
    right: 0,
    color: colors.gray[400],
  },
  radarLabelBottomRight: {
    bottom: '25%',
    right: 0,
    color: colors.gray[400],
  },
  radarLabelBottom: {
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -35 }],
    color: colors.gray[400],
  },
  radarLabelBottomLeft: {
    bottom: '25%',
    left: 0,
    color: colors.gray[400],
  },
  radarLabelTopLeft: {
    top: '25%',
    left: 0,
    color: colors.gray[400],
  },

  // Trophy Case
  trophySection: {
    paddingLeft: 16,
    marginBottom: 32,
  },
  badges: {
    gap: 16,
    paddingRight: 16,
    paddingVertical: 8,
  },
  badgeItem: {
    alignItems: 'center',
    gap: 8,
    minWidth: 80,
  },
  badgeItemLocked: {
    opacity: 0.5,
  },
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  badgeCircleYellow: {
    backgroundColor: '#eab308',
  },
  badgeCircleSilver: {
    backgroundColor: '#9ca3af',
  },
  badgeCircleOrange: {
    backgroundColor: '#f97316',
  },
  badgeCircleLocked: {
    backgroundColor: '#1c271f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
  badgeIcon: {
    fontSize: 32,
    color: colors.background,
  },
  badgeName: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    color: colors.white,
  },

  // Recent Sessions
  sessions: {
    gap: 12,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#1c271f',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  sessionImageWrapper: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sessionImage: {
    width: '100%',
    height: '100%',
  },
  sessionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  sessionPlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -8 }, { translateY: -8 }],
    fontSize: 20,
  },
  sessionInfo: {
    flex: 1,
    minWidth: 0,
  },
  sessionTitle: {
    fontWeight: '700',
    color: colors.white,
  },
  sessionSubtitle: {
    fontSize: 12,
    color: colors.gray[400],
  },
  sessionStats: {
    alignItems: 'flex-end',
    gap: 4,
  },
  sessionGrade: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  sessionGradePrimary: {
    backgroundColor: 'rgba(19, 236, 91, 0.2)',
  },
  sessionGradeYellow: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  sessionGradeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sessionGradeTextPrimary: {
    color: colors.primary,
  },
  sessionGradeTextYellow: {
    color: '#eab308',
  },
  sessionSpeed: {
    fontSize: 10,
    color: colors.gray[400],
  },

  // Empty State
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
});
