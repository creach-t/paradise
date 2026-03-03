import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import type { ToolType, SeedType, GardenBedState } from '../types';

// ─── Types exportés ────────────────────────────────────────────────────────────

export type HarvestableType = 'tree' | 'rock' | 'twig' | 'pebble_cluster' | 'garden_bed' | 'water_source';

export interface HarvestTarget {
  /** ID du nœud le plus proche. */
  id: string;
  /** Type — détermine quelle action harvest appeler. */
  type: HarvestableType;
  /** Vrai si le joueur peut interagir maintenant. */
  canHarvest: boolean;
  /** Outil requis, null si aucun. */
  requiredTool: ToolType | null;
  // ── Potager ──
  /** État du lit de potager (undefined pour les autres types). */
  bedState?: GardenBedState;
  /** Graine à auto-planter si bedState === 'empty' (première dispo dans l'inventaire). */
  seedToPlant?: SeedType;
}

// ─── Constantes ────────────────────────────────────────────────────────────────

/** Distance centre-à-centre (px) en dessous de laquelle un nœud est accessible. */
const INTERACT_RANGE = 80;

/** Fréquence de polling (ms). */
const POLL_MS = 150;

/**
 * Demi-taille de chaque sprite pour calculer son centre depuis la position top-left.
 */
const SPRITE_HALF: Record<HarvestableType, number> = {
  tree:           26, // container 52 px
  rock:           24, // container 48 px
  twig:           19, // container 38 px
  pebble_cluster: 17, // container 34 px
  garden_bed:     24, // container 48 px
  water_source:   28, // container 56 px
};

/** Demi-taille du sprite joueur (PlayerCharacter container ≈ 40 px). */
const PLAYER_HALF = 20;

// ─── Utilitaire ────────────────────────────────────────────────────────────────

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

/** Retourne la première graine disponible dans l'inventaire, ou null. */
function firstAvailableSeed(resources: { berry_seed: number; grain_seed: number; mushroom_seed: number }): SeedType | null {
  const order: SeedType[] = ['berry_seed', 'grain_seed', 'mushroom_seed'];
  for (const s of order) {
    if ((resources[s] ?? 0) > 0) return s;
  }
  return null;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Renvoie le nœud récoltable le plus proche du joueur dans le rayon INTERACT_RANGE,
 * ou null si aucun n'est à portée.
 *
 * ─── Performances ───────────────────────────────────────────────────────────
 * - Polling via setInterval(POLL_MS) + getState() → zéro subscription React.
 * - setState uniquement quand le résultat change → zéro re-render superflu.
 */
export function useNearestHarvestable(): HarvestTarget | null {
  const [target, setTarget] = useState<HarvestTarget | null>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const gs = useGameStore.getState();
      const ps = usePlayerStore.getState();

      // Centre du joueur dans la scène
      const px = ps.player.x + PLAYER_HALF;
      const py = ps.player.y + PLAYER_HALF;
      const equipped = ps.equippedTool;
      const resources = gs.resources;

      let best: HarvestTarget | null = null;
      let bestDist = INTERACT_RANGE + 1;

      // ── Scanner une liste de nœuds classiques ───────────────────────────────
      function scan<T extends { id: string; x: number; y: number; isHarvested: boolean }>(
        nodes: T[],
        type: HarvestableType,
        requiredTool: ToolType | null,
      ): void {
        const half = SPRITE_HALF[type];
        for (const node of nodes) {
          if (node.isHarvested) continue;
          const d = distance(px, py, node.x + half, node.y + half);
          if (d <= INTERACT_RANGE && d < bestDist) {
            bestDist = d;
            best = {
              id: node.id,
              type,
              canHarvest: requiredTool === null || equipped === requiredTool,
              requiredTool,
            };
          }
        }
      }

      // ── Scanner les sources d'eau ──────────────────────────────────────────
      scan(gs.waterSources, 'water_source', null);

      // ── Scanner les lits de potager (logique contextuelle par état) ─────────
      {
        const half = SPRITE_HALF.garden_bed;
        for (const bed of gs.gardenBeds) {
          const d = distance(px, py, bed.x + half, bed.y + half);
          if (d > INTERACT_RANGE || d >= bestDist) continue;

          let canHarvest = false;
          let seedToPlant: SeedType | undefined;

          if (bed.state === 'empty') {
            const seed = firstAvailableSeed(resources);
            canHarvest = seed !== null;
            seedToPlant = seed ?? undefined;
          } else if (bed.state === 'growing') {
            canHarvest = resources.water > 0;
          } else {
            // ready — toujours actionnable
            canHarvest = true;
          }

          bestDist = d;
          best = {
            id: bed.id,
            type: 'garden_bed',
            canHarvest,
            requiredTool: null,
            bedState: bed.state,
            seedToPlant,
          };
        }
      }

      // Priorité : ressources à la main d'abord, puis outils requis
      scan(gs.twigs,   'twig',           null);
      scan(gs.pebbles, 'pebble_cluster', null);
      scan(gs.trees,   'tree',           'wooden_axe');
      scan(gs.rocks,   'rock',           'stone_pickaxe');

      // ── Mise à jour frugale ──────────────────────────────────────────────────
      setTarget((prev) => {
        if (best === null && prev === null) return prev;
        if (best === null) return null;
        if (prev === null) return best as HarvestTarget;
        const b = best as HarvestTarget;
        if (
          prev.id === b.id &&
          prev.canHarvest === b.canHarvest &&
          prev.bedState === b.bedState &&
          prev.seedToPlant === b.seedToPlant
        ) return prev;
        return b;
      });
    }, POLL_MS);

    return () => clearInterval(intervalId);
  }, []); // stable — utilise getState(), pas de dépendances React

  return target;
}
