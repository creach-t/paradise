import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useGameStore } from '../../store/gameStore';
import { useRespawn } from '../../hooks/useRespawn';
import { Tree } from './Tree';
import { Rock } from './Rock';
import { House } from './House';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Position de la maison : centrée horizontalement, dans le tiers bas du monde.
const HOUSE_X = SCREEN_WIDTH / 2 - 32;
const HOUSE_Y = 370;

/**
 * Scène principale du jeu — rendu de tous les objets du monde.
 * Utilise le positionnement absolu sur un fond d'herbe.
 *
 * Prêt pour :
 *  - ScrollView / pan gesture pour un monde plus grand
 *  - Caméra (camera offset + transform)
 *  - Couches de rendu (sol, ombres, objets, particules)
 */
export const GameScene: React.FC = () => {
  const trees = useGameStore((s) => s.trees);
  const rocks = useGameStore((s) => s.rocks);

  // Active le système de respawn pour cette scène.
  useRespawn();

  return (
    <View style={styles.world}>
      {/* Sol — une couleur uniforme pour l'instant. Remplacer par une image tuilée. */}
      <View style={styles.groundLayer} />

      {/* Chemin central décoratif */}
      <View style={styles.path} />

      {/* Maison */}
      <House x={HOUSE_X} y={HOUSE_Y} />

      {/* Arbres */}
      {trees.map((tree) => (
        <Tree key={tree.id} tree={tree} />
      ))}

      {/* Rochers */}
      {rocks.map((rock) => (
        <Rock key={rock.id} rock={rock} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  world: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  groundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#7ec850',
  },
  /** Petite touche visuelle : un chemin de terre sous la maison. */
  path: {
    position: 'absolute',
    width: 60,
    height: 120,
    backgroundColor: '#c2a062',
    borderRadius: 30,
    left: SCREEN_WIDTH / 2 - 30,
    top: HOUSE_Y + 55,
    opacity: 0.5,
  },
});
