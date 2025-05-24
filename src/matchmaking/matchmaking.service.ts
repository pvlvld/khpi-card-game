import {Injectable, Logger, Inject, forwardRef} from "@nestjs/common";
import {MatchmakingGateway} from "./matchmaking.gateway";

interface QueuedPlayer {
  socketId: string;
  matchId?: string;
}

interface Match {
  id: string;
  players: string[];
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
    private readonly matchmakingGateway: MatchmakingGateway
  ) {}

  async addToQueue(socketId: string) {
    if (this.queue.some((player) => player.socketId === socketId)) {
      return;
    }

    this.queue.push({socketId});
    this.logger.log(`Player ${socketId} joined the queue`);
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
      match.players.includes(socketId)
    );

    if (match) {
      match.cancelled = true;
      match.players.forEach((playerId) => {
        this.matchmakingGateway.server.to(playerId).emit("matchCancelled");
        // this.addToQueue(playerId); // Re-add players to queue???
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
        players: [player1.socketId, player2.socketId],
        startTime,
        cancelled: false
      };

      this.matches.set(matchId, match);

      // Notify players
      [player1.socketId, player2.socketId].forEach((socketId) => {
        this.matchmakingGateway.server.to(socketId).emit("matchFound", {
          matchId,
          startTime,
          countdown: this.COUNTDOWN_SECONDS
        });
      });

      // Start countdown
      setTimeout(() => {
        const currentMatch = this.matches.get(matchId);
        if (currentMatch && !currentMatch.cancelled) {
          currentMatch.players.forEach((socketId) => {
            this.matchmakingGateway.server.to(socketId).emit("gameStart", {
              matchId,
              opponent: currentMatch.players.find((p) => p !== socketId)
            });
          });
          this.matches.delete(matchId);
        }
      }, this.COUNTDOWN_SECONDS * 1000);
    }
  }
}
