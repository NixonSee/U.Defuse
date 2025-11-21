import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../utils/socket';
import { ToastContainer } from '../components/Toast';
import { Scanner } from '@yudiel/react-qr-scanner';

interface Player {
  id: number;
  user_id: number;
  username: string;
  role: string;
  roleIcon: string;
  score: number;
  hand_cards: any[];
  is_eliminated: boolean;
  bombs_defused: number;
  bombs_failed: number;
  disconnected?: boolean;
}

interface GameState {
  gameSessionId: number;
  roomCode: string;
  players: Player[];
  currentTurn: number;
  status: string;
}

const ROLE_ICONS: { [key: string]: string } = {
  hacker: '💻',
  spy: '🕵️‍♂️',
  saboteur: '💣',
  trickster: '🎭',
  gambler: '🎲',
  timekeeper: '⏱️'
};

const GameDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [showHackerPrompt, setShowHackerPrompt] = useState(false);
  const [hackerAbilityUsed, setHackerAbilityUsed] = useState(false);
  const [hackerAbilityUsedInDB, setHackerAbilityUsedInDB] = useState(false);
  const [showCountdown, setShowCountdown] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [quizTimer, setQuizTimer] = useState<number | null>(null);
  const hasRejoined = React.useRef(false);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [lobbyCountdown, setLobbyCountdown] = useState(10);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type?: "success" | "error" | "warning" | "info" }>>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  const addToast = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    const id = toastIdCounter;
    setToastIdCounter(prev => prev + 1);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    // Countdown timer on game start
    if (showCountdown && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showCountdown && countdown === 0) {
      setShowCountdown(false);
    }
  }, [countdown, showCountdown]);

  useEffect(() => {
    // Get game state from navigation or listen for updates
    if (location.state?.gameSessionId && !hasRejoined.current) {
      const initialGameState = {
        gameSessionId: location.state.gameSessionId,
        roomCode: location.state.roomCode,
        players: location.state.players || [],
        currentTurn: location.state.currentTurn || 0,
        status: 'in_progress'
      };
      setGameState(initialGameState);
      console.log('🎮 Initial game state from navigation:', initialGameState);
      
      // Store roomCode for quiz navigation
      sessionStorage.setItem('currentRoomCode', location.state.roomCode);
      
      // Rejoin the room to ensure socket is connected (only once)
      console.log('🔵 CLIENT: Rejoining room', location.state.roomCode);
      socket.emit('rejoinRoom', { roomCode: location.state.roomCode });
      hasRejoined.current = true;
    }
    
    // If returning from quiz, hide countdown and request fresh game state
    if (location.state?.fromQuiz) {
      console.log('🔄 Returning from quiz, syncing game state');
      setShowCountdown(false); // Hide countdown when returning from quiz
      
      if (gameState) {
        socket.emit('rejoinRoom', { roomCode: gameState.roomCode });
      } else if (location.state?.gameState) {
        // Restore game state from navigation to prevent loading screen
        setGameState(location.state.gameState);
        socket.emit('rejoinRoom', { roomCode: location.state.gameState.roomCode });
      }
    }

    // Get current user ID
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserId(user.id);
      console.log('🔵 CLIENT: Current user ID:', user.id);
    }

    // Socket listeners
    socket.on('scoreUpdate', (data) => {
      console.log('📊 Score update received:', data);
      setGameState(prev => prev ? { ...prev, players: data.players } : null);
    });

    socket.on('playerTriggeredBomb', (data) => {
      console.log(`${data.username} triggered a bomb! Timer: ${data.timerSeconds}s`);
      setQuizTimer(data.timerSeconds);
      // Start countdown
      const interval = setInterval(() => {
        setQuizTimer(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    });

    socket.on('bombDefused', (data) => {
      console.log(`${data.username} defused bomb using ${data.method}! +${data.scoreGained} points`);
      setQuizTimer(null);
    });

    socket.on('turnChanged', (data) => {
      console.log('🟢 Turn changed event received:', data);
      console.log('🟢 Previous turn:', gameState?.currentTurn, '→ New turn:', data.currentTurn);
      console.log('🟢 Next player username:', data.nextPlayer?.username);
      setGameState(prev => {
        if (!prev) return null;
        const updated = { 
          ...prev, 
          currentTurn: data.currentTurn
        };
        console.log('🟢 GameState updated:', updated);
        console.log('🟢 Current turn player is now:', updated.players[updated.currentTurn]?.username);
        return updated;
      });
    });

    socket.on('playerEliminatedEvent', (data) => {
      console.log(`${data.username} was eliminated!`);
      setGameState(prev => prev ? { ...prev, players: data.players } : null);
    });

    socket.on('gameEndedByDisconnect', (data) => {
      console.log(`⚠️ Game ended: ${data.message}`);
      addToast(`Game Ended: ${data.message}`, "warning");
      setTimeout(() => navigate('/lobby'), 2000);
    });

    socket.on('playerDisconnected', (data) => {
      console.log(`🔌 Player disconnected:`, data);
      setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.map(p =>
            p.user_id === data.playerId
              ? { ...p, disconnected: true }
              : p
          )
        };
      });
    });

    socket.on('playerReconnected', (data) => {
      console.log(`✅ Player reconnected:`, data);
      setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.map(p =>
            p.user_id === data.playerId
              ? { ...p, disconnected: false }
              : p
          )
        };
      });
    });

    socket.on('gameStateSync', (data) => {
      console.log('🔄 Game state sync received:', data);
      setGameState({
        gameSessionId: data.gameSessionId,
        roomCode: data.roomCode,
        players: data.players,
        currentTurn: data.currentTurn,
        status: data.status
      });
      
      // Check if current player has used hacker ability
      const currentPlayerData = data.players.find((p: any) => p.user_id === currentUserId);
      if (currentPlayerData?.hacker_ability_used) {
        setHackerAbilityUsedInDB(true);
      }
    });

    socket.on('roomError', (data) => {
      console.log('❌ Room error:', data.message);
      addToast(data.message, "error");
      setTimeout(() => navigate('/lobby'), 2000);
    });

    socket.on('gameEnded', (data) => {
      console.log('🏆 Game ended:', data);
      setWinnerData(data);
      setShowWinner(true);
      setShowCountdown(false); // Hide countdown when game ends
      
      // Start countdown to lobby
      let countdown = 10;
      setLobbyCountdown(countdown);
      const countdownInterval = setInterval(() => {
        countdown--;
        setLobbyCountdown(countdown);
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          navigate('/lobby');
        }
      }, 1000);
    });

    // If game has already ended (from navigation state), trigger winner screen immediately
    if (location.state?.gameEnded) {
      console.log('🏆 Game already ended, requesting final state');
      // Request the game ended event from server
      socket.emit('requestGameState', { roomCode: sessionStorage.getItem('currentRoomCode') });
    }

    socket.on('hackerAbilityActivated', (data) => {
      setHackerAbilityUsed(true);
      setShowHackerPrompt(false);
      addToast(data.message, "success");
    });

    // Connection status listeners
    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      addToast('Connection lost, reconnecting...', 'warning');
    });

    socket.on('connect', () => {
      console.log('🔌 Reconnected to server');
      if (gameState) {
        addToast('Reconnected!', 'success');
        // Rejoin room after reconnection
        socket.emit('rejoinRoom', { roomCode: gameState.roomCode });
      }
    });

    // Get current user from socket
    socket.emit('requestPlayerList');

    return () => {
      socket.off('scoreUpdate');
      socket.off('playerTriggeredBomb');
      socket.off('bombDefused');
      socket.off('playerEliminatedEvent');
      socket.off('gameEnded');
      socket.off('hackerAbilityActivated');
      socket.off('turnChanged');
      socket.off('gameEndedByDisconnect');
      socket.off('playerDisconnected');
      socket.off('playerReconnected');
      socket.off('gameStateSync');
      socket.off('roomError');
      socket.off('disconnect');
      socket.off('connect');
    };
  }, [location, navigate, gameState]);

  const handlePassTurn = () => {
    if (!gameState) return;
    console.log('🔵 handlePassTurn called', { gameSessionId: gameState.gameSessionId });
    const confirmPass = window.confirm('Pass your turn to the next player?');
    if (confirmPass) {
      console.log('🔵 Emitting passTurn event');
      socket.emit('passTurn', { gameSessionId: gameState.gameSessionId });
    }
  };

  const handleLeaveGame = () => {
    const confirm = window.confirm('Are you sure you want to leave the game?');
    if (confirm) {
      socket.emit('leaveRoom', { roomCode: gameState?.roomCode });
      navigate('/lobby');
    }
  };

  const handleScanBomb = () => {
    if (!gameState) return;
    
    // Check if player has Hacker role and ability not used
    const currentPlayer = gameState.players.find(p => p.user_id === currentUserId);
    if (currentPlayer?.role === 'hacker' && !hackerAbilityUsed && !hackerAbilityUsedInDB) {
      setShowHackerPrompt(true);
    } else {
      // Navigate to bomb quiz
      navigate(`/bomb-quiz/${gameState.gameSessionId}`);
    }
  };

  const handleUseHackerAbility = () => {
    if (!gameState) return;
    
    // Mark ability as used locally
    setHackerAbilityUsed(true);
    setHackerAbilityUsedInDB(true);
    
    // Close the modal
    setShowHackerPrompt(false);
    
    // Emit hacker ability and navigate to quiz page
    socket.emit('useHackerAbility', { gameSessionId: gameState.gameSessionId });
    
    // Navigate to quiz page where hacker ability will auto-defuse
    navigate(`/bomb-quiz/${gameState.gameSessionId}`, { 
      state: { useHackerAbility: true }
    });
  };

  const handleQRCodeScanned = (result: any) => {
    if (!result || !result[0]?.rawValue) return;

    const decodedText = result[0].rawValue;
    console.log('✅ QR Code scanned:', decodedText);

    // Extract session ID from URL if it's a bomb quiz URL
    if (decodedText.includes('/bomb-quiz/')) {
      const sessionId = decodedText.split('/bomb-quiz/')[1];
      if (sessionId) {
        setIsScanning(false);
        navigate(`/bomb-quiz/${sessionId}`);
        return;
      }
    }

    // If it's just the session ID
    if (!isNaN(Number(decodedText))) {
      setIsScanning(false);
      navigate(`/bomb-quiz/${decodedText}`);
    } else {
      addToast('Invalid QR code', 'error');
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading game...</div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.user_id === currentUserId);

  // Get border colors for each player with glow effect
  const getPlayerStyle = (index: number) => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#9D4EDD']; // Gold, Red, Cyan, Purple
    const color = colors[index] || colors[0];
    return {
      borderColor: color,
      boxShadow: `0 0 20px ${color}40`
    };
  };

  return (
    <div className="min-h-screen bg-[#060606] text-yellow-400 font-sans relative overflow-hidden">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,0,0.05)_0%,transparent_30%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[40px_40px] opacity-40"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="bg-[#0d0d0f]/80 border-2 border-yellow-400/30 rounded-2xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 backdrop-blur-md">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-yellow-400 mb-1 sm:mb-2 tracking-wider">
                🎮 U.DEFUSE
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg">Room: <span className="font-mono font-bold text-yellow-400">{gameState.roomCode}</span></p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              {/* Timer - Show only during quiz */}
              {quizTimer !== null && (
                <div className="bg-red-600/80 border-2 border-red-400/50 rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 backdrop-blur-md animate-pulse">
                  <p className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-wider">⏱️ {quizTimer}s</p>
                </div>
              )}
              {/* Leave Button */}
              <button
                onClick={handleLeaveGame}
                className="bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2 px-3 sm:py-2.5 sm:px-4 md:py-3 md:px-6 rounded-lg sm:rounded-xl border-2 border-red-500 transition-all hover:scale-105 shadow-lg text-xs sm:text-sm md:text-base"
              >
                🚪 Leave
              </button>
            </div>
          </div>
        </div>

        {/* Players Grid - 2x2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4 md:mb-6">
          {gameState.players.map((player, index) => {
            const isCurrentTurn = gameState.currentTurn === index;
            const style = getPlayerStyle(index);
            const roleIcon = ROLE_ICONS[player.role] || '🎮';
            
            return (
              <div
                key={player.id}
                className="relative bg-black/40 border-2 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 transition-all hover:scale-105 min-h-[180px] sm:min-h-[220px] md:min-h-[250px] flex flex-col items-center justify-center gap-2 sm:gap-3"
                style={{
                  borderColor: style.borderColor,
                  boxShadow: style.boxShadow
                }}
              >
                {/* Role Icon */}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 text-xl sm:text-2xl md:text-3xl">{roleIcon}</div>
                
                {/* Stats badges - only show if player has activity */}
                {(player.bombs_defused > 0 || player.bombs_failed > 0) && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-1">
                    {player.bombs_defused > 0 && (
                      <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-full px-2 py-0.5">
                        <p className="text-green-400 text-xs font-bold">✅ {player.bombs_defused}</p>
                      </div>
                    )}
                    {player.bombs_failed > 0 && (
                      <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-full px-2 py-0.5">
                        <p className="text-red-400 text-xs font-bold">❌ {player.bombs_failed}</p>
                      </div>
                    )}
                  </div>
                )}

                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-wide text-center" style={{ color: style.borderColor }}>
                  PLAYER {index + 1}
                </h2>
                <div className="flex items-center gap-2">
                  {player.is_eliminated ? (
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                  ) : (
                    <div className={`w-3 h-3 rounded-full ${
                      player.bombs_defused > 0 ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                  )}
                  <p className={`text-gray-300 font-semibold text-sm sm:text-base md:text-lg text-center ${
                    player.is_eliminated ? 'line-through opacity-50' : ''
                  }`}>
                    {player.username}
                  </p>
                </div>
                
                <div className="bg-black/50 backdrop-blur-sm rounded-lg sm:rounded-xl px-4 sm:px-5 md:px-6 py-1.5 sm:py-2 border border-yellow-400/40">
                  <p className="text-yellow-400 text-lg sm:text-xl md:text-2xl font-bold tracking-wider">
                    ⭐ {player.score}
                  </p>
                </div>
                
                {isCurrentTurn && !player.is_eliminated && (
                  <div className="mt-1">
                    <div className="bg-green-600/90 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 border-green-400/50 animate-pulse">
                      <p className="text-xs sm:text-sm font-bold tracking-wide">🎯 YOUR TURN</p>
                    </div>
                  </div>
                )}

                {player.is_eliminated && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-red-500 text-4xl font-bold mb-1">💀</p>
                      <p className="text-red-400 text-xl font-bold">ELIMINATED</p>
                    </div>
                  </div>
                )}

                {player.disconnected && !player.is_eliminated && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-orange-500 text-4xl font-bold mb-1">🔌</p>
                      <p className="text-orange-400 text-xl font-bold">DISCONNECTED</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Turn Control Buttons */}
        <div className="flex justify-center gap-3 sm:gap-4 mb-3 sm:mb-4 md:mb-6">
          {/* Pass Turn Button - Always visible for current player */}
          {gameState && currentUserId > 0 && (() => {
            const currentTurnPlayer = gameState.players[gameState.currentTurn];
            return Number(currentTurnPlayer?.user_id) === Number(currentUserId) && !currentTurnPlayer?.is_eliminated;
          })() && (
            <button
              onClick={handlePassTurn}
              className="bg-yellow-400/90 hover:bg-yellow-500 text-black font-bold py-2 sm:py-3 md:py-4 lg:py-5 px-6 sm:px-8 md:px-12 lg:px-16 rounded-xl sm:rounded-2xl text-base sm:text-lg md:text-2xl lg:text-3xl border-2 border-yellow-500 transition-all hover:scale-105 active:scale-95"
            >
              ⏭️ PASS
            </button>
          )}
        </div>

        {/* Bomb QR Section */}
        <div className="bg-[#0d0d0f]/80 border-2 border-yellow-400/30 rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 backdrop-blur-md text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-400 mb-3 sm:mb-4">
            💣 BOMB ZONE 💣
          </h2>
          
          <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6 flex-wrap">
            {/* QR Code */}
            <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.5)] transform hover:scale-105 transition-transform">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/bomb-quiz/${gameState.gameSessionId}`)}`}
                alt="Bomb QR Code"
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36"
              />
              <p className="text-gray-800 font-bold mt-1 text-[10px] sm:text-xs">Scan to Defuse</p>
            </div>

            {/* OR Divider */}
            <div className="text-yellow-400 text-base sm:text-lg md:text-xl font-bold">OR</div>

            {/* Button */}
            <div>
              <button
                onClick={handleScanBomb}
                className="bg-red-600/80 hover:bg-red-700 text-white font-bold py-2 sm:py-3 md:py-4 px-4 sm:px-6 md:px-8 rounded-lg sm:rounded-xl text-sm sm:text-lg md:text-xl lg:text-2xl border-2 border-red-400/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPlayer?.is_eliminated}
              >
                💣 I Drew a Bomb!
              </button>
              {currentPlayer?.role === 'hacker' && !hackerAbilityUsed && !hackerAbilityUsedInDB && !currentPlayer?.is_eliminated && (
                <p className="text-green-400 text-[10px] sm:text-xs mt-2 animate-pulse">
                  🔓 Hacker Ability Ready!
                </p>
              )}
              {currentPlayer?.role === 'hacker' && hackerAbilityUsedInDB && !currentPlayer?.is_eliminated && (
                <p className="text-gray-400 text-[10px] sm:text-xs mt-2">
                  🔒 Hacker Ability Used
                </p>
              )}
            </div>
          </div>
        </div>

        {/* QR Scanner Section */}
        <div className="bg-[#0d0d0f]/80 border-2 border-yellow-400/30 rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 backdrop-blur-md mt-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-400 mb-3 sm:mb-4 text-center">
            📷 SCAN QR CODE 📷
          </h2>

          {!isScanning ? (
            <div className="text-center">
              <p className="text-gray-300 mb-4 text-sm sm:text-base">Scan a bomb QR code to start defusing</p>
              <button
                onClick={() => setIsScanning(true)}
                disabled={currentPlayer?.is_eliminated}
                className="bg-blue-600/80 hover:bg-blue-700 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-xl text-base sm:text-lg border-2 border-blue-400/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📷 Start Scanner
              </button>
            </div>
          ) : (
            <div>
              <div className="rounded-xl overflow-hidden mb-4 border-2 border-yellow-400/40 max-w-md mx-auto">
                <Scanner
                  onScan={handleQRCodeScanned}
                  onError={(err) => console.error('Scanner error:', err)}
                  constraints={{ facingMode: 'environment' }}
                  styles={{
                    container: { width: '100%' },
                    video: { width: '100%', borderRadius: '8px' },
                  }}
                />
              </div>
              <button
                onClick={() => setIsScanning(false)}
                className="w-full max-w-md mx-auto block bg-red-600/80 hover:bg-red-700 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-xl text-base sm:text-lg border-2 border-red-400/50 transition-all hover:scale-105 active:scale-95"
              >
                ⏹️ Stop Scanner
              </button>
            </div>
          )}

          <p className="text-gray-400 text-xs text-center mt-3 sm:mt-4">
            💡 Point your camera at the bomb QR code to defuse
          </p>
        </div>

        {/* Warning Message */}
        <div className="bg-red-900/90 border-2 border-red-500 rounded-lg px-6 py-3 backdrop-blur-sm mt-4">
          <p className="text-red-200 text-sm text-center">
            ⚠️ <span className="font-bold">Warning:</span> Do not leave the game or refresh the page - it will restart the entire game for everyone!
          </p>
        </div>

        {/* Get Ready Countdown */}
        {showCountdown && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div className="bg-linear-to-br from-purple-600 to-pink-600 rounded-full w-64 h-64 flex items-center justify-center shadow-[0_0_100px_rgba(168,85,247,0.8)] animate-pulse border-8 border-white/20">
                <div>
                  <p className="text-white text-8xl font-bold mb-4">⏰</p>
                  <p className="text-white text-7xl font-bold">{countdown}</p>
                </div>
              </div>
              <p className="text-white text-4xl font-bold mt-8 animate-pulse">GET READY!</p>
              <p className="text-purple-300 text-xl mt-4">Game starting soon...</p>
            </div>
          </div>
        )}

        {/* Hacker Ability Prompt */}
        {showHackerPrompt && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-linear-to-br from-gray-900 to-black rounded-3xl p-8 max-w-md border-4 border-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.5)]">
              <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-green-400 to-emerald-500 mb-4">
                🔓 Hacker Ability
              </h3>
              <p className="text-white text-lg mb-6">
                Use your Hacker ability to instantly defuse this bomb without answering the quiz? (+10 points)
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleUseHackerAbility}
                  className="flex-1 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all hover:scale-105"
                >
                  ✅ Use Ability
                </button>
                <button
                  onClick={() => {
                    setShowHackerPrompt(false);
                    navigate(`/bomb-quiz/${gameState.gameSessionId}`);
                  }}
                  className="flex-1 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all hover:scale-105"
                >
                  📝 Take Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Winner Screen */}
        {showWinner && winnerData && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-linear-to-br from-yellow-600 via-yellow-500 to-orange-500 rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12 max-w-2xl w-full border-4 sm:border-8 border-yellow-300/50 shadow-[0_0_100px_rgba(234,179,8,0.8)]">
              <div className="text-center">
                <p className="text-5xl sm:text-7xl md:text-9xl mb-2 sm:mb-4 animate-bounce">🏆</p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-4 drop-shadow-lg">WINNER!</h2>
                <p className="text-4xl sm:text-5xl md:text-7xl font-bold text-yellow-900 mb-3 sm:mb-6 wrap-break-word">{winnerData.winner.username}</p>
                <p className="text-xl sm:text-2xl md:text-3xl text-white mb-4 sm:mb-8">
                  Final Score: <span className="font-bold text-yellow-200">{winnerData.winner.score} points</span>
                </p>
                
                {/* Final Scoreboard */}
                <div className="bg-black/40 rounded-lg sm:rounded-xl p-3 sm:p-6 mb-4 sm:mb-8">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-300 mb-2 sm:mb-4">Final Scores</h3>
                  <div className="space-y-1 sm:space-y-2">
                    {winnerData.finalScores
                      ?.sort((a: any, b: any) => b.score - a.score)
                      .map((player: any, index: number) => (
                        <div key={player.user_id} className="flex justify-between items-center text-white">
                          <span className="text-sm sm:text-base md:text-lg">
                            {index + 1}. {player.username} {player.is_eliminated && '💀'}
                          </span>
                          <span className="text-base sm:text-lg md:text-xl font-bold text-yellow-400">{player.score} pts</span>
                        </div>
                      ))}
                  </div>
                </div>

                <button
                  onClick={() => navigate('/lobby')}
                  className="bg-white hover:bg-yellow-100 text-yellow-900 font-bold py-2 sm:py-3 md:py-4 px-6 sm:px-10 md:px-12 rounded-lg sm:rounded-xl text-base sm:text-xl md:text-2xl shadow-lg transition-all hover:scale-105"
                >
                  Back to Lobby ({lobbyCountdown}s)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Elimination Overlay - Shows when current player is eliminated */}
        {currentPlayer?.is_eliminated && !showWinner && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-40">
            <div className="bg-linear-to-br from-red-900 to-black rounded-3xl p-12 max-w-2xl border-8 border-red-500/50 shadow-[0_0_100px_rgba(239,68,68,0.8)]">
              <div className="text-center">
                <p className="text-9xl mb-4 animate-pulse">💀</p>
                <h2 className="text-5xl font-bold text-red-500 mb-4 drop-shadow-lg">ELIMINATED!</h2>
                <p className="text-3xl text-white mb-6">You answered incorrectly</p>
                <p className="text-xl text-gray-300 mb-8">
                  You are now in <span className="font-bold text-red-400">spectator mode</span>
                </p>
                
                {/* Current Game Status */}
                <div className="bg-black/40 rounded-xl p-6 mb-6">
                  <h3 className="text-2xl font-bold text-red-300 mb-4">Game Status</h3>
                  <div className="space-y-2">
                    {gameState.players
                      .filter(p => !p.is_eliminated)
                      .map((player: any) => (
                        <div key={player.user_id} className="flex justify-between items-center text-white">
                          <span className="text-lg">{player.username}</span>
                          <span className="text-xl font-bold text-yellow-400">{player.score} pts</span>
                        </div>
                      ))}
                  </div>
                </div>

                <p className="text-gray-400 text-lg">
                  Waiting for game to finish...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDashboard;
