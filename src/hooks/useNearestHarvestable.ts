import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import type { ToolType } from '../types';

// ─── Types exportés ────────────────────────────────────────────────────────────

export type HarvestableType = 'tree' | 'rock' | 'twig' | 'pebble_cluster';

export interface HarvestTarget {
  /** ID du nœud le plus proche. */
  id: string;
  /** Type — détermine quelle action harvest appeler. */
  type: HarvestableType;
  /** Vrai si le joueur peut récolter maintenant (outil équipé ou aucun outil requis). */
  canHarvest: boolean;
  /** Outil requis, null si aucun. */
  requiredTool: ToolType | null;
}

// ─── Constantes ────────────────────────────────────────────────────────────────

/** Distance centre-à-centre (px) en dessous de laquelle un nœud est accessible. */
const INTERACT_RANGE = 80;

/** Fréquence de polling (ms) — assez rapide pour sembler réactif, assez lent pour ne pas peser. */
const POLL_MS = 150;

/**
 * Demi-taille de chaque sprite pour calculer son centre depuis la position top-left.
 * Doit correspondre aux dimensions définies dans les StyleSheets des composants.
 */
const SPRITE_HALF: Record<HarvestableType, number> = {
  tree:           26, // container 52 px
  rock:           24, // container 48 px
  twig:           19, // container 38 px
  pebble_cluster: 17, // container 34 px
};

/** Demi-taille du sprite joueur (PlayerCharacter container ≈ 40 px). */
const PLAYER_HALF = 20;

// ─── Utilitaire ────────────────────────────────────────────────────────────────

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Renvoie le nœud récoltable le plus proche du joueur dans le rayon INTERACT_RANGE,
 * ou null si aucun n'est à portée.
 *
 * ─── Performances ───────────────────────────────────────────────────────────
 * - Polling via setInterval(POLL_MS) + getState() → zéro subscription React,
 *   donc zéro re-render du WorldLayer pendant le mouvement du joueur.
 * - setState uniquement quand le résultat change (compare id + canHarvest) →
 *   GameScene ne re-rend que lorsque la cible change réellement.
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

      let best: HarvestTarget | null = null;
      let bestDist = INTERACT_RANGE + 1;

      // ── Scanner une liste de nœuds ───────────────────────────────────────
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

      // Priorité : ressources à la main d'abord, puis outils requis
      scan(gs.twigs,   'twig',           null);
      scan(gs.pebbles, 'pebble_cluster', null);
      scan(gs.trees,   'tree',           'wooden_axe');
      scan(gs.rocks,   'rock',           'stone_pickaxe');

      // ── Mise à jour frugale ──────────────────────────────────────────────
      // N'appelle setState que si le résultat a réellement changé.
      setTarget((prev) => {
        if (best === null && prev === null) return prev;
        if (best === null) return null;
        if (prev === null) return best as HarvestTarget;
        const b = best as HarvestTarget;
        if (prev.id === b.id && prev.canHarvest === b.canHarvest) return prev;
        return b;
      });
    }, POLL_MS);

    return () => clearInterval(intervalId);
  }, []); // stable — utilise getState(), pas de dépendances React

  return target;
}
