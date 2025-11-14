import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socketService from "../utils/socket";
import GameRules from "./GameRules";

interface User {
  id: number;
  username: string;
  email: string;
}

interface ConnectedPlayer {
  id: number;
  username: string;
  email: string;
  socketId: string;
  connectedAt: Date;
}

const Lobby: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [connectedPlayers, setConnectedPlayers] = useState<ConnectedPlayer[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const userData = localStorage.getItem("userData");
    
    if (!userData) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Connect to Socket.IO after user is set
      setTimeout(() => connectToSocket(), 100);
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/login");
    }

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [navigate]);

  const connectToSocket = async () => {
    console.log("🔌 Attempting to connect to Socket.IO using token authentication");
    
    try {
      const socket = await socketService.connect();
      console.log("✅ Socket.IO connection established:", socket.id);
      setIsConnected(true);
      
      // Set up event listeners
      socketService.onPlayersUpdate((data) => {
        console.log("🎮 Players update received:", data);
        console.log("📊 Total players from server:", data.totalPlayers);
        console.log("👥 Players array:", data.connectedPlayers);
        
        // Get current user from localStorage since state might not be ready
        const currentUserData = localStorage.getItem("userData");
        const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
        console.log("🆔 Current user from localStorage:", currentUser?.id, currentUser?.username);
        
        setConnectedPlayers(data.connectedPlayers);
      });

      socketService.onWelcome((data) => {
        console.log("👋 Welcome message:", data.message);
        console.log("🆔 Player info:", data.playerInfo);
      });

      socketService.onNewMessage((data) => {
        console.log("💬 New message received:", data);
        setMessages(prev => [...prev, data]);
      });

      socketService.onGameStarted((data) => {
        console.log("🎮 Game started!", data);
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

      // Request current player list after setting up listeners
      setTimeout(() => {
        console.log("📋 Requesting player list after connection setup...");
        socketService.requestPlayerList();
      }, 200);

    } catch (error) {
      console.error("❌ Socket connection failed:", error);
      setIsConnected(false);
    }
  };

  const handleLogout = async () => {
    try {
      socketService.disconnect();
      // Call logout API to clear cookie
      await fetch(`http://${window.location.hostname}:5000/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      localStorage.removeItem("userData");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect to login even if API call fails
      localStorage.removeItem("userData");
      navigate("/login");
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && socketService.isConnected()) {
      socketService.sendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060606] text-yellow-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060606] text-yellow-400 font-sans relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,0,0.05)_0%,transparent_30%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40"></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-4 sm:p-6 border-b border-yellow-400/20">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-wider sm:tracking-[0.15em]">U.DEFUSE LOBBY</h1>
          <p className="text-gray-400 text-xs sm:text-sm">Welcome back, {user.username}!</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600/80 hover:bg-red-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all text-sm sm:text-base"
        >
          Logout
        </button>
      </div>

      <div className="relative z-10 p-4 sm:p-6">
        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Player Stats Card */}
          <div className="bg-[#0d0d0f]/80 border border-yellow-400/20 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,0,0.1)]">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-yellow-300">Player Profile</h2>
            <div className="space-y-2">
              <p><span className="text-gray-400">Username:</span> {user.username}</p>
              <p><span className="text-gray-400">Email:</span> {user.email}</p>
              <p><span className="text-gray-400">Status:</span> <span className="text-green-400">Online</span></p>
            </div>
          </div>

          {/* Game Actions */}
          <div className="bg-[#0d0d0f]/80 border border-yellow-400/20 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,0,0.1)]">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-yellow-300">Game Controls</h2>
              <button
                onClick={() => setIsRulesOpen(true)}
                className="bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 text-sm sm:text-base font-bold"
                title="Game Rules"
              >
                ?
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                // ------ This is for start button requirement ------ //
                // disabled={connectedPlayers.length < 2}
                // onClick={() => navigate("/startgame")}
                onClick={() => navigate("/StartGame")}
                className="bg-yellow-400/90 hover:bg-yellow-500 text-black font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg uppercase tracking-wider sm:tracking-widest transition-all transform hover:scale-[1.02] text-sm sm:text-base"
              >
                Start Game
              </button>
              <button className="bg-blue-600/80 hover:bg-blue-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg uppercase tracking-wider sm:tracking-widest transition-all transform hover:scale-[1.02] text-sm sm:text-base"
              onClick={() => navigate("/JoinGame")}
              >
                Join Game
              </button>
              <button 
                onClick={() => navigate("/settings")}
                className="bg-purple-600/80 hover:bg-purple-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg uppercase tracking-wider sm:tracking-widest transition-all transform hover:scale-[1.02] text-sm sm:text-base"
              >
                Settings
              </button>
              <button 
                onClick={() => navigate("/history")}
                className="bg-green-600/80 hover:bg-green-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg uppercase tracking-wider sm:tracking-widest transition-all transform hover:scale-[1.02] text-sm sm:text-base"
              >
                History
              </button>
            </div>
          </div>

          {/* Connected Players */}
          <div className="bg-[#0d0d0f]/80 border border-yellow-400/20 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,0,0.1)]">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-yellow-300">
                Other Players ({(() => {
                  // Get current username from localStorage or state
                  const currentUserData = localStorage.getItem("userData");
                  let currentUsername = user?.username;
                  if (!currentUsername && currentUserData) {
                    currentUsername = JSON.parse(currentUserData).username;
                  }
                  return connectedPlayers.filter(player => player.username !== currentUsername).length;
                })()})
              </h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm text-gray-400">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>

            {(() => {
              // Get current username from localStorage or state
              const currentUserData = localStorage.getItem("userData");
              let currentUsername = user?.username;
              if (!currentUsername && currentUserData) {
                currentUsername = JSON.parse(currentUserData).username;
              }
              const otherPlayers = connectedPlayers.filter(player => player.username !== currentUsername);
              return otherPlayers.length === 0;
            })() ? (
              <p className="text-gray-400 text-center py-4">
                No other players connected
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(() => {
                  // Get current username from localStorage or state
                  const currentUserData = localStorage.getItem("userData");
                  let currentUsername = user?.username;
                  if (!currentUsername && currentUserData) {
                    currentUsername = JSON.parse(currentUserData).username;
                  }
                  return connectedPlayers.filter(player => player.username !== currentUsername);
                })().map((player, index) => (
                    <div key={player.username || index} className="flex items-center justify-between p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/20">
                      <div>
                        <div className="font-semibold text-yellow-300">{player.username}</div>
                        <div className="text-xs text-gray-400">{player.email || 'No email'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 text-sm animate-pulse">●</span>
                        <span className="text-xs text-gray-400">Online</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Chat/Messages */}
          <div className="bg-[#0d0d0f]/80 border border-yellow-400/20 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,0,0.1)]">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-yellow-300">Game Chat</h2>
            
            {/* Messages */}
            <div className="space-y-2 max-h-32 overflow-y-auto mb-4">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No messages yet</p>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className="p-2 bg-yellow-400/5 rounded border-l-2 border-yellow-400/30">
                    <span className="text-yellow-300 font-semibold">{msg.from}: </span>
                    <span className="text-gray-300">{msg.message}</span>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="flex gap-1 sm:gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 min-w-0 bg-[#141418] text-yellow-100 placeholder-gray-500 rounded-lg px-2 sm:px-3 py-2 text-sm border border-yellow-500/20 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all"
                disabled={!isConnected}
              />
              <button
                onClick={sendMessage}
                disabled={!isConnected || !newMessage.trim()}
                className="bg-yellow-400/90 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold px-2 sm:px-4 py-2 rounded-lg transition-all text-sm whitespace-nowrap flex-shrink-0"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Game Rules Modal */}
      <GameRules isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
};

export default Lobby;
