# 🌴 Paradise — Jeu de récolte mobile

Jeu de récolte mobile-first exportable en APK Android, construit sur React Native / Expo.

## Gameplay

- **Tap** sur un arbre → +1 Bois 🪵
- **Tap** sur un rocher → +1 Pierre 🪨
- Les objets **réapparaissent** automatiquement après un délai
- **Craft** : 5 Bois → Planche 📋 | 3 Pierre → Brique 🧱
- L'inventaire est **persisté** localement (survive aux redémarrages)

## Stack technique

| Outil | Rôle |
|---|---|
| Expo SDK 55 | Framework mobile managed |
| React Native 0.83 | Runtime UI |
| Zustand 4 + AsyncStorage | State management + persistance |
| React Navigation 6 | Navigation stack |
| TypeScript strict | Typage |
| EAS Build | Génération APK/AAB |

## Architecture

```
Paradise/
├── index.js                       ← Entrée (registerRootComponent)
├── App.tsx                        ← SafeAreaProvider + Navigator
├── app.json                       ← Config Expo
├── eas.json                       ← Profils build EAS
└── src/
    ├── types/index.ts             ← ResourceInventory, TreeNode, RockNode, CraftRecipe
    ├── constants/
    │   ├── gameConfig.ts          ← Timings respawn, positions initiales
    │   └── craftRecipes.ts        ← Recettes de craft
    ├── store/gameStore.ts         ← Store Zustand central
    ├── hooks/useRespawn.ts        ← Timer respawn (tick 1s)
    ├── utils/storage.ts           ← Helpers AsyncStorage
    ├── navigation/AppNavigator.tsx← Stack: Game ↔ Craft
    ├── screens/
    │   ├── GameScreen.tsx
    │   └── CraftScreen.tsx
    └── components/
        ├── game/
        │   ├── GameScene.tsx      ← Scène principale (fond + objets)
        │   ├── Tree.tsx           ← Arbre récoltable
        │   ├── Rock.tsx           ← Rocher récoltable
        │   └── House.tsx          ← Maison du joueur
        └── hud/
            └── HUD.tsx            ← Barre ressources + bouton Craft
```

## Démarrage rapide

```bash
# Prérequis : Node 22 LTS, npm, Expo Go sur Android

git clone https://github.com/creach-t/paradise.git
cd paradise
npm install
npx expo start --android
```

## Générer l'APK

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
# APK téléchargeable depuis expo.dev
```

## Extension prévue

| Fonctionnalité | Fichier cible |
|---|---|
| Énergie / stamina | `types/index.ts` + `HUD.tsx` |
| Animations (bounce tap) | `Animated.Value` dans `Tree.tsx` / `Rock.tsx` |
| Outils (hache, pioche) | `WOOD_PER_TAP` dynamique dans `gameConfig.ts` |
| Ennemis | Nouveau type `EnemyNode` + `gameStore.ts` |
| Monde scrollable | `ScrollView` / reanimated pan dans `GameScene.tsx` |
| Sons | `expo-av` sur les events de récolte |
