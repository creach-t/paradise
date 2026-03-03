import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePlayerStore } from '../../store/playerStore';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { ToolType } from '../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;

const TOOL_EMOJI: Record<ToolType, string> = {
  wooden_axe:    '🪓',
  stone_pickaxe: '⛏️',
};

const MENU_ITEMS: { label: string; route: keyof RootStackParamList }[] = [
  { label: '🏠  Menu principal', route: 'MainMenu' },
  { label: '📦  Inventaire',     route: 'Inventory' },
  { label: '⚒️   Atelier',        route: 'Craft' },
  { label: '⚙️   Paramètres',     route: 'Settings' },
];

/**
 * HUD — barre fixe en haut de l'écran.
 *
 * ┌────────────────────────────────────────────┐
 * │  ≡  │  ⚡ ██████░░  80/100  Lv5  │  🪓   │
 * └────────────────────────────────────────────┘
 *
 * Le bouton ≡ ouvre un modal dropdown de navigation.
 * Les ressources sont consultables via l'Inventaire.
 */
export const HUD: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [menuOpen, setMenuOpen] = useState(false);

  const energy       = usePlayerStore((s) => s.player.stats.energy);
  const maxEnergy    = usePlayerStore((s) => s.player.stats.maxEnergy);
  const level        = usePlayerStore((s) => s.player.stats.level);
  const equippedTool = usePlayerStore((s) => s.equippedTool);

  const energyPercent = maxEnergy > 0 ? energy / maxEnergy : 0;
  const energyColor = energyPercent > 0.5 ? '#4ade80' : energyPercent > 0.25 ? '#facc15' : '#f87171';

  const handleNav = (route: keyof RootStackParamList) => {
    setMenuOpen(false);
    // Petit délai pour laisser le modal se fermer avant la navigation.
    setTimeout(() => navigation.navigate(route as never), 80);
  };

  return (
    <>
      <View style={styles.container}>
        {/* ── Menu hamburger ── */}
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setMenuOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.menuBtnText}>☰</Text>
        </TouchableOpacity>

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

        {/* ── Slot outil équipé → ouvre l'Atelier ── */}
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

      {/* ── Modal menu dropdown ── */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMenuOpen(false)}
      >
        {/* Backdrop — clic en dehors pour fermer */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        />

        {/* Dropdown positionné en haut-gauche, sous le HUD */}
        <View style={styles.dropdown}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.dropdownItem, i < MENU_ITEMS.length - 1 && styles.dropdownItemBorder]}
              onPress={() => handleNav(item.route)}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownItemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </>
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
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },

  // Bouton hamburger
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnText: {
    color: '#e8f5e0',
    fontSize: 18,
    lineHeight: 22,
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

  // Modal
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dropdown: {
    position: 'absolute',
    top: (StatusBar.currentHeight ?? 24) + 54, // safe area + HUD height
    left: 12,
    backgroundColor: 'rgba(15, 15, 30, 0.97)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 24,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  dropdownItemText: {
    color: '#e8f5e0',
    fontSize: 15,
    fontWeight: '600',
  },
});
