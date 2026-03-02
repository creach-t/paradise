import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '../../store/gameStore';
import { usePlayerStore } from '../../store/playerStore';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { ResourceInventory, ToolType } from '../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;

// Ressources affichées dans la barre (brindilles + galets + matériaux secondaires).
const HUD_RESOURCES: { key: keyof ResourceInventory; emoji: string }[] = [
  { key: 'branch', emoji: '🌿' },
  { key: 'pebble', emoji: '⚫' },
  { key: 'wood',   emoji: '🪵' },
  { key: 'stone',  emoji: '🪨' },
];

const TOOL_EMOJI: Record<ToolType, string> = {
  wooden_axe:     '🪓',
  stone_pickaxe:  '⛏️',
};

/**
 * HUD — barre fixe en haut de l'écran.
 *
 * ─── Contenu ───────────────────────────────────────────────────────────────────
 *  ┌──────────────────────────────────────────────────────────────────┐
 *  │ 🪵 3  🪨 1  📋 0  🧱 0  │  ⚡ ██████░░ 80/100  │  ⚒️ Craft  │
 *  └──────────────────────────────────────────────────────────────────┘
 *
 * ─── Prêt pour ─────────────────────────────────────────────────────────────────
 * - Barre de vie (HP) séparée
 * - Indicateur de quête active
 * - Minimap dans un coin
 * - Notifications d'events flottantes
 */
export const HUD: React.FC = () => {
  const resources = useGameStore((s) => s.resources);
  const navigation = useNavigation<NavProp>();

  const energy       = usePlayerStore((s) => s.player.stats.energy);
  const maxEnergy    = usePlayerStore((s) => s.player.stats.maxEnergy);
  const level        = usePlayerStore((s) => s.player.stats.level);
  const equippedTool = usePlayerStore((s) => s.equippedTool);

  const energyPercent = maxEnergy > 0 ? energy / maxEnergy : 0;
  const energyColor = energyPercent > 0.5 ? '#4ade80' : energyPercent > 0.25 ? '#facc15' : '#f87171';

  return (
    <View style={styles.container}>
      {/* ── Ressources ── */}
      <View style={styles.resourceRow}>
        {HUD_RESOURCES.map(({ key, emoji }) => (
          <View key={key} style={styles.chip}>
            <Text style={styles.chipEmoji}>{emoji}</Text>
            <Text style={styles.chipValue}>{resources[key]}</Text>
          </View>
        ))}
      </View>

      {/* ── Énergie + niveau ── */}
      <View style={styles.energySection}>
        <View style={styles.energyLabelRow}>
          <Text style={styles.energyEmoji}>⚡</Text>
          <Text style={styles.energyValue}>{energy}/{maxEnergy}</Text>
          <Text style={styles.levelLabel}>Lv{level}</Text>
        </View>
        <View style={styles.energyBarBg}>
          <View
            style={[
              styles.energyBarFill,
              { width: `${Math.round(energyPercent * 100)}%`, backgroundColor: energyColor },
            ]}
          />
        </View>
      </View>

      {/* ── Outil équipé ── */}
      <TouchableOpacity
        style={[styles.toolSlot, equippedTool && styles.toolSlotActive]}
        onPress={() => navigation.navigate('Craft')}
        activeOpacity={0.75}
      >
        <Text style={styles.toolSlotText}>
          {equippedTool ? TOOL_EMOJI[equippedTool] : '✋'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 15, 30, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  resourceRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  chipEmoji: {
    fontSize: 12,
  },
  chipValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    minWidth: 14,
    textAlign: 'right',
  },

  // Énergie
  energySection: {
    flex: 1,
    gap: 3,
  },
  energyLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  energyEmoji: {
    fontSize: 11,
  },
  energyValue: {
    color: '#c8d8c0',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  levelLabel: {
    color: '#f0d060',
    fontSize: 10,
    fontWeight: '700',
  },
  energyBarBg: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  energyBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Slot outil équipé
  toolSlot: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolSlotActive: {
    backgroundColor: 'rgba(74,158,26,0.3)',
    borderColor: '#7ec850',
  },
  toolSlotText: {
    fontSize: 20,
  },
});
