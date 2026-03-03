import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ResourceInventory,
  ToolInventory,
  TreeNode,
  RockNode,
  TwigNode,
  PebbleNode,
  ResourceType,
  CraftRecipe,
} from '../types';
import {
  INITIAL_TREES,
  INITIAL_ROCKS,
  INITIAL_TWIGS,
  INITIAL_PEBBLES,
  GAME_CONFIG,
} from '../constants/gameConfig';
import { CRAFT_RECIPES } from '../constants/craftRecipes';

// ─── Types du store ────────────────────────────────────────────────────────────

interface GameState {
  resources: ResourceInventory;
  /** Outils fabriqués (nombre d'exemplaires de chaque type). */
  tools: ToolInventory;
  trees: TreeNode[];
  rocks: RockNode[];
  twigs: TwigNode[];
  pebbles: PebbleNode[];
}

interface GameActions {
  /** Récolte un arbre — requiert la hache en bois équipée. Coûte HARVEST_ENERGY_TOOL. */
  harvestTree: (id: string) => void;
  /** Récolte un rocher — requiert la pioche en pierre équipée. Coûte HARVEST_ENERGY_TOOL. */
  harvestRock: (id: string) => void;
  /** Récolte un buisson de brindilles (à la main). Coûte HARVEST_ENERGY_HAND. */
  harvestTwig: (id: string) => void;
  /** Récolte un tas de galets (à la main). Coûte HARVEST_ENERGY_HAND. */
  harvestPebble: (id: string) => void;

  respawnTree: (id: string) => void;
  respawnRock: (id: string) => void;
  respawnTwig: (id: string) => void;
  respawnPebble: (id: string) => void;

  /**
   * Tente de crafter une recette (outil ou ressource).
   * @returns 'success' | 'no_resources' | 'unknown'
   */
  craft: (recipeId: string) => 'success' | 'no_resources' | 'unknown';

  addResource: (resource: ResourceType, amount: number) => void;
  resetGame: () => void;
}

export type GameStore = GameState & GameActions;

// ─── État initial ──────────────────────────────────────────────────────────────

const initialResources: ResourceInventory = {
  branch: 0,
  pebble: 0,
  wood: 0,
  stone: 0,
  plank: 0,
  brick: 0,
};

/** Transforme une config statique en nœud de jeu avec l'état de départ. */
const buildNodes = <T extends { id: string; x: number; y: number; type: string }>(
  configs: T[],
): Array<T & { isHarvested: false; respawnAt: null }> =>
  configs.map((c) => ({ ...c, isHarvested: false, respawnAt: null }));

const initialState: GameState = {
  resources: initialResources,
  tools: {},
  trees:   buildNodes(INITIAL_TREES)   as TreeNode[],
  rocks:   buildNodes(INITIAL_ROCKS)   as RockNode[],
  twigs:   buildNodes(INITIAL_TWIGS)   as TwigNode[],
  pebbles: buildNodes(INITIAL_PEBBLES) as PebbleNode[],
};

// ─── Helpers inter-stores ──────────────────────────────────────────────────────
//
// Require dynamique pour éviter le cycle d'import circulaire gameStore ↔ playerStore.

/**
 * Lit l'outil équipé depuis playerStore via getState().
 */
function getEquippedTool(): string | null {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { usePlayerStore } = require('./playerStore') as typeof import('./playerStore');
  return usePlayerStore.getState().equippedTool;
}

/**
 * Consomme de l'énergie du joueur.
 * @returns false si l'énergie est insuffisante (bloquer la récolte).
 */
function consumePlayerEnergy(amount: number): boolean {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { usePlayerStore } = require('./playerStore') as typeof import('./playerStore');
  return usePlayerStore.getState().consumeEnergy(amount);
}

/**
 * Ajoute de l'XP au joueur (gère le level-up automatiquement).
 */
function addPlayerXp(amount: number): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { usePlayerStore } = require('./playerStore') as typeof import('./playerStore');
  usePlayerStore.getState().addXp(amount);
}

// ─── Helpers craft ─────────────────────────────────────────────────────────────

function canAfford(
  resources: ResourceInventory,
  requirements: Partial<ResourceInventory>,
): boolean {
  return (Object.entries(requirements) as [keyof ResourceInventory, number][])
    .every(([res, amt]) => resources[res] >= amt);
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ── Récolte arbres ────────────────────────────────────────────────────

      harvestTree: (id) => {
        const tree = get().trees.find((t) => t.id === id);
        if (!tree || tree.isHarvested) return;
        if (getEquippedTool() !== 'wooden_axe') return;           // outil requis
        if (!consumePlayerEnergy(GAME_CONFIG.HARVEST_ENERGY_TOOL)) return; // énergie insuffisante

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
        addPlayerXp(GAME_CONFIG.XP_TREE);
      },

      // ── Récolte rochers ───────────────────────────────────────────────────

      harvestRock: (id) => {
        const rock = get().rocks.find((r) => r.id === id);
        if (!rock || rock.isHarvested) return;
        if (getEquippedTool() !== 'stone_pickaxe') return;        // outil requis
        if (!consumePlayerEnergy(GAME_CONFIG.HARVEST_ENERGY_TOOL)) return; // énergie insuffisante

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
        addPlayerXp(GAME_CONFIG.XP_ROCK);
      },

      // ── Récolte buissons (main libre) ─────────────────────────────────────

      harvestTwig: (id) => {
        const twig = get().twigs.find((t) => t.id === id);
        if (!twig || twig.isHarvested) return;
        if (!consumePlayerEnergy(GAME_CONFIG.HARVEST_ENERGY_HAND)) return; // énergie insuffisante

        set((state) => ({
          resources: {
            ...state.resources,
            branch: state.resources.branch + GAME_CONFIG.BRANCH_PER_TAP,
          },
          twigs: state.twigs.map((t) =>
            t.id === id
              ? { ...t, isHarvested: true, respawnAt: Date.now() + GAME_CONFIG.TWIG_RESPAWN_DELAY }
              : t,
          ),
        }));
        addPlayerXp(GAME_CONFIG.XP_TWIG);
      },

      // ── Récolte galets (main libre) ───────────────────────────────────────

      harvestPebble: (id) => {
        const pbl = get().pebbles.find((p) => p.id === id);
        if (!pbl || pbl.isHarvested) return;
        if (!consumePlayerEnergy(GAME_CONFIG.HARVEST_ENERGY_HAND)) return; // énergie insuffisante

        set((state) => ({
          resources: {
            ...state.resources,
            pebble: state.resources.pebble + GAME_CONFIG.PEBBLE_PER_TAP,
          },
          pebbles: state.pebbles.map((p) =>
            p.id === id
              ? { ...p, isHarvested: true, respawnAt: Date.now() + GAME_CONFIG.PEBBLE_RESPAWN_DELAY }
              : p,
          ),
        }));
        addPlayerXp(GAME_CONFIG.XP_PEBBLE);
      },

      // ── Respawns ──────────────────────────────────────────────────────────

      respawnTree: (id) =>
        set((s) => ({ trees: s.trees.map((t) => t.id === id ? { ...t, isHarvested: false, respawnAt: null } : t) })),

      respawnRock: (id) =>
        set((s) => ({ rocks: s.rocks.map((r) => r.id === id ? { ...r, isHarvested: false, respawnAt: null } : r) })),

      respawnTwig: (id) =>
        set((s) => ({ twigs: s.twigs.map((t) => t.id === id ? { ...t, isHarvested: false, respawnAt: null } : t) })),

      respawnPebble: (id) =>
        set((s) => ({ pebbles: s.pebbles.map((p) => p.id === id ? { ...p, isHarvested: false, respawnAt: null } : p) })),

      // ── Craft ─────────────────────────────────────────────────────────────

      craft: (recipeId) => {
        const recipe = CRAFT_RECIPES.find((r) => r.id === recipeId) as CraftRecipe | undefined;
        if (!recipe) return 'unknown';

        const { resources } = get();
        if (!canAfford(resources, recipe.requirements)) return 'no_resources';

        set((state) => {
          const nextResources = { ...state.resources };
          // Consomme les ingrédients.
          (Object.entries(recipe.requirements) as [keyof ResourceInventory, number][])
            .forEach(([res, amt]) => { nextResources[res] -= amt; });

          if (recipe.category === 'tool') {
            // Ajoute l'outil à l'inventaire d'outils.
            const nextTools = { ...state.tools };
            nextTools[recipe.output] = (nextTools[recipe.output] ?? 0) + 1;
            return { resources: nextResources, tools: nextTools };
          } else {
            nextResources[recipe.output] += recipe.outputAmount;
            return { resources: nextResources };
          }
        });

        return 'success';
      },

      // ── Utilitaires ───────────────────────────────────────────────────────

      addResource: (resource, amount) =>
        set((state) => ({
          resources: {
            ...state.resources,
            [resource]: state.resources[resource] + amount,
          },
        })),

      resetGame: () => set(initialState),
    }),
    {
      name: 'paradise-save',
      storage: createJSONStorage(() => AsyncStorage),

      // ── Merge personnalisé ────────────────────────────────────────────────
      // 1. Resources : deep merge → les nouvelles clés tombent à 0 si absentes.
      // 2. Nœuds (trees, rocks, twigs, pebbles) : on garde l'état des nœuds
      //    persistés (harvest, respawn) ET on ajoute les nouveaux nœuds issus
      //    de la config (ceux dont l'id est absent de la sauvegarde).
      merge: (persistedState: unknown, currentState: GameStore): GameStore => {
        const ps = persistedState as Partial<GameState>;

        function mergeNodes<T extends { id: string }>(
          persisted: T[] | undefined,
          current: T[],
        ): T[] {
          if (!persisted || persisted.length === 0) return current;
          const knownIds = new Set(persisted.map((n) => n.id));
          const newNodes = current.filter((n) => !knownIds.has(n.id));
          return [...persisted, ...newNodes];
        }

        return {
          ...currentState,
          ...ps,
          resources: {
            ...currentState.resources,
            ...(ps.resources ?? {}),
          },
          trees:   mergeNodes(ps.trees,   currentState.trees),
          rocks:   mergeNodes(ps.rocks,   currentState.rocks),
          twigs:   mergeNodes(ps.twigs,   currentState.twigs),
          pebbles: mergeNodes(ps.pebbles, currentState.pebbles),
        };
      },
    },
  ),
);
