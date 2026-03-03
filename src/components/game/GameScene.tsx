import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useGameStore } from '../../store/gameStore';
import { usePlayerStore } from '../../store/playerStore';
import { useRespawn } from '../../hooks/useRespawn';
import { usePlayerMovement } from '../../hooks/usePlayerMovement';
import { useNearestHarvestable } from '../../hooks/useNearestHarvestable';
import { useDayNightCycle } from '../../hooks/useDayNightCycle';
import { WORLD_W, WORLD_H } from '../../constants/gameConfig';
import { Tree } from './Tree';
import { Rock } from './Rock';
import { Twig } from './Twig';
import { PebbleCluster } from './PebbleCluster';
import { GardenBed } from './GardenBed';
import { WaterSource } from './WaterSource';
import { House } from './House';
import { PlayerCharacter } from './PlayerCharacter';
import { VirtualJoystick } from './VirtualJoystick';
import { ActionButton } from './ActionButton';

// ─── Position fixe de la maison dans l'espace monde ───────────────────────────
const HOUSE_X = 155;
const HOUSE_Y = 370;

/**
 * Scène principale du jeu.
 *
 * ─── Architecture ─────────────────────────────────────────────────────────────
 *
 * GameScene (flex: 1, overflow: hidden)
 * ├── WorldLayer (Animated.View, WORLD_W × WORLD_H)  ← objets monde + joueur
 * │     translateX/Y = caméra centrée sur le joueur, clampée aux bords du monde
 * ├── NightOverlay (absoluteFill, pointerEvents none) ← cycle jour/nuit
 * └── ControlsOverlay (absolute, bottom)              ← joystick + ActionButton
 *
 * ─── Caméra ───────────────────────────────────────────────────────────────────
 * Abonnement au playerStore (subscribe) → mise à jour de cameraX/Y via
 * Animated.Value.setValue() → zéro re-render React pour le déplacement.
 *
 * ─── Cycle jour/nuit ──────────────────────────────────────────────────────────
 * useDayNightCycle() retourne un Animated.Value (opacité 0..NIGHT_MAX_OPACITY)
 * appliqué sur un overlay plein-écran rgba(0, 0, 30, 1) via interpolation.
 */
export const GameScene: React.FC = () => {
  const { width: sw, height: sh } = useWindowDimensions();

  const trees        = useGameStore((s) => s.trees);
  const rocks        = useGameStore((s) => s.rocks);
  const twigs        = useGameStore((s) => s.twigs);
  const pebbles      = useGameStore((s) => s.pebbles);
  const gardenBeds   = useGameStore((s) => s.gardenBeds);
  const waterSources = useGameStore((s) => s.waterSources);

  // Direction du joystick — ref partagée, 0 re-render.
  const directionRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // ── Caméra (Animated.Value — mise à jour sans re-render) ────────────────────
  const cameraX = useRef(new Animated.Value(0)).current;
  const cameraY = useRef(new Animated.Value(0)).current;

  // Refs pour les dimensions écran (stables dans le callback subscribe).
  const swRef = useRef(sw);
  const shRef = useRef(sh);
  swRef.current = sw;
  shRef.current = sh;

  useEffect(() => {
    const unsub = usePlayerStore.subscribe((state) => {
      const px = state.player.x;
      const py = state.player.y;
      const halfW = swRef.current / 2;
      const halfH = shRef.current / 2;
      const ox = Math.max(0, Math.min(WORLD_W - swRef.current, px - halfW + 20));
      const oy = Math.max(0, Math.min(WORLD_H - shRef.current, py - halfH + 20));
      cameraX.setValue(-ox);
      cameraY.setValue(-oy);
    });
    return unsub;
  }, []); // stable — dépendances via refs

  // ── Systèmes de jeu ─────────────────────────────────────────────────────────
  useRespawn();
  usePlayerMovement(directionRef, { w: WORLD_W, h: WORLD_H });

  // Détecte le nœud récoltable le plus proche du joueur.
  const target = useNearestHarvestable();

  // ── Cycle jour/nuit ─────────────────────────────────────────────────────────
  const nightOpacity = useDayNightCycle();

  return (
    <View style={styles.scene}>
      {/* ── Couche monde (coordonnées monde, décalée par la caméra) ── */}
      <Animated.View
        style={[
          styles.worldLayer,
          { transform: [{ translateX: cameraX }, { translateY: cameraY }] },
        ]}
      >
        {/* Sol */}
        <View style={styles.groundLayer} />

        {/* Chemin de terre décoratif */}
        <View style={[styles.path, { left: HOUSE_X + 2, top: HOUSE_Y + 55 }]} />

        {/* Maison */}
        <House x={HOUSE_X} y={HOUSE_Y} />

        {/* Arbres */}
        {trees.map((tree) => (
          <Tree
            key={tree.id}
            tree={tree}
            isHighlighted={target?.id === tree.id}
          />
        ))}

        {/* Rochers */}
        {rocks.map((rock) => (
          <Rock
            key={rock.id}
            rock={rock}
            isHighlighted={target?.id === rock.id}
          />
        ))}

        {/* Buissons de brindilles */}
        {twigs.map((twig) => (
          <Twig
            key={twig.id}
            twig={twig}
            isHighlighted={target?.id === twig.id}
          />
        ))}

        {/* Tas de petits galets */}
        {pebbles.map((pbl) => (
          <PebbleCluster
            key={pbl.id}
            pebble={pbl}
            isHighlighted={target?.id === pbl.id}
          />
        ))}

        {/* Lits de potager */}
        {gardenBeds.map((bed) => (
          <GardenBed
            key={bed.id}
            bed={bed}
            isHighlighted={target?.id === bed.id}
          />
        ))}

        {/* Sources d'eau */}
        {waterSources.map((src) => (
          <WaterSource
            key={src.id}
            node={src}
            isHighlighted={target?.id === src.id}
          />
        ))}

        {/* Joueur — z-index 10, pointerEvents="none" interne */}
        <PlayerCharacter />
      </Animated.View>

      {/* ── Overlay nuit (sous les contrôles, au-dessus du monde) ──
          pointerEvents="none" : ne capte aucun toucher. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.nightOverlay, { opacity: nightOpacity }]}
      />

      {/* ── Overlay contrôles ──
          pointerEvents="box-none" : le conteneur est transparent aux touches,
          seuls les enfants (joystick + bouton) les reçoivent. */}
      <View style={styles.controlsOverlay} pointerEvents="box-none">
        <VirtualJoystick directionRef={directionRef} />
        <ActionButton target={target} />
      </View>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    overflow: 'hidden',
  },
  worldLayer: {
    position: 'absolute',
    width: WORLD_W,
    height: WORLD_H,
  },
  groundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#7ec850',
  },
  path: {
    position: 'absolute',
    width: 60,
    height: 120,
    backgroundColor: '#c2a062',
    borderRadius: 30,
    opacity: 0.5,
  },
  nightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 30, 1)',
  },
  // Overlay full-width en bas : joystick à gauche, bouton action à droite.
  controlsOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
});
