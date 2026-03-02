import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '../constants/gameConfig';

/**
 * Hook de gestion des respawns.
 * Tick à intervalle régulier et déclenche le respawn de tout nœud
 * dont le timer est expiré. À monter une seule fois dans GameScene.
 */
export function useRespawn(): void {
  const trees = useGameStore((s) => s.trees);
  const rocks = useGameStore((s) => s.rocks);
  const respawnTree = useGameStore((s) => s.respawnTree);
  const respawnRock = useGameStore((s) => s.respawnRock);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      trees.forEach((tree) => {
        if (tree.isHarvested && tree.respawnAt !== null && now >= tree.respawnAt) {
          respawnTree(tree.id);
        }
      });

      rocks.forEach((rock) => {
        if (rock.isHarvested && rock.respawnAt !== null && now >= rock.respawnAt) {
          respawnRock(rock.id);
        }
      });
    }, GAME_CONFIG.RESPAWN_TICK);

    return () => clearInterval(interval);
  }, [trees, rocks, respawnTree, respawnRock]);
}
