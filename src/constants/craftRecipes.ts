import { CraftRecipe } from '../types';

/**
 * Liste de toutes les recettes de craft disponibles.
 * Ajouter une recette ici la rend automatiquement visible dans l'atelier.
 */
export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'plank',
    name: 'Planche',
    output: 'plank',
    outputAmount: 1,
    requirements: { wood: 5 },
  },
  {
    id: 'brick',
    name: 'Brique',
    output: 'brick',
    outputAmount: 1,
    requirements: { stone: 3 },
  },
];
