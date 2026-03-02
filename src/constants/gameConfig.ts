import { TreeNode, RockNode } from '../types';

// ─── Timings ──────────────────────────────────────────────────────────────────

export const GAME_CONFIG = {
  /** Délai de respawn d'un arbre après récolte (ms). */
  TREE_RESPAWN_DELAY: 10_000,
  /** Délai de respawn d'un rocher après récolte (ms). */
  ROCK_RESPAWN_DELAY: 15_000,
  /** Ressource gagnée par tap sur un arbre. */
  WOOD_PER_TAP: 1,
  /** Ressource gagnée par tap sur un rocher. */
  STONE_PER_TAP: 1,
  /** Intervalle de vérification des respawns (ms). */
  RESPAWN_TICK: 1_000,
} as const;

// ─── Disposition initiale du monde ───────────────────────────────────────────
// Coordonnées pensées pour un écran ~375px large.
// La maison est positionnée dynamiquement via Dimensions dans GameScene.

type InitialNode = Pick<TreeNode, 'id' | 'x' | 'y' | 'type'>;
type InitialRock = Pick<RockNode, 'id' | 'x' | 'y' | 'type'>;

export const INITIAL_TREES: InitialNode[] = [
  { id: 'tree_1', type: 'tree', x: 30,  y: 80  },
  { id: 'tree_2', type: 'tree', x: 265, y: 60  },
  { id: 'tree_3', type: 'tree', x: 15,  y: 300 },
  { id: 'tree_4', type: 'tree', x: 290, y: 310 },
  { id: 'tree_5', type: 'tree', x: 150, y: 25  },
];

export const INITIAL_ROCKS: InitialRock[] = [
  { id: 'rock_1', type: 'rock', x: 75,  y: 210 },
  { id: 'rock_2', type: 'rock', x: 255, y: 200 },
  { id: 'rock_3', type: 'rock', x: 35,  y: 500 },
  { id: 'rock_4', type: 'rock', x: 285, y: 490 },
];
