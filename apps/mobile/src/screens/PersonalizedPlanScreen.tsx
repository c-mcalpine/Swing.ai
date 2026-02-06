import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Image,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/Button';
import { BottomNav } from '@/components/BottomNav';
import { colors, spacing } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';

type PersonalizedPlanScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'PersonalizedPlan'
>;

/**
 * Personalized Plan Screen - User's learning roadmap and progress
 * Matches web design exactly
 */
export function PersonalizedPlanScreen() {
  const navigation = useNavigation<PersonalizedPlanScreenNavigationProp>();

  const planData = {
    phase: 'Phase 2: Iron Play Mastery',
    week: 4,
    totalWeeks: 12,
    progress: 35,
    nextLesson: {
      title: 'Hip Rotation Drill',
      duration: '15 min',
      category: 'Iron Play',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB6TsnhhK2aieXHkjdr2BIZ-RztPxcggaq7mX68jBwPcTJymVUk4SbAKKA_1n14ntt0gRnm-lmnvxEql86WG8bFa4cmvm2yTX5KxeNblhX7CmsIlgjwo2fJNn5pghTxcFH5RGugDSxChXA7GO7CxOUCkeLb4p7k6Nly-ssInHkUgT9q0xQG5gln-Yd7y_0wIrC60FW7bevrBxrfaA-ikeIu26cxuokvXyIsIjcAPnB0x_7cPc4JS2M2-4bTitMB3Ct_AewTKL_kjqA',
    },
    stats: [
      {
        label: 'Handicap',
        value: '14.2',
        change: '↓ 0.8 this month',
        icon: '📉',
        changePositive: true,
      },
      {
        label: 'Drills',
        value: '24',
        change: 'Completed total',
        icon: '⛳',
        changePositive: false,
      },
    ],
    schedule: [
      { day: 'Mon', date: '12', title: 'Grip Basics', status: 'completed' as const },
      {
        day: 'Tue',
        date: '13',
        title: 'Smart Review',
        subtitle: 'Personalized quiz based on play',
        status: 'current' as const,
      },
      {
        day: 'Wed',
        date: '14',
        title: 'Hip Rotation',
        subtitle: '15 min • Iron Play',
        status: 'locked' as const,
      },
    ],
    goals: [
      {
        icon: '⛳',
        title: 'Drive Distance > 250y',
        current: '235y',
        progress: 80,
        color: 'blue' as const,
      },
      {
        icon: '📊',
        title: 'Putting Avg < 30',
        current: '34',
        progress: 45,
        color: 'purple' as const,
      },
    ],
  };

  const handleStartLesson = () => {
    // TODO: Navigate to lesson screen
    console.log('Start lesson');
  };

  const handleReview = () => {
    // @ts-ignore
    navigation.navigate('Review');
  };

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <SafeAreaView style={styles.safeAreaTop}>
        <View style={styles.topBar}>
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.menuBtn}>
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrw5OCm3HZKFZyzmaf9QRxVcVTdEuSqZ7bkbwy6OZDUeovPexP4MLw9zZB530Pq153nMkD3ejUzOEyqXqF1AiIKYpviUOJwnco3UXZAz6toEjbiQ6_n9kU7tCR0oNd75cJ58CvUgrGq2RmXTiNa5kYZlxsO7-3P0aCHhdPVPj6UzoudlvXwigsl5QoRbFdNwBI2RG4Y_wpf-bkY6anA9JYz4UaZ2a67k6ZAIdWCyytWhC1fGxZ6N0K0Pjcu7Zgob2FpL4hcBHSePc',
              }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.pageTitle}>Your Roadmap</Text>
        </View>

        {/* Phase & Progress */}
        <View style={styles.phaseSection}>
          <Text style={styles.phaseTitle}>{planData.phase}</Text>
          <View style={styles.phaseProgress}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                Week {planData.week} of {planData.totalWeeks}
              </Text>
              <Text style={styles.progressPercentage}>{planData.progress}% Complete</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressBarFill, { width: `${planData.progress}%` }]}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Scrollable Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.spacer} />

        {/* Today's Focus Card */}
        <View style={styles.focusCard}>
          <ImageBackground source={{ uri: planData.nextLesson.image }} style={styles.focusImage}>
            <View style={styles.focusOverlay}>
              <View style={styles.focusBadge}>
                <Text style={styles.focusBadgeText}>NEXT UP</Text>
              </View>
            </View>
          </ImageBackground>
          <View style={styles.focusContent}>
            <View style={styles.focusHeader}>
              <View>
                <Text style={styles.focusTitle}>{planData.nextLesson.title}</Text>
                <Text style={styles.focusSubtitle}>
                  {planData.nextLesson.duration} • {planData.nextLesson.category}
                </Text>
              </View>
            </View>
            <View style={styles.focusSpacer} />
            <Button
              variant="primary"
              size="medium"
              fullWidth
              icon="▶"
              iconPosition="left"
              onPress={handleStartLesson}
            >
              Start Lesson
            </Button>
          </View>
        </View>

        {/* Stats Summary */}
        <View style={styles.stats}>
          {planData.stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text
                style={[
                  styles.statChange,
                  stat.changePositive && styles.statChangePositive,
                ]}
              >
                {stat.change}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.spacer} />

        {/* Weekly Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Schedule</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>View Calendar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.schedule}>
            {planData.schedule.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.scheduleItem,
                  item.status === 'completed' && styles.scheduleItemCompleted,
                  item.status === 'current' && styles.scheduleItemCurrent,
                ]}
              >
                {item.status === 'current' && <View style={styles.scheduleIndicator} />}
                <View style={styles.scheduleDate}>
                  <Text
                    style={[
                      styles.scheduleDay,
                      item.status === 'current' && styles.scheduleDayActive,
                    ]}
                  >
                    {item.day}
                  </Text>
                  <Text
                    style={[
                      styles.scheduleNum,
                      item.status === 'current' && styles.scheduleNumActive,
                    ]}
                  >
                    {item.date}
                  </Text>
                </View>
                <View style={styles.scheduleInfo}>
                  <Text
                    style={[
                      styles.scheduleTitle,
                      item.status === 'completed' && styles.scheduleTitleCompleted,
                    ]}
                  >
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text
                      style={[
                        styles.scheduleSubtitle,
                        item.status === 'completed' && styles.scheduleSubtitleCompleted,
                      ]}
                    >
                      {item.subtitle}
                    </Text>
                  )}
                  {item.status === 'completed' && (
                    <Text style={styles.scheduleStatus}>Completed</Text>
                  )}
                </View>
                {item.status === 'completed' && (
                  <View style={styles.scheduleCheck}>
                    <Text style={styles.scheduleCheckIcon}>✓</Text>
                  </View>
                )}
                {item.status === 'current' && (
                  <TouchableOpacity style={styles.scheduleBtn} onPress={handleReview}>
                    <Text style={styles.scheduleBtnText}>Review</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'locked' && (
                  <View style={styles.scheduleLock}>
                    <Text style={styles.scheduleLockIcon}>🔒</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Long-Term Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Long-Term Goals</Text>
          <View style={styles.goals}>
            {planData.goals.map((goal, index) => (
              <View key={index} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalLeft}>
                    <View
                      style={[
                        styles.goalIcon,
                        goal.color === 'blue' && styles.goalIconBlue,
                        goal.color === 'purple' && styles.goalIconPurple,
                      ]}
                    >
                      <Text style={styles.goalIconText}>{goal.icon}</Text>
                    </View>
                    <View>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <Text style={styles.goalCurrent}>Current: {goal.current}</Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.goalPercentage,
                      goal.color === 'blue' && styles.goalPercentageBlue,
                      goal.color === 'purple' && styles.goalPercentagePurple,
                    ]}
                  >
                    {goal.progress}%
                  </Text>
                </View>
                <View style={styles.goalProgress}>
                  <View
                    style={[
                      styles.goalProgressFill,
                      { width: `${goal.progress}%` },
                      goal.color === 'blue' && styles.goalProgressFillBlue,
                      goal.color === 'purple' && styles.goalProgressFillPurple,
                    ]}
                  />
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addGoalBtn}>
              <Text style={styles.addGoalIcon}>+</Text>
              <Text style={styles.addGoalText}>Add New Goal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom padding */}
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
    backgroundColor: '#111813',
  },
  safeAreaTop: {
    backgroundColor: 'rgba(17, 24, 19, 0.9)',
  },

  // Top Bar
  topBar: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    justifyContent: 'space-between',
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  menuIcon: {
    fontSize: 24,
    color: colors.white,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(19, 236, 91, 0.2)',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    color: colors.white,
  },

  // Phase Section
  phaseSection: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  phaseTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    color: '#e5e7eb',
  },
  phaseProgress: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 24,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#d1d5db',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBar: {
    height: 12,
    borderRadius: 9999,
    backgroundColor: '#3b5443',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 9999,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  spacer: {
    height: 24,
  },

  // Focus Card
  focusCard: {
    borderRadius: 32,
    backgroundColor: '#1c271f',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  focusImage: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  focusOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  focusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
  },
  focusBadgeText: {
    color: '#111813',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  focusContent: {
    padding: 20,
    gap: 4,
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  focusTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.3,
    color: colors.white,
    marginBottom: 4,
  },
  focusSubtitle: {
    color: '#9db9a6',
    fontSize: 14,
  },
  focusSpacer: {
    height: 16,
  },

  // Stats
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1c271f',
    padding: 16,
    borderRadius: 24,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statIcon: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  statChange: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
  },
  statChangePositive: {
    color: colors.primary,
  },

  // Section
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.3,
    color: colors.white,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },

  // Schedule
  schedule: {
    gap: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#1c271f',
    position: 'relative',
  },
  scheduleItemCompleted: {
    opacity: 0.6,
  },
  scheduleItemCurrent: {
    borderWidth: 1,
    borderColor: 'rgba(19, 236, 91, 0.3)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
  scheduleIndicator: {
    position: 'absolute',
    left: -4,
    top: '50%',
    transform: [{ translateY: -24 }],
    width: 4,
    height: 48,
    backgroundColor: colors.primary,
    borderTopRightRadius: 9999,
    borderBottomRightRadius: 9999,
  },
  scheduleDate: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    borderRightWidth: 1,
    borderRightColor: '#374151',
    paddingRight: 16,
  },
  scheduleDay: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  scheduleDayActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  scheduleNum: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  scheduleNumActive: {
    color: colors.primary,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.white,
  },
  scheduleTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  scheduleSubtitle: {
    fontSize: 12,
    color: '#d1d5db',
  },
  scheduleSubtitleCompleted: {
    color: '#9ca3af',
  },
  scheduleStatus: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  scheduleCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(19, 236, 91, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleCheckIcon: {
    fontSize: 18,
    color: colors.primary,
  },
  scheduleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: colors.primary,
  },
  scheduleBtnText: {
    color: '#111813',
    fontSize: 12,
    fontWeight: '700',
  },
  scheduleLock: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleLockIcon: {
    fontSize: 18,
  },

  // Goals
  goals: {
    gap: 16,
    marginTop: 16,
  },
  goalCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#1c271f',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  goalIconPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  goalIconText: {
    fontSize: 20,
  },
  goalTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.white,
  },
  goalCurrent: {
    fontSize: 12,
    color: '#9ca3af',
  },
  goalPercentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  goalPercentageBlue: {
    color: '#3b82f6',
  },
  goalPercentagePurple: {
    color: '#a855f7',
  },
  goalProgress: {
    height: 8,
    width: '100%',
    backgroundColor: '#000',
    borderRadius: 9999,
    overflow: 'hidden',
    marginTop: 8,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 9999,
  },
  goalProgressFillBlue: {
    backgroundColor: '#3b82f6',
  },
  goalProgressFillPurple: {
    backgroundColor: '#a855f7',
  },

  // Add Goal Button
  addGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#4b5563',
    backgroundColor: 'transparent',
  },
  addGoalIcon: {
    fontSize: 20,
    color: '#6b7280',
  },
  addGoalText: {
    fontWeight: '500',
    fontSize: 14,
    color: '#6b7280',
  },
});
