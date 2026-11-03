const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function modules(globals = {}) {
  const cache = new Map();
  function load(relative) {
    const file = path.resolve(root, relative);
    if (cache.has(file)) return cache.get(file);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
    const module = { exports: {} };
    cache.set(file, module.exports);
    const requireModule = id => id === '@angular/core' ? { Component: () => type => type } : load(path.relative(root, path.resolve(path.dirname(file), id)) + '.ts');
    vm.runInNewContext(code, { module, exports: module.exports, require: requireModule, console, Math, ...globals }, { filename: file });
    return module.exports;
  }
  return load;
}
function table(storage) {
  const load = modules();
  const { LocalDemoGame } = load('src/demo/local-game.ts');
  const { LocalGameRepository } = load('src/demo/local-game.repository.ts');
  return new LocalDemoGame(new LocalGameRepository(storage || null));
}
function memoryStorage() {
  const data = new Map();
  return { data, getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}
function add(game, name, avatar = 'male-1') { game.playerName = name; game.selectedAvatar = avatar; game.addPlayer(); }
function ready(storage) { const game = table(storage); add(game, 'Alex'); add(game, 'Sam', 'female-3'); game.startGame(); return game; }

test('starting requires two unique players and preserves trimmed names', () => {
  const game = table();
  game.startGame(); assert.equal(game.started, false);
  add(game, '   '); assert.equal(game.players.length, 0);
  add(game, ' Alex '); add(game, 'alex');
  assert.equal(game.players.length, 1); assert.equal(game.players[0].name, 'Alex'); assert.match(game.error, /already/);
  add(game, 'Sam'); game.startGame(); assert.equal(game.started, true);
});
test('the table supports up to eight players and validates avatar choices', () => {
  const game = table();
  add(game, 'Invalid', '../../private'); assert.equal(game.players.length, 0);
  for (let index = 0; index < 9; index++) add(game, 'Player ' + index);
  assert.equal(game.players.length, 8); assert.match(game.error, /8 players/);
});
test('renaming and changing an avatar preserve identity and reject duplicate names', () => {
  const game = ready(); const id = game.players[0].id;
  game.editPlayer(game.players[0]); add(game, 'Alexandra', 'female-5');
  assert.equal(game.players[0].id, id); assert.equal(game.players[0].name, 'Alexandra'); assert.equal(game.players[0].avatar, 'female-5');
  game.editPlayer(game.players[0]); add(game, 'sam');
  assert.equal(game.players[0].name, 'Alexandra'); assert.match(game.error, /already/);
});
test('removing a player preserves the active person and keeps two in a running game', () => {
  const game = ready(); add(game, 'Lee');
  game.takeCard(); const activeId = game.players[game.game.currentPlayer].id;
  game.removePlayer(game.players[0].id);
  assert.equal(game.players.length, 2); assert.equal(game.players[game.game.currentPlayer].id, activeId);
  game.removePlayer(activeId); assert.equal(game.players.length, 2); assert.match(game.error, /at least two/);
});
test('removing the active player advances to the next remaining player', () => {
  const game = ready(); add(game, 'Lee');
  game.takeCard(); game.removePlayer(game.players[1].id);
  assert.equal(game.players[game.game.currentPlayer].name, 'Lee');
});
test('52 unique cards rotate turns, carry history and stop at an empty deck', () => {
  const game = ready();
  assert.equal(new Set(game.game.stack).size, 52);
  game.takeCard(); assert.equal(game.lastPlayer, 'Alex'); assert.equal(game.game.currentPlayer, 1);
  assert.ok(game.rule().title); assert.ok(game.rule().description);
  for (let index = 1; index < 52; index++) assert.equal(game.takeCard(), true);
  assert.equal(game.game.stack.length, 0); assert.equal(new Set(game.game.playedCards).size, 52);
  assert.equal(game.history.length, 52); assert.equal(game.history[51].playerName, 'Sam');
  assert.equal(game.takeCard(), false); assert.equal(game.history.length, 52);
});
test('classic party rules are the default and alcohol-free mode is optional', () => {
  const game = ready();
  assert.equal(game.ruleMode, 'classic'); assert.equal(game.rules.length, 13); assert.match(game.rules[1].description, /sip/);
  game.setRuleMode('alcohol-free'); assert.equal(game.rules.length, 13); assert.equal(game.rules[5].title, 'Story circle');
  game.setRuleMode('foreign'); assert.equal(game.ruleMode, 'alcohol-free');
});
test('local restore keeps players, avatars, turn, exact deck order, history and rule mode', () => {
  const storage = memoryStorage(); const game = ready(storage);
  game.takeCard(); game.takeCard(); game.takeCard(); game.setRuleMode('alcohol-free');
  const restored = table(storage);
  assert.equal(restored.started, true); assert.equal(restored.game.stack.length, 49);
  assert.deepEqual([...restored.game.stack], [...game.game.stack]);
  assert.equal(restored.game.currentPlayer, 1); assert.equal(restored.game.currentCard, game.game.currentCard);
  assert.equal(restored.players[1].avatar, 'female-3'); assert.equal(restored.history.length, 3); assert.equal(restored.ruleMode, 'alcohol-free');
  restored.takeCard(); assert.equal(restored.lastPlayer, 'Sam'); assert.equal(restored.game.stack.length, 48);
});
test('invalid saved decks and corrupt data are rejected without executing or merging them', () => {
  const storage = memoryStorage(); const game = ready(storage); game.takeCard();
  const key = 'ring-of-fire.local.v1'; const original = JSON.parse(storage.data.get(key));
  original.stack[0] = original.stack[1]; storage.data.set(key, JSON.stringify(original));
  const rejected = table(storage); assert.equal(rejected.started, false); assert.equal(rejected.players.length, 0); assert.match(rejected.storageMessage, /could not be restored/);
  storage.data.set(key, '{broken'); assert.equal(table(storage).players.length, 0);
});
test('blocked storage leaves a fully playable game with an honest persistence message', () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  const game = ready(blocked); assert.equal(game.takeCard(), true); assert.equal(game.game.stack.length, 51); assert.match(game.storageMessage, /this visit/);
});
test('new round keeps players and avatars while clear table deletes only this saved game', () => {
  const storage = memoryStorage(); storage.data.set('unrelated', 'keep'); const game = ready(storage);
  game.takeCard(); game.restartRound(); assert.equal(game.started, true); assert.equal(game.game.stack.length, 52); assert.equal(game.game.currentPlayer, 0);
  assert.equal(game.players[1].avatar, 'female-3'); assert.equal(game.history.length, 0);
  game.reset(); assert.equal(game.started, false); assert.equal(game.players.length, 0); assert.equal(storage.data.has('ring-of-fire.local.v1'), false); assert.equal(storage.data.get('unrelated'), 'keep');
});
test('draw animation locks rapid clicks and timers are cleared on restart/destroy', () => {
  const timers = new Map(); let nextTimer = 1;
  const load = modules({ setTimeout: callback => { const id = nextTimer++; timers.set(id, callback); return id; }, clearTimeout: id => timers.delete(id) });
  const { DemoComponent } = load('src/demo/demo.component.ts'); const game = new DemoComponent();
  add(game, 'Alex'); add(game, 'Sam'); game.startGame();
  assert.equal(game.takeCard(), true); assert.equal(game.takeCard(), false); assert.equal(game.game.stack.length, 51); assert.equal(timers.size, 1);
  game.restartRound(); assert.equal(timers.size, 0); assert.equal(game.game.pickCardAnimation, false); assert.equal(game.game.stack.length, 52);
  game.takeCard(); game.ngOnDestroy(); assert.equal(timers.size, 0);
});
test('the built local game excludes Firebase, source maps and missing card-image paths', () => {
  const output = path.join(root, 'dist/demo-ring-of-fire');
  const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8'); assert.ok(html.includes('/demos/ring-of-fire/')); assert.ok(!html.includes('fonts.googleapis.com'));
  for (const name of fs.readdirSync(output).filter(name => name.endsWith('.js'))) {
    const code = fs.readFileSync(path.join(output, name), 'utf8');
    for (const forbidden of ['firestore.googleapis.com', 'firebaseio.com', 'initializeApp(', 'AngularFirestore', '/assets/cards/']) assert.ok(!code.includes(forbidden), 'Unexpected production dependency: ' + forbidden);
  }
  assert.equal(fs.readdirSync(path.join(output, 'assets/player')).length, 10);
});
