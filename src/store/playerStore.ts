import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions } from 'react-native';
import { PlayerState, PlayerStats, ToolType } from '../types';
import { applyXpGain, consumeEnergy as domainConsumeEnergy, regenEnergy as domainRegenEnergy } from '../domain/player';

// ─── État initial ──────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');

/** Position de spawn : centre de l'écran, verticalement dans la zone active. */
const SPAWN_X = SCREEN_W / 2 - 20;
const SPAWN_Y = 320;

const INITIAL_STATS: PlayerStats = {
  energy: 100,
  maxEnergy: 100,
  /** Pixels déplacés par tick (~60 ms). À 4 px/tick → ~66 px/s. */
  speed: 4,
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
};

const INITIAL_PLAYER: PlayerState = {
  x: SPAWN_X,
  y: SPAWN_Y,
  stats: INITIAL_STATS,
};

// ─── Interface du store ────────────────────────────────────────────────────────

interface PlayerStoreState {
  player: PlayerState;
  /** Outil actuellement équipé. null = mains nues (récolte de base uniquement). */
  equippedTool: ToolType | null;
}

interface PlayerStoreActions {
  /**
   * Déplace le joueur d'un delta normalisé (-1 à 1) multiplié par la vitesse.
   * worldBounds : dimensions du monde pour le clamping.
   */
  updatePosition: (dx: number, dy: number, worldBounds: { w: number; h: number }) => void;

  /**
   * Consomme de l'énergie. Retourne false si l'énergie est insuffisante.
   * Utile pour limiter les actions de récolte quand on ajoutera la mécanique.
   */
  consumeEnergy: (amount: number) => boolean;

  /** Régénère de l'énergie (repos, craft, consommable). */
  regenEnergy: (amount: number) => void;

  /** Ajoute de l'XP et gère le level-up automatiquement. */
  addXp: (amount: number) => void;

  /**
   * Équipe ou déséquipe un outil.
   * Passer null pour revenir aux mains nues.
   * Passer le même outil déjà équipé pour le déséquiper (toggle).
   */
  equipTool: (tool: ToolType | null) => void;

  /** Réinitialise le joueur à son état de spawn. */
  resetPlayer: () => void;
}

export type PlayerStore = PlayerStoreState & PlayerStoreActions;

// ─── Store ─────────────────────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      player: INITIAL_PLAYER,
      equippedTool: null,

      updatePosition: (dx, dy, bounds) => {
        set((state) => {
          const { x, y, stats } = state.player;
          const nx = Math.max(0, Math.min(bounds.w - 40, x + dx * stats.speed));
          const ny = Math.max(0, Math.min(bounds.h - 40, y + dy * stats.speed));

          // Évite les setState inutiles si le joueur est immobile (contre un mur).
          if (nx === x && ny === y) return state;

          return { player: { ...state.player, x: nx, y: ny } };
        });
      },

      consumeEnergy: (amount) => {
        const nextStats = domainConsumeEnergy(get().player.stats, amount);
        if (!nextStats) return false;
        set((state) => ({ player: { ...state.player, stats: nextStats } }));
        return true;
      },

      regenEnergy: (amount) => {
        set((state) => ({
          player: { ...state.player, stats: domainRegenEnergy(state.player.stats, amount) },
        }));
      },

      addXp: (amount) => {
        set((state) => ({
          player: { ...state.player, stats: applyXpGain(state.player.stats, amount) },
        }));
      },

      equipTool: (tool) => {
        set((state) => ({
          // Toggle : si l'outil cliqué est déjà équipé → déséquiper
          equippedTool: state.equippedTool === tool ? null : tool,
        }));
      },

      resetPlayer: () => set({ player: INITIAL_PLAYER, equippedTool: null }),
    }),
    {
      name: 'paradise-player',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
