import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RockNode } from '../../types';
import { usePlayerStore } from '../../store/playerStore';

interface RockProps {
  rock: RockNode;
  /** Surbrillance — vrai si ce nœud est la cible d'interaction courante. */
  isHighlighted?: boolean;
}

/**
 * Gros rocher récoltable — composant d'affichage pur (aucun TouchableOpacity).
 * La récolte est déclenchée par ActionButton quand le joueur est à portée.
 *
 * ─── États visuels ────────────────────────────────────────────────────────────
 *  🪨 Normal       — disponible
 *  🪨⛏️ Verrouillé  — pioche manquante → badge indicateur
 *  🪨✨ En surbrillance — joueur à portée, sélectionné par useNearestHarvestable
 *  💨  Récolté      — en attente de respawn
 */
export const Rock: React.FC<RockProps> = ({ rock, isHighlighted = false }) => {
  const equippedTool = usePlayerStore((s) => s.equippedTool);
  const showLockBadge = !rock.isHarvested && equippedTool !== 'stone_pickaxe';

  return (
    <View
      style={[
        styles.container,
        { left: rock.x, top: rock.y },
        rock.isHarvested && styles.harvested,
        isHighlighted && styles.highlighted,
      ]}
      pointerEvents="none"
    >
      <Text style={styles.emoji}>{rock.isHarvested ? '💨' : '🪨'}</Text>

      {/* Badge "outil requis" — visible seulement si pas encore équipé */}
      {showLockBadge && (
        <View style={styles.lockBadge}>
          <Text style={styles.lockText}>⛏️</Text>
        </View>
      )}
    </View>
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
    opacity: 0.22,
  },
  highlighted: {
    borderRadius: 24,
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
