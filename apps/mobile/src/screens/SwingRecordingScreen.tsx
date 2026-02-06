import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { IconButton, FilterChip } from '@/components';
import { colors, spacing } from '@/styles/tokens';
import type { AppStackParamList } from '@/navigation/AppStack';
import { useSwingCapture } from '@/hooks/useSwingCapture';

type SwingRecordingScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'SwingRecording'
>;

type SwingRecordingScreenRouteProp = RouteProp<AppStackParamList, 'SwingRecording'>;

/**
 * Swing Recording Screen - Live camera interface for recording swings
 * Integrated with computer vision pipeline
 */
export function SwingRecordingScreen() {
  const navigation = useNavigation<SwingRecordingScreenNavigationProp>();
  const route = useRoute<SwingRecordingScreenRouteProp>();
  const cameraRef = useRef<CameraView>(null);
  
  const [selectedClub, setSelectedClub] = useState(route.params?.club || '7 Iron');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  
  const { state, progress, error, captureId, processCapture, reset } = useSwingCapture();

  const clubs = ['Driver', '7 Iron', 'Wedge', 'Putter'];

  // Request camera permission on mount
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  // Navigate to analysis when processing completes
  useEffect(() => {
    if (state === 'success' && captureId) {
      navigation.navigate('Analysis', { captureId });
    }
  }, [state, captureId]);

  // Show error alert
  useEffect(() => {
    if (state === 'error' && error) {
      Alert.alert('Capture Failed', error, [
        { text: 'OK', onPress: reset },
      ]);
    }
  }, [state, error]);

  const handleClose = () => {
    if (isRecording) {
      Alert.alert('Recording in progress', 'Stop recording before closing?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          onPress: () => {
            setIsRecording(false);
            navigation.goBack();
          },
        },
      ]);
    } else {
      navigation.goBack();
    }
  };

  const handleRecord = async () => {
    if (!cameraRef.current) return;

    if (!isRecording) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync({
          maxDuration: 5, // 5 seconds max
        });

        setIsRecording(false);

        if (video) {
          // Process the captured video (duration will be auto-detected)
          await processCapture(video.uri, null, {
            club: selectedClub,
            generateOverlays: true,
          });
        }
      } catch (err: any) {
        console.error('Recording failed:', err);
        setIsRecording(false);
        Alert.alert('Recording Failed', err.message || 'Failed to record video');
      }
    } else {
      // Stop recording
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // Show permission request if not granted
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera permission is required to record swings
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Feed */}
      <CameraView
        ref={cameraRef}
        style={styles.cameraFeed}
        facing={facing}
        mode="video"
        enableTorch={flashEnabled}
      >
        <View style={styles.cameraOverlay} />

        {/* Golfer Silhouette Overlay */}
        <View style={styles.silhouetteOverlay}>
          <Text style={styles.silhouettePlaceholder}>⛳</Text>
        </View>

        {/* Grid Lines */}
        <View style={styles.gridLines}>
          <View style={[styles.gridLine, styles.gridLineH1]} />
          <View style={[styles.gridLine, styles.gridLineH2]} />
          <View style={[styles.gridLine, styles.gridLineV1]} />
          <View style={[styles.gridLine, styles.gridLineV2]} />
        </View>
      </CameraView>

      {/* UI Overlay */}
      <View style={styles.uiOverlay}>
        {/* Top Bar */}
        <SafeAreaView style={styles.topBar}>
          <View style={styles.topControls}>
            <IconButton
              icon="✕"
              onPress={handleClose}
              size="large"
              variant="ghost"
            />

            <Text style={styles.titleText}>Camera Setup</Text>

            <View style={styles.topRight}>
              <TouchableOpacity
                style={[
                  styles.flashBtn,
                  flashEnabled && styles.flashBtnActive,
                ]}
                onPress={() => setFlashEnabled(!flashEnabled)}
              >
                <Text style={styles.flashIcon}>⚡</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <View style={styles.instructionPill}>
              <Text style={styles.instructionIcon}>📱</Text>
              <Text style={styles.instructionText}>Place phone waist-height, 10ft back</Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Center Area */}
        <View style={styles.center}>
          <Text
            style={[
              styles.alignText,
              isRecording && styles.alignTextRecording,
            ]}
          >
            {isRecording ? 'RECORDING...' : 'ALIGN GOLFER HERE'}
          </Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Club Selection */}
          <View style={styles.clubSection}>
            <View style={styles.clubHeader}>
              <Text style={styles.clubLabel}>SELECT CLUB</Text>
              <TouchableOpacity>
                <Text style={styles.editBagBtn}>Edit Bag</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.clubChipsContent}
              style={styles.clubChips}
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
            </ScrollView>
          </View>

          {/* Camera Controls */}
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.controlBtn}>
              <Text style={styles.controlBtnIcon}>🖼️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.recordBtn,
                isRecording && styles.recordBtnRecording,
              ]}
              onPress={handleRecord}
              disabled={isRecording}
            >
              <View
                style={[
                  styles.recordBtnInner,
                  isRecording && styles.recordBtnInnerRecording,
                ]}
              />
              <Text style={styles.recordBtnIcon}>📹</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn} onPress={toggleCameraFacing}>
              <Text style={styles.controlBtnIcon}>🔄</Text>
            </TouchableOpacity>
          </View>

          {/* Helper Text */}
          <Text style={styles.helperText}>Tap to start or say "Hey Coach, Record"</Text>
        </View>
      </View>

      {/* Processing Modal */}
      <Modal visible={state === 'processing'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.modalTitle}>Processing Swing</Text>
            <Text style={styles.modalStage}>{progress.stage}</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress.percent * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.modalPercent}>
              {Math.round(progress.percent * 100)}%
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Camera Feed Background
  cameraFeed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cameraFeedImage: {
    resizeMode: 'cover',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  // Golfer Silhouette Overlay
  silhouetteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.3,
    pointerEvents: 'none',
  },
  silhouettePlaceholder: {
    fontSize: 200,
    opacity: 0.6,
    color: colors.white,
  },

  // Grid Lines
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    opacity: 0.2,
  },
  gridLine: {
    position: 'absolute',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  gridLineH1: {
    width: '100%',
    height: '33.333%',
    borderBottomWidth: 1,
  },
  gridLineH2: {
    width: '100%',
    top: '33.333%',
    height: '33.333%',
    borderBottomWidth: 1,
  },
  gridLineV1: {
    height: '100%',
    width: '33.333%',
    left: '33.333%',
    borderRightWidth: 1,
  },
  gridLineV2: {
    height: '100%',
    width: '33.333%',
    right: '33.333%',
    borderRightWidth: 1,
  },

  // UI Overlay
  uiOverlay: {
    position: 'relative',
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 32,
  },

  // Top Bar
  topBar: {
    backgroundColor: 'transparent',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  titleText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.27,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  topRight: {
    width: 48,
    alignItems: 'flex-end',
  },
  flashBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  flashBtnActive: {
    backgroundColor: colors.primary,
  },
  flashIcon: {
    fontSize: 24,
  },

  // Instructions
  instructions: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  instructionPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  instructionIcon: {
    fontSize: 16,
  },
  instructionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },

  // Center Area
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignText: {
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1.2,
    fontSize: 24,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  alignTextRecording: {
    opacity: 1,
    color: colors.primary,
  },

  // Bottom Controls
  bottomControls: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 24,
  },

  // Club Section
  clubSection: {
    gap: 8,
    marginBottom: 24,
  },
  clubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  clubLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  editBagBtn: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  clubChips: {
    flexDirection: 'row',
  },
  clubChipsContent: {
    gap: 12,
    paddingBottom: 8,
  },
  clubChip: {
    height: 40,
  },

  // Camera Controls
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(28, 39, 31, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnIcon: {
    fontSize: 24,
    color: colors.white,
  },

  // Record Button
  recordBtn: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtnRecording: {
    opacity: 0.9,
  },
  recordBtnInner: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 36,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  recordBtnInnerRecording: {
    backgroundColor: '#ef4444',
  },
  recordBtnIcon: {
    position: 'relative',
    zIndex: 10,
    fontSize: 40,
  },

  // Helper Text
  helperText: {
    color: '#9db9a6',
    fontSize: 12,
    textAlign: 'center',
  },

  // Permission Screen
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  permissionText: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Processing Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 16,
  },
  modalTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  modalStage: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  modalPercent: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
