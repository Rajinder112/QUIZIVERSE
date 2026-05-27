import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { CreateQuiz } from './components/CreateQuiz';
import { HostLobby } from './components/HostLobby';
import { HostGameBoard } from './components/HostGameBoard';
import { PlayerJoin } from './components/PlayerJoin';
import { PlayerGameBoard } from './components/PlayerGameBoard';
import { Leaderboard } from './components/Leaderboard';
import { EndGame } from './components/EndGame';
import { Play, Plus, Smartphone, Gamepad2, Info, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

const Dashboard: React.FC = () => {
  const {
    quizzes,
    createLobby,
    setGameState,
    joinLobby,
    deleteQuiz,
    setEditingQuiz,
  } = useGame();

  const [pinInput, setPinInput] = useState('');
  const [nickInput, setNickInput] = useState('');
  const [error, setError] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim() || pinInput.trim().length !== 4) {
      setError('Enter a valid 4-digit PIN!');
      return;
    }
    if (!nickInput.trim()) {
      setError('Enter a nickname!');
      return;
    }
    
    joinLobby(pinInput, nickInput);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in">
      
      {/* Title Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-quizPurple/10 border border-quizPurple/30 rounded-full text-quizPurple text-xs font-bold uppercase tracking-widest mb-4">
          <Gamepad2 size={12} /> Local Real-Time Multiplayer
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white mb-4">
          QUIZ<span className="text-quizPurple">IVERSE</span>
        </h1>
        <p className="text-slate-400 max-w-md mx-auto text-sm md:text-base">
          An interactive, gamified MCQ quiz platform.
        </p>
      </div>

      {/* Guide notice card */}
      <div className="glass-card p-5 mb-8 border-slate-800/80 bg-slate-900/30 flex items-start gap-4">
        <div className="p-2.5 bg-quizPurple/15 text-quizPurple rounded-xl shrink-0 mt-0.5">
          <Info size={20} />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm mb-1">Pair-Testing Instructions</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Open this page in **two side-by-side browser tabs** (or scan the host QR code using a phone connected to the same network). 
            Select a quiz on one tab to **Host**, then enter the Room PIN and a nickname on the other tab to **Join** and play. 
            All actions synchronize instantly in real-time!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Play (Join Room) Column */}
        <div className="glass-card p-8 flex flex-col justify-between border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-quizGreen mb-4">
              <Smartphone size={20} />
              <h2 className="text-xl font-bold text-white">Join Game</h2>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Enter a room PIN and your nickname to join an active quiz.
            </p>

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-xl text-red-300 text-xs mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-4">
              <input
                type="text"
                placeholder="Game PIN (e.g. 5842)"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-quizPurple focus:ring-1 focus:ring-quizPurple rounded-xl text-white outline-none font-semibold transition-all placeholder:text-slate-700"
              />
              <input
                type="text"
                placeholder="Nickname"
                maxLength={12}
                value={nickInput}
                onChange={(e) => {
                  setNickInput(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-quizPurple focus:ring-1 focus:ring-quizPurple rounded-xl text-white outline-none font-semibold transition-all placeholder:text-slate-700"
              />
              <button
                type="submit"
                className="w-full py-3.5 bg-quizGreen hover:bg-quizGreen-hover text-white rounded-xl shadow-lg shadow-quizGreen/20 font-bold transition-all hover:scale-[1.01] active:scale-95"
              >
                Join & Play!
              </button>
            </form>
          </div>
          
          <div className="text-center border-t border-slate-950 mt-6 pt-4 text-xs text-slate-500">
            Have a QR code? Scan it using your phone to auto-fill the PIN!
          </div>
        </div>

        {/* Host (Choose Quiz) Column */}
        <div className="glass-card p-8 border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Host a Game</h2>
            <button
              onClick={() => setGameState('create_quiz')}
              className="flex items-center gap-1 text-xs font-bold text-quizPurple bg-quizPurple/10 border border-quizPurple/20 px-3 py-1.5 rounded-lg hover:bg-quizPurple hover:text-white transition-all"
            >
              <Plus size={14} />
              Create Custom
            </button>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-all group"
              >
                <div className="min-w-0 pr-3">
                  <h3 className="font-bold text-sm text-slate-200 truncate group-hover:text-white transition-colors">
                    {quiz.title}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    {quiz.questions.length} MCQ Questions
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Edit */}
                  <button
                    onClick={() => {
                      setEditingQuiz(quiz);
                      setGameState('create_quiz');
                    }}
                    className="p-2 text-slate-500 hover:text-quizPurple hover:bg-quizPurple/10 rounded-lg transition-all"
                    title="Edit quiz"
                  >
                    <Pencil size={14} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${quiz.title}"? This cannot be undone.`)) {
                        deleteQuiz(quiz.id);
                      }
                    }}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete quiz"
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Host */}
                  <button
                    onClick={() => createLobby(quiz.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-quizPurple text-white text-xs font-bold rounded-lg shadow-md hover:bg-quizPurple-hover transition-all"
                  >
                    <Play size={10} fill="currentColor" />
                    Host
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MainGameRouter: React.FC = () => {
  const { gameState, userRole } = useGame();

  if (gameState === 'create_quiz') {
    return <CreateQuiz />;
  }

  // If not joined yet, but room is in URL, direct to join screen
  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get('room');
  if (!userRole && roomParam) {
    return <PlayerJoin />;
  }

  if (userRole === 'host') {
    switch (gameState) {
      case 'lobby':
        return <HostLobby />;
      case 'playing':
        return <HostGameBoard />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'gameover':
        return <EndGame />;
      default:
        return <Dashboard />;
    }
  }

  if (userRole === 'player') {
    switch (gameState) {
      case 'lobby':
      case 'playing':
        return <PlayerGameBoard />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'gameover':
        return <EndGame />;
      default:
        return <Dashboard />;
    }
  }

  return <Dashboard />;
};

function App() {
  return (
    <GameProvider>
      <div className="min-h-screen grid-bg relative">
        <MainGameRouter />
      </div>
    </GameProvider>
  );
}

export default App;
