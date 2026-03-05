import type { SeedType } from '../types';

/**
 * Toutes les constantes de gameplay (équilibre, tuning).
 *
 * Règle : tout chiffre qui influe sur le ressenti de jeu vit ici.
 * Les constantes structurelles (dimensions du monde, positions) restent dans gameConfig.ts.
 */
export const BALANCE = {

  // ── Récolte — coût en énergie ──────────────────────────────────────────────
  /** Coût énergie pour une récolte à la main (brindilles, galets, eau, potager). */
  HARVEST_ENERGY_HAND:   1,
  /** Coût énergie pour une récolte avec outil (arbres, rochers). */
  HARVEST_ENERGY_TOOL:   2,
  /** Coût énergie pour les actions de potager (planter, arroser, récolter). */
  HARVEST_ENERGY_GARDEN: 1,

  // ── Récolte — quantités obtenues ──────────────────────────────────────────
  WOOD_PER_TAP:   2,
  STONE_PER_TAP:  2,
  BRANCH_PER_TAP: 1,
  PEBBLE_PER_TAP: 1,
  WATER_PER_TAP:  2,

  // ── XP par action ─────────────────────────────────────────────────────────
  XP_TWIG:            5,
  XP_PEBBLE:          5,
  XP_TREE:           15,
  XP_ROCK:           15,
  XP_GARDEN_HARVEST: 10,

  // ── Respawn — délais (ms) ─────────────────────────────────────────────────
  TREE_RESPAWN_DELAY:         12_000,
  ROCK_RESPAWN_DELAY:         18_000,
  TWIG_RESPAWN_DELAY:          6_000,
  PEBBLE_RESPAWN_DELAY:        8_000,
  WATER_SOURCE_RESPAWN_DELAY: 10_000,

  /** Fréquence du tick de respawn (ms). */
  RESPAWN_TICK: 1_000,

  // ── Potager ────────────────────────────────────────────────────────────────
  /** Réduction de readyAt (ms) par arrosage. */
  WATERED_REDUCTION_MS: 15_000,

  // ── Cycle jour/nuit ───────────────────────────────────────────────────────
  /** Durée d'un cycle complet jour/nuit (ms). 5 min = 300 000 ms. */
  DAY_CYCLE_MS: 5 * 60 * 1_000,
  /** Opacité max de l'overlay nocturne (0 = invisible, 1 = noir total). */
  NIGHT_MAX_OPACITY: 0.62,

} as const;

// ── Données de pousse par graine ─────────────────────────────────────────────

/** Temps de base avant récolte par type de graine (ms). */
export const GROWTH_BASE_MS: Record<SeedType, number> = {
  berry_seed:    30_000,
  grain_seed:    60_000,
  mushroom_seed: 90_000,
};

/** Ressource et quantité obtenues à la récolte d'une culture. */
export const CROP_YIELD: Record<SeedType, { resource: 'berry' | 'grain' | 'mushroom'; amount: number }> = {
  berry_seed:    { resource: 'berry',    amount: 3 },
  grain_seed:    { resource: 'grain',    amount: 2 },
  mushroom_seed: { resource: 'mushroom', amount: 1 },
};
