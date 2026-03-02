import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HouseProps {
  x: number;
  y: number;
}

/**
 * Maison du joueur — point central de la scène.
 * Non interactive pour l'instant. Prêt pour : menu intérieur, stockage, upgrades.
 */
export const House: React.FC<HouseProps> = ({ x, y }) => {
  return (
    <View style={[styles.container, { left: x, top: y }]}>
      <Text style={styles.emoji}>🏠</Text>
      <Text style={styles.label}>Maison</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 56,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 3 },
    textShadowRadius: 4,
  },
  label: {
    fontSize: 11,
    color: '#3a2010',
    fontWeight: '700',
    marginTop: -2,
    letterSpacing: 0.5,
  },
});
