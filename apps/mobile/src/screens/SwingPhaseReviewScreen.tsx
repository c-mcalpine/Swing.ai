import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  LayoutChangeEvent,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@/navigation/AppStack';
import { colors } from '@/styles/tokens';
import { useSwingCapture } from '@/hooks/useSwingCapture';
import type { ManualPhaseMark, ManualSwingPhase } from '@/features/swingCapture';

type NavProp = NativeStackNavigationProp<AppStackParamList, 'SwingPhaseReview'>;
type RouteProps = RouteProp<AppStackParamList, 'SwingPhaseReview'>;

const PHASE_ORDER: ManualSwingPhase[] = [
  'setup',
  'takeaway',
  'backswing',
  'top',
  'downswing',
  'impact',
  'release',
  'follow_through',
];

const phaseLabel: Record<ManualSwingPhase, string> = {
  setup: 'Setup',
  takeaway: 'Takeaway',
  backswing: 'Backswing',
  top: 'Top',
  downswing: 'Downswing',
  impact: 'Impact',
  release: 'Release',
  follow_through: 'Follow Through',
};

export function SwingPhaseReviewScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { videoUri, club } = route.params;
  const videoRef = useRef<Video>(null);
  const [durationMs, setDurationMs] = useState(1);
  const [positionMs, setPositionMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [barWidth, setBarWidth] = useState(1);
  const [marks, setMarks] = useState<Partial<Record<ManualSwingPhase, number>>>({});
  const { state, progress, error, captureId, processCapture, reset } = useSwingCapture();

  useEffect(() => {
    if (state === 'success' && captureId) {
      navigation.replace('Analysis', { captureId });
    }
  }, [state, captureId, navigation]);

  useEffect(() => {
    if (state === 'error' && error) {
      Alert.alert('Capture Failed', error, [{ text: 'OK', onPress: reset }]);
    }
  }, [state, error, reset]);

  const completion = useMemo(() => {
    return PHASE_ORDER.filter((p) => marks[p] != null).length;
  }, [marks]);

  const onStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setDurationMs(Math.max(1, status.durationMillis ?? 1));
    setPositionMs(status.positionMillis ?? 0);
    setIsPlaying(status.isPlaying ?? false);
  };

  const seekByProgress = async (progressFraction: number) => {
    const clamped = Math.max(0, Math.min(1, progressFraction));
    const target = Math.floor(durationMs * clamped);
    await videoRef.current?.setPositionAsync(target);
  };

  const onBarLayout = (e: LayoutChangeEvent) => {
    setBarWidth(Math.max(1, e.nativeEvent.layout.width));
  };

  const markPhase = (phase: ManualSwingPhase) => {
    setMarks((prev) => ({ ...prev, [phase]: positionMs }));
  };

  const handleAnalyze = async () => {
    if (completion < PHASE_ORDER.length) {
      Alert.alert('Mark all phases', 'Please set all 8 swing phase timestamps.');
      return;
    }
    const manualPhaseMarks: ManualPhaseMark[] = PHASE_ORDER.map((phase) => ({
      phase,
      timestamp_ms: marks[phase] ?? 0,
    }));

    await processCapture(videoUri, durationMs, {
      club,
      generateOverlays: true,
      manualPhaseMarks,
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.headerBtn}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Tag Swing Phases</Text>
          <Text style={styles.progressText}>{completion}/8</Text>
        </View>

        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: videoUri }}
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={onStatus}
          shouldPlay={false}
          isLooping
          useNativeControls
        />

        <View style={styles.timelineWrap}>
          <View
            style={styles.timeline}
            onLayout={onBarLayout}
            onStartShouldSetResponder={() => true}
            onResponderRelease={(evt) => {
              const x = evt.nativeEvent.locationX ?? 0;
              seekByProgress(x / barWidth);
            }}
          >
            <View style={[styles.timelineFill, { width: `${(positionMs / durationMs) * 100}%` }]} />
          </View>
          <Text style={styles.timeText}>
            {(positionMs / 1000).toFixed(2)}s / {(durationMs / 1000).toFixed(2)}s
          </Text>
        </View>

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => seekByProgress((positionMs - 250) / durationMs)}>
            <Text style={styles.quickBtnText}>-0.25s</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={async () => (isPlaying ? videoRef.current?.pauseAsync() : videoRef.current?.playAsync())}
          >
            <Text style={styles.quickBtnText}>{isPlaying ? 'Pause' : 'Play'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => seekByProgress((positionMs + 250) / durationMs)}>
            <Text style={styles.quickBtnText}>+0.25s</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.phaseGrid}>
          {PHASE_ORDER.map((phase) => {
            const ts = marks[phase];
            return (
              <TouchableOpacity key={phase} style={styles.phaseBtn} onPress={() => markPhase(phase)}>
                <Text style={styles.phaseBtnTitle}>{phaseLabel[phase]}</Text>
                <Text style={styles.phaseBtnTs}>{ts != null ? `${(ts / 1000).toFixed(2)}s` : 'Set current'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.analyzeBtn, completion < PHASE_ORDER.length && styles.analyzeBtnDisabled]}
          onPress={handleAnalyze}
          disabled={completion < PHASE_ORDER.length}
        >
          <Text style={styles.analyzeBtnText}>Analyze Tagged Swing</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <Modal visible={state === 'processing'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.modalTitle}>Processing Swing</Text>
            <Text style={styles.modalStage}>{progress.stage}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressBarFill, { width: `${progress.percent * 100}%` }]} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1410' },
  safeArea: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  headerBtn: { color: colors.primary, fontWeight: '700' },
  title: { color: colors.white, fontSize: 18, fontWeight: '700' },
  progressText: { color: '#9db9a6', fontWeight: '600' },
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 12 },
  timelineWrap: { marginTop: 12 },
  timeline: { height: 10, backgroundColor: '#213127', borderRadius: 999, overflow: 'hidden' },
  timelineFill: { height: '100%', backgroundColor: colors.primary },
  timeText: { marginTop: 8, color: '#9db9a6', fontSize: 12, textAlign: 'center' },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  quickBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#1b2b22', alignItems: 'center' },
  quickBtnText: { color: colors.white, fontWeight: '600' },
  phaseGrid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  phaseBtn: { width: '48%', backgroundColor: '#15221a', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  phaseBtnTitle: { color: colors.white, fontWeight: '700' },
  phaseBtnTs: { color: '#9db9a6', marginTop: 4, fontSize: 12 },
  analyzeBtn: { marginTop: 'auto', marginBottom: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  analyzeBtnDisabled: { opacity: 0.45 },
  analyzeBtnText: { color: '#0b1410', fontWeight: '800', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  modalContent: { width: '100%', backgroundColor: '#132018', borderRadius: 14, padding: 24, alignItems: 'center' },
  modalTitle: { color: colors.white, fontWeight: '700', fontSize: 18, marginTop: 8 },
  modalStage: { color: '#9db9a6', marginTop: 6 },
  progressBar: { width: '100%', height: 8, marginTop: 14, borderRadius: 999, overflow: 'hidden', backgroundColor: '#233227' },
  progressBarFill: { height: '100%', backgroundColor: colors.primary },
});

