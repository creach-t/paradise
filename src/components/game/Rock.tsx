import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { RockNode } from '../../types';
import { useGameStore } from '../../store/gameStore';

interface RockProps {
  rock: RockNode;
}

/**
 * Rocher récoltable. Tap → +1 pierre, passe en état récolté.
 * Prêt pour : types de minéraux (fer, or…), outils de minage, niveaux de résistance.
 */
export const Rock: React.FC<RockProps> = ({ rock }) => {
  const harvestRock = useGameStore((s) => s.harvestRock);

  const handlePress = useCallback(() => {
    harvestRock(rock.id);
  }, [rock.id, harvestRock]);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { left: rock.x, top: rock.y },
        rock.isHarvested && styles.harvested,
      ]}
      onPress={handlePress}
      activeOpacity={0.6}
      disabled={rock.isHarvested}
      accessibilityLabel={rock.isHarvested ? 'Rocher récolté' : 'Rocher — Tap pour récolter'}
    >
      <Text style={styles.emoji}>{rock.isHarvested ? '💨' : '🪨'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 32,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 2,
  },
  harvested: {
    opacity: 0.25,
  },
});
