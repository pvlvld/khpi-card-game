import { Card as DatabaseCard } from "generated/prisma";

export interface PlayerState {
  socketId: string;
  userId: number;
  hp: number;
  coins: number;
  cards: Card[];
  playedCards: Card[];
  cardsOnDesk: Card["name"][];
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
    hasPassed: boolean;
    cardsOnDesk: Card["name"][];
  }[];
}
