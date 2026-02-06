import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/AppStack';
import { getUserSwingAnalyses, SwingAnalysisWithCapture } from '@/api/swingAnalysis';
import { colors, spacing, typography, borderRadius } from '@/styles/tokens';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

export function AnalysisHistoryScreen({ navigation }: Props) {
  const [analyses, setAnalyses] = useState<SwingAnalysisWithCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalyses = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await getUserSwingAnalyses(20);
      setAnalyses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analyses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  const handleAnalysisPress = (captureId: number) => {
    navigation.navigate('Analysis', { captureId });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderAnalysisItem = ({ item }: { item: SwingAnalysisWithCapture }) => {
    const { analysis, capture } = item;
    const confidence = (analysis.overall_confidence || 0) * 100;
    const issueCount = Object.keys((analysis.issue_scores as any) || {}).length;
    const topIssues = Object.entries((analysis.issue_scores as Record<string, number>) || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    return (
      <TouchableOpacity
        style={styles.analysisCard}
        onPress={() => handleAnalysisPress(capture.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.scoreCircle,
                {
                  borderColor:
                    confidence >= 75 ? colors.success : confidence >= 50 ? colors.warning : colors.error,
                },
              ]}
            >
              <Text style={styles.scoreText}>{Math.round(confidence)}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Swing Analysis</Text>
              <Text style={styles.cardDate}>{formatDate(analysis.created_at)}</Text>
            </View>
          </View>
          <View style={styles.chevron}>
            <Text style={styles.chevronIcon}>›</Text>
          </View>
        </View>

        {topIssues.length > 0 && (
          <View style={styles.issuesSection}>
            <Text style={styles.issuesLabel}>Top Issues:</Text>
            <View style={styles.issueChips}>
              {topIssues.map(([slug, severity]) => (
                <View key={slug} style={styles.issueChip}>
                  <Text style={styles.issueChipText}>
                    {slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <Text style={styles.issueSeverity}>{Math.round(severity * 100)}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta}>
            {issueCount} issue{issueCount !== 1 ? 's' : ''} detected
          </Text>
          <Text style={styles.cardMeta}>Model: {analysis.model}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your swing history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadAnalyses()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (analyses.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🏌️</Text>
        <Text style={styles.emptyTitle}>No Swing Analyses Yet</Text>
        <Text style={styles.emptyText}>
          Record your first swing to see AI-powered analysis and track your progress.
        </Text>
        <TouchableOpacity
          style={styles.recordButton}
          onPress={() => navigation.navigate('Capture')}
        >
          <Text style={styles.recordButtonText}>Record Swing</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Swing History</Text>
        <Text style={styles.headerSubtitle}>{analyses.length} analyses</Text>
      </View>

      <FlatList
        data={analyses}
        renderItem={renderAnalysisItem}
        keyExtractor={(item) => item.analysis.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadAnalyses(true)} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listContainer: {
    padding: spacing.lg,
    paddingBottom: 100, // Account for bottom nav
  },
  analysisCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    backgroundColor: colors.white,
  },
  scoreText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
  chevronIcon: {
    fontSize: 28,
    color: colors.gray[400],
  },
  issuesSection: {
    marginBottom: spacing.md,
  },
  issuesLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  issueChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  issueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  issueChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  issueSeverity: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    fontWeight: typography.fontWeight.semibold,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  cardMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  recordButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  recordButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});
