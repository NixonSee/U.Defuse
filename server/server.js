import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth.js";
import gameRoutes from "./routes/game.js";
import gameService from "./services/gameService.js";
import db from "./db.js";
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
app.use("/api/game", gameRoutes);

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
    console.log('🔐 Socket.IO auth middleware triggered');
    console.log('📋 Handshake headers:', socket.handshake.headers);
    
    // Get cookies from handshake headers
    const cookies = socket.handshake.headers.cookie;
    
    console.log('🍪 Raw cookies:', cookies);
    
    if (!cookies) {
      console.error('❌ No cookies found in handshake');
      return next(new Error("Authentication error: No cookies"));
    }

    // Parse cookies manually to get auth_token
    const cookieObj = {};
    cookies.split(';').forEach(cookie => {
      const [key, value] = cookie.trim().split('=');
      cookieObj[key] = value;
    });

    console.log('🍪 Parsed cookies:', Object.keys(cookieObj));

    const token = cookieObj.auth_token;
    
    if (!token) {
      console.error('❌ No auth_token found in cookies');
      return next(new Error("Authentication error: No auth token"));
    }

    console.log('🎟️ Token found, verifying...');

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('✅ Token decoded:', { id: decoded.id, username: decoded.username });
    
    // Since we include user data in JWT, we can use it directly
    socket.userId = decoded.id;
    socket.username = decoded.username;
    socket.email = decoded.email;
    
    console.log('✅ Socket authenticated:', { userId: socket.userId, username: socket.username });
    next();
  } catch (err) {
    console.error("❌ Socket authentication error:", err.message);
    next(new Error("Authentication error: " + err.message));
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
      
      // If game session exists, mark player as disconnected (allow reconnection)
      if (room.gameSessionId && leavingPlayer) {
        leavingPlayer.disconnected = true;
        console.log(`🔌 Marked ${socket.username} as disconnected in room ${roomCode}`);
        
        // Notify remaining players that this player disconnected
        io.to(roomCode).emit("playerDisconnected", {
          playerId: leavingPlayer.id,
          username: leavingPlayer.username
        });
        
        // Don't end the game, preserve room for reconnection
        console.log(`🎮 Preserving room ${roomCode} for ${socket.username} to reconnect`);
        return;
      }
      
      // Game hasn't started yet, proceed with normal disconnect handling
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
    console.log('🔍 Debug - Socket context:', {
      userId: socket.userId,
      username: socket.username,
      socketId: socket.id,
      hasUserId: !!socket.userId
    });
    
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
      isHost: true,
      disconnected: false // Explicitly set as connected when creating room
    };
    
    console.log('✅ Creating host player:', hostPlayer);
    
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
      socket.emit("roomError", { message: "Room does not exist" });
      console.log(`❌ Room ${roomCode} not found`);
      return;
    }
    
    const room = gameRooms.get(roomCode);
    
    // Check if room is full (max 4 players)
    if (room.players.length > 4) {
      socket.emit("roomError", { message: "This room is full. Please try another room." });
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
      isHost: false,
      disconnected: false // Explicitly set as connected when joining
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

  // Handle rejoin room (for game navigation)
  socket.on("rejoinRoom", (data) => {
    const { roomCode } = data;
    console.log(`🔄 ${socket.username} (ID: ${socket.userId}) rejoining room: ${roomCode}`);
    
    if (!gameRooms.has(roomCode)) {
      console.log(`❌ Room ${roomCode} not found for rejoin`);
      socket.emit("roomError", { message: "Room does not exist" });
      return;
    }
    
    const room = gameRooms.get(roomCode);
    
    // Update the player's socket ID if they're already in the room
    const existingPlayer = room.players.find(p => p.id === socket.userId);
    if (existingPlayer) {
      console.log(`🔄 Updating socket ID for ${socket.username} in room ${roomCode}`);
      existingPlayer.socketId = socket.id;
      
      // Mark player as reconnected (always set to false when rejoining)
      existingPlayer.disconnected = false;
      console.log(`✅ ${socket.username} socket updated and marked as connected in room`);
      
      // Notify other players about reconnection
      io.to(roomCode).emit("playerReconnected", {
        playerId: existingPlayer.id,
        username: socket.username
      });
    }
    
    // Rejoin the Socket.IO room
    socket.join(roomCode);
    socket.roomCode = roomCode;
    
    console.log(`✅ ${socket.username} rejoined room ${roomCode}`);
    console.log(`🚪 Socket ${socket.id} rejoined Socket.IO room ${roomCode}`);
    
    // If game session exists, mark game as active (players have navigated to game)
    if (room.gameSessionId) {
      room.gameActive = true;
      console.log(`🎮 Game is now active in room ${roomCode}`);
      
      gameService.getGameState(room.gameSessionId).then(gameState => {
        // Check if room still exists (might have been deleted while fetching)
        if (!gameRooms.has(roomCode)) {
          console.log(`⚠️ Room ${roomCode} was deleted while fetching game state, skipping sync`);
          return;
        }
        
        // Check if only one player remains (game ended)
        const activePlayers = gameState.players.filter(p => !p.is_eliminated);
        if (activePlayers.length === 1) {
          const winner = activePlayers[0];
          console.log(`🏆 Game has ended! Winner: ${winner.username}`);
          
          // Send game ended event to rejoining player
          io.to(roomCode).emit("gameEnded", {
            winner: {
              id: winner.user_id,
              username: winner.username,
              score: winner.score
            },
            reason: 'last_player_standing',
            finalScores: cleanPlayerData(gameState.players)
          });
          return; // Don't send regular game state sync
        }
        
        // Merge disconnected status from room's player list into game state players
        const playersWithConnectionStatus = gameState.players.map(dbPlayer => {
          const roomPlayer = room.players.find(rp => rp.id === dbPlayer.user_id);
          return {
            ...dbPlayer,
            disconnected: roomPlayer?.disconnected || false
          };
        });
        
        const syncData = {
          gameSessionId: room.gameSessionId,
          roomCode: roomCode,
          players: cleanPlayerData(playersWithConnectionStatus),
          currentTurn: room.currentTurn,
          status: 'in_progress'
        };
        
        console.log(`🔄 Syncing game state to all players in room ${roomCode}`);
        console.log(`🔄 Current turn: ${room.currentTurn}`);
        console.log(`🔄 Players:`, playersWithConnectionStatus.map(p => ({ username: p.username, score: p.score, disconnected: p.disconnected })));
        
        // Send to ALL players in the room to ensure everyone is in sync
        io.to(roomCode).emit("gameStateSync", syncData);
        
        // Also send directly to the rejoining player to be sure
        socket.emit("gameStateSync", syncData);
      }).catch(err => {
        console.error("Error syncing game state on rejoin:", err);
      });
    }
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
    
    // If game session exists, mark player as disconnected (allow reconnection)
    if (room.gameSessionId && leavingPlayer) {
      leavingPlayer.disconnected = true;
      console.log(`🔌 Marked ${socket.username} as disconnected in room ${roomCode}`);
      
      // Notify remaining players that this player disconnected
      io.to(roomCode).emit("playerDisconnected", {
        playerId: leavingPlayer.id,
        username: leavingPlayer.username
      });
      
      // Don't end the game, preserve room for reconnection
      console.log(`🎮 Preserving room ${roomCode} for ${socket.username} to reconnect`);
      socket.leave(roomCode);
      delete socket.roomCode;
      return;
    }
    
    // Game hasn't started - proceed with normal leave handling
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
      socket.emit("gameError", { message: "Only the room host can start the game" });
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
      room.gameActive = false; // Not active yet - players are still navigating
      
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
      socket.emit("gameError", { message: "Unable to start game. Please try again." });
    }
  });

  // Handle bomb scan
  socket.on("scanBomb", async (data) => {
    const { gameSessionId } = data;
    
    try {
      const result = await gameService.triggerBomb(gameSessionId, socket.userId);
      
      console.log(`💣 ${socket.username} scanned bomb! Timer: ${result.timerSeconds}s`);
      
      // Send quiz to player (with their specific timer including bonuses)
      socket.emit("bombQuiz", {
        question: result.question,
        timerSeconds: result.timerSeconds,
        bonusTime: result.bonusTime
      });
      
      // Notify room that player triggered bomb (use base timer for other players)
      if (socket.roomCode) {
        io.to(socket.roomCode).emit("playerTriggeredBomb", {
          playerId: socket.userId,
          username: socket.username,
          timerSeconds: 30 // Base timer for spectators, not affected by timekeeper role
        });
      }
      
    } catch (err) {
      console.error("Error triggering bomb:", err);
      socket.emit("gameError", { message: "Unable to trigger bomb. Please try again." });
    }
  });

  // Handle quiz answer
  socket.on("answerQuiz", async (data) => {
    const { gameSessionId, questionId, answer, timeTaken, usedHackerAbility } = data;
    
    try {
      // If claiming to use hacker ability, validate it
      if (usedHackerAbility) {
        const gameState = await gameService.getGameState(gameSessionId);
        const player = gameState.players.find(p => p.user_id === socket.userId);
        
        if (!player || player.role !== 'hacker') {
          socket.emit("gameError", { message: "This ability is only available to the Hacker" });
          return;
        }
        
        if (player.hacker_ability_used) {
          socket.emit("gameError", { message: "You've already used your Hacker ability" });
          return;
        }
      }
      
      const result = await gameService.defuseBomb(
        gameSessionId,
        socket.userId,
        questionId,
        answer,
        timeTaken,
        usedHackerAbility
      );
      
      console.log(`${result.success ? '✅' : '❌'} ${socket.username} ${result.success ? 'defused' : 'failed'} bomb!`);
      console.log('Sending quizResult:', result);
      
      // ALWAYS send result to player first
      socket.emit("quizResult", {
        success: result.success,
        scoreGained: result.scoreGained || 0,
        correctAnswer: result.correctAnswer,
        timeTaken: timeTaken || 0,
        method: usedHackerAbility ? 'hacker' : 'quiz'
      });
      
      // If wrong answer, eliminate player
      if (!result.success) {
        await gameService.eliminatePlayer(socket.userId, gameSessionId);
        console.log(`💀 ${socket.username} eliminated due to wrong answer!`);
      }
      
      // Update room with score
      if (socket.roomCode) {
        const gameState = await gameService.getGameState(gameSessionId);
        io.to(socket.roomCode).emit("scoreUpdate", {
          players: cleanPlayerData(gameState.players)
        });
        
        if (result.success) {
          io.to(socket.roomCode).emit("bombDefused", {
            playerId: socket.userId,
            username: socket.username,
            scoreGained: result.scoreGained,
            method: result.method || 'quiz'
          });
        } else {
          // Notify elimination
          io.to(socket.roomCode).emit("playerEliminatedEvent", {
            playerId: socket.userId,
            username: socket.username,
            players: cleanPlayerData(gameState.players)
          });
          
          // Check if only one player remains (others eliminated)
          const activePlayers = gameState.players.filter(p => !p.is_eliminated);
          if (activePlayers.length === 1) {
            // Immediately show winner
            const winner = activePlayers[0];
            console.log(`🏆 Only one player remaining! Winner: ${winner.username}`);
            
            // Mark game as completed in database
            await gameService.completeGame(gameSessionId, winner.user_id);
            
            io.to(socket.roomCode).emit("gameEnded", {
              winner: {
                id: winner.user_id,
                username: winner.username,
                score: winner.score
              },
              reason: 'last_player_standing',
              finalScores: cleanPlayerData(gameState.players)
            });
          } else {
            // Check if game ended by other means
            const endCheck = await gameService.checkGameEnd(gameSessionId);
            if (endCheck.ended) {
              const winner = gameState.players.find(p => !p.is_eliminated) || 
                            gameState.players.reduce((max, p) => p.score > max.score ? p : max);
              
              // Mark game as completed in database
              await gameService.completeGame(gameSessionId, winner.user_id);
              
              io.to(socket.roomCode).emit("gameEnded", {
                winner: {
                  id: winner.user_id,
                  username: winner.username,
                  score: winner.score
                },
                reason: endCheck.reason,
                finalScores: cleanPlayerData(gameState.players)
              });
            } else {
              // Game continues - pass turn to next alive player
              const room = gameRooms.get(socket.roomCode);
              if (room) {
                const currentTurnIndex = room.currentTurn !== undefined ? room.currentTurn : 0;
                let nextTurnIndex = (currentTurnIndex + 1) % gameState.players.length;
                let attempts = 0;
                
                // Skip eliminated or disconnected players
                while (attempts < gameState.players.length) {
                  const nextPlayer = gameState.players[nextTurnIndex];
                  const roomPlayer = room.players.find(p => p.id === nextPlayer.user_id);
                  
                  if (!nextPlayer.is_eliminated && !roomPlayer?.disconnected) {
                    break;
                  }
                  
                  nextTurnIndex = (nextTurnIndex + 1) % gameState.players.length;
                  attempts++;
                }
                
                room.currentTurn = nextTurnIndex;
                console.log(`⏭️ ${socket.username} eliminated - passing turn to ${gameState.players[nextTurnIndex].username}`);
                
                io.to(socket.roomCode).emit("turnChanged", {
                  currentTurn: nextTurnIndex,
                  nextPlayer: gameState.players[nextTurnIndex]
                });
              }
            }
          }
        }
      }
      
    } catch (err) {
      console.error("Error answering quiz:", err);
      // Still send a result so UI isn't stuck
      socket.emit("quizResult", {
        success: false,
        scoreGained: 0,
        correctAnswer: 'Unknown',
        timeTaken: timeTaken || 0,
        method: 'quiz'
      });
      socket.emit("gameError", { message: "Unable to submit answer. Please try again." });
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
          players: cleanPlayerData(gameState.players)
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
          players: cleanPlayerData(gameState.players)
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
            finalScores: cleanPlayerData(gameState.players)
          });
        } else {
          // Game continues - pass turn to next alive player
          const room = gameRooms.get(socket.roomCode);
          if (room) {
            const currentTurnIndex = room.currentTurn !== undefined ? room.currentTurn : 0;
            let nextTurnIndex = (currentTurnIndex + 1) % gameState.players.length;
            let attempts = 0;
            
            // Skip eliminated or disconnected players
            while (attempts < gameState.players.length) {
              const nextPlayer = gameState.players[nextTurnIndex];
              const roomPlayer = room.players.find(p => p.id === nextPlayer.user_id);
              
              if (!nextPlayer.is_eliminated && !roomPlayer?.disconnected) {
                break;
              }
              
              nextTurnIndex = (nextTurnIndex + 1) % gameState.players.length;
              attempts++;
            }
            
            room.currentTurn = nextTurnIndex;
            console.log(`⏭️ ${socket.username} eliminated - passing turn to ${gameState.players[nextTurnIndex].username}`);
            
            io.to(socket.roomCode).emit("turnChanged", {
              currentTurn: nextTurnIndex,
              nextPlayer: gameState.players[nextTurnIndex]
            });
          }
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
      
      if (player.hacker_ability_used) {
        socket.emit("gameError", { message: "Hacker ability already used" });
        return;
      }
      
      console.log(`🔓 ${socket.username} used Hacker ability!`);
      
      // Mark ability as used in database
      await new Promise((resolve, reject) => {
        db.query(
          'UPDATE player_scores SET hacker_ability_used = TRUE WHERE user_id = ? AND game_round_id = ?',
          [socket.userId, gameState.gameRoundId],
          (err) => err ? reject(err) : resolve()
        );
      });
      
      socket.emit("hackerAbilityActivated", {
        message: "Hacker ability activated! Auto-defuse ready."
      });
      
    } catch (err) {
      console.error("Error using Hacker ability:", err);
      socket.emit("gameError", { message: "Unable to use Hacker ability. Please try again." });
    }
  });

  // Handle pass turn
  socket.on("passTurn", async (data) => {
    console.log('🔵 SERVER: passTurn event received from', socket.username, 'data:', data);
    const { gameSessionId } = data;
    const roomCode = socket.roomCode;
    
    console.log('🔵 SERVER: roomCode:', roomCode, 'has room:', gameRooms.has(roomCode));
    
    if (!roomCode || !gameRooms.has(roomCode)) {
      console.log('❌ SERVER: Room not found for', roomCode);
      socket.emit("gameError", { message: "Room not found" });
      return;
    }
    
    try {
      const room = gameRooms.get(roomCode);
      const gameState = await gameService.getGameState(gameSessionId);
      
      // Award 5 points for passing turn
      const currentPlayer = gameState.players.find(p => p.user_id === socket.userId);
      if (currentPlayer) {
        await new Promise((resolve, reject) => {
          db.query(
            'UPDATE player_scores SET score = score + 5 WHERE id = ?',
            [currentPlayer.id],
            (err) => err ? reject(err) : resolve(true)
          );
        });
        console.log(`⭐ ${socket.username} earned 5 points for passing turn`);
        
        // Emit score update immediately
        const updatedGameState = await gameService.getGameState(gameSessionId);
        io.to(roomCode).emit("scoreUpdate", {
          players: cleanPlayerData(updatedGameState.players)
        });
      }
      
      // Get current turn index from full players array
      const currentTurnIndex = room.currentTurn !== undefined ? room.currentTurn : 0;
      
      // Find next non-eliminated and non-disconnected player
      let nextTurnIndex = (currentTurnIndex + 1) % gameState.players.length;
      let attempts = 0;
      
      // Skip eliminated or disconnected players
      while (attempts < gameState.players.length) {
        const nextPlayer = gameState.players[nextTurnIndex];
        const roomPlayer = room.players.find(p => p.id === nextPlayer.user_id);
        
        if (!nextPlayer.is_eliminated && !roomPlayer?.disconnected) {
          break;
        }
        
        nextTurnIndex = (nextTurnIndex + 1) % gameState.players.length;
        attempts++;
      }
      
      // Update room's current turn
      room.currentTurn = nextTurnIndex;
      
      console.log(`⏭️ ${socket.username} passed turn. Current turn index: ${currentTurnIndex} -> ${nextTurnIndex}`);
      console.log(`   Next player: ${gameState.players[nextTurnIndex].username}`);
      
      // Notify all players in the room
      console.log('🟢 SERVER: Emitting turnChanged to room', roomCode);
      console.log('🟢 SERVER: Room members:', Array.from(io.sockets.adapter.rooms.get(roomCode) || []));
      console.log('🟢 SERVER: Turn data - currentTurn:', nextTurnIndex, 'nextPlayer:', gameState.players[nextTurnIndex]?.username);
      
      io.to(roomCode).emit("turnChanged", {
        currentTurn: nextTurnIndex,
        nextPlayer: gameState.players[nextTurnIndex]
      });
      console.log('🟢 SERVER: turnChanged emitted successfully');
      
    } catch (err) {
      console.error("Error passing turn:", err);
      socket.emit("gameError", { message: "Unable to pass turn. Please try again." });
    }
  });

});

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

// Helper function to clean player data for socket transmission
const cleanPlayerData = (players) => {
  return players.map(p => ({
    id: p.id,
    user_id: p.user_id,
    username: p.username,
    role: p.role,
    roleIcon: p.roleIcon,
    score: p.score,
    is_eliminated: p.is_eliminated,
    bombs_defused: p.bombs_defused || 0,
    bombs_failed: p.bombs_failed || 0,
    disconnected: p.disconnected || false
  }));
};

// Only start server if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  httpServer.listen(PORT, HOST, () => {
    console.log(`✅ Server running on http://${HOST}:${PORT}`);
    console.log(`🌐 Also accessible at http://10.97.16.24:${PORT}`);
    console.log(`🔌 Socket.IO server ready for connections`);
  });
}

// Export for Vercel serverless function
export default httpServer;
