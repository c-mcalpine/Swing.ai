import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconButton, Button, MetaTag } from '@/components';
import { useSwingTaxonomy } from '@/hooks/useTaxonomy';
import { getDrillsForError, getCuesForError } from '@/api/taxonomy';
import { colors, spacing } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';

type SwingDiagnosticViewScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'SwingDiagnosticView'
>;
type SwingDiagnosticViewScreenRouteProp = RouteProp<AppStackParamList, 'SwingDiagnosticView'>;

/**
 * Swing Diagnostic View Screen - Detailed technical analysis of swing
 * Shows phase scores, errors, mechanics, coaching cues, and recommended drills
 * Matches web design exactly
 */
export function SwingDiagnosticViewScreen() {
  const navigation = useNavigation<SwingDiagnosticViewScreenNavigationProp>();
  const route = useRoute<SwingDiagnosticViewScreenRouteProp>();
  const diagnosticId = (route.params as any)?.diagnosticId;

  // For now, using mock data - in production would fetch from API
  const diagnostic = {
    id: diagnosticId || 1,
    video_url: 'https://example.com/video.mp4',
    phase_scores: {
      'address': 85,
      'takeaway': 72,
      'backswing': 78,
      'transition': 65,
      'downswing': 58,
      'impact': 70,
      'follow-through': 82,
    },
    mechanic_scores: {
      'weight-shift': 55,
      'hip-rotation': 68,
      'shoulder-turn': 72,
      'wrist-hinge': 45,
      'club-path': 60,
    },
    error_scores: {
      'early-extension': 75,
      'over-the-top': 60,
      'chicken-wing': 45,
    },
  };

  const { data: taxonomy, loading: taxonomyLoading, error: taxonomyError } = useSwingTaxonomy();

  const loading = taxonomyLoading;
  const error = taxonomyError;

  // Parse scores from diagnostic
  const phaseScores = useMemo(() => {
    return diagnostic?.phase_scores || {};
  }, [diagnostic]);

  const mechanicScores = useMemo(() => {
    return diagnostic?.mechanic_scores || {};
  }, [diagnostic]);

  const errorScores = useMemo(() => {
    return diagnostic?.error_scores || {};
  }, [diagnostic]);

  // Get top errors (highest scores)
  const topErrors = useMemo(() => {
    if (!taxonomy?.errors || !errorScores) return [];

    const errorEntries = Object.entries(errorScores)
      .map(([slug, score]) => ({
        error: taxonomy.errors.find((e: any) => e.slug === slug),
        score: Number(score),
      }))
      .filter((e) => e.error && e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return errorEntries;
  }, [taxonomy, errorScores]);

  // Get mechanics that need improvement (lowest scores)
  const mechanicsToImprove = useMemo(() => {
    if (!taxonomy?.mechanics || !mechanicScores) return [];

    const mechanicEntries = Object.entries(mechanicScores)
      .map(([slug, score]) => ({
        mechanic: taxonomy.mechanics.find((m: any) => m.slug === slug),
        score: Number(score),
      }))
      .filter((m) => m.mechanic && m.score < 70)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    return mechanicEntries;
  }, [taxonomy, mechanicScores]);

  // Get recommended drills for top errors
  const recommendedDrills = useMemo(() => {
    if (!taxonomy || topErrors.length === 0) return [];

    const drillsSet = new Set();
    topErrors.forEach(({ error }) => {
      if (error) {
        const drills = getDrillsForError(taxonomy, error.id);
        drills.forEach((drill: any) => drillsSet.add(drill));
      }
    });

    return Array.from(drillsSet).slice(0, 5);
  }, [taxonomy, topErrors]);

  // Get coaching cues for top errors
  const coachingCues = useMemo(() => {
    if (!taxonomy || topErrors.length === 0) return [];

    const cuesSet = new Set();
    topErrors.forEach(({ error }) => {
      if (error) {
        const cues = getCuesForError(taxonomy, error.id);
        cues.forEach((cue: any) => cuesSet.add(cue));
      }
    });

    return Array.from(cuesSet).slice(0, 5);
  }, [taxonomy, topErrors]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading diagnostic...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading diagnostic: {error.message}</Text>
        <Button variant="secondary" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  if (!diagnostic) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Diagnostic not found</Text>
        <Button variant="secondary" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.safeAreaTop}>
        <View style={styles.header}>
          <IconButton icon="←" onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Swing Analysis</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Section */}
        {diagnostic.video_url && (
          <View style={styles.videoSection}>
            <Text style={styles.sectionTitle}>Your Swing</Text>
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>📹 Video Player</Text>
            </View>
          </View>
        )}

        {/* Phase Scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Swing Phase Breakdown</Text>
          <View style={styles.scores}>
            {Object.entries(phaseScores).map(([slug, score]) => {
              const phase = taxonomy?.phases.find((p: any) => p.slug === slug);
              if (!phase) return null;

              return (
                <View key={slug} style={styles.scoreItem}>
                  <View style={styles.scoreHeader}>
                    <Text style={styles.scoreName}>{phase.name}</Text>
                    <Text style={styles.scoreValue}>{score}/100</Text>
                  </View>
                  <View style={styles.scoreBar}>
                    <View
                      style={[
                        styles.scoreFill,
                        { width: `${score}%` },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top Errors */}
        {topErrors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Areas to Address</Text>
            <View style={styles.errors}>
              {topErrors.map(({ error, score }: any) => (
                <View key={error.id} style={styles.errorCard}>
                  <View style={styles.errorHeader}>
                    <Text style={styles.errorName}>{error.name}</Text>
                    <View style={styles.errorSeverity}>
                      <Text style={styles.errorSeverityText}>Severity: {score}%</Text>
                    </View>
                  </View>
                  {error.description && (
                    <Text style={styles.errorDescription}>{error.description}</Text>
                  )}
                  {error.fix && (
                    <View style={styles.errorFix}>
                      <Text style={styles.errorFixLabel}>Fix: </Text>
                      <Text style={styles.errorFixText}>{error.fix}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mechanics to Improve */}
        {mechanicsToImprove.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mechanics to Work On</Text>
            <View style={styles.mechanics}>
              {mechanicsToImprove.map(({ mechanic, score }: any) => (
                <View key={mechanic.id} style={styles.mechanicCard}>
                  <View style={styles.mechanicHeader}>
                    <Text style={styles.mechanicName}>{mechanic.name}</Text>
                    <View style={styles.mechanicScore}>
                      <Text style={styles.mechanicScoreText}>{score}%</Text>
                    </View>
                  </View>
                  {mechanic.description_short && (
                    <Text style={styles.mechanicDescription}>
                      {mechanic.description_short}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Coaching Cues */}
        {coachingCues.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coaching Tips</Text>
            <View style={styles.cues}>
              {coachingCues.map((cue: any) => (
                <View key={cue.id} style={styles.cueCard}>
                  <Text style={styles.cueText}>{cue.text}</Text>
                  {cue.cue_type && (
                    <Text style={styles.cueType}>{cue.cue_type}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recommended Drills */}
        {recommendedDrills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Drills</Text>
            <View style={styles.drills}>
              {recommendedDrills.map((drill: any) => (
                <TouchableOpacity
                  key={drill.id}
                  style={styles.drillCard}
                  onPress={() => {
                    // @ts-ignore
                    navigation.navigate('DrillDetails', { drillId: drill.id });
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.drillName}>{drill.name}</Text>
                  {drill.objective && (
                    <Text style={styles.drillObjective}>{drill.objective}</Text>
                  )}
                  <View style={styles.drillMeta}>
                    {drill.difficulty && (
                      <MetaTag
                        label={`Level ${drill.difficulty}`}
                        variant="compact"
                      />
                    )}
                    {drill.min_duration_min && (
                      <MetaTag
                        label={`${drill.min_duration_min} min`}
                        variant="compact"
                      />
                    )}
                  </View>
                  <Button
                    variant="primary"
                    size="small"
                    fullWidth
                    onPress={() => {
                      // @ts-ignore
                      navigation.navigate('DrillDetails', { drillId: drill.id });
                    }}
                    style={styles.drillStartBtn}
                  >
                    Start Drill
                  </Button>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actions}>
          <Button
            variant="primary"
            size="large"
            fullWidth
            onPress={() => {
              // @ts-ignore
              navigation.navigate('PersonalizedPlan');
            }}
          >
            View Personalized Plan
          </Button>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },

  // Loading/Error States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: 16,
    padding: 20,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 20,
    gap: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },

  // Content
  content: {
    flex: 1,
  },

  // Video Section
  videoSection: {
    padding: 24,
    paddingHorizontal: 16,
    backgroundColor: '#1c271f',
  },
  videoPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholderText: {
    color: '#6b7280',
    fontSize: 16,
  },

  // Sections
  section: {
    padding: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 16,
  },

  // Scores
  scores: {
    gap: 16,
  },
  scoreItem: {
    gap: 8,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  scoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#1c271f',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },

  // Errors
  errors: {
    gap: 12,
  },
  errorCard: {
    padding: 16,
    backgroundColor: '#1c271f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  errorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  errorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    flex: 1,
  },
  errorSeverity: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
  },
  errorSeverityText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400e',
  },
  errorDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    lineHeight: 21,
  },
  errorFix: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#dbeafe',
    borderRadius: 6,
    flexDirection: 'row',
  },
  errorFixLabel: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '700',
  },
  errorFixText: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },

  // Mechanics
  mechanics: {
    gap: 12,
  },
  mechanicCard: {
    padding: 16,
    backgroundColor: '#1c271f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  mechanicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  mechanicName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    flex: 1,
  },
  mechanicScore: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
  },
  mechanicScoreText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400e',
  },
  mechanicDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 21,
  },

  // Cues
  cues: {
    gap: 12,
  },
  cueCard: {
    padding: 16,
    backgroundColor: '#1c271f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cueText: {
    fontSize: 14,
    color: colors.white,
    marginBottom: 8,
    lineHeight: 21,
  },
  cueType: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },

  // Drills
  drills: {
    gap: 12,
  },
  drillCard: {
    padding: 16,
    backgroundColor: '#1c271f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  drillName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 8,
  },
  drillObjective: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
    lineHeight: 21,
  },
  drillMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  drillStartBtn: {
    marginTop: 0,
  },

  // Actions
  actions: {
    padding: 24,
    paddingHorizontal: 16,
  },
});
