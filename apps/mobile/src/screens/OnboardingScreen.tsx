import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Image,
} from 'react-native';
import { completeOnboarding } from '@/api/profile';
import { Button } from '@/components/Button';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { colors, spacing, typography, borderRadius } from '@/styles/tokens';

/**
 * Onboarding Screen - 4-step flow matching web design exactly
 * Screen 0: Welcome with background image
 * Screen 1: How It Works with visual card
 * Screen 2: Permissions (camera + notifications)
 * Screen 3: Profile Setup (handedness + handicap)
 */
export function OnboardingScreen() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [selectedHand, setSelectedHand] = useState<'left' | 'right'>('right');
  const [selectedHandicap, setSelectedHandicap] = useState('11-20');
  const [loading, setLoading] = useState(false);

  const totalScreens = 4;

  const handleNext = () => {
    if (currentScreen < totalScreens - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleStart = () => {
    setCurrentScreen(1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Map handicap string to number
      const handicapMap: Record<string, number> = {
        'Pro': 0,
        '0-10': 5,
        '11-20': 15,
        '20+': 25,
      };

      console.log('[Onboarding] Completing onboarding...');
      const result = await completeOnboarding({
        handedness: selectedHand,
        handicap: handicapMap[selectedHandicap] || 15,
        goals: ['improve_swing'],
      });
      
      console.log('[Onboarding] Onboarding complete, profile created:', result);
      
      // Trigger App.tsx to re-check onboarding status
      if ((global as any).refetchOnboardingStatus) {
        (global as any).refetchOnboardingStatus();
      }
      
      // Keep loading state true - App.tsx will switch to AppStack automatically
    } catch (error: any) {
      console.error('[Onboarding] Error completing onboarding:', error);
      Alert.alert('Error', error.message || 'Failed to complete onboarding');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Setting up your profile...</Text>
      </View>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 0:
        return <WelcomeScreen onStart={handleStart} />;
      case 1:
        return (
          <HowItWorksScreen
            onContinue={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
            currentStep={currentScreen}
          />
        );
      case 2:
        return (
          <PermissionsScreen
            onContinue={handleNext}
            onSkip={handleSkip}
            currentStep={currentScreen}
          />
        );
      case 3:
        return (
          <ProfileSetupScreen
            onComplete={handleNext}
            currentStep={currentScreen}
            selectedHand={selectedHand}
            setSelectedHand={setSelectedHand}
            selectedHandicap={selectedHandicap}
            setSelectedHandicap={setSelectedHandicap}
          />
        );
      default:
        return <WelcomeScreen onStart={handleStart} />;
    }
  };

  return <View style={styles.container}>{renderScreen()}</View>;
}

// Screen 1: Welcome
function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.welcomeContainer}>
      <ImageBackground
        source={{
          uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQvCr82F7Vw5AKgdVftN3fu8DDp_gOCim0eG9d4lcDzVc97iNh4uYzNv-dU90EJecxy4QH5bCcs5W9oYoySKYdkem5-yD7fMCaMxgNE53vondvnOIPzT7r04l1WnRWTpm_7pwZE_JwV6cACb0KofkAWkTE8aVWnlyZr4isAwjPVtKTHXfWQOg_jO7mS9Ptkb5IWbNvHsHsl51oVQN1YcjLNLMYY1s-4FGwYgboQC7kI-SZx5x0OcFd2uJGWep9x0veXRAyWFF76n4',
        }}
        style={styles.welcomeBg}
        imageStyle={{ opacity: 0.8 }}
      >
        <View style={styles.welcomeOverlay} />

        <View style={styles.welcomeContent}>
          {/* Logo at top */}
          <View style={styles.welcomeLogo}>
            <View style={styles.welcomeLogoContainer}>
              <Text style={styles.welcomeLogoIcon}>⛳</Text>
              <Text style={styles.welcomeLogoText}>SWINGAI</Text>
            </View>
          </View>

          {/* Bottom content */}
          <View style={styles.welcomeText}>
            <View style={styles.welcomeBody}>
              <Text style={styles.welcomeBadge}>NEW UPDATE</Text>
              <Text style={styles.welcomeTitle}>
                Master Your{'\n'}
                <Text style={styles.welcomeTitleGradient}>Perfect Swing</Text>
              </Text>
              <Text style={styles.welcomeDescription}>
                AI-powered analysis in your pocket. Track progress, fix faults, and drop your handicap starting today.
              </Text>
            </View>

            <ProgressIndicator steps={4} currentStep={0} />

            <Button variant="primary" size="large" fullWidth onPress={onStart} icon="→" iconPosition="right">
              Start Training
            </Button>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

// Screen 2: How It Works
function HowItWorksScreen({
  onContinue,
  onBack,
  onSkip,
  currentStep,
}: {
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
}) {
  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ProgressIndicator steps={4} currentStep={currentStep} />

      <View style={styles.main}>
        <View style={styles.visual}>
          {/* Glow effect */}
          <View style={styles.visualGlow} />

          {/* Visual card */}
          <View style={styles.visualCard}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1IHbGJMiIEHnSipsCT9RyCmzpSJzGk7MhNs3wwRFplJbmJkcbD0MTDG_FyeAD3VqnfDIfnr1jFpUM8wBYmEbnX6PercxyLjOpzgwfMGXpUTqwKRsWbZV6qUu3WJCg43gT-ISQsrRTuczgIGWTK9cCk7O72NZ56OQ3sk4iFrq61XGs5i-6xMqsspAj6UraOgH1UeKqSzXha0qMELiHPjxM4dL-rVIFqk0Zhl9I_GxqF_gRYkui0ZhHyLACzJSUGkz5ap9kZpN_o5s',
              }}
              style={styles.visualImage}
              resizeMode="cover"
            />
            <View style={styles.visualOverlay} />
            <View style={styles.visualIconContainer}>
              <View style={styles.visualIcon}>
                <Text style={styles.visualIconText}>📹</Text>
              </View>
              <View style={styles.visualRecording}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>RECORDING</Text>
              </View>
            </View>
          </View>

          <View style={styles.visualTextContainer}>
            <Text style={styles.visualTitle}>Analyze Instantly</Text>
            <Text style={styles.visualDescription}>
              Set up your phone 6-8 feet away. Our AI tracks 24 key body points to provide instant
              feedback on your posture and swing path.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button variant="secondary" size="large" fullWidth onPress={onContinue}>
          Continue
        </Button>
      </View>
    </View>
  );
}

// Screen 3: Permissions
function PermissionsScreen({
  onContinue,
  onSkip,
  currentStep,
}: {
  onContinue: () => void;
  onSkip: () => void;
  currentStep: number;
}) {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.progressWrapper}>
        <ProgressIndicator steps={4} currentStep={currentStep} />
      </View>

      <View style={styles.mainTopAligned}>
        <Text style={styles.pageTitle}>
          Let's see that{'\n'}
          <Text style={styles.pageTitleAccent}>Swing</Text>
        </Text>
        <Text style={styles.pageDescription}>
          To analyze your biomechanics, we need access to your camera. Your data is private and
          processed locally.
        </Text>

        <View style={styles.permissionsContainer}>
          {/* Camera Permission */}
          <View style={[styles.permissionCard, styles.permissionCardActive]}>
            <View style={[styles.permissionIcon, styles.permissionIconActive]}>
              <Text style={styles.permissionIconTextActive}>📷</Text>
            </View>
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>Camera Access</Text>
              <Text style={styles.permissionDescription}>
                Required to record swings and visualize shot tracer technology.
              </Text>
            </View>
            <View style={styles.permissionCheck}>
              <Text style={styles.permissionCheckIcon}>✓</Text>
            </View>
          </View>

          {/* Notification Permission */}
          <View style={[styles.permissionCard, styles.permissionCardInactive]}>
            <View style={styles.permissionIcon}>
              <Text style={styles.permissionIconText}>🔔</Text>
            </View>
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>Notifications</Text>
              <Text style={styles.permissionDescription}>
                Get daily practice reminders and weekly progress reports.
              </Text>
            </View>
            <View style={styles.permissionCheckbox} />
          </View>
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>We never share your videos without permission.</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button variant="primary" size="large" fullWidth onPress={onContinue}>
          Enable Camera Access
        </Button>
        <TouchableOpacity style={styles.textButton} onPress={onSkip}>
          <Text style={styles.textButtonText}>Not now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Screen 4: Profile Setup
function ProfileSetupScreen({
  onComplete,
  currentStep,
  selectedHand,
  setSelectedHand,
  selectedHandicap,
  setSelectedHandicap,
}: {
  onComplete: () => void;
  currentStep: number;
  selectedHand: 'left' | 'right';
  setSelectedHand: (hand: 'left' | 'right') => void;
  selectedHandicap: string;
  setSelectedHandicap: (handicap: string) => void;
}) {
  const handicapRanges: Record<string, string> = {
    'Pro': '0-5',
    '0-10': '6-10',
    '11-20': '18-24',
    '20+': '25+',
  };

  // Calculate slider position based on selected handicap
  const sliderPositions: Record<string, number> = {
    'Pro': 10,
    '0-10': 35,
    '11-20': 60,
    '20+': 85,
  };

  const sliderPos = sliderPositions[selectedHandicap] || 60;

  return (
    <View style={styles.screenContainer}>
      <View style={styles.profileHeader}>
        <ProgressIndicator steps={4} currentStep={currentStep} />
        <Text style={styles.pageTitle}>
          Build Your{'\n'}Profile
        </Text>
      </View>

      <ScrollView style={styles.mainScrollable} showsVerticalScrollIndicator={false}>
        {/* Dexterity */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>DEXTERITY</Text>
          <View style={styles.handSelector}>
            <TouchableOpacity
              style={[
                styles.handOption,
                selectedHand === 'right' && styles.handOptionActive,
              ]}
              onPress={() => setSelectedHand('right')}
            >
              {selectedHand === 'right' && (
                <View style={styles.handCheck}>
                  <Text style={styles.handCheckIcon}>✓</Text>
                </View>
              )}
              <Text style={[styles.handIcon, selectedHand === 'right' && styles.handIconActive]}>
                ✋
              </Text>
              <Text style={[styles.handLabel, selectedHand === 'right' && styles.handLabelActive]}>
                Right Handed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.handOption,
                selectedHand === 'left' && styles.handOptionActive,
              ]}
              onPress={() => setSelectedHand('left')}
            >
              {selectedHand === 'left' && (
                <View style={styles.handCheck}>
                  <Text style={styles.handCheckIcon}>✓</Text>
                </View>
              )}
              <Text
                style={[
                  styles.handIcon,
                  styles.handIconFlipped,
                  selectedHand === 'left' && styles.handIconActive,
                ]}
              >
                ✋
              </Text>
              <Text style={[styles.handLabel, selectedHand === 'left' && styles.handLabelActive]}>
                Left Handed
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Handicap */}
        <View style={styles.formGroup}>
          <View style={styles.formHeader}>
            <Text style={styles.formLabel}>ESTIMATED HANDICAP</Text>
            <Text style={styles.formValue}>{handicapRanges[selectedHandicap]}</Text>
          </View>

          <View style={styles.handicapSelector}>
            {Object.keys(handicapRanges).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.handicapOption,
                  selectedHandicap === range && styles.handicapOptionActive,
                ]}
                onPress={() => setSelectedHandicap(range)}
              >
                <Text
                  style={[
                    styles.handicapOptionText,
                    selectedHandicap === range && styles.handicapOptionTextActive,
                  ]}
                >
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Slider visualization */}
          <View style={styles.slider}>
            <View style={styles.sliderTrack} />
            <View style={[styles.sliderFill, { width: `${sliderPos}%` }]} />
            <View style={[styles.sliderThumb, { left: `${sliderPos}%` }]}>
              <View style={styles.sliderThumbDot} />
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>BEGINNER</Text>
              <Text style={styles.sliderLabel}>SCRATCH</Text>
            </View>
          </View>
        </View>

        {/* Reward Badge */}
        <View style={styles.reward}>
          <View style={styles.rewardIcon}>
            <Text style={styles.rewardIconText}>🏆</Text>
          </View>
          <View style={styles.rewardContent}>
            <Text style={styles.rewardTitle}>Profile Setup Reward</Text>
            <Text style={styles.rewardXP}>+50 XP PENDING</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, styles.footerGradient]}>
        <Button variant="primary" size="large" fullWidth onPress={onComplete}>
          Finalize Profile
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },

  // Screen containers
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Welcome screen
  welcomeContainer: {
    flex: 1,
  },
  welcomeBg: {
    flex: 1,
  },
  welcomeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 34, 22, 0.6)',
    backgroundImage: 'linear-gradient(to top, #102216, rgba(16, 34, 22, 0.6), transparent)',
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  welcomeLogo: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  welcomeLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 34, 22, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  welcomeLogoIcon: {
    fontSize: 20,
  },
  welcomeLogoText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2.4,
    color: colors.white,
  },
  welcomeText: {
    paddingHorizontal: 24,
  },
  welcomeBody: {
    marginBottom: 24,
  },
  welcomeBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 12,
    fontWeight: '700',
    color: colors.background,
    backgroundColor: colors.primary,
    borderRadius: 9999,
    letterSpacing: 0.8,
    overflow: 'hidden',
  },
  welcomeTitle: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 43,
    letterSpacing: -0.7,
    marginBottom: 16,
  },
  welcomeTitleGradient: {
    color: colors.gray[400],
  },
  welcomeDescription: {
    color: colors.gray[300],
    fontSize: 16,
    lineHeight: 25,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 9999,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButtonIcon: {
    fontSize: 20,
    color: colors.white,
  },
  skipText: {
    color: colors.gray[400],
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.7,
  },

  // Main content
  main: {
    flex: 1,
    paddingHorizontal: 24,
  },
  mainTopAligned: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  mainScrollable: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Visual (How It Works screen)
  visual: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualGlow: {
    position: 'absolute',
    width: 256,
    height: 256,
    backgroundColor: 'rgba(19, 236, 91, 0.1)',
    borderRadius: 128,
    top: '30%',
  },
  visualCard: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: colors.backgroundElevated,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 10,
  },
  visualImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  visualOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(to bottom, transparent, #1c3024)',
  },
  visualIconContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  visualIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(19, 236, 91, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(19, 236, 91, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualIconText: {
    fontSize: 48,
  },
  visualRecording: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  recordingText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.white,
    fontWeight: '600',
  },
  visualTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  visualTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  visualDescription: {
    color: colors.gray[400],
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },

  // Permissions
  progressWrapper: {
    paddingHorizontal: 24,
    paddingTop: 56,
  },
  pageTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 16,
  },
  pageTitleAccent: {
    color: colors.primary,
  },
  pageDescription: {
    color: colors.gray[400],
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 40,
  },
  permissionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  permissionCard: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  permissionCardInactive: {
    backgroundColor: 'rgba(28, 48, 36, 0.5)',
    opacity: 0.6,
  },
  permissionCardActive: {},
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(107, 114, 128, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionIconActive: {
    backgroundColor: 'rgba(19, 236, 91, 0.2)',
  },
  permissionIconText: {
    fontSize: 24,
  },
  permissionIconTextActive: {
    fontSize: 24,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
  },
  permissionDescription: {
    color: colors.gray[400],
    fontSize: 14,
    lineHeight: 21,
  },
  permissionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCheckIcon: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  permissionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[600],
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  privacyIcon: {
    fontSize: 12,
  },
  privacyText: {
    color: colors.gray[500],
    fontSize: 12,
  },

  // Profile Setup
  profileHeader: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 8,
  },
  formGroup: {
    gap: 12,
    marginBottom: 32,
  },
  formLabel: {
    color: colors.gray[300],
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  formValue: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 18,
  },

  // Hand selector
  handSelector: {
    flexDirection: 'row',
    gap: 16,
  },
  handOption: {
    flex: 1,
    height: 128,
    borderRadius: 16,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.6,
    position: 'relative',
  },
  handOptionActive: {
    borderColor: colors.primary,
    opacity: 1,
  },
  handCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handCheckIcon: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '700',
  },
  handIcon: {
    fontSize: 40,
    color: colors.gray[400],
  },
  handIconActive: {
    color: colors.primary,
  },
  handIconFlipped: {
    transform: [{ scaleX: -1 }],
  },
  handLabel: {
    color: colors.gray[400],
    fontWeight: '700',
    fontSize: 14,
  },
  handLabelActive: {
    color: colors.white,
  },

  // Handicap selector
  handicapSelector: {
    backgroundColor: colors.backgroundElevated,
    padding: 4,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  handicapOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  handicapOptionActive: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  handicapOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[400],
  },
  handicapOptionTextActive: {
    fontWeight: '700',
    color: colors.background,
  },

  // Slider
  slider: {
    position: 'relative',
    height: 48,
    marginTop: 8,
  },
  sliderTrack: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.gray[700],
    borderRadius: 9999,
    transform: [{ translateY: -2 }],
  },
  sliderFill: {
    position: 'absolute',
    top: '50%',
    left: 0,
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 9999,
    transform: [{ translateY: -2 }],
  },
  sliderThumb: {
    position: 'absolute',
    top: '50%',
    width: 24,
    height: 24,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: colors.primary,
    transform: [{ translateX: -12 }, { translateY: -12 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderThumbDot: {
    width: 6,
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
  },
  sliderLabel: {
    fontSize: 10,
    color: colors.gray[500],
    fontFamily: 'monospace',
    letterSpacing: 1,
  },

  // Reward
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(28, 48, 36, 0.8)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 8,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardIconText: {
    fontSize: 24,
  },
  rewardContent: {
    flex: 1,
  },
  rewardTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  rewardXP: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: 'monospace',
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  footerGradient: {
    // In RN, we can't easily do gradients in styles, but we can approximate with backgroundColor
    backgroundColor: 'rgba(16, 34, 22, 0.95)',
  },
  textButton: {
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  textButtonText: {
    color: colors.gray[500],
    fontSize: 14,
    fontWeight: '500',
  },
});
