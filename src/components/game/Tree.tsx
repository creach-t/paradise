import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { TreeNode } from '../../types';
import { usePlayerStore } from '../../store/playerStore';

interface TreeProps {
  tree: TreeNode;
  isHighlighted?: boolean;
}

// Flip déterministe basé sur la position — alterne visuellement sans rand()
const getFlipX = (x: number, y: number) =>
  (Math.floor(x / 45) + Math.floor(y / 65)) % 2 === 0;

export const Tree: React.FC<TreeProps> = ({ tree, isHighlighted = false }) => {
  const equippedTool = usePlayerStore((s) => s.equippedTool);
  const showLockBadge = !tree.isHarvested && equippedTool !== 'wooden_axe';

  const isTrio = tree.id.startsWith('trio_');
  const flipX  = getFlipX(tree.x, tree.y);

  const normalSrc   = isTrio
    ? require('../../../assets/trio-tree.png')
    : require('../../../assets/tree.png');
  const harvestedSrc = isTrio
    ? require('../../../assets/trio-tree_cut.png')
    : require('../../../assets/tree_cut.png');

  return (
    <View
      style={[
        styles.container,
        { left: tree.x, top: tree.y },
        isHighlighted && styles.highlighted,
      ]}
      pointerEvents="none"
    >
      <Image
        source={tree.isHarvested ? harvestedSrc : normalSrc}
        style={[styles.image, flipX && styles.flipped]}
        resizeMode="contain"
      />

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
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  flipped: {
    transform: [{ scaleX: -1 }],
  },
  highlighted: {
    borderRadius: 28,
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
