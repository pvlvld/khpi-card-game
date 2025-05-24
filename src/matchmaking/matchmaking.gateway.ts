import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchmakingService } from './matchmaking.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MatchmakingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly matchmakingService: MatchmakingService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    await this.matchmakingService.removeFromQueue(client.id);
  }

  @SubscribeMessage('joinQueue')
  async handleJoinQueue(client: Socket) {
    await this.matchmakingService.addToQueue(client.id);
  }

  @SubscribeMessage('leaveQueue')
  async handleLeaveQueue(client: Socket) {
    await this.matchmakingService.removeFromQueue(client.id);
  }

  @SubscribeMessage('cancelMatch')
  async handleCancelMatch(client: Socket) {
    await this.matchmakingService.cancelMatch(client.id);
  }
} 