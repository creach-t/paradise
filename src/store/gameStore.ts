import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ResourceInventory, TreeNode, RockNode, ResourceType } from '../types';
import { INITIAL_TREES, INITIAL_ROCKS, GAME_CONFIG } from '../constants/gameConfig';
import { CRAFT_RECIPES } from '../constants/craftRecipes';

// ─── Types du store ───────────────────────────────────────────────────────────

interface GameState {
  resources: ResourceInventory;
  trees: TreeNode[];
  rocks: RockNode[];
}

interface GameActions {
  /** Récolte un arbre : ajoute du bois, marque l'arbre comme récolté. */
  harvestTree: (id: string) => void;
  /** Récolte un rocher : ajoute de la pierre, marque le rocher comme récolté. */
  harvestRock: (id: string) => void;
  /** Fait réapparaître un arbre (appelé par useRespawn). */
  respawnTree: (id: string) => void;
  /** Fait réapparaître un rocher (appelé par useRespawn). */
  respawnRock: (id: string) => void;
  /**
   * Tente de crafter une recette.
   * @returns true si succès, false si ressources insuffisantes.
   */
  craft: (recipeId: string) => boolean;
  /** Utilitaire : ajoute directement une quantité à une ressource. */
  addResource: (resource: ResourceType, amount: number) => void;
  /** Réinitialise complètement la partie. */
  resetGame: () => void;
}

export type GameStore = GameState & GameActions;

// ─── Valeurs initiales ────────────────────────────────────────────────────────

const initialResources: ResourceInventory = {
  wood: 0,
  stone: 0,
  plank: 0,
  brick: 0,
};

/** Transforme une config statique en nœud de jeu avec l'état initial. */
const buildNodes = <T extends { id: string; x: number; y: number; type: string }>(
  configs: T[],
): Array<T & { isHarvested: false; respawnAt: null }> =>
  configs.map((c) => ({ ...c, isHarvested: false, respawnAt: null }));

const initialState: GameState = {
  resources: initialResources,
  trees: buildNodes(INITIAL_TREES) as TreeNode[],
  rocks: buildNodes(INITIAL_ROCKS) as RockNode[],
};

// ─── Store Zustand ────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      harvestTree: (id) => {
        const tree = get().trees.find((t) => t.id === id);
        if (!tree || tree.isHarvested) return;

        set((state) => ({
          resources: {
            ...state.resources,
            wood: state.resources.wood + GAME_CONFIG.WOOD_PER_TAP,
          },
          trees: state.trees.map((t) =>
            t.id === id
              ? { ...t, isHarvested: true, respawnAt: Date.now() + GAME_CONFIG.TREE_RESPAWN_DELAY }
              : t,
          ),
        }));
      },

      harvestRock: (id) => {
        const rock = get().rocks.find((r) => r.id === id);
        if (!rock || rock.isHarvested) return;

        set((state) => ({
          resources: {
            ...state.resources,
            stone: state.resources.stone + GAME_CONFIG.STONE_PER_TAP,
          },
          rocks: state.rocks.map((r) =>
            r.id === id
              ? { ...r, isHarvested: true, respawnAt: Date.now() + GAME_CONFIG.ROCK_RESPAWN_DELAY }
              : r,
          ),
        }));
      },

      respawnTree: (id) => {
        set((state) => ({
          trees: state.trees.map((t) =>
            t.id === id ? { ...t, isHarvested: false, respawnAt: null } : t,
          ),
        }));
      },

      respawnRock: (id) => {
        set((state) => ({
          rocks: state.rocks.map((r) =>
            r.id === id ? { ...r, isHarvested: false, respawnAt: null } : r,
          ),
        }));
      },

      craft: (recipeId) => {
        const recipe = CRAFT_RECIPES.find((r) => r.id === recipeId);
        if (!recipe) return false;

        const { resources } = get();

        // Vérifie que chaque ressource requise est disponible en quantité suffisante.
        const canCraft = (Object.entries(recipe.requirements) as [keyof ResourceInventory, number][])
          .every(([resource, amount]) => resources[resource] >= amount);

        if (!canCraft) return false;

        set((state) => {
          const next = { ...state.resources };

          // Consomme les ressources requises.
          (Object.entries(recipe.requirements) as [keyof ResourceInventory, number][])
            .forEach(([resource, amount]) => {
              next[resource] -= amount;
            });

          // Ajoute la production.
          next[recipe.output] += recipe.outputAmount;

          return { resources: next };
        });

        return true;
      },

      addResource: (resource, amount) => {
        set((state) => ({
          resources: {
            ...state.resources,
            [resource]: state.resources[resource] + amount,
          },
        }));
      },

      resetGame: () => set(initialState),
    }),
    {
      name: 'paradise-save',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
