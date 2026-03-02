# CLAUDE.md — Contexte projet Paradise

Ce fichier donne à Claude le contexte nécessaire pour contribuer efficacement au projet.

## Stack

- **Expo SDK 55** (managed workflow) — React Native 0.83.2 — React 19.2
- **Zustand 4** avec middleware `persist` + AsyncStorage 2.x
- **React Navigation 6** (native-stack)
- **TypeScript strict**
- **Build APK** : `eas build --platform android --profile preview`

## Architecture des stores

Deux stores séparés, tous deux persistés :

| Store | Clé AsyncStorage | Contenu |
|-------|-----------------|---------|
| `gameStore.ts` | `paradise-save` | Ressources, outils craftés, état du monde (arbres, rochers, buissons, galets) |
| `playerStore.ts` | `paradise-player` | Position joueur, stats (énergie, niveau, XP), outil équipé |

**Import circulaire gameStore ↔ playerStore** : résolu par `require()` dynamique dans les helpers `getEquippedTool()` et `consumePlayerEnergy()` — ne jamais faire d'import statique entre ces deux fichiers.

## Système d'interaction par proximité

L'utilisateur contrôle le **joueur** (joystick), pas les objets du monde directement.

- Déplacement : `VirtualJoystick` → `directionRef` (ref partagée, 0 re-render) → `usePlayerMovement` (tick 62 ms)
- Détection : `useNearestHarvestable` poll à 150 ms → `HarvestTarget | null` (rayon 80 px)
- Interaction : `ActionButton` (bas-droite) déclenche `harvestXxx()` du gameStore
- Les composants nœuds (`Tree`, `Rock`, `Twig`, `PebbleCluster`) sont des **`View` purs** — aucun `TouchableOpacity`

## Patterns établis

### Boucles de jeu (zéro re-render)
```typescript
// Pattern stable : getState() dans le callback, deps: []
useEffect(() => {
  const id = setInterval(() => {
    const state = useGameStore.getState(); // pas de subscription
    // ...
  }, TICK_MS);
  return () => clearInterval(id);
}, []); // stable, jamais recréé
```
Appliqué dans : `useRespawn`, `usePlayerMovement`, `useNearestHarvestable`.

### Récolte + énergie
Chaque action `harvest` du gameStore :
1. Vérifie que le nœud n'est pas déjà récolté
2. Vérifie l'outil équipé (arbres/rochers)
3. Appelle `consumePlayerEnergy(cost)` → retourne `false` si insuffisant → bloque la récolte
4. Applique le harvest + démarre le timer de respawn

Coûts : `HARVEST_ENERGY_HAND = 1` (brindilles, galets) · `HARVEST_ENERGY_TOOL = 2` (arbres, rochers)

### Persist — migration des sauvegardes
Le store `gameStore` utilise un `merge` personnalisé pour éviter le bug `NaN` :
```typescript
merge: (persistedState, currentState) => ({
  ...currentState,
  ...persistedState,
  resources: {
    ...currentState.resources,          // valeurs par défaut (0) pour toutes les clés
    ...(persistedState.resources ?? {}), // valeurs persistées écrasent si présentes
  },
})
```
**À reproduire à chaque ajout de clé dans `ResourceInventory`** — ce merge garantit la compatibilité ascendante.

### Navigation
- `initialRouteName: 'MainMenu'`
- Stack : `MainMenu` ← → `Game` ← → `Craft` (slide_from_bottom) / `Inventory` (slide_from_bottom)
- Types de routes dans `RootStackParamList` (AppNavigator.tsx)

### Composants monde
- `position: 'absolute'`, coordonnées depuis `gameConfig.ts`
- `pointerEvents="none"` — les touches passent au travers vers le joystick
- Prop `isHighlighted?: boolean` → fond vert doux si cible d'interaction courante
- Badge 🪓/⛏️ sur `Tree`/`Rock` si outil non équipé (feedback visuel permanent)

## Recettes (data-driven)

Ajouter un objet dans `CRAFT_RECIPES` (`constants/craftRecipes.ts`) — c'est tout.

Union discriminée : `ResourceRecipe (category: 'resource')` | `ToolRecipe (category: 'tool')`.

## Guides d'extension

### Ajouter une ressource
1. Ajouter la clé dans `ResourceInventory` (`types/index.ts`)
2. Initialiser à `0` dans `initialResources` (`gameStore.ts`)
3. Ajouter l'emoji dans `HUD.tsx` et `CraftScreen.tsx`
4. ✅ Le `merge` du persist gère la compatibilité des sauvegardes existantes

### Ajouter une recette de craft
- Ajouter un objet dans `CRAFT_RECIPES` (`constants/craftRecipes.ts`) — c'est tout.

### Ajouter un objet récoltable
1. Créer le type dans `types/index.ts` (étend `HarvestableNode`)
2. Ajouter les positions initiales dans `gameConfig.ts`
3. Créer le composant dans `components/game/` — **`View` pur**, prop `isHighlighted`
4. Ajouter les actions `harvest` + `respawn` dans `gameStore.ts` (avec `consumePlayerEnergy`)
5. Enregistrer la demi-taille dans `SPRITE_HALF` (`useNearestHarvestable.ts`)
6. Appeler `scan(gs.newNodes, 'new_type', requiredTool)` dans le hook
7. Ajouter l'emoji + label dans `ActionButton.tsx`
8. Monter le composant dans `GameScene.tsx` avec `isHighlighted={target?.id === node.id}`

## Points d'attention

- `index.js` est le vrai point d'entrée (`registerRootComponent`) — ne pas supprimer
- `App.tsx` exporte le composant default, pas d'AppRegistry dedans
- `gap` dans StyleSheet est supporté (RN 0.71+) — OK à utiliser
- Le projet tourne sur **Expo Go 55.x** — les modules natifs custom nécessitent un dev build
- Node.js >= 20.19.4 requis (SDK 55 / metro 0.83)
- `useWindowDimensions()` dans GameScene (pas `Dimensions.get` au module level)

## Commandes utiles

```bash
npx expo start --android      # dev sur device ADB/WiFi
npx expo start                # dev + QR code
npx expo install --fix        # corriger les versions de packages
eas build --platform android --profile preview    # APK
eas build --platform android --profile production # AAB (Play Store)
```
