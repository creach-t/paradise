import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { usePlayerStore } from '../store/playerStore';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'MainMenu'>;

// ─── Sous-composant bouton ─────────────────────────────────────────────────────

interface MenuButtonProps {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}

const MenuButton: React.FC<MenuButtonProps> = ({ label, onPress, primary, disabled }) => (
  <TouchableOpacity
    style={[styles.btn, primary && styles.btnPrimary, disabled && styles.btnDisabled]}
    onPress={onPress}
    activeOpacity={0.8}
    disabled={disabled}
  >
    <Text style={[styles.btnText, primary && styles.btnTextPrimary]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Écran ─────────────────────────────────────────────────────────────────────

/**
 * Menu principal du jeu.
 *
 * ─── Structure ─────────────────────────────────────────────────────────────────
 * ┌───────────────────────────────┐
 * │  🏝️ Paradise                 │  ← Titre + sous-titre
 * │  Jeu de récolte               │
 * │                               │
 * │  ▶ Jouer                     │  ← Bouton principal (accent)
 * │  📦 Inventaire               │
 * │  ⚒️  Atelier                  │
 * │  ⚙️  Paramètres               │  ← Désactivé (futur)
 * │                               │
 * │  v1.0.0 – Early Access        │  ← Footer
 * └───────────────────────────────┘
 *
 * Prêt pour :
 *  - Fond animé (parallaxe, arbres qui bougent)
 *  - Écran de paramètres (son, langue, reset save)
 *  - Leaderboard / social
 *  - Indicateur "Nouvelle mise à jour !"
 */
export const MainMenuScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const playerLevel = usePlayerStore((s) => s.player.stats.level);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Fond décoratif — à remplacer par une ImageBackground ou animation */}
      <View style={styles.background}>
        <Text style={styles.bgEmoji}>🌲</Text>
        <Text style={[styles.bgEmoji, styles.bgEmojiRight]}>🌲</Text>
        <Text style={[styles.bgEmoji, styles.bgEmojiBottom]}>🪨</Text>
        <Text style={[styles.bgEmoji, styles.bgEmojiBottomRight]}>🌲</Text>
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* ── En-tête ── */}
        <View style={styles.header}>
          <Text style={styles.title}>🏝️ Paradise</Text>
          <Text style={styles.subtitle}>Jeu de récolte</Text>
          {playerLevel > 1 && (
            <View style={styles.levelChip}>
              <Text style={styles.levelChipText}>Niveau {playerLevel}</Text>
            </View>
          )}
        </View>

        {/* ── Boutons ── */}
        <View style={styles.actions}>
          <MenuButton
            label="▶  Jouer"
            primary
            onPress={() => navigation.navigate('Game')}
          />
          <MenuButton
            label="📦  Inventaire"
            onPress={() => navigation.navigate('Inventory')}
          />
          <MenuButton
            label="⚒️  Atelier"
            onPress={() => navigation.navigate('Craft')}
          />
          <MenuButton
            label="⚙️  Paramètres"
            onPress={() => {
              // TODO : implémenter SettingsScreen (son, langue, reset)
            }}
            disabled
          />
        </View>

        {/* ── Footer ── */}
        <Text style={styles.version}>v1.0.0 — Early Access</Text>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0d1f0d',
  },

  // Fond décoratif flottant
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgEmoji: {
    position: 'absolute',
    fontSize: 72,
    top: 60,
    left: -10,
    opacity: 0.15,
  },
  bgEmojiRight: {
    left: undefined,
    right: -10,
    top: 100,
  },
  bgEmojiBottom: {
    top: undefined,
    bottom: 120,
    left: 10,
    fontSize: 52,
  },
  bgEmojiBottomRight: {
    top: undefined,
    bottom: 80,
    left: undefined,
    right: 10,
    fontSize: 60,
  },

  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
  },

  // En-tête
  header: {
    alignItems: 'center',
    marginTop: 48,
    gap: 6,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#e8f5e0',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#7ec850',
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  levelChip: {
    marginTop: 8,
    backgroundColor: 'rgba(126, 200, 80, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(126, 200, 80, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  levelChipText: {
    color: '#7ec850',
    fontSize: 13,
    fontWeight: '600',
  },

  // Boutons
  actions: {
    width: '100%',
    paddingHorizontal: 32,
    gap: 12,
  },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#4a9e1a',
    borderColor: '#6cc830',
    borderWidth: 1.5,
    shadowColor: '#7ec850',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    color: '#c8ddc0',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  btnTextPrimary: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Footer
  version: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
