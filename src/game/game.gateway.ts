import {ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway} from "@nestjs/websockets";
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from "src/auth/guards/ws-jwt.guard";
import { JwtService } from "@nestjs/jwt";
import { GamesService } from "./game.service";
import { Socket } from "socket.io";


@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GamesGateway.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly gamesService: GamesService
  ) {}


  @SubscribeMessage("message")
  handleMessage(client: any, payload: any): string {
    return "Hello world!";
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
      const gameState = await this.gamesService.joinGame(
        client.id,
        data.gameId,
        data.userId
      );
      return {success: true, data: gameState};
    } catch (error) {
      this.logger.error(`Error joining game: ${error.message}`);
      client.emit("error", {message: error.message});
      return {success: false, error: error.message};
    }
  }

  @SubscribeMessage("playCard")
  async handlePlayCard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {gameId: number; cardId: number}
  ) {
    try {
      const gameState = await this.gamesService.playCard(
        client.id,
        data.gameId,
        data.cardId
      );
      return {success: true, data: gameState};
    } catch (error) {
      this.logger.error(`Error playing card: ${error.message}`);
      client.emit("error", {message: error.message});
      return {success: false, error: error.message};
    }
  }

  @SubscribeMessage("passRound")
  async handlePassRound(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {gameId: number}
  ) {
    try {
      const gameState = await this.gamesService.passRound(
        client.id,
        data.gameId
      );
      return {success: true, data: gameState};
    } catch (error) {
      this.logger.error(`Error passing round: ${error.message}`);
      client.emit("error", {message: error.message});
      return {success: false, error: error.message};
    }
  }
}

