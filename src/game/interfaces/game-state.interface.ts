import {Card as DatabaseCard} from "generated/prisma";

export interface PlayerState {
  socketId: string;
  userId: number;
  username: string;
  hp: number;
  coins: number;
  cards: Card[];
  playedCards: Card[];
  hasPassed: boolean;
}

export type Card = Omit<DatabaseCard, "updatedAt" | "createdAt">;

export interface GameState {
  id: number;
  players: [PlayerState, PlayerState];
  currentPlayerIndex: number;
  round: number;
  isFinished: boolean;
  winnerId?: number;
  loserId?: number;
}

export interface GameConfig {
  initialHp: number;
  initialCoins: number;
  initialCards: number;
  coinsPerRound: number;
  turnTimeLimit: number;
}

export interface PublicGameState {
  id: number;
  round: number;
  isFinished: boolean;
  winnerId?: number;
  loserId?: number;
  currentPlayerIndex: number;
  players: {
    userId: number;
    hp: number;
    coins: number;
    cardsCount: number;
    cards: Card[] | null;
    playedCards: Card[];
    hasPassed: boolean;
  }[];
}
