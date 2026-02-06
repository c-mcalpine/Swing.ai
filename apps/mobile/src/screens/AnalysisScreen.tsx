import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import { useSwingAnalysisData } from '@/hooks/useSwingAnalysisData';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';

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

  const { data, loading, error } = useSwingAnalysisData(captureId);
  const [isPlaying, setIsPlaying] = useState(false);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading analysis...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Analysis not found'}</Text>
        <Button variant="secondary" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  const { analysis, capture } = data;

  // Parse scores
  const issueScores = analysis.issue_scores as Record<string, any>;
  const mechanicScores = analysis.mechanic_scores as Record<string, number>;
  const confidence = analysis.overall_confidence || 85;

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

  // Extract focus areas (issues with high severity)
  const focusAreas = Object.entries(issueScores)
    .filter(([_, data]: [string, any]) => data.severity === 'high')
    .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .slice(0, 2);

  // Metrics
  const metrics = [
    {
      label: 'Posture Quality',
      value: `${mechanicScores.posture || 0}%`,
      percentage: mechanicScores.posture || 0,
      status: (mechanicScores.posture || 0) >= 70 ? 'good' : 'warning',
    },
    {
      label: 'Hip Rotation',
      value: `${mechanicScores.hip_rotation || 0}%`,
      note: (mechanicScores.hip_rotation || 0) >= 80 ? 'Optimal' : 'Needs Work',
      percentage: mechanicScores.hip_rotation || 0,
      status: (mechanicScores.hip_rotation || 0) >= 70 ? 'good' : 'warning',
    },
    {
      label: 'Overall Form',
      value: `${confidence}%`,
      note: confidence >= 80 ? 'Strong' : 'Needs Improvement',
      percentage: confidence,
      status: confidence >= 70 ? 'good' : 'warning',
      centered: false,
    },
  ];

  const coachTip = analysis.coach_notes || 'Keep practicing! Focus on the areas highlighted above.';

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

  const handleStartDrill = () => {
    // Navigate to drill (placeholder)
    console.log('Start drill');
  };

  const handleNextSwing = () => {
    navigation.navigate('Capture');
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
          <Text style={styles.club}>{capture.club_type?.toUpperCase() || '7 IRON'}</Text>
          <Text style={styles.date}>
            {new Date(capture.captured_at).toLocaleString('en-US', {
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

        {/* XP Banner */}
        <View style={styles.xpBanner}>
          <View style={styles.xpContent}>
            <View style={styles.xpLeft}>
              <View style={styles.xpIcon}>
                <Text style={styles.xpIconText}>⚡</Text>
              </View>
              <View style={styles.xpInfo}>
                <Text style={styles.xpEarned}>+50 XP EARNED</Text>
                <View style={styles.xpProgress}>
                  <View style={[styles.xpProgressFill, { width: '70%' }]} />
                </View>
              </View>
            </View>
            <Text style={styles.xpLevel}>Lvl 12 Golfer</Text>
          </View>
        </View>

        {/* Video Playback */}
        <TouchableOpacity style={styles.videoCard} onPress={handlePlayVideo}>
          <Image
            source={{ uri: capture.video_url || 'https://via.placeholder.com/640x360' }}
            style={styles.videoBackground}
            resizeMode="cover"
          />
          <View style={styles.videoOverlay} />
          <View style={styles.videoPlay}>
            <View style={styles.playButton}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </View>
          <View style={styles.videoBadge}>
            <Text style={styles.videoBadgeText}>AI ANALYSIS ON</Text>
          </View>
        </TouchableOpacity>

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
        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <Button
          variant="secondary"
          size="large"
          fullWidth
          onPress={handleNextSwing}
          icon="→"
          iconPosition="right"
        >
          Next Swing
        </Button>
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
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
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

  // Video Card
  videoCard: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
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
  },
});
