import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface GameSession {
  id: number;
  sessionDate: string;
  players: string[];
  winner: string;
  scores: { [username: string]: number };
  duration: string;
  bombsDefused: number;
}

const History: React.FC = () => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // TODO: Fetch game sessions from API
    // For now, using mock data
    const mockSessions: GameSession[] = [
      {
        id: 1,
        sessionDate: "2025-11-03 14:30:00",
        players: ["Player1", "Player2", "Player3"],
        winner: "Player1",
        scores: { Player1: 1500, Player2: 1200, Player3: 800 },
        duration: "15:32",
        bombsDefused: 5
      },
      // Add more mock sessions as needed
    ];

    setTimeout(() => {
      setSessions(mockSessions);
      setLoading(false);
    }, 500);
  }, []);

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
            {sessions.map((session) => (
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
                        {new Date(session.sessionDate).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Duration: </span>
                        <span className="text-yellow-300">{session.duration}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Bombs Defused: </span>
                        <span className="text-yellow-300">{session.bombsDefused}</span>
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
                      👑 {session.winner}
                    </div>
                  </div>
                </div>

                {/* Scores Table */}
                <div className="mt-4 border-t border-yellow-400/10 pt-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Player Scores
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(session.scores)
                      .sort(([, a], [, b]) => b - a)
                      .map(([player, score], index) => (
                        <div
                          key={player}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            player === session.winner
                              ? "bg-yellow-400/20 border border-yellow-400/40"
                              : "bg-yellow-400/10 border border-yellow-400/20"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-mono text-sm">
                              #{index + 1}
                            </span>
                            <span className="text-yellow-300 font-semibold">
                              {player}
                            </span>
                          </div>
                          <span className="text-yellow-400 font-bold">{score}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
