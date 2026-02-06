import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, ProgressIndicator, IconButton, FilterChip } from '@/components';
import { colors, spacing } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';

type InitialSwingSetupScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'InitialSwingSetup'
>;

/**
 * Initial Swing Setup Screen - Camera setup with AR grid overlay
 * Matches web design exactly
 */
export function InitialSwingSetupScreen() {
  const navigation = useNavigation<InitialSwingSetupScreenNavigationProp>();
  const [selectedClub, setSelectedClub] = useState('7 Iron');

  const clubs = ['7 Iron', 'Driver', 'Putter', 'Wedge'];

  const handleStartRecording = () => {
    // @ts-ignore
    navigation.navigate('SwingRecording');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Camera Feed Background */}
      <ImageBackground
        source={{
          uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCs57TR4hk_CDpoqtSnP3_S1vcc3VyzmLD6iWUdDCjM8VgKoNQcF4FF-DvB3y83jf-xKL5MnmM5WU_00UptQ-xhg2nuPbnLlG8c3Fs60ACEVdti6qAlHv8QJK0FuoFShsHG_Vc_cMFoGRYUj2wFltaddGvJgge5NHmZ7cgTsBzBJ-0DFpnTahFDuwZrXIavoNH8s3oTIhtBYKyU7gfnomCGoyYZO6JoZ7phK95W2cb0Mw2Ut5CFErout6kI5ZlhODu3l7YLNMt7Ru8',
        }}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.backgroundOverlay} />
      </ImageBackground>

      {/* AR Grid Overlay */}
      <View style={styles.arOverlay}>
        <View style={styles.gridBox}>
          {/* Corner Indicators */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Center Guide Lines */}
          <View style={styles.guideLines}>
            <View style={[styles.guideLine, styles.guideLineVertical]} />
            <View style={[styles.guideLine, styles.guideLineHorizontal]} />
          </View>

          {/* Live Feedback Pill */}
          <View style={styles.feedbackPill}>
            <Text style={styles.feedbackIcon}>✓</Text>
            <Text style={styles.feedbackText}>PHONE LEVEL</Text>
          </View>
        </View>

        <Text style={styles.headline}>Align yourself in the grid</Text>
      </View>

      {/* Top Navigation */}
      <SafeAreaView style={styles.topNav}>
        <View style={styles.topNavContent}>
          <IconButton icon="←" onPress={handleBack} size="large" style={styles.iconBtn} />

          <View style={styles.titleArea}>
            <Text style={styles.subtitle}>SETUP WIZARD</Text>
            <Text style={styles.title}>Baseline Evaluation</Text>
          </View>

          <IconButton icon="❓" size="large" style={styles.iconBtn} />
        </View>
      </SafeAreaView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <View style={styles.progressWrapper}>
          <ProgressIndicator steps={3} currentStep={0} variant="dots" />
        </View>

        {/* Instruction Card */}
        <View style={styles.instructionCard}>
          <View style={styles.cardContent}>
            <View style={styles.cardRow}>
              <View style={styles.cardText}>
                <View style={styles.cardHeader}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>STEP 1</Text>
                  </View>
                  <Text style={styles.cardTitle}>Position Camera</Text>
                </View>
                <Text style={styles.cardDescription}>
                  Place your phone waist-high, 10ft back, facing the golfer directly.
                </Text>
              </View>

              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASvhXWs6vfib4yatHnnURWOa_NBFT0c21lYLwJ6-MzIh7vbay3HWHDo7RY4tuQ_J3v4Xdeda8vfad0XoNSaC9_zIZd1Zabn6n8VPW8Xs-1mEZCSdWEZgseK3hELLlkYqKhKQ0_M6EcoGkaUL1aqiRpneZsLpVxIFevSix6Y2xUrlVKwH_epYtnhf5ZwaWVMlAqM9ztGZF5aKc6pYLActSAcfNUS_ncePGZs1B2unjOts-0PKc2GYTdZfgKwBfgmDcjyVXTx6WcQXI',
                }}
                style={styles.cardImage}
              />
            </View>

            <View style={styles.cardDivider} />

            {/* Club Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.clubSelectorContent}
              style={styles.clubSelector}
            >
              {clubs.map((club) => (
                <FilterChip
                  key={club}
                  label={club}
                  isActive={selectedClub === club}
                  onPress={() => setSelectedClub(club)}
                  style={styles.clubChip}
                />
              ))}
              <IconButton icon="⌄" style={styles.clubChipMore} />
            </ScrollView>
          </View>
        </View>

        {/* Primary Action Button */}
        <View style={styles.actionWrapper}>
          <Button
            variant="primary"
            size="large"
            fullWidth
            icon="📹"
            iconPosition="left"
            onPress={handleStartRecording}
          >
            Start Recording
          </Button>
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

  // Camera Feed Background
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    resizeMode: 'cover',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },

  // AR Grid Overlay
  arOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  gridBox: {
    position: 'relative',
    width: '85%',
    aspectRatio: 3 / 4,
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
  },

  // Corner Indicators
  corner: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },

  // Center Guide Lines
  guideLines: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  guideLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    position: 'absolute',
  },
  guideLineVertical: {
    height: '100%',
    width: 1,
  },
  guideLineHorizontal: {
    width: '100%',
    height: 1,
  },

  // Live Feedback Pill
  feedbackPill: {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: [{ translateX: -75 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackIcon: {
    color: colors.primary,
    fontSize: 18,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.white,
  },

  // Headline Text
  headline: {
    marginTop: 24,
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.36,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // Top Navigation
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  topNavContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  iconBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleArea: {
    flex: 1,
    alignItems: 'center',
  },
  subtitle: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.27,
  },

  // Bottom Controls
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    gap: 16,
    paddingTop: 48,
    paddingBottom: 32,
  },
  progressWrapper: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  // Instruction Card
  instructionCard: {
    paddingHorizontal: 16,
  },
  cardContent: {
    borderRadius: 24,
    backgroundColor: 'rgba(28, 39, 31, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 10,
    gap: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stepBadge: {
    backgroundColor: colors.primary,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  stepBadgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  cardDescription: {
    color: '#9db9a6',
    fontSize: 14,
    lineHeight: 21,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardDivider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Club Selector
  clubSelector: {
    flexDirection: 'row',
  },
  clubSelectorContent: {
    gap: 8,
    paddingVertical: 4,
  },
  clubChip: {
    height: 40,
  },
  clubChipMore: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Primary Action
  actionWrapper: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
