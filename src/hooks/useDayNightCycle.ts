import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { BALANCE } from '../constants/balance';

/** Fréquence de mise à jour de l'overlay nuit (ms). */
const TICK_MS = 1_000;

/**
 * Hook de cycle jour/nuit.
 *
 * Retourne un Animated.Value représentant l'opacité de l'overlay nocturne
 * (0 = plein jour, NIGHT_MAX_OPACITY = milieu de nuit).
 *
 * ─── Formule ──────────────────────────────────────────────────────────────────
 * Phase = elapsed / DAY_CYCLE_MS  ∈ [0, 1[
 * Opacité = (1 - cos(phase × 2π)) / 2 × NIGHT_MAX_OPACITY
 *
 *  phase 0   → cos=1  → opacité=0             (aube — plein jour)
 *  phase 0.5 → cos=-1 → opacité=MAX_OPACITY   (milieu de nuit)
 *  phase 1   → cos=1  → opacité=0             (retour à l'aube)
 *
 * ─── Performance ──────────────────────────────────────────────────────────────
 * - setInterval à 1 s → charge quasi nulle
 * - Animated.Value.setValue() → mise à jour native sans re-render React
 */
export function useDayNightCycle(): Animated.Value {
  const nightOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let elapsed = 0;

    const id = setInterval(() => {
      elapsed = (elapsed + TICK_MS) % BALANCE.DAY_CYCLE_MS;
      const phase = elapsed / BALANCE.DAY_CYCLE_MS; // 0..1
      const opacity = ((1 - Math.cos(phase * 2 * Math.PI)) / 2) * BALANCE.NIGHT_MAX_OPACITY;
      nightOpacity.setValue(opacity);
    }, TICK_MS);

    return () => clearInterval(id);
  }, []); // stable — BALANCE.DAY_CYCLE_MS est une constante

  return nightOpacity;
}
