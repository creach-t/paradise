import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { TreeNode } from '../../types';
import { useGameStore } from '../../store/gameStore';

interface TreeProps {
  tree: TreeNode;
}

/**
 * Arbre récoltable. Tap → +1 bois, passe en état récolté (semi-transparent).
 * Se ré-affiche quand le store notifie isHarvested = false.
 * Prêt pour : animations (scale bounce, feuilles qui tombent), niveaux d'arbre, outils.
 */
export const Tree: React.FC<TreeProps> = ({ tree }) => {
  const harvestTree = useGameStore((s) => s.harvestTree);

  const handlePress = useCallback(() => {
    harvestTree(tree.id);
  }, [tree.id, harvestTree]);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { left: tree.x, top: tree.y },
        tree.isHarvested && styles.harvested,
      ]}
      onPress={handlePress}
      activeOpacity={0.6}
      disabled={tree.isHarvested}
      accessibilityLabel={tree.isHarvested ? 'Arbre récolté' : 'Arbre — Tap pour récolter'}
    >
      <Text style={styles.emoji}>{tree.isHarvested ? '🪵' : '🌲'}</Text>
    </TouchableOpacity>
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
    // Légère ombre pour décoller l'objet du sol.
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  harvested: {
    opacity: 0.35,
  },
});
