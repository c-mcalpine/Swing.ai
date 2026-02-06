import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ViewStyle,
} from 'react-native';
import { colors } from '@/styles/tokens';

interface VideoPlayerProps {
  thumbnailUrl: string;
  duration?: string;
  onPlayPress?: () => void;
  style?: ViewStyle;
}

/**
 * VideoPlayer - Reusable video player thumbnail with play button
 * Used in DailyLesson, DrillDetails, and other video screens
 */
export function VideoPlayer({
  thumbnailUrl,
  duration,
  onPlayPress,
  style,
}: VideoPlayerProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPlayPress}>
      <ImageBackground
        source={{ uri: thumbnailUrl }}
        style={[styles.player, style]}
        imageStyle={styles.playerImage}
      >
        <View style={styles.overlay} />
        
        {/* Play Button */}
        <View style={styles.playBtn}>
          <Text style={styles.playIcon}>▶</Text>
        </View>

        {/* Duration Badge */}
        {duration && (
          <View style={styles.duration}>
            <Text style={styles.durationText}>{duration}</Text>
          </View>
        )}
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  player: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c2e22',
  },
  playerImage: {
    borderRadius: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
    paddingLeft: 4,
    zIndex: 10,
  },
  playIcon: {
    fontSize: 32,
    color: colors.background,
  },
  duration: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    zIndex: 10,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.white,
  },
});
