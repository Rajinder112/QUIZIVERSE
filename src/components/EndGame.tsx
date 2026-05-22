import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import confetti from 'canvas-confetti';
import { Home, Trophy, Sparkles } from 'lucide-react';

export const EndGame: React.FC = () => {
  const { players, resetGame } = useGame();

  // Sort players descending by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  const firstPlace = sortedPlayers[0] || null;
  const secondPlace = sortedPlayers[1] || null;
  const thirdPlace = sortedPlayers[2] || null;
  const runnersUp = sortedPlayers.slice(3);

  // Big confetti blast when ending screen renders
  useEffect(() => {
    // Left side burst
    const end = Date.now() + (3 * 1000);
    const interval = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Title */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/25 px-4 py-1.5 rounded-full text-yellow-400 font-extrabold text-xs uppercase tracking-widest mb-4">
          <Trophy size={14} />
          Tournament Complete
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight bg-gradient-to-r from-yellow-300 via-white to-amber-500 bg-clip-text text-transparent">
          Game Over!
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Here is how the scores stacked up at the finish line!
        </p>
      </div>

      {/* Podium Layout */}
      <div className="flex flex-col md:flex-row justify-center items-end gap-6 md:gap-4 mb-16 px-4 max-w-2xl mx-auto">
        
        {/* 2nd Place (Left) */}
        {secondPlace ? (
          <div className="w-full md:w-1/3 flex flex-col items-center animate-slide-up delay-100 order-2 md:order-1">
            <span className="text-xs font-bold text-slate-400 uppercase mb-2">2nd Place</span>
            <div className="text-sm font-bold text-white text-center truncate max-w-[150px] mb-1">
              {secondPlace.nickname}
            </div>
            <div className="text-xs font-semibold text-slate-500 mb-4">
              {secondPlace.score} pts
            </div>
            
            {/* Podium step block */}
            <div className="w-full h-28 podium-2nd rounded-t-2xl flex flex-col items-center justify-center shadow-lg shadow-black/30">
              <span className="text-3xl font-black text-slate-400">🥈</span>
              <span className="text-sm font-bold text-slate-400 mt-1">Silver</span>
            </div>
          </div>
        ) : (
          <div className="hidden md:block w-1/3" />
        )}

        {/* 1st Place (Center - Tallest) */}
        {firstPlace ? (
          <div className="w-full md:w-1/3 flex flex-col items-center animate-slide-up order-1 md:order-2">
            <div className="flex items-center gap-1.5 text-yellow-400 font-black text-xs uppercase tracking-widest mb-2 animate-bounce-slow">
              <Sparkles size={14} /> Champion <Sparkles size={14} />
            </div>
            <div className="text-xl font-black text-yellow-400 text-center truncate max-w-[180px] mb-1">
              {firstPlace.nickname}
            </div>
            <div className="text-sm font-bold text-yellow-500/80 mb-4">
              {firstPlace.score} pts
            </div>
            
            {/* Podium step block */}
            <div className="w-full h-40 podium-1st rounded-t-2xl flex flex-col items-center justify-center relative shadow-xl shadow-yellow-500/5">
              {/* Crown */}
              <div className="absolute -top-6 text-3xl animate-bounce">👑</div>
              <span className="text-4xl font-black">🥇</span>
              <span className="text-base font-black text-yellow-400 mt-1">Gold</span>
            </div>
          </div>
        ) : (
          <div className="w-full text-center py-6 text-slate-500">
            No players logged scores.
          </div>
        )}

        {/* 3rd Place (Right) */}
        {thirdPlace ? (
          <div className="w-full md:w-1/3 flex flex-col items-center animate-slide-up delay-200 order-3 md:order-3">
            <span className="text-xs font-bold text-slate-400 uppercase mb-2">3rd Place</span>
            <div className="text-sm font-bold text-white text-center truncate max-w-[150px] mb-1">
              {thirdPlace.nickname}
            </div>
            <div className="text-xs font-semibold text-slate-500 mb-4">
              {thirdPlace.score} pts
            </div>
            
            {/* Podium step block */}
            <div className="w-full h-20 podium-3rd rounded-t-2xl flex flex-col items-center justify-center shadow-lg shadow-black/30">
              <span className="text-3xl font-black">🥉</span>
              <span className="text-sm font-bold text-amber-600 mt-1">Bronze</span>
            </div>
          </div>
        ) : (
          <div className="hidden md:block w-1/3" />
        )}
      </div>

      {/* Runners Up list */}
      {runnersUp.length > 0 && (
        <div className="max-w-xl mx-auto glass-card p-6 border-slate-800 mb-12 animate-fade-in delay-300">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 pb-2 border-b border-slate-900">
            Other Placements
          </h3>
          
          <div className="space-y-3">
            {runnersUp.map((player, idx) => (
              <div key={player.id} className="flex justify-between items-center bg-slate-950/50 border border-slate-900 px-4 py-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500">#{idx + 4}</span>
                  <span className="text-sm font-semibold text-white">{player.nickname}</span>
                  {player.isBot && <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-550 px-1 py-0.5 rounded font-bold uppercase">Bot</span>}
                </div>
                <span className="text-sm font-bold text-slate-400">{player.score} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Reset Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-8 py-4 bg-quizPurple hover:bg-quizPurple-hover text-white rounded-2xl shadow-xl shadow-quizPurple/20 font-bold text-lg hover:scale-105 active:scale-95 transition-all"
        >
          <Home size={18} />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
