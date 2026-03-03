import { TreeNode, RockNode, TwigNode, PebbleNode } from '../types';

// ─── Dimensions du monde ──────────────────────────────────────────────────────

/** Largeur totale du monde en pixels. */
export const WORLD_W = 800;
/** Hauteur totale du monde en pixels. */
export const WORLD_H = 1400;

// ─── Cycle jour/nuit ──────────────────────────────────────────────────────────

/** Durée d'un cycle complet jour/nuit (ms). 5 min = 300 000 ms. */
export const DAY_CYCLE_MS = 5 * 60 * 1000;
/** Opacité max de l'overlay nocturne (0 = invisible, 1 = noir total). */
export const NIGHT_MAX_OPACITY = 0.62;

// ─── Timings ──────────────────────────────────────────────────────────────────

export const GAME_CONFIG = {
  /** Délai de respawn d'un arbre (ms). */
  TREE_RESPAWN_DELAY: 12_000,
  /** Délai de respawn d'un rocher (ms). */
  ROCK_RESPAWN_DELAY: 18_000,
  /** Délai de respawn d'un buisson de brindilles (ms). */
  TWIG_RESPAWN_DELAY: 6_000,
  /** Délai de respawn d'un tas de galets (ms). */
  PEBBLE_RESPAWN_DELAY: 8_000,

  /** Bois récolté par coup de hache. */
  WOOD_PER_TAP: 2,
  /** Pierre récoltée par coup de pioche. */
  STONE_PER_TAP: 2,
  /** Brindilles récoltées à la main par buisson. */
  BRANCH_PER_TAP: 1,
  /** Galets récoltés à la main par tas. */
  PEBBLE_PER_TAP: 1,

  /** Intervalle de vérification des respawns (ms). */
  RESPAWN_TICK: 1_000,

  // ── Coûts en énergie ──────────────────────────────────────────────────────
  /** Énergie consommée pour récolter à la main (buissons, galets). */
  HARVEST_ENERGY_HAND: 1,
  /** Énergie consommée pour récolter avec un outil (arbres, rochers). */
  HARVEST_ENERGY_TOOL: 2,

  // ── XP par récolte ────────────────────────────────────────────────────────
  /** XP gagnée en récoltant un buisson de brindilles. */
  XP_TWIG: 5,
  /** XP gagnée en récoltant un tas de galets. */
  XP_PEBBLE: 5,
  /** XP gagnée en coupant un arbre. */
  XP_TREE: 15,
  /** XP gagnée en minant un rocher. */
  XP_ROCK: 15,
} as const;

// ─── Disposition initiale du monde ────────────────────────────────────────────
//
// Coordonnées pensées pour un écran ~375px large.
// La maison est positionnée dynamiquement dans GameScene.
//
// ┌──────────────────────────────────────────────────────────────┐
// │ 🌲🌲🌲  forêt dense          🌿🌿  buissons  ⚫⚫ galets   │
// │ 🌲🌲🌲  (haut-gauche)        🌿             ⚫  🪨🪨 rochers│
// │ 🌲🌲🌲                                       🪨🪨          │
// │                        🏠 maison                            │
// └──────────────────────────────────────────────────────────────┘

type InitialTree   = Pick<TreeNode,   'id' | 'x' | 'y' | 'type'>;
type InitialRock   = Pick<RockNode,   'id' | 'x' | 'y' | 'type'>;
type InitialTwig   = Pick<TwigNode,   'id' | 'x' | 'y' | 'type'>;
type InitialPebble = Pick<PebbleNode, 'id' | 'x' | 'y' | 'type'>;

// ─── Forêt dense (cluster haut-gauche) ────────────────────────────────────────
// Arbres espacés de ~38px centre-à-centre : chevauchement visuel intentionnel.
// Sprite 52×52 px — la forêt occupe ~150px × 180px.

export const INITIAL_TREES: InitialTree[] = [
  // Rangée 0 (y ≈ 15)
  { id: 'tree_1',  type: 'tree', x: 8,   y: 15  },
  { id: 'tree_2',  type: 'tree', x: 48,  y: 8   },
  { id: 'tree_3',  type: 'tree', x: 88,  y: 20  },
  // Rangée 1 (y ≈ 55)
  { id: 'tree_4',  type: 'tree', x: 18,  y: 55  },
  { id: 'tree_5',  type: 'tree', x: 60,  y: 48  },
  { id: 'tree_6',  type: 'tree', x: 100, y: 60  },
  // Rangée 2 (y ≈ 100)
  { id: 'tree_7',  type: 'tree', x: 10,  y: 100 },
  { id: 'tree_8',  type: 'tree', x: 52,  y: 95  },
  { id: 'tree_9',  type: 'tree', x: 92,  y: 108 },
  // Lisière (arbres isolés)
  { id: 'tree_10', type: 'tree', x: 34,  y: 148 },
  { id: 'tree_11', type: 'tree', x: 118, y: 40  },

  // ─── Forêt du sud (cluster bas-gauche) ────────────────────────────────────
  { id: 'tree_12', type: 'tree', x: 30,  y: 540 },
  { id: 'tree_13', type: 'tree', x: 70,  y: 520 },
  { id: 'tree_14', type: 'tree', x: 110, y: 555 },
  { id: 'tree_15', type: 'tree', x: 50,  y: 600 },
  { id: 'tree_16', type: 'tree', x: 90,  y: 585 },
  { id: 'tree_17', type: 'tree', x: 130, y: 615 },

  // ─── Bosquet profond (exploration lointaine) ───────────────────────────────
  { id: 'tree_18', type: 'tree', x: 340, y: 880 },
  { id: 'tree_19', type: 'tree', x: 385, y: 855 },
  { id: 'tree_20', type: 'tree', x: 425, y: 895 },
  { id: 'tree_21', type: 'tree', x: 360, y: 940 },
  { id: 'tree_22', type: 'tree', x: 400, y: 965 },
];

// ─── Rochers (cluster haut-droit) ─────────────────────────────────────────────

export const INITIAL_ROCKS: InitialRock[] = [
  { id: 'rock_1', type: 'rock', x: 270, y: 65  },
  { id: 'rock_2', type: 'rock', x: 308, y: 95  },
  { id: 'rock_3', type: 'rock', x: 260, y: 128 },
  { id: 'rock_4', type: 'rock', x: 302, y: 152 },
  { id: 'rock_5', type: 'rock', x: 273, y: 182 },

  // ─── Rochers de l'est (monde étendu) ──────────────────────────────────────
  { id: 'rock_6',  type: 'rock', x: 560, y: 130 },
  { id: 'rock_7',  type: 'rock', x: 600, y: 165 },
  { id: 'rock_8',  type: 'rock', x: 640, y: 105 },
  { id: 'rock_9',  type: 'rock', x: 580, y: 210 },

  // ─── Rochers profonds (exploration lointaine) ─────────────────────────────
  { id: 'rock_10', type: 'rock', x: 580, y: 790 },
  { id: 'rock_11', type: 'rock', x: 625, y: 830 },
  { id: 'rock_12', type: 'rock', x: 600, y: 875 },
];

// ─── Buissons de brindilles (zone centrale) ───────────────────────────────────
// Récoltés à la main — placés entre la forêt et la maison.

export const INITIAL_TWIGS: InitialTwig[] = [
  { id: 'twig_1', type: 'twig', x: 148, y: 75  },
  { id: 'twig_2', type: 'twig', x: 175, y: 145 },
  { id: 'twig_3', type: 'twig', x: 138, y: 208 },
  { id: 'twig_4', type: 'twig', x: 192, y: 65  },

  // ─── Buissons du sud (monde étendu) ───────────────────────────────────────
  { id: 'twig_5', type: 'twig', x: 255, y: 475 },
  { id: 'twig_6', type: 'twig', x: 320, y: 530 },
  { id: 'twig_7', type: 'twig', x: 185, y: 570 },
  { id: 'twig_8', type: 'twig', x: 380, y: 445 },
];

// ─── Tas de petits galets (zone centrale-droite) ──────────────────────────────
// Récoltés à la main — zone entre les rochers et la maison.

export const INITIAL_PEBBLES: InitialPebble[] = [
  { id: 'pbl_1', type: 'pebble_cluster', x: 226, y: 82  },
  { id: 'pbl_2', type: 'pebble_cluster', x: 240, y: 162 },
  { id: 'pbl_3', type: 'pebble_cluster', x: 218, y: 238 },

  // ─── Galets du sud-est (monde étendu) ─────────────────────────────────────
  { id: 'pbl_4', type: 'pebble_cluster', x: 455, y: 380 },
  { id: 'pbl_5', type: 'pebble_cluster', x: 500, y: 460 },
  { id: 'pbl_6', type: 'pebble_cluster', x: 540, y: 340 },
];
