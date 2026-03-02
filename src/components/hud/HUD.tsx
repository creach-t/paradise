import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '../../store/gameStore';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { ResourceInventory } from '../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;

// Ordre d'affichage des ressources dans le HUD.
const HUD_RESOURCES: { key: keyof ResourceInventory; emoji: string }[] = [
  { key: 'wood',  emoji: '🪵' },
  { key: 'stone', emoji: '🪨' },
  { key: 'plank', emoji: '📋' },
  { key: 'brick', emoji: '🧱' },
];

/**
 * HUD (Heads-Up Display) — barre fixe en haut de l'écran.
 * Affiche l'inventaire courant et le bouton d'accès à l'atelier.
 *
 * Prêt pour : barre d'énergie/stamina, notifications d'événements,
 *             indicateur de niveau, minimap.
 */
export const HUD: React.FC = () => {
  const resources = useGameStore((s) => s.resources);
  const navigation = useNavigation<NavProp>();

  return (
    <View style={styles.container}>
      <View style={styles.resourceRow}>
        {HUD_RESOURCES.map(({ key, emoji }) => (
          <View key={key} style={styles.chip}>
            <Text style={styles.chipEmoji}>{emoji}</Text>
            <Text style={styles.chipValue}>{resources[key]}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.craftButton}
        onPress={() => navigation.navigate('Craft')}
        activeOpacity={0.75}
      >
        <Text style={styles.craftButtonText}>⚒️ Craft</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 15, 30, 0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  resourceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'right',
  },
  craftButton: {
    backgroundColor: '#c07a1e',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  craftButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
