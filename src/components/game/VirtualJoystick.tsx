import React, { useRef, MutableRefObject } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';

// ─── Constantes géométriques ───────────────────────────────────────────────────

const BASE_RADIUS = 52;     // Rayon de la zone de base (px)
const KNOB_RADIUS = 24;     // Rayon du bouton central (px)
const MAX_OFFSET = BASE_RADIUS - KNOB_RADIUS - 4; // Déplacement max du bouton

// ─── Props ─────────────────────────────────────────────────────────────────────

interface VirtualJoystickProps {
  /**
   * Ref partagée avec le hook usePlayerMovement.
   * Mise à jour directe (sans re-render) pour un input fluide.
   * dx / dy sont normalisés entre -1 et +1.
   */
  directionRef: MutableRefObject<{ dx: number; dy: number }>;
}

/**
 * Joystick virtuel à 360° basé sur PanResponder (React Native natif, sans dépendance).
 *
 * ─── Fonctionnement ────────────────────────────────────────────────────────────
 * 1. Le doigt presse sur la base → PanResponder capture le geste.
 * 2. Le déplacement est projeté sur un cercle (rayon MAX_OFFSET).
 * 3. La direction normalisée est écrite dans directionRef (pas de setState).
 * 4. Le relâchement recentre le knob via une animation spring.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Évolution future : remplacer par react-native-gesture-handler + Reanimated
 * pour un input encore plus fluide sur thread natif.
 */
export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ directionRef }) => {
  const knobAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderMove: (_, gesture) => {
        const dist = Math.sqrt(gesture.dx * gesture.dx + gesture.dy * gesture.dy);
        const clamped = Math.min(dist, MAX_OFFSET);
        const angle = Math.atan2(gesture.dy, gesture.dx);

        const ox = Math.cos(angle) * clamped;
        const oy = Math.sin(angle) * clamped;

        // Mise à jour visuelle du knob (Animated, thread JS).
        knobAnim.setValue({ x: ox, y: oy });

        // Mise à jour de la direction pour le movement hook.
        // Division par MAX_OFFSET → valeur normalisée -1..+1.
        directionRef.current = {
          dx: ox / MAX_OFFSET,
          dy: oy / MAX_OFFSET,
        };
      },

      onPanResponderRelease: () => {
        // Retour au centre avec un effet ressort.
        Animated.spring(knobAnim, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          tension: 180,
          friction: 14,
        }).start();

        directionRef.current = { dx: 0, dy: 0 };
      },

      onPanResponderTerminate: () => {
        knobAnim.setValue({ x: 0, y: 0 });
        directionRef.current = { dx: 0, dy: 0 };
      },
    }),
  ).current;

  return (
    <View style={styles.base} {...panResponder.panHandlers}>
      {/* Cercle intérieur décoratif */}
      <View style={styles.innerRing} />

      {/* Bouton knob animé */}
      <Animated.View
        style={[
          styles.knob,
          {
            transform: [
              { translateX: knobAnim.x },
              { translateY: knobAnim.y },
            ],
          },
        ]}
      />
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    width: BASE_RADIUS * 2,
    height: BASE_RADIUS * 2,
    borderRadius: BASE_RADIUS,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    position: 'absolute',
    width: BASE_RADIUS * 0.9,
    height: BASE_RADIUS * 0.9,
    borderRadius: BASE_RADIUS * 0.45,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  knob: {
    width: KNOB_RADIUS * 2,
    height: KNOB_RADIUS * 2,
    borderRadius: KNOB_RADIUS,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    // Légère ombre pour donner du relief.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
