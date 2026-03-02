# CLAUDE.md — Contexte projet Paradise

Ce fichier donne à Claude le contexte nécessaire pour contribuer efficacement au projet.

## Stack

- **Expo SDK 55** (managed workflow) — React Native 0.83.2 — React 19.2
- **Zustand 4** avec middleware `persist` + AsyncStorage 2.x
- **React Navigation 6** (native-stack)
- **TypeScript strict**
- **Build APK** : `eas build --platform android --profile preview`

## Patterns établis

### State
- Un seul store Zustand : `src/store/gameStore.ts`
- Toute la logique métier (harvest, craft, respawn) vit dans le store
- Persistance automatique via `persist` middleware — ne pas utiliser `storage.ts` pour ça

### Composants jeu
- Les objets du monde (`Tree`, `Rock`, `House`) utilisent `position: 'absolute'`
- Leurs coordonnées viennent de `src/constants/gameConfig.ts`
- Le respawn est géré par `useRespawn` monté **une seule fois** dans `GameScene`

### Navigation
- Stack `Game` (principal) ↔ `Craft` (modal `slide_from_bottom`)
- Types de routes dans `RootStackParamList` (AppNavigator.tsx)

### Ajouter une ressource
1. Ajouter la clé dans `ResourceInventory` (`types/index.ts`)
2. Initialiser à `0` dans `initialResources` (`gameStore.ts`)
3. Ajouter l'emoji dans `HUD.tsx` et `CraftScreen.tsx`

### Ajouter une recette de craft
- Ajouter un objet dans `CRAFT_RECIPES` (`constants/craftRecipes.ts`) — c'est tout.

### Ajouter un objet récoltable
1. Créer le type dans `types/index.ts` (étend `HarvestableNode`)
2. Ajouter les positions initiales dans `gameConfig.ts`
3. Créer le composant dans `components/game/`
4. Ajouter les actions `harvest` + `respawn` dans `gameStore.ts`
5. Monter le composant dans `GameScene.tsx`

## Points d'attention

- `index.js` est le vrai point d'entrée (`registerRootComponent`) — ne pas supprimer
- `App.tsx` exporte le composant default, pas d'AppRegistry dedans
- `gap` dans StyleSheet est supporté (RN 0.71+) — OK à utiliser
- Le projet tourne sur **Expo Go 55.x** — les modules natifs custom nécessitent un dev build
- Node.js >= 20.19.4 requis (SDK 55 / metro 0.83)

## Commandes utiles

```bash
npx expo start --android     # dev sur device ADB/WiFi
npx expo start               # dev + QR code
npx expo install --fix       # corriger les versions de packages
eas build --platform android --profile preview   # APK
eas build --platform android --profile production # AAB (Play Store)
```
