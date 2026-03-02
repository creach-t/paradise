import { CraftRecipe } from '../types';

/**
 * Toutes les recettes de craft, triées par catégorie et complexité.
 *
 * ─── Progression du joueur ────────────────────────────────────────────────────
 *
 *  1. Ramasser brindilles (🌿 buissons, à la main)
 *  2. Ramasser galets     (⚫ tas de galets, à la main)
 *  3. Crafter 🪓 Hache    (3 brindilles) → peut couper les arbres → bois
 *  4. Crafter ⛏️  Pioche  (3 galets)     → peut miner les rochers → pierre
 *  5. Crafter 📋 Planche  (3 bois → 2 planches)
 *  6. Crafter 🧱 Brique   (3 pierres → 1 brique)
 *
 * Ajouter une recette ici la rend automatiquement visible dans l'Atelier.
 */
export const CRAFT_RECIPES: CraftRecipe[] = [
  // ── Outils (débloquer la récolte avancée) ──────────────────────────────────

  {
    id: 'wooden_axe',
    name: 'Hache en bois',
    category: 'tool',
    output: 'wooden_axe',
    requirements: { branch: 3 },
  },
  {
    id: 'stone_pickaxe',
    name: 'Pioche en pierre',
    category: 'tool',
    output: 'stone_pickaxe',
    requirements: { pebble: 3 },
  },

  // ── Matériaux (transformation) ─────────────────────────────────────────────

  {
    id: 'plank',
    name: 'Planche',
    category: 'resource',
    output: 'plank',
    outputAmount: 2,
    requirements: { wood: 3 },
  },
  {
    id: 'brick',
    name: 'Brique',
    category: 'resource',
    output: 'brick',
    outputAmount: 1,
    requirements: { stone: 3 },
  },
];
