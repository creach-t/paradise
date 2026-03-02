// ─── Inventaire ───────────────────────────────────────────────────────────────

/**
 * Toutes les ressources du jeu.
 *
 * Progression de récolte :
 *  branch (brindille) → à la main, depuis les buissons
 *  pebble  (galet)    → à la main, depuis les tas de galets
 *  wood    (bois)     → hache en bois requise, depuis les arbres
 *  stone   (pierre)   → pioche requise, depuis les rochers
 *  plank / brick      → ressources craftées
 */
export interface ResourceInventory {
  branch: number;  // Brindille — collectée à la main sur les buissons
  pebble: number;  // Galet     — collecté à la main sur les tas de galets
  wood: number;    // Bois      — nécessite hache en bois
  stone: number;   // Pierre    — nécessite pioche en pierre
  plank: number;   // Planche   — craftée (3 bois → 2 planches)
  brick: number;   // Brique    — craftée (3 pierres → 1 brique)
}

export type ResourceType = keyof ResourceInventory;

// ─── Outils ───────────────────────────────────────────────────────────────────

/** Types d'outils disponibles. Extensible : ajouter ici pour débloquer de nouvelles récoltes. */
export type ToolType = 'wooden_axe' | 'stone_pickaxe';

/** Inventaire des outils du joueur (nombre d'exemplaires de chaque outil). */
export type ToolInventory = Partial<Record<ToolType, number>>;

// ─── Noeuds récoltables ───────────────────────────────────────────────────────

/** Propriétés communes à tout objet récoltable du monde. */
export interface HarvestableNode {
  id: string;
  x: number;           // Position X absolue dans la scène (px)
  y: number;           // Position Y absolue dans la scène (px)
  isHarvested: boolean;
  respawnAt: number | null; // Timestamp ms — null = disponible
}

/** Grand arbre — requiert une hache en bois pour être récolté. */
export interface TreeNode extends HarvestableNode {
  type: 'tree';
}

/** Gros rocher — requiert une pioche pour être récolté. */
export interface RockNode extends HarvestableNode {
  type: 'rock';
}

/** Buisson de brindilles — récolté à la main (sans outil). */
export interface TwigNode extends HarvestableNode {
  type: 'twig';
}

/** Tas de petits galets — récolté à la main (sans outil). */
export interface PebbleNode extends HarvestableNode {
  type: 'pebble_cluster';
}

// ─── Joueur ───────────────────────────────────────────────────────────────────

/**
 * Stats du joueur — toutes les métriques qui peuvent évoluer au fil du jeu.
 * Extensible : ajouter ici pour propager dans le store + UI.
 */
export interface PlayerStats {
  energy: number;        // Énergie courante (0–maxEnergy)
  maxEnergy: number;     // Énergie maximale
  speed: number;         // Vitesse de déplacement (px par tick de 60 ms)
  level: number;         // Niveau actuel
  xp: number;            // XP dans le niveau courant
  xpToNextLevel: number; // XP total requis pour level up
}

/** Position + stats du joueur dans le monde. */
export interface PlayerState {
  x: number;  // Position X absolue dans la scène (px)
  y: number;  // Position Y absolue dans la scène (px)
  stats: PlayerStats;
}

// ─── Craft ────────────────────────────────────────────────────────────────────

/**
 * Recette de fabrication d'une ressource (bois → planche, etc.)
 * Discriminant : category = 'resource'
 */
export interface ResourceRecipe {
  id: string;
  name: string;
  category: 'resource';
  output: ResourceType;
  outputAmount: number;
  requirements: Partial<ResourceInventory>;
}

/**
 * Recette de fabrication d'un outil (brindilles → hache, etc.)
 * Discriminant : category = 'tool'
 * Les outils ne se consomment pas à l'usage — ils s'équipent.
 */
export interface ToolRecipe {
  id: string;
  name: string;
  category: 'tool';
  output: ToolType;
  requirements: Partial<ResourceInventory>;
}

/** Union discriminée — utiliser recipe.category pour différencier. */
export type CraftRecipe = ResourceRecipe | ToolRecipe;
