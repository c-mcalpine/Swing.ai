import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/styles/tokens';

interface MetaTagProps {
  icon?: string;
  label: string;
  variant?: 'default' | 'compact';
  style?: ViewStyle;
}

/**
 * MetaTag - Reusable metadata pill/tag
 * Used in DailyLesson, DrillDetails, and other screens to show metadata
 */
export function MetaTag({
  icon,
  label,
  variant = 'default',
  style,
}: MetaTagProps) {
  return (
    <View
      style={[
        styles.tag,
        variant === 'compact' && styles.tagCompact,
        style,
      ]}
    >
      {icon && (
        <Text style={[styles.icon, variant === 'compact' && styles.iconCompact]}>
          {icon}
        </Text>
      )}
      <Text style={[styles.label, variant === 'compact' && styles.labelCompact]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: '#1c2e22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagCompact: {
    height: 24,
    paddingHorizontal: 12,
    gap: 4,
  },
  icon: {
    fontSize: 16,
    color: colors.primary,
  },
  iconCompact: {
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#d1d5db',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  labelCompact: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
});
