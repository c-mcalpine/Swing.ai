import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/styles/tokens';

interface FilterChipProps {
  label: string;
  isActive?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * FilterChip - Reusable filter chip/pill button
 * Used in QuickDrills and ChallengeLeaderboard for filtering
 */
export function FilterChip({
  label,
  isActive = false,
  onPress,
  style,
}: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        isActive && styles.chipActive,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, isActive && styles.textActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    paddingHorizontal: 20,
    borderRadius: 9999,
    backgroundColor: '#1c271f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  text: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  textActive: {
    color: colors.background,
    fontWeight: '600',
  },
});
