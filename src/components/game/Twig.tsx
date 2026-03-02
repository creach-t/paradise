import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TwigNode } from '../../types';

interface TwigProps {
  twig: TwigNode;
  /** Surbrillance — vrai si ce nœud est la cible d'interaction courante. */
  isHighlighted?: boolean;
}

/**
 * Buisson de brindilles — composant d'affichage pur (aucun TouchableOpacity).
 *
 * ─── Mécaniques ───────────────────────────────────────────────────────────────
 * - Aucun outil requis → accessible à la main
 * - Donne 1 brindille par interaction via ActionButton
 * - Respawn en 6 secondes
 * - Progression : brindille × 3 → hache en bois → couper les arbres → bois
 */
export const Twig: React.FC<TwigProps> = ({ twig, isHighlighted = false }) => {
  return (
    <View
      style={[
        styles.container,
        { left: twig.x, top: twig.y },
        twig.isHarvested && styles.harvested,
        isHighlighted && styles.highlighted,
      ]}
      pointerEvents="none"
    >
      <Text style={styles.emoji}>{twig.isHarvested ? '🌱' : '🌿'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  harvested: {
    opacity: 0.3,
  },
  highlighted: {
    borderRadius: 19,
    backgroundColor: 'rgba(126,200,80,0.25)',
  },
});
