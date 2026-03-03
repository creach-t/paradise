import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { TwigNode } from '../../types';

interface TwigProps {
  twig: TwigNode;
  isHighlighted?: boolean;
}

const getFlipX = (x: number, y: number) =>
  (Math.floor(x / 55) + Math.floor(y / 75)) % 2 === 0;

export const Twig: React.FC<TwigProps> = ({ twig, isHighlighted = false }) => {
  if (twig.isHarvested) return null;

  const flipX = getFlipX(twig.x, twig.y);

  return (
    <View
      style={[
        styles.container,
        { left: twig.x, top: twig.y },
        isHighlighted && styles.highlighted,
      ]}
      pointerEvents="none"
    >
      <Image
        source={require('../../../assets/branch.png')}
        style={[styles.image, flipX && styles.flipped]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  flipped: {
    transform: [{ scaleX: -1 }],
  },
  highlighted: {
    borderRadius: 21,
    backgroundColor: 'rgba(126,200,80,0.25)',
  },
});
