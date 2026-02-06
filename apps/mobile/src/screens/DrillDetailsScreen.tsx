import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconButton, MetaTag, VideoPlayer, Button } from '@/components';
import { colors, spacing } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';

type DrillDetailsScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'DrillDetails'
>;
type DrillDetailsScreenRouteProp = RouteProp<AppStackParamList, 'DrillDetails'>;

interface Step {
  id: number;
  title: string;
  description: string;
  isOpen: boolean;
}

/**
 * Drill Details Screen - Detailed view of a specific drill with instructions
 * Matches web design exactly
 */
export function DrillDetailsScreen() {
  const navigation = useNavigation<DrillDetailsScreenNavigationProp>();
  const route = useRoute<DrillDetailsScreenRouteProp>();
  const drillId = (route.params as any)?.drillId;

  const [reps, setReps] = useState(0);
  const goalReps = 10;

  const drillData = {
    title: 'The Gate Drill',
    description:
      'Improve your face control at impact by forcing the putter through a tight gate. This drill provides instant feedback on off-center strikes.',
    videoThumb:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDIWsAWxVFVqgVuR-wCh0IYR4-2qHEnlFSkrr5ereCvRCaY3qQ93UwweuePmYV937CSYoX5NeZg-vEd0xfnfpu473DjPfqthGsTfAPOecATVgC3fMSa3a60kS54GVr2InYy058M13gY7A5yC8C09Fv5bmuGVEnxTjBdtICY3-_0R3oQMC6jWqMp2L0Vbrlnr6hijBPYabB2vWli9UcB-CUCcnz_ColoGxEwksKHQiOi9vXKiyOBHoUVIV4761yBsFYMTRXuZ4y7bvM',
    duration: '05:00',
    meta: [
      { icon: '📊', label: 'Intermediate' },
      { icon: '⏱', label: '5 mins' },
      { icon: '⛳', label: 'Putter' },
    ],
  };

  const steps: Step[] = [
    {
      id: 1,
      title: 'Setup the Gate',
      description:
        'Place two tees into the ground, just wider than your putter head, to create a narrow gate for your stroke. Leave about 1/4 inch of clearance on each side.',
      isOpen: true,
    },
    {
      id: 2,
      title: 'Ball Position',
      description:
        'Place the ball directly in the center of the gate. Ensure your eyes are directly over the ball for optimal alignment.',
      isOpen: false,
    },
    {
      id: 3,
      title: 'Stroke Execution',
      description:
        'Make your stroke. If you hit a tee, your face angle was either open or closed. Reset and try to pass through cleanly.',
      isOpen: false,
    },
  ];

  const [expandedSteps, setExpandedSteps] = useState<number[]>(
    steps.filter((step) => step.isOpen).map((step) => step.id)
  );

  const toggleStep = (stepId: number) => {
    setExpandedSteps((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]
    );
  };

  const incrementReps = () => {
    if (reps < goalReps) {
      setReps((prev) => prev + 1);
    }
  };

  const decrementReps = () => {
    if (reps > 0) {
      setReps((prev) => prev - 1);
    }
  };

  const handleRecordSwing = () => {
    // @ts-ignore
    navigation.navigate('Capture');
  };

  const progressPercentage = (reps / goalReps) * 100;

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <SafeAreaView style={styles.safeAreaTop}>
        <View style={styles.header}>
          <IconButton icon="←" onPress={() => navigation.goBack()} />

          <Text style={styles.headerTitle}>Putting Essentials</Text>

          <IconButton icon="❓" />
        </View>
      </SafeAreaView>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Player */}
        <View style={styles.videoContainer}>
          <VideoPlayer
            thumbnailUrl={drillData.videoThumb}
            duration={drillData.duration}
          />
        </View>

        {/* Header & Meta Data */}
        <View style={styles.info}>
          <Text style={styles.title}>{drillData.title}</Text>

          <View style={styles.meta}>
            {drillData.meta.map((item, index) => (
              <MetaTag key={index} icon={item.icon} label={item.label} />
            ))}
          </View>

          <Text style={styles.description}>{drillData.description}</Text>
        </View>

        {/* Instructions Accordion */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>STEP-BY-STEP</Text>

          <View style={styles.steps}>
            {steps.map((step) => (
              <View key={step.id} style={styles.step}>
                <TouchableOpacity
                  style={styles.stepHeader}
                  onPress={() => toggleStep(step.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.stepHeaderContent}>
                    <View
                      style={[
                        styles.stepNumber,
                        step.id === 1 && styles.stepNumberActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepNumberText,
                          step.id === 1 && styles.stepNumberTextActive,
                        ]}
                      >
                        {step.id}
                      </Text>
                    </View>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                  </View>
                  <Text
                    style={[
                      styles.stepChevron,
                      expandedSteps.includes(step.id) && styles.stepChevronOpen,
                    ]}
                  >
                    ⌄
                  </Text>
                </TouchableOpacity>

                {expandedSteps.includes(step.id) && (
                  <View style={styles.stepContent}>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Bottom padding for footer */}
        <View style={{ height: 240 }} />
      </ScrollView>

      {/* Sticky Footer with Controls */}
      <View style={styles.footerWrapper}>
        <View style={styles.footerGradient} />
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            {/* Progress Header */}
            <View style={styles.progressSection}>
              <View style={styles.goal}>
                <Text style={styles.goalLabel}>GOAL</Text>
                <Text style={styles.goalValue}>{goalReps} Reps</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercentage}%` },
                  ]}
                />
              </View>
            </View>

            {/* Controls Grid */}
            <View style={styles.controls}>
              {/* Rep Counter */}
              <View style={styles.counter}>
                <TouchableOpacity
                  style={[styles.counterBtn, styles.counterBtnMinus]}
                  onPress={decrementReps}
                  disabled={reps === 0}
                >
                  <Text style={styles.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{reps}</Text>
                <TouchableOpacity
                  style={[styles.counterBtn, styles.counterBtnPlus]}
                  onPress={incrementReps}
                  disabled={reps === goalReps}
                >
                  <Text style={styles.counterBtnTextPlus}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Record Button */}
              <Button
                variant="primary"
                size="large"
                onPress={handleRecordSwing}
                icon="📹"
                iconPosition="left"
                style={styles.recordBtn}
              >
                Record Swing
              </Button>
            </View>
          </View>
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
  safeAreaTop: {
    backgroundColor: 'rgba(16, 34, 22, 0.95)',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Video Player
  videoContainer: {
    marginTop: 16,
    marginBottom: 24,
  },

  // Info Section
  info: {
    gap: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.6,
    color: colors.white,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#9ca3af',
  },

  // Instructions Accordion
  instructions: {
    gap: 12,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  steps: {
    gap: 12,
  },
  step: {
    borderRadius: 16,
    backgroundColor: '#1c2e22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: 16,
  },
  stepHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberActive: {
    backgroundColor: 'rgba(19, 236, 91, 0.2)',
  },
  stepNumberText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#9ca3af',
  },
  stepNumberTextActive: {
    color: colors.primary,
  },
  stepTitle: {
    fontWeight: '600',
    color: colors.white,
    fontSize: 16,
    flex: 1,
  },
  stepChevron: {
    color: '#9ca3af',
    fontSize: 20,
  },
  stepChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  stepContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 72,
  },
  stepDescription: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 21,
  },

  // Sticky Footer
  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  footerGradient: {
    height: 32,
    backgroundColor: 'transparent',
  },
  footer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 10,
  },
  footerContent: {
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },

  // Progress Section
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  goal: {
    flexDirection: 'column',
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  goalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  progressBarContainer: {
    height: 8,
    width: 96,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },

  // Controls Grid
  controls: {
    flexDirection: 'row',
    gap: 16,
  },

  // Rep Counter
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c2e22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 9999,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  counterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnMinus: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  counterBtnText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  counterBtnPlus: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 4,
  },
  counterBtnTextPlus: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.background,
  },
  counterValue: {
    width: 48,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 20,
    color: colors.white,
    fontFamily: 'Courier New',
  },

  // Record Button
  recordBtn: {
    flex: 1,
  },
});
