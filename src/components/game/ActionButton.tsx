import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { HarvestTarget, HarvestableType } from '../../hooks/useNearestHarvestable';
import { useGameStore } from '../../store/gameStore';
import type { ToolType } from '../../types';

// ─── Métadonnées d'affichage ──────────────────────────────────────────────────

const NODE_EMOJI: Record<HarvestableType, string> = {
  twig:           '🌿',
  pebble_cluster: '⚫',
  tree:           '🌲',
  rock:           '🪨',
};

const ACTION_LABEL: Record<HarvestableType, string> = {
  twig:           'Ramasser',
  pebble_cluster: 'Ramasser',
  tree:           'Couper',
  rock:           'Miner',
};

const TOOL_LABEL: Record<ToolType, string> = {
  wooden_axe:    'Hache req.',
  stone_pickaxe: 'Pioche req.',
};

// ─── Composant ────────────────────────────────────────────────────────────────

interface ActionButtonProps {
  target: HarvestTarget | null;
}

/**
 * Bouton d'interaction principal — positionné en bas à droite, symétrique au joystick.
 *
 * ─── États visuels ──────────────────────────────────────────────────────────
 *  ✋ Idle   — aucun objet à portée      → gris/transparent
 *  🌿 Ready  — objet accessible à portée → vert, appuyable
 *  🪓 Locked — objet à portée, outil manquant → orange, non appuyable
 */
export const ActionButton: React.FC<ActionButtonProps> = ({ target }) => {
  const harvestTree   = useGameStore((s) => s.harvestTree);
  const harvestRock   = useGameStore((s) => s.harvestRock);
  const harvestTwig   = useGameStore((s) => s.harvestTwig);
  const harvestPebble = useGameStore((s) => s.harvestPebble);

  const handlePress = useCallback(() => {
    if (!target?.canHarvest) return;
    switch (target.type) {
      case 'tree':           harvestTree(target.id);   break;
      case 'rock':           harvestRock(target.id);   break;
      case 'twig':           harvestTwig(target.id);   break;
      case 'pebble_cluster': harvestPebble(target.id); break;
    }
  }, [target, harvestTree, harvestRock, harvestTwig, harvestPebble]);

  const hasTarget = target !== null;
  const canAct    = hasTarget && target.canHarvest;

  const emoji = hasTarget ? NODE_EMOJI[target.type] : '✋';
  const label = !hasTarget
    ? 'Approche'
    : canAct
    ? ACTION_LABEL[target.type]
    : TOOL_LABEL[target.requiredTool!];

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        hasTarget && styles.btnActive,
        hasTarget && !canAct && styles.btnLocked,
      ]}
      onPress={handlePress}
      disabled={!canAct}
      activeOpacity={0.7}
      accessibilityLabel={label}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, hasTarget && !canAct && styles.labelLocked]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  btn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(15, 15, 30, 0.78)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  btnActive: {
    backgroundColor: 'rgba(20, 55, 10, 0.88)',
    borderColor: '#7ec850',
  },
  btnLocked: {
    backgroundColor: 'rgba(55, 30, 5, 0.82)',
    borderColor: '#c07a1e',
  },
  emoji: {
    fontSize: 26,
  },
  label: {
    color: '#c8d8c0',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  labelLocked: {
    color: '#f0c060',
  },
});
