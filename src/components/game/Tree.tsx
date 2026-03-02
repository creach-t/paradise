import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TreeNode } from '../../types';
import { usePlayerStore } from '../../store/playerStore';

interface TreeProps {
  tree: TreeNode;
  /** Surbrillance — vrai si ce nœud est la cible d'interaction courante. */
  isHighlighted?: boolean;
}

/**
 * Arbre récoltable — composant d'affichage pur (aucun TouchableOpacity).
 * La récolte est déclenchée par ActionButton quand le joueur est à portée.
 *
 * ─── États visuels ────────────────────────────────────────────────────────────
 *  🌲 Normal       — disponible
 *  🌲🪓 Verrouillé  — hache manquante → badge indicateur
 *  🌲✨ En surbrillance — joueur à portée, sélectionné par useNearestHarvestable
 *  🪵  Récolté      — en attente de respawn (très transparent)
 */
export const Tree: React.FC<TreeProps> = ({ tree, isHighlighted = false }) => {
  const equippedTool = usePlayerStore((s) => s.equippedTool);
  const showLockBadge = !tree.isHarvested && equippedTool !== 'wooden_axe';

  return (
    <View
      style={[
        styles.container,
        { left: tree.x, top: tree.y },
        tree.isHarvested && styles.harvested,
        isHighlighted && styles.highlighted,
      ]}
      pointerEvents="none"
    >
      <Text style={styles.emoji}>{tree.isHarvested ? '🪵' : '🌲'}</Text>

      {/* Badge "outil requis" — visible seulement si pas encore équipé */}
      {showLockBadge && (
        <View style={styles.lockBadge}>
          <Text style={styles.lockText}>🪓</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 38,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  harvested: {
    opacity: 0.28,
  },
  highlighted: {
    borderRadius: 26,
    backgroundColor: 'rgba(126,200,80,0.22)',
  },
  lockBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 7,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  lockText: {
    fontSize: 10,
  },
});
