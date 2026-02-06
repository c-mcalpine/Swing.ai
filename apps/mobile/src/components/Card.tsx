import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, ViewStyle } from 'react-native';
import { colors } from '@/styles/tokens';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Base Card Component
 */
export function Card({ children, onPress, style }: CardProps) {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {children}
    </Component>
  );
}

interface HeroCardProps {
  image: string;
  title?: string;
  description?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  onPress?: () => void;
}

/**
 * Hero Card with Image
 */
export function HeroCard({ image, title, description, badge, children, onPress }: HeroCardProps) {
  return (
    <Card onPress={onPress} style={styles.heroCard}>
      <ImageBackground source={{ uri: image }} style={styles.heroImageWrapper} imageStyle={styles.heroImage}>
        <View style={styles.heroImageOverlay} />
        {badge && <View style={styles.heroBadge}>{badge}</View>}
      </ImageBackground>
      <View style={styles.heroContent}>
        {title && <Text style={styles.heroTitle}>{title}</Text>}
        {description && <Text style={styles.heroDescription}>{description}</Text>}
        {children}
      </View>
    </Card>
  );
}

interface HorizontalCardProps {
  image: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  inactive?: boolean;
}

/**
 * Horizontal Card with Image
 */
export function HorizontalCard({
  image,
  title,
  subtitle,
  children,
  onPress,
  inactive,
}: HorizontalCardProps) {
  return (
    <Card onPress={onPress} style={[styles.horizontalCard, inactive && styles.horizontalCardInactive]}>
      <ImageBackground source={{ uri: image }} style={styles.horizontalImage} imageStyle={styles.horizontalImageStyle} />
      <View style={styles.horizontalContent}>
        <Text style={styles.horizontalTitle}>{title}</Text>
        {subtitle && <Text style={styles.horizontalSubtitle}>{subtitle}</Text>}
        {children}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c271f',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  // Hero Card
  heroCard: {
    flexDirection: 'column',
  },
  heroImageWrapper: {
    height: 224,
    width: '100%',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 39, 31, 0.4)',
  },
  heroBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroContent: {
    padding: 20,
    marginTop: -48,
    position: 'relative',
    zIndex: 10,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  heroDescription: {
    color: '#9db9a6',
    fontSize: 14,
  },

  // Horizontal Card
  horizontalCard: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  horizontalCardInactive: {
    opacity: 0.6,
  },
  horizontalImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  horizontalImageStyle: {
    resizeMode: 'cover',
  },
  horizontalContent: {
    flex: 1,
    gap: 4,
  },
  horizontalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  horizontalSubtitle: {
    fontSize: 12,
    color: '#9db9a6',
  },
});
