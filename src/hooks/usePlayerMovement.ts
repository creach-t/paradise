import { useEffect, useRef, MutableRefObject } from 'react';
import { usePlayerStore } from '../store/playerStore';

/** Fréquence de mise à jour de la position (ms). ~16 fps = 62 ms. */
const MOVEMENT_TICK_MS = 62;

/**
 * Hook de déplacement du joueur.
 *
 * Principe :
 *  1. Le VirtualJoystick écrit la direction normalisée dans `directionRef`.
 *  2. Ce hook lit ce ref à chaque tick via setInterval.
 *  3. Il appelle `updatePosition` du playerStore, qui calcule la nouvelle
 *     position clampée dans le monde.
 *
 * Ce design évite tout re-render pendant le mouvement du joystick —
 * seule la mise à jour de la position (zustand) provoque un re-render
 * du PlayerCharacter abonné.
 *
 * @param directionRef  Ref partagé avec le VirtualJoystick (dx, dy normalisés -1..1)
 * @param worldBounds   Dimensions du monde pour clamper la position
 */
export function usePlayerMovement(
  directionRef: MutableRefObject<{ dx: number; dy: number }>,
  worldBounds: { w: number; h: number },
): void {
  // Évite de capturer des stale closures pour les bounds.
  const boundsRef = useRef(worldBounds);
  boundsRef.current = worldBounds;

  useEffect(() => {
    const interval = setInterval(() => {
      const { dx, dy } = directionRef.current;
      if (dx === 0 && dy === 0) return; // Pas de mouvement → pas de setState

      const { updatePosition } = usePlayerStore.getState();
      updatePosition(dx, dy, boundsRef.current);
    }, MOVEMENT_TICK_MS);

    return () => clearInterval(interval);
  }, []); // Stable : tout l'état est lu via refs ou getState()
}
