// ─── Inventaire ──────────────────────────────────────────────────────────────

/**
 * Toutes les ressources du jeu.
 * Ajouter une nouvelle ressource ici suffit pour la propager dans le système.
 */
export interface ResourceInventory {
  wood: number;
  stone: number;
  plank: number;
  brick: number;
}

export type ResourceType = keyof ResourceInventory;

// ─── Noeuds récoltables ───────────────────────────────────────────────────────

/** Propriétés communes à tout objet récoltable du monde. */
export interface HarvestableNode {
  id: string;
  x: number;          // Position X absolue dans la scène (px)
  y: number;          // Position Y absolue dans la scène (px)
  isHarvested: boolean;
  respawnAt: number | null; // Timestamp ms — null = disponible
}

export interface TreeNode extends HarvestableNode {
  type: 'tree';
}

export interface RockNode extends HarvestableNode {
  type: 'rock';
}

// ─── Craft ───────────────────────────────────────────────────────────────────

export interface CraftRecipe {
  id: string;
  name: string;
  /** Ressource produite */
  output: ResourceType;
  outputAmount: number;
  /** Ressources consommées. Clé = ResourceType, valeur = quantité requise. */
  requirements: Partial<ResourceInventory>;
}
