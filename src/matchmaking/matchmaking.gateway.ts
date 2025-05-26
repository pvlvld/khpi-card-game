import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody
} from "@nestjs/websockets";
import {forwardRef, Inject} from "@nestjs/common";
import {Server, Socket} from "socket.io";
import {MatchmakingService} from "./matchmaking.service";
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  namespace: "matchmaking"
})
export class MatchmakingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => MatchmakingService))
    private readonly matchmakingService: MatchmakingService
  ) {}

  async handleConnection(client: Socket) {
    console.log(`Matchmaking client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Matchmaking client disconnected: ${client.id}`);
    await this.matchmakingService.removeFromQueue(client.id);
  }

  @SubscribeMessage("joinQueue")
  async handleJoinQueue(client: Socket) {
    // Parsing cookie
    const cookieHeader = client.handshake.headers.cookie || '';
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const token = cookies['jwt'];
    if (!token) {
      client.emit('error', 'No JWT token provided');
      return;
    }

    let payload;
    try {
      payload = jwt.decode(token) as { username?: string };
    } catch (e) {
      client.emit('error', 'Invalid JWT token');
      return;
    }

    if (!payload?.username) {
      client.emit('error', 'Invalid JWT payload');
      return;
    }

    await this.matchmakingService.addToQueue(client.id, payload.username);
  }

  @SubscribeMessage("leaveQueue")
  async handleLeaveQueue(@ConnectedSocket() client: Socket) {
    await this.matchmakingService.removeFromQueue(client.id);
  }

  @SubscribeMessage("cancelMatch")
  async handleCancelMatch(@ConnectedSocket() client: Socket) {
    await this.matchmakingService.cancelMatch(client.id);
  }
}
