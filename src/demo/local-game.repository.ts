import { RuleMode } from './game-rules';

export const AVATARS = ['male-1', 'male-2', 'male-3', 'male-4', 'male-5', 'female-1', 'female-2', 'female-3', 'female-4', 'female-5'] as const;
export interface PlayerProfile { id: string; name: string; avatar: string; }
export interface Turn { card: string; playerName: string; }
export interface StoredTable {
  version: 1;
  players: PlayerProfile[];
  stack: string[];
  playedCards: string[];
  currentPlayer: number;
  currentCard: string;
  started: boolean;
  ruleMode: RuleMode;
  history: Turn[];
}
export interface TableStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void; }
export type RestoreStatus = 'empty' | 'restored' | 'invalid' | 'unavailable';
const STORAGE_KEY = 'ring-of-fire.local.v1';
const cards = new Set(['ace', 'clubs', 'diamonds', 'hearts'].flatMap(suit => Array.from({ length: 13 }, (_, index) => suit + '_' + (index + 1))));

function validTable(value: unknown): value is StoredTable {
  if (!value || typeof value !== 'object') return false;
  const table = value as StoredTable;
  if (table.version !== 1 || typeof table.started !== 'boolean' || !['classic', 'alcohol-free'].includes(table.ruleMode)
    || !Array.isArray(table.players) || table.players.length > 8 || (table.started && table.players.length < 2)
    || !table.players.every(player => player && typeof player.id === 'string' && player.id.length > 0 && player.id.length <= 80
      && typeof player.name === 'string' && player.name.trim() === player.name && player.name.length > 0 && player.name.length <= 24
      && (AVATARS as readonly string[]).includes(player.avatar))) return false;
  if (new Set(table.players.map(player => player.id)).size !== table.players.length
    || new Set(table.players.map(player => player.name.toLowerCase())).size !== table.players.length) return false;
  if (!Number.isInteger(table.currentPlayer) || table.currentPlayer < 0 || table.currentPlayer >= Math.max(1, table.players.length)) return false;
  if (!Array.isArray(table.stack) || !Array.isArray(table.playedCards) || table.stack.length + table.playedCards.length !== 52) return false;
  const allCards = [...table.stack, ...table.playedCards];
  if (new Set(allCards).size !== 52 || !allCards.every(card => cards.has(card))) return false;
  if (table.currentCard !== (table.playedCards[table.playedCards.length - 1] || '')) return false;
  return Array.isArray(table.history) && table.history.length === table.playedCards.length && table.history.every((turn, index) =>
    turn && turn.card === table.playedCards[index] && typeof turn.playerName === 'string' && turn.playerName.trim().length > 0 && turn.playerName.length <= 24);
}

function browserStorage(): TableStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
}

/** Saves only this one device's table. No imports from Firebase or production configuration. */
export class LocalGameRepository {
  constructor(private readonly storage: TableStorage | null = browserStorage()) {}
  read(): { table: StoredTable | null; status: RestoreStatus } {
    if (!this.storage) return { table: null, status: 'unavailable' };
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (raw === null) return { table: null, status: 'empty' };
      const table: unknown = JSON.parse(raw);
      return validTable(table) ? { table, status: 'restored' } : { table: null, status: 'invalid' };
    } catch (error) { return { table: null, status: error instanceof SyntaxError ? 'invalid' : 'unavailable' }; }
  }
  save(table: StoredTable): boolean {
    if (!this.storage) return false;
    try { this.storage.setItem(STORAGE_KEY, JSON.stringify(table)); return true; } catch { return false; }
  }
  clear(): boolean {
    if (!this.storage) return false;
    try { this.storage.removeItem(STORAGE_KEY); return true; } catch { return false; }
  }
}
