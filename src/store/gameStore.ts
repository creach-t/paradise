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
  GardenBedNode,
  WaterSourceNode,
  ResourceType,
  CraftRecipe,
  SeedType,
} from '../types';
import {
  INITIAL_TREES,
  INITIAL_ROCKS,
  INITIAL_TWIGS,
  INITIAL_PEBBLES,
  INITIAL_GARDEN_BEDS,
  INITIAL_WATER_SOURCES,
} from '../constants/gameConfig';
import { BALANCE, GROWTH_BASE_MS, CROP_YIELD } from '../constants/balance';
import { CRAFT_RECIPES } from '../constants/craftRecipes';
import { usePlayerStore } from './playerStore';
import {
  harvestTree  as domainHarvestTree,
  harvestRock  as domainHarvestRock,
  harvestTwig  as domainHarvestTwig,
  harvestPebble as domainHarvestPebble,
  harvestWater as domainHarvestWater,
} from '../domain/harvest';
import { applyXpGain, consumeEnergy as domainConsumeEnergy } from '../domain/player';

// ─── Types du store ────────────────────────────────────────────────────────────

interface GameState {
  resources: ResourceInventory;
  /** Outils fabriqués (nombre d'exemplaires de chaque type). */
  tools: ToolInventory;
  trees: TreeNode[];
  rocks: RockNode[];
  twigs: TwigNode[];
  pebbles: PebbleNode[];
  gardenBeds: GardenBedNode[];
  waterSources: WaterSourceNode[];
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
  respawnWaterSource: (id: string) => void;

  // ── Potager (M2) ────────────────────────────────────────────────────────────
  /** Plante une graine sur un lit vide. Consomme 1 graine + énergie. */
  plantSeed: (bedId: string, seedType: SeedType) => void;
  /** Arrose un lit en cours de pousse. Consomme 1 eau + énergie. Réduit readyAt. */
  waterBed: (bedId: string) => void;
  /** Récolte une culture prête. Retourne ressources + 1 graine. */
  harvestCrop: (bedId: string) => void;
  /** Transition growing → ready déclenchée par useRespawn. */
  advanceGardenBed: (bedId: string) => void;
  /** Collecte de l'eau à la source. */
  harvestWater: (sourceId: string) => void;

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
  // M2 Farming — quelques graines de départ pour le joueur
  water: 0,
  berry: 0,
  grain: 0,
  mushroom: 0,
  berry_seed: 3,
  grain_seed: 2,
  mushroom_seed: 1,
  compost: 0,
  fertilizer: 0,
};

/** Transforme une config statique en nœud de jeu avec l'état de départ. */
const buildNodes = <T extends { id: string; x: number; y: number; type: string }>(
  configs: T[],
): Array<T & { isHarvested: false; respawnAt: null }> =>
  configs.map((c) => ({ ...c, isHarvested: false, respawnAt: null }));

/** Construit les lits de potager avec leur état initial (vides). */
const buildGardenBeds = (
  configs: Array<Pick<GardenBedNode, 'id' | 'x' | 'y' | 'type'>>,
): GardenBedNode[] =>
  configs.map((c) => ({
    ...c,
    isHarvested: false,
    respawnAt: null,
    state: 'empty' as const,
    seedType: null,
    readyAt: null,
    wateredCount: 0,
  }));

const initialState: GameState = {
  resources: initialResources,
  tools: {},
  trees:        buildNodes(INITIAL_TREES)          as TreeNode[],
  rocks:        buildNodes(INITIAL_ROCKS)          as RockNode[],
  twigs:        buildNodes(INITIAL_TWIGS)          as TwigNode[],
  pebbles:      buildNodes(INITIAL_PEBBLES)        as PebbleNode[],
  gardenBeds:   buildGardenBeds(INITIAL_GARDEN_BEDS),
  waterSources: buildNodes(INITIAL_WATER_SOURCES)  as WaterSourceNode[],
};

// ─── Helpers locaux ────────────────────────────────────────────────────────────

/**
 * Applique un delta de ressources (valeurs positives ou négatives) sur un inventaire.
 * Utilisé par les actions de récolte pour fusionner le résultat domain avec l'état courant.
 */
function applyResourceDelta(
  resources: ResourceInventory,
  delta: Partial<ResourceInventory>,
): ResourceInventory {
  const next = { ...resources };
  (Object.entries(delta) as [keyof ResourceInventory, number][])
    .forEach(([key, amount]) => { next[key] = next[key] + amount; });
  return next;
}

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
        const node = get().trees.find((t) => t.id === id);
        if (!node) return;
        const { player, equippedTool } = usePlayerStore.getState();
        const result = domainHarvestTree(node, player.stats, equippedTool);
        if (!result.ok) return;

        set((state) => ({
          resources: applyResourceDelta(state.resources, result.resourceDelta),
          trees: state.trees.map((t) =>
            t.id === id ? { ...t, isHarvested: true, respawnAt: Date.now() + result.respawnDelay } : t,
          ),
        }));
        usePlayerStore.setState((ps) => ({ player: { ...ps.player, stats: result.nextStats } }));
      },

      // ── Récolte rochers ───────────────────────────────────────────────────

      harvestRock: (id) => {
        const node = get().rocks.find((r) => r.id === id);
        if (!node) return;
        const { player, equippedTool } = usePlayerStore.getState();
        const result = domainHarvestRock(node, player.stats, equippedTool);
        if (!result.ok) return;

        set((state) => ({
          resources: applyResourceDelta(state.resources, result.resourceDelta),
          rocks: state.rocks.map((r) =>
            r.id === id ? { ...r, isHarvested: true, respawnAt: Date.now() + result.respawnDelay } : r,
          ),
        }));
        usePlayerStore.setState((ps) => ({ player: { ...ps.player, stats: result.nextStats } }));
      },

      // ── Récolte buissons (main libre) ─────────────────────────────────────

      harvestTwig: (id) => {
        const node = get().twigs.find((t) => t.id === id);
        if (!node) return;
        const { player } = usePlayerStore.getState();
        const result = domainHarvestTwig(node, player.stats);
        if (!result.ok) return;

        set((state) => ({
          resources: applyResourceDelta(state.resources, result.resourceDelta),
          twigs: state.twigs.map((t) =>
            t.id === id ? { ...t, isHarvested: true, respawnAt: Date.now() + result.respawnDelay } : t,
          ),
        }));
        usePlayerStore.setState((ps) => ({ player: { ...ps.player, stats: result.nextStats } }));
      },

      // ── Récolte galets (main libre) ───────────────────────────────────────

      harvestPebble: (id) => {
        const node = get().pebbles.find((p) => p.id === id);
        if (!node) return;
        const { player } = usePlayerStore.getState();
        const result = domainHarvestPebble(node, player.stats);
        if (!result.ok) return;

        set((state) => ({
          resources: applyResourceDelta(state.resources, result.resourceDelta),
          pebbles: state.pebbles.map((p) =>
            p.id === id ? { ...p, isHarvested: true, respawnAt: Date.now() + result.respawnDelay } : p,
          ),
        }));
        usePlayerStore.setState((ps) => ({ player: { ...ps.player, stats: result.nextStats } }));
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

      respawnWaterSource: (id) =>
        set((s) => ({ waterSources: s.waterSources.map((w) => w.id === id ? { ...w, isHarvested: false, respawnAt: null } : w) })),

      // ── Potager (M2) ──────────────────────────────────────────────────────

      plantSeed: (bedId, seedType) => {
        const bed = get().gardenBeds.find((b) => b.id === bedId);
        if (!bed || bed.state !== 'empty') return;
        if (get().resources[seedType] <= 0) return;

        const { player } = usePlayerStore.getState();
        const nextStats = domainConsumeEnergy(player.stats, BALANCE.HARVEST_ENERGY_GARDEN);
        if (!nextStats) return;

        usePlayerStore.setState((ps) => ({ player: { ...ps.player, stats: nextStats } }));
        set((state) => ({
          resources: { ...state.resources, [seedType]: state.resources[seedType] - 1 },
          gardenBeds: state.gardenBeds.map((b) =>
            b.id === bedId
              ? { ...b, state: 'growing' as const, seedType, readyAt: Date.now() + GROWTH_BASE_MS[seedType], wateredCount: 0 }
              : b,
          ),
        }));
      },

      waterBed: (bedId) => {
        const bed = get().gardenBeds.find((b) => b.id === bedId);
        if (!bed || bed.state !== 'growing' || bed.readyAt === null) return;
        if (get().resources.water <= 0) return;

        const { player } = usePlayerStore.getState();
        const nextStats = domainConsumeEnergy(player.stats, BALANCE.HARVEST_ENERGY_GARDEN);
        if (!nextStats) return;

        usePlayerStore.setState((ps) => ({ player: { ...ps.player, stats: nextStats } }));
        set((state) => ({
          resources: { ...state.resources, water: state.resources.water - 1 },
          gardenBeds: state.gardenBeds.map((b) => {
            if (b.id !== bedId || b.readyAt === null) return b;
            const newReadyAt = Math.max(Date.now() + 1_000, b.readyAt - BALANCE.WATERED_REDUCTION_MS);
            return { ...b, readyAt: newReadyAt, wateredCount: b.wateredCount + 1 };
          }),
        }));
      },

      harvestCrop: (bedId) => {
        const bed = get().gardenBeds.find((b) => b.id === bedId);
        if (!bed || bed.state !== 'ready' || bed.seedType === null) return;

        const { player } = usePlayerStore.getState();
        const statsAfterEnergy = domainConsumeEnergy(player.stats, BALANCE.HARVEST_ENERGY_GARDEN);
        if (!statsAfterEnergy) return;
        const nextStats = applyXpGain(statsAfterEnergy, BALANCE.XP_GARDEN_HARVEST);

        const { resource, amount } = CROP_YIELD[bed.seedType];
        const seedType = bed.seedType;

        set((state) => ({
          resources: {
            ...state.resources,
            [resource]: state.resources[resource] + amount,
            [seedType]: state.resources[seedType] + 1, // retour 1 graine
          },
          gardenBeds: state.gardenBeds.map((b) =>
            b.id === bedId
              ? { ...b, state: 'empty' as const, seedType: null, readyAt: null, wateredCount: 0 }
              : b,
          ),
        }));
        usePlayerStore.setState((ps) => ({ player: { ...ps.player, stats: nextStats } }));
      },

      advanceGardenBed: (bedId) =>
        set((s) => ({
          gardenBeds: s.gardenBeds.map((b) =>
            b.id === bedId && b.state === 'growing' ? { ...b, state: 'ready' as const } : b,
          ),
        })),

      harvestWater: (sourceId) => {
        const node = get().waterSources.find((w) => w.id === sourceId);
        if (!node) return;
        const { player } = usePlayerStore.getState();
        const result = domainHarvestWater(node, player.stats);
        if (!result.ok) return;

        set((state) => ({
          resources: applyResourceDelta(state.resources, result.resourceDelta),
          waterSources: state.waterSources.map((w) =>
            w.id === sourceId ? { ...w, isHarvested: true, respawnAt: Date.now() + result.respawnDelay } : w,
          ),
        }));
        usePlayerStore.setState((ps) => ({ player: { ...ps.player, stats: result.nextStats } }));
      },

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
          trees:        mergeNodes(ps.trees,        currentState.trees),
          rocks:        mergeNodes(ps.rocks,        currentState.rocks),
          twigs:        mergeNodes(ps.twigs,        currentState.twigs),
          pebbles:      mergeNodes(ps.pebbles,      currentState.pebbles),
          gardenBeds:   mergeNodes(ps.gardenBeds,   currentState.gardenBeds),
          waterSources: mergeNodes(ps.waterSources, currentState.waterSources),
        };
      },
    },
  ),
);
