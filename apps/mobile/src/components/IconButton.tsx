import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

interface IconButtonProps {
  icon: string;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * IconButton - Reusable icon-only button
 * Used for back buttons, menu buttons, help buttons, etc.
 */
export function IconButton({
  icon,
  onPress,
  size = 'medium',
  variant = 'default',
  disabled = false,
  style,
}: IconButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`button_${size}`],
        variant === 'ghost' && styles.buttonGhost,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.icon, styles[`icon_${size}`]]}>{icon}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Sizes
  button_small: {
    width: 32,
    height: 32,
  },
  button_medium: {
    width: 40,
    height: 40,
  },
  button_large: {
    width: 48,
    height: 48,
  },

  // Icon sizes
  icon: {
    color: '#ffffff',
  },
  icon_small: {
    fontSize: 20,
  },
  icon_medium: {
    fontSize: 24,
  },
  icon_large: {
    fontSize: 28,
  },
});
