import React from "react";

interface GameRulesProps {
  isOpen: boolean;
  onClose: () => void;
}

const GameRules: React.FC<GameRulesProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0d0d0f] border-2 border-yellow-400/40 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-[0_0_30px_rgba(255,255,0,0.2)]">
        {/* Header */}
        <div className="sticky top-0 bg-[#0d0d0f] border-b border-yellow-400/20 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-yellow-400 tracking-wider">
            📜 GAME RULES
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-yellow-400 transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-yellow-400/10"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-gray-300 space-y-6">
          {/* Objective Section */}
          <section>
            <h3 className="text-xl font-bold text-yellow-300 mb-3 flex items-center gap-2">
              🎯 Objective
            </h3>
            <p className="leading-relaxed">
              {/* TODO: Add your game objective here */}
              [Your game objective description goes here]
            </p>
          </section>

          {/* How to Play Section */}
          <section>
            <h3 className="text-xl font-bold text-yellow-300 mb-3 flex items-center gap-2">
              🎮 How to Play
            </h3>
            <div className="space-y-2">
              {/* TODO: Add your game play instructions here */}
              <p className="leading-relaxed">
                [Step-by-step instructions on how to play]
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>[Instruction point 1]</li>
                <li>[Instruction point 2]</li>
                <li>[Instruction point 3]</li>
              </ul>
            </div>
          </section>

          {/* Scoring Section */}
          <section>
            <h3 className="text-xl font-bold text-yellow-300 mb-3 flex items-center gap-2">
              💯 Scoring System
            </h3>
            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4 space-y-2">
              {/* TODO: Add your scoring rules here */}
              <p>[Explain how points are awarded]</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>[Scoring rule 1]</li>
                <li>[Scoring rule 2]</li>
                <li>[Scoring rule 3]</li>
              </ul>
            </div>
          </section>

          {/* Win Conditions Section */}
          <section>
            <h3 className="text-xl font-bold text-yellow-300 mb-3 flex items-center gap-2">
              🏆 Win Conditions
            </h3>
            <p className="leading-relaxed">
              {/* TODO: Add win conditions here */}
              [Describe how a player wins the game]
            </p>
          </section>

          {/* Special Rules Section */}
          <section>
            <h3 className="text-xl font-bold text-yellow-300 mb-3 flex items-center gap-2">
              ⚡ Special Rules
            </h3>
            <div className="space-y-2">
              {/* TODO: Add special rules here */}
              <p className="leading-relaxed">
                [Any special rules or mechanics]
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>[Special rule 1]</li>
                <li>[Special rule 2]</li>
              </ul>
            </div>
          </section>

          {/* Tips Section */}
          <section>
            <h3 className="text-xl font-bold text-yellow-300 mb-3 flex items-center gap-2">
              💡 Tips & Strategies
            </h3>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-2">
              {/* TODO: Add tips here */}
              <ul className="list-disc list-inside space-y-1">
                <li>[Helpful tip 1]</li>
                <li>[Helpful tip 2]</li>
                <li>[Helpful tip 3]</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0d0d0f] border-t border-yellow-400/20 p-6">
          <button
            onClick={onClose}
            className="w-full bg-yellow-400/90 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-lg uppercase tracking-widest transition-all"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameRules;
