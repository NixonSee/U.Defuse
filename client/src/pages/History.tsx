import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

interface QuizAttempt {
  questionId: number;
  userId: number;
  username: string;
  question: string;
  codeSnippet?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
}

interface Player {
  userId: number;
  username: string;
  role: string;
  score: number;
  bombsDefused: number;
  bombsFailed: number;
  isEliminated: boolean;
}

interface GameSession {
  id: number;
  roomCode: string;
  gameMode: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  winner: {
    id: number;
    username: string;
  };
  players: Player[];
  quizAttempts: QuizAttempt[];
}

const History: React.FC = () => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedGame, setExpandedGame] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGameHistory();
  }, []);

  const fetchGameHistory = async () => {
    try {
      const response = await api.get('/game/history');
      if (response.data.success) {
        setSessions(response.data.games);
      }
    } catch (error) {
      console.error('Error fetching game history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kuala_Lumpur'
    };
    return date.toLocaleString('en-US', options);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060606] text-yellow-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060606] text-yellow-400 font-sans relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,0,0.05)_0%,transparent_30%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[40px_40px] opacity-40"></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-6 border-b border-yellow-400/20">
        <div>
          <h1 className="text-3xl font-bold tracking-[0.15em]">GAME HISTORY</h1>
          <p className="text-gray-400 text-sm">Past game sessions and results</p>
        </div>
        <button
          onClick={() => navigate("/lobby")}
          className="bg-yellow-400/90 hover:bg-yellow-500 text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all font-bold text-sm sm:text-base"
        >
          Back to Lobby
        </button>
      </div>

      {/* History Content */}
      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {sessions.length === 0 ? (
          <div className="bg-[#0d0d0f]/80 border border-yellow-400/20 rounded-2xl p-12 backdrop-blur-md text-center">
            <p className="text-gray-400 text-lg">No game sessions yet</p>
            <p className="text-gray-500 text-sm mt-2">Start playing to see your game history!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const totalBombsDefused = session.players.reduce((sum, p) => sum + p.bombsDefused, 0);
              const isExpanded = expandedGame === session.id;
              
              return (
                <div
                  key={session.id}
                  className="bg-[#0d0d0f]/80 border border-yellow-400/20 rounded-2xl p-6 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,0,0.1)] hover:border-yellow-400/40 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Session Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-xl font-bold text-yellow-300">
                          Game #{session.id}
                        </h3>
                        <span className="text-sm text-gray-400">
                          {formatDateTime(session.endedAt)}
                        </span>
                        <span className="text-xs bg-yellow-400/20 px-2 py-1 rounded text-yellow-300">
                          {session.gameMode}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Duration: </span>
                          <span className="text-yellow-300">{formatDuration(session.durationSeconds)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Bombs Defused: </span>
                          <span className="text-yellow-300">{totalBombsDefused}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Players: </span>
                          <span className="text-yellow-300">{session.players.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Winner Badge */}
                    <div className="bg-yellow-400/20 border border-yellow-400/40 rounded-lg px-6 py-3 text-center">
                      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                        Winner
                      </div>
                      <div className="text-lg font-bold text-yellow-300">
                        👑 {session.winner.username}
                      </div>
                    </div>
                  </div>

                  {/* Scores Table */}
                  <div className="mt-4 border-t border-yellow-400/10 pt-4">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                      Player Scores
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {session.players
                        .sort((a, b) => b.score - a.score)
                        .map((player, index) => (
                          <div
                            key={player.userId}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              player.userId === session.winner.id
                                ? "bg-yellow-400/20 border border-yellow-400/40"
                                : "bg-yellow-400/10 border border-yellow-400/20"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 font-mono text-sm">
                                #{index + 1}
                              </span>
                              <span className="text-yellow-300 font-semibold">
                                {player.username} {player.isEliminated && '💀'}
                              </span>
                            </div>
                            <span className="text-yellow-400 font-bold">{player.score}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Quiz Attempts Section */}
                  {session.quizAttempts.length > 0 && (
                    <div className="mt-4 border-t border-yellow-400/10 pt-4">
                      <button
                        onClick={() => setExpandedGame(isExpanded ? null : session.id)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wider hover:text-yellow-300 transition-colors mb-2"
                      >
                        <span>{isExpanded ? '▼' : '▶'}</span>
                        <span>All Quiz Questions ({session.quizAttempts.length} attempts)</span>
                      </button>
                      
                      {isExpanded && (
                        <div className="space-y-3 mt-3">
                          {session.quizAttempts.map((attempt, idx) => (
                            <div
                              key={idx}
                              className={`p-4 rounded-lg border ${
                                attempt.isCorrect
                                  ? 'bg-green-900/20 border-green-500/30'
                                  : 'bg-red-900/20 border-red-500/30'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1">
                                  {/* Player who answered */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-yellow-300 font-bold text-xs">
                                      {attempt.username}
                                    </span>
                                    <span className={`text-xs ${attempt.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                      {attempt.isCorrect ? '✓ Correct' : '✗ Wrong'}
                                    </span>
                                  </div>
                                  
                                  <p className="text-white text-sm font-semibold mb-2">{attempt.question}</p>
                                  
                                  {attempt.codeSnippet && (
                                    <pre className="bg-black/40 p-3 rounded text-xs text-gray-300 mb-3 overflow-x-auto">
                                      <code>{attempt.codeSnippet}</code>
                                    </pre>
                                  )}

                                  {/* Options */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                    {['A', 'B', 'C', 'D'].map((letter) => {
                                      const optionText = attempt[`option${letter}` as keyof QuizAttempt] as string;
                                      const isSelected = attempt.selectedAnswer === letter;
                                      const isCorrect = attempt.correctAnswer === letter;
                                      
                                      return (
                                        <div
                                          key={letter}
                                          className={`p-2 rounded text-xs ${
                                            isCorrect
                                              ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                                              : isSelected
                                              ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                                              : 'bg-gray-800/30 border border-gray-600/30 text-gray-400'
                                          }`}
                                        >
                                          <span className="font-bold">{letter}.</span> {optionText}
                                          {isCorrect && ' ✓'}
                                          {isSelected && !isCorrect && ' ✗'}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="flex gap-4 text-xs">
                                    <span className={attempt.isCorrect ? 'text-green-400' : 'text-red-400'}>
                                      Your answer: {attempt.selectedAnswer}
                                    </span>
                                    {!attempt.isCorrect && (
                                      <span className="text-green-400">
                                        Correct: {attempt.correctAnswer}
                                      </span>
                                    )}
                                    <span className="text-gray-400">
                                      Time: {attempt.timeTaken}s
                                    </span>
                                  </div>
                                </div>
                                <div className="text-2xl">
                                  {attempt.isCorrect ? '✅' : '❌'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
