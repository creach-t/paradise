import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePlayerStore } from '../../store/playerStore';

/**
 * Représentation visuelle du joueur dans le monde.
 *
 * ─── Performance ──────────────────────────────────────────────────────────────
 * Mémoïsé (React.memo) mais re-rendu à chaque tick de mouvement (~16fps).
 * Ce composant est le seul abonné à player.x / player.y, donc le reste
 * de GameScene n'est pas re-rendu lors des déplacements.
 *
 * ─── Évolutions prévues ───────────────────────────────────────────────────────
 * - Spritesheet / atlas d'animation (marche N/S/E/O)
 * - Feedback visuel lors de la récolte (scale bounce)
 * - Indicateur de niveau flottant au-dessus
 * - Ombre portée (déjà présente, à affiner)
 */
const PlayerCharacterComponent: React.FC = () => {
  const { x, y, stats } = usePlayerStore((s) => s.player);

  return (
    <View
      style={[styles.container, { left: x, top: y }]}
      // Passe les touches aux objets du monde derrière le joueur.
      pointerEvents="none"
    >
      {/* Indicateur de niveau */}
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>Lv{stats.level}</Text>
      </View>

      {/* Sprite emoji */}
      <Text style={styles.sprite}>🧑</Text>

      {/* Ombre au sol */}
      <View style={styles.shadow} />
    </View>
  );
};

export const PlayerCharacter = memo(PlayerCharacterComponent);

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 40,
    height: 52,
    alignItems: 'center',
    zIndex: 10,
  },
  levelBadge: {
    backgroundColor: 'rgba(15, 15, 30, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginBottom: 2,
  },
  levelText: {
    color: '#f0d060',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sprite: {
    fontSize: 28,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  shadow: {
    width: 28,
    height: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.18)',
    marginTop: -3,
  },
});
