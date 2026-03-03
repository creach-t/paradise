import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import { CRAFT_RECIPES } from '../constants/craftRecipes';
import type { CraftRecipe, ResourceInventory, ToolType } from '../types';

// ─── Métadonnées d'affichage ───────────────────────────────────────────────────

const RESOURCE_EMOJI: Record<keyof ResourceInventory, string> = {
  branch:        '🌿',
  pebble:        '⚫',
  wood:          '🪵',
  stone:         '🪨',
  plank:         '📋',
  brick:         '🧱',
  water:         '💧',
  berry:         '🍓',
  grain:         '🌾',
  mushroom:      '🍄',
  berry_seed:    '🌱',
  grain_seed:    '🌾',
  mushroom_seed: '🍄',
  compost:       '♻️',
  fertilizer:    '🌿',
};

const RESOURCE_LABEL: Record<keyof ResourceInventory, string> = {
  branch:        'Brindille',
  pebble:        'Galet',
  wood:          'Bois',
  stone:         'Pierre',
  plank:         'Planche',
  brick:         'Brique',
  water:         'Eau',
  berry:         'Baie',
  grain:         'Céréale',
  mushroom:      'Champignon',
  berry_seed:    'Graine de baie',
  grain_seed:    'Graine de céréale',
  mushroom_seed: 'Graine de champignon',
  compost:       'Compost',
  fertilizer:    'Engrais',
};

const TOOL_META: Record<ToolType, { emoji: string; description: string }> = {
  wooden_axe: {
    emoji: '🪓',
    description: 'Permet de couper les arbres pour obtenir du bois.',
  },
  stone_pickaxe: {
    emoji: '⛏️',
    description: 'Permet de miner les rochers pour obtenir de la pierre.',
  },
};

// ─── Composant recette ressource ──────────────────────────────────────────────

interface ResourceRecipeCardProps {
  recipe: Extract<CraftRecipe, { category: 'resource' }>;
  resources: ResourceInventory;
  onCraft: () => void;
}

const ResourceRecipeCard: React.FC<ResourceRecipeCardProps> = ({ recipe, resources, onCraft }) => {
  const canCraft = (Object.entries(recipe.requirements) as [keyof ResourceInventory, number][])
    .every(([res, amt]) => resources[res] >= amt);

  return (
    <View style={[styles.card, !canCraft && styles.cardDisabled]}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>
          {RESOURCE_EMOJI[recipe.output]} {recipe.name}
          <Text style={styles.cardOutput}> ×{recipe.outputAmount}</Text>
        </Text>
        <Text style={styles.cardSub}>
          {(Object.entries(recipe.requirements) as [keyof ResourceInventory, number][])
            .map(([res, amt]) => `${RESOURCE_EMOJI[res]} ${RESOURCE_LABEL[res]} ×${amt}`)
            .join('  ·  ')}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.craftBtn, !canCraft && styles.craftBtnDisabled]}
        onPress={onCraft}
        disabled={!canCraft}
        activeOpacity={0.75}
      >
        <Text style={styles.craftBtnText}>Fabriquer</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Composant recette outil ──────────────────────────────────────────────────

interface ToolRecipeCardProps {
  recipe: Extract<CraftRecipe, { category: 'tool' }>;
  resources: ResourceInventory;
  toolCount: number;
  isEquipped: boolean;
  onCraft: () => void;
  onEquip: () => void;
}

const ToolRecipeCard: React.FC<ToolRecipeCardProps> = ({
  recipe, resources, toolCount, isEquipped, onCraft, onEquip,
}) => {
  const meta = TOOL_META[recipe.output];
  const canCraft = (Object.entries(recipe.requirements) as [keyof ResourceInventory, number][])
    .every(([res, amt]) => resources[res] >= amt);
  const owned = toolCount > 0;

  return (
    <View style={[styles.toolCard, isEquipped && styles.toolCardEquipped]}>
      {isEquipped && (
        <View style={styles.equippedBanner}>
          <Text style={styles.equippedBannerText}>ÉQUIPÉ</Text>
        </View>
      )}

      <View style={styles.toolCardHeader}>
        <Text style={styles.toolEmoji}>{meta.emoji}</Text>
        <View style={styles.toolInfo}>
          <Text style={styles.toolName}>{recipe.name}</Text>
          <Text style={styles.toolDesc}>{meta.description}</Text>
          <Text style={styles.toolIngredients}>
            {'Ingrédients : '}
            {(Object.entries(recipe.requirements) as [keyof ResourceInventory, number][])
              .map(([res, amt]) => `${RESOURCE_EMOJI[res]} ×${amt}`)
              .join('  ')}
          </Text>
        </View>
      </View>

      <View style={styles.toolActions}>
        <TouchableOpacity
          style={[styles.smallBtn, !canCraft && styles.smallBtnDisabled]}
          onPress={onCraft}
          disabled={!canCraft}
          activeOpacity={0.75}
        >
          <Text style={styles.smallBtnText}>
            {owned ? `Fabriquer (×${toolCount})` : 'Fabriquer'}
          </Text>
        </TouchableOpacity>

        {owned && (
          <TouchableOpacity
            style={[styles.smallBtn, styles.equipBtn, isEquipped && styles.unequipBtn]}
            onPress={onEquip}
            activeOpacity={0.75}
          >
            <Text style={[styles.smallBtnText, styles.equipBtnText]}>
              {isEquipped ? 'Déséquiper' : 'Équiper'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── Écran principal ──────────────────────────────────────────────────────────

/**
 * Atelier — deux sections :
 *  1. Outils (hache, pioche…) → Fabriquer + Équiper
 *  2. Matériaux (planches, briques…) → Fabriquer
 */
export const CraftScreen: React.FC = () => {
  const navigation = useNavigation();
  const resources = useGameStore((s) => s.resources);
  const tools     = useGameStore((s) => s.tools);
  const craft     = useGameStore((s) => s.craft);

  const equippedTool = usePlayerStore((s) => s.equippedTool);
  const equipTool    = usePlayerStore((s) => s.equipTool);

  const toolRecipes = CRAFT_RECIPES.filter(
    (r): r is Extract<CraftRecipe, { category: 'tool' }> => r.category === 'tool',
  );
  const resourceRecipes = CRAFT_RECIPES.filter(
    (r): r is Extract<CraftRecipe, { category: 'resource' }> => r.category === 'resource',
  );

  const handleCraftTool = useCallback(
    (recipe: Extract<CraftRecipe, { category: 'tool' }>) => {
      const result = craft(recipe.id);
      if (result === 'success') {
        Alert.alert(
          '🛠️ Outil fabriqué !',
          `${TOOL_META[recipe.output].emoji} ${recipe.name} ajouté à ton inventaire.\nTap sur "Équiper" pour l'utiliser.`,
        );
      } else if (result === 'no_resources') {
        Alert.alert('Ressources insuffisantes', 'Ramasse plus de matériaux.');
      }
    },
    [craft],
  );

  const handleCraftResource = useCallback(
    (recipe: Extract<CraftRecipe, { category: 'resource' }>) => {
      const result = craft(recipe.id);
      if (result === 'success') {
        Alert.alert(
          '✅ Fabrication réussie !',
          `${RESOURCE_EMOJI[recipe.output]} ${recipe.name} ×${recipe.outputAmount}`,
        );
      }
    },
    [craft],
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── En-tête ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚒️ Atelier</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Inventaire rapide ── */}
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

        {/* ── Outils ── */}
        <Text style={styles.sectionLabel}>Outils</Text>
        <View style={styles.group}>
          {toolRecipes.map((recipe) => (
            <ToolRecipeCard
              key={recipe.id}
              recipe={recipe}
              resources={resources}
              toolCount={tools[recipe.output] ?? 0}
              isEquipped={equippedTool === recipe.output}
              onCraft={() => handleCraftTool(recipe)}
              onEquip={() => equipTool(recipe.output)}
            />
          ))}
        </View>

        {/* ── Matériaux ── */}
        <Text style={styles.sectionLabel}>Matériaux</Text>
        <View style={styles.group}>
          {resourceRecipes.map((recipe) => (
            <ResourceRecipeCard
              key={recipe.id}
              recipe={recipe}
              resources={resources}
              onCraft={() => handleCraftResource(recipe)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#12121e' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  back: { marginRight: 16, padding: 4 },
  backText: { color: '#8a94a8', fontSize: 15 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: 12, paddingBottom: 32 },

  sectionLabel: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  group: { gap: 10 },

  // Inventaire
  inventoryPanel: {
    backgroundColor: '#1c1c2e',
    borderRadius: 14,
    paddingBottom: 12,
    marginTop: 8,
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
    minWidth: 68,
    gap: 2,
  },
  invEmoji: { fontSize: 16 },
  invLabel: { color: '#8a94a8', fontSize: 9, fontWeight: '500' },
  invAmount: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Carte ressource
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
  cardDisabled: { opacity: 0.45 },
  cardInfo: { flex: 1, gap: 4 },
  cardTitle: { color: '#f0f0f0', fontSize: 15, fontWeight: '600' },
  cardOutput: { color: '#7ec850', fontWeight: '700' },
  cardSub: { color: '#8a94a8', fontSize: 12 },
  craftBtn: {
    backgroundColor: '#c07a1e',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    marginLeft: 12,
  },
  craftBtnDisabled: { backgroundColor: '#3a3a4a' },
  craftBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Carte outil
  toolCard: {
    backgroundColor: '#1c1c2e',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 10,
    overflow: 'hidden',
  },
  toolCardEquipped: {
    borderColor: '#7ec850',
    borderWidth: 1.5,
    backgroundColor: 'rgba(126,200,80,0.05)',
  },
  equippedBanner: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4a9e1a',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: 10,
  },
  equippedBannerText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  toolCardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  toolEmoji: { fontSize: 36 },
  toolInfo: { flex: 1, gap: 3 },
  toolName: { color: '#f0f0f0', fontSize: 15, fontWeight: '700' },
  toolDesc: { color: '#8a94a8', fontSize: 12 },
  toolIngredients: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  toolActions: { flexDirection: 'row', gap: 8 },
  smallBtn: {
    flex: 1,
    backgroundColor: '#c07a1e',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  smallBtnDisabled: { backgroundColor: '#3a3a4a' },
  equipBtn: { backgroundColor: '#2a3a5a' },
  unequipBtn: { backgroundColor: '#1a4a2a' },
  smallBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  equipBtnText: { color: '#a0c8ff' },
});
