import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useGameStore } from '../../store/gameStore';
import { useRespawn } from '../../hooks/useRespawn';
import { usePlayerMovement } from '../../hooks/usePlayerMovement';
import { useNearestHarvestable } from '../../hooks/useNearestHarvestable';
import { Tree } from './Tree';
import { Rock } from './Rock';
import { Twig } from './Twig';
import { PebbleCluster } from './PebbleCluster';
import { House } from './House';
import { PlayerCharacter } from './PlayerCharacter';
import { VirtualJoystick } from './VirtualJoystick';
import { ActionButton } from './ActionButton';

// ─── Constantes de disposition ────────────────────────────────────────────────

const HOUSE_Y = 370;

/**
 * Scène principale du jeu.
 *
 * ─── Architecture ─────────────────────────────────────────────────────────────
 *
 * GameScene (flex: 1)
 * ├── WorldLayer (StyleSheet.absoluteFill)     ← objets du monde
 * │     ├── Ground (couleur/image)
 * │     ├── Path (décoratif)
 * │     ├── House
 * │     ├── Trees[]           (View pur, isHighlighted si cible proche)
 * │     ├── Rocks[]           (View pur, isHighlighted si cible proche)
 * │     ├── Twigs[]           (View pur, isHighlighted si cible proche)
 * │     ├── PebbleClusters[]  (View pur, isHighlighted si cible proche)
 * │     └── PlayerCharacter   (z-index: 10)
 * └── ControlsOverlay (absolute, bottom, row)  ← contrôles HUD
 *       ├── VirtualJoystick   (gauche)
 *       └── ActionButton      (droite) ← déclenche la récolte en proximité
 *
 * ─── Interaction joueur ───────────────────────────────────────────────────────
 * Le joueur se déplace via le joystick (directionRef, 0 re-render).
 * useNearestHarvestable() poll à 150 ms → renvoie la cible la plus proche.
 * ActionButton affiche l'action contextuelle et déclenche la récolte.
 * Les composants nœuds (Tree, Rock…) sont de purs View — aucun TouchableOpacity.
 *
 * ─── Performance ──────────────────────────────────────────────────────────────
 * - useWindowDimensions() ← réactif à l'orientation
 * - directionRef écrit par VirtualJoystick sans setState → 0 re-render HUD
 * - PlayerCharacter re-rend seul à chaque tick de mouvement (~16fps)
 * - WorldLayer ne re-rend que lors des harvests ou changements de cible
 */
export const GameScene: React.FC = () => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const trees   = useGameStore((s) => s.trees);
  const rocks   = useGameStore((s) => s.rocks);
  const twigs   = useGameStore((s) => s.twigs);
  const pebbles = useGameStore((s) => s.pebbles);

  // Dimensions réelles de la scène (après layout) pour clamper le joueur.
  const [worldBounds, setWorldBounds] = useState({ w: SCREEN_WIDTH, h: 600 });

  const handleWorldLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setWorldBounds({ w: width, h: height });
  }, []);

  // Direction du joystick — ref partagée entre VirtualJoystick et le hook.
  // Aucun re-render lors du mouvement du joystick.
  const directionRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Active les systèmes de jeu.
  useRespawn();
  usePlayerMovement(directionRef, worldBounds);

  // Détecte le nœud récoltable le plus proche du joueur.
  const target = useNearestHarvestable();

  const HOUSE_X = SCREEN_WIDTH / 2 - 32;

  return (
    <View style={styles.scene}>
      {/* ── Couche monde ── */}
      <View style={StyleSheet.absoluteFill} onLayout={handleWorldLayout}>
        {/* Sol */}
        <View style={styles.groundLayer} />

        {/* Chemin de terre décoratif */}
        <View
          style={[
            styles.path,
            { left: SCREEN_WIDTH / 2 - 30, top: HOUSE_Y + 55 },
          ]}
        />

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

        {/* Joueur — z-index 10, pointerEvents="none" interne */}
        <PlayerCharacter />
      </View>

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
