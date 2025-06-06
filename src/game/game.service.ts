import {Injectable, Logger} from "@nestjs/common";
import {Game, Prisma, Card as PrismaCard} from "generated/prisma";
import {PrismaService} from "src/prisma/prisma.service";
import {CardService} from "src/card/card.service";
import {
  GameState,
  PlayerState,
  GameConfig,
  Card,
  PublicGameState,
  GameStateWithSettings
} from "./interfaces/game-state.interface";
import {Server} from "socket.io";
import {GameStateService} from "./game-state.service";

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
  private readonly turnTimers: Map<number, NodeJS.Timeout> = new Map();
  private server?: Server;
  private readonly gameConfig: GameConfig = {
    initialHp: 20,
    initialCoins: 20,
    initialCards: 4,
    coinsPerRound: 8,
    turnTimeLimit: 20
  };

  constructor(
    private prisma: PrismaService,
    private cardService: CardService,
    private gameStateService: GameStateService
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  async startGame(player1Id: number, player2Id: number): Promise<Game> {
    const game = await this.createGame({
      winner: undefined,
      loser: undefined
    });

    const players = await Promise.all([
      this.initializePlayerState(player1Id),
      this.initializePlayerState(player2Id)
    ]);
    const currentPlayerIndex = Math.random() < 0.5 ? 0 : 1;
    const gameState: GameStateWithSettings = {
      id: game.id,
      players: players,
      currentPlayerIndex,
      currentPlayerUsername: players[currentPlayerIndex].username,
      round: 1,
      isFinished: false,
      gameSettings: {
        initialHp: this.gameConfig.initialHp,
        initialCoins: this.gameConfig.initialCoins,
        initialCards: this.gameConfig.initialCards,
        coinsPerRound: this.gameConfig.coinsPerRound,
        turnTimeLimit: this.gameConfig.turnTimeLimit
      }
    };

    this.gameStateService.setGame(game.id, gameState);
    return game;
  }

  private async initializePlayerState(userId: number): Promise<PlayerState> {
    const [prismaCards, user] = await Promise.all([
      this.cardService.getRandomCards(this.gameConfig.initialCards),
      this.prisma.user.findUnique({
        where: {id: userId},
        select: {username: true}
      })
    ]);
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
      cardsCount: cards.length,
      playedCards: [],
      hasPassed: false
    };
  }

  async joinGame(
    socketId: string,
    gameId: number,
    username: string
  ): Promise<GameState> {
    const gameState = this.gameStateService.getGame(gameId);
    if (!gameState) {
      throw new GameNotFoundError(gameId);
    }

    const playerIndex = gameState.players.findIndex(
      (p) => p.username === username
    );
    if (playerIndex === -1) {
      throw new PlayerNotFoundError(username);
    }

    // Hide the cards of the opponent
    gameState.players[playerIndex].socketId = socketId;
    return gameState;
  }

  async handlePlayerDisconnect(socketId: string) {
    for (const [gameId, gameState] of this.gameStateService
      .getAllGames()
      .entries()) {
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

    const gameState = this.gameStateService.getGame(gameId);
    if (!gameState || gameState.isFinished) return;

    const timer = setTimeout(async () => {
      const currentGameState = this.gameStateService.getGame(gameId);
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
      winnerUsername: gameState.winnerId
        ? gameState.players.find((p) => p.userId === gameState.winnerId)
            ?.username || "Unknown"
        : "None",
      loserUsername: gameState.loserId
        ? gameState.players.find((p) => p.userId === gameState.loserId)
            ?.username || "Unknown"
        : "None",
      currentPlayerIndex: gameState.currentPlayerIndex,
      currentPlayerUsername: gameState.currentPlayerUsername,
      players: [
        {
          userId: currentPlayer.userId,
          username: currentPlayer.username,
          hp: currentPlayer.hp,
          coins: currentPlayer.coins,
          cardsCount: currentPlayer.cards.length,
          cards: currentPlayer.cards,
          playedCards: currentPlayer.playedCards,
          hasPassed: currentPlayer.hasPassed
        },
        {
          userId: opponent.userId,
          username: opponent.username,
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
    const gameState = this.gameStateService.getGame(gameId);
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
    gameState.currentPlayerUsername =
      gameState.players[gameState.currentPlayerIndex].username;

    // Check if round should end
    if (this.shouldEndRound(gameState)) {
      await this.endRound(gameState);
    }

    // Reset pass state
    for (const p of gameState.players) {
      p.hasPassed = false;
    }

    this.startTurnTimer(gameId);
    this.broadcastGameState(gameState);
    return gameState;
  }

  async passRound(socketId: string, gameId: number): Promise<GameState> {
    const gameState = this.gameStateService.getGame(gameId);
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

    if (player.hasPassed) {
      throw new GameError("You have already passed this round.");
    }

    player.hasPassed = true;

    // If other player has passed, end the round
    if (this.shouldEndRound(gameState)) {
      await this.endRound(gameState);
    } else {
      // Switch turns
      gameState.currentPlayerIndex = 1 - gameState.currentPlayerIndex;
      gameState.currentPlayerUsername =
        gameState.players[gameState.currentPlayerIndex].username;
    }

    this.startTurnTimer(gameId);
    this.broadcastGameState(gameState);
    return gameState;
  }

  private shouldEndRound(gameState: GameState): boolean {
    const [player1, player2] = gameState.players;
    return (
      (player1.hasPassed && player2.hasPassed) || // Both passed
      // (player1.cards.length === 0 && player2.cards.length === 0) || // Both have no cards
      (player1.coins === 0 && player2.coins === 0) // Both poor af
    );
  }

  private async endRound(gameState: GameState) {
    this.clearTurnTimer(gameState.id);
    const [player1, player2] = gameState.players;

    const damage1 = this.calculateDamage(player1.playedCards);
    const damage2 = this.calculateDamage(player2.playedCards);

    const defence1 = this.calculateDefence(player1.playedCards);
    const defence2 = this.calculateDefence(player2.playedCards);

    const finalDamageToP2 = Math.max(0, damage1 - defence2);
    const finalDamageToP1 = Math.max(0, damage2 - defence1);

    player2.hp = Math.max(0, player2.hp - finalDamageToP2);
    player1.hp = Math.max(0, player1.hp - finalDamageToP1);

    // Reset pass state
    player1.hasPassed = false;
    player2.hasPassed = false;

    // Check for game end
    const bothDead = player1.hp === 0 && player2.hp === 0;
    const oneAlive = player1.hp === 0 || player2.hp === 0;

    if (bothDead) {
      // Tie-breaker logic
      if (finalDamageToP2 > finalDamageToP1) {
        await this.endGame(gameState.id, player1.userId, player2.userId);
      } else if (finalDamageToP1 > finalDamageToP2) {
        await this.endGame(gameState.id, player2.userId, player1.userId);
      } else {
        // Damage equal, fallback to coins
        if (player1.coins > player2.coins) {
          await this.endGame(gameState.id, player1.userId, player2.userId);
        } else if (player2.coins > player1.coins) {
          await this.endGame(gameState.id, player2.userId, player1.userId);
        } else {
          // Full draw logic (optional): either declare a draw or choose randomly
          // For now, random:
          const winner = Math.random() < 0.5 ? player1 : player2;
          const loser = winner === player1 ? player2 : player1;
          await this.endGame(gameState.id, winner.userId, loser.userId);
        }
      }
      return;
    } else if (oneAlive) {
      await this.endGame(
        gameState.id,
        player1.hp > 0 ? player1.userId : player2.userId,
        player1.hp === 0 ? player1.userId : player2.userId
      );
      return;
    }

    // Continue game
    gameState.round++;
    gameState.currentPlayerIndex = 1 - gameState.currentPlayerIndex;
    gameState.currentPlayerUsername =
      gameState.players[gameState.currentPlayerIndex].username;

    for (const player of gameState.players) {
      player.coins += this.gameConfig.coinsPerRound;
      player.hasPassed = false;
      player.playedCards = [];

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
    const gameState = this.gameStateService.getGame(gameId);
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
    this.gameStateService.deleteGame(gameId);
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
