import { io as Client } from "socket.io-client";
import * as jwt from "jsonwebtoken";
import { PublicGameState } from "src/game/interfaces/game-state.interface";

// Test user data
const TEST_USERS = [
  {
    id: 1,
    username: "test_player1",
    password: "password123"
  },
  {
    id: 2,
    username: "test_player2",
    password: "password123"
  }
];

// Create JWT tokens for both users
const token1 = jwt.sign(
  { username: TEST_USERS[0].username },
  "your-super-secret-key-here"
);
const token2 = jwt.sign(
  { username: TEST_USERS[1].username },
  "your-super-secret-key-here"
);

// Connect first player
const player1 = Client("http://localhost:3000/matchmaking", {
  extraHeaders: {
    cookie: `jwt=${token1}`
  }
});

// Connect second player
const player2 = Client("http://localhost:3000/matchmaking", {
  extraHeaders: {
    cookie: `jwt=${token2}`
  }
});

// Connect to game namespace
const gamePlayer1 = Client("http://localhost:3000/game", {
  extraHeaders: {
    cookie: `jwt=${token1}`
  }
});

const gamePlayer2 = Client("http://localhost:3000/game", {
  extraHeaders: {
    cookie: `jwt=${token2}`
  }
});

// Player 1 event handlers
player1.on("connect", () => {
  console.log("Player 1 connected to matchmaking");
  player1.emit("joinQueue");
});

player1.on("matchFound", (data) => {
  console.log("Player 1: Match found!", data);
});

player1.on("gameStart", (data) => {
  console.log("Player 1: Game starting!", data);
  // Join the game after receiving gameId
  gamePlayer1.emit(
    "joinGame",
    {
      gameId: data.gameId,
      username: TEST_USERS[0].username
    },
    (res) => {
      if (res.success) {
        console.log("Player 1 joined game successfully:", res.data);
      }
    }
  );
});

player1.on("error", (error) => {
  console.error("Player 1 error:", error);
});

// Player 2 event handlers
player2.on("connect", () => {
  console.log("Player 2 connected to matchmaking");
  player2.emit("joinQueue");
});

player2.on("matchFound", (data) => {
  console.log("Player 2: Match found!", data);
});

player2.on("joinGame", (data) => {
  console.log("gameState: ", data);
});

player2.on("joinGame", (data) => {
  console.log("gameState: ", data);
});

player2.on("gameStart", (data) => {
  console.log("Player 2: Game starting!", data);

  gamePlayer2.emit(
    "joinGame",
    {
      gameId: data.gameId,
      username: TEST_USERS[1].username
    },
    (res) => {
      if (res.success) {
        const data = res.data as PublicGameState;
        console.log("Player 2 joined game successfully:", data);

        const movePlayer = data.currentPlayerUsername;
        const currentPlayer = data.players.find(
          (p) => p.username === data.currentPlayerUsername
        )!;
        console.log("Current player:", currentPlayer);
        gamePlayer2.emit(
          "playCard",
          {
            gameId: data.id,
            cardId: currentPlayer.cards![0].id || 0
          },
          (res) => {
            if (res.success) {
              console.log("Player 2 played card successfully:", res.data);
            } else {
              console.error("Error playing card:", res.error);
            }
          }
        );
      }
    }
  );
});

player2.on("gameStateUpdate", (state) => {
  console.log("Player 2: Game state updated", state);
});

player2.on("error", (error) => {
  console.error("Player 2 error:", error);
});

// Game event handlers for Player 1
gamePlayer1.on("connect", () => {
  console.log("Player 1 connected to game namespace");
});

gamePlayer1.on("gameStateUpdate", (state) => {
  console.log("Player 1: Game state updated", state);
});

gamePlayer1.on("error", (error) => {
  console.error("Player 1 game error:", error);
});

// Game event handlers for Player 2
gamePlayer2.on("connect", () => {
  console.log("Player 2 connected to game namespace");
});

gamePlayer2.on("gameStateUpdate", (state) => {
  console.log("Player 2: Game state updated", state);
});

gamePlayer2.on("error", (error) => {
  console.error("Player 2 game error:", error);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("Disconnecting players...");
  player1.disconnect();
  player2.disconnect();
  gamePlayer1.disconnect();
  gamePlayer2.disconnect();
  process.exit();
});

console.log("Test script started. Press Ctrl+C to exit.");
