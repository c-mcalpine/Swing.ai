import React, { useState } from 'react';
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
import { BellIcon, BellRingingIcon, TrophyIcon, CrownIcon } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/lib/AuthContext';
import { useTierLeaderboard } from '@/hooks/useTierLeaderboard';
import { useChallengesQuery } from '@/hooks/useQueries';
import { BottomNav, useBottomNavPadding } from '@/components/BottomNav';
import { colors, spacing } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';

type ChallengeLeaderboardScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'ChallengeLeaderboard'
>;

/** Add tier icon assets (tiers 1–10) and use in tier header, e.g.:
 *  const TIER_ICONS: Record<number, ImageSourcePropType> = {
 *    1: require('@/assets/tiers/tier-1.png'),
 *    2: require('@/assets/tiers/tier-2.png'),
 *    // ... 3–10
 *  };
 *  Then replace the tierIconPlaceholder View with:
 *  <Image source={TIER_ICONS[tierNumber]} style={styles.tierIcon} />
 */

/**
 * Challenge Leaderboard Screen - Tier-based weekly leaderboard and active events
 */
export function ChallengeLeaderboardScreen() {
  const navigation = useNavigation<ChallengeLeaderboardScreenNavigationProp>();
  const { userId } = useAuth();

  const [activeView, setActiveView] = useState<'leaderboards' | 'events'>('leaderboards');
  const [hasUnreadNotifications] = useState(false);

  const { data: tierData, isLoading: tierLoading, error: leaderboardError, isFetching: tierFetching } = useTierLeaderboard(50);
  const { data: challengesData, isLoading: challengesLoading } = useChallengesQuery(userId ?? null);

  const isInitialLoad = tierLoading && tierData === undefined;
  const bottomNavPadding = useBottomNavPadding();

  const formatPoints = (points: number) => points.toLocaleString();

  const rows = tierData?.rows ?? [];
  const tierName = tierData?.tierName ?? 'Tier';
  const tierNumber = tierData?.rows?.[0]?.tier ?? tierData?.myRow?.tier ?? 1;
  const myRow = tierData?.myRow;

  type PodiumRow = { rank: number; name: string; points: string; avatar: string; isMe: boolean };
  const podium: PodiumRow[] = rows.slice(0, 3).map((r) => ({
    rank: r.rank,
    name: r.username ?? 'Player',
    points: formatPoints(r.xp_week),
    avatar: r.avatar_url ?? 'https://via.placeholder.com/150',
    isMe: r.is_me,
  }));
  while (podium.length < 3) {
    podium.push({
      rank: podium.length + 1,
      name: 'Awaiting...',
      points: '0',
      avatar: 'https://via.placeholder.com/150',
      isMe: false,
    });
  }
  const displayPodium = podium.length === 3 ? [podium[1], podium[0], podium[2]] : podium;

  const rankings: (PodiumRow & { rankTitle?: string })[] = rows.slice(3).map((r) => ({
    rank: r.rank,
    name: r.username ?? 'Golfer',
    points: formatPoints(r.xp_week),
    avatar: r.avatar_url ?? 'https://via.placeholder.com/150',
    isMe: r.is_me,
  }));

  const myRank = myRow
    ? {
        rank: myRow.rank,
        name: 'You',
        points: formatPoints(myRow.xp_week),
        avatar: myRow.avatar_url ?? 'https://via.placeholder.com/150',
      }
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.safeAreaTop}>
        <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={[styles.iconBadge, styles.iconBadgeTrophy]}>
            <TrophyIcon size={24} color={colors.white} weight="regular" />
          </View>
          <Text style={styles.title}>Arena</Text>
          <View style={styles.iconBadge}>
            {hasUnreadNotifications ? (
              <BellRingingIcon size={24} color={colors.white} weight="duotone" />
            ) : (
              <BellIcon size={24} color={colors.white} weight="regular" />
            )}
          </View>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentedWrapper}>
          <View style={styles.segmented}>
            <TouchableOpacity
              style={[
                styles.segment,
                activeView === 'leaderboards' && styles.segmentActive,
              ]}
              onPress={() => setActiveView('leaderboards')}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeView === 'leaderboards' && styles.segmentTextActive,
                ]}
              >
                Leaderboards
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, activeView === 'events' && styles.segmentActive]}
              onPress={() => setActiveView('events')}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeView === 'events' && styles.segmentTextActive,
                ]}
              >
                Events
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
      </SafeAreaView>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingBottom: activeView === 'leaderboards' && myRank ? bottomNavPadding + 88 : bottomNavPadding,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading State */}
        {activeView === 'leaderboards' && isInitialLoad && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        )}

        {/* Error State */}
        {activeView === 'leaderboards' && !isInitialLoad && leaderboardError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>
              Failed to load leaderboard. Check RLS policies.
            </Text>
          </View>
        )}

        {/* Leaderboards View */}
        {activeView === 'leaderboards' && !isInitialLoad && !leaderboardError && (
          <>
            {/* Tier: icon (placeholder) → tier name → details */}
            <View style={styles.tierHeader}>
              {/* Placeholder for tier icon (tier 1–10). Replace with: <Image source={tierIcons[tierNumber]} style={styles.tierIcon} /> */}
              <View style={styles.tierIconPlaceholder}>
                <Text style={styles.tierIconPlaceholderText}>{tierNumber}</Text>
              </View>
              <Text style={styles.tierName}>{tierName}</Text>
              <Text style={styles.tierSubline}>
                {myRow ? `Rank #${myRow.rank} • ${formatPoints(myRow.xp_week)} XP this week` : 'Loading your rank…'}
              </Text>
              {tierFetching ? <Text style={styles.tierUpdating}>Updating…</Text> : null}
            </View>

            {/* Podium Section */}
            <View style={styles.podium}>
              <View style={styles.podiumGlow} />
              <View style={styles.podiumPlayers}>
                {displayPodium.map((player, index) => (
                  <View
                    key={`podium-${player.rank}-${index}`}
                    style={[
                      styles.podiumPlayer,
                      player.rank === 1 && styles.podiumPlayerFirst,
                    ]}
                  >
                    <View style={styles.podiumAvatarWrapper}>
                      {player.rank === 1 && (
                        <View style={styles.crown}>
                          <CrownIcon size={24} color={colors.white} weight="regular" />
                        </View>
                      )}
                      <View
                        style={[
                          styles.podiumAvatarRing,
                          player.rank === 1 && styles.podiumAvatarRingFirst,
                          player.rank === 3 && styles.podiumAvatarRingThird,
                        ]}
                      >
                        <Image
                          source={{ uri: player.avatar }}
                          style={styles.podiumAvatar}
                        />
                      </View>
                      <View
                        style={[
                          styles.podiumRank,
                          player.rank === 1 && styles.podiumRankFirst,
                        ]}
                      >
                        <Text
                          style={[
                            styles.podiumRankText,
                            player.rank === 1 && styles.podiumRankTextFirst,
                          ]}
                        >
                          #{player.rank}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.podiumInfo}>
                      <Text
                        style={[
                          styles.podiumName,
                          player.rank === 1 && styles.podiumNameFirst,
                          player.isMe && styles.podiumNameMe,
                        ]}
                        numberOfLines={1}
                      >
                        {player.isMe ? 'You' : player.name}
                      </Text>
                      <Text
                        style={[
                          styles.podiumPoints,
                          player.rank === 1 && styles.podiumPointsFirst,
                        ]}
                      >
                        {player.points} pts
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* List Header */}
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>Golfer</Text>
              <Text style={styles.listHeaderText}>XP</Text>
            </View>

            {/* Ranking List */}
            <View style={styles.rankings}>
              {rankings.length > 0 ? (
                rankings.map((player, index) => (
                  <View
                    key={`rank-${player.rank}-${index}`}
                    style={[
                      styles.rankCard,
                      index === rankings.length - 1 && styles.rankCardFaded,
                    ]}
                  >
                    <Text style={styles.rankNumber}>{player.rank}</Text>
                    <Image source={{ uri: player.avatar }} style={styles.rankAvatar} />
                    <View style={styles.rankInfo}>
                      <Text style={[styles.rankName, player.isMe && styles.rankNameMe]}>
                        {player.isMe ? 'You' : player.name}
                      </Text>
                    </View>
                    <View style={styles.rankScore}>
                      <Text style={styles.rankPoints}>{player.points}</Text>
                      <Text style={styles.rankTrendNeutral}>pts</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No rankings to display yet</Text>
              )}
            </View>
          </>
        )}

        {/* Events View */}
        {activeView === 'events' && (
          <View style={styles.eventsContent}>
            {(challengesLoading && challengesData === undefined) ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading challenges...</Text>
              </View>
            ) : challengesData && challengesData.length > 0 ? (
              challengesData.map(({ instance, progress }) => {
                const progressPercent = progress
                  ? Math.min(
                      100,
                      ((progress.progress_value || 0) /
                        (instance.challenge.target_value || 1)) *
                        100
                    )
                  : 0;

                return (
                  <View key={instance.id} style={styles.challengeCard}>
                    <View style={styles.challengeHeader}>
                      <View style={styles.challengeHeaderLeft}>
                        <Text style={styles.challengeTitle}>
                          {instance.challenge.title}
                        </Text>
                        <Text style={styles.challengeDescription}>
                          {instance.challenge.description}
                        </Text>
                      </View>
                      {progress?.is_completed && (
                        <Text style={styles.challengeCheckIcon}>✓</Text>
                      )}
                    </View>
                    <View style={styles.challengeProgress}>
                      <View style={styles.challengeProgressHeader}>
                        <Text style={styles.challengeProgressText}>
                          {progress ? Math.floor(progress.progress_value || 0) : 0} /{' '}
                          {instance.challenge.target_value} {instance.challenge.metric_type}
                        </Text>
                        <Text style={styles.challengeXp}>
                          +{instance.challenge.reward_xp} XP
                        </Text>
                      </View>
                      <View style={styles.challengeProgressBar}>
                        <View
                          style={[
                            styles.challengeProgressFill,
                            { width: `${progressPercent}%` },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyTitle}>No active challenges at the moment</Text>
                <Text style={styles.emptySubtitle}>Check back soon for new events!</Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* Sticky My Rank - Only show on leaderboards view */}
      {activeView === 'leaderboards' && myRank && (
        <View style={[styles.myRankWrapper, { bottom: bottomNavPadding }]}>
          <View style={styles.myRank}>
            <View style={styles.myRankHighlight} />
            <Text style={styles.myRankNumber}>{myRank.rank}</Text>
            <Image source={{ uri: myRank.avatar }} style={styles.myRankAvatar} />
            <View style={styles.myRankInfo}>
              <Text style={styles.myRankName}>{myRank.name}</Text>
              <Text style={styles.myRankPercentile}>{tierName}</Text>
            </View>
            <View style={styles.myRankScore}>
              <Text style={styles.myRankPoints}>{myRank.points}</Text>
              <Text style={styles.myRankLabel}>pts</Text>
            </View>
          </View>
        </View>
      )}

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
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: 16,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Header
  header: {
    backgroundColor: 'rgba(16, 34, 22, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1c271f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconBadgeTrophy: {},
  iconBadgeIcon: {
    fontSize: 24,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: colors.white,
  },

  // Segmented Control
  segmentedWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  segmented: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    borderRadius: 9999,
    backgroundColor: '#1c271f',
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  segment: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  segmentActive: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9db9a6',
  },
  segmentTextActive: {
    color: colors.background,
  },

  tierHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    alignItems: 'center',
  },
  tierIconPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(28, 39, 31, 0.8)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tierIconPlaceholderText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.25)',
  },
  tierIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  tierName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  tierSubline: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tierUpdating: {
    marginTop: 4,
    fontSize: 12,
    color: colors.primary,
    textAlign: 'center',
  },

  // Filter Chips (kept for layout; tier leaderboard has no filters)
  filters: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  filtersContent: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filter: {
    height: 36,
    paddingHorizontal: 20,
    borderRadius: 9999,
    backgroundColor: '#1c271f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterActive: {
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9db9a6',
  },
  filterTextActive: {
    color: colors.background,
  },

  // Content
  content: {
    flex: 1,
  },

  // Podium
  podium: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    position: 'relative',
  },
  podiumGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '75%',
    height: '75%',
    backgroundColor: 'rgba(19, 236, 91, 0.1)',
    borderRadius: 9999,
    transform: [{ translateX: -150 }, { translateY: -100 }],
  },
  podiumPlayers: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 12,
  },
  podiumPlayer: {
    alignItems: 'center',
    gap: 8,
    width: 96,
  },
  podiumPlayerFirst: {
    width: 112,
    marginTop: -24,
    zIndex: 10,
  },
  podiumAvatarWrapper: {
    position: 'relative',
  },
  crown: {
    position: 'absolute',
    top: -32,
    left: '50%',
    transform: [{ translateX: -16 }],
    zIndex: 10,
  },
  crownIcon: {
    fontSize: 32,
  },
  podiumAvatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1c271f',
    padding: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  podiumAvatarRingFirst: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(19, 236, 91, 0.2)',
    borderWidth: 4,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  podiumAvatarRingThird: {
    borderColor: 'rgba(205, 127, 50, 0.5)',
  },
  podiumAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  podiumRank: {
    position: 'absolute',
    bottom: -12,
    left: '50%',
    transform: [{ translateX: -20 }],
    backgroundColor: '#1c271f',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  podiumRankFirst: {
    backgroundColor: colors.primary,
    borderWidth: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  podiumRankText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  podiumRankTextFirst: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
  podiumInfo: {
    alignItems: 'center',
    marginTop: 4,
    width: '100%',
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
  podiumNameFirst: {
    fontSize: 16,
    fontWeight: '700',
  },
  podiumNameMe: {
    color: colors.primary,
    fontWeight: '700',
  },
  podiumBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
  podiumBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
  },
  podiumPoints: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  podiumPointsFirst: {
    fontSize: 14,
    fontWeight: '700',
  },

  // List Header
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  listHeaderText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9db9a6',
    letterSpacing: 0.6,
  },

  // Rankings
  rankings: {
    gap: 12,
    paddingHorizontal: 16,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#1c271f',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  rankCardFaded: {
    opacity: 0.7,
  },
  rankNumber: {
    width: 24,
    textAlign: 'center',
    color: colors.gray[400],
    fontWeight: '700',
    fontSize: 14,
  },
  rankAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rankInfo: {
    flex: 1,
  },
  rankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  rankNameMe: {
    color: colors.primary,
    fontWeight: '700',
  },
  rankBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(19, 236, 91, 0.2)',
  },
  rankBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  rankHandicap: {
    fontSize: 12,
    color: '#9db9a6',
  },
  rankScore: {
    alignItems: 'flex-end',
  },
  rankPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  rankTrendNeutral: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.gray[500],
  },

  // My Rank (Sticky) - bottom set dynamically via useBottomNavPadding in JSX
  myRankWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  myRank: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#1c271f',
    borderWidth: 2,
    borderColor: 'rgba(19, 236, 91, 0.3)',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 10,
    overflow: 'hidden',
  },
  myRankHighlight: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
  },
  myRankNumber: {
    width: 24,
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  myRankAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(19, 236, 91, 0.5)',
  },
  myRankInfo: {
    flex: 1,
  },
  myRankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  myRankName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  myRankBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(19, 236, 91, 0.2)',
  },
  myRankBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  myRankPercentile: {
    fontSize: 12,
    color: '#9db9a6',
  },
  myRankScore: {
    alignItems: 'flex-end',
  },
  myRankPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  myRankLabel: {
    fontSize: 10,
    color: '#9db9a6',
  },

  // Events View
  eventsContent: {
    padding: 16,
  },
  challengeCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  challengeHeaderLeft: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  challengeCheckIcon: {
    fontSize: 24,
    color: colors.primary,
  },
  challengeProgress: {
    marginTop: 12,
  },
  challengeProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 12,
    marginBottom: 4,
  },
  challengeProgressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  challengeXp: {
    fontSize: 12,
    color: colors.primary,
  },
  challengeProgressBar: {
    height: 6,
    backgroundColor: colors.backgroundElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    padding: 32,
    color: colors.textSecondary,
    fontSize: 14,
  },
});
