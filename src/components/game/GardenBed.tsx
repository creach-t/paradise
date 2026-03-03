import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { GardenBedNode, SeedType } from '../../types';

// ─── Métadonnées visuelles par graine ─────────────────────────────────────────

const SEED_EMOJI: Record<SeedType, string> = {
  berry_seed:    '🍓',
  grain_seed:    '🌾',
  mushroom_seed: '🍄',
};

// ─── Composant ────────────────────────────────────────────────────────────────

interface GardenBedProps {
  bed: GardenBedNode;
  isHighlighted: boolean;
}

/**
 * Lit de potager — View pure, aucun TouchableOpacity.
 * L'interaction est gérée par ActionButton + useNearestHarvestable.
 *
 * États visuels :
 *  empty   → carré terre brun, tiret centré
 *  growing → carré vert foncé + 🌱
 *  ready   → carré vert vif + emoji de la culture
 */
export const GardenBed: React.FC<GardenBedProps> = ({ bed, isHighlighted }) => {
  const isReady   = bed.state === 'ready';
  const isGrowing = bed.state === 'growing';

  const containerStyle = [
    styles.bed,
    isGrowing && styles.bedGrowing,
    isReady   && styles.bedReady,
    isHighlighted && styles.bedHighlighted,
  ];

  const emoji = isReady && bed.seedType
    ? SEED_EMOJI[bed.seedType]
    : isGrowing
    ? '🌱'
    : '➕';

  return (
    <View style={[styles.wrapper, { left: bed.x, top: bed.y }]} pointerEvents="none">
      <View style={containerStyle}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
  },
  bed: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#6b4226',
    borderWidth: 2,
    borderColor: '#4a2e18',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bedGrowing: {
    backgroundColor: '#2d5a1b',
    borderColor: '#4a8a2e',
    borderStyle: 'solid',
  },
  bedReady: {
    backgroundColor: '#1a6b2a',
    borderColor: '#4adc6a',
    borderStyle: 'solid',
  },
  bedHighlighted: {
    borderColor: '#7ec850',
    backgroundColor: 'rgba(126, 200, 80, 0.25)',
  },
  emoji: {
    fontSize: 22,
  },
});
