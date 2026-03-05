import type { HarvestableNode, ResourceInventory, PlayerStats, ToolType } from '../types';
import { BALANCE } from '../constants/balance';
import { applyXpGain, consumeEnergy } from './player';

// ─── Types de résultat ────────────────────────────────────────────────────────

export type HarvestFailReason = 'already_harvested' | 'wrong_tool' | 'no_energy';

export type HarvestResult =
  | {
      ok: true;
      /** Ressources à ajouter à l'inventaire (deltas positifs). */
      resourceDelta: Partial<ResourceInventory>;
      /** Délai en ms avant que le nœud respawn. */
      respawnDelay: number;
      /** Stats joueur après consommation énergie + gain XP. */
      nextStats: PlayerStats;
    }
  | { ok: false; reason: HarvestFailReason };

// ─── Logique commune ──────────────────────────────────────────────────────────

/**
 * Noyau partagé par toutes les actions de récolte.
 * Vérifie les préconditions, consomme l'énergie, calcule l'XP.
 */
function attempt(
  node: HarvestableNode,
  stats: PlayerStats,
  equippedTool: ToolType | null,
  requiredTool: ToolType | null,
  energyCost: number,
  xpGain: number,
  resourceDelta: Partial<ResourceInventory>,
  respawnDelay: number,
): HarvestResult {
  if (node.isHarvested)
    return { ok: false, reason: 'already_harvested' };
  if (requiredTool !== null && equippedTool !== requiredTool)
    return { ok: false, reason: 'wrong_tool' };

  const statsAfterEnergy = consumeEnergy(stats, energyCost);
  if (!statsAfterEnergy)
    return { ok: false, reason: 'no_energy' };

  return {
    ok: true,
    resourceDelta,
    respawnDelay,
    nextStats: xpGain > 0 ? applyXpGain(statsAfterEnergy, xpGain) : statsAfterEnergy,
  };
}

// ─── Actions de récolte ───────────────────────────────────────────────────────

/** Récolte un arbre — requiert wooden_axe équipée. */
export function harvestTree(
  node: HarvestableNode,
  stats: PlayerStats,
  equippedTool: ToolType | null,
): HarvestResult {
  return attempt(
    node, stats, equippedTool, 'wooden_axe',
    BALANCE.HARVEST_ENERGY_TOOL, BALANCE.XP_TREE,
    { wood: BALANCE.WOOD_PER_TAP }, BALANCE.TREE_RESPAWN_DELAY,
  );
}

/** Récolte un rocher — requiert stone_pickaxe équipée. */
export function harvestRock(
  node: HarvestableNode,
  stats: PlayerStats,
  equippedTool: ToolType | null,
): HarvestResult {
  return attempt(
    node, stats, equippedTool, 'stone_pickaxe',
    BALANCE.HARVEST_ENERGY_TOOL, BALANCE.XP_ROCK,
    { stone: BALANCE.STONE_PER_TAP }, BALANCE.ROCK_RESPAWN_DELAY,
  );
}

/** Récolte un buisson de brindilles — à la main. */
export function harvestTwig(node: HarvestableNode, stats: PlayerStats): HarvestResult {
  return attempt(
    node, stats, null, null,
    BALANCE.HARVEST_ENERGY_HAND, BALANCE.XP_TWIG,
    { branch: BALANCE.BRANCH_PER_TAP }, BALANCE.TWIG_RESPAWN_DELAY,
  );
}

/** Récolte un tas de galets — à la main. */
export function harvestPebble(node: HarvestableNode, stats: PlayerStats): HarvestResult {
  return attempt(
    node, stats, null, null,
    BALANCE.HARVEST_ENERGY_HAND, BALANCE.XP_PEBBLE,
    { pebble: BALANCE.PEBBLE_PER_TAP }, BALANCE.PEBBLE_RESPAWN_DELAY,
  );
}

/** Collecte de l'eau à la source — à la main, sans XP. */
export function harvestWater(node: HarvestableNode, stats: PlayerStats): HarvestResult {
  return attempt(
    node, stats, null, null,
    BALANCE.HARVEST_ENERGY_HAND, 0,
    { water: BALANCE.WATER_PER_TAP }, BALANCE.WATER_SOURCE_RESPAWN_DELAY,
  );
}
