import { TreeNode, RockNode, TwigNode, PebbleNode, GardenBedNode, WaterSourceNode } from '../types';

// ─── Dimensions du monde ──────────────────────────────────────────────────────

/** Largeur totale du monde en pixels. */
export const WORLD_W = 800;
/** Hauteur totale du monde en pixels. */
export const WORLD_H = 1400;

// ─── Disposition initiale du monde ────────────────────────────────────────────
//
// Monde 800 × 1400 px. Maison à (155, 370).
//
// Espacement garanti (aucun chevauchement) :
//   Tree  76 px → distance min entre arbres ≥ 84 px
//   Rock  72 px → distance min entre rochers ≥ 80 px
//   Twig  62 px → distance min entre buissons ≥ 68 px
//   Pebble 68 px → distance min entre galets ≥ 74 px
//   Cross-type : distance min ≥ (sizeA + sizeB) / 2
//
// Zones sans chevauchement :
//   NW   Forêt  x[12-171]  y[15-176]  → arbres seulement
//   Lisière     x[185-247] y[70-308]  → buissons seulement
//   CN   Rochers x[255-412] y[60-222] → rochers + galets (intercalés)
//   NE   Bosquet x[605-771] y[15-91]  → arbres seulement
//   EFalaises x[555-717] y[60-230]    → rochers seulement
//   ECentre x[495-676] y[300-376]     → arbres seulement
//   SW   Forêt  x[15-176]  y[515-686] → arbres seulement
//   SE   Rochers x[570-732] y[580-657] → rochers seulement
//   Deep Bosquet x[255-431] y[835-1001] → arbres seulement
//   Mines x[500-667] y[935-1017]      → rochers seulement
//   Oubliée x[85-361] y[1130-1216]    → arbres seulement
//
// 'tree_*' → tree.png / tree_cut.png
// 'trio_*' → trio-tree.png / trio-tree_cut.png

type InitialTree        = Pick<TreeNode,        'id' | 'x' | 'y' | 'type'>;
type InitialRock        = Pick<RockNode,        'id' | 'x' | 'y' | 'type'>;
type InitialTwig        = Pick<TwigNode,        'id' | 'x' | 'y' | 'type'>;
type InitialPebble      = Pick<PebbleNode,      'id' | 'x' | 'y' | 'type'>;
type InitialGardenBed   = Pick<GardenBedNode,   'id' | 'x' | 'y' | 'type'>;
type InitialWaterSource = Pick<WaterSourceNode, 'id' | 'x' | 'y' | 'type'>;

// ─── Arbres — distance min entre arbres : 84 px ───────────────────────────────

export const INITIAL_TREES: InitialTree[] = [

  // ── Forêt Nord-Ouest — grille 2×2, pas de 83 px ──────────────────────────
  { id: 'trio_1', type: 'tree', x: 12,  y: 15  }, // box [12-88,  15-91]
  { id: 'tree_1', type: 'tree', x: 95,  y: 15  }, // box [95-171, 15-91]  | dist trio_1→ 83 ✓
  { id: 'trio_2', type: 'tree', x: 12,  y: 100 }, // box [12-88,  100-176] | dist trio_1→ 85 ✓
  { id: 'tree_2', type: 'tree', x: 95,  y: 100 }, // box [95-171, 100-176] | dist tous → 83-85 ✓

  // ── Bosquet Nord-Est ──────────────────────────────────────────────────────
  { id: 'tree_3', type: 'tree', x: 605, y: 15  }, // box [605-681, 15-91]
  { id: 'trio_3', type: 'tree', x: 695, y: 15  }, // box [695-771, 15-91]  | dist → 90 ✓

  // ── Lisière Est (deux arbres isolés près des falaises) ───────────────────
  { id: 'trio_4', type: 'tree', x: 495, y: 300 }, // box [495-571, 300-376]
  { id: 'tree_4', type: 'tree', x: 600, y: 300 }, // box [600-676, 300-376] | dist → 105 ✓

  // ── Forêt Sud-Ouest — grille 2×2, pas de 85-90 px ────────────────────────
  { id: 'tree_5',  type: 'tree', x: 15,  y: 515 }, // box [15-91,  515-591]
  { id: 'trio_5',  type: 'tree', x: 100, y: 515 }, // box [100-176, 515-591] | dist → 85 ✓
  { id: 'tree_6',  type: 'tree', x: 15,  y: 605 }, // box [15-91,  605-681] | dist tree_5→ 90 ✓
  { id: 'trio_6',  type: 'tree', x: 100, y: 610 }, // box [100-176, 610-686] | dist trio_5→ 95 ✓

  // ── Bosquet mystérieux — triangle, pas de 100 px ─────────────────────────
  { id: 'trio_7', type: 'tree', x: 255, y: 835 }, // box [255-331, 835-911]
  { id: 'tree_7', type: 'tree', x: 355, y: 835 }, // box [355-431, 835-911] | dist → 100 ✓
  { id: 'trio_8', type: 'tree', x: 305, y: 925 }, // box [305-381, 925-1001]| dist trio_7→ 103, tree_7→ 103 ✓

  // ── Forêt oubliée — ligne de 3 ───────────────────────────────────────────
  { id: 'tree_8', type: 'tree', x: 85,  y: 1130 }, // box [85-161,  1130-1206]
  { id: 'trio_9', type: 'tree', x: 185, y: 1135 }, // box [185-261, 1135-1211]| dist → 100 ✓
  { id: 'tree_9', type: 'tree', x: 285, y: 1140 }, // box [285-361, 1140-1216]| dist → 100 ✓
];

// ─── Rochers — distance min entre rochers : 80 px ────────────────────────────

export const INITIAL_ROCKS: InitialRock[] = [

  // ── Centre-Nord — grille 2×2, pas de 85 px ───────────────────────────────
  { id: 'rock_1', type: 'rock', x: 255, y: 60  }, // box [255-327, 60-132]
  { id: 'rock_2', type: 'rock', x: 340, y: 60  }, // box [340-412, 60-132]  | dist → 85 ✓
  { id: 'rock_3', type: 'rock', x: 255, y: 150 }, // box [255-327, 150-222] | dist rock_1→ 90 ✓
  { id: 'rock_4', type: 'rock', x: 340, y: 150 }, // box [340-412, 150-222] | dist tous → 85-90 ✓

  // ── Falaises Est — grille 2×2 ─────────────────────────────────────────────
  { id: 'rock_5', type: 'rock', x: 555, y: 60  }, // box [555-627, 60-132]
  { id: 'rock_6', type: 'rock', x: 645, y: 60  }, // box [645-717, 60-132]  | dist → 90 ✓
  { id: 'rock_7', type: 'rock', x: 555, y: 155 }, // box [555-627, 155-227] | dist rock_5→ 95 ✓
  { id: 'rock_8', type: 'rock', x: 645, y: 155 }, // box [645-717, 155-227] | dist tous → 90-95 ✓

  // ── Sud-Est — paire ───────────────────────────────────────────────────────
  { id: 'rock_9',  type: 'rock', x: 570, y: 580 }, // box [570-642, 580-652]
  { id: 'rock_10', type: 'rock', x: 660, y: 580 }, // box [660-732, 580-652] | dist → 90 ✓

  // ── Mines profondes — paire ───────────────────────────────────────────────
  { id: 'rock_11', type: 'rock', x: 500, y: 935 }, // box [500-572, 935-1007]
  { id: 'rock_12', type: 'rock', x: 595, y: 935 }, // box [595-667, 935-1007]| dist → 95 ✓
];

// ─── Buissons — distance min entre buissons : 68 px ──────────────────────────
// Zone dédiée x[185-247] — aucun arbre dans cette bande (arbres NW finissent à x=171)

export const INITIAL_TWIGS: InitialTwig[] = [
  { id: 'twig_1', type: 'twig', x: 185, y: 70  }, // box [185-247, 70-132]
  { id: 'twig_2', type: 'twig', x: 185, y: 155 }, // box [185-247, 155-217]| dist twig_1→ 85 ✓
  { id: 'twig_3', type: 'twig', x: 185, y: 240 }, // box [185-247, 240-302]| dist twig_2→ 85 ✓
  { id: 'twig_4', type: 'twig', x: 385, y: 285 }, // box [385-447, 285-347]| isolé ✓
  { id: 'twig_5', type: 'twig', x: 172, y: 730 }, // box [172-234, 730-792]| isolé ✓
  { id: 'twig_6', type: 'twig', x: 215, y: 918 }, // box [215-277, 918-980]| dist twig_5→ sqrt(43²+188²)=193 ✓
];

// ─── Galets — distance min entre galets : 74 px ───────────────────────────────
// Intercalés entre les rochers CN (x[255-412]) — décalés vers la droite

export const INITIAL_PEBBLES: InitialPebble[] = [
  { id: 'pbl_1', type: 'pebble_cluster', x: 265, y: 238 }, // box [265-333, 238-306]| sous rock_3, gap Y=16 ✓
  { id: 'pbl_2', type: 'pebble_cluster', x: 350, y: 245 }, // box [350-418, 245-313]| dist pbl_1→ 86 ✓
  { id: 'pbl_3', type: 'pebble_cluster', x: 435, y: 175 }, // box [435-503, 175-243]| isolé à l'est des rochers CN ✓
  { id: 'pbl_4', type: 'pebble_cluster', x: 488, y: 398 }, // box [488-556, 398-466]| isolé ✓
];

// ─── Lits de potager (M2) ─────────────────────────────────────────────────────

export const INITIAL_GARDEN_BEDS: InitialGardenBed[] = [
  { id: 'gbed_1', type: 'gardenBed', x: 255, y: 355 },
  { id: 'gbed_2', type: 'gardenBed', x: 309, y: 355 },
  { id: 'gbed_3', type: 'gardenBed', x: 255, y: 409 },
  { id: 'gbed_4', type: 'gardenBed', x: 309, y: 409 },
];

// ─── Source d'eau (M2) ────────────────────────────────────────────────────────

export const INITIAL_WATER_SOURCES: InitialWaterSource[] = [
  { id: 'wsrc_1', type: 'waterSource', x: 490, y: 470 },
];
