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

const HOUSE_X = 155;
const HOUSE_Y = 370;

export const GameScene: React.FC = () => {
  const { width: sw, height: sh } = useWindowDimensions();

  const trees        = useGameStore((s) => s.trees);
  const rocks        = useGameStore((s) => s.rocks);
  const twigs        = useGameStore((s) => s.twigs);
  const pebbles      = useGameStore((s) => s.pebbles);
  const gardenBeds   = useGameStore((s) => s.gardenBeds);
  const waterSources = useGameStore((s) => s.waterSources);

  const directionRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const cameraX = useRef(new Animated.Value(0)).current;
  const cameraY = useRef(new Animated.Value(0)).current;

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
  }, []);

  useRespawn();
  usePlayerMovement(directionRef, { w: WORLD_W, h: WORLD_H });

  const target = useNearestHarvestable();
  const nightOpacity = useDayNightCycle();

  // ── Depth sort — tous les objets du monde triés par Y ───────────────────────
  // Plus Y est grand (bas de l'écran) → rendu en dernier → passe devant.
  const depthSorted = [
    ...trees.map(t => ({
      y: t.y,
      el: <Tree key={t.id} tree={t} isHighlighted={target?.id === t.id} />,
    })),
    ...rocks.map(r => ({
      y: r.y,
      el: <Rock key={r.id} rock={r} isHighlighted={target?.id === r.id} />,
    })),
    ...twigs.map(t => ({
      y: t.y,
      el: <Twig key={t.id} twig={t} isHighlighted={target?.id === t.id} />,
    })),
    ...pebbles.map(p => ({
      y: p.y,
      el: <PebbleCluster key={p.id} pebble={p} isHighlighted={target?.id === p.id} />,
    })),
    ...gardenBeds.map(b => ({
      y: b.y,
      el: <GardenBed key={b.id} bed={b} isHighlighted={target?.id === b.id} />,
    })),
    ...waterSources.map(s => ({
      y: s.y,
      el: <WaterSource key={s.id} node={s} isHighlighted={target?.id === s.id} />,
    })),
    { y: HOUSE_Y, el: <House key="house" x={HOUSE_X} y={HOUSE_Y} /> },
  ].sort((a, b) => a.y - b.y);

  return (
    <View style={styles.scene}>
      <Animated.View
        style={[
          styles.worldLayer,
          { transform: [{ translateX: cameraX }, { translateY: cameraY }] },
        ]}
      >
        {/* Sol */}
        <View style={styles.groundLayer} />

        {/* Chemin de terre */}
        <View style={[styles.path, { left: HOUSE_X + 2, top: HOUSE_Y + 55 }]} />

        {/* Objets du monde — triés par Y (haut = derrière, bas = devant) */}
        {depthSorted.map(item => item.el)}

        {/* Joueur — au-dessus de tous les objets statiques */}
        <PlayerCharacter />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[styles.nightOverlay, { opacity: nightOpacity }]}
      />

      <View style={styles.controlsOverlay} pointerEvents="box-none">
        <VirtualJoystick directionRef={directionRef} />
        <ActionButton target={target} />
      </View>
    </View>
  );
};

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
