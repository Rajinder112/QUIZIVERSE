import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { User, Hash, LogIn, AlertCircle } from 'lucide-react';

export const PlayerJoin: React.FC = () => {
  const { joinLobby, setGameState } = useGame();
  
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  // Extract room PIN from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setPin(room);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pin.trim()) {
      setError('Game PIN is required!');
      return;
    }
    if (pin.trim().length !== 4 || isNaN(Number(pin))) {
      setError('Game PIN must be a 4-digit number!');
      return;
    }
    if (!nickname.trim()) {
      setError('Nickname is required!');
      return;
    }
    if (nickname.trim().length > 12) {
      setError('Nickname must be 12 characters or less!');
      return;
    }

    const success = joinLobby(pin.trim(), nickname.trim());
    if (!success) {
      setError('Could not join room. Verify PIN is correct.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 animate-fade-in">
      <div className="text-center mb-8">
        {/* Floating animated logo or icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-quizPurple shadow-lg shadow-quizPurple/30 mb-4 animate-float">
          <span className="text-3xl font-black text-white">Q</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
          Join Quiz Room
        </h1>
        <p className="text-sm text-slate-500">
          Enter room PIN and nickname to start playing
        </p>
      </div>

      <div className="glass-card p-8 border-slate-800/80">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-center gap-2 text-red-300 text-xs">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Game PIN */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Game PIN
            </label>
            <div className="relative flex items-center">
              <Hash size={18} className="absolute left-4 text-slate-600" />
              <input
                type="text"
                placeholder="e.g. 5842"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-950/80 border border-slate-800 focus:border-quizPurple focus:ring-1 focus:ring-quizPurple rounded-xl text-white outline-none font-bold text-lg tracking-widest text-center transition-all placeholder:text-slate-700"
              />
            </div>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Nickname
            </label>
            <div className="relative flex items-center">
              <User size={18} className="absolute left-4 text-slate-600" />
              <input
                type="text"
                placeholder="e.g. Speedster"
                maxLength={12}
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError('');
                }}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-950/80 border border-slate-800 focus:border-quizPurple focus:ring-1 focus:ring-quizPurple rounded-xl text-white outline-none font-bold text-base transition-all placeholder:text-slate-700"
              />
            </div>
          </div>

          {/* Join Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-4 bg-quizPurple hover:bg-quizPurple-hover text-white rounded-xl shadow-lg shadow-quizPurple/25 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogIn size={18} />
            Join Room
          </button>
        </form>
      </div>

      {/* Helper link */}
      <div className="text-center mt-6">
        <button
          onClick={() => setGameState('idle')}
          className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
        >
          Cancel and return to dashboard
        </button>
      </div>
    </div>
  );
};
