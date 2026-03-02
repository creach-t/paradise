import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PebbleNode } from '../../types';

interface PebbleClusterProps {
  pebble: PebbleNode;
  /** Surbrillance — vrai si ce nœud est la cible d'interaction courante. */
  isHighlighted?: boolean;
}

/**
 * Tas de petits galets — composant d'affichage pur (aucun TouchableOpacity).
 *
 * ─── Mécaniques ───────────────────────────────────────────────────────────────
 * - Aucun outil requis → accessible à la main
 * - Donne 1 galet par interaction via ActionButton
 * - Respawn en 8 secondes
 * - Progression : galet × 3 → pioche en pierre → miner les rochers → pierre
 */
export const PebbleCluster: React.FC<PebbleClusterProps> = ({ pebble, isHighlighted = false }) => {
  return (
    <View
      style={[
        styles.container,
        { left: pebble.x, top: pebble.y },
        pebble.isHarvested && styles.harvested,
        isHighlighted && styles.highlighted,
      ]}
      pointerEvents="none"
    >
      <Text style={styles.emoji}>{pebble.isHarvested ? '·' : '🪨'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 18, // Plus petit que les gros rochers (32px) pour la distinction visuelle
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  harvested: {
    opacity: 0.2,
  },
  highlighted: {
    borderRadius: 17,
    backgroundColor: 'rgba(126,200,80,0.25)',
  },
});
