import {Injectable, Logger, Inject, forwardRef} from "@nestjs/common";
import {MatchmakingGateway} from "./matchmaking.gateway";
import {GamesService} from "src/game/game.service";

interface QueuedPlayer {
  socketId: string;
  userId: number;
  matchId?: string;
}

interface Match {
  id: string;
  players: QueuedPlayer[];
  startTime: number;
  cancelled: boolean;
}

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);
  private readonly queue: QueuedPlayer[] = [];
  private readonly matches: Map<string, Match> = new Map();
  private readonly COUNTDOWN_SECONDS = 5; // Configurable countdown time

  constructor(
    @Inject(forwardRef(() => MatchmakingGateway))
    private readonly matchmakingGateway: MatchmakingGateway,
    private readonly gamesService: GamesService
  ) {}

  // TODO: replace userId with JWT cookie for authorization
  async addToQueue(socketId: string, userId: number) {
    if (this.queue.some((player) => player.socketId === socketId)) {
      return;
    }

    this.queue.push({socketId, userId});
    this.logger.log(`Player ${socketId} (userId: ${userId}) joined the queue`);
    this.tryMatchPlayers();
  }

  async removeFromQueue(socketId: string) {
    const index = this.queue.findIndex(
      (player) => player.socketId === socketId
    );
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.logger.log(`Player ${socketId} left the queue`);
    }
  }

  async cancelMatch(socketId: string) {
    const match = Array.from(this.matches.values()).find((match) =>
      match.players.some((p) => p.socketId === socketId)
    );

    if (match) {
      match.cancelled = true;
      match.players.forEach((player) => {
        this.matchmakingGateway.server
          .to(player.socketId)
          .emit("matchCancelled");
        // this.addToQueue(player.socketId, player.userId); // Re-add players to queue???
      });
      this.matches.delete(match.id);
    }
  }

  private async tryMatchPlayers() {
    while (this.queue.length >= 2) {
      const player1 = this.queue.shift();
      const player2 = this.queue.shift();

      if (!player1 || !player2) continue;

      const dateNow = Date.now();
      const matchId = `match_${dateNow}`;
      const startTime = dateNow + this.COUNTDOWN_SECONDS * 1000;

      const match: Match = {
        id: matchId,
        players: [player1, player2],
        startTime,
        cancelled: false
      };

      this.matches.set(matchId, match);

      // Notify players
      [player1, player2].forEach((player) => {
        this.matchmakingGateway.server.to(player.socketId).emit("matchFound", {
          matchId,
          startTime,
          countdown: this.COUNTDOWN_SECONDS
        });
      });

      // Start countdown
      setTimeout(async () => {
        const currentMatch = this.matches.get(matchId);
        if (currentMatch && !currentMatch.cancelled) {
          try {
            const game = await this.gamesService.startGame(
              currentMatch.players[0].userId,
              currentMatch.players[1].userId
            );

            // Notify players and provide game connection info
            currentMatch.players.forEach((player) => {
              this.matchmakingGateway.server
                .to(player.socketId)
                .emit("gameStart", {
                  matchId,
                  gameId: game.id,
                  opponent: currentMatch.players.find(
                    (p) => p.socketId !== player.socketId
                  )?.userId
                });
            });
          } catch (error) {
            this.logger.error(
              `Failed to start game for match ${matchId}:`,
              error
            );
            currentMatch.players.forEach((player) => {
              this.matchmakingGateway.server
                .to(player.socketId)
                .emit("gameError", {
                  message: "Failed to start the game. Please try again."
                });
            });
          }
          this.matches.delete(matchId);
        }
      }, this.COUNTDOWN_SECONDS * 1000);
    }
  }
}
