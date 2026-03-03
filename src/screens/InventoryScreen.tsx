import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import type { ResourceInventory } from '../types';

// ─── Métadonnées d'affichage des ressources ────────────────────────────────────

interface ResourceMeta {
  emoji: string;
  label: string;
  description: string;
  color: string;
}

const RESOURCE_META: Record<keyof ResourceInventory, ResourceMeta> = {
  branch: {
    emoji: '🌿',
    label: 'Brindille',
    description: 'Récoltée à la main près des buissons. Sert à crafter la hache.',
    color: '#4a8a3c',
  },
  pebble: {
    emoji: '⚫',
    label: 'Galet',
    description: 'Ramassé à la main près des tas de galets. Sert à crafter la pioche.',
    color: '#555566',
  },
  wood: {
    emoji: '🪵',
    label: 'Bois',
    description: 'Récolté avec la hache en bois près des arbres.',
    color: '#8b5e3c',
  },
  stone: {
    emoji: '🪨',
    label: 'Pierre',
    description: 'Récoltée avec la pioche en pierre près des rochers.',
    color: '#7a7a8a',
  },
  plank: {
    emoji: '📋',
    label: 'Planche',
    description: 'Fabriquée à partir de 3 bois.',
    color: '#b8924a',
  },
  brick: {
    emoji: '🧱',
    label: 'Brique',
    description: 'Fabriquée à partir de 3 pierres.',
    color: '#c0552a',
  },
  // ── M2 Farming ──────────────────────────────────────────────────────────────
  water: {
    emoji: '💧',
    label: 'Eau',
    description: "Collectée à la source d'eau. Sert à arroser le potager.",
    color: '#2d7ab8',
  },
  berry: {
    emoji: '🍓',
    label: 'Baie',
    description: 'Récoltée sur le potager depuis une graine de baie (30 s).',
    color: '#c0304a',
  },
  grain: {
    emoji: '🌾',
    label: 'Céréale',
    description: 'Récoltée sur le potager depuis une graine de céréale (60 s).',
    color: '#c8a830',
  },
  mushroom: {
    emoji: '🍄',
    label: 'Champignon',
    description: 'Récolté sur le potager depuis une graine de champignon (90 s).',
    color: '#8b3a1e',
  },
  berry_seed: {
    emoji: '🌱',
    label: 'Graine de baie',
    description: 'Plantable sur le potager. Produit 3 baies en 30 s.',
    color: '#4a8a3c',
  },
  grain_seed: {
    emoji: '🌾',
    label: 'Graine de céréale',
    description: 'Plantable sur le potager. Produit 2 céréales en 60 s.',
    color: '#8a7a2a',
  },
  mushroom_seed: {
    emoji: '🍄',
    label: 'Graine de champignon',
    description: 'Plantable sur le potager. Produit 1 champignon en 90 s.',
    color: '#6b3a1e',
  },
  compost: {
    emoji: '♻️',
    label: 'Compost',
    description: "Crafté depuis 4 brindilles. Sert à fabriquer l'engrais.",
    color: '#5a4a2a',
  },
  fertilizer: {
    emoji: '🌿',
    label: 'Engrais',
    description: 'Crafté depuis 2 composts. Accélère la pousse (à venir).',
    color: '#3a7a2a',
  },
};

// ─── Composant carte de ressource ─────────────────────────────────────────────

interface ResourceCardProps {
  resourceKey: keyof ResourceInventory;
  amount: number;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resourceKey, amount }) => {
  const meta = RESOURCE_META[resourceKey];

  return (
    <View style={[styles.card, { borderLeftColor: meta.color }]}>
      <Text style={styles.cardEmoji}>{meta.emoji}</Text>
      <View style={styles.cardInfo}>
        <Text style={styles.cardLabel}>{meta.label}</Text>
        <Text style={styles.cardDesc}>{meta.description}</Text>
      </View>
      <View style={styles.cardAmountBox}>
        <Text style={styles.cardAmount}>{amount}</Text>
      </View>
    </View>
  );
};

// ─── Écran principal ───────────────────────────────────────────────────────────

/**
 * Écran d'inventaire dédié.
 *
 * Affiche :
 *  - Toutes les ressources et leurs quantités
 *  - Les stats du joueur (énergie, niveau, XP)
 *
 * Prêt pour :
 *  - Filtres par catégorie (matériaux, consommables, équipements)
 *  - Indicateurs de max stack
 *  - Bouton "Utiliser" sur les consommables
 *  - Tri par quantité / nom
 */
export const InventoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const resources = useGameStore((s) => s.resources);
  const player = usePlayerStore((s) => s.player);
  const { stats } = player;

  const totalItems = Object.values(resources).reduce((a, b) => a + b, 0);
  const xpPercent = stats.xpToNextLevel > 0
    ? Math.round((stats.xp / stats.xpToNextLevel) * 100)
    : 100;

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── En-tête ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📦 Inventaire</Text>
        <Text style={styles.totalBadge}>{totalItems} items</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stats joueur ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Joueur</Text>

          <View style={styles.playerCard}>
            {/* Niveau + XP */}
            <View style={styles.playerRow}>
              <View style={styles.playerStat}>
                <Text style={styles.playerStatValue}>Nv {stats.level}</Text>
                <Text style={styles.playerStatLabel}>Niveau</Text>
              </View>
              <View style={styles.playerStatFlex}>
                <View style={styles.xpBarBg}>
                  <View style={[styles.xpBarFill, { width: `${xpPercent}%` }]} />
                </View>
                <Text style={styles.xpText}>
                  {stats.xp} / {stats.xpToNextLevel} XP ({xpPercent}%)
                </Text>
              </View>
            </View>

            {/* Énergie */}
            <View style={[styles.playerRow, { marginTop: 10 }]}>
              <View style={styles.playerStat}>
                <Text style={styles.playerStatValue}>⚡</Text>
                <Text style={styles.playerStatLabel}>Énergie</Text>
              </View>
              <View style={styles.playerStatFlex}>
                <View style={styles.energyBarBg}>
                  <View
                    style={[
                      styles.energyBarFill,
                      { width: `${Math.round((stats.energy / stats.maxEnergy) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.xpText}>
                  {stats.energy} / {stats.maxEnergy}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Ressources ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ressources</Text>
          <View style={styles.resourceList}>
            {(Object.keys(resources) as (keyof ResourceInventory)[]).map((key) => (
              <ResourceCard key={key} resourceKey={key} amount={resources[key]} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

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
    gap: 8,
  },
  back: {
    padding: 4,
    marginRight: 4,
  },
  backText: {
    color: '#8a94a8',
    fontSize: 15,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  totalBadge: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 8,
    paddingBottom: 32,
  },

  // Sections
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  // Carte joueur
  playerCard: {
    backgroundColor: '#1c1c2e',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerStat: {
    width: 52,
    alignItems: 'center',
    gap: 2,
  },
  playerStatValue: {
    color: '#f0d060',
    fontSize: 18,
    fontWeight: '800',
  },
  playerStatLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '500',
  },
  playerStatFlex: {
    flex: 1,
    gap: 4,
  },

  // XP bar
  xpBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#f0d060',
    borderRadius: 4,
  },
  xpText: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '500',
  },

  // Energy bar
  energyBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  energyBarFill: {
    height: '100%',
    backgroundColor: '#4ade80',
    borderRadius: 4,
  },

  // Cartes ressources
  resourceList: {
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c2e',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    color: '#f0f0f0',
    fontSize: 15,
    fontWeight: '600',
  },
  cardDesc: {
    color: '#6b7280',
    fontSize: 12,
  },
  cardAmountBox: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  cardAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
