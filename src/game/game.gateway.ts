import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody
} from "@nestjs/websockets";
import {Server, Socket} from "socket.io";
import {GamesService} from "./game.service";
import {Logger} from "@nestjs/common";

@WebSocketGateway({
  cors: {
    origin: "*"
  },
  namespace: "game"
})
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(GamesGateway.name);

  constructor(private readonly gamesService: GamesService) {
    this.gamesService.setServer(this.server);
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Game client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Game client disconnected: ${client.id}`);
    try {
      await this.gamesService.handlePlayerDisconnect(client.id);
    } catch (error) {
      this.logger.error(`Error handling disconnect: ${error.message}`);
    }
  }

  @SubscribeMessage("joinGame")
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {gameId: number; userId: number}
  ) {
    try {
      const gameState = await this.gamesService.joinGame(client.id, data.gameId, data.userId);
      return { success: true, data: gameState };
    } catch (error) {
      this.logger.error(`Error joining game: ${error.message}`);
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage("playCard")
  async handlePlayCard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {gameId: number; cardId: number}
  ) {
    try {
      const gameState = await this.gamesService.playCard(client.id, data.gameId, data.cardId);
      return { success: true, data: gameState };
    } catch (error) {
      this.logger.error(`Error playing card: ${error.message}`);
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage("passRound")
  async handlePassRound(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {gameId: number}
  ) {
    try {
      const gameState = await this.gamesService.passRound(client.id, data.gameId);
      return { success: true, data: gameState };
    } catch (error) {
      this.logger.error(`Error passing round: ${error.message}`);
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }
}
