# 🌴 Paradise — Jeu de récolte mobile

Jeu de survie / récolte mobile-first exportable en APK Android, construit sur React Native / Expo.

## Gameplay

Le joueur se déplace librement dans un monde ouvert via un **joystick virtuel**. Il ramasse des ressources en s'approchant des objets et en appuyant sur le **bouton d'action**.

**Progression principale :**
```
🌿 Buissons → Brindilles ×3 → 🪓 Hache en bois  → 🌲 Arbres → Bois  → 📋 Planches
⚫ Galets   → Galets ×3     → ⛏️ Pioche en pierre → 🪨 Rochers → Pierre → 🧱 Briques
```

**Contrôles :**
- Joystick (bas-gauche) → déplacer le joueur
- Bouton d'action (bas-droite) → interagir avec l'objet le plus proche (rayon 80 px)
  - 🟢 Vert : objet accessible → récolter
  - 🟠 Orange : outil requis non équipé
  - ⬜ Gris : aucun objet à portée
- Slot outil (HUD) → ouvrir l'Atelier

**Énergie :** chaque récolte coûte de l'énergie (1 à la main · 2 à l'outil). La barre se régénère avec le temps.

**Objets du monde :**

| Objet | Outil requis | Récolte | Respawn |
|-------|-------------|---------|---------|
| 🌿 Buisson | Aucun | 1 brindille | 6 s |
| ⚫ Tas de galets | Aucun | 1 galet | 8 s |
| 🌲 Arbre | 🪓 Hache en bois | 2 bois | 12 s |
| 🪨 Rocher | ⛏️ Pioche en pierre | 2 pierres | 18 s |

## Stack technique

| Outil | Version | Rôle |
|-------|---------|------|
| Expo SDK | 55 (managed) | Framework mobile |
| React Native | 0.83.2 | Runtime UI |
| React | 19.2 | UI |
| Zustand 4 | + persist + AsyncStorage | State + sauvegarde |
| React Navigation | 6 (native-stack) | Navigation |
| TypeScript | strict | Typage |
| EAS Build | — | Génération APK/AAB |

## Architecture

```
Paradise/
├── index.js                          ← Entrée (registerRootComponent)
├── App.tsx                           ← SafeAreaProvider + AppNavigator
├── app.json / eas.json               ← Config Expo + profils build
└── src/
    ├── types/index.ts                ← Tous les types partagés
    ├── constants/
    │   ├── gameConfig.ts             ← Timings, coûts énergie, positions initiales
    │   └── craftRecipes.ts           ← Recettes (data-driven)
    ├── store/
    │   ├── gameStore.ts              ← Monde : ressources, outils, nœuds récoltables
    │   └── playerStore.ts            ← Joueur : position, énergie, niveau, outil équipé
    ├── hooks/
    │   ├── useRespawn.ts             ← Respawn automatique (tick 1 s)
    │   ├── usePlayerMovement.ts      ← Mouvement joueur (tick 62 ms)
    │   └── useNearestHarvestable.ts  ← Détection proximité (tick 150 ms, rayon 80 px)
    ├── navigation/AppNavigator.tsx   ← Stack: MainMenu → Game / Craft / Inventory
    ├── screens/
    │   ├── MainMenuScreen.tsx        ← Menu principal
    │   ├── GameScreen.tsx            ← HUD + GameScene
    │   ├── CraftScreen.tsx           ← Atelier (outils + matériaux)
    │   └── InventoryScreen.tsx       ← Ressources + stats joueur
    └── components/
        ├── game/
        │   ├── GameScene.tsx         ← WorldLayer + ControlsOverlay
        │   ├── Tree / Rock           ← Objets récoltables (View purs)
        │   ├── Twig / PebbleCluster  ← Ressources de base (View purs)
        │   ├── ActionButton.tsx      ← Bouton d'interaction contextuel
        │   ├── PlayerCharacter.tsx   ← Sprite joueur (memo)
        │   └── VirtualJoystick.tsx   ← Joystick (PanResponder)
        └── hud/HUD.tsx               ← Ressources + barre énergie + slot outil
```

## Démarrage rapide

```bash
# Prérequis : Node >= 20.19.4, Expo Go 55.x sur Android

git clone https://github.com/creach-t/paradise.git
cd paradise
npm install
npx expo start --android   # device via ADB/WiFi
npx expo start             # QR code pour Expo Go
```

## Générer l'APK

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview    # APK (test)
eas build --platform android --profile production # AAB (Play Store)
# APK téléchargeable depuis expo.dev
```

## Extension prévue

| Fonctionnalité | Fichier cible |
|---|---|
| Monde scrollable | `ScrollView` + offset caméra centré sur le joueur dans `GameScene.tsx` |
| Animations bounce | `Animated.Value` dans `Tree.tsx` / `Rock.tsx` au moment du harvest |
| XP au harvest | `addXp(n)` dans les actions harvest du `gameStore.ts` |
| Ennemis | `EnemyNode extends HarvestableNode` + scan dans `useNearestHarvestable` |
| Sons | `expo-av` sur les events de récolte |
| Paramètres | `SettingsScreen` (son, langue, reset save) |
| Cercle de portée | Indicateur visuel autour du joueur (rayon = `INTERACT_RANGE`) |
