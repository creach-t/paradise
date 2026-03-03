# 🌴 Paradise — Jeu de farming mobile

Jeu de **farming et récolte** mobile-first exportable en APK Android, construit sur React Native / Expo.

Pas de combat, pas de survie hardcore — juste le plaisir de récolter, crafter, et construire progressivement dans un monde ouvert.

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

**Énergie :** chaque récolte coûte de l'énergie (1 à la main · 2 à l'outil).

**XP & niveau :** chaque récolte rapporte de l'XP (5 pour buissons/galets · 15 pour arbres/rochers). Level-up automatique avec scaling.

**Objets du monde :**

| Objet | Outil requis | Récolte | XP | Respawn |
|-------|-------------|---------|-----|---------|
| 🌿 Buisson | Aucun | 1 brindille | +5 | 6 s |
| ⚫ Tas de galets | Aucun | 1 galet | +5 | 8 s |
| 🌲 Arbre | 🪓 Hache en bois | 2 bois | +15 | 12 s |
| 🪨 Rocher | ⛏️ Pioche en pierre | 2 pierres | +15 | 18 s |

## Stack technique

| Outil | Version | Rôle |
|-------|---------|------|
| Expo SDK | 55 (managed) | Framework mobile |
| React Native | 0.83.2 | Runtime UI |
| React | 19.2 | UI |
| Zustand 4 | + persist + AsyncStorage | State + sauvegarde locale |
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
    │   ├── gameConfig.ts             ← Timings, XP, coûts énergie, positions initiales
    │   └── craftRecipes.ts           ← Recettes (data-driven)
    ├── store/
    │   ├── gameStore.ts              ← Monde : ressources, outils, nœuds récoltables
    │   └── playerStore.ts            ← Joueur : position, énergie, niveau, XP, outil équipé
    ├── hooks/
    │   ├── useRespawn.ts             ← Respawn automatique (tick 1 s)
    │   ├── usePlayerMovement.ts      ← Mouvement joueur (tick 62 ms)
    │   └── useNearestHarvestable.ts  ← Détection proximité (tick 150 ms, rayon 80 px)
    ├── navigation/AppNavigator.tsx   ← Stack: MainMenu → Game / Craft / Inventory
    ├── screens/
    │   ├── MainMenuScreen.tsx        ← Menu principal
    │   ├── GameScreen.tsx            ← HUD + GameScene
    │   ├── CraftScreen.tsx           ← Atelier (outils + matériaux)
    │   └── InventoryScreen.tsx       ← Ressources + stats joueur (XP, énergie)
    └── components/
        ├── game/
        │   ├── GameScene.tsx         ← WorldLayer + ControlsOverlay
        │   ├── Tree / Rock           ← Objets récoltables (View purs, isHighlighted)
        │   ├── Twig / PebbleCluster  ← Ressources de base (View purs, isHighlighted)
        │   ├── ActionButton.tsx      ← Bouton d'interaction contextuel
        │   ├── PlayerCharacter.tsx   ← Sprite joueur (React.memo)
        │   └── VirtualJoystick.tsx   ← Joystick (PanResponder, 0 re-render)
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
```

## Roadmap

| Milestone | Fonctionnalité |
|-----------|---------------|
| **M1** | Monde scrollable — caméra suit le joueur |
| **M1** | Cycle jour/nuit — rythme farming |
| **M1** | Paramètres — son, reset save |
| **M2** | Potager — planter → faire pousser → récolter |
| **M2** | Nouvelles cultures — baies, céréales, champignons |
| **M2** | Arrosage & compost |
| **M3** | Maison évolutive (bois → pierre → brique) |
| **M3** | Stockage étendu — coffres, grenier |
| **M4** | Dégradation des outils + réparation |
| **M4** | Arbre de craft étendu — métal, cuisine, textile |
| **M5** | Zones débloquées progressivement |
| **M5** | Météo & saisons — impact sur les cultures |
| **M5** | Monstres rares — spawn nocturne uniquement |
