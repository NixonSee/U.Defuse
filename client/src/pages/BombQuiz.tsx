import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { socket } from '../utils/socket';

interface QuizQuestion {
  id: number;
  question_text: string;
  code_snippet: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty: string;
  topic: string;
}

const BombQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { gameSessionId } = useParams<{ gameSessionId: string }>();
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [bonusTime, setBonusTime] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  useEffect(() => {
    // Trigger bomb scan when component mounts
    socket.emit('scanBomb', { gameSessionId: Number(gameSessionId) });

    // Listen for bomb quiz
    socket.on('bombQuiz', (data) => {
      console.log('Received bomb quiz:', data);
      setQuestion(data.question);
      setTimerSeconds(data.timerSeconds);
      setBonusTime(data.bonusTime);
      setStartTime(Date.now());
    });

    // Listen for quiz result
    socket.on('quizResult', (data) => {
      console.log('Quiz result:', data);
      setResultData(data);
      setShowResult(true);
      setIsSubmitting(false);
      
      // Auto-navigate back to dashboard after showing result
      setTimeout(() => {
        if (data.success) {
          navigate('/game-dashboard', { replace: true });
        } else if (!data.eliminated) {
          // Show option to use Defuse card
          const confirm = window.confirm(
            'Wrong answer! Use your Defuse card to survive? (+5 points)\n\nClick OK to use Defuse card, or Cancel to be eliminated.'
          );
          
          if (confirm) {
            socket.emit('useDefuseCard', { gameSessionId: Number(gameSessionId) });
            
            // Listen for confirmation
            socket.once('defuseCardUsed', () => {
              alert('Defuse card used! You survived! +5 points');
              navigate('/game-dashboard', { replace: true });
            });
            
            socket.once('gameError', (error) => {
              alert(error.message || 'No Defuse card available. You are eliminated!');
              socket.emit('playerEliminated', { gameSessionId: Number(gameSessionId) });
              navigate('/game-dashboard', { replace: true });
            });
          } else {
            // Player eliminated
            socket.emit('playerEliminated', { gameSessionId: Number(gameSessionId) });
            alert('You have been eliminated!');
            navigate('/game-dashboard', { replace: true });
          }
        }
      }, 2000);
    });

    return () => {
      socket.off('bombQuiz');
      socket.off('quizResult');
    };
  }, [gameSessionId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!question || showResult) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [question, showResult]);

  const handleSubmit = () => {
    if (isSubmitting || !question || !selectedAnswer) return;
    
    setIsSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    socket.emit('answerQuiz', {
      gameSessionId: Number(gameSessionId),
      questionId: question.id,
      answer: selectedAnswer,
      timeTaken,
      usedHackerAbility: false
    });
  };

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading bomb quiz...</div>
      </div>
    );
  }

  const options = [
    { key: 'A', value: question.option_a },
    { key: 'B', value: question.option_b },
    { key: 'C', value: question.option_c },
    { key: 'D', value: question.option_d }
  ];

  // Calculate timer bar percentage
  const totalTime = 30 + bonusTime;
  const timePercentage = (timerSeconds / totalTime) * 100;
  const timerColor = timerSeconds <= 10 ? 'bg-red-500' : timerSeconds <= 20 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Timer */}
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-red-500/50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-red-400">💣 BOMB DEFUSAL</h1>
            <div className="text-right">
              <p className="text-white text-4xl font-bold">{timerSeconds}s</p>
              {bonusTime > 0 && (
                <p className="text-green-400 text-sm">+{bonusTime}s Timekeeper Bonus</p>
              )}
            </div>
          </div>
          
          {/* Timer Bar */}
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className={`${timerColor} h-full transition-all duration-1000 ease-linear`}
              style={{ width: `${timePercentage}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-purple-500/30">
          <div className="mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              question.difficulty === 'easy' ? 'bg-green-500' :
              question.difficulty === 'medium' ? 'bg-yellow-500' :
              'bg-red-500'
            } text-white`}>
              {question.difficulty.toUpperCase()}
            </span>
            <span className="ml-2 text-purple-300 text-sm">Topic: {question.topic}</span>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-4">{question.question_text}</h2>
          
          {question.code_snippet && (
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 overflow-x-auto">
              <code>{question.code_snippet}</code>
            </pre>
          )}
        </div>

        {/* Options */}
        <div className="space-y-4 mb-6">
          {options.map((option) => (
            <button
              key={option.key}
              onClick={() => setSelectedAnswer(option.key)}
              disabled={isSubmitting || showResult}
              className={`w-full text-left p-4 rounded-xl font-bold transition-all ${
                selectedAnswer === option.key
                  ? 'bg-purple-600 text-white border-2 border-purple-400 scale-105'
                  : 'bg-black/40 text-white border-2 border-purple-500/30 hover:bg-purple-500/20'
              } ${(isSubmitting || showResult) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-2xl mr-3">{option.key}.</span>
              {option.value}
            </button>
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer || isSubmitting || showResult}
          className={`w-full py-4 rounded-xl font-bold text-xl transition-all ${
            selectedAnswer && !isSubmitting && !showResult
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Submitting...' : showResult ? 'Processing...' : 'Submit Answer'}
        </button>

        {/* Result Modal */}
        {showResult && resultData && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className={`rounded-2xl p-8 max-w-md border-4 ${
              resultData.success ? 'bg-green-900 border-green-500' : 'bg-red-900 border-red-500'
            }`}>
              <div className="text-center">
                <p className="text-6xl mb-4">{resultData.success ? '✅' : '❌'}</p>
                <h2 className="text-3xl font-bold text-white mb-4">
                  {resultData.success ? 'BOMB DEFUSED!' : 'WRONG ANSWER!'}
                </h2>
                {resultData.success && (
                  <div className="text-white space-y-2">
                    <p className="text-2xl font-bold text-yellow-400">+{resultData.scoreGained} points</p>
                    <p className="text-sm">Time: {resultData.timeTaken}s</p>
                    {resultData.method === 'hacker' && (
                      <p className="text-green-400">🔓 Hacker ability used!</p>
                    )}
                  </div>
                )}
                {!resultData.success && (
                  <p className="text-white">Check for Defuse card...</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BombQuiz;
