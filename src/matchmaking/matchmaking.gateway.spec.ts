import { Test, TestingModule } from "@nestjs/testing";
import { MatchmakingGateway } from "./matchmaking.gateway";
import { MatchmakingService } from "./matchmaking.service";
import { GamesService } from "src/game/game.service";
import { UsersService } from "src/user/user.service";
import { Server } from "socket.io";
import { Socket } from "socket.io";
import * as jwt from "jsonwebtoken";

// Test user data
const TEST_USERS = [
  {
    id: 1,
    username: "test_player1",
    password: "password123",
    email: "test1@example.com"
  },
  {
    id: 2,
    username: "test_player2",
    password: "password123",
    email: "test2@example.com"
  }
];

describe("MatchmakingGateway", () => {
  let gateway: MatchmakingGateway;
  let matchmakingService: MatchmakingService;
  let gamesService: GamesService;
  let usersService: UsersService;
  let mockServer: Partial<Server>;
  let mockSocket1: Partial<Socket>;
  let mockSocket2: Partial<Socket>;

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };

    mockSocket1 = {
      id: "socket1",
      handshake: {
        headers: {
          cookie: `jwt=${jwt.sign({ username: TEST_USERS[0].username }, "test_secret")}`
        }
      },
      emit: jest.fn()
    };

    mockSocket2 = {
      id: "socket2",
      handshake: {
        headers: {
          cookie: `jwt=${jwt.sign({ username: TEST_USERS[1].username }, "test_secret")}`
        }
      },
      emit: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchmakingGateway,
        {
          provide: MatchmakingService,
          useValue: {
            addToQueue: jest.fn(),
            removeFromQueue: jest.fn(),
            cancelMatch: jest.fn()
          }
        },
        {
          provide: GamesService,
          useValue: {
            startGame: jest.fn().mockResolvedValue({ id: 1 }),
            joinGame: jest
              .fn()
              .mockImplementation((socketId, gameId, username) => ({
                id: gameId,
                players: [
                  { username: TEST_USERS[0].username, socketId },
                  { username: TEST_USERS[1].username, socketId: "socket2" }
                ],
                currentPlayerIndex: 0,
                round: 1,
                isFinished: false
              }))
          }
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn().mockImplementation(({ username }) => {
              return Promise.resolve(
                TEST_USERS.find((user) => user.username === username)
              );
            })
          }
        }
      ]
    }).compile();

    gateway = module.get<MatchmakingGateway>(MatchmakingGateway);
    matchmakingService = module.get<MatchmakingService>(MatchmakingService);
    gamesService = module.get<GamesService>(GamesService);
    usersService = module.get<UsersService>(UsersService);
    gateway.server = mockServer as Server;
  });

  it("should handle two players joining queue and starting a game", async () => {
    // First player joins queue
    await gateway.handleJoinQueue(mockSocket1 as Socket);
    expect(matchmakingService.addToQueue).toHaveBeenCalledWith(
      mockSocket1.id,
      TEST_USERS[0].username,
      TEST_USERS[0].id
    );

    // Second player joins queue
    await gateway.handleJoinQueue(mockSocket2 as Socket);
    expect(matchmakingService.addToQueue).toHaveBeenCalledWith(
      mockSocket2.id,
      TEST_USERS[1].username,
      TEST_USERS[1].id
    );

    // Simulate match found event
    const matchFoundData = {
      matchId: "test_match",
      startTime: Date.now() + 5000,
      countdown: 5,
      opponentName: TEST_USERS[1].username
    };

    // Simulate game start event
    const gameStartData = {
      matchId: "test_match",
      gameId: 1,
      opponent: TEST_USERS[1].id
    };

    // Verify that both players received match found notification
    expect(mockServer.to).toHaveBeenCalledWith(mockSocket1.id);
    expect(mockServer.to).toHaveBeenCalledWith(mockSocket2.id);
    expect(mockServer.emit).toHaveBeenCalledWith(
      "matchFound",
      expect.any(Object)
    );

    // Join game for both players
    const gameState1 = await gamesService.joinGame(
      mockSocket1.id as string,
      1,
      TEST_USERS[0].username
    );
    const gameState2 = await gamesService.joinGame(
      mockSocket2.id as string,
      1,
      TEST_USERS[1].username
    );

    expect(gameState1).toBeDefined();
    expect(gameState2).toBeDefined();
    expect(gameState1.id).toBe(1);
    expect(gameState2.id).toBe(1);
  });
});
