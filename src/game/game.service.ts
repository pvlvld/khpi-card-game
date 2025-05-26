import {Injectable, Logger} from "@nestjs/common";
import {Game, Prisma, Card as PrismaCard} from "generated/prisma";
import {PrismaService} from "src/prisma/prisma.service";
import {CardService} from "src/card/card.service";
import {
  GameState,
  PlayerState,
  GameConfig,
  Card,
  PublicGameState
} from "./interfaces/game-state.interface";
import {Server} from "socket.io";

class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameError";
  }
}

class GameNotFoundError extends GameError {
  constructor(gameId: number) {
    super(`Game not found: ${gameId}`);
    this.name = "GameNotFoundError";
  }
}

class PlayerNotFoundError extends GameError {
  constructor(username: string) {
    super(`Player not found: ${username}`);
    this.name = "PlayerNotFoundError";
  }
}

class NotYourTurnError extends GameError {
  constructor() {
    super("Not your turn");
    this.name = "NotYourTurnError";
  }
}

class CardNotFoundError extends GameError {
  constructor(cardId: number) {
    super(`Card not found: ${cardId}`);
    this.name = "CardNotFoundError";
  }
}

class NotEnoughCoinsError extends GameError {
  constructor(required: number, available: number) {
    super(`Not enough coins. Required: ${required}, Available: ${available}`);
    this.name = "NotEnoughCoinsError";
  }
}

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);
  private readonly activeGames: Map<number, GameState> = new Map();
  private readonly turnTimers: Map<number, NodeJS.Timeout> = new Map();
  private server?: Server;
  private readonly gameConfig: GameConfig = {
    initialHp: 30,
    initialCoins: 3,
    initialCards: 4,
    coinsPerRound: 2,
    turnTimeLimit: 30
  };

  constructor(
    private prisma: PrismaService,
    private cardService: CardService
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  async startGame(player1Id: number, player2Id: number): Promise<Game> {
    const game = await this.createGame({
      winner: undefined,
      loser: undefined
    });

    console.log(game);

    const gameState: GameState = {
      id: game.id,
      players: [
        await this.initializePlayerState(player1Id),
        await this.initializePlayerState(player2Id)
      ],
      currentPlayerIndex: Math.random() < 0.5 ? 0 : 1,
      round: 1,
      isFinished: false
    };

    this.activeGames.set(game.id, gameState);
    return game;
  }

  private async initializePlayerState(userId: number): Promise<PlayerState> {
    const prismaCards = await this.cardService.getRandomCards(
      this.gameConfig.initialCards
    );
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
      select: {username: true}
    });
    const cards: Card[] = prismaCards.map((card) => ({
      id: card.id,
      name: card.name,
      description: card.description,
      imageUrl: card.imageUrl,
      cost: card.cost,
      damage: card.damage,
      defence: card.defence
    }));

    return {
      userId,
      socketId: "",
      username: user?.username || `Player_${userId}`,
      hp: this.gameConfig.initialHp,
      coins: this.gameConfig.initialCoins,
      cards,
      playedCards: [],
      hasPassed: false
    };
  }

  async joinGame(
    socketId: string,
    gameId: number,
    username: string
  ): Promise<GameState> {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) {
      throw new GameNotFoundError(gameId);
    }

    const playerIndex = gameState.players.findIndex(
      (p) => p.username === username
    );
    if (playerIndex === -1) {
      throw new PlayerNotFoundError(username);
    }

    gameState.players[playerIndex].socketId = socketId;
    return gameState;
  }

  async handlePlayerDisconnect(socketId: string) {
    for (const [gameId, gameState] of this.activeGames.entries()) {
      const playerIndex = gameState.players.findIndex(
        (p) => p.socketId === socketId
      );
      if (playerIndex !== -1) {
        // Handle player disconnect - mark them as loser
        await this.endGame(
          gameId,
          gameState.players[1 - playerIndex].userId,
          gameState.players[playerIndex].userId
        );
        break;
      }
    }
  }

  private startTurnTimer(gameId: number) {
    this.clearTurnTimer(gameId);

    const gameState = this.activeGames.get(gameId);
    if (!gameState || gameState.isFinished) return;

    const timer = setTimeout(async () => {
      const currentGameState = this.activeGames.get(gameId);
      if (!currentGameState || currentGameState.isFinished) return;

      const currentPlayer =
        currentGameState.players[currentGameState.currentPlayerIndex];
      this.logger.log(
        `Turn time limit reached for player ${currentPlayer.userId} in game ${gameId}`
      );

      // Auto pass the round
      await this.passRound(currentPlayer.socketId, gameId);
    }, this.gameConfig.turnTimeLimit * 1000);

    this.turnTimers.set(gameId, timer);
  }

  private clearTurnTimer(gameId: number) {
    const timer = this.turnTimers.get(gameId);
    if (timer) {
      clearTimeout(timer);
      this.turnTimers.delete(gameId);
    }
  }

  private getPublicGameState(
    gameState: GameState,
    forPlayerIndex: number
  ): PublicGameState {
    const currentPlayer = gameState.players[forPlayerIndex];
    const opponent = gameState.players[1 - forPlayerIndex];

    return {
      id: gameState.id,
      round: gameState.round,
      isFinished: gameState.isFinished,
      winnerId: gameState.winnerId,
      loserId: gameState.loserId,
      currentPlayerIndex: gameState.currentPlayerIndex,
      players: [
        {
          userId: currentPlayer.userId,
          hp: currentPlayer.hp,
          coins: currentPlayer.coins,
          cardsCount: currentPlayer.cards.length,
          cards: currentPlayer.cards,
          playedCards: currentPlayer.playedCards,
          hasPassed: currentPlayer.hasPassed
        },
        {
          userId: opponent.userId,
          hp: opponent.hp,
          coins: opponent.coins,
          cardsCount: opponent.cards.length,
          cards: null,
          playedCards: opponent.playedCards,
          hasPassed: opponent.hasPassed
        }
      ]
    };
  }

  private broadcastGameState(gameState: GameState) {
    gameState.players.forEach((player, index) => {
      if (player.socketId) {
        const publicState = this.getPublicGameState(gameState, index);
        this.server?.to(player.socketId).emit("gameStateUpdate", publicState);
      }
    });
  }

  async playCard(
    socketId: string,
    gameId: number,
    cardId: number
  ): Promise<GameState> {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) {
      throw new GameNotFoundError(gameId);
    }

    const playerIndex = gameState.players.findIndex(
      (p) => p.socketId === socketId
    );
    if (playerIndex === -1 || playerIndex !== gameState.currentPlayerIndex) {
      throw new NotYourTurnError();
    }

    const player = gameState.players[playerIndex];
    const cardIndex = player.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      throw new CardNotFoundError(cardId);
    }

    const card = player.cards[cardIndex];
    if (card.cost > player.coins) {
      throw new NotEnoughCoinsError(card.cost, player.coins);
    }

    // Play the card
    player.coins -= card.cost;
    player.playedCards.push(card);
    player.cards.splice(cardIndex, 1);

    // Switch turns
    gameState.currentPlayerIndex = 1 - gameState.currentPlayerIndex;

    // Check if round should end
    if (this.shouldEndRound(gameState)) {
      await this.endRound(gameState);
    }

    this.startTurnTimer(gameId);
    this.broadcastGameState(gameState);
    return gameState;
  }

  async passRound(socketId: string, gameId: number): Promise<GameState> {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) {
      throw new GameNotFoundError(gameId);
    }

    const playerIndex = gameState.players.findIndex(
      (p) => p.socketId === socketId
    );
    if (playerIndex === -1) {
      throw new PlayerNotFoundError(gameState.players[0].username); // Use first player as fallback
    }

    const player = gameState.players[playerIndex];
    player.hasPassed = true;

    // If other player has passed, end the round
    if (this.shouldEndRound(gameState)) {
      await this.endRound(gameState);
    } else {
      // Switch turns
      gameState.currentPlayerIndex = 1 - gameState.currentPlayerIndex;
    }

    this.startTurnTimer(gameId);
    this.broadcastGameState(gameState);
    return gameState;
  }

  private shouldEndRound(gameState: GameState): boolean {
    const [player1, player2] = gameState.players;
    return (
      (player1.hasPassed && player2.hasPassed) || // Both passed
      (player1.cards.length === 0 && player2.cards.length === 0) || // Both have no cards
      (player1.coins === 0 && player2.coins === 0) // Both poor af
    );
  }

  private async endRound(gameState: GameState) {
    this.clearTurnTimer(gameState.id);
    // Calculate damage
    const [player1, player2] = gameState.players;
    const damage1 = this.calculateDamage(player1.playedCards);
    const damage2 = this.calculateDamage(player2.playedCards);

    // Apply damage
    player2.hp = Math.max(
      0,
      player2.hp -
        Math.max(0, damage1 - this.calculateDefence(player2.playedCards))
    );
    player1.hp = Math.max(
      0,
      player1.hp -
        Math.max(0, damage2 - this.calculateDefence(player1.playedCards))
    );

    // Check for game end
    if (player1.hp === 0 || player2.hp === 0) {
      await this.endGame(
        gameState.id,
        player1.hp > 0 ? player1.userId : player2.userId,
        player1.hp === 0 ? player1.userId : player2.userId
      );
      return;
    }

    // Start new round
    gameState.round++;
    gameState.currentPlayerIndex = 1 - gameState.currentPlayerIndex; // Switch starting player

    // Reset round state
    for (const player of gameState.players) {
      player.coins += this.gameConfig.coinsPerRound;
      player.hasPassed = false;
      player.playedCards = [];
      // Draw new cards
      const prismaCards = await this.cardService.getRandomCards(
        this.gameConfig.initialCards - player.cards.length
      );
      const newCards: Card[] = prismaCards.map((card) => ({
        id: card.id,
        name: card.name,
        description: card.description,
        imageUrl: card.imageUrl,
        cost: card.cost,
        damage: card.damage,
        defence: card.defence
      }));
      player.cards.push(...newCards);
    }

    this.startTurnTimer(gameState.id);
    this.broadcastGameState(gameState);
  }

  private calculateDamage(cards: Card[]): number {
    return cards.reduce((sum, card) => sum + card.damage, 0);
  }

  private calculateDefence(cards: Card[]): number {
    return cards.reduce((sum, card) => sum + card.defence, 0);
  }

  private async endGame(gameId: number, winnerId: number, loserId: number) {
    this.clearTurnTimer(gameId);
    const gameState = this.activeGames.get(gameId);
    if (!gameState) return;

    // Update game in DB
    await this.updateGame(
      {id: gameId},
      {
        winner: {connect: {id: winnerId}},
        loser: {connect: {id: loserId}}
      }
    );

    gameState.isFinished = true;
    gameState.winnerId = winnerId;
    gameState.loserId = loserId;
    this.activeGames.delete(gameId);
    this.broadcastGameState(gameState);
  }

  /**
   * Create a new game
   * Game can be created with a Null winner and loser
   * @param data - The data to create the game with
   * @returns The created game
   */
  async createGame(data: Prisma.GameCreateInput): Promise<Game> {
    return await this.prisma.game.create({data});
  }

  /**
   * Update a game by its unique identifier
   * Supposed to be used to set the winner and loser of a game
   * @param where - The unique identifier of the game to update
   * @param data - The data to update the game with
   * @returns The updated game
   */
  async updateGame(
    where: Prisma.GameWhereUniqueInput,
    data: Prisma.GameUpdateInput
  ): Promise<Game> {
    return await this.prisma.game.update({where, data});
  }
}
