import React, { useCallback } from 'react';
import { TouchableOpacity, Text, Image, View, StyleSheet, ImageSourcePropType } from 'react-native';
import type { HarvestTarget, HarvestableType } from '../../hooks/useNearestHarvestable';
import { useGameStore } from '../../store/gameStore';
import type { ToolType, SeedType } from '../../types';

// ─── Assets des nœuds récoltables ─────────────────────────────────────────────

const NODE_IMAGE: Partial<Record<HarvestableType, ImageSourcePropType>> = {
  twig:           require('../../../assets/branch.png'),
  pebble_cluster: require('../../../assets/little-rock.png'),
  tree:           require('../../../assets/tree.png'),
  rock:           require('../../../assets/rock.png'),
};

// ─── Fallback emoji (potager, eau — pas d'asset dédié) ────────────────────────

const NODE_EMOJI: Partial<Record<HarvestableType, string>> = {
  garden_bed:   '🌱',
  water_source: '🌊',
};

const ACTION_LABEL: Record<HarvestableType, string> = {
  twig:           'Ramasser',
  pebble_cluster: 'Ramasser',
  tree:           'Couper',
  rock:           'Miner',
  garden_bed:     'Interagir',
  water_source:   'Collecter',
};

const TOOL_LABEL: Record<ToolType, string> = {
  wooden_axe:    'Hache req.',
  stone_pickaxe: 'Pioche req.',
};

// ─── Métadonnées potager ──────────────────────────────────────────────────────

const BED_EMOJI = {
  empty:   '🌱',
  growing: '💧',
  ready:   '🌾',
} as const;

const BED_LABEL = {
  empty:   'Planter',
  growing: 'Arroser',
  ready:   'Récolter',
} as const;

const SEED_EMOJI: Record<SeedType, string> = {
  berry_seed:    '🍓',
  grain_seed:    '🌾',
  mushroom_seed: '🍄',
};

// ─── Composant ────────────────────────────────────────────────────────────────

interface ActionButtonProps {
  target: HarvestTarget | null;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ target }) => {
  const harvestTree   = useGameStore((s) => s.harvestTree);
  const harvestRock   = useGameStore((s) => s.harvestRock);
  const harvestTwig   = useGameStore((s) => s.harvestTwig);
  const harvestPebble = useGameStore((s) => s.harvestPebble);
  const plantSeed     = useGameStore((s) => s.plantSeed);
  const waterBed      = useGameStore((s) => s.waterBed);
  const harvestCrop   = useGameStore((s) => s.harvestCrop);
  const harvestWater  = useGameStore((s) => s.harvestWater);

  const handlePress = useCallback(() => {
    if (!target?.canHarvest) return;
    switch (target.type) {
      case 'tree':           harvestTree(target.id);   break;
      case 'rock':           harvestRock(target.id);   break;
      case 'twig':           harvestTwig(target.id);   break;
      case 'pebble_cluster': harvestPebble(target.id); break;
      case 'water_source':   harvestWater(target.id);  break;
      case 'garden_bed':
        if (target.bedState === 'empty' && target.seedToPlant) {
          plantSeed(target.id, target.seedToPlant);
        } else if (target.bedState === 'growing') {
          waterBed(target.id);
        } else if (target.bedState === 'ready') {
          harvestCrop(target.id);
        }
        break;
    }
  }, [target, harvestTree, harvestRock, harvestTwig, harvestPebble, harvestWater, plantSeed, waterBed, harvestCrop]);

  // ── Calcul de l'affichage ──────────────────────────────────────────────────
  const hasTarget = target !== null;
  const canAct    = hasTarget && target.canHarvest;

  let iconImage: ImageSourcePropType | null = null;
  let iconEmoji = '✋';
  let label = 'Approche';
  let btnStyle: object[] = [styles.btn];

  if (!hasTarget) {
    // Idle
  } else if (target.type === 'garden_bed' && target.bedState) {
    const state = target.bedState;
    iconEmoji = state === 'empty' && target.seedToPlant
      ? SEED_EMOJI[target.seedToPlant]
      : BED_EMOJI[state];
    label = BED_LABEL[state];
    if (canAct) {
      btnStyle = [styles.btn, state === 'growing' ? styles.btnWater : styles.btnActive];
    } else {
      btnStyle = [styles.btn, styles.btnLocked];
      label = state === 'empty' ? 'Graine req.' : 'Eau req.';
    }
  } else {
    const img = NODE_IMAGE[target.type];
    if (img) {
      iconImage = img;
    } else {
      iconEmoji = NODE_EMOJI[target.type] ?? '✋';
    }
    if (canAct) {
      btnStyle = [styles.btn, styles.btnActive];
      label = ACTION_LABEL[target.type];
    } else {
      btnStyle = [styles.btn, styles.btnLocked];
      label = TOOL_LABEL[target.requiredTool!];
    }
  }

  return (
    <TouchableOpacity
      style={btnStyle}
      onPress={handlePress}
      disabled={!canAct}
      activeOpacity={0.7}
      accessibilityLabel={label}
    >
      <View style={styles.iconWrap}>
        {iconImage ? (
          <Image source={iconImage} style={styles.iconImage} resizeMode="contain" />
        ) : (
          <Text style={styles.emoji}>{iconEmoji}</Text>
        )}
      </View>
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
  btnWater: {
    backgroundColor: 'rgba(10, 40, 80, 0.88)',
    borderColor: '#4aacdc',
  },
  btnLocked: {
    backgroundColor: 'rgba(55, 30, 5, 0.82)',
    borderColor: '#c07a1e',
  },
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 64,
    height: 64,
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
