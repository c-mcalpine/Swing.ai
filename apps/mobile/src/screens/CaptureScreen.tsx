import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@/navigation/AppStack';
import { colors, spacing, typography } from '@/styles/tokens';
import { Button } from '@/components';

type CaptureScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'Capture'
>;

/**
 * Capture Screen - Entry point for swing capture
 * Routes user to setup -> recording -> analysis
 */
export function CaptureScreen() {
  const navigation = useNavigation<CaptureScreenNavigationProp>();

  const handleStartCapture = () => {
    // Navigate to setup screen (club selection, positioning)
    navigation.navigate('InitialSwingSetup');
  };

  const handleQuickCapture = () => {
    // Skip setup, go straight to recording with default club
    navigation.navigate('SwingRecording', { club: '7 Iron' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🏌️</Text>
        <Text style={styles.title}>Ready to Record</Text>
        <Text style={styles.subtitle}>
          Capture your swing and get instant AI analysis
        </Text>

        <View style={styles.buttons}>
          <Button
            label="Start Setup"
            onPress={handleStartCapture}
            variant="primary"
            size="large"
            style={styles.button}
          />
          
          <TouchableOpacity
            onPress={handleQuickCapture}
            style={styles.quickButton}
          >
            <Text style={styles.quickButtonText}>
              Quick Capture (skip setup)
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Tips for Best Results:</Text>
          <Text style={styles.tip}>• Place phone 10ft away at waist height</Text>
          <Text style={styles.tip}>• Ensure full body is visible in frame</Text>
          <Text style={styles.tip}>• Use landscape orientation</Text>
          <Text style={styles.tip}>• Good lighting, no backlight</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  buttons: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  button: {
    width: '100%',
  },
  quickButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  quickButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  tips: {
    backgroundColor: colors.backgroundElevated,
    padding: spacing.lg,
    borderRadius: 12,
    width: '100%',
  },
  tipsTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  tip: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
});
