import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { CRAFT_RECIPES } from '../constants/craftRecipes';
import { CraftRecipe, ResourceInventory } from '../types';

// ─── Affichage des ressources ─────────────────────────────────────────────────

const RESOURCE_EMOJI: Record<keyof ResourceInventory, string> = {
  wood:  '🪵',
  stone: '🪨',
  plank: '📋',
  brick: '🧱',
};

const RESOURCE_LABEL: Record<keyof ResourceInventory, string> = {
  wood:  'Bois',
  stone: 'Pierre',
  plank: 'Planche',
  brick: 'Brique',
};

// ─── Composant sous-card ──────────────────────────────────────────────────────

interface RecipeCardProps {
  recipe: CraftRecipe;
  canCraft: boolean;
  onCraft: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, canCraft, onCraft }) => (
  <View style={[styles.card, !canCraft && styles.cardDisabled]}>
    <View style={styles.cardInfo}>
      <Text style={styles.cardTitle}>
        {RESOURCE_EMOJI[recipe.output]} {recipe.name}
      </Text>
      <Text style={styles.cardSub}>
        {(Object.entries(recipe.requirements) as [keyof ResourceInventory, number][])
          .map(([res, amt]) => `${RESOURCE_EMOJI[res]} ×${amt}`)
          .join('   ')}
      </Text>
    </View>
    <TouchableOpacity
      style={[styles.craftBtn, !canCraft && styles.craftBtnDisabled]}
      onPress={onCraft}
      disabled={!canCraft}
      activeOpacity={0.75}
    >
      <Text style={styles.craftBtnText}>Craft</Text>
    </TouchableOpacity>
  </View>
);

// ─── Écran principal ──────────────────────────────────────────────────────────

/**
 * Écran de craft — liste des recettes disponibles + inventaire courant.
 * Prêt pour : onglets de catégories, file de craft, animations de fabrication.
 */
export const CraftScreen: React.FC = () => {
  const navigation = useNavigation();
  const resources = useGameStore((s) => s.resources);
  const craft = useGameStore((s) => s.craft);

  const canCraft = useCallback(
    (recipe: CraftRecipe): boolean =>
      (Object.entries(recipe.requirements) as [keyof ResourceInventory, number][])
        .every(([res, amt]) => resources[res] >= amt),
    [resources],
  );

  const handleCraft = useCallback(
    (recipe: CraftRecipe) => {
      const ok = craft(recipe.id);
      if (ok) {
        Alert.alert('✅ Fabrication réussie !', `Tu as fabriqué : ${recipe.name}`);
      }
    },
    [craft],
  );

  const renderItem: ListRenderItem<CraftRecipe> = ({ item }) => (
    <RecipeCard
      recipe={item}
      canCraft={canCraft(item)}
      onCraft={() => handleCraft(item)}
    />
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚒️ Atelier</Text>
      </View>

      {/* Inventaire courant */}
      <View style={styles.inventoryPanel}>
        <Text style={styles.sectionLabel}>Inventaire</Text>
        <View style={styles.inventoryRow}>
          {(Object.keys(resources) as (keyof ResourceInventory)[]).map((key) => (
            <View key={key} style={styles.invChip}>
              <Text style={styles.invEmoji}>{RESOURCE_EMOJI[key]}</Text>
              <Text style={styles.invLabel}>{RESOURCE_LABEL[key]}</Text>
              <Text style={styles.invAmount}>{resources[key]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recettes */}
      <Text style={styles.sectionLabel}>Recettes disponibles</Text>
      <FlatList
        data={CRAFT_RECIPES}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#12121e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  back: {
    marginRight: 16,
    padding: 4,
  },
  backText: {
    color: '#8a94a8',
    fontSize: 15,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionLabel: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  inventoryPanel: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: '#1c1c2e',
    borderRadius: 14,
    paddingBottom: 12,
  },
  inventoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
  },
  invChip: {
    backgroundColor: '#0f1729',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    minWidth: 72,
    gap: 2,
  },
  invEmoji: {
    fontSize: 18,
  },
  invLabel: {
    color: '#8a94a8',
    fontSize: 10,
    fontWeight: '500',
  },
  invAmount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  list: {
    padding: 12,
    gap: 10,
  },
  card: {
    backgroundColor: '#1c1c2e',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardDisabled: {
    opacity: 0.45,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: '#f0f0f0',
    fontSize: 16,
    fontWeight: '600',
  },
  cardSub: {
    color: '#8a94a8',
    fontSize: 13,
  },
  craftBtn: {
    backgroundColor: '#c07a1e',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 12,
  },
  craftBtnDisabled: {
    backgroundColor: '#3a3a4a',
  },
  craftBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
