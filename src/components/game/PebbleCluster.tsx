import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { PebbleNode } from '../../types';

interface PebbleClusterProps {
  pebble: PebbleNode;
  isHighlighted?: boolean;
}

const getFlipX = (x: number, y: number) =>
  (Math.floor(x / 60) + Math.floor(y / 80)) % 2 === 0;

export const PebbleCluster: React.FC<PebbleClusterProps> = ({ pebble, isHighlighted = false }) => {
  if (pebble.isHarvested) return null;

  const flipX = getFlipX(pebble.x, pebble.y);

  return (
    <View
      style={[
        styles.container,
        { left: pebble.x, top: pebble.y },
        isHighlighted && styles.highlighted,
      ]}
      pointerEvents="none"
    >
      <Image
        source={require('../../../assets/little-rock.png')}
        style={[styles.image, flipX && styles.flipped]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 68,
    height: 68,
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
    borderRadius: 19,
    backgroundColor: 'rgba(126,200,80,0.25)',
  },
});
