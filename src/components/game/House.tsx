import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface HouseProps {
  x: number;
  y: number;
}

/**
 * Maison du joueur — point central de la scène.
 * Non interactive pour l'instant. Prêt pour : menu intérieur, stockage, upgrades.
 */
export const House: React.FC<HouseProps> = ({ x, y }) => {
  return (
    <View style={[styles.container, { left: x, top: y }]}>
      <Image
        source={require('../../../assets/house.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
