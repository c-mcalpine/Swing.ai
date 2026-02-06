import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/styles/tokens';

/**
 * Capture Screen - Swing capture with camera
 * TODO: Implement camera capture in later phase
 */
export function CaptureScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record Swing</Text>
      <Text style={styles.text}>Camera capture coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  text: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
});
