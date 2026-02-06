import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  icon,
  iconPosition = 'right',
  onPress,
  disabled = false,
  style,
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    fullWidth && styles.buttonFullWidth,
    disabled && styles.buttonDisabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon && iconPosition === 'left' && (
        <Text style={[styles.icon, styles.iconLeft]}>{icon}</Text>
      )}
      <Text style={textStyles}>{children}</Text>
      {icon && iconPosition === 'right' && (
        <Text style={[styles.icon, styles.iconRight]}>{icon}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    gap: 8,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  
  // Sizes
  button_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    height: 36,
  },
  button_medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 48,
  },
  button_large: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    height: 56,
  },
  
  // Variants
  button_primary: {
    backgroundColor: '#13ec5b',
    shadowColor: '#13ec5b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 4,
  },
  button_secondary: {
    backgroundColor: '#1c271f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_text: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  
  // Text styles
  text: {
    fontWeight: '700',
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
  text_primary: {
    color: '#102216',
  },
  text_secondary: {
    color: '#ffffff',
  },
  text_outline: {
    color: '#ffffff',
  },
  text_ghost: {
    color: '#9db9a6',
  },
  text_text: {
    color: '#6b7280',
    fontWeight: '500',
  },
  
  // Icon
  icon: {
    fontSize: 20,
  },
  iconLeft: {},
  iconRight: {},
});
