import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import confetti from 'canvas-confetti';
import { Home, Trophy, Sparkles, FileSpreadsheet, ChevronDown, ChevronUp, Check, AlertCircle, Loader2 } from 'lucide-react';

const DancingCharacter: React.FC<{ place: '1st' | '2nd' | '3rd' }> = ({ place }) => {
  const isGold = place === '1st';
  const isSilver = place === '2nd';
  const isBronze = place === '3rd';

  // Hair colors
  const hairColor = 
    isGold ? 'text-yellow-400' : 
    isSilver ? 'text-slate-300' : 'text-amber-700';

  // Outfit colors
  const bodyColor = 
    isGold ? 'bg-gradient-to-b from-yellow-500 to-amber-600 border border-yellow-300' : 
    isSilver ? 'bg-gradient-to-b from-slate-400 to-slate-600 border border-slate-300' : 
    'bg-gradient-to-b from-orange-600 to-amber-800 border border-orange-400';

  const danceClass = 
    place === '1st' ? 'char-dance-1st' : 
    place === '2nd' ? 'char-dance-2nd' : 'char-dance-3rd';

  return (
    <div className={`chibi-wrapper ${danceClass}`}>
      <div className="char-shadow" />
      
      <div className="chibi-character">
        {/* Cape for 1st Place */}
        {isGold && <div className="chibi-cape" />}

        {/* Head */}
        <div className="chibi-head">
          {/* Spiky Anime Hair Base */}
          <div className={`chibi-hair-base ${hairColor} bg-current`}>
            {/* Left Hair Spike */}
            <div className={`chibi-hair-spike ${hairColor}`} style={{ left: '-10px', top: '-5px', transform: 'rotate(-30deg)' }} />
            {/* Center Hair Spikes */}
            <div className={`chibi-hair-spike ${hairColor}`} style={{ left: '12px', top: '-18px', transform: 'rotate(-5deg)' }} />
            <div className={`chibi-hair-spike ${hairColor}`} style={{ left: '32px', top: '-20px', transform: 'rotate(0deg)' }} />
            <div className={`chibi-hair-spike ${hairColor}`} style={{ left: '52px', top: '-18px', transform: 'rotate(10deg)' }} />
            {/* Right Hair Spike */}
            <div className={`chibi-hair-spike ${hairColor}`} style={{ right: '-10px', top: '-5px', transform: 'rotate(30deg)' }} />
          </div>

          {/* Hair Bangs on forehead */}
          <div className={`chibi-hair-bangs ${hairColor}`}>
            <div className="chibi-bang-strand" style={{ height: '18px', transform: 'rotate(10deg)' }} />
            <div className="chibi-bang-strand" style={{ height: '24px', transform: 'rotate(5deg)' }} />
            <div className="chibi-bang-strand" style={{ height: '20px', transform: 'rotate(-5deg)' }} />
            <div className="chibi-bang-strand" style={{ height: '26px' }} />
            <div className="chibi-bang-strand" style={{ height: '18px', transform: 'rotate(-10deg)' }} />
          </div>

          {/* Large Shiny Anime Eyes */}
          <div className="chibi-eye-container">
            <div className="chibi-eye">
              <div className="chibi-eye-sparkle-1" />
              <div className="chibi-eye-sparkle-2" />
            </div>
            <div className="chibi-eye">
              <div className="chibi-eye-sparkle-1" />
              <div className="chibi-eye-sparkle-2" />
            </div>
          </div>

          {/* Blushing cheeks */}
          <div className="chibi-blush chibi-blush-left" />
          <div className="chibi-blush chibi-blush-right" />

          {/* Mouth */}
          <div className="chibi-mouth" />

          {/* Accessories */}
          {isGold && (
            <div className="chibi-crown">
              <div className="absolute inset-0 flex justify-around items-end pb-0.5">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                <span className="w-1 h-1 rounded-full bg-blue-500" />
                <span className="w-1 h-1 rounded-full bg-green-500" />
              </div>
            </div>
          )}
          {isSilver && (
            <>
              <div className="chibi-headset-band" />
              <div className="chibi-headset-ear left" />
              <div className="chibi-headset-ear right" />
            </>
          )}
          {isBronze && (
            <div className="chibi-glasses">
              <div className="chibi-glass-lens" />
              <div className="chibi-glass-lens" />
            </div>
          )}
        </div>

        {/* Small Body */}
        <div className={`chibi-body ${bodyColor}`}>
          {isGold && <span className="text-[10px] text-yellow-300 font-black mt-2">★</span>}
          {isSilver && <span className="text-[10px] text-slate-200 font-black mt-2">✦</span>}
          {isBronze && <span className="text-[8px] text-orange-200 font-bold mt-2.5">▲</span>}

          {/* Outfitted limbs */}
          <div className={`chibi-arm chibi-arm-left ${bodyColor}`} />
          <div className={`chibi-arm chibi-arm-right ${bodyColor}`} />
          <div className={`chibi-leg chibi-leg-left ${bodyColor}`} />
          <div className={`chibi-leg chibi-leg-right ${bodyColor}`} />
        </div>
      </div>
    </div>
  );
};

export const EndGame: React.FC = () => {
  const { 
    players, 
    resetGame, 
    userRole, 
    currentQuiz, 
    googleSheetUrl, 
    setGoogleSheetUrl, 
    exportScoreboardToSheet 
  } = useGame();

  const [sheetUrlInput, setSheetUrlInput] = useState(googleSheetUrl);
  const [exportState, setExportState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrlInput.trim()) {
      setErrorMessage('Please enter a Web App URL.');
      setExportState('error');
      return;
    }
    if (!sheetUrlInput.startsWith('https://script.google.com/')) {
      setErrorMessage('Must be a valid Google Apps Script Web App URL (starts with https://script.google.com/)');
      setExportState('error');
      return;
    }

    setExportState('loading');
    setErrorMessage('');
    
    // Save URL for future sessions
    setGoogleSheetUrl(sheetUrlInput.trim());

    const success = await exportScoreboardToSheet(
      sheetUrlInput.trim(),
      currentQuiz?.title || 'Untitled Quiz',
      players
    );

    if (success) {
      setExportState('success');
    } else {
      setErrorMessage('Failed to export. Check your Apps Script deployment and make sure it allows "Anyone" to access it.');
      setExportState('error');
    }
  };

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
      <div className="flex flex-col md:flex-row justify-center items-end gap-10 md:gap-4 mb-16 px-4 max-w-2xl mx-auto pt-16">
        
        {/* 2nd Place (Left) */}
        {secondPlace ? (
          <div className="w-full md:w-1/3 flex flex-col items-center animate-slide-up delay-100 order-2 md:order-1">
            <span className="text-xs font-bold text-slate-400 uppercase mb-2">2nd Place</span>
            
            {/* 3D Character */}
            <div className="mb-3 hover:scale-110 transition-transform duration-300">
              <DancingCharacter place="2nd" />
            </div>

            <div className="text-sm font-bold text-white text-center truncate max-w-[150px] mb-1">
              {secondPlace.nickname}
            </div>
            <div className="text-xs font-semibold text-slate-500 mb-4">
              {secondPlace.score} pts
            </div>
            
            {/* Podium step block */}
            <div className="w-full h-24 podium-2nd rounded-t-2xl flex flex-col items-center justify-center shadow-lg shadow-black/30">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">2nd</span>
              <span className="text-sm font-extrabold text-slate-300">Silver</span>
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

            {/* 3D Character */}
            <div className="mb-3 hover:scale-110 transition-transform duration-300">
              <DancingCharacter place="1st" />
            </div>

            <div className="text-xl font-black text-yellow-400 text-center truncate max-w-[180px] mb-1">
              {firstPlace.nickname}
            </div>
            <div className="text-sm font-bold text-yellow-500/80 mb-4">
              {firstPlace.score} pts
            </div>
            
            {/* Podium step block */}
            <div className="w-full h-32 podium-1st rounded-t-2xl flex flex-col items-center justify-center relative shadow-xl shadow-yellow-500/5">
              <span className="text-xs font-bold text-yellow-600/85 uppercase tracking-wider">1st</span>
              <span className="text-base font-black text-yellow-400">Gold</span>
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
            
            {/* 3D Character */}
            <div className="mb-3 hover:scale-110 transition-transform duration-300">
              <DancingCharacter place="3rd" />
            </div>

            <div className="text-sm font-bold text-white text-center truncate max-w-[150px] mb-1">
              {thirdPlace.nickname}
            </div>
            <div className="text-xs font-semibold text-slate-500 mb-4">
              {thirdPlace.score} pts
            </div>
            
            {/* Podium step block */}
            <div className="w-full h-16 podium-3rd rounded-t-2xl flex flex-col items-center justify-center shadow-lg shadow-black/30">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">3rd</span>
              <span className="text-sm font-extrabold text-amber-500">Bronze</span>
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

      {/* Google Sheets Export Card (Only for Host) */}
      {userRole === 'host' && (
        <div className="max-w-xl mx-auto glass-card p-6 border-slate-800 mb-12 animate-fade-in delay-200">
          <div className="flex items-center gap-3 border-b border-slate-900/60 pb-4 mb-4">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Export Scoreboard to Google Sheet
              </h3>
              <p className="text-[11px] text-slate-500">
                Log this tournament's rankings and final scores directly to your spreadsheet.
              </p>
            </div>
          </div>

          <form onSubmit={handleExport} className="space-y-4">
            {exportState === 'success' && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
                <Check className="text-emerald-400 shrink-0" size={16} />
                <span>Scoreboard successfully exported to Google Sheets!</span>
              </div>
            )}

            {exportState === 'error' && (
              <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-center gap-2 text-red-300 text-xs">
                <AlertCircle className="text-red-400 shrink-0" size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Paste Apps Script Web App URL"
                value={sheetUrlInput}
                onChange={(e) => {
                  setSheetUrlInput(e.target.value);
                  if (exportState === 'error' || exportState === 'success') {
                    setExportState('idle');
                  }
                }}
                disabled={exportState === 'loading'}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-quizPurple focus:ring-1 focus:ring-quizPurple rounded-xl text-white outline-none text-xs transition-all placeholder:text-slate-700"
              />
              <button
                type="submit"
                disabled={exportState === 'loading'}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-850 disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:scale-[1.01] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                {exportState === 'loading' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={14} />
                    Export Now
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Instructions Panel Toggle */}
          <div className="mt-4 border-t border-slate-950/60 pt-3">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center justify-between w-full text-slate-500 hover:text-slate-400 text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Setup Instructions (1-Minute Guide)</span>
              {showInstructions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showInstructions && (
              <div className="mt-3 text-slate-400 text-xs leading-relaxed space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-900 animate-slide-up">
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
      sheet.appendRow(["Timestamp", "Quiz Title", "Rank", "Player Nickname", "Score", "Is Bot?"]);
    }
    var timestamp = new Date();
    data.scoreboard.forEach(function(player) {
      sheet.appendRow([timestamp, data.quizTitle, player.rank, player.nickname, player.score, player.isBot ? "Yes" : "No"]);
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
