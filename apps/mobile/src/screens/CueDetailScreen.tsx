import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';
import type { Database } from '@/lib/supabaseTypes';

type CoachingCue = Database['public']['Tables']['coaching_cue']['Row'];

type CueDetailScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, 'CueDetail'>;
type CueDetailScreenRouteProp = RouteProp<AppStackParamList, 'CueDetail'>;

const CUE_TYPE_LABELS: Record<string, string> = {
  feel: 'Feel',
  visual: 'Visual',
  thought: 'Thought',
  verbal: 'Verbal',
};

const fetchCue = async (cueId: number) => {
  const { data, error } = await supabase
    .from('coaching_cue')
    .select('*')
    .eq('id', cueId)
    .single();
  if (error) throw error;
  return data as CoachingCue;
};

export function CueDetailScreen() {
  const navigation = useNavigation<CueDetailScreenNavigationProp>();
  const route = useRoute<CueDetailScreenRouteProp>();
  const { cueId } = route.params;

  const { data: cue, isLoading, error } = useQuery({
    queryKey: ['cue', cueId],
    queryFn: () => fetchCue(cueId),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerLabel}>COACHING CUE</Text>
          <View style={styles.closeBtn} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error || !cue ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Could not load cue.</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {cue.cue_type && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {CUE_TYPE_LABELS[cue.cue_type] ?? cue.cue_type}
              </Text>
            </View>
          )}

          <View style={styles.cueCard}>
            <Text style={styles.quoteIcon}>"</Text>
            <Text style={styles.cueText}>{cue.text}</Text>
            <Text style={styles.quoteIconClose}>"</Text>
          </View>

          {cue.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>COACHING NOTES</Text>
              <Text style={styles.notesText}>{cue.notes}</Text>
            </View>
          )}

          <View style={styles.metaRow}>
            {cue.level != null && (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>Level {cue.level}</Text>
              </View>
            )}
            {cue.cue_type && (
              <View style={[styles.metaChip, styles.metaChipGreen]}>
                <Text style={[styles.metaChipText, styles.metaChipTextGreen]}>
                  {CUE_TYPE_LABELS[cue.cue_type] ?? cue.cue_type}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.gotItBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.gotItText}>Got It</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    backgroundColor: 'rgba(17, 24, 19, 0.95)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.lg,
  },
  typeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 9999,
    backgroundColor: 'rgba(19, 236, 91, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(19, 236, 91, 0.3)',
    alignSelf: 'center',
  },
  typeBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cueCard: {
    width: '100%',
    backgroundColor: '#1c3024',
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(19, 236, 91, 0.15)',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quoteIcon: {
    fontSize: 48,
    color: colors.primary,
    opacity: 0.4,
    lineHeight: 48,
    alignSelf: 'flex-start',
  },
  quoteIconClose: {
    fontSize: 48,
    color: colors.primary,
    opacity: 0.4,
    lineHeight: 48,
    alignSelf: 'flex-end',
  },
  cueText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    lineHeight: 32,
  },
  notesSection: {
    width: '100%',
    gap: spacing.sm,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 15,
    color: '#d1d5db',
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metaChip: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  metaChipGreen: {
    backgroundColor: 'rgba(19, 236, 91, 0.08)',
    borderColor: 'rgba(19, 236, 91, 0.2)',
  },
  metaChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metaChipTextGreen: {
    color: colors.primary,
  },
  gotItBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 9999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  gotItText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
});
