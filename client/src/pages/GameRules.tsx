import React from "react";

interface GameRulesProps {
  isOpen: boolean;
  onClose: () => void;
}

const GameRules: React.FC<GameRulesProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0d0d0f] border-2 border-yellow-400/40 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-[0_0_30px_rgba(255,255,0,0.2)]">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-b from-[#0d0d0f] to-[#0d0d0f]/95 border-b border-yellow-400/20 p-6 flex items-center justify-between z-10 backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-yellow-400 tracking-wider drop-shadow-[0_0_10px_rgba(255,255,0,0.3)]">
            📜 GAME RULES
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-yellow-400 transition-colors text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-yellow-400/10"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-gray-300 space-y-8">
          {/* Objective Section */}
          <section className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              🎯 Objective
            </h3>
            <p className="leading-relaxed mb-3 text-lg">
              Survive the Bombs and outlast your opponents while answering Python control-flow quizzes.
            </p>
            <p className="leading-relaxed font-semibold text-yellow-400 text-lg">
              The last surviving player OR the player with the highest score at the end wins.
            </p>
          </section>

          {/* Components Section */}
          <section>
            <h3 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              🛠️ Components
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Deck Cards */}
              <div className="bg-[#1a1a1c] border border-yellow-400/20 rounded-xl p-5">
                <h4 className="font-bold text-yellow-400 mb-3 text-lg">📦 60-Card Deck</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-red-500/10 rounded">
                    <span><strong>Bomb</strong> 💣</span>
                    <span className="text-red-400 font-bold">×10</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-500/10 rounded">
                    <span><strong>Defuse</strong> 💻</span>
                    <span className="text-green-400 font-bold">×6</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-500/10 rounded">
                    <span><strong>Attack</strong> ⚔️</span>
                    <span className="text-purple-400 font-bold">×10</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-500/10 rounded">
                    <span><strong>Skip</strong> ⏭️</span>
                    <span className="text-blue-400 font-bold">×5</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-orange-500/10 rounded">
                    <span><strong>Shuffle</strong> 🔀</span>
                    <span className="text-orange-400 font-bold">×5</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-pink-500/10 rounded">
                    <span><strong>Swap</strong> 🔄</span>
                    <span className="text-pink-400 font-bold">×5</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-cyan-500/10 rounded">
                    <span><strong>Shield</strong> 🛡️</span>
                    <span className="text-cyan-400 font-bold">×5</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-indigo-500/10 rounded">
                    <span><strong>Peek</strong> 👀</span>
                    <span className="text-indigo-400 font-bold">×4</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-500/10 rounded">
                    <span><strong>Safe</strong> ✅</span>
                    <span className="text-gray-400 font-bold">×10</span>
                  </div>
                </div>
              </div>

              {/* Devices */}
              <div className="bg-[#1a1a1c] border border-yellow-400/20 rounded-xl p-5">
                <h4 className="font-bold text-yellow-400 mb-3 text-lg">📱 Devices</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">💻</span>
                      <strong className="text-blue-400">Laptop Dashboard</strong>
                    </div>
                    <p className="text-sm text-gray-400">View players, scores, timers, and quiz status</p>
                  </div>
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">📱</span>
                      <strong className="text-green-400">Mobile Phones</strong>
                    </div>
                    <p className="text-sm text-gray-400">Scan QR codes on Bomb cards to answer quizzes</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Roles & Abilities Section */}
          <section>
            <h3 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              🎭 Roles & Abilities
            </h3>
            <p className="leading-relaxed mb-4 text-sm bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
              Each player secretly holds <strong>1 Role card</strong>. Abilities marked as <strong className="text-yellow-400">One-time</strong> can only be used once per game.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Hacker */}
              <div className="bg-[#1a1a1c] border-l-4 border-green-500 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💻</span>
                  <h4 className="font-bold text-green-400 text-lg">Hacker</h4>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">ONE-TIME</span>
                </div>
                <p className="text-sm">Instantly defuse a Bomb without answering the quiz.</p>
              </div>

              {/* Spy */}
              <div className="bg-[#1a1a1c] border-l-4 border-blue-500 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🕵️‍♂️</span>
                  <h4 className="font-bold text-blue-400 text-lg">Spy</h4>
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">ONE-TIME</span>
                </div>
                <p className="text-sm">Peek at the top 3 cards and rearrange them in any order.</p>
              </div>

              {/* Saboteur */}
              <div className="bg-[#1a1a1c] border-l-4 border-red-500 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💣</span>
                  <h4 className="font-bold text-red-400 text-lg">Saboteur</h4>
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">PASSIVE</span>
                </div>
                <p className="text-sm">After successfully defusing a Bomb, place it anywhere back in the deck.</p>
              </div>

              {/* Trickster */}
              <div className="bg-[#1a1a1c] border-l-4 border-purple-500 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎭</span>
                  <h4 className="font-bold text-purple-400 text-lg">Trickster</h4>
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">ONE-TIME</span>
                </div>
                <p className="text-sm">Swap entire hands between any two players (including yourself).</p>
              </div>

              {/* Gambler */}
              <div className="bg-[#1a1a1c] border-l-4 border-orange-500 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎲</span>
                  <h4 className="font-bold text-orange-400 text-lg">Gambler</h4>
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">PASSIVE</span>
                </div>
                <p className="text-sm">After each draw, flip 50-50: Success = draw 1 extra card; Fail = nothing happens.</p>
              </div>

              {/* Timekeeper */}
              <div className="bg-[#1a1a1c] border-l-4 border-cyan-500 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⏱️</span>
                  <h4 className="font-bold text-cyan-400 text-lg">Timekeeper</h4>
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">PASSIVE</span>
                </div>
                <p className="text-sm">Your Bomb quiz timer is extended by +15 seconds (45s total).</p>
              </div>
            </div>
          </section>

          {/* Setup Section */}
          <section>
            <h3 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              🎲 Setup
            </h3>
            <div className="bg-[#1a1a1c] border border-yellow-400/20 rounded-xl p-6">
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-bold text-yellow-400 min-w-6 shrink-0">1.</span>
                  <span className="wrap-break-word min-w-0 flex-1"><strong>Remove all Bomb cards</strong> from the deck.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-yellow-400 min-w-6 shrink-0">2.</span>
                  <span className="wrap-break-word min-w-0 flex-1">Shuffle the <strong>non-Bomb</strong> cards thoroughly.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-yellow-400 min-w-6 shrink-0">3.</span>
                  <span className="wrap-break-word min-w-0 flex-1"><strong>Deal 5 cards</strong> to each player from this non-Bomb deck.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-yellow-400 min-w-6 shrink-0">4.</span>
                  <div className="wrap-break-word min-w-0 flex-1">
                    <strong>Guarantee Defuse start (recommended):</strong> Give <strong>1 Defuse</strong> to each player from the Defuse pool, then reshuffle remaining Defuses back into the draw pile.
                    <div className="mt-2 ml-4 p-2 bg-yellow-400/10 border-l-2 border-yellow-400 rounded text-sm">
                      With 6 Defuse total and up to 4 players, you'll still have <strong>2</strong> Defuse left in the deck.
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-yellow-400 min-w-6 shrink-0">5.</span>
                  <div className="wrap-break-word min-w-0 flex-1">
                    Take <strong>Bombs = (number of players − 1)</strong> from the 15 printed Bombs and <strong>shuffle them into</strong> the draw pile.
                    <div className="mt-2 ml-4 p-2 bg-red-500/10 border-l-2 border-red-500 rounded text-sm">
                      Example: 2 players → 1 Bomb, 3 players → 2 Bombs, 4 players → 3 Bombs
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-yellow-400 min-w-6 shrink-0">6.</span>
                  <span className="wrap-break-word min-w-0 flex-1">Place the draw pile face-down in the center. Each player takes one secret <strong>Role</strong> card.</span>
                </li>
              </ol>
            </div>
          </section>

          {/* Turn Structure Section */}
          <section>
            <h3 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              🔄 Turn Structure
            </h3>
            <div className="bg-[#1a1a1c] border border-yellow-400/20 rounded-xl p-6 space-y-4">
              <p className="font-semibold text-yellow-400 mb-3">On your turn:</p>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-bold text-yellow-400 min-w-6 shrink-0">1.</span>
                  <span className="wrap-break-word min-w-0 flex-1"><strong>Optionally</strong> play any number of action cards (Skip/Attack/Swap/Shield/Shuffle/Peek) and/or reveal a role ability (if one-time).</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-yellow-400 min-w-6 shrink-0">2.</span>
                  <span className="wrap-break-word min-w-0 flex-1"><strong>End your turn by drawing 1 card</strong> from the deck (unless a card/stack says otherwise).</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-yellow-400 min-w-6 shrink-0">3.</span>
                  <span className="wrap-break-word min-w-0 flex-1"><strong>Gambler role (passive):</strong> after your normal draw resolves, roll 50-50. On success, <strong>draw 1 additional card</strong>.</span>
                </li>
              </ol>
            </div>

            <div className="mt-4 bg-red-500/10 border-2 border-red-500/40 rounded-xl p-6 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
              <h4 className="font-bold text-red-400 mb-4 text-xl flex items-center gap-2">
                💣 If you draw a Bomb
              </h4>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-bold text-red-400 min-w-6 shrink-0">1.</span>
                  <span className="wrap-break-word min-w-0 flex-1">Scan the Bomb's QR with your phone → a Python MCQ appears.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-red-400 min-w-6 shrink-0">2.</span>
                  <span className="wrap-break-word min-w-0 flex-1"><strong>Timer:</strong> 30 seconds (Timekeeper has <strong>45 seconds</strong>).</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-red-400 min-w-6 shrink-0">3.</span>
                  <div className="space-y-2 wrap-break-word min-w-0 flex-1">
                    <span>Answer:</span>
                    <div className="ml-4 space-y-2">
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="font-bold text-green-400 mb-1">✅ Correct Answer</p>
                        <p className="text-sm">You survive! Continue playing.</p>
                        <p className="text-xs text-gray-400 mt-2"><strong>Saboteur (passive):</strong> You may place this Bomb card anywhere back into the deck.</p>
                      </div>
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="font-bold text-red-400 mb-1">❌ Incorrect Answer</p>
                        <p className="text-sm">You are <strong>eliminated</strong>, unless you play a <strong>Defuse</strong> card to cancel it.</p>
                      </div>
                    </div>
                  </div>
                </li>
              </ol>
              <p className="mt-4 text-sm text-gray-400 italic border-t border-red-500/20 pt-3">Play continues clockwise.</p>
            </div>
          </section>

          {/* Card Functions Section */}
          <section>
            <h3 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              🃏 Card Functions
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-4 bg-red-500/10 border-l-4 border-red-500 rounded-lg">
                <p className="font-bold text-red-400 mb-1 flex items-center gap-2"><span className="text-xl">💣</span> Bomb</p>
                <p className="text-sm">Triggers Bomb quiz. Fail = eliminated (unless Defuse).</p>
              </div>
              <div className="p-4 bg-green-500/10 border-l-4 border-green-500 rounded-lg">
                <p className="font-bold text-green-400 mb-1 flex items-center gap-2"><span className="text-xl">💻</span> Defuse</p>
                <p className="text-sm">Cancel one Bomb (no quiz needed). Discard after use.</p>
              </div>
              <div className="p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-lg">
                <p className="font-bold text-blue-400 mb-1 flex items-center gap-2"><span className="text-xl">⏭️</span> Skip</p>
                <p className="text-sm">End turn without drawing. Reduces Attack stack by 1.</p>
              </div>
              <div className="p-4 bg-purple-500/10 border-l-4 border-purple-500 rounded-lg">
                <p className="font-bold text-purple-400 mb-1 flex items-center gap-2"><span className="text-xl">⚔️</span> Attack</p>
                <p className="text-sm">End turn; next player draws 2. Attacks stack (+1 each).</p>
              </div>
              <div className="p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded-lg">
                <p className="font-bold text-orange-400 mb-1 flex items-center gap-2"><span className="text-xl">🔀</span> Shuffle</p>
                <p className="text-sm">Shuffle the entire draw pile.</p>
              </div>
              <div className="p-4 bg-pink-500/10 border-l-4 border-pink-500 rounded-lg">
                <p className="font-bold text-pink-400 mb-1 flex items-center gap-2"><span className="text-xl">🔄</span> Swap</p>
                <p className="text-sm">Swap entire hands with any one player.</p>
              </div>
              <div className="p-4 bg-cyan-500/10 border-l-4 border-cyan-500 rounded-lg">
                <p className="font-bold text-cyan-400 mb-1 flex items-center gap-2"><span className="text-xl">🛡️</span> Shield</p>
                <p className="text-sm">Block Attack or Swap targeted at you.</p>
              </div>
              <div className="p-4 bg-indigo-500/10 border-l-4 border-indigo-500 rounded-lg">
                <p className="font-bold text-indigo-400 mb-1 flex items-center gap-2"><span className="text-xl">👀</span> Peek</p>
                <p className="text-sm">Look at the top 3 cards (no rearranging).</p>
              </div>
              <div className="p-4 bg-gray-500/10 border-l-4 border-gray-500 rounded-lg md:col-span-2">
                <p className="font-bold text-gray-400 mb-1 flex items-center gap-2"><span className="text-xl">✅</span> Safe</p>
                <p className="text-sm">No effect. (Optional: +1 point in Score Mode)</p>
              </div>
            </div>
          </section>

          {/* Winning the Game Section */}
          <section>
            <h3 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              🏆 Winning the Game
            </h3>
            <div className="space-y-4">
              <div className="bg-linear-to-r from-yellow-500/10 to-yellow-600/10 border-2 border-yellow-400/40 rounded-xl p-6 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">👑</span>
                  <h4 className="font-bold text-yellow-400 text-xl">Survivor Mode</h4>
                </div>
                <p className="text-lg">Last player alive wins the game!</p>
              </div>

              <div className="opacity-40 cursor-not-allowed">
                <div className="bg-linear-to-r from-gray-500/10 to-gray-600/10 border-2 border-gray-500/40 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">📊</span>
                    <h4 className="font-bold text-gray-500 text-xl">Score Mode</h4>
                    <span className="text-xs bg-gray-700 text-gray-400 px-3 py-1 rounded-full font-semibold">COMING SOON</span>
                  </div>
                  <p className="text-gray-500 mb-3">Play to a time/round limit. Leaderboard scoring:</p>
                  <div className="grid sm:grid-cols-3 gap-2 mb-3">
                    <div className="bg-gray-800/20 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-600">+10</p>
                      <p className="text-xs text-gray-600">Bomb Defuse</p>
                    </div>
                    <div className="bg-gray-800/20 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-600">+5</p>
                      <p className="text-xs text-gray-600">Use Defuse</p>
                    </div>
                    <div className="bg-gray-800/20 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-600">+1</p>
                      <p className="text-xs text-gray-600">Safe Card</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 italic">Ties: successful defuses → Safe cards → fewest eliminations</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-linear-to-t from-[#0d0d0f] to-[#0d0d0f]/95 border-t border-yellow-400/20 p-6 z-10 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="w-full bg-yellow-400/90 hover:bg-yellow-500 text-black font-bold py-4 px-6 rounded-xl uppercase tracking-widest transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,0,0.3)] hover:shadow-[0_0_30px_rgba(255,255,0,0.5)]"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameRules;
