import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { RockNode } from '../../types';
import { usePlayerStore } from '../../store/playerStore';

interface RockProps {
  rock: RockNode;
  isHighlighted?: boolean;
}

const getFlipX = (x: number, y: number) =>
  (Math.floor(x / 50) + Math.floor(y / 70)) % 2 === 0;

export const Rock: React.FC<RockProps> = ({ rock, isHighlighted = false }) => {
  const equippedTool = usePlayerStore((s) => s.equippedTool);
  const showLockBadge = !rock.isHarvested && equippedTool !== 'stone_pickaxe';

  const flipX = getFlipX(rock.x, rock.y);

  return (
    <View
      style={[
        styles.container,
        { left: rock.x, top: rock.y },
        isHighlighted && styles.highlighted,
      ]}
      pointerEvents="none"
    >
      <Image
        source={
          rock.isHarvested
            ? require('../../../assets/rock_mined.png')
            : require('../../../assets/rock.png')
        }
        style={[styles.image, flipX && styles.flipped]}
        resizeMode="contain"
      />

      {showLockBadge && (
        <View style={styles.lockBadge}>
          <Text style={styles.lockText}>⛏️</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 72,
    height: 72,
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
    borderRadius: 26,
    backgroundColor: 'rgba(126,200,80,0.22)',
  },
  lockBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 7,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  lockText: {
    fontSize: 10,
  },
});
