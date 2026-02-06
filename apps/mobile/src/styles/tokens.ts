/**
 * Design tokens for the Swing.ai mobile app
 * Use these consistent values throughout the app
 */

export const colors = {
  primary: '#13ec5b',      // Bright green (signature color)
  secondary: '#1976D2',    // Sky blue
  accent: '#f97316',       // Orange for warnings/focus areas
  success: '#13ec5b',
  warning: '#eab308',      // Yellow
  error: '#ef4444',
  
  // Neutrals
  black: '#000000',
  white: '#FFFFFF',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Dark theme backgrounds
  background: '#102216',        // Dark green background
  backgroundSecondary: '#1a2c20', // Lighter dark green
  backgroundElevated: '#1c3024',  // Card background
  backgroundDark: '#0d1912',      // Deeper dark
  
  // Text (for dark theme)
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textTertiary: '#6b7280',
  textDisabled: '#4b5563',
  
  // Nested text object for compatibility
  text: {
    primary: '#ffffff',
    secondary: '#9ca3af',
    tertiary: '#6b7280',
    disabled: '#4b5563',
  },
  
  // Card background
  card: '#1c3024',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
