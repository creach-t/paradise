import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { WaterSourceNode } from '../../types';

// ─── Composant ────────────────────────────────────────────────────────────────

interface WaterSourceProps {
  node: WaterSourceNode;
  isHighlighted: boolean;
}

/**
 * Source d'eau (mare / puits) — View pure, aucun TouchableOpacity.
 * Disponible en permanence avec un court cooldown après collecte.
 */
export const WaterSource: React.FC<WaterSourceProps> = ({ node, isHighlighted }) => {
  const onCooldown = node.isHarvested;

  return (
    <View style={[styles.wrapper, { left: node.x, top: node.y }]} pointerEvents="none">
      <View style={[
        styles.pond,
        onCooldown    && styles.pondCooldown,
        isHighlighted && styles.pondHighlighted,
      ]}>
        <Text style={styles.emoji}>{onCooldown ? '💧' : '🌊'}</Text>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
  },
  pond: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a4a7a',
    borderWidth: 2,
    borderColor: '#2d7ab8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pondCooldown: {
    backgroundColor: '#1a3050',
    borderColor: '#2d5080',
    opacity: 0.6,
  },
  pondHighlighted: {
    borderColor: '#7ec8f0',
    backgroundColor: 'rgba(45, 122, 184, 0.35)',
  },
  emoji: {
    fontSize: 26,
  },
});
