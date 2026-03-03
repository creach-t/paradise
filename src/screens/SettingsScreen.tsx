import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';

/**
 * Écran Paramètres.
 *
 * ─── Structure ─────────────────────────────────────────────────────────────────
 * ┌───────────────────────────────┐
 * │  ← Retour                    │
 * │  ⚙️  Paramètres              │
 * │                               │
 * │  ──────────────────────────── │
 * │  Données de jeu               │
 * │  [ Réinitialiser la sauvegarde ] │
 * │                               │
 * │  ──────────────────────────── │
 * │  v1.0.0 — Early Access        │
 * └───────────────────────────────┘
 */
export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const resetGame   = useGameStore((s) => s.resetGame);
  const resetPlayer = usePlayerStore((s) => s.resetPlayer);

  const [resetDone, setResetDone] = useState(false);

  const handleReset = () => {
    Alert.alert(
      'Réinitialiser la sauvegarde',
      'Toutes vos ressources, outils et la progression du joueur seront effacés. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            resetGame();
            resetPlayer();
            setResetDone(true);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.safeArea}>
        {/* ── En-tête ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>⚙️  Paramètres</Text>
        </View>

        {/* ── Section données ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données de jeu</Text>

          {resetDone ? (
            <View style={styles.resetConfirm}>
              <Text style={styles.resetConfirmText}>✓ Sauvegarde réinitialisée</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.dangerBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.dangerBtnText}>🗑️  Réinitialiser la sauvegarde</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.hint}>
            Remet à zéro les ressources, outils craftés et la progression du joueur.
          </Text>
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
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 32,
  },

  // En-tête
  header: {
    gap: 16,
    marginTop: 8,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#7ec850',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#e8f5e0',
    letterSpacing: 0.5,
  },

  // Section
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },

  // Bouton danger
  dangerBtn: {
    backgroundColor: 'rgba(200, 50, 50, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(200, 80, 80, 0.35)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: '#e07070',
    fontSize: 16,
    fontWeight: '600',
  },

  // Confirmation reset
  resetConfirm: {
    backgroundColor: 'rgba(126, 200, 80, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(126, 200, 80, 0.3)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  resetConfirmText: {
    color: '#7ec850',
    fontSize: 16,
    fontWeight: '600',
  },

  hint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    lineHeight: 18,
  },

  // Footer
  version: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
    letterSpacing: 0.5,
    alignSelf: 'center',
    marginTop: 'auto',
  },
});
