import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../utils/socket';

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
}

interface GameState {
  gameSessionId: number;
  roomCode: string;
  players: Player[];
  currentTurn: number;
  status: string;
}

const GameDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [yourHand, setYourHand] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [bombQRUrl, setBombQRUrl] = useState<string>('');
  const [showHackerPrompt, setShowHackerPrompt] = useState(false);
  const [hackerAbilityUsed, setHackerAbilityUsed] = useState(false);

  useEffect(() => {
    // Get game state from navigation or listen for updates
    if (location.state?.gameSessionId) {
      setGameState({
        gameSessionId: location.state.gameSessionId,
        roomCode: location.state.roomCode,
        players: location.state.players || [],
        currentTurn: location.state.currentTurn || 0,
        status: 'in_progress'
      });
      
      // Generate bomb QR URL
      const origin = window.location.origin;
      setBombQRUrl(`${origin}/bomb-quiz/${location.state.gameSessionId}`);
    }

    // Get current user ID
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserId(user.id);
    }

    // Socket listeners
    socket.on('yourHand', (data) => {
      console.log('Received your hand:', data);
      setYourHand(data.cards);
    });

    socket.on('scoreUpdate', (data) => {
      setGameState(prev => prev ? { ...prev, players: data.players } : null);
    });

    socket.on('playerTriggeredBomb', (data) => {
      console.log(`${data.username} triggered a bomb! Timer: ${data.timerSeconds}s`);
    });

    socket.on('bombDefused', (data) => {
      console.log(`${data.username} defused bomb using ${data.method}! +${data.scoreGained} points`);
    });

    socket.on('playerEliminatedEvent', (data) => {
      console.log(`${data.username} was eliminated!`);
      setGameState(prev => prev ? { ...prev, players: data.players } : null);
    });

    socket.on('gameEnded', (data) => {
      alert(`Game Over! Winner: ${data.winner.username} with ${data.winner.score} points!`);
      navigate('/lobby');
    });

    socket.on('hackerAbilityActivated', (data) => {
      setHackerAbilityUsed(true);
      setShowHackerPrompt(false);
      alert(data.message);
    });

    // Get current user from socket
    socket.emit('requestPlayerList');

    return () => {
      socket.off('yourHand');
      socket.off('scoreUpdate');
      socket.off('playerTriggeredBomb');
      socket.off('bombDefused');
      socket.off('playerEliminatedEvent');
      socket.off('gameEnded');
      socket.off('hackerAbilityActivated');
    };
  }, [location, navigate]);

  const handleScanBomb = () => {
    if (!gameState) return;
    
    // Check if player has Hacker role and ability not used
    const currentPlayer = gameState.players.find(p => p.user_id === currentUserId);
    if (currentPlayer?.role === 'hacker' && !hackerAbilityUsed) {
      setShowHackerPrompt(true);
    } else {
      // Navigate to bomb quiz
      navigate(`/bomb-quiz/${gameState.gameSessionId}`);
    }
  };

  const handleUseHackerAbility = () => {
    if (!gameState) return;
    socket.emit('useHackerAbility', { gameSessionId: gameState.gameSessionId });
  };

  const handleDefuseCardClick = () => {
    if (!gameState) return;
    
    const hasDefuseCard = yourHand.some(card => card.type === 'DEFUSE');
    if (!hasDefuseCard) {
      alert('You don\'t have a Defuse card!');
      return;
    }
    
    const confirm = window.confirm('Use your Defuse card to survive the bomb? (+5 points)');
    if (confirm) {
      socket.emit('useDefuseCard', { gameSessionId: gameState.gameSessionId });
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading game...</div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.user_id === currentUserId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-purple-500/30">
          <h1 className="text-4xl font-bold text-white mb-2">🎮 U.DEFUSE</h1>
          <p className="text-purple-300">Room: {gameState.roomCode}</p>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className={`bg-black/40 backdrop-blur-lg rounded-xl p-4 border ${
                player.is_eliminated
                  ? 'border-red-500/50 opacity-50'
                  : 'border-purple-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{player.roleIcon}</span>
                  <div>
                    <p className="text-white font-bold">{player.username}</p>
                    <p className="text-purple-300 text-sm capitalize">{player.role}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-yellow-400 text-lg font-bold">Score: {player.score}</p>
                <p className="text-green-400 text-sm">✅ Defused: {player.bombs_defused}</p>
                <p className="text-red-400 text-sm">❌ Failed: {player.bombs_failed}</p>
                <p className="text-blue-300 text-sm">🎴 Cards: {player.hand_cards.length}</p>
                {player.is_eliminated && (
                  <p className="text-red-500 font-bold">💀 ELIMINATED</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Your Hand */}
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-purple-500/30">
          <h2 className="text-2xl font-bold text-white mb-4">🎴 Your Hand</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {yourHand.map((card, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg p-4 text-center cursor-pointer hover:scale-105 transition-transform"
              >
                <p className="text-white font-bold">{card.type}</p>
                <p className="text-white/80 text-sm">{card.icon}</p>
              </div>
            ))}
          </div>
          {yourHand.length === 0 && (
            <p className="text-purple-300 text-center">Waiting for cards...</p>
          )}
        </div>

        {/* Bomb QR Code */}
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-red-500/50 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">💣 BOMB ZONE</h2>
          <p className="text-white mb-4">Scan this QR code when you draw a bomb!</p>
          
          {/* QR Code display */}
          <div className="bg-white p-4 rounded-lg inline-block mb-4">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bombQRUrl)}`}
              alt="Bomb QR Code"
              className="w-48 h-48"
            />
          </div>
          
          <p className="text-purple-300 text-sm mb-4">Or click the button below:</p>
          <button
            onClick={handleScanBomb}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg"
            disabled={currentPlayer?.is_eliminated}
          >
            💣 I Drew a Bomb!
          </button>

          {currentPlayer?.role === 'hacker' && !hackerAbilityUsed && (
            <div className="mt-4">
              <p className="text-green-400 text-sm">
                🔓 Hacker Ability Available: Auto-defuse any bomb (one-time use)
              </p>
            </div>
          )}
        </div>

        {/* Hacker Ability Prompt */}
        {showHackerPrompt && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-8 max-w-md border border-green-500/50">
              <h3 className="text-2xl font-bold text-green-400 mb-4">🔓 Hacker Ability</h3>
              <p className="text-white mb-6">
                Use your Hacker ability to instantly defuse this bomb without answering the quiz? (+10 points)
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleUseHackerAbility}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  ✅ Use Ability
                </button>
                <button
                  onClick={() => {
                    setShowHackerPrompt(false);
                    navigate(`/bomb-quiz/${gameState.gameSessionId}`);
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  📝 Take Quiz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDashboard;
