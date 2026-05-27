import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export const PlayerGameBoard: React.FC = () => {
  const {
    gameState,
    nickname,
    roomCode,
    currentQuiz,
    currentQuestionIndex,
    submitAnswer,
    hasAnswered,
    feedback,
    score
  } = useGame();

  const [localTimer, setLocalTimer] = useState(30);
  const localTimerRef = useRef<number | null>(null);

  const question = currentQuiz?.questions[currentQuestionIndex];

  // Robust countdown timer logic for player view
  useEffect(() => {
    // Only run timer if playing and player hasn't answered yet
    if (gameState === 'playing' && question && !hasAnswered) {
      setLocalTimer(30);

      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
      }

      localTimerRef.current = setInterval(() => {
        setLocalTimer((prev) => {
          if (prev <= 1) {
            clearInterval(localTimerRef.current!);
            localTimerRef.current = null;
            // Auto submit incorrect on timeout
            submitAnswer(-1); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as unknown as number;
    }

    return () => {
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
        localTimerRef.current = null;
      }
    };
  }, [gameState, currentQuestionIndex, hasAnswered, question]);

  // Clean up timer if they submit answer
  useEffect(() => {
    if (hasAnswered && localTimerRef.current) {
      clearInterval(localTimerRef.current);
      localTimerRef.current = null;
    }
  }, [hasAnswered]);

  // If in Lobby State
  if (gameState === 'lobby') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="glass-card p-8 border-slate-800">
          <div className="w-16 h-16 bg-quizPurple/10 border border-quizPurple/20 text-quizPurple rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="animate-spin" size={30} />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">You're In!</h2>
          <p className="text-slate-400 text-sm mb-6">
            Check your name on the host's screen.
          </p>

          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 mb-4 text-left">
            <div className="flex justify-between py-1.5 border-b border-slate-900/60">
              <span className="text-xs text-slate-500 font-semibold uppercase">Nickname</span>
              <span className="text-sm font-bold text-white">{nickname}</span>
            </div>
            <div className="flex justify-between py-1.5 mt-1">
              <span className="text-xs text-slate-500 font-semibold uppercase">Room PIN</span>
              <span className="text-sm font-bold text-quizPurple tracking-wider">{roomCode}</span>
            </div>
          </div>
          
          <p className="text-[11px] text-slate-550 italic">
            Waiting for the host to start the game...
          </p>
        </div>
      </div>
    );
  }

  // If in Playing State
  if (gameState === 'playing') {
    if (!question) return null;

    // Design tokens for option tiles (Red, Blue, Yellow, Green)
    const optionStyles = [
      'btn-option-red shadow-red-800 hover:shadow-red-700',
      'btn-option-blue shadow-blue-800 hover:shadow-blue-700',
      'btn-option-yellow shadow-yellow-800 hover:shadow-yellow-700',
      'btn-option-green shadow-emerald-800 hover:shadow-emerald-700'
    ];

    const icons = ['▲', '■', '◆', '●'];

    // Render Answered/Feedback Overlay Screen
    if (hasAnswered && feedback) {
      const isCorrect = feedback.correct;
      
      return (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center animate-scale-in ${
          isCorrect 
            ? 'bg-emerald-950' 
            : 'bg-red-950'
        }`}>
          {/* Confetti effect or background lines */}
          <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />

          <div className="max-w-md w-full glass-card border-none bg-slate-950/40 p-8 shadow-2xl">
            {isCorrect ? (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={48} className="animate-bounce" />
                </div>
                <h2 className="text-4xl font-black text-emerald-400 tracking-tight mb-2">CORRECT</h2>
                <p className="text-white text-3xl font-extrabold mb-1">+{feedback.points}</p>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Points Earned</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full flex items-center justify-center mb-6">
                  <XCircle size={48} className="animate-pulse" />
                </div>
                <h2 className="text-4xl font-black text-red-400 tracking-tight mb-2">
                  {feedback.correctAnswerIndex === -1 ? "TIME'S UP" : "INCORRECT"}
                </h2>
                
                {feedback.correctAnswerIndex !== -1 && (
                  <div className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-xl w-full text-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">
                      Correct Answer
                    </span>
                    <span className="text-white font-bold text-sm">
                      {question.options[feedback.correctAnswerIndex]}
                    </span>
                  </div>
                )}

                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-6">0 Points Awarded</p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-900 flex justify-between items-center text-left">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Your Total Score</span>
                <span className="text-lg font-bold text-white">{score} pts</span>
              </div>
              <span className="text-xs text-slate-450 italic animate-pulse">
                Waiting for others...
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col min-h-[calc(100vh-80px)] justify-between animate-fade-in">
        {/* Header timer info */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-400">
              Q{currentQuestionIndex + 1} of {currentQuiz?.questions.length}
            </span>
            
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-extrabold ${
              localTimer <= 5 
                ? 'bg-red-950/40 border-red-500 text-red-400 animate-pulse' 
                : 'bg-slate-900 border-slate-800 text-slate-200'
            }`}>
              <Clock size={14} />
              {localTimer}s
            </div>
          </div>

          {/* Shrinking timer bar */}
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-6">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                localTimer <= 5 ? 'bg-red-500' : 'bg-quizPurple'
              }`}
              style={{ width: `${(localTimer / 30) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="glass-card p-6 md:p-8 mb-6 border-slate-800 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed">
              {question.text}
            </h2>
            {question.image && (
              <div className="mt-4 max-w-sm w-full mx-auto bg-slate-950/80 border border-slate-850 rounded-2xl p-2.5 flex items-center justify-center shadow-inner overflow-hidden animate-scale-in">
                <img
                  src={question.image}
                  alt="Identify the figure"
                  className="max-h-48 md:max-h-56 w-auto object-contain rounded-xl"
                />
              </div>
            )}
          </div>
        </div>

        {/* 4 large colorful option tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => submitAnswer(index)}
              className={`w-full p-6 min-h-[90px] rounded-2xl flex items-center gap-4 text-left transition-all ${optionStyles[index]}`}
            >
              <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center text-sm font-black text-white shrink-0">
                {icons[index]}
              </div>
              <span className="text-lg font-extrabold leading-tight text-white">{option}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Fallback for leaderboard/end game screens handled at route level
  return null;
};
