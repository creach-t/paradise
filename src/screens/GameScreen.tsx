import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameScene } from '../components/game/GameScene';
import { HUD } from '../components/hud/HUD';

/**
 * Écran principal. Compose le HUD (fixe) + la scène de jeu (flexible).
 * edges={['top']} évite que le HUD chevauche la status bar, sans
 * bloquer les bords bas/gauche/droite de la scène.
 */
export const GameScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HUD />
      <GameScene />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7ec850',
  },
});
