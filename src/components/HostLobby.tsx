import React from 'react';
import { useGame } from '../context/GameContext';
import { QRCodeSVG } from 'qrcode.react';
import { Users, UserPlus, Play, ArrowLeft, Trash2, Link, Copy, Check, FileSpreadsheet, Plus } from 'lucide-react';
import { useState } from 'react';

export const HostLobby: React.FC = () => {
  const { 
    roomCode, 
    players, 
    currentQuiz, 
    addBotPlayer, 
    removePlayer, 
    startGame, 
    resetGame,
    googleSheetUrls,
    saveGoogleSheetUrl
  } = useGame();

  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Generate join link
  const joinUrl = `${window.location.origin}/?room=${roomCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition-all"
        >
          <ArrowLeft size={16} />
          Quit Game
        </button>

        <div className="text-right">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Active Quiz</span>
          <span className="text-lg font-bold text-white">{currentQuiz?.title}</span>
        </div>
      </div>

      {/* Main Grid: Info Left, QR & PIN Right */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Room Join Panel */}
        <div className="glass-card p-8 flex flex-col justify-between md:col-span-2">
          <div>
            <span className="text-sm font-bold text-quizPurple uppercase tracking-wider block mb-1">
              Join Instructions
            </span>
            <h2 className="text-2xl font-bold text-white mb-6">
              Tell your friends to scan or visit:
            </h2>

            {/* Code Panel */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 mb-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-quizPurple/5 rounded-full blur-2xl group-hover:bg-quizPurple/10 transition-all duration-500" />
              
              <span className="text-slate-500 text-xs font-bold uppercase tracking-widest block mb-2">
                Room Code / Game PIN
              </span>
              <div className="text-5xl md:text-6xl font-black text-white tracking-widest select-all animate-pulse-slow">
                {roomCode}
              </div>
            </div>

            {/* Link Copy */}
            <div className="flex gap-2 items-center bg-slate-950/50 border border-slate-850 px-4 py-3 rounded-xl">
              <Link size={16} className="text-slate-500 shrink-0" />
              <input
                type="text"
                readOnly
                value={joinUrl}
                className="bg-transparent text-sm text-slate-400 outline-none w-full select-all font-mono"
              />
              <button
                onClick={copyToClipboard}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-all shrink-0"
                title="Copy URL"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>

          {/* Google Sheet Web App Link (Optional Configuration) */}
          <div className="mt-6 bg-slate-950/45 p-4 rounded-xl border border-slate-900/60">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileSpreadsheet className="text-emerald-400" size={14} />
                Google Sheets Export URL (Optional)
              </label>
              
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center gap-1 text-[10px] font-bold text-quizPurple bg-quizPurple/10 border border-quizPurple/20 px-2.5 py-1 rounded hover:bg-quizPurple hover:text-white transition-all cursor-pointer animate-pulse-slow"
                title="View setup instructions"
              >
                <Plus size={10} />
                Setup Guide
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Paste Apps Script Web App URL to auto-save"
              value={currentQuiz ? (googleSheetUrls[currentQuiz.id] || '') : ''}
              onChange={(e) => currentQuiz && saveGoogleSheetUrl(currentQuiz.id, e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-quizPurple focus:ring-1 focus:ring-quizPurple rounded-lg text-slate-200 outline-none transition-all text-xs"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              Paste your Web App URL here before starting, and the game will auto-export results to this sheet when complete.
            </span>

            {showInstructions && (
              <div className="mt-3 text-slate-400 text-xs leading-relaxed space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-900 animate-slide-up">
                <ol className="list-decimal pl-4 space-y-2">
                  <li>
                    Open or create a <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-quizPurple hover:underline font-semibold">Google Spreadsheet</a>.
                  </li>
                  <li>
                    Go to **Extensions** &rarr; **Apps Script**.
                  </li>
                  <li>
                    Replace the default script contents with the following code block:
                    <pre className="mt-1.5 p-3 bg-slate-950 border border-slate-850 rounded-lg overflow-x-auto text-[10px] text-quizPurple font-mono max-h-48">
{`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Quiz Title", "Rank", "Player Nickname", "Final Score", "Question #", "Question Text", "Selected Option", "Correct Option", "Is Correct?", "Points Earned", "Is Bot?"]);
    }
    var timestamp = new Date();
    data.scoreboard.forEach(function(player) {
      player.answers.forEach(function(ans) {
        sheet.appendRow([
          timestamp,
          data.quizTitle,
          player.rank,
          player.nickname,
          player.finalScore,
          ans.questionNum,
          ans.questionText,
          ans.selectedOptionText,
          ans.correctOptionText,
          ans.isCorrect,
          ans.pointsEarned,
          player.isBot ? "Yes" : "No"
        ]);
      });
    });
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`}
                    </pre>
                  </li>
                  <li>
                    Click **Deploy** (top right) &rarr; **New deployment**.
                  </li>
                  <li>
                    Select type **Web app**. Change settings to:
                    <ul className="list-disc pl-4 mt-1 font-semibold text-slate-350">
                      <li>**Execute as:** Me</li>
                      <li>**Who has access:** Anyone</li>
                    </ul>
                  </li>
                  <li>
                    Click **Deploy**, approve authorization, copy the **Web App URL**, and paste it in the input field above!
                  </li>
                </ol>
              </div>
            )}
          </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-wrap gap-4 mt-8">
            <button
              onClick={addBotPlayer}
              className="flex items-center gap-2 px-5 py-3 bg-slate-900 border border-slate-850 hover:bg-slate-850 hover:border-slate-700 text-slate-300 rounded-xl transition-all"
            >
              <UserPlus size={18} className="text-blue-400" />
              Add Test Bot
            </button>

            <button
              onClick={startGame}
              disabled={players.length === 0}
              className={`flex-1 flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                players.length > 0
                  ? 'bg-gradient-to-r from-quizGreen to-emerald-500 text-white shadow-lg shadow-quizGreen/25 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
              }`}
            >
              <Play size={18} fill="currentColor" />
              Start Game ({players.length} Joined)
            </button>
          </div>
        </div>

        {/* QR Code Panel */}
        <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
          <span className="text-slate-400 text-sm font-semibold mb-4">
            Scan QR Code to Join Instantly
          </span>
          
          <div className="p-4 bg-white rounded-2xl shadow-xl shadow-black/20 mb-4 hover:scale-105 transition-transform duration-300">
            <QRCodeSVG 
              value={joinUrl} 
              size={200}
              level="H"
              bgColor="#FFFFFF"
              fgColor="#030712"
              includeMargin={false}
            />
          </div>
          
          <span className="text-xs text-slate-500 max-w-[200px]">
            Points are awarded faster for quick answers!
          </span>
        </div>
      </div>

      {/* Players List Section */}
      <div className="glass-card p-6 min-h-[250px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Users className="text-quizPurple" size={20} />
            <h3 className="text-lg font-bold text-white">Joined Players</h3>
          </div>
          <span className="bg-slate-950 px-3 py-1 rounded-full text-xs font-bold text-slate-400 border border-slate-850">
            Total: {players.length}
          </span>
        </div>

        {players.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600">
            <div className="w-16 h-16 bg-slate-950/60 border border-slate-900 rounded-full flex items-center justify-center mb-4 text-slate-700">
              <Users size={32} />
            </div>
            <p className="text-sm font-medium">Waiting for players to join...</p>
            <p className="text-xs text-slate-750 mt-1">Scan the QR code or share the invite URL</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {players.map((player) => (
              <div
                key={player.id}
                className="group relative bg-slate-950 border border-slate-850 hover:border-slate-700/80 px-4 py-3 rounded-xl flex items-center justify-between transition-all hover:scale-[1.03] animate-scale-in"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-sm font-semibold text-white truncate">
                    {player.nickname}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {player.isBot ? 'Bot Participant' : 'Player'}
                  </span>
                </div>

                <button
                  onClick={() => removePlayer(player.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-md transition-all"
                  title="Kick player"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
