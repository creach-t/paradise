# CLAUDE.md — Contexte projet Paradise

Ce fichier donne à Claude le contexte nécessaire pour contribuer efficacement au projet.

## Vision du jeu

**Paradise est un jeu de farming/récolte** (pas de combat, pas de survie hardcore). Le joueur se déplace dans un monde ouvert scrollable, récolte des ressources, craft des outils et des matériaux de plus en plus élaborés. La progression est portée par l'**arbre de craft** (plus de recettes = accès à plus de zones et de ressources).

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

**Import circulaire gameStore ↔ playerStore** : résolu par `require()` dynamique dans les helpers `getEquippedTool()`, `consumePlayerEnergy()` et `addPlayerXp()` — ne jamais faire d'import statique entre ces deux fichiers.

## Monde scrollable

- **`WORLD_W = 800`, `WORLD_H = 1400`** dans `constants/gameConfig.ts`
- **Caméra** : `Animated.Value` (cameraX/Y) dans `GameScene.tsx`, mise à jour via `usePlayerStore.subscribe()` → `setValue()` — zéro re-render React
  - `ox = clamp(px - sw/2 + 20, 0, WORLD_W - sw)` (idem Y)
- **WorldLayer** : `Animated.View` de taille fixe `WORLD_W × WORLD_H` avec `transform: [translateX, translateY]`
- **usePlayerMovement** reçoit `{ w: WORLD_W, h: WORLD_H }` pour le clamping de la position
- **House** : position fixe `HOUSE_X = 155, HOUSE_Y = 370` dans `GameScene.tsx` (plus screen-relative)
- **Spawn** : `SCREEN_W / 2 - 20, 320` dans `playerStore.ts` (compatible sauvegardes)

## Système d'interaction par proximité

L'utilisateur contrôle le **joueur** (joystick), pas les objets du monde directement.

- Déplacement : `VirtualJoystick` → `directionRef` (ref partagée, 0 re-render) → `usePlayerMovement` (tick 62 ms)
- Détection : `useNearestHarvestable` poll à 150 ms → `HarvestTarget | null` (rayon 80 px)
- Interaction : `ActionButton` (bas-droite) déclenche `harvestXxx()` du gameStore
- Les composants nœuds (`Tree`, `Rock`, `Twig`, `PebbleCluster`) sont des **`View` purs** — aucun `TouchableOpacity`

## Cycle jour/nuit

- Hook `hooks/useDayNightCycle.ts` → retourne `Animated.Value` (opacité 0..`NIGHT_MAX_OPACITY`)
- Constantes dans `gameConfig.ts` : `DAY_CYCLE_MS = 300_000` (5 min), `NIGHT_MAX_OPACITY = 0.62`
- Formule : `(1 - cos(phase × 2π)) / 2 × MAX` — transition lisse sans palier
- Tick 1 s, `setValue()` sans re-render React
- Overlay `rgba(0, 0, 30, 1)` dans `GameScene.tsx`, entre WorldLayer et ControlsOverlay

## HUD

```
┌────────────────────────────────────────────┐
│  ☰  │  ⚡ ██████░░  80/100  Lv5  │  🪓   │
└────────────────────────────────────────────┘
```

- **☰** (gauche) : ouvre un `Modal` dropdown de navigation (Menu principal / Inventaire / Atelier / Paramètres)
- **Barre énergie + niveau** (centre, flex: 1)
- **Slot outil** (droite) : affiche l'outil équipé, clic → Atelier
- Les ressources ont été retirées du HUD → consultables dans l'Inventaire

## Paramètres

- `screens/SettingsScreen.tsx` : `Alert.alert` de confirmation → `resetGame()` + `resetPlayer()`
- Route `Settings` dans `AppNavigator.tsx` (slide_from_bottom)

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
Appliqué dans : `useRespawn`, `usePlayerMovement`, `useNearestHarvestable`, `useDayNightCycle`.

### Caméra (zéro re-render)
```typescript
// Dans GameScene, abonnement playerStore → Animated.Value.setValue()
useEffect(() => {
  const unsub = usePlayerStore.subscribe((state) => {
    const ox = Math.max(0, Math.min(WORLD_W - sw, state.player.x - sw / 2 + 20));
    const oy = Math.max(0, Math.min(WORLD_H - sh, state.player.y - sh / 2 + 20));
    cameraX.setValue(-ox);
    cameraY.setValue(-oy);
  });
  return unsub;
}, []);
```

### Récolte + énergie + XP
Chaque action `harvest` du gameStore :
1. Vérifie que le nœud n'est pas déjà récolté
2. Vérifie l'outil équipé (arbres/rochers)
3. Appelle `consumePlayerEnergy(cost)` → retourne `false` si insuffisant → bloque la récolte
4. Applique le harvest + démarre le timer de respawn
5. Appelle `addPlayerXp(amount)` → level-up automatique si seuil atteint

Coûts énergie : `HARVEST_ENERGY_HAND = 1` (brindilles, galets) · `HARVEST_ENERGY_TOOL = 2` (arbres, rochers)
XP : `XP_TWIG = 5` · `XP_PEBBLE = 5` · `XP_TREE = 15` · `XP_ROCK = 15`

### Persist — migration des sauvegardes
Le `merge` de `gameStore` gère deux niveaux de compatibilité ascendante :

```typescript
merge: (persistedState, currentState) => {
  // 1. Resources : deep merge → nouvelles clés tombent à 0
  // 2. Nœuds : on conserve l'état persisté ET on ajoute les nouveaux nœuds
  function mergeNodes(persisted, current) {
    const knownIds = new Set(persisted.map(n => n.id));
    return [...persisted, ...current.filter(n => !knownIds.has(n.id))];
  }
  return { ...currentState, ...ps, resources: {...}, trees: mergeNodes(...), ... };
}
```
**À reproduire à chaque ajout de clé dans `ResourceInventory` ou de nœuds dans `INITIAL_*`.**

### Navigation
- `initialRouteName: 'MainMenu'`
- Stack : `MainMenu` ↔ `Game` ↔ `Craft` / `Inventory` / `Settings` (slide_from_bottom)
- Depuis le jeu : menu hamburger ☰ dans le HUD → `Modal` dropdown
- Types de routes dans `RootStackParamList` (`AppNavigator.tsx`)

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
3. Ajouter les métadonnées dans `RESOURCE_META` (`InventoryScreen.tsx`)
4. ✅ Le `merge` du persist gère la compatibilité des sauvegardes existantes

### Ajouter une recette de craft
- Ajouter un objet dans `CRAFT_RECIPES` (`constants/craftRecipes.ts`) — c'est tout.

### Ajouter un objet récoltable
1. Créer le type dans `types/index.ts` (étend `HarvestableNode`)
2. Ajouter les positions initiales dans `gameConfig.ts`
3. Créer le composant dans `components/game/` — **`View` pur**, prop `isHighlighted`
4. Ajouter les actions `harvest` + `respawn` dans `gameStore.ts` (avec `consumePlayerEnergy` + `addPlayerXp`)
5. Enregistrer la demi-taille dans `SPRITE_HALF` (`useNearestHarvestable.ts`)
6. Appeler `scan(gs.newNodes, 'new_type', requiredTool)` dans le hook
7. Ajouter l'emoji + label dans `ActionButton.tsx`
8. Monter le composant dans `GameScene.tsx` avec `isHighlighted={target?.id === node.id}`

### Ajouter des positions de nœuds dans le monde
- Ajouter les entrées dans `INITIAL_TREES` / `INITIAL_ROCKS` / etc. (`gameConfig.ts`)
- Le `merge` de Zustand les injecte automatiquement dans les sauvegardes existantes (nouveaux IDs uniquement)

## Roadmap farming (par milestone)

### M1 — Fondations ✅
- [x] Monde scrollable — WORLD_W=800 × WORLD_H=1400, caméra Animated.Value centrée joueur
- [x] Cycle jour/nuit — useDayNightCycle (5 min, overlay rgba(0,0,30,1) + formule cosinus)
- [x] Paramètres — SettingsScreen (reset sauvegarde via Alert de confirmation)

### M2 — Farming core
- [ ] Potager — planter des graines → croissance (timer) → récolter (nouveau type de nœud)
- [ ] Nouvelles cultures — baies, céréales, champignons (ressources consommables)
- [ ] Arrosage — eau comme ressource, arroser accélère la pousse
- [ ] Compost / engrais — crafter à partir de ressources organiques

### M3 — Construction de base
- [ ] Maison évolutive — visuel change selon les ressources investies (bois → pierre → brique)
- [ ] Stockage étendu — coffre, grenier (augmente la capacité max de ressources)
- [ ] Atelier amélioré — forge débloque les recettes métal

### M4 — Progression craft
- [ ] Dégradation des outils — durabilité + réparation obligatoire
- [ ] Arbre de craft étendu — minerai → métal → outils métal → ressources rares
- [ ] Cuisine — feu de camp, recettes de transformation (fruit → jus, blé → farine → pain)
- [ ] Déblocage de recettes par niveau

### M5 — Monde & ambiance
- [ ] Zones débloquées progressivement — craft d'un item spécial = accès zone suivante
- [ ] Météo — pluie (+croissance cultures), sécheresse (-croissance), tempête
- [ ] Saisons — ressources différentes selon la saison (printemps/été/automne/hiver)
- [ ] Sons & musique — ambiance farming, effets de récolte
- [ ] Monstres rares — spawn nocturne uniquement, passifs si non provoqués

## Points d'attention

- `index.js` est le vrai point d'entrée (`registerRootComponent`) — ne pas supprimer
- `App.tsx` exporte le composant default, pas d'AppRegistry dedans
- `gap` dans StyleSheet est supporté (RN 0.71+) — OK à utiliser
- Le projet tourne sur **Expo Go 55.x** — les modules natifs custom nécessitent un dev build
- Node.js >= 20.19.4 requis (SDK 55 / metro 0.83)
- `useWindowDimensions()` dans GameScene (pas `Dimensions.get` au module level)
- `SPAWN_X/Y` dans `playerStore.ts` est calculé au module level avec `Dimensions.get()` — OK en portrait fixe

## Commandes utiles

```bash
npx expo start --android      # dev sur device ADB/WiFi
npx expo start                # dev + QR code
npx expo install --fix        # corriger les versions de packages
eas build --platform android --profile preview    # APK
eas build --platform android --profile production # AAB (Play Store)
```
