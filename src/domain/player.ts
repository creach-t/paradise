import type { PlayerStats } from '../types';

// ─── Constantes de progression ────────────────────────────────────────────────

/** Facteur multiplicateur de l'XP requis à chaque level-up. */
const XP_LEVEL_FACTOR = 1.6;
/** Bonus d'énergie maximale gagné par niveau. */
const ENERGY_PER_LEVEL = 10;

// ─── XP & niveau ─────────────────────────────────────────────────────────────

/**
 * Applique un gain d'XP et retourne les nouvelles stats (avec level-ups en cascade).
 *
 * Fonction pure — aucun effet de bord, testable sans store.
 *
 * @example
 * const next = applyXpGain({ level: 1, xp: 90, xpToNextLevel: 100, ... }, 15);
 * // → { level: 2, xp: 5, xpToNextLevel: 160, maxEnergy: 110, energy: 110, ... }
 */
export function applyXpGain(stats: PlayerStats, amount: number): PlayerStats {
  let s: PlayerStats = { ...stats, xp: stats.xp + amount };

  while (s.xp >= s.xpToNextLevel) {
    const newMaxEnergy = s.maxEnergy + ENERGY_PER_LEVEL;
    s = {
      ...s,
      xp:             s.xp - s.xpToNextLevel,
      level:          s.level + 1,
      xpToNextLevel:  Math.floor(s.xpToNextLevel * XP_LEVEL_FACTOR),
      maxEnergy:      newMaxEnergy,
      energy:         newMaxEnergy, // pleine régénération au level-up
    };
  }

  return s;
}

// ─── Énergie ──────────────────────────────────────────────────────────────────

/**
 * Consomme de l'énergie. Retourne les nouvelles stats, ou null si insuffisant.
 *
 * Fonction pure — l'appelant doit vérifier la valeur de retour.
 *
 * @example
 * const next = consumeEnergy(stats, 2);
 * if (!next) return; // énergie insuffisante — bloquer l'action
 */
export function consumeEnergy(stats: PlayerStats, cost: number): PlayerStats | null {
  if (stats.energy < cost) return null;
  return { ...stats, energy: stats.energy - cost };
}

/**
 * Régénère de l'énergie sans dépasser maxEnergy.
 *
 * @example
 * const next = regenEnergy(stats, 5);
 */
export function regenEnergy(stats: PlayerStats, amount: number): PlayerStats {
  return { ...stats, energy: Math.min(stats.maxEnergy, stats.energy + amount) };
}
