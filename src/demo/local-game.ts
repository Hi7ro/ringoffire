import { Game } from '../models/game';
import { RuleMode, rulesFor } from './game-rules';
import { AVATARS, LocalGameRepository, PlayerProfile, StoredTable, Turn } from './local-game.repository';

/** Full shared-device game using the original shuffled deck with a local repository. */
export class LocalDemoGame {
  game = new Game();
  players: PlayerProfile[] = [];
  history: Turn[] = [];
  playerName = '';
  selectedAvatar: string = AVATARS[0];
  editingPlayerId: string | null = null;
  editorOpen = false;
  error = '';
  started = false;
  lastPlayer = '';
  ruleMode: RuleMode = 'classic';
  storageMessage = '';
  readonly avatars = AVATARS;
  private nextId = 1;

  constructor(private readonly repository = new LocalGameRepository()) {
    const restored = this.repository.read();
    if (restored.table) {
      this.apply(restored.table);
      this.storageMessage = 'Your saved table was restored. Continue on this device.';
    } else if (restored.status === 'invalid') this.storageMessage = 'The saved table could not be restored. Start a new table to replace it.';
    else if (restored.status === 'unavailable') this.storageMessage = 'Browser storage is unavailable. The table works for this visit only.';
    else this.storageMessage = 'Your table is saved only in this browser. No account or cloud connection.';
  }

  private apply(table: StoredTable): void {
    this.players = table.players.map(player => ({ ...player }));
    this.game.players = this.players.map(player => player.name);
    this.game.stack = [...table.stack]; this.game.playedCards = [...table.playedCards];
    this.game.currentPlayer = table.currentPlayer; this.game.currentCard = table.currentCard;
    this.started = table.started; this.ruleMode = table.ruleMode;
    this.history = table.history.map(turn => ({ ...turn }));
    this.lastPlayer = this.history[this.history.length - 1]?.playerName || '';
  }
  private snapshot(): StoredTable {
    return { version: 1, players: this.players.map(player => ({ ...player })), stack: [...this.game.stack], playedCards: [...this.game.playedCards],
      currentPlayer: this.game.currentPlayer, currentCard: this.game.currentCard, started: this.started, ruleMode: this.ruleMode, history: this.history.map(turn => ({ ...turn })) };
  }
  private save(): void {
    this.game.players = this.players.map(player => player.name);
    this.storageMessage = this.repository.save(this.snapshot()) ? 'Saved in this browser. Reload to continue this table.' : 'Could not save in this browser. You can keep playing for this visit.';
  }

  addPlayer(): void {
    const name = this.playerName.trim();
    if (!name || name.length > 24) { this.error = 'Enter a player name with 1 to 24 characters.'; return; }
    if (this.players.some(player => player.id !== this.editingPlayerId && player.name.toLowerCase() === name.toLowerCase())) { this.error = 'That player is already at the table.'; return; }
    if (!(this.avatars as readonly string[]).includes(this.selectedAvatar)) { this.error = 'Choose one of the available avatars.'; return; }
    if (this.editingPlayerId) {
      this.players = this.players.map(player => player.id === this.editingPlayerId ? { ...player, name, avatar: this.selectedAvatar } : player);
    } else {
      if (this.players.length >= 8) { this.error = 'This table supports up to 8 players.'; return; }
      let id: string;
      do { id = 'player-' + this.nextId++; } while (this.players.some(player => player.id === id));
      this.players.push({ id, name, avatar: this.selectedAvatar });
    }
    this.cancelEdit(); this.save();
  }
  editPlayer(player: PlayerProfile): void {
    this.editingPlayerId = player.id; this.playerName = player.name; this.selectedAvatar = player.avatar; this.editorOpen = true; this.error = '';
  }
  openPlayerEditor(): void { this.cancelEdit(); this.editorOpen = true; }
  cancelEdit(): void { this.editingPlayerId = null; this.playerName = ''; this.selectedAvatar = this.avatars[0]; this.error = ''; this.editorOpen = false; }
  removePlayer(id: string): void {
    if (this.started && this.players.length <= 2) { this.error = 'Keep at least two players in a running game. Clear the table to start with different players.'; return; }
    const index = this.players.findIndex(player => player.id === id);
    if (index < 0) return;
    const active = this.players[this.game.currentPlayer]?.id;
    this.players = this.players.filter(player => player.id !== id);
    const preserved = this.players.findIndex(player => player.id === active);
    this.game.currentPlayer = preserved >= 0 ? preserved : index % Math.max(1, this.players.length);
    this.cancelEdit(); this.save();
  }
  removeEditingPlayer(): void { if (this.editingPlayerId) this.removePlayer(this.editingPlayerId); }
  addSamplePlayers(): void {
    if (this.players.length) return;
    this.playerName = 'Alex'; this.selectedAvatar = this.avatars[0]; this.addPlayer();
    this.playerName = 'Sam'; this.selectedAvatar = this.avatars[5]; this.addPlayer();
  }
  startGame(): void {
    if (this.players.length < 2) { this.error = 'Add at least two players to start.'; return; }
    this.started = true; this.error = ''; this.editorOpen = false; this.save();
  }
  takeCard(): boolean {
    if (!this.started || this.players.length < 2) { this.error = 'Add at least two players and start the game first.'; return false; }
    if (!this.game.stack.length || this.game.pickCardAnimation) return false;
    this.lastPlayer = this.players[this.game.currentPlayer].name;
    this.game.currentCard = this.game.stack.pop()!;
    this.game.playedCards.push(this.game.currentCard);
    this.history.push({ card: this.game.currentCard, playerName: this.lastPlayer });
    this.game.currentPlayer = (this.game.currentPlayer + 1) % this.players.length;
    this.error = ''; this.save(); return true;
  }
  setRuleMode(mode: string): void {
    if (mode !== 'classic' && mode !== 'alcohol-free') return;
    this.ruleMode = mode; this.save();
  }
  get rules() { return rulesFor(this.ruleMode); }
  cardRank(card = this.game.currentCard): string { const number = Number(card.split('_')[1]); return ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' } as Record<number, string>)[number] || String(number); }
  suit(card = this.game.currentCard): string { return ({ ace: '♠', clubs: '♣', diamonds: '♦', hearts: '♥' } as Record<string, string>)[card.split('_')[0]] || ''; }
  cardName(card = this.game.currentCard): string {
    const number = Number(card.split('_')[1]);
    const rank = ({ 1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King' } as Record<number, string>)[number] || String(number);
    const suit = ({ ace: 'spades', clubs: 'clubs', diamonds: 'diamonds', hearts: 'hearts' } as Record<string, string>)[card.split('_')[0]] || '';
    return rank + ' of ' + suit;
  }
  isRed(): boolean { return /^(hearts|diamonds)_/.test(this.game.currentCard); }
  rule() { return this.rules[Number(this.game.currentCard.split('_')[1]) - 1] || { title: '', description: '' }; }
  restartRound(): void {
    this.game = new Game(); this.game.players = this.players.map(player => player.name);
    this.history = []; this.lastPlayer = ''; this.error = ''; this.cancelEdit(); this.save();
  }
  reset(): void {
    this.game = new Game(); this.players = []; this.history = []; this.started = false; this.lastPlayer = ''; this.ruleMode = 'classic'; this.cancelEdit();
    this.storageMessage = this.repository.clear() ? 'Saved table cleared. Add players for a new game.' : 'Table cleared for this visit. Browser storage could not be changed.';
  }
}
