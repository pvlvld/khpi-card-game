import {OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway} from "@nestjs/websockets";
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from "src/auth/guards/ws-jwt.guard";
import { JwtService } from "@nestjs/jwt";
import { GamesService } from "./game.service";

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly jwtService: JwtService,
    private readonly gamesService: GamesService
  ) {}

  handleConnection(client: any, ...args: any[]) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: any) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage("message")
  handleMessage(client: any, payload: any): string {
    return "Hello world!";
  }
}

