import React from 'react';
import { useGame } from '../context/GameContext';
import { Award, ArrowRight, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const {
    players,
    userRole,
    currentQuiz,
    currentQuestionIndex,
    nextQuestion,
    endGame
  } = useGame();

  // Sort players descending by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const isLastQuestion = currentQuiz 
    ? currentQuestionIndex === currentQuiz.questions.length - 1 
    : false;

  // Find user's own ranking if player
  const myPlayerId = useGame().playerId;
  const myRankIndex = sortedPlayers.findIndex(p => p.id === myPlayerId);
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : null;
  const myInfo = myRankIndex !== -1 ? sortedPlayers[myRankIndex] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      {/* Top Banner Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 mb-3">
          <Award size={24} />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Leaderboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          {isLastQuestion ? 'Final scoreboard after the last question!' : `After Question ${currentQuestionIndex + 1}`}
        </p>
      </div>

      {/* Player Dashboard Notice (Only for active Players) */}
      {userRole === 'player' && myInfo && (
        <div className="glass-card p-6 mb-6 border-slate-800 bg-slate-900/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-quizPurple/10 rounded-full blur-2xl" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-quizPurple flex items-center justify-center font-black text-white text-lg">
                #{myRank}
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Your Standing</span>
                <span className="text-lg font-bold text-white">{myInfo.nickname}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Total Score</span>
              <span className="text-lg font-black text-quizPurple">{myInfo.score} pts</span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-950/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {myInfo.lastAnsweredCorrectly ? (
                <span className="text-green-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck size={14} /> Correct answer last round! (+{myInfo.lastScoreEarned} pts)
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1 font-semibold">
                  <ShieldAlert size={14} /> Incorrect or timeout last round. (+0 pts)
                </span>
              )}
            </span>
            <span className="text-slate-500 italic animate-pulse">Get ready for next question...</span>
          </div>
        </div>
      )}

      {/* Main Leaderboard List */}
      <div className="glass-card overflow-hidden mb-8 border-slate-800">
        <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-900 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
          <span>Rank & Player</span>
          <span>Score / Streak</span>
        </div>

        {sortedPlayers.length === 0 ? (
          <div className="py-12 text-center text-slate-600 text-sm">
            No players logged in.
          </div>
        ) : (
          <div className="divide-y divide-slate-950/60">
            {sortedPlayers.map((player, idx) => {
              const rank = idx + 1;
              const isTopThree = rank <= 3;
              const isMe = player.id === myPlayerId;

              // Top 3 Badge backgrounds
              const badges = [
                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                'bg-slate-400/20 text-slate-300 border-slate-400/30',
                'bg-amber-700/20 text-amber-500 border-amber-700/30'
              ];

              return (
                <div
                  key={player.id}
                  className={`px-6 py-4 flex items-center justify-between transition-all ${
                    isMe 
                      ? 'bg-quizPurple/10 border-l-4 border-l-quizPurple' 
                      : 'hover:bg-slate-900/30'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Rank Badge */}
                    {isTopThree ? (
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-black text-sm ${badges[idx]}`}>
                        {rank}
                      </div>
                    ) : (
                      <div className="w-8 h-8 flex items-center justify-center font-bold text-sm text-slate-550">
                        {rank}
                      </div>
                    )}

                    {/* Nickname and role info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold text-sm truncate ${isMe ? 'text-quizPurple' : 'text-slate-200'}`}>
                          {player.nickname}
                        </span>
                        {player.isBot && (
                          <span className="text-[8px] bg-blue-950 text-blue-400 px-1 py-0.5 rounded border border-blue-900 font-bold uppercase">
                            Bot
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score details */}
                  <div className="flex items-center gap-4">
                    {/* Score bump alert */}
                    {player.lastQuestionAnswered === currentQuestionIndex && player.lastScoreEarned > 0 && (
                      <span className="text-xs text-green-400 font-bold animate-pulse shrink-0">
                        +{player.lastScoreEarned}
                      </span>
                    )}

                    <span className="font-extrabold text-sm text-white shrink-0">
                      {player.score} <span className="text-[10px] font-medium text-slate-500">pts</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Host Controls */}
      {userRole === 'host' && (
        <div className="flex justify-end">
          {isLastQuestion ? (
            <button
              onClick={endGame}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-quizGreen to-emerald-500 hover:from-emerald-500 hover:to-quizGreen text-white rounded-2xl shadow-xl shadow-quizGreen/25 font-bold text-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles size={18} />
              Finish Game & View Podium
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-quizPurple to-purple-600 hover:from-purple-600 hover:to-quizPurple text-white rounded-2xl shadow-xl shadow-quizPurple/20 font-bold text-lg hover:scale-105 active:scale-95 transition-all"
            >
              Next Question
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
