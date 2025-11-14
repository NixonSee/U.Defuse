import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth.js";
import gameService from "./services/gameService.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Socket.IO with CORS - Allow Vercel domains and local network
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      const envOrigins = [process.env.CLIENT_ORIGIN, process.env.CLIENT_ORIGIN2].filter(Boolean);
      // Allow localhost, local network IPs, and Vercel domains
      const allowedOrigins = [
        /^http:\/\/localhost:5173$/,
        /^http:\/\/127\.0\.0\.1:5173$/,
        /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:5173$/,
        /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/,
        /^https:\/\/.*\.vercel\.app$/,
        /^https:\/\/.*-.*\.vercel\.app$/
      ];
      
      if (
        !origin ||
        envOrigins.includes(origin) ||
        allowedOrigins.some(pattern => pattern.test(origin))
      ) {
        callback(null, true);
      } else {
        console.log('❌ CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Configure CORS with credentials - Allow Vercel domains and local network
app.use(cors({
  origin: (origin, callback) => {
    const envOrigins = [process.env.CLIENT_ORIGIN, process.env.CLIENT_ORIGIN2].filter(Boolean);
    const allowedOrigins = [
      /^http:\/\/localhost:5173$/,
      /^http:\/\/127\.0\.0\.1:5173$/,
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:5173$/,
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/,
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*-.*\.vercel\.app$/
    ];
    
    if (
      !origin ||
      envOrigins.includes(origin) ||
      allowedOrigins.some(pattern => pattern.test(origin))
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(cookieParser());
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);

// Store connected players
const connectedPlayers = new Map();

// Store game rooms
const gameRooms = new Map();

// Clean up function to remove invalid connections
function cleanupConnections() {
  const beforeCount = connectedPlayers.size;
  const validSocketIds = Array.from(io.sockets.sockets.keys());
  
  for (const [socketId, player] of connectedPlayers.entries()) {
    if (!validSocketIds.includes(socketId)) {
      console.log(`🧹 Removing stale connection: ${player.username} (${socketId})`);
      connectedPlayers.delete(socketId);
    }
  }
  
  const afterCount = connectedPlayers.size;
  if (beforeCount !== afterCount) {
    console.log(`🧽 Cleanup complete: ${beforeCount} -> ${afterCount} players`);
  }
}

// Clean up connections every 30 seconds
setInterval(cleanupConnections, 30000);

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    // Get cookies from handshake headers
    const cookies = socket.handshake.headers.cookie;
    
    if (!cookies) {
      return next(new Error("Authentication error"));
    }

    // Parse cookies manually to get auth_token
    const cookieObj = {};
    cookies.split(';').forEach(cookie => {
      const [key, value] = cookie.trim().split('=');
      cookieObj[key] = value;
    });

    const token = cookieObj.auth_token;
    
    if (!token) {
      return next(new Error("Authentication error"));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Since we include user data in JWT, we can use it directly
    socket.userId = decoded.id;
    socket.username = decoded.username;
    socket.email = decoded.email;
    next();
  } catch (err) {
    console.error("Socket authentication error:", err);
    next(new Error("Authentication error"));
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`🎮 Player connected: ${socket.username} (ID: ${socket.userId})`);
  console.log(`🔍 Debug - Socket user info:`, {
    userId: socket.userId,
    username: socket.username,
    email: socket.email,
    socketId: socket.id
  });

  // Add player to connected list
  const playerInfo = {
    id: socket.userId,
    username: socket.username,
    email: socket.email,
    socketId: socket.id,
    connectedAt: new Date()
  };
  
  console.log(`📝 Adding player to map:`, playerInfo);
  
  // Clean up any existing connections for this EXACT user (same ID AND username) to prevent duplicates
  for (const [socketId, player] of connectedPlayers.entries()) {
    if (player.id === socket.userId && player.username === socket.username && socketId !== socket.id) {
      console.log(`🧹 Removing duplicate connection for user ${player.username} (old socket: ${socketId})`);
      connectedPlayers.delete(socketId);
    }
  }
  
  // Debug: Show what's currently in the map before adding new player
  console.log(`🗂️  Current players before adding new one:`, Array.from(connectedPlayers.values()).map(p => `${p.username} (ID: ${p.id})`));
  
  // Use socket.id as key to ensure unique entries per connection
  connectedPlayers.set(socket.id, playerInfo);
  console.log(`✅ Added player to map. Total players now: ${connectedPlayers.size}`);

  // Send updated player list to all clients
  const playersArray = Array.from(connectedPlayers.values());
  console.log(`📡 Broadcasting players update: ${playersArray.length} players`);
  console.log(`👥 Players in list:`, playersArray.map(p => `${p.username} (UserID: ${p.id}, SocketID: ${p.socketId})`));
  console.log(`🗺️  Full connectedPlayers Map keys:`, Array.from(connectedPlayers.keys()));
  
  // Broadcast to all clients
  io.emit("playersUpdate", {
    connectedPlayers: playersArray,
    totalPlayers: connectedPlayers.size
  });

  // Send welcome message and current player list to the newly connected player
  socket.emit("welcome", {
    message: "Welcome to U.DEFUSE!",
    playerInfo: playerInfo
  });

  // Send current player list specifically to the new player (with a small delay to ensure listeners are set up)
  setTimeout(() => {
    const currentPlayers = Array.from(connectedPlayers.values());
    console.log(`📤 Sending initial player list to new player ${socket.username}: ${currentPlayers.length} players`);
    console.log(`📋 Players being sent:`, currentPlayers.map(p => `${p.username} (UserID: ${p.id})`));
    socket.emit("playersUpdate", {
      connectedPlayers: currentPlayers,
      totalPlayers: connectedPlayers.size
    });
  }, 100);

  // Handle player disconnect
  socket.on("disconnect", (reason) => {
    console.log(`👋 Player disconnected: ${socket.username} (${reason})`);
    
    // Remove player from connected list using socket.id
    connectedPlayers.delete(socket.id);
    
    // Send updated player list to remaining clients
    const remainingPlayers = Array.from(connectedPlayers.values());
    console.log(`📡 Broadcasting disconnect update: ${remainingPlayers.length} players remaining`);
    
    io.emit("playersUpdate", {
      connectedPlayers: remainingPlayers,
      totalPlayers: connectedPlayers.size
    });
    
    // Handle game room cleanup if player was in a room
    const roomCode = socket.roomCode;
    if (roomCode && gameRooms.has(roomCode)) {
      const room = gameRooms.get(roomCode);
      const leavingPlayer = room.players.find(p => p.socketId === socket.id);
      
      // Remove player from room
      room.players = room.players.filter(p => p.socketId !== socket.id);
      
      console.log(`🚪 ${socket.username} disconnected from room ${roomCode}. Remaining: ${room.players.length}`);
      
      // If host disconnected, close the room and kick everyone
      const hostLeft = leavingPlayer?.isHost === true;
      if (room.players.length === 0 || hostLeft) {
        gameRooms.delete(roomCode);
        console.log(`🗑️ Room ${roomCode} deleted (${hostLeft ? 'host disconnected' : 'empty room'})`);
        io.to(roomCode).emit("roomClosed", { message: "Host left the room" });
      } else {
        // Notify remaining players
        io.to(roomCode).emit("playerLeft", {
          players: room.players
        });
      }
    }
  });

  // Handle request for current player list
  socket.on("requestPlayerList", () => {
    const currentPlayers = Array.from(connectedPlayers.values());
    console.log(`📋 Player ${socket.username} requested player list: ${currentPlayers.length} players`);
    socket.emit("playersUpdate", {
      connectedPlayers: currentPlayers,
      totalPlayers: connectedPlayers.size
    });
  });

  // Handle custom game events
  socket.on("playerMessage", (data) => {
    console.log(`💬 Message from ${socket.username}: ${data.message}`);
    
    // Broadcast message to all players
    io.emit("newMessage", {
      from: socket.username,
      message: data.message,
      timestamp: new Date()
    });
  });

  // Handle game room creation
  socket.on("createRoom", (data) => {
    const { roomCode } = data;
    console.log(`🏠 ${socket.username} (ID: ${socket.userId}) creating room: ${roomCode}`);
    
    // If room already exists and user is already the host, just send current state
    if (gameRooms.has(roomCode)) {
      const existingRoom = gameRooms.get(roomCode);
      if (existingRoom.host.id === socket.userId) {
        console.log(`⚠️ Room ${roomCode} already exists with same host, sending current state`);
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.emit("roomCreated", {
          roomCode,
          players: existingRoom.players
        });
        return;
      }
    }
    
    // Create new room
    const playerColors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#9D4EDD"]; // Gold, Red, Cyan, Purple
    
    const hostPlayer = {
      id: socket.userId,
      username: socket.username,
      socketId: socket.id,
      color: playerColors[0],
      isReady: true,
      isHost: true
    };
    
    gameRooms.set(roomCode, {
      roomCode,
      host: {
        id: socket.userId,
        username: socket.username,
        socketId: socket.id
      },
      players: [hostPlayer],
      createdAt: new Date()
    });
    
    socket.join(roomCode);
    socket.roomCode = roomCode;
    
    console.log(`✅ Room ${roomCode} created by ${socket.username}`);
    console.log(`🏠 Host socket ${socket.id} joined Socket.IO room ${roomCode}`);
    
    // Send confirmation to host
    socket.emit("roomCreated", {
      roomCode,
      players: [hostPlayer]
    });
  });

  // Handle player joining room
  socket.on("joinRoom", (data) => {
    const { roomCode } = data;
    console.log(`🚪 ${socket.username} (ID: ${socket.userId}) trying to join room: ${roomCode}`);
    
    // Check if room exists
    if (!gameRooms.has(roomCode)) {
      socket.emit("roomError", { message: "Room not found" });
      console.log(`❌ Room ${roomCode} not found`);
      return;
    }
    
    const room = gameRooms.get(roomCode);
    
    // Check if room is full (max 4 players)
    if (room.players.length > 4) {
      socket.emit("roomError", { message: "Room is full" });
      console.log(`❌ Room ${roomCode} is full`);
      return;
    }
    
    // Check if THIS SOCKET is already in the room
    const existingBySocket = room.players.find(p => p.socketId === socket.id);
    if (existingBySocket) {
      console.log(`⚠️ ${socket.username} socket already in room ${roomCode}, sending current state`);
      socket.emit("playerJoined", {
        players: room.players
      });
      return;
    }
    
    // Check if same user account is already in the room (for logging/warning only)
    const sameUserExists = room.players.some(p => p.id === socket.userId);
    if (sameUserExists) {
      console.log(`⚠️ WARNING: User ID ${socket.userId} (${socket.username}) is already in the room! Allowing duplicate for testing...`);
    }
    
    // Add player to room
    const playerColors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#9D4EDD"]; // Gold, Red, Cyan, Purple
    const newPlayer = {
      id: socket.userId,
      username: socket.username,
      socketId: socket.id,
      color: playerColors[room.players.length],
      isReady: false,
      isHost: false
    };
    
    room.players.push(newPlayer);
    socket.join(roomCode);
    socket.roomCode = roomCode;
    
    console.log(`✅ ${socket.username} joined room ${roomCode}. Players: ${room.players.length}/4`);
    console.log(`🚪 Player socket ${socket.id} joined Socket.IO room ${roomCode}`);
    console.log(`📋 Current players in room:`, room.players.map(p => p.username));
    
    // Notify all players in the room (including the one who just joined)
    console.log(`📡 Broadcasting playerJoined to room ${roomCode}`);
    io.to(roomCode).emit("playerJoined", {
      players: room.players,
      newPlayer: newPlayer
    });
    
    // Also emit to the joining player directly to ensure they get it
    socket.emit("playerJoined", {
      players: room.players,
      newPlayer: newPlayer
    });
  });

  // Handle player ready status
  socket.on("toggleReady", (data) => {
    const roomCode = socket.roomCode;
    if (!roomCode || !gameRooms.has(roomCode)) {
      return;
    }
    
    const room = gameRooms.get(roomCode);
    // Find player by socket ID, not user ID (to support same user in multiple tabs)
    const player = room.players.find(p => p.socketId === socket.id);
    
    if (player) {
      player.isReady = !player.isReady;
      console.log(`🎮 ${socket.username} (socket: ${socket.id}) ready status: ${player.isReady}`);
      
      // Notify all players in the room
      io.to(roomCode).emit("playerReady", {
        players: room.players
      });
    }
  });

  // Handle leaving room
  socket.on("leaveRoom", () => {
    const roomCode = socket.roomCode;
    if (!roomCode || !gameRooms.has(roomCode)) {
      return;
    }
    
    const room = gameRooms.get(roomCode);
    const leavingPlayer = room.players.find(p => p.socketId === socket.id);
    
    // Filter by socket ID, not user ID
    room.players = room.players.filter(p => p.socketId !== socket.id);
    
    socket.leave(roomCode);
    delete socket.roomCode;
    
    console.log(`🚪 ${socket.username} (socket: ${socket.id}) left room ${roomCode}. Remaining: ${room.players.length}`);
    
    // If room is empty or host left, delete the room
    const hostLeft = leavingPlayer?.isHost === true;
    if (room.players.length === 0 || hostLeft) {
      gameRooms.delete(roomCode);
      console.log(`🗑️ Room ${roomCode} deleted (${hostLeft ? 'host left' : 'empty room'})`);
      io.to(roomCode).emit("roomClosed", { message: "Host left the room" });
    } else {
      // Notify remaining players
      io.to(roomCode).emit("playerLeft", {
        players: room.players
      });
    }
  });

  // Handle game start
  socket.on("startGame", async (data) => {
    const roomCode = socket.roomCode;
    if (!roomCode || !gameRooms.has(roomCode)) {
      return;
    }
    
    const room = gameRooms.get(roomCode);
    
    // Check if player is host
    if (room.host.id !== socket.userId) {
      socket.emit("gameError", { message: "Only host can start the game" });
      return;
    }
    
    console.log(`🎮 Host ${socket.username} starting game in room ${roomCode}`);
    
    try {
      // Create game session in database
      const playerCount = room.players.length;
      const gameSessionId = await gameService.createGameSession(roomCode, 'survivor', playerCount);
      
      // Setup players with roles and initial cards
      await gameService.setupPlayers(gameSessionId, room.players);
      await gameService.dealInitialCards(gameSessionId);
      await gameService.startGame(gameSessionId);
      
      // Get game state
      const gameState = await gameService.getGameState(gameSessionId);
      
      // Store gameSessionId in room
      room.gameSessionId = gameSessionId;
      room.currentTurn = 0;
      
      console.log(`✅ Game session ${gameSessionId} created for room ${roomCode}`);
      
      // Notify all players in the room that game is started
      io.to(roomCode).emit("gameStarted", {
        roomCode,
        gameSessionId,
        players: gameState.players,
        currentTurn: 0
      });
      
      // Send individual hands to each player (private)
      gameState.players.forEach(player => {
        const playerSocket = io.sockets.sockets.get(room.players.find(p => p.id === player.user_id)?.socketId);
        if (playerSocket) {
          playerSocket.emit("yourHand", {
            cards: player.hand_cards
          });
        }
      });
      
    } catch (err) {
      console.error("Error starting game:", err);
      socket.emit("gameError", { message: "Failed to start game" });
    }
  });

  // Handle bomb scan
  socket.on("scanBomb", async (data) => {
    const { gameSessionId } = data;
    
    try {
      const result = await gameService.triggerBomb(gameSessionId, socket.userId);
      
      console.log(`💣 ${socket.username} scanned bomb! Timer: ${result.timerSeconds}s`);
      
      // Send quiz to player
      socket.emit("bombQuiz", {
        question: result.question,
        timerSeconds: result.timerSeconds,
        bonusTime: result.bonusTime
      });
      
      // Notify room that player triggered bomb
      if (socket.roomCode) {
        io.to(socket.roomCode).emit("playerTriggeredBomb", {
          playerId: socket.userId,
          username: socket.username,
          timerSeconds: result.timerSeconds
        });
      }
      
    } catch (err) {
      console.error("Error triggering bomb:", err);
      socket.emit("gameError", { message: "Failed to trigger bomb" });
    }
  });

  // Handle quiz answer
  socket.on("answerQuiz", async (data) => {
    const { gameSessionId, questionId, answer, timeTaken, usedHackerAbility } = data;
    
    try {
      const result = await gameService.defuseBomb(
        gameSessionId,
        socket.userId,
        questionId,
        answer,
        timeTaken,
        usedHackerAbility
      );
      
      console.log(`${result.success ? '✅' : '❌'} ${socket.username} ${result.success ? 'defused' : 'failed'} bomb!`);
      
      // Send result to player
      socket.emit("quizResult", result);
      
      // Update room with score
      if (socket.roomCode) {
        const gameState = await gameService.getGameState(gameSessionId);
        io.to(socket.roomCode).emit("scoreUpdate", {
          players: gameState.players
        });
        
        if (result.success) {
          io.to(socket.roomCode).emit("bombDefused", {
            playerId: socket.userId,
            username: socket.username,
            scoreGained: result.scoreGained,
            method: result.method || 'quiz'
          });
        }
      }
      
    } catch (err) {
      console.error("Error answering quiz:", err);
      socket.emit("gameError", { message: "Failed to submit answer" });
    }
  });

  // Handle Defuse card usage
  socket.on("useDefuseCard", async (data) => {
    const { gameSessionId } = data;
    
    try {
      const result = await gameService.useDefuseCard(socket.userId);
      
      console.log(`🛡️ ${socket.username} used Defuse card! +${result.scoreGained} points`);
      
      // Send confirmation to player
      socket.emit("defuseCardUsed", {
        scoreGained: result.scoreGained
      });
      
      // Update room
      if (socket.roomCode) {
        const gameState = await gameService.getGameState(gameSessionId);
        io.to(socket.roomCode).emit("scoreUpdate", {
          players: gameState.players
        });
        
        io.to(socket.roomCode).emit("bombDefused", {
          playerId: socket.userId,
          username: socket.username,
          scoreGained: result.scoreGained,
          method: 'defuse_card'
        });
      }
      
    } catch (err) {
      console.error("Error using Defuse card:", err);
      socket.emit("gameError", { message: err.message });
    }
  });

  // Handle player elimination
  socket.on("playerEliminated", async (data) => {
    const { gameSessionId } = data;
    
    try {
      await gameService.eliminatePlayer(socket.userId);
      
      console.log(`💀 ${socket.username} eliminated!`);
      
      // Check if game ended
      const endCheck = await gameService.checkGameEnd(gameSessionId);
      
      if (socket.roomCode) {
        const gameState = await gameService.getGameState(gameSessionId);
        
        io.to(socket.roomCode).emit("playerEliminatedEvent", {
          playerId: socket.userId,
          username: socket.username,
          players: gameState.players
        });
        
        if (endCheck.ended) {
          const winner = gameState.players.find(p => !p.is_eliminated) || 
                        gameState.players.reduce((max, p) => p.score > max.score ? p : max);
          
          io.to(socket.roomCode).emit("gameEnded", {
            winner: {
              id: winner.user_id,
              username: winner.username,
              score: winner.score
            },
            reason: endCheck.reason,
            finalScores: gameState.players
          });
        }
      }
      
    } catch (err) {
      console.error("Error eliminating player:", err);
    }
  });

  // Handle Hacker ability
  socket.on("useHackerAbility", async (data) => {
    const { gameSessionId } = data;
    
    try {
      // Check if player has Hacker role
      const gameState = await gameService.getGameState(gameSessionId);
      const player = gameState.players.find(p => p.user_id === socket.userId);
      
      if (!player || player.role !== 'hacker') {
        socket.emit("gameError", { message: "You don't have the Hacker role" });
        return;
      }
      
      if (player.ability_used) {
        socket.emit("gameError", { message: "Hacker ability already used" });
        return;
      }
      
      console.log(`🔓 ${socket.username} used Hacker ability!`);
      
      // Mark ability as used
      await new Promise((resolve, reject) => {
        gameService.db.query(
          'UPDATE player_scores SET ability_used = TRUE WHERE id = ?',
          [player.id],
          (err) => err ? reject(err) : resolve()
        );
      });
      
      socket.emit("hackerAbilityActivated", {
        message: "Hacker ability activated! Auto-defuse ready."
      });
      
    } catch (err) {
      console.error("Error using Hacker ability:", err);
      socket.emit("gameError", { message: "Failed to use Hacker ability" });
    }
  });
});

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

httpServer.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`🌐 Also accessible at http://10.97.16.24:${PORT}`);
  console.log(`🔌 Socket.IO server ready for connections`);
});
