import React, { useEffect, useMemo } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '@/lib/AuthContext';
import { useUserProfile } from '@/hooks/useProfile';
import { useSmartReviewPlan, useSubmitReviewResult } from '@/hooks/useSmartReview';
import { useSwingTaxonomy } from '@/hooks/useTaxonomy';
import { HeroCard, HorizontalCard } from '@/components/Card';
import { BottomNav } from '@/components/BottomNav';
import { colors, spacing } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';

type ReviewScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, 'Review'>;

/**
 * Smart Review Screen - Spaced repetition review system
 * Matches web design exactly
 */
export function ReviewScreen() {
  const navigation = useNavigation<ReviewScreenNavigationProp>();
  const { userId } = useAuth();
  const { data: profile } = useUserProfile();

  const { plan, loading: planLoading, error: planError, refetch: refetchPlan } = useSmartReviewPlan(10, null);
  const { submit: submitReview, loading: submitLoading } = useSubmitReviewResult();
  const { data: taxonomy } = useSwingTaxonomy();

  // Fetch plan on mount
  useEffect(() => {
    refetchPlan(10, null);
  }, [refetchPlan]);

  // Transform plan data to match existing UI structure
  const upNextLesson = useMemo(() => {
    if (!plan?.items || plan.items.length === 0) {
      return {
        title: 'No Review Items',
        description: 'Complete some drills or lessons to build your review schedule.',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuC9FXOKAEpmAu12CM8oS0U9vFKhZGhyprWjrODS_3PTaY-DeKt3AEQW5S0CHZoQruOV8KkAVuzpGSYPUvvPzR4SRiawOiV56YXbZ0OWL7r47dOGnoOUmjrtAaheXKDVMcD5HU9qQMDV_69bzU0CcsM8xBNaKt4P17mcuOY0H6UBUaaEalJS4LbxAcEzEUg0yYOV9gKfAveKCUYNWJz3e7tgs7ipeuAdWx06gAUwKrSS149gCrYl18_QB7y8JxoRDflxvsefDtIJ8_Y',
        progress: { current: 0, total: 1 },
        duration: '0 min',
        coaches: [],
        moreCoaches: 0,
        item: null,
      };
    }

    const firstItem = plan.items[0];
    const isLesson = firstItem.item_type === 'lesson';
    const itemData = isLesson
      ? taxonomy?.lessons?.find((l: any) => l.id === firstItem.item_id)
      : taxonomy?.drills?.find((d: any) => d.id === firstItem.item_id);

    return {
      title: isLesson
        ? itemData?.title || 'Review Lesson'
        : itemData?.name || 'Review Drill',
      description:
        firstItem.why ||
        itemData?.description ||
        itemData?.objective ||
        itemData?.summary ||
        'Time to review this item.',
      image:
        itemData?.thumbnail_url ||
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC9FXOKAEpmAu12CM8oS0U9vFKhZGhyprWjrODS_3PTaY-DeKt3AEQW5S0CHZoQruOV8KkAVuzpGSYPUvvPzR4SRiawOiV56YXbZ0OWL7r47dOGnoOUmjrtAaheXKDVMcD5HU9qQMDV_69bzU0CcsM8xBNaKt4P17mcuOY0H6UBUaaEalJS4LbxAcEzEUg0yYOV9gKfAveKCUYNWJz3e7tgs7ipeuAdWx06gAUwKrSS149gCrYl18_QB7y8JxoRDflxvsefDtIJ8_Y',
      progress: { current: 1, total: 1 },
      duration: `${firstItem.minutes} min`,
      coaches: [],
      moreCoaches: 0,
      item: firstItem,
    };
  }, [plan, taxonomy]);

  // Transform plan items to timeline format
  const timeline = useMemo(() => {
    if (!plan?.items || plan.items.length === 0) return [];

    return plan.items.slice(0, 3).map((item: any, index: number) => {
      const itemData =
        item.item_type === 'lesson'
          ? taxonomy?.lessons?.find((l: any) => l.id === item.item_id)
          : taxonomy?.drills?.find((d: any) => d.id === item.item_id);

      const isDue = item.due_at && new Date(item.due_at) <= new Date();
      const dueDate = item.due_at ? new Date(item.due_at) : null;
      const timeAgo = dueDate
        ? isDue
          ? 'Due Today'
          : `Due ${Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`
        : 'Scheduled';

      const isLesson = item.item_type === 'lesson';
      return {
        id: item.item_id,
        title: isLesson
          ? itemData?.title || 'Review Lesson'
          : itemData?.name || 'Review Drill',
        description:
          item.why ||
          itemData?.description ||
          itemData?.objective ||
          itemData?.summary ||
          '',
        timeAgo,
        icon: item.item_type === 'lesson' ? '🎓' : '⛳',
        color: index === 0 ? 'primary' : index === 1 ? 'orange' : 'blue',
        active: index === 0 && isDue,
      };
    });
  }, [plan, taxonomy]);

  // Transform plan items to quick drills format
  const quickDrills = useMemo(() => {
    if (!plan?.items || plan.items.length < 2) return [];

    return plan.items.slice(1, 3).map((item: any) => {
      const itemData =
        item.item_type === 'lesson'
          ? taxonomy?.lessons?.find((l: any) => l.id === item.item_id)
          : taxonomy?.drills?.find((d: any) => d.id === item.item_id);

      const isDue = item.due_at && new Date(item.due_at) <= new Date();
      const dueDate = item.due_at ? new Date(item.due_at) : null;
      const subtitle = dueDate
        ? isDue
          ? 'Due Today'
          : `Due ${Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`
        : 'Scheduled';

      const isLesson = item.item_type === 'lesson';
      return {
        id: item.item_id,
        title: isLesson
          ? itemData?.title || 'Review Lesson'
          : itemData?.name || 'Review Drill',
        subtitle,
        duration: `${item.minutes} min`,
        image:
          itemData?.thumbnail_url ||
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAcRbQHP_KN6w9PmfTxS3Rk6tHYeUdIxNuUnO4BvbT1T1m3HmAT0APXPtAu1iRqpkYVEjl3GrRcWiZsHiIeCWFTp9PAe7h-FBnXDw2Uetoz5rI8y_F_B7BMdX33L02YWn7J7u8IGswDGaQVwBsi7wzT2YWy0uks3sQdiE_ifwQ_tQRDuN2Wqu26jIMZGG25PHddh5FHTMMG7AtOztSjXxcgzSG9taB4xtMIkx-oYZ2fbt8VRoYbqTvv5O-oPlC-x3Dz6tSz5cus3tw',
        action: 'play_arrow',
        active: isDue,
        item,
      };
    });
  }, [plan, taxonomy]);

  const progressPercentage =
    (upNextLesson.progress.current / upNextLesson.progress.total) * 100;
  const circumference = 2 * Math.PI * 10;
  const offset = circumference - (progressPercentage / 100) * circumference;

  // Show loading state
  if (planLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.retentionPill}>
              <Text style={styles.retentionIcon}>🧠</Text>
              <Text style={styles.retentionText}>RETENTION: --</Text>
            </View>
            <TouchableOpacity
              style={styles.profileAvatar}
              onPress={() => navigation.navigate('Profile')}
            >
              <Image
                source={{
                  uri:
                    profile?.avatar_url ||
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBfBPSEK00wDz93EIwdYTY8evnDnh2lX2ML1olL_jgLkz7wFJJYHXVjHzUDtAYZx5cYW3koBEcbDiupzmrm9_qA9KxRzJj6gvcAqoGLsS-YMHu_O2EYP4Ep5XdiFXETxAv28KSOfwiUGXmAyYlaqx5Dh6jGTaRmytRdXMYHe_sjslNa8znEGpIzR1WKi9RrheKqvgnbl7ysyhW-0cxIJs3IdqUo67y-I-I-9Ups2XeH4Rzaqzy6T00zru7p2EwSP9TAedttJEJreFQ',
                }}
                style={styles.profileAvatarImage}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Smart Review</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your review plan...</Text>
        </View>
        <BottomNav />
      </View>
    );
  }

  const retentionScore =
    plan?.retention_score !== null && plan?.retention_score !== undefined
      ? Math.round(plan.retention_score * 100)
      : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.safeAreaTop}>
        <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.retentionPill}>
            <Text style={styles.retentionIcon}>🧠</Text>
            <Text style={styles.retentionText}>
              RETENTION: {retentionScore !== null ? `${retentionScore}%` : '--%'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileAvatar}
            onPress={() => navigation.navigate('Profile')}
          >
            <Image
              source={{
                uri:
                  profile?.avatar_url ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBfBPSEK00wDz93EIwdYTY8evnDnh2lX2ML1olL_jgLkz7wFJJYHXVjHzUDtAYZx5cYW3koBEcbDiupzmrm9_qA9KxRzJj6gvcAqoGLsS-YMHu_O2EYP4Ep5XdiFXETxAv28KSOfwiUGXmAyYlaqx5Dh6jGTaRmytRdXMYHe_sjslNa8znEGpIzR1WKi9RrheKqvgnbl7ysyhW-0cxIJs3IdqUo67y-I-I-9Ups2XeH4Rzaqzy6T00zru7p2EwSP9TAedttJEJreFQ',
              }}
              style={styles.profileAvatarImage}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Smart Review</Text>
      </View>
      </SafeAreaView>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Up Next Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Up Next</Text>
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityBadgeText}>HIGH PRIORITY</Text>
            </View>
          </View>

          <HeroCard
            image={upNextLesson.image}
            badge={
              <View style={styles.progressBadge}>
                <View style={styles.progressCircle}>
                  <Svg width={24} height={24} viewBox="0 0 24 24">
                    <Circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="transparent"
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="3"
                    />
                    <Circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="transparent"
                      stroke={colors.primary}
                      strokeWidth="3"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      rotation="-90"
                      origin="12, 12"
                    />
                  </Svg>
                </View>
                <Text style={styles.progressText}>
                  Part {upNextLesson.progress.current}/{upNextLesson.progress.total}
                </Text>
              </View>
            }
          >
            <Text style={styles.heroTitle}>{upNextLesson.title}</Text>
            <Text style={styles.heroDescription}>{upNextLesson.description}</Text>

            <View style={styles.heroFooter}>
              <View style={styles.coaches}>
                {upNextLesson.coaches.map((coach: string, index: number) => (
                  <Image key={index} style={styles.coachAvatar} source={{ uri: coach }} />
                ))}
                {upNextLesson.moreCoaches > 0 && (
                  <View style={styles.coachesMore}>
                    <Text style={styles.coachesMoreText}>+{upNextLesson.moreCoaches}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => {
                  if (upNextLesson.item) {
                    // Navigate to lesson or drill (placeholder)
                    console.log('Start review:', upNextLesson.item);
                  }
                }}
                disabled={planLoading || !upNextLesson.item}
              >
                <Text style={styles.startBtnIcon}>▶</Text>
                <Text style={styles.startBtnText}>Start ({upNextLesson.duration})</Text>
              </TouchableOpacity>
            </View>
          </HeroCard>
        </View>

        {/* Timeline Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Review Cadence</Text>

          <View style={styles.timelineCard}>
            <View style={styles.timeline}>
              {timeline.map((item: any, index: number) => (
                <View key={item.id} style={styles.timelineItem}>
                  <View style={styles.timelineIndicator}>
                    {index > 0 && <View style={styles.timelineConnectorTop} />}
                    <View
                      style={[
                        styles.timelineIcon,
                        item.color === 'primary' && styles.timelineIconPrimary,
                        item.color === 'orange' && styles.timelineIconOrange,
                        item.color === 'blue' && styles.timelineIconBlue,
                      ]}
                    >
                      <Text style={styles.timelineIconText}>{item.icon}</Text>
                    </View>
                    {index < timeline.length - 1 && (
                      <View style={styles.timelineConnectorBottom} />
                    )}
                  </View>

                  <View
                    style={[
                      styles.timelineContent,
                      index === timeline.length - 1 && styles.timelineContentLast,
                    ]}
                  >
                    <View style={styles.timelineHeader}>
                      <Text
                        style={[
                          styles.timelineTitle,
                          item.active && styles.timelineTitleActive,
                        ]}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          styles.timelineTime,
                          item.active && styles.timelineTimeActive,
                        ]}
                      >
                        {item.timeAgo}
                      </Text>
                    </View>
                    <Text style={styles.timelineDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Quick Drills Section */}
        <View style={[styles.section, styles.drillsSection]}>
          <Text style={styles.sectionTitle}>Quick Drills</Text>

          <View style={styles.drills}>
            {quickDrills.map((drill: any) => (
              <HorizontalCard
                key={drill.id}
                image={drill.image}
                title={drill.title}
                subtitle={drill.subtitle}
                inactive={!drill.active}
              >
                <View style={styles.drillFooter}>
                  {drill.duration && (
                    <View style={styles.drillDuration}>
                      <Text style={styles.drillDurationText}>{drill.duration}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.drillAction}
                    onPress={() => {
                      if (drill.item) {
                        console.log('Start drill:', drill.item);
                      }
                    }}
                  >
                    <Text style={styles.drillActionIcon}>▶</Text>
                  </TouchableOpacity>
                </View>
              </HorizontalCard>
            ))}
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

  // Header
  header: {
    backgroundColor: 'rgba(16, 34, 22, 0.95)',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  retentionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1c271f',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  retentionIcon: {
    fontSize: 20,
  },
  retentionText: {
    color: '#9db9a6',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1c271f',
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.white,
  },

  // Content
  content: {
    flex: 1,
  },
  section: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  priorityBadge: {
    backgroundColor: 'rgba(19, 236, 91, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  // Hero Card customization
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressCircle: {
    width: 24,
    height: 24,
  },
  progressText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 8,
  },
  heroDescription: {
    color: '#9db9a6',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  coaches: {
    flexDirection: 'row',
    marginLeft: -8,
  },
  coachAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1c271f',
    marginLeft: -8,
  },
  coachesMore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1c271f',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  coachesMoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 9999,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 4,
  },
  startBtnIcon: {
    fontSize: 18,
    color: colors.background,
  },
  startBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.background,
  },

  // Timeline
  timelineCard: {
    backgroundColor: '#1c271f',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  timeline: {
    flexDirection: 'column',
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineIndicator: {
    alignItems: 'center',
    width: 32,
    paddingTop: 4,
  },
  timelineConnectorTop: {
    width: 2,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 9999,
  },
  timelineConnectorBottom: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 9999,
    marginTop: 4,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  timelineIconOrange: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
  },
  timelineIconPrimary: {
    backgroundColor: 'rgba(19, 236, 91, 0.2)',
  },
  timelineIconText: {
    fontSize: 18,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 24,
    paddingTop: 4,
  },
  timelineContentLast: {
    paddingBottom: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    flex: 1,
    paddingRight: 8,
  },
  timelineTitleActive: {
    color: colors.primary,
  },
  timelineTime: {
    fontSize: 12,
    color: colors.gray[500],
  },
  timelineTimeActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  timelineDescription: {
    color: '#9db9a6',
    fontSize: 14,
    lineHeight: 20,
  },

  // Drills
  drillsSection: {
    paddingBottom: 16,
  },
  drills: {
    gap: 12,
  },
  drillFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  drillDuration: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  drillDurationText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gray[400],
  },
  drillAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drillActionIcon: {
    fontSize: 18,
    color: colors.white,
  },
});
