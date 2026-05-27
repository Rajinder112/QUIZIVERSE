import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Clock, Users, ArrowRight, Award } from 'lucide-react';

export const HostGameBoard: React.FC = () => {
  const {
    currentQuiz,
    currentQuestionIndex,
    timer,
    players,
    answersCount,
    showLeaderboard
  } = useGame();

  const [roundEnded, setRoundEnded] = useState(false);

  const question = currentQuiz?.questions[currentQuestionIndex];

  // If timer reaches 0 or all players have answered, round ends
  useEffect(() => {
    if (timer === 0 || (players.length > 0 && answersCount >= players.length)) {
      setRoundEnded(true);
    } else {
      setRoundEnded(false);
    }
  }, [timer, answersCount, players.length]);

  if (!question) return null;

  const optionColors = [
    'border-red-500/30 bg-red-950/20 text-red-200',
    'border-blue-500/30 bg-blue-950/20 text-blue-200',
    'border-yellow-500/30 bg-yellow-950/20 text-yellow-200',
    'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
  ];



  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* Top Header stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Progress */}
        <div className="glass-card px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-quizPurple/10 flex items-center justify-center text-quizPurple shrink-0">
            <span className="font-extrabold text-sm">{currentQuestionIndex + 1}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Question</span>
            <span className="text-sm font-bold text-white">
              {currentQuestionIndex + 1} of {currentQuiz?.questions.length}
            </span>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="glass-card px-6 py-4 flex flex-col justify-center relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1 justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time Remaining</span>
            <span className={`text-sm font-bold flex items-center gap-1 ${timer <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              <Clock size={14} />
              {timer}s
            </span>
          </div>
          {/* Progress fill */}
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                timer <= 5 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-quizPurple'
              }`}
              style={{ width: `${(timer / 30) * 100}%` }}
            />
          </div>
        </div>

        {/* Submissions count */}
        <div className="glass-card px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
            <Users size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Submissions</span>
            <span className="text-sm font-bold text-white">
              {answersCount} / {players.length} answered
            </span>
          </div>
        </div>
      </div>

      {/* Large Board Screen */}
      <div className="glass-card p-8 md:p-12 mb-8 relative overflow-hidden text-center flex flex-col items-center justify-center min-h-[300px] border-slate-800">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-quizPurple via-blue-500 to-quizGreen" />
        
        {/* Floating background shape */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-quizPurple/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />

        <span className="px-4 py-1 rounded-full bg-slate-950 text-slate-500 text-xs font-bold uppercase tracking-wider border border-slate-850 mb-4">
          MCQ Question Prompt
        </span>

        <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-relaxed max-w-4xl">
          {question.text}
        </h1>

        {question.image && (
          <div className="mt-6 max-w-md w-full mx-auto bg-slate-950/80 border border-slate-850 rounded-2xl p-3 flex items-center justify-center shadow-inner overflow-hidden animate-scale-in">
            <img
              src={question.image}
              alt="Identify the figure"
              className="max-h-60 md:max-h-72 w-auto object-contain rounded-xl"
            />
          </div>
        )}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {question.options.map((option, optIdx) => {

          const indicators = ['▲', '■', '◆', '●'];
          const indicatorColors = [
            'text-red-500',
            'text-blue-500',
            'text-yellow-500',
            'text-emerald-500'
          ];

          const isCorrect = optIdx === question.correctAnswer;

          // Compute option card styles based on round state
          let cardStyle = 'border-slate-800 bg-slate-900/40 text-slate-300';
          if (roundEnded) {
            if (isCorrect) {
              cardStyle = 'glow-green border-emerald-500 bg-emerald-950/40 text-white scale-[1.01]';
            } else {
              cardStyle = 'border-slate-950 bg-slate-950/20 text-slate-600 opacity-40';
            }
          } else {
            // Options highlighted with specific colors for hosts before game ends
            cardStyle = optionColors[optIdx] + ' border hover:border-slate-600 transition-all';
          }

          return (
            <div
              key={optIdx}
              className={`p-6 rounded-2xl border-2 flex items-center gap-4 transition-all duration-300 ${cardStyle}`}
            >
              <div className={`w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-sm font-black shrink-0 border border-slate-850 ${indicatorColors[optIdx]}`}>
                {indicators[optIdx]}
              </div>
              <span className="text-lg md:text-xl font-bold">{option}</span>
            </div>
          );
        })}
      </div>

      {/* Control Actions */}
      <div className="flex justify-end gap-4">
        {roundEnded ? (
          <button
            onClick={showLeaderboard}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-quizPurple to-purple-600 hover:from-purple-600 hover:to-quizPurple text-white rounded-2xl shadow-xl shadow-quizPurple/20 font-bold text-lg hover:scale-105 active:scale-95 transition-all"
          >
            <Award size={20} />
            Show Leaderboard
          </button>
        ) : (
          <button
            onClick={showLeaderboard}
            className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 rounded-xl transition-all"
          >
            Skip Timer
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
