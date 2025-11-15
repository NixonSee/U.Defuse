import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import socketService from "../utils/socket";
import { ToastContainer } from "../components/Toast";

interface Player {
  id: number;
  username: string;
  color: string;
  isReady: boolean;
  socketId: string;
  isHost?: boolean;
}

const StartGame: React.FC = () => {
  const [roomCode, setRoomCode] = useState<string>("******");
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [currentSocketId, setCurrentSocketId] = useState<string>("");
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type?: "success" | "error" | "warning" | "info" }>>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const addToast = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    const id = toastIdCounter;
    setToastIdCounter(prev => prev + 1);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    // Get current user
    const userData = localStorage.getItem("userData");
    if (!userData) {
      navigate("/login");
      return;
    }

    // Connect to socket if not already connected
    const initSocket = async () => {
      try {
        if (!socketService.isConnected()) {
          await socketService.connect();
        }

        // Get the current socket ID
        const socket = socketService.getSocket();
        if (socket && socket.id) {
          setCurrentSocketId(socket.id);
          console.log("🔌 Current socket ID:", socket.id);
        }

        // Set up socket listeners for room events FIRST
        socketService.onRoomCreated((data) => {
          console.log("✅ Room created event received:", data);
          console.log("📋 Players in room:", data.players);
          setPlayers(data.players);
          
          // Check if current socket is the host
          const myPlayer = data.players.find((p: any) => p.socketId === socket?.id);
          if (myPlayer?.isHost) {
            setIsHost(true);
            console.log("👑 You are the host!");
          }
        });

        socketService.onPlayerJoined((data) => {
          console.log("✅ Player joined event received:", data);
          console.log("📋 Updated players list:", data.players);
          setPlayers(data.players);
          
          // Check if current socket is the host
          const myPlayer = data.players.find((p: any) => p.socketId === socket?.id);
          if (myPlayer?.isHost) {
            setIsHost(true);
            console.log("👑 You are the host!");
          } else {
            setIsHost(false);
          }
        });

        socketService.onPlayerLeft((data) => {
          console.log("Player left:", data);
          setPlayers(data.players);
        });

        socketService.onPlayerReady((data) => {
          console.log("Player ready update:", data);
          setPlayers(data.players);
        });

        socketService.onRoomError((data) => {
          console.error("Room error:", data.message);
          addToast(data.message, "error");
          setTimeout(() => navigate("/Lobby"), 2000);
        });

        socketService.onRoomClosed((data) => {
          console.log("Room closed:", data.message);
          addToast(data.message, "warning");
          setTimeout(() => navigate("/Lobby"), 2000);
        });

        socketService.onGameStarted((data) => {
          console.log("🎮 Game started!", data);
          setGameStarted(true);
          // Navigate to game dashboard with game state
          navigate('/game-dashboard', {
            state: {
              gameSessionId: data.gameSessionId,
              roomCode: data.roomCode,
              players: data.players,
              currentTurn: data.currentTurn
            }
          });
        });

        // Connection status listeners
        const currentSocket = socketService.getSocket();
        if (currentSocket) {
          currentSocket.on('disconnect', () => {
            console.log('🔌 Disconnected from server');
            addToast('Connection lost, reconnecting...', 'warning');
          });

          currentSocket.on('connect', () => {
            console.log('🔌 Reconnected to server');
            if (currentSocketId) {
              addToast('Reconnected!', 'success');
            }
          });
        }

        // Small delay to ensure listeners are set up
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if joining an existing room or creating new one
        const state = location.state as any;
        
        if (state?.joinAsPlayer && state?.roomCode) {
          // Joining existing room
          console.log("Joining existing room:", state.roomCode);
          setRoomCode(state.roomCode);
          
          // Emit socket event to join room
          socketService.joinRoom(state.roomCode);
        } else {
          // Creating new room (host)
          console.log("Creating new room as host");
          const generatedCode = generateRoomCode();
          setRoomCode(generatedCode);
          
          // Emit socket event to create room
          socketService.createRoom(generatedCode);
        }

      } catch (error) {
        console.error("Socket connection error:", error);
        alert("Failed to connect to game server");
        navigate("/Lobby");
      }
    };

    initSocket();

    return () => {
      // Only leave room when component unmounts if game hasn't started
      // If game started, the room should be preserved
      if (!gameStarted) {
        console.log("🚪 Leaving room on unmount (game not started)");
        socketService.leaveRoom();
      } else {
        console.log("🎮 Game started - preserving room on unmount");
      }
      
      // Cleanup socket listeners
      socketService.removeListener("roomCreated");
      socketService.removeListener("playerJoined");
      socketService.removeListener("playerLeft");
      socketService.removeListener("playerReady");
      socketService.removeListener("roomError");
      socketService.removeListener("roomClosed");
      socketService.removeListener("gameStarted");
    };
  }, [navigate, location, gameStarted]);

  // Room code generator
  const generateRoomCode = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleStart = () => {
    console.log("Starting game with players:", players);
    socketService.startGame();
  };

  const handleExit = () => {
    socketService.leaveRoom();
    navigate("/Lobby");
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    // TODO: Show copied notification
  };

  return (
    <div className="min-h-screen bg-[#060606] text-yellow-400 font-sans relative overflow-hidden">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,0,0.05)_0%,transparent_30%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[40px_40px] opacity-40"></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-4 sm:p-6 border-b border-yellow-400/20">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-wider sm:tracking-[0.15em]">
            {isHost ? "GAME LOBBY" : "WAITING ROOM"}
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm">
            {isHost ? "Waiting for players to join..." : "Get ready to play!"}
          </p>
        </div>
        <button
          onClick={handleExit}
          className="bg-red-600/80 hover:bg-red-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all text-sm sm:text-base font-bold"
        >
          Exit
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Room Code Display with QR Code */}
          <div className="bg-[#0d0d0f]/80 border-2 border-yellow-400/30 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-yellow-300 text-center">
              Join This Game
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
              {/* QR Code */}
              <div className="shrink-0">
                <div className="bg-white p-4 rounded-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      `${window.location.origin}/join/${roomCode}`
                    )}`}
                    alt="QR Code"
                    className="w-36 h-36 sm:w-44 sm:h-44"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Scan to join
                </p>
              </div>

              {/* Room Code */}
              <div className="flex-1 text-center">
                <p className="text-sm text-gray-400 mb-2">Or enter code:</p>
                <div className="bg-black/50 border-2 border-yellow-400/40 rounded-xl p-6 mb-4">
                  <p className="text-3xl sm:text-5xl font-mono font-bold text-yellow-400 tracking-[0.3em] select-all">
                    {roomCode}
                  </p>
                </div>
                <button
                  onClick={copyRoomCode}
                  className="bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 py-2 px-6 rounded-lg transition-all font-semibold"
                >
                  📋 Copy Code
                </button>
              </div>
            </div>
          </div>

          {/* Players Grid */}
          <div className="bg-[#0d0d0f]/80 border border-yellow-400/20 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-yellow-300">
              Players ({players.length}/4)
            </h2>

            {/* Debug info - remove this later */}
            {players.length === 0 && (
              <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 rounded-lg">
                <p className="text-red-400 text-sm">⚠️ No players loaded yet. Waiting for socket data...</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {players.map((player, index) => (
                <div
                  key={`${player.id}-${player.socketId}`}
                  className="relative bg-black/40 border-2 rounded-xl p-6 transition-all hover:scale-105"
                  style={{
                    borderColor: player.color,
                    boxShadow: `0 0 20px ${player.color}40`,
                  }}
                >
                  {/* Player Number Badge */}
                  <div
                    className="absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2"
                    style={{
                      backgroundColor: player.color,
                      borderColor: player.color,
                      color: "#000",
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Player Info */}
                  <div className="text-center mt-2">
                    <p
                      className="text-xl font-bold mb-2"
                      style={{ color: player.color }}
                    >
                      PLAYER {index + 1} {player.isHost && "👑"}
                    </p>
                    <p className="text-gray-300 font-semibold text-lg mb-2">
                      {player.username}
                      {player.isHost && <span className="text-yellow-400 text-xs ml-2">(HOST)</span>}
                    </p>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        player.isReady
                          ? "bg-green-600/30 text-green-400 border border-green-600/50"
                          : "bg-gray-600/30 text-gray-400 border border-gray-600/50"
                      }`}
                    >
                      {player.isReady ? "✓ Ready" : "⏳ Waiting"}
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty Slots */}
              {[...Array(4 - players.length)].map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="bg-black/20 border-2 border-dashed border-gray-600/30 rounded-xl p-6 flex items-center justify-center"
                >
                  <div className="text-center">
                    <p className="text-4xl text-gray-600 mb-2">+</p>
                    <p className="text-gray-500 text-sm font-semibold">
                      ADD PLAYER
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Start Button (Only for Host) */}
          {isHost && (
            <div className="bg-[#0d0d0f]/80 border border-yellow-400/20 rounded-2xl p-6 backdrop-blur-md">
              <button
                onClick={handleStart}
                disabled={players.length < 2 || !players.every((p) => p.isReady)}
                className="w-full bg-yellow-400/90 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 text-black disabled:text-gray-400 font-bold py-4 px-6 rounded-xl uppercase tracking-widest transition-all transform hover:scale-[1.02] disabled:hover:scale-100 text-lg"
                title={
                  players.length < 2
                    ? "Need at least 2 players to start"
                    : !players.every((p) => p.isReady)
                    ? "All players must be ready"
                    : "Start the game"
                }
              >
                {players.length < 2
                  ? `START GAME (${players.length}/2)`
                  : !players.every((p) => p.isReady)
                  ? "WAITING FOR PLAYERS TO BE READY"
                  : "START GAME"}
              </button>

              {players.length >= 2 && !players.every((p) => p.isReady) && (
                <p className="text-center text-yellow-300 text-sm mt-3">
                  ⏳ Waiting for all players to be ready...
                </p>
              )}
            </div>
          )}

          {/* Player Ready Button (Only for Non-Host) */}
          {!isHost && (
            <div className="bg-[#0d0d0f]/80 border border-yellow-400/20 rounded-2xl p-6 backdrop-blur-md">
              <button
                onClick={() => socketService.toggleReady()}
                className={`w-full font-bold py-4 px-6 rounded-xl uppercase tracking-widest transition-all transform hover:scale-[1.02] text-lg ${
                  currentSocketId && players.find((p) => p.socketId === currentSocketId)?.isReady
                    ? "bg-gray-600/80 hover:bg-gray-700 text-white"
                    : "bg-green-600/90 hover:bg-green-700 text-white"
                }`}
              >
                {currentSocketId && players.find((p) => p.socketId === currentSocketId)?.isReady
                  ? "✓ READY"
                  : "READY UP"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartGame;

