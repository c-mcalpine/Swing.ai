import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, IconButton, VideoPlayer } from '@/components';
import { useSwingTaxonomy } from '@/hooks/useTaxonomy';
import { colors, spacing } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';

type DailyLessonScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'DailyLesson'
>;
type DailyLessonScreenRouteProp = RouteProp<AppStackParamList, 'DailyLesson'>;

/**
 * Daily Lesson Screen - Interactive lesson with video, mechanics, and drills
 * Matches web design exactly
 */
export function DailyLessonScreen() {
  const navigation = useNavigation<DailyLessonScreenNavigationProp>();
  const route = useRoute<DailyLessonScreenRouteProp>();
  const lessonId = (route.params as any)?.lessonId;

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [progress, setProgress] = useState(35);
  const { data: taxonomy, loading, error } = useSwingTaxonomy();

  // Get the lesson from taxonomy (use first lesson if no ID provided)
  const lesson = useMemo(() => {
    if (!taxonomy?.lessons) return null;
    if (lessonId) {
      return taxonomy.lessons.find((l) => l.id === lessonId) || taxonomy.lessons[0];
    }
    return taxonomy.lessons[0];
  }, [taxonomy, lessonId]);

  // Get lesson steps for this lesson
  const lessonSteps = useMemo(() => {
    if (!taxonomy?.lessonSteps || !lesson) return [];
    return taxonomy.lessonSteps.filter((step: any) => step.lesson_id === lesson.id);
  }, [taxonomy, lesson]);

  // Get mechanics from lesson steps
  const mechanics = useMemo(() => {
    if (!taxonomy?.mechanics || !lessonSteps) return [];
    const mechanicIds = lessonSteps
      .filter((step: any) => step.mechanic_id)
      .map((step: any) => step.mechanic_id);
    return taxonomy.mechanics.filter((m: any) => mechanicIds.includes(m.id));
  }, [taxonomy, lessonSteps]);

  // Get drills from lesson steps
  const drills = useMemo(() => {
    if (!taxonomy?.drills || !lessonSteps) return [];
    const drillIds = lessonSteps
      .filter((step: any) => step.drill_id)
      .map((step: any) => step.drill_id);
    return taxonomy.drills.filter((d: any) => drillIds.includes(d.id));
  }, [taxonomy, lessonSteps]);

  const drill = drills[0]; // Get first drill

  const lessonData = {
    day: 12, // This would come from user progress
    title: lesson?.title || 'Loading...',
    videoThumb:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAjcqPH9yZ54w0zNRaW1cNXdeWwwSpz_pQWqviqpOyZW7cMNwlHwGfhBv17S7uzSjMFN5jmYe-1V1CXbjofMvhm4XDwwKw7Rumy6BBaslEo4CjJuXYUKo2eBORcJ85SyCAewgYPegfXH5ArPq3TEtVD0ZtUU-QlvYz3x_X1gpmv6pQzGb8wjuXSv0dnboXylVyBT9F1mtesgjtK5nknw_3-36_8iePzLeDH9h1kM8zd0qv0go26JBKABgacpliLhnxT2WeouE72DYs',
    duration: '02:14',
    tags: lesson?.tags?.split(',') || ['Driver', 'Intermediate', '5 min'],
    streak: 12,
    xpReward: 50,
  };

  const handleComplete = () => {
    // Mark lesson complete and navigate
    console.log('Lesson completed! +50 XP');
    // @ts-ignore
    navigation.navigate('PersonalizedPlan');
  };

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <SafeAreaView style={styles.safeAreaTop}>
        <View style={styles.header}>
          <View style={styles.headerNav}>
            <IconButton icon="←" onPress={() => navigation.goBack()} />

            <View style={styles.headerTitle}>
              <Text style={styles.dayLabel}>DAY {lessonData.day}</Text>
              <Text style={styles.title}>{lessonData.title}</Text>
            </View>

            <IconButton
              icon={isBookmarked ? '🔖' : '🏷️'}
              onPress={() => setIsBookmarked(!isBookmarked)}
            />
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>LESSON PROGRESS</Text>
              <Text style={styles.progressValue}>{progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Scrollable Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Player */}
        <View style={styles.videoSection}>
          <VideoPlayer
            thumbnailUrl={lessonData.videoThumb}
            duration={lessonData.duration}
          />

          {/* Tags */}
          <View style={styles.tags}>
            {lessonData.tags.map((tag: string, index: number) => (
              <View key={index} style={styles.tag}>
                {tag.includes('min') && <Text style={styles.tagIcon}>⏱</Text>}
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Key Mechanics Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>THE MECHANICS</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Scroll Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            style={styles.carousel}
          >
            {mechanics.map((mechanic: any, index: number) => (
              <View key={mechanic.id} style={styles.mechanicCard}>
                <View
                  style={[
                    styles.mechanicImage,
                    { backgroundColor: '#1c271f' }, // Placeholder
                  ]}
                />
                <View style={styles.mechanicContent}>
                  <View style={styles.mechanicHeader}>
                    <View style={styles.mechanicNumber}>
                      <Text style={styles.mechanicNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.mechanicTitle}>{mechanic.name}</Text>
                  </View>
                  <Text style={styles.mechanicDescription} numberOfLines={3}>
                    {mechanic.description_short || 'Learn this key mechanic'}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Practice Drill Section */}
        {drill && (
          <View style={[styles.section, styles.drillSection]}>
            <Text style={styles.sectionTitle}>PRACTICE DRILL</Text>

            <View style={styles.drillCard}>
              <View style={[styles.drillImage, { backgroundColor: '#1c271f' }]} />
              <View style={styles.drillContent}>
                <View style={styles.drillHeader}>
                  <Text style={styles.drillTitle}>{drill.name}</Text>
                </View>
                <Text style={styles.drillDescription} numberOfLines={2}>
                  {drill.description || drill.objective}
                </Text>
                <TouchableOpacity style={styles.drillCta}>
                  <Text style={styles.drillCtaText}>VIEW STEPS</Text>
                  <Text style={styles.drillCtaIcon}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Swing Visualizer Widget */}
        <View style={[styles.section, styles.visualizerSection]}>
          <View style={styles.visualizerCard}>
            <View style={styles.visualizerGlow} />

            <View style={styles.visualizerHeader}>
              <View>
                <Text style={styles.visualizerTitle}>Swing Visualizer</Text>
                <Text style={styles.visualizerSubtitle}>See the skeletal breakdown</Text>
              </View>
              <TouchableOpacity style={styles.visualizerBtn}>
                <Text style={styles.visualizerBtnIcon}>🔄</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.visualizerPlaceholder}>
              <View style={styles.visualizerContent}>
                <Text style={styles.visualizerIcon}>⛳</Text>
                <View style={styles.visualizerDivider} />
                <Text style={styles.visualizerText}>LOADING MODEL...</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom padding for footer */}
        <View style={{ height: 180 }} />
      </ScrollView>

      {/* Sticky Footer CTA */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.streakInfo}>
            <Text style={styles.fireIcon}>🔥</Text>
            <Text style={styles.streakText}>
              Finish to keep your{' '}
              <Text style={styles.streakHighlight}>{lessonData.streak}-day streak!</Text>
            </Text>
          </View>

          <Button
            variant="primary"
            size="large"
            fullWidth
            onPress={handleComplete}
          >
            <View style={styles.completeBtnContent}>
              <Text style={styles.completeBtnIcon}>✓</Text>
              <Text style={styles.completeBtnText}>MARK COMPLETE</Text>
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>+{lessonData.xpReward} XP</Text>
              </View>
            </View>
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeAreaTop: {
    backgroundColor: 'rgba(16, 34, 22, 0.95)',
  },

  // Sticky Header
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.8,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.36,
  },

  // Progress Bar
  progressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressValue: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    width: '100%',
    borderRadius: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 9999,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },

  // Content
  content: {
    flex: 1,
  },

  // Video Section
  videoSection: {
    padding: 16,
  },

  // Tags
  tags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagIcon: {
    fontSize: 14,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#d1d5db',
  },

  // Sections
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  viewAll: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },

  // Carousel
  carousel: {
    paddingLeft: 16,
  },
  carouselContent: {
    gap: 16,
    paddingRight: 16,
    paddingBottom: 16,
  },
  mechanicCard: {
    width: 256,
    backgroundColor: '#1c271f',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  mechanicImage: {
    height: 128,
    width: '100%',
  },
  mechanicContent: {
    padding: 16,
    flex: 1,
  },
  mechanicHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  mechanicNumber: {
    backgroundColor: 'rgba(19, 236, 91, 0.2)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mechanicNumberText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  mechanicTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
  },
  mechanicDescription: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 21,
  },

  // Practice Drill
  drillSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  drillCard: {
    backgroundColor: '#1c271f',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  drillImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  drillContent: {
    flex: 1,
  },
  drillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  drillTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  drillCheck: {
    color: colors.primary,
    fontSize: 20,
  },
  drillDescription: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  drillCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  drillCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  drillCtaIcon: {
    fontSize: 14,
    color: colors.primary,
  },

  // Swing Visualizer
  visualizerSection: {
    marginTop: 32,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  visualizerCard: {
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(19, 236, 91, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  visualizerGlow: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    backgroundColor: 'rgba(19, 236, 91, 0.2)',
    borderRadius: 80,
  },
  visualizerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
  },
  visualizerTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 18,
  },
  visualizerSubtitle: {
    color: '#d1d5db',
    fontSize: 12,
    marginTop: 4,
  },
  visualizerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualizerBtnIcon: {
    fontSize: 20,
    color: colors.white,
  },
  visualizerPlaceholder: {
    marginTop: 16,
    height: 128,
    width: '100%',
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  visualizerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    opacity: 0.5,
  },
  visualizerIcon: {
    fontSize: 36,
    color: colors.white,
  },
  visualizerDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  visualizerText: {
    fontSize: 12,
    color: colors.white,
    fontFamily: 'Courier New',
  },

  // Sticky Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(16, 34, 22, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    zIndex: 50,
  },
  footerContent: {
    gap: 12,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fireIcon: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  streakHighlight: {
    color: colors.white,
    fontWeight: '700',
  },
  completeBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeBtnIcon: {
    fontSize: 20,
    color: colors.background,
  },
  completeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  xpBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 9999,
    marginLeft: 4,
  },
  xpBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.background,
  },
});
