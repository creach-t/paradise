import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '../constants/gameConfig';

/**
 * Hook de gestion des respawns.
 *
 * ─── Fix performance ───────────────────────────────────────────────────────
 * Ancienne version : dépendances [trees, rocks, ...] → l'interval était
 * recréé à chaque récolte (chaque tap déclenchait clearInterval + setInterval).
 * Nouvelle version : getState() lit l'état Zustand courant SANS s'abonner,
 * ce qui permet un tableau de dépendances vide = un seul interval stable.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * À monter une seule fois dans GameScene.
 */
export function useRespawn(): void {
  useEffect(() => {
    const interval = setInterval(() => {
      const {
        trees, rocks, twigs, pebbles, gardenBeds, waterSources,
        respawnTree, respawnRock, respawnTwig, respawnPebble,
        respawnWaterSource, advanceGardenBed,
      } = useGameStore.getState();
      const now = Date.now();

      for (const tree of trees) {
        if (tree.isHarvested && tree.respawnAt !== null && now >= tree.respawnAt) {
          respawnTree(tree.id);
        }
      }
      for (const rock of rocks) {
        if (rock.isHarvested && rock.respawnAt !== null && now >= rock.respawnAt) {
          respawnRock(rock.id);
        }
      }
      for (const twig of twigs) {
        if (twig.isHarvested && twig.respawnAt !== null && now >= twig.respawnAt) {
          respawnTwig(twig.id);
        }
      }
      for (const pbl of pebbles) {
        if (pbl.isHarvested && pbl.respawnAt !== null && now >= pbl.respawnAt) {
          respawnPebble(pbl.id);
        }
      }
      // ── Potager : pousse → prête ──────────────────────────────────────────
      for (const bed of gardenBeds) {
        if (bed.state === 'growing' && bed.readyAt !== null && now >= bed.readyAt) {
          advanceGardenBed(bed.id);
        }
      }
      // ── Source d'eau : cooldown ───────────────────────────────────────────
      for (const src of waterSources) {
        if (src.isHarvested && src.respawnAt !== null && now >= src.respawnAt) {
          respawnWaterSource(src.id);
        }
      }
    }, GAME_CONFIG.RESPAWN_TICK);

    return () => clearInterval(interval);
  }, []); // Stable : getState() lit toujours l'état courant sans s'abonner
}
