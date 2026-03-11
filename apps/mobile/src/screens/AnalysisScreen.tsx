import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';
import { useSwingAnalysisData, type SwingFrameWithUrls } from '@/hooks/useSwingAnalysisData';
import { useUserProfile } from '@/hooks/useProfile';
import { useDailyPlanQuery } from '@/hooks/useQueries';
import { awardXp } from '@/lib/xp';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/styles/tokens';
import { XP_BASE } from '@/lib/xpConstants';
import type { AppStackParamList } from '@/navigation/AppStack';
import type { Database } from '@/lib/supabaseTypes';

type SwingErrorRow = Database['public']['Tables']['swing_error']['Row'];

type AnalysisScreenRouteProp = RouteProp<AppStackParamList, 'Analysis'>;
type AnalysisScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, 'Analysis'>;

/**
 * Swing Analysis Screen - Shows detailed analysis of a swing
 * Matches web design with score ring, XP banner, video card, chips, and metrics
 */
export function AnalysisScreen() {
  const navigation = useNavigation<AnalysisScreenNavigationProp>();
  const route = useRoute<AnalysisScreenRouteProp>();
  const { captureId } = route.params || {};

  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { data, loading, analyzing, error, timedOut, retryAnalysis } = useSwingAnalysisData(captureId);
  const { data: profile, refetch: refetchProfile } = useUserProfile();
  const { data: dailyPlan, refetch: refetchDailyPlan } = useDailyPlanQuery();
  const [xpAwardResult, setXpAwardResult] = useState<{ xp_awarded: number; new_total_xp: number; week_xp: number } | null>(null);
  const awardAttemptedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [issueErrors, setIssueErrors] = useState<SwingErrorRow[]>([]);

  // After analysis data loads, invalidate all downstream caches so MyPlan,
  // SmartReview, and HomeScreen reflect the newly assigned curriculum.
  useEffect(() => {
    if (captureId != null) {
      queryClient.invalidateQueries({ queryKey: ['dailyPlan'] });
      queryClient.invalidateQueries({ queryKey: ['myPlan', userId] });
      queryClient.invalidateQueries({ queryKey: ['smartReviewPlan'] });
      refetchDailyPlan();
    }
  }, [captureId, queryClient, userId, refetchDailyPlan]);

  useEffect(() => {
    if (!data?.analysis || !data?.capture?.id) return;
    if (awardAttemptedRef.current) return;

    awardAttemptedRef.current = true;
    const { analysis, capture } = data;

    awardXp({
      sourceType: 'swing_capture',
      sourceId: capture.id,
      meta: { overall_confidence: analysis.overall_confidence },
      idempotencyKey: `swing_capture-${capture.id}`,
    })
      .then((result) => {
        setXpAwardResult(result);
        refetchProfile();
        queryClient.invalidateQueries({ queryKey: ['myPlan', userId] });
        queryClient.invalidateQueries({ queryKey: ['smartReviewPlan'] });
      })
      .catch((err) => {
        console.warn('[Analysis] award_xp failed:', err);
        awardAttemptedRef.current = false;
      });
  }, [data?.capture?.id, data?.analysis?.overall_confidence, refetchProfile, queryClient, userId]);

  // Fetch swing_error rows for top issues to power issue-to-fix cards
  useEffect(() => {
    if (!data?.analysis) return;
    const issueScoresRaw = data.analysis.issue_scores as Record<string, number> | null;
    if (!issueScoresRaw) return;

    const topSlugs = Object.entries(issueScoresRaw)
      .filter(([, v]) => Number(v) >= 0.5)
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .slice(0, 3)
      .map(([slug]) => slug);

    if (topSlugs.length === 0) return;

    supabase
      .from('swing_error')
      .select('*')
      .in('slug', topSlugs)
      .then(({ data: rows }) => {
        if (rows) setIssueErrors(rows as SwingErrorRow[]);
      });
  }, [data?.analysis]);

  // ── Derived data — all hooks must be above the early returns ──

  // Parse scores from data (null-safe; produces empty objects while loading)
  const analysisRow = data?.analysis ?? null;
  const mechanicScoresRaw = (analysisRow?.mechanic_scores ?? {}) as Record<string, number>;
  const issueScoresRaw = (analysisRow?.issue_scores ?? {}) as Record<string, number>;
  const rawConf = Number(analysisRow?.overall_confidence ?? 0.85);
  const confidence = Math.round(Math.max(0, Math.min(1, rawConf)) * 100);
  const mechanicScores = Object.fromEntries(
    Object.entries(mechanicScoresRaw).map(([k, v]) => {
      const n = Number(v ?? 0);
      const pct = n <= 1 ? n * 100 : n;
      return [k, Math.round(Math.max(0, Math.min(100, pct)))];
    })
  ) as Record<string, number>;
  const issueScores: Record<string, number> = {};
  for (const [k, v] of Object.entries(issueScoresRaw)) {
    const num = typeof v === 'number' ? v : (v as any)?.severity ? 0.8 : Number(v);
    issueScores[k] = num <= 1 ? num : num / 100;
  }

  // Build dynamic metrics — must be a hook, so keep it unconditional before early returns
  const metrics = useMemo(() => {
    const rows = Object.entries(mechanicScores)
      .filter(([, score]) => typeof score === 'number')
      .sort(([, a], [, b]) => a - b)
      .map(([key, score]) => ({
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value: `${score}%`,
        note: score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Needs Work',
        percentage: score,
        status: score >= 70 ? 'good' : 'warning',
        centered: false,
      }));
    rows.push({
      label: 'Overall Form',
      value: `${confidence}%`,
      note: confidence >= 80 ? 'Strong' : 'Needs Improvement',
      percentage: confidence,
      status: confidence >= 70 ? 'good' : 'warning',
      centered: false,
    });
    return rows;
  }, [mechanicScores, confidence]);

  // ── Early returns (no hooks below this line) ──

  if (loading || analyzing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {analyzing ? 'Analyzing your swing...' : 'Loading analysis...'}
        </Text>
        <Text style={styles.loadingSubtext}>
          {analyzing ? 'This usually takes 10-30 seconds' : ''}
        </Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Analysis not found'}</Text>
        {captureId != null && (
          <Button
            variant="primary"
            onPress={retryAnalysis}
            style={{ marginTop: 16 }}
          >
            Retry Analysis
          </Button>
        )}
        <Button
          variant="secondary"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 8 }}
        >
          Go Back
        </Button>
      </View>
    );
  }

  const { analysis, capture } = data;

  // Calculate rating based on confidence
  const getRating = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Work';
  };

  // Extract good points (high mechanic scores)
  const goodPoints = Object.entries(mechanicScores)
    .filter(([_, score]) => score >= 80)
    .map(([key, score]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return `${label} (${score}%)`;
    })
    .slice(0, 3);

  // Extract focus areas (issues with high numeric severity 0..1)
  const focusAreas = Object.entries(issueScores)
    .filter(([_, score]) => Number(score) >= 0.5)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .slice(0, 3);

  const coachTip =
    (analysis.raw_json as { coach_notes?: string } | null)?.coach_notes ||
    'Keep practicing! Focus on the areas highlighted above.';

  const handleBack = () => {
    navigation.goBack();
  };

  const handleShare = () => {
    // Share functionality
    console.log('Share analysis');
  };

  const handlePlayVideo = () => {
    setIsPlaying(!isPlaying);
  };

  // Prefer recommended IDs from analysis; fall back to daily plan active lesson.
  const recommendedLessonId: number | null =
    (analysis.recommended_lesson_ids as number[] | null)?.[0] ??
    dailyPlan?.active_lesson?.id ??
    null;
  const recommendedDrillId: number | null =
    (analysis.recommended_drill_ids as number[] | null)?.[0] ?? null;

  const handleStartRecommendedLesson = () => {
    if (recommendedLessonId != null) {
      navigation.navigate('DailyLesson', { lessonId: recommendedLessonId, fromSmartReview: false });
    } else {
      navigation.navigate('Capture');
    }
  };

  const handleStartDrill = () => {
    if (recommendedDrillId != null) {
      navigation.navigate('DrillDetails', { drillId: recommendedDrillId });
    } else {
      navigation.navigate('Capture');
    }
  };

  const circleCircumference = 2 * Math.PI * 45;
  const circleProgress = circleCircumference - (circleCircumference * confidence) / 100;

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <SafeAreaView style={styles.safeAreaTop}>
        <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
          <Text style={styles.iconButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleArea}>
          {capture.camera_angle ? (
            <Text style={styles.club}>{capture.camera_angle.toUpperCase()}</Text>
          ) : null}
          <Text style={styles.date}>
            {new Date(capture.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
          <Text style={styles.iconButtonText}>⇧</Text>
        </TouchableOpacity>
      </View>
      </SafeAreaView>

      {/* Scrollable Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Score Ring */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreRing}>
            <View style={styles.scoreGlow} />
            <Svg width={192} height={192} viewBox="0 0 100 100" style={styles.scoreSvg}>
              <Circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(28, 39, 31, 0.5)"
                strokeWidth="8"
                fill="none"
              />
              <Circle
                cx="50"
                cy="50"
                r="45"
                stroke={colors.primary}
                strokeWidth="8"
                fill="none"
                strokeDasharray={circleCircumference}
                strokeDashoffset={circleProgress}
                strokeLinecap="round"
                rotation="-90"
                origin="50, 50"
              />
            </Svg>
            <View style={styles.scoreText}>
              <Text style={styles.scoreNumber}>{confidence}</Text>
              <Text style={styles.scoreRating}>{getRating(confidence).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* XP Banner (award_xp result + profile level) */}
        <View style={styles.xpBanner}>
          <View style={styles.xpContent}>
            <View style={styles.xpLeft}>
              <View style={styles.xpIcon}>
                <Text style={styles.xpIconText}>⚡</Text>
              </View>
              <View style={styles.xpInfo}>
                <Text style={styles.xpEarned}>
                  {xpAwardResult ? `+${xpAwardResult.xp_awarded} XP EARNED` : '… XP'}
                </Text>
                <View style={styles.xpProgress}>
                  <View
                    style={[
                      styles.xpProgressFill,
                      {
                        width: profile
                          ? `${Math.min(100, ((profile.xp ?? 0) / ((profile.xp ?? 0) + (profile.xp_to_next ?? 100) || 1)) * 100)}%`
                          : '0%',
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
            <Text style={styles.xpLevel}>
              Lvl {profile?.level ?? 1} {profile?.rank_title ?? 'Golfer'}
            </Text>
          </View>
        </View>

        {/* Swing Phase Cards — show overlay frames from AI analysis */}
        {data.frames.length > 0 ? (
          <View style={styles.phaseCardsSection}>
            <Text style={styles.sectionTitle}>Swing Phases</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.phaseCardsRow}>
              {data.frames.map((frame) => (
                <View key={frame.id} style={styles.phaseCard}>
                  <Image
                    source={{ uri: frame.overlaySignedUrl ?? frame.frameSignedUrl ?? undefined }}
                    style={styles.phaseCardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.phaseCardLabel}>
                    <Text style={styles.phaseCardLabelText}>
                      {frame.phase.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.videoCard}>
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>Swing capture</Text>
              <Text style={styles.videoPlaceholderSubtext}>
                {capture.camera_angle ? `${capture.camera_angle} view` : 'Key frames analyzed'}
              </Text>
            </View>
            <View style={styles.videoBadge}>
              <Text style={styles.videoBadgeText}>AI ANALYSIS</Text>
            </View>
          </View>
        )}

        {/* The Good */}
        {goodPoints.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIconGood}>✓</Text>
              <Text style={styles.cardTitle}>The Good</Text>
            </View>
            <View style={styles.chips}>
              {goodPoints.map((point, index) => (
                <View key={index} style={[styles.chip, styles.chipGood]}>
                  <Text style={styles.chipTextGood}>{point}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Focus Area */}
        {focusAreas.length > 0 && (
          <View style={[styles.card, styles.cardFocus]}>
            <View style={styles.cardDecoration}>
              <Text style={styles.cardDecorationIcon}>⚠</Text>
            </View>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIconWarning}>●</Text>
              <Text style={styles.cardTitle}>Focus Area</Text>
            </View>
            <View style={styles.chips}>
              {focusAreas.map((area, index) => (
                <View key={index} style={[styles.chip, styles.chipWarning]}>
                  <Text style={styles.chipTextWarning}>{area}</Text>
                </View>
              ))}
            </View>
            <View style={styles.coachTip}>
              <Text style={styles.coachTipText}>
                <Text style={styles.coachTipStrong}>Coach Tip: </Text>
                {coachTip}
              </Text>
              <Button
                variant="primary"
                size="medium"
                fullWidth
                onPress={handleStartDrill}
                icon="▶"
                iconPosition="left"
              >
                Start Practice Drill
              </Button>
            </View>
          </View>
        )}

        {/* Issue-to-Fix Cards */}
        {issueErrors.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>What to Fix</Text>
            {issueErrors.map((err) => (
              <View key={err.id} style={styles.issueCard}>
                <Text style={styles.issueCardTitle}>{err.name}</Text>
                {err.description ? (
                  <View style={styles.issueRow}>
                    <Text style={styles.issueRowLabel}>What we saw</Text>
                    <Text style={styles.issueRowValue}>{err.description}</Text>
                  </View>
                ) : null}
                {err.typical_miss ? (
                  <View style={styles.issueRow}>
                    <Text style={styles.issueRowLabel}>Ball-flight effect</Text>
                    <Text style={styles.issueRowValue}>{err.typical_miss}</Text>
                  </View>
                ) : null}
                {err.fix ? (
                  <View style={[styles.issueRow, styles.issueRowFix]}>
                    <Text style={styles.issueRowLabel}>What to fix first</Text>
                    <Text style={[styles.issueRowValue, styles.issueRowFixText]}>{err.fix}</Text>
                  </View>
                ) : null}
                {(recommendedDrillId != null || recommendedLessonId != null) && (
                  <TouchableOpacity
                    style={styles.issueFixCta}
                    onPress={recommendedDrillId != null ? handleStartDrill : handleStartRecommendedLesson}
                  >
                    <Text style={styles.issueFixCtaText}>
                      {recommendedDrillId != null ? `Practice Drill +${XP_BASE.drill} XP` : `Start Lesson +${XP_BASE.lesson} XP`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Metrics Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Metrics Breakdown</Text>
          <View style={styles.metrics}>
            {metrics.map((metric, index) => (
              <View key={index} style={styles.metric}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      metric.status === 'warning' && styles.metricValueWarning,
                    ]}
                  >
                    {metric.value}
                    {metric.note && <Text style={styles.metricNote}> ({metric.note})</Text>}
                  </Text>
                </View>
                <View style={styles.metricBar}>
                  {metric.centered ? (
                    <>
                      <View style={styles.metricBarCenter} />
                      <View
                        style={[
                          styles.metricBarFill,
                          styles.metricBarFillWarning,
                          { width: `${metric.percentage}%` },
                        ]}
                      />
                    </>
                  ) : (
                    <View
                      style={[
                        styles.metricBarFill,
                        metric.status === 'warning' && styles.metricBarFillWarning,
                        { width: `${metric.percentage}%` },
                      ]}
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Spacer for bottom bar */}
        <View style={{ height: 130 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {recommendedLessonId != null ? (
          <Button
            variant="primary"
            size="large"
            fullWidth
            onPress={handleStartRecommendedLesson}
            icon="▶"
            iconPosition="right"
          >
            Start Recommended Lesson
          </Button>
        ) : recommendedDrillId != null ? (
          <Button
            variant="primary"
            size="large"
            fullWidth
            onPress={handleStartDrill}
            icon="▶"
            iconPosition="right"
          >
            Practice Recommended Drill
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="large"
            fullWidth
            onPress={() => navigation.navigate('Capture')}
            icon="→"
            iconPosition="right"
          >
            Next Swing
          </Button>
        )}
        <TouchableOpacity
          style={styles.homeLink}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.7}
        >
          <Text style={styles.homeLinkText}>Return to Home</Text>
        </TouchableOpacity>
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconButtonText: {
    fontSize: 20,
    color: colors.white,
  },
  titleArea: {
    alignItems: 'center',
  },
  club: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.gray[400],
  },
  date: {
    fontSize: 12,
    color: colors.gray[500],
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Score Section
  scoreSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  scoreRing: {
    position: 'relative',
    width: 192,
    height: 192,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreGlow: {
    position: 'absolute',
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(19, 236, 91, 0.2)',
  },
  scoreSvg: {
    position: 'absolute',
  },
  scoreText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -2.4,
    color: colors.white,
  },
  scoreRating: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: colors.primary,
    marginTop: 4,
  },

  // XP Banner
  xpBanner: {
    width: '100%',
    backgroundColor: '#1a2c20',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 9999,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  xpContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  xpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  xpIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eab308',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpIconText: {
    fontSize: 20,
    color: '#000',
  },
  xpInfo: {
    gap: 4,
  },
  xpEarned: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#fbbf24',
  },
  xpProgress: {
    width: 96,
    height: 6,
    backgroundColor: colors.gray[700],
    borderRadius: 9999,
    overflow: 'hidden',
  },
  xpProgressFill: {
    height: '100%',
    backgroundColor: '#eab308',
    borderRadius: 9999,
  },
  xpLevel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[400],
  },

  // Swing capture card (no video URL)
  videoCard: {
    position: 'relative',
    width: '100%',
    aspectRatio: (16 / 9) as any,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    backgroundColor: colors.gray[800],
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  videoPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[400],
  },
  videoPlaceholderSubtext: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(19, 236, 91, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  playIcon: {
    fontSize: 24,
    color: colors.background,
    marginLeft: 4,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(19, 236, 91, 0.3)',
  },
  videoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },

  // Cards
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  cardFocus: {
    overflow: 'hidden',
  },
  cardDecoration: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
    opacity: 0.1,
  },
  cardDecorationIcon: {
    fontSize: 64,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardIconGood: {
    color: colors.primary,
    fontSize: 24,
  },
  cardIconWarning: {
    color: colors.accent,
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },

  // Chips
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
  },
  chipGood: {
    backgroundColor: 'rgba(19, 236, 91, 0.1)',
    borderColor: 'rgba(19, 236, 91, 0.2)',
  },
  chipWarning: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  chipTextGood: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
  },
  chipTextWarning: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fb923c',
  },

  // Coach Tip
  coachTip: {
    backgroundColor: 'rgba(249, 115, 22, 0.05)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
    gap: 12,
  },
  coachTipText: {
    fontSize: 14,
    color: colors.gray[300],
    lineHeight: 21,
  },
  coachTipStrong: {
    color: colors.white,
    fontWeight: '700',
  },

  // Metrics
  metrics: {
    gap: 20,
    marginTop: 12,
  },
  metric: {
    gap: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[400],
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  metricValueWarning: {
    color: colors.accent,
  },
  metricNote: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.primary,
  },
  metricBar: {
    height: 8,
    width: '100%',
    backgroundColor: colors.gray[700],
    borderRadius: 9999,
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 9999,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 2,
  },
  metricBarFillWarning: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
  },
  metricBarCenter: {
    width: '50%',
    height: '100%',
    backgroundColor: 'transparent',
    borderRightWidth: 2,
    borderRightColor: colors.gray[600],
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 16,
    paddingTop: 32,
    backgroundColor: 'rgba(16, 34, 22, 0.95)',
    gap: 10,
  },
  homeLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  homeLinkText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Swing phase cards
  phaseCardsSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  phaseCardsRow: {
    gap: 10,
    paddingRight: 16,
  },
  phaseCard: {
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  phaseCardImage: {
    width: '100%',
    height: 130,
  },
  phaseCardLabel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 4,
  },
  phaseCardLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },

  // Issue-to-fix cards
  issueCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  issueCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  issueRow: {
    marginBottom: 6,
  },
  issueRowLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  issueRowValue: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  issueRowFix: {
    backgroundColor: 'rgba(124, 179, 66, 0.08)',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  issueRowFixText: {
    color: colors.primary,
    fontWeight: '500',
  },
  issueFixCta: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  issueFixCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
