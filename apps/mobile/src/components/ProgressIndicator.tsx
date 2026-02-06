import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressIndicatorProps {
  steps?: number;
  currentStep?: number;
  variant?: 'dots' | 'bars';
}

export function ProgressIndicator({
  steps = 4,
  currentStep = 0,
  variant = 'dots',
}: ProgressIndicatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: steps }).map((_, index) => {
        const isActive = index === currentStep;
        const isPast = index < currentStep;

        return (
          <View
            key={index}
            style={[
              styles.item,
              variant === 'dots' ? styles.itemDots : styles.itemBars,
              isActive && (variant === 'dots' ? styles.itemDotsActive : styles.itemBarsActive),
              isPast && (variant === 'dots' ? styles.itemDotsPast : styles.itemBarsPast),
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  item: {
    height: 6,
    borderRadius: 9999,
  },
  
  // Dots variant
  itemDots: {
    width: 8,
    backgroundColor: '#4b5563',
  },
  itemDotsActive: {
    width: 32,
    backgroundColor: '#13ec5b',
    shadowColor: '#13ec5b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  itemDotsPast: {
    backgroundColor: 'rgba(19, 236, 91, 0.3)',
  },
  
  // Bars variant
  itemBars: {
    flex: 1,
    backgroundColor: '#4b5563',
    height: 4,
  },
  itemBarsActive: {
    backgroundColor: '#13ec5b',
    shadowColor: '#13ec5b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  itemBarsPast: {
    backgroundColor: '#13ec5b',
  },
});
