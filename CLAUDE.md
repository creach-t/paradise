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

## Couche domaine (`src/domain/`)

Fonctions TypeScript pures — **zéro dépendance** React, Expo ou Zustand. Testables en isolation.

| Fichier | Contenu |
|---------|---------|
| `domain/player.ts` | `applyXpGain(stats, amount)`, `consumeEnergy(stats, cost)`, `regenEnergy(stats, amount)` |
| `domain/harvest.ts` | `harvestTree/Rock/Twig/Pebble/Water(node, stats, equippedTool?)` → `HarvestResult` |

`HarvestResult` = `{ ok: true, resourceDelta, respawnDelay, nextStats }` | `{ ok: false, reason }`.

Les stores appellent ces fonctions puis appliquent le résultat — ils ne contiennent plus de logique métier.

## Architecture des stores

Deux stores séparés, tous deux persistés :

| Store | Clé AsyncStorage | Contenu |
|-------|-----------------|---------|
| `gameStore.ts` | `paradise-save` | Ressources, outils craftés, état du monde (arbres, rochers, buissons, galets) |
| `playerStore.ts` | `paradise-player` | Position joueur, stats (énergie, niveau, XP), outil équipé |

**Sens des imports** : `gameStore` → `playerStore` (import statique, sens unique). `playerStore` n'importe pas `gameStore`. Les anciens `require()` dynamiques ont été supprimés.

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
- Détection : `useNearestHarvestable` poll à 150 ms → `HarvestTarget | null` (rayon 25 px)
- Interaction : `ActionButton` (bas-droite) déclenche `harvestXxx()` du gameStore
- Les composants nœuds (`Tree`, `Rock`, `Twig`, `PebbleCluster`) sont des **`View` purs** — aucun `TouchableOpacity`

## Cycle jour/nuit

- Hook `hooks/useDayNightCycle.ts` → retourne `Animated.Value` (opacité 0..`BALANCE.NIGHT_MAX_OPACITY`)
- Constantes dans `constants/balance.ts` : `BALANCE.DAY_CYCLE_MS = 300_000` (5 min), `BALANCE.NIGHT_MAX_OPACITY = 0.62`
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

Les actions `harvest` du gameStore sont des **orchestrateurs** — la logique est dans `domain/harvest.ts` :

```typescript
// Pattern dans gameStore
harvestTree: (id) => {
  const node = get().trees.find((t) => t.id === id);
  if (!node) return;
  const { player, equippedTool } = usePlayerStore.getState();
  const result = domainHarvestTree(node, player.stats, equippedTool);
  if (!result.ok) return;                          // wrong_tool | no_energy | already_harvested
  set((s) => ({ resources: applyResourceDelta(s.resources, result.resourceDelta),
                trees: s.trees.map(...respawnAt...) }));
  usePlayerStore.setState((ps) => ({ player: { ...ps.player, stats: result.nextStats } }));
},
```

`domain/harvest.ts` valide les préconditions, consomme l'énergie (`domain/player.ts`) et calcule l'XP.
`domain/player.ts` expose `applyXpGain`, `consumeEnergy`, `regenEnergy` (fonctions pures, testables sans store).

Coûts énergie : `BALANCE.HARVEST_ENERGY_HAND = 1` (brindilles, galets) · `BALANCE.HARVEST_ENERGY_TOOL = 2` (arbres, rochers)
XP : `BALANCE.XP_TWIG = 5` · `BALANCE.XP_PEBBLE = 5` · `BALANCE.XP_TREE = 15` · `BALANCE.XP_ROCK = 15`

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
- **Assets PNG** dans `assets/` : `tree.png` / `tree_cut.png`, `trio-tree.png` / `trio-tree_cut.png`, `rock.png` / `rock_mined.png`, `branch.png`, `little-rock.png`, `house.png`
- **Variante `trio_`** : `Tree` choisit `trio-tree.png` si `id.startsWith('trio_')`, sinon `tree.png`
- **État récolté** : `Twig`/`PebbleCluster` → `return null` (disparaît, pop à respawn) ; `Tree`/`Rock` → affichent le sprite coupé/miné
- **Depth sort** dans `GameScene` : tous les nœuds + maison triés par Y croissant avant render → rendu 2.5D (bas de l'écran = devant)

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
2. Ajouter les positions initiales dans `gameConfig.ts` (`INITIAL_xxx`)
3. Créer le composant dans `components/game/` — **`View` pur**, prop `isHighlighted`
4. Ajouter la fonction `harvestXxx(node, stats, equippedTool?)` dans `domain/harvest.ts` (appel `attempt(...)`)
5. Ajouter les coûts/XP/délai dans `constants/balance.ts` (`BALANCE`)
6. Ajouter les actions `harvestXxx` + `respawnXxx` dans `gameStore.ts` (pattern orchestrateur : appel domain → `set()` + `usePlayerStore.setState()`)
7. Enregistrer la demi-taille dans `SPRITE_HALF` (`useNearestHarvestable.ts`)
8. Appeler `scan(gs.newNodes, 'new_type', requiredTool)` dans le hook
9. Ajouter l'asset image (ou emoji fallback) + label dans `ActionButton.tsx` (`NODE_IMAGE` / `NODE_EMOJI` / `ACTION_LABEL`)
10. Monter le composant dans `GameScene.tsx` avec `isHighlighted={target?.id === node.id}`

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

#### Craft progressif par station
- [ ] Ajouter un champ `station: CraftStation` sur chaque `CraftRecipe` dans `craftRecipes.ts`
  - `CraftStation = 'hands' | 'workbench' | 'forge' | 'kitchen'`
- [ ] **Niveau 1 — Sur soi (`hands`)** : recettes simples débloquées dès le départ (hache en bois, pioche en pierre) — accessibles depuis n'importe où dans le monde
- [ ] **Niveau 2 — Atelier (`workbench`)** : le joueur doit être en proximité d'un établi placé dans le monde (`INTERACT_RANGE`) pour accéder aux recettes intermédiaires (planches, briques, outils améliorés)
- [ ] **Niveau 3 — Forge (`forge`)** : structure débloquée par craft ou niveau — recettes métal (lingot, outil en acier)
- [ ] **Niveau 4 — Cuisine (`kitchen`)** : feu de camp ou cuisinière — recettes de transformation alimentaire
- [ ] `CraftScreen.tsx` : filtrer et afficher les recettes selon la station active (contexte d'ouverture : depuis le HUD = `hands` uniquement, depuis la proximité d'une station = recettes de cette station + hands)
- [ ] Indicateur visuel sur les recettes verrouillées par station (icône de la station requise + label "Atelier requis")
- [ ] Ajouter les stations comme nœuds interactifs dans le monde (même pattern que arbres/rochers : `position: absolute`, `isHighlighted`, `INTERACT_RANGE`)

#### Reste de M4
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

### M6 — Moteur monde (génération, hitboxes, layers)

#### Système de layers
- [ ] Définir l'ordre de rendu en 5 couches explicites dans `GameScene.tsx` :
  - **Layer 0 — Sol** (`TerrainLayer`) : tuiles de fond (herbe, terre, sable, eau)
  - **Layer 1 — Décorations** (`DecoLayer`) : herbes hautes, fleurs, cailloux visuels (pas d'interaction)
  - **Layer 2 — Objets** (`ObjectLayer`) : nœuds récoltables actuels (arbres, rochers, buissons, galets) + structures (maison)
  - **Layer 3 — Joueur** (`PlayerCharacter`) : z-index 10, déjà en place
  - **Layer 4 — FX / Overlay** : particules de récolte, overlay jour/nuit, effets météo
- [ ] Typer le système avec `LayerId = 0 | 1 | 2 | 3 | 4` et associer chaque composant monde à son layer

#### Génération de map
- [ ] Définir un format de chunk/tuile : `Tile = { type: TileType; variant: number }` dans `types/index.ts`
- [ ] `TileType` : `'grass' | 'dirt' | 'sand' | 'water' | 'stone_floor'`
- [ ] Générateur procédural (`utils/mapGen.ts`) : bruit de Perlin ou Simplex 2D → grille `WORLD_W/TILE_SIZE × WORLD_H/TILE_SIZE`
  - Utiliser une graine (`seed`) stockée dans `gameStore` pour reproductibilité (sauvegarde stable)
  - Palette de biomes : prairie centrale, lisière rocheuse (nord/est), plage (sud), forêt dense (ouest)
- [ ] `TerrainLayer` : affiche la grille de tuiles via `FlatList` horizontale ou `View` grid avec `position: absolute` par tuile
  - Taille de tuile conseillée : `TILE_SIZE = 40` (20×35 tuiles sur WORLD_W×WORLD_H)
- [ ] Placement procédural des nœuds : `spawnNodes(seed, biome)` remplace les tableaux statiques `INITIAL_TREES` / `INITIAL_ROCKS` etc.
  - Respect des contraintes : pas de spawn sur eau, pas de chevauchement, densité par biome
  - Compatible avec le système de `merge` Zustand (IDs stables basés sur seed + index)

#### Hitboxes & collisions joueur
- [ ] Définir `CollisionRect = { x: number; y: number; w: number; h: number }` dans `types/index.ts`
- [ ] Table de hitboxes statiques par type de nœud dans `constants/hitboxes.ts` :
  - `Tree` : `{ w: 36, h: 48, offsetY: -16 }` (tronc, pas le feuillage)
  - `Rock` : `{ w: 32, h: 28, offsetY: 0 }`
  - `House` : `{ w: 80, h: 60, offsetY: 10 }`
  - Tuile `water` / `stone_floor` : toute la tuile bloquante ou glissante
- [ ] Hook `useCollision.ts` : appelé dans `usePlayerMovement` avant d'appliquer le déplacement
  - Pattern : tester `nextX/nextY` contre la liste des `CollisionRect` actifs → bloquer ou ajuster
  - Ne reconstruire la liste des rects actifs que quand `trees/rocks` changent (memo/ref stable)
  - Périmètre initial : bloquer arbres + rochers + maison + tuiles eau
- [ ] Hitbox de récolte distincte de la hitbox de collision (interaction = `INTERACT_RANGE 80px` centre-à-centre, déjà en place — ne pas confondre)

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
