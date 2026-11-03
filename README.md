# Ring of Fire

The original Angular 13 card game, with a complete shared-device local version. It keeps the poker welcome artwork, wood table, active-player highlight and 52-card game. Classic party rules are the default; alcohol-free challenges are a separate optional rule set.

## Play the full local version

```sh
npm ci
npm run start:local
```

Open **http://127.0.0.1:4307/demos/ring-of-fire/**. This entry imports no Firebase, Firestore, production environment or remote room. Existing locked Angular 13 dependencies work with the installed Node 20.20.2; no framework migration is performed here.

1. Add two to eight players, give each a name and choose from the ten original supplied avatars. You can edit names, change avatars or remove players before starting.
2. Start the game. Draw using the deck button or Tab + Enter/Space. A short draw animation prevents rapid duplicate clicks. The rule names the player who drew the card; the next player is highlighted separately.
3. Follow the classic party rule or select **Alcohol-free challenges**. All 13 rank rules are available in the expandable overview. The same 52-card deck and turn order apply to both sets.
4. Add or edit players during a round. Removing a player preserves the next active person; a running table must keep at least two people.
5. Expand **Played cards** to see the full ordered turn history. Once all 52 unique cards are played, the deck stops and **Play another round** becomes available.
6. **New round** reshuffles all 52 cards and clears history while preserving players, avatars and the selected rules. **Clear table** removes the saved table, all players and this game's browser-storage entry.
7. Reload the page to continue the same table, exact remaining deck, next turn, chosen avatars, rules and history.

State is saved only in this browser under `ring-of-fire.local.v1`, without accounts or network writes. Invalid/corrupt saved decks are rejected rather than merged into a game. If browser storage is blocked or full, a visible message explains that play works for this visit only. Other browser-storage keys are untouched. Local state is editable by its owner; it is not a server-authoritative multiplayer session.

## Build and check

```sh
npm run typecheck:demo
npm run build:demo
npm run test:demo
```

Run the tests **after** the build: the final test also inspects the generated artifact. The 13 focused tests cover player validation and limits, rename/avatar changes, removal and turn preservation, all 52 unique draws and history, both rule sets, exact saved continuation, corrupt data, blocked storage, new round versus full clear, animation locking/cleanup and separation from Firebase.

Copy only `dist/demo-ring-of-fire/` to `/demos/ring-of-fire/` on the static host. The generated `demo-manifest.json` lists its public files. The artifact contains browser code, ten original avatars and selected poker/wood/favicon assets; no environment files, cloud configuration, source files, maps, backend or dependencies should be published.

`src/demo/local-game.ts` contains the shared-device game logic, `game-rules.ts` the two explicit rule sets, and `local-game.repository.ts` the versioned browser repository. `DemoComponent` owns only the short animation timer and cleans it up when resetting or leaving. The original `Game` model supplies the shuffled deck; original online application files remain unchanged.

## Existing asset and online boundaries

The supplied `src/assets/cards/` folder is empty. Card faces and deck are therefore rendered with accessible HTML/CSS rank and suit rather than broken PNG references. The ten original avatars, poker art and wooden table are real supplied images. There are no dummy room buttons: this version is a full game for people sharing one device, without claiming remote synchronized multiplayer.

The original `npm start` / `npm run build` entry still targets the old Firebase application. It requires its configured Firebase project and missing original card assets. The local version does not import that configuration and does not read or write real Firebase data. No remote account, deployment or cloud migration was performed. Browser layout, touch/keyboard behavior and reload persistence still require a separate real-browser check after packaging.
