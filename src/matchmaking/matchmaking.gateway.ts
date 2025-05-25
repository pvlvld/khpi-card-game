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

@WebSocketGateway({
  cors: {
    origin: "*"
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
  async handleJoinQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {userId: number}
  ) {
    await this.matchmakingService.addToQueue(client.id, data.userId);
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
