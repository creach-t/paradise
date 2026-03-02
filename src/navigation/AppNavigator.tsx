import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainMenuScreen } from '../screens/MainMenuScreen';
import { GameScreen } from '../screens/GameScreen';
import { CraftScreen } from '../screens/CraftScreen';
import { InventoryScreen } from '../screens/InventoryScreen';

/**
 * Paramètres de chaque route.
 * Typage strict : TypeScript vérifiera les params à chaque navigation.
 *
 * Ajouter un écran :
 *  1. Déclarer la route ici (ex. Settings: { tab?: string })
 *  2. Créer le composant dans src/screens/
 *  3. Ajouter un Stack.Screen ci-dessous
 */
export type RootStackParamList = {
  MainMenu: undefined;
  Game: undefined;
  Craft: undefined;
  Inventory: undefined;
  // Futurs :
  // Settings: undefined;
  // CharacterSheet: undefined;
  // Map: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Racine de la navigation.
 *
 * ─── Flux principal ────────────────────────────────────────────────────────────
 * MainMenu (racine)
 *   ├── Game          ← modal plein écran (game-world)
 *   │     └── [HUD] → Craft / Inventory
 *   ├── Inventory     ← slide_from_bottom
 *   └── Craft         ← slide_from_bottom
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainMenu"
        screenOptions={{ headerShown: false }}
      >
        {/* ── Écrans principaux ── */}
        <Stack.Screen
          name="MainMenu"
          component={MainMenuScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{ animation: 'fade' }}
        />

        {/* ── Modals ── */}
        <Stack.Screen
          name="Craft"
          component={CraftScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Inventory"
          component={InventoryScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
