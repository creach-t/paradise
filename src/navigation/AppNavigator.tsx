import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameScreen } from '../screens/GameScreen';
import { CraftScreen } from '../screens/CraftScreen';

/**
 * Paramètres de chaque route (utile pour TypeScript + navigation typée).
 * À étendre lors de l'ajout de nouveaux écrans.
 */
export type RootStackParamList = {
  Game: undefined;
  Craft: undefined;
  // Exemples futurs :
  // Inventory: undefined;
  // Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Racine de la navigation.
 * Stack simple : Game (principal) ↔ Craft (modal slide-from-bottom).
 */
export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Game"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen
          name="Craft"
          component={CraftScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
