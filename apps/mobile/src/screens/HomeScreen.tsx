import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  ImageBackground,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/lib/AuthContext';
import { useUserProfile, useStreak } from '@/hooks/useProfile';
import { useDailyLesson } from '@/hooks/useLessonProgress';
import { useQuickDrills } from '@/hooks/useDrillAssignment';
import { BottomNav } from '@/components/BottomNav';
import { colors, spacing } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';

type HomeScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, 'Home'>;

/**
 * Home Screen - Main dashboard with gamification, daily lesson, and quick drills
 * Matches web design exactly
 */
export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { userId } = useAuth();

  // Fetch data using hooks
  const { data: profile, loading: profileLoading, error: profileError } = useUserProfile();
  const { streak, loading: streakLoading } = useStreak();
  const { data: dailyLessonData, loading: lessonLoading } = useDailyLesson(userId);
  const { data: quickDrillsData, loading: drillsLoading } = useQuickDrills(userId, 2);

  // Loading state
  const isLoading = profileLoading || streakLoading || lessonLoading || drillsLoading;

  // Calculate percentile from rank (placeholder logic)
  const getPercentile = (level?: number) => {
    if (!level) return 'Top 50%';
    if (level >= 10) return 'Top 5%';
    if (level >= 7) return 'Top 10%';
    if (level >= 5) return 'Top 25%';
    return 'Top 50%';
  };

  // Default values
  const user = profile
    ? {
        name: profile.username || 'Golfer',
        level: profile.level || 1,
        currentXP: profile.xp || 0,
        maxXP: (profile.xp || 0) + (profile.xp_to_next || 0) || 100,
        streak: streak,
        rank: profile.rank_title || 'Beginner',
        percentile: getPercentile(profile.level),
        profileImage: profile.avatar_url || 'https://via.placeholder.com/150',
      }
    : null;

  const dailyLesson = dailyLessonData?.lesson
    ? {
        id: dailyLessonData.lesson.id,
        title: dailyLessonData.lesson.name,
        description:
          dailyLessonData.lesson.description || 'Complete this lesson to improve your swing',
        duration: `${dailyLessonData.lesson.duration_min || 15} mins`,
        location: dailyLessonData.lesson.location || 'Any Location',
        xp: dailyLessonData.lesson.xp_reward || 50,
        image:
          dailyLessonData.lesson.thumbnail_url || 'https://via.placeholder.com/400x200',
      }
    : null;

  const quickDrills =
    quickDrillsData?.map((assignment) => ({
      id: assignment.drill_id,
      title: assignment.drill.name,
      description:
        assignment.drill.objective || assignment.drill.description || 'Practice drill',
      duration: `${assignment.drill.min_duration_min || 5}m`,
      xp: assignment.drill.xp_reward || 10,
      image: assignment.drill.thumbnail_url || 'https://via.placeholder.com/300x200',
    })) || [];

  const xpPercentage = user ? Math.min(100, (user.currentXP / user.maxXP) * 100) : 0;
  const xpToNextLevel = user ? (profile!.xp_to_next || 0) : 0;

  const handleStartLesson = () => {
    if (dailyLesson) {
      // Navigate to lesson (placeholder)
      console.log('Navigate to lesson:', dailyLesson.id);
    }
  };

  const handleViewPlan = () => {
    // Navigate to personalized plan (placeholder)
    console.log('Navigate to personalized plan');
  };

  const handleQuickDrill = (drillId: string) => {
    // Navigate to drill (placeholder)
    console.log('Navigate to drill:', drillId);
  };

  const handleCaptureSwing = () => {
    navigation.navigate('Capture');
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your personalized dashboard...</Text>
        </View>
        <BottomNav />
      </View>
    );
  }

  // Error state
  if (profileError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to Load Profile</Text>
          <Text style={styles.errorMessage}>{profileError.message}</Text>
        </View>
        <BottomNav />
      </View>
    );
  }

  // No user profile
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>👤</Text>
          <Text style={styles.errorTitle}>No Profile Found</Text>
          <Text style={styles.errorMessage}>
            Please complete onboarding to set up your profile.
          </Text>
        </View>
        <BottomNav />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <SafeAreaView style={styles.safeAreaTop}>
        <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.profile}>
            <View style={styles.profileAvatarWrapper}>
              <Image
                source={{ uri: user.profileImage }}
                style={styles.profileAvatar}
              />
              <View style={styles.profileLevel}>
                <Text style={styles.profileLevelText}>Lvl {user.level}</Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileGreeting}>Good Morning,</Text>
              <Text style={styles.profileName}>{user.name}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>
      </SafeAreaView>

      {/* Scrollable Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Gamification Dashboard */}
        <View style={styles.gamification}>
          {/* Status Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.statusPills}
            contentContainerStyle={styles.statusPillsContent}
          >
            <View style={styles.statusPill}>
              <Text style={[styles.statusIcon, styles.statusIconFire]}>🔥</Text>
              <Text style={styles.statusText}>{user.streak} Day Streak</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={[styles.statusIcon, styles.statusIconRank]}>🏅</Text>
              <Text style={styles.statusText}>{user.rank}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={[styles.statusIcon, styles.statusIconTrend]}>📈</Text>
              <Text style={styles.statusText}>{user.percentile}</Text>
            </View>
          </ScrollView>

          {/* XP Progress Card */}
          <View style={styles.xpCard}>
            <View style={styles.xpCardTrophy}>
              <Text style={styles.xpCardTrophyIcon}>🏆</Text>
            </View>
            <View style={styles.xpCardHeader}>
              <View style={styles.xpCardLevel}>
                <Text style={styles.xpCardLabel}>CURRENT LEVEL</Text>
                <Text style={styles.xpCardLevelNum}>Level {user.level}</Text>
              </View>
              <View style={styles.xpCardStats}>
                <Text style={styles.xpCurrent}>{user.currentXP}</Text>
                <Text style={styles.xpMax}> / {user.maxXP} XP</Text>
              </View>
            </View>
            <View style={styles.xpProgress}>
              <View style={styles.xpProgressBar}>
                <View style={[styles.xpProgressFill, { width: `${xpPercentage}%` }]} />
              </View>
              <Text style={styles.xpRemaining}>
                {xpToNextLevel} XP to Level {user.level + 1}
              </Text>
            </View>
          </View>
        </View>

        {/* Capture Swing CTA */}
        <View style={styles.captureCta}>
          <TouchableOpacity style={styles.captureBtn} onPress={handleCaptureSwing}>
            <Text style={styles.captureBtnIcon}>📹</Text>
            <Text style={styles.captureBtnText}>Capture Swing</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Today's Practice Section */}
        <View style={styles.practice}>
          <View style={styles.practiceHeader}>
            <Text style={styles.practiceTitle}>Today's Practice</Text>
            <TouchableOpacity onPress={handleViewPlan}>
              <Text style={styles.practiceLink}>View Plan</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Lesson Card */}
          {dailyLesson ? (
            <View style={styles.heroLesson}>
              <View style={styles.lessonCardHero}>
                <ImageBackground
                  source={{ uri: dailyLesson.image }}
                  style={styles.lessonImage}
                  imageStyle={styles.lessonImageStyle}
                >
                  <View style={styles.lessonImageOverlay} />
                  <View style={styles.lessonBadge}>
                    <Text style={styles.lessonBadgeIcon}>⭐</Text>
                    <Text style={styles.lessonBadgeText}>Daily Recommended</Text>
                  </View>
                </ImageBackground>
                <View style={styles.lessonContent}>
                  <View style={styles.lessonHeader}>
                    <View>
                      <Text style={styles.lessonTitle}>{dailyLesson.title}</Text>
                      <Text style={styles.lessonDescription}>{dailyLesson.description}</Text>
                    </View>
                  </View>
                  <View style={styles.lessonMeta}>
                    <View style={styles.lessonMetaItem}>
                      <Text style={styles.lessonMetaIcon}>⏱️</Text>
                      <Text style={styles.lessonMetaText}>{dailyLesson.duration}</Text>
                    </View>
                    <View style={styles.lessonMetaItem}>
                      <Text style={styles.lessonMetaIcon}>⛳</Text>
                      <Text style={styles.lessonMetaText}>{dailyLesson.location}</Text>
                    </View>
                    <View style={styles.lessonXp}>
                      <Text style={styles.lessonXpText}>+{dailyLesson.xp} XP</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.lessonBtn} onPress={handleStartLesson}>
                    <Text style={styles.lessonBtnIcon}>▶</Text>
                    <Text style={styles.lessonBtnText}>Start Daily Lesson</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.heroLesson}>
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No daily lesson available yet. Check back soon!
                </Text>
              </View>
            </View>
          )}

          {/* Quick Drills Carousel */}
          <View style={styles.quickDrills}>
            <Text style={styles.quickDrillsTitle}>Quick Drills</Text>
            {quickDrills.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickDrillsScroll}
              >
                {quickDrills.map((drill) => (
                  <TouchableOpacity
                    key={drill.id}
                    style={styles.drillCard}
                    onPress={() => handleQuickDrill(drill.id)}
                  >
                    <Image source={{ uri: drill.image }} style={styles.drillImage} />
                    <View style={styles.drillContent}>
                      <Text style={styles.drillTitle} numberOfLines={1}>
                        {drill.title}
                      </Text>
                      <Text style={styles.drillDescription} numberOfLines={1}>
                        {drill.description}
                      </Text>
                      <View style={styles.drillMeta}>
                        <View style={styles.drillDuration}>
                          <Text style={styles.drillDurationIcon}>⏱</Text>
                          <Text style={styles.drillDurationText}>{drill.duration}</Text>
                        </View>
                        <Text style={styles.drillXp}>+{drill.xp} XP</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No drills assigned yet. Complete your first lesson to unlock drills!
                </Text>
              </View>
            )}
          </View>
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
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Content
  content: {
    flex: 1,
  },

  // Header
  header: {
    backgroundColor: 'rgba(16, 34, 22, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatarWrapper: {
    position: 'relative',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileLevel: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1c271f',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileLevelText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  profileInfo: {
    gap: 2,
  },
  profileGreeting: {
    fontSize: 12,
    color: '#9db9a6',
    fontWeight: '500',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  notificationBtn: {
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    backgroundColor: '#ef4444',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.background,
  },

  // Gamification Dashboard
  gamification: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
  },
  statusPills: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  statusPillsContent: {
    gap: 12,
    paddingRight: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1c271f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statusIcon: {
    fontSize: 20,
  },
  statusIconFire: {},
  statusIconRank: {},
  statusIconTrend: {},
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },

  // XP Card
  xpCard: {
    backgroundColor: '#1c271f',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  xpCardTrophy: {
    position: 'absolute',
    top: 12,
    right: 12,
    opacity: 0.1,
  },
  xpCardTrophyIcon: {
    fontSize: 120,
  },
  xpCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
    position: 'relative',
    zIndex: 10,
  },
  xpCardLevel: {
    gap: 4,
  },
  xpCardLabel: {
    fontSize: 12,
    color: '#9db9a6',
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  xpCardLevelNum: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  xpCardStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  xpCurrent: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 18,
  },
  xpMax: {
    color: colors.gray[400],
    fontSize: 14,
    fontWeight: '500',
  },
  xpProgress: {
    position: 'relative',
    zIndex: 10,
  },
  xpProgressBar: {
    height: 12,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  xpProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 9999,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },
  xpRemaining: {
    fontSize: 12,
    color: '#9db9a6',
    marginTop: 8,
    textAlign: 'right',
  },

  // Capture CTA
  captureCta: {
    paddingHorizontal: 16,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  captureBtnIcon: {
    fontSize: 24,
  },
  captureBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a1510',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 16,
    marginHorizontal: 16,
  },

  // Practice Section
  practice: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  practiceHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  practiceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  practiceLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },

  // Hero Lesson
  heroLesson: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  lessonCardHero: {
    backgroundColor: '#1c271f',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  lessonImage: {
    height: 224,
    width: '100%',
    justifyContent: 'flex-start',
  },
  lessonImageStyle: {
    resizeMode: 'cover',
  },
  lessonImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 39, 31, 0.4)',
  },
  lessonBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  lessonBadgeIcon: {
    fontSize: 14,
  },
  lessonBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  lessonContent: {
    padding: 20,
    marginTop: -48,
    position: 'relative',
    zIndex: 10,
  },
  lessonHeader: {},
  lessonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  lessonDescription: {
    color: '#9db9a6',
    fontSize: 14,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  lessonMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lessonMetaIcon: {
    fontSize: 18,
  },
  lessonMetaText: {
    color: '#9db9a6',
    fontSize: 14,
  },
  lessonXp: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(19, 236, 91, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  lessonXpText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  lessonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    borderRadius: 9999,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 4,
  },
  lessonBtnIcon: {
    fontSize: 18,
    color: colors.background,
  },
  lessonBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },

  // Quick Drills
  quickDrills: {
    paddingLeft: 16,
  },
  quickDrillsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 12,
  },
  quickDrillsScroll: {
    gap: 16,
    paddingRight: 16,
  },
  drillCard: {
    width: 280,
    backgroundColor: '#1c271f',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  drillImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  drillContent: {
    flex: 1,
    gap: 4,
  },
  drillTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.white,
  },
  drillDescription: {
    color: '#9db9a6',
    fontSize: 12,
    marginBottom: 4,
  },
  drillMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drillDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  drillDurationIcon: {
    fontSize: 14,
  },
  drillDurationText: {
    color: colors.gray[400],
    fontSize: 12,
    fontWeight: '500',
  },
  drillXp: {
    fontSize: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: colors.white,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },

  // Empty State
  emptyState: {
    padding: 32,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyStateText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
});
