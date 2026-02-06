import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomNav, IconButton, FilterChip, Button } from '@/components';
import { useSwingTaxonomy } from '@/hooks/useTaxonomy';
import { colors, spacing } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';

type QuickDrillsScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'QuickDrills'
>;

/**
 * Quick Drills Screen - Browse and select drills for practice
 * Matches web design exactly
 */
export function QuickDrillsScreen() {
  const navigation = useNavigation<QuickDrillsScreenNavigationProp>();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const { data: taxonomy, loading, error } = useSwingTaxonomy();

  const filters = ['All', 'Putting', 'Driving', 'Chipping', 'Irons'];

  // Map difficulty number to string
  const getDifficultyLabel = (difficulty: number | null | undefined): string => {
    if (!difficulty) return 'Beginner';
    if (difficulty <= 3) return 'Beginner';
    if (difficulty <= 6) return 'Intermediate';
    return 'Advanced';
  };

  // Get drills from taxonomy
  const drills = taxonomy?.drills || [];

  // For now, we'll show all drills regardless of filter since we don't have category in the schema
  const filteredDrills = drills;

  const handleStartDrill = (drillId: number) => {
    // @ts-ignore
    navigation.navigate('DrillDetails', { drillId });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.safeAreaTop}>
        <View style={styles.header}>
          <IconButton icon="←" onPress={() => navigation.goBack()} />

          <Text style={styles.headerTitle}>Quick Drills</Text>

          <View style={styles.headerActions}>
            <IconButton icon="🔍" />
          </View>
        </View>
      </SafeAreaView>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Headline */}
        <View style={styles.headline}>
          <Text style={styles.headlineText}>
            Select a focus area for today's session.
          </Text>
        </View>

        {/* Filter Chips */}
        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
            style={styles.filters}
          >
            {filters.map((filter) => (
              <FilterChip
                key={filter}
                label={filter}
                isActive={selectedFilter === filter}
                onPress={() => setSelectedFilter(filter)}
              />
            ))}
          </ScrollView>
          <View style={styles.filtersFade} />
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading drills...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error loading drills: {error.message}</Text>
            <Text style={styles.errorSubtext}>
              Please ensure your Supabase credentials are configured
            </Text>
          </View>
        )}

        {/* Drills List */}
        {!loading && !error && (
          <View style={styles.drills}>
            {filteredDrills.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No drills available. Please add drills to your Supabase database.
                </Text>
              </View>
            ) : (
              filteredDrills.map((drill: any) => (
                <TouchableOpacity
                  key={drill.id}
                  style={styles.drillCard}
                  activeOpacity={0.8}
                  onPress={() => handleStartDrill(drill.id)}
                >
                  {/* Image Section */}
                  <View style={styles.drillImageWrapper}>
                    <View style={styles.drillImage} />
                    <View style={styles.drillImageOverlay} />
                    <View style={styles.drillBadgeMobile}>
                      <Text style={styles.drillDifficulty}>
                        {getDifficultyLabel(drill.difficulty)}
                      </Text>
                    </View>
                  </View>

                  {/* Text Section */}
                  <View style={styles.drillInfo}>
                    <View style={styles.drillHeader}>
                      <View style={styles.drillText}>
                        <View style={styles.drillTitleRow}>
                          <Text style={styles.drillTitle}>{drill.name}</Text>
                        </View>
                        <Text style={styles.drillDescription} numberOfLines={2}>
                          {drill.objective || drill.description || 'No description available'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.drillFooter}>
                      <View style={styles.drillMeta}>
                        <Text style={styles.drillMetaIcon}>⏱</Text>
                        <Text style={styles.drillMetaText}>
                          {drill.min_duration_min ? `${drill.min_duration_min} min` : '5 min'}
                        </Text>
                      </View>

                      <Button
                        variant="secondary"
                        size="small"
                        onPress={() => handleStartDrill(drill.id)}
                      >
                        Start
                      </Button>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* End of List */}
        {!loading && !error && filteredDrills.length > 0 && (
          <View style={styles.endMessage}>
            <Text style={styles.endText}>END OF LIST</Text>
          </View>
        )}

        {/* Bottom padding for BottomNav */}
        <View style={{ height: 100 }} />
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
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.27,
  },
  headerActions: {
    width: 40,
    alignItems: 'flex-end',
  },

  // Content
  content: {
    flex: 1,
  },

  // Headline
  headline: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  headlineText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.56,
  },

  // Filter Chips
  filtersWrapper: {
    backgroundColor: colors.background,
    paddingVertical: 8,
    paddingBottom: 16,
    position: 'relative',
  },
  filters: {
    paddingLeft: 20,
  },
  filtersContent: {
    gap: 12,
    paddingRight: 20,
  },
  filtersFade: {
    position: 'absolute',
    right: 0,
    top: 8,
    bottom: 16,
    width: 32,
    backgroundColor: colors.background,
  },

  // Loading/Error/Empty
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#9db9a6',
    fontSize: 14,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#9db9a6',
    fontSize: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9db9a6',
    fontSize: 14,
    textAlign: 'center',
  },

  // Drills List
  drills: {
    gap: 16,
    paddingHorizontal: 16,
    marginTop: 8,
  },

  // Drill Card
  drillCard: {
    borderRadius: 12,
    backgroundColor: '#1c271f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },

  // Image Section
  drillImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 192,
    backgroundColor: '#1c271f',
  },
  drillImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#e5e7eb',
  },
  drillImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  drillBadgeMobile: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  drillDifficulty: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    fontSize: 12,
    fontWeight: '500',
    color: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },

  // Text Section
  drillInfo: {
    padding: 20,
  },
  drillHeader: {
    marginBottom: 16,
  },
  drillText: {
    flex: 1,
  },
  drillTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  drillTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  drillDescription: {
    color: '#9db9a6',
    fontSize: 14,
    lineHeight: 21,
  },

  // Footer
  drillFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  drillMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  drillMetaIcon: {
    fontSize: 18,
    color: '#9db9a6',
  },
  drillMetaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9db9a6',
  },


  // End Message
  endMessage: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  endText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
  },
});
