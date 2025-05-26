import { Injectable } from '@nestjs/common';
import { GameState } from './interfaces/game-state.interface';

@Injectable()
export class GameStateService {
  private readonly activeGames: Map<number, GameState> = new Map();

  setGame(gameId: number, gameState: GameState) {
    this.activeGames.set(gameId, gameState);
  }

  getGame(gameId: number): GameState | undefined {
    return this.activeGames.get(gameId);
  }

  deleteGame(gameId: number) {
    this.activeGames.delete(gameId);
  }

  hasGame(gameId: number): boolean {
    return this.activeGames.has(gameId);
  }

  getAllGames(): Map<number, GameState> {
    return this.activeGames;
  }
} 