import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

// --- TYPES ---
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // 0-3 index
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
  lastAnsweredCorrectly: boolean | null;
  lastScoreEarned: number;
  lastQuestionAnswered: number | null;
  isBot?: boolean;
  active: boolean;
}

export type GameState = 'idle' | 'create_quiz' | 'lobby' | 'playing' | 'leaderboard' | 'gameover';
export type UserRole = 'host' | 'player' | null;

interface GameContextType {
  userRole: UserRole;
  roomCode: string | null;
  nickname: string | null;
  playerId: string | null;
  players: Player[];
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  gameState: GameState;
  currentQuestionIndex: number;
  timer: number;
  answersCount: number;
  hasAnswered: boolean;
  score: number;
  feedback: { correct: boolean; points: number; correctAnswerIndex: number } | null;
  createLobby: (quizId: string) => void;
  joinLobby: (roomCode: string, name: string) => boolean;
  addBotPlayer: () => void;
  removePlayer: (id: string) => void;
  startGame: () => void;
  submitAnswer: (optionIndex: number) => void;
  nextQuestion: () => void;
  showLeaderboard: () => void;
  endGame: () => void;
  resetGame: () => void;
  saveQuiz: (quiz: Quiz) => void;
  setUserRole: (role: UserRole) => void;
  setGameState: (state: GameState) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// --- PRE-LOADED QUIZZES ---
const DEFAULT_QUIZZES: Quiz[] = [
  {
    id: 'web-dev-101',
    title: '🚀 Web Development Challenge',
    questions: [
      {
        id: 'q1',
        text: 'Which HTML5 element is used to display a self-contained graphic, photo, or code snippet?',
        options: ['<figure>', '<section>', '<aside>', '<picture>'],
        correctAnswer: 0,
      },
      {
        id: 'q2',
        text: 'Which Hook allows you to perform side effects in React function components?',
        options: ['useState', 'useContext', 'useEffect', 'useReducer'],
        correctAnswer: 2,
      },
      {
        id: 'q3',
        text: 'What CSS property creates a space between the border of an element and its content?',
        options: ['margin', 'padding', 'border-spacing', 'gap'],
        correctAnswer: 1,
      },
      {
        id: 'q4',
        text: 'Which Tailwind class is used to make a grid layout with 3 columns?',
        options: ['grid-cols-3', 'grid-layout-3', 'cols-3', 'grid-cols-span-3'],
        correctAnswer: 0,
      },
      {
        id: 'q5',
        text: 'What is the correct way to write an arrow function in JavaScript?',
        options: [
          'function => {}',
          '() => {}',
          'const func = {} =>',
          'arrow function() {}'
        ],
        correctAnswer: 1,
      }
    ],
  },
  {
    id: 'space-science',
    title: '🌌 Space & Cosmos Quest',
    questions: [
      {
        id: 's1',
        text: 'Which planet is known as the Red Planet?',
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correctAnswer: 1,
      },
      {
        id: 's2',
        text: 'What is the approximate speed of light?',
        options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '1,000,000 km/s'],
        correctAnswer: 0,
      },
      {
        id: 's3',
        text: 'Which is the largest galaxy in our Local Group?',
        options: ['Milky Way', 'Triangulum Galaxy', 'Andromeda Galaxy', 'Large Magellanic Cloud'],
        correctAnswer: 2,
      },
      {
        id: 's4',
        text: 'What telescope was launched in December 2021 to succeed Hubble?',
        options: ['James Webb Space Telescope', 'Kepler Space Telescope', 'Chandra Observatory', 'Spitzer Space Telescope'],
        correctAnswer: 0,
      }
    ],
  }
];

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Game states
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>(DEFAULT_QUIZZES);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [timer, setTimer] = useState<number>(30);
  const [answersCount, setAnswersCount] = useState<number>(0);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<GameContextType['feedback']>(null);

  // References to keep state available in event handlers and timers
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const stateRef = useRef({ 
    gameState, 
    players, 
    currentQuestionIndex, 
    currentQuiz, 
    timer, 
    hasAnswered, 
    roomCode, 
    userRole, 
    playerId,
    nickname
  });

  // Sync ref values
  useEffect(() => {
    stateRef.current = { 
      gameState, 
      players, 
      currentQuestionIndex, 
      currentQuiz, 
      timer, 
      hasAnswered, 
      roomCode, 
      userRole, 
      playerId,
      nickname
    };
  }, [gameState, players, currentQuestionIndex, currentQuiz, timer, hasAnswered, roomCode, userRole, playerId, nickname]);

  // Helper to send messages over BroadcastChannel AND WebSocket
  const sendMessage = (type: string, payload: any) => {
    // 1. Send to local BroadcastChannel
    broadcastChannelRef.current?.postMessage({ type, payload });

    // 2. Send to WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type,
        roomCode: stateRef.current.roomCode || roomCode,
        senderId: stateRef.current.playerId || playerId,
        payload
      }));
    }
  };

  // Helper to handle incoming messages from either channel
  const handleIncomingMessage = (type: string, payload: any) => {
    switch (type) {
      case 'PLAYER_JOIN':
        if (stateRef.current.gameState === 'lobby') {
          handleHostPlayerJoin(payload);
        }
        break;

      case 'SUBMIT_ANSWER':
        if (stateRef.current.gameState === 'playing') {
          handleHostAnswerSubmission(payload);
        }
        break;

      case 'GAME_STARTED':
        if (stateRef.current.gameState === 'lobby' && payload.roomCode === stateRef.current.roomCode) {
          setGameState('playing');
          setCurrentQuestionIndex(0);
          setTimer(30);
          setHasAnswered(false);
          setFeedback(null);
        }
        break;

      case 'NEXT_QUESTION':
        if (payload.roomCode === stateRef.current.roomCode) {
          setGameState('playing');
          setCurrentQuestionIndex(payload.questionIndex);
          setTimer(30);
          setHasAnswered(false);
          setFeedback(null);
        }
        break;

      case 'SHOW_LEADERBOARD':
        if (payload.roomCode === stateRef.current.roomCode) {
          setPlayers(payload.players);
          const me = payload.players.find((p: Player) => p.id === stateRef.current.playerId);
          if (me) {
            setScore(me.score);
          }
          setGameState('leaderboard');
        }
        break;

      case 'GAME_OVER':
        if (payload.roomCode === stateRef.current.roomCode) {
          setPlayers(payload.players);
          const me = payload.players.find((p: Player) => p.id === stateRef.current.playerId);
          if (me) {
            setScore(me.score);
          }
          setGameState('gameover');
        }
        break;

      case 'HOST_HEARTBEAT':
        if (stateRef.current.userRole === 'player' && payload.roomCode === stateRef.current.roomCode) {
          setPlayers(payload.players);
          if (!stateRef.current.currentQuiz && payload.currentQuiz) {
            setCurrentQuiz(payload.currentQuiz);
          }
        }
        break;

      default:
        break;
    }
  };

  // Connect to the WebSocket room
  const connectWebSocket = (code: string, role: UserRole, pid?: string, name?: string) => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        console.error(e);
      }
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected for room', code, 'as', role);
      socket.send(JSON.stringify({
        type: 'REGISTER',
        roomCode: code,
        role: role,
        playerId: pid || playerId || stateRef.current.playerId
      }));

      // If player, also send PLAYER_JOIN message immediately on connect
      if (role === 'player' && (pid || playerId || stateRef.current.playerId)) {
        socket.send(JSON.stringify({
          type: 'PLAYER_JOIN',
          roomCode: code,
          senderId: pid || playerId || stateRef.current.playerId,
          payload: { 
            id: pid || playerId || stateRef.current.playerId, 
            nickname: name || nickname || stateRef.current.nickname, 
            roomCode: code 
          }
        }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload, senderId } = data;
        
        // Skip messages sent by ourselves if echoed by server
        if (senderId === (pid || playerId || stateRef.current.playerId)) return;

        handleIncomingMessage(type, payload);
      } catch (err) {
        console.error('Error parsing WebSocket message', err);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(() => {
        if (stateRef.current.roomCode === code) {
          connectWebSocket(code, role, pid, name);
        }
      }, 3000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  // Load custom quizzes from localStorage on start
  useEffect(() => {
    const saved = localStorage.getItem('quizizz_custom_quizzes');
    if (saved) {
      try {
        const customList: Quiz[] = JSON.parse(saved);
        setQuizzes([...DEFAULT_QUIZZES, ...customList]);
      } catch (e) {
        console.error('Error loading custom quizzes', e);
      }
    }
  }, []);

  // Set up Broadcast Channel for real-time synchronization between tabs
  useEffect(() => {
    const channel = new BroadcastChannel('quizizz_channel');
    broadcastChannelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      handleIncomingMessage(type, payload);
    };

    return () => {
      channel.close();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomCode, userRole, playerId, currentQuiz]);

  // Host state update broadcast periodic sync
  useEffect(() => {
    if (userRole === 'host' && gameState === 'lobby') {
      const syncInterval = setInterval(() => {
        sendMessage('HOST_HEARTBEAT', {
          roomCode,
          players: stateRef.current.players,
          currentQuiz: stateRef.current.currentQuiz
        });
      }, 1000);
      return () => clearInterval(syncInterval);
    }
  }, [userRole, gameState, roomCode]);

  // --- HOST HANDLERS ---
  const handleHostPlayerJoin = (playerInfo: { id: string; nickname: string; roomCode: string }) => {
    if (playerInfo.roomCode !== stateRef.current.roomCode && playerInfo.roomCode !== roomCode) return;

    setPlayers((prev) => {
      // Check if player already exists
      if (prev.some((p) => p.id === playerInfo.id)) {
        return prev;
      }
      const newPlayer: Player = {
        id: playerInfo.id,
        nickname: playerInfo.nickname,
        score: 0,
        lastAnsweredCorrectly: null,
        lastScoreEarned: 0,
        lastQuestionAnswered: null,
        active: true,
      };
      
      const nextPlayers = [...prev, newPlayer];

      // Broadcast list updates immediately
      sendMessage('HOST_HEARTBEAT', {
        roomCode: stateRef.current.roomCode || roomCode,
        players: nextPlayers,
        currentQuiz: stateRef.current.currentQuiz || currentQuiz
      });

      return nextPlayers;
    });
  };

  const handleHostAnswerSubmission = (answerInfo: {
    playerId: string;
    optionIndex: number;
    timeElapsed: number;
    roomCode: string;
  }) => {
    if (answerInfo.roomCode !== stateRef.current.roomCode && answerInfo.roomCode !== roomCode) return;

    setPlayers((prev) => {
      const updated = prev.map((player) => {
        if (player.id === answerInfo.playerId) {
          const currentQuestion = (stateRef.current.currentQuiz || currentQuiz)?.questions[stateRef.current.currentQuestionIndex];
          if (!currentQuestion) return player;

          const correct = answerInfo.optionIndex === currentQuestion.correctAnswer;
          // Points Formula: 1000 base points, deduct 20 points per second elapsed
          // Minimum 300 points for correct answer to keep it rewarding
          const timeSec = Math.min(Math.max(answerInfo.timeElapsed, 0), 30);
          const scoreEarned = correct ? Math.max(1000 - Math.round(timeSec * 20), 300) : 0;

          return {
            ...player,
            score: player.score + scoreEarned,
            lastAnsweredCorrectly: correct,
            lastScoreEarned: scoreEarned,
            lastQuestionAnswered: stateRef.current.currentQuestionIndex
          };
        }
        return player;
      });

      // Recalculate answered counts
      const answeredCount = updated.filter(p => p.lastQuestionAnswered === stateRef.current.currentQuestionIndex).length;
      setAnswersCount(answeredCount);

      // Check if all players (humans + bots) have answered
      if (answeredCount >= updated.length && updated.length > 0) {
        // Automatically stop host timer and transition
        stopCountdown();
      }

      return updated;
    });
  };

  // --- TIMER MANAGEMENT (Host Side) ---
  const startCountdown = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setTimer(30);

    // Trigger AI Bot submissions
    simulateBotAnswers();

    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          // Timer finished: automatically transition round
          setTimeout(() => {
            showLeaderboard();
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
  };

  const stopCountdown = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // --- BOT SIMULATION ---
  const simulateBotAnswers = () => {
    const currentBots = stateRef.current.players.filter(p => p.isBot);
    const qIndex = stateRef.current.currentQuestionIndex;
    const currentQ = stateRef.current.currentQuiz?.questions[qIndex];
    if (!currentQ) return;

    currentBots.forEach((bot) => {
      // Choose random delay between 3 and 16 seconds
      const delay = Math.floor(Math.random() * 13) + 3;

      setTimeout(() => {
        // Double check state hasn't moved on (e.g. next question or game over)
        if (
          stateRef.current.gameState !== 'playing' ||
          stateRef.current.currentQuestionIndex !== qIndex
        ) {
          return;
        }

        // 75% chance of picking correct answer
        const isCorrect = Math.random() < 0.75;
        const answerIndex = isCorrect 
          ? currentQ.correctAnswer 
          : (currentQ.correctAnswer + Math.floor(Math.random() * 3) + 1) % 4;

        handleHostAnswerSubmission({
          playerId: bot.id,
          optionIndex: answerIndex,
          timeElapsed: delay,
          roomCode: stateRef.current.roomCode || roomCode || ''
        });

      }, delay * 1000);
    });
  };

  // --- ENGINE CONTROLS ---

  const saveQuiz = (quiz: Quiz) => {
    const list = quizzes.filter(q => q.id !== quiz.id);
    const updatedList = [...list, quiz];
    setQuizzes(updatedList);

    // Filter default quizzes out of local storage
    const customOnly = updatedList.filter(
      q => !DEFAULT_QUIZZES.some(dq => dq.id === q.id)
    );
    localStorage.setItem('quizizz_custom_quizzes', JSON.stringify(customOnly));
  };

  const createLobby = (quizId: string) => {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return;

    // Generate random 4 digit room PIN code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomCode(code);
    setCurrentQuiz(quiz);
    setUserRole('host');
    setPlayers([]);
    setGameState('lobby');
    setAnswersCount(0);
    setCurrentQuestionIndex(0);

    // Set stateRef immediately so that connectWebSocket knows them
    stateRef.current.roomCode = code;
    stateRef.current.userRole = 'host';

    // Connect WebSocket
    connectWebSocket(code, 'host');
  };

  const joinLobby = (joinPin: string, name: string): boolean => {
    // Generate unique playerId
    const pid = 'p_' + Math.random().toString(36).substring(2, 9);
    setPlayerId(pid);
    setNickname(name);
    setRoomCode(joinPin);
    setUserRole('player');
    setScore(0);
    setFeedback(null);
    setHasAnswered(false);

    // Set stateRef immediately so that connectWebSocket knows them
    stateRef.current.playerId = pid;
    stateRef.current.nickname = name;
    stateRef.current.roomCode = joinPin;
    stateRef.current.userRole = 'player';

    // Connect WebSocket
    connectWebSocket(joinPin, 'player', pid, name);

    setGameState('lobby');
    return true;
  };

  const addBotPlayer = () => {
    if (userRole !== 'host') return;

    const botNames = [
      '⚡ SonicCoder', '🤖 ByteBot', '🦊 PixelFox', 
      '🚀 Sparky', '🧠 QuantumMind', '🎨 CSSWizard', 
      '🍿 Popcorn', '🎯 SwiftTypist', '🦁 LeoDev', '💻 StackGuy'
    ];
    // Filter out names already in game
    const unusedNames = botNames.filter(
      name => !players.some(p => p.nickname === name)
    );
    if (unusedNames.length === 0) return;

    const randomName = unusedNames[Math.floor(Math.random() * unusedNames.length)];
    const bid = 'bot_' + Math.random().toString(36).substring(2, 9);

    setPlayers((prev) => {
      const newBot: Player = {
        id: bid,
        nickname: randomName,
        score: 0,
        lastAnsweredCorrectly: null,
        lastScoreEarned: 0,
        lastQuestionAnswered: null,
        isBot: true,
        active: true,
      };
      
      const nextPlayers = [...prev, newBot];

      sendMessage('HOST_HEARTBEAT', {
        roomCode: stateRef.current.roomCode || roomCode,
        players: nextPlayers,
        currentQuiz: stateRef.current.currentQuiz || currentQuiz
      });

      return nextPlayers;
    });
  };

  const removePlayer = (id: string) => {
    setPlayers((prev) => {
      const nextPlayers = prev.filter((p) => p.id !== id);
      sendMessage('HOST_HEARTBEAT', {
        roomCode: stateRef.current.roomCode || roomCode,
        players: nextPlayers,
        currentQuiz: stateRef.current.currentQuiz || currentQuiz
      });
      return nextPlayers;
    });
  };

  const startGame = () => {
    if (userRole !== 'host' || !currentQuiz) return;

    // Reset player scores and answered states
    setPlayers((prev) => {
      const reset = prev.map((p) => ({
        ...p,
        score: 0,
        lastAnsweredCorrectly: null,
        lastScoreEarned: 0,
        lastQuestionAnswered: null
      }));

      // Broadcast starting game
      sendMessage('GAME_STARTED', {
        roomCode: stateRef.current.roomCode || roomCode,
        currentQuiz: stateRef.current.currentQuiz || currentQuiz
      });

      return reset;
    });

    setGameState('playing');
    setCurrentQuestionIndex(0);
    setAnswersCount(0);
    startCountdown();
  };

  const submitAnswer = (optionIndex: number) => {
    if (userRole !== 'player' || !currentQuiz || hasAnswered) return;

    setHasAnswered(true);
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const correct = optionIndex === currentQuestion.correctAnswer;
    
    // Time spent calculating (max timer starts at 30 seconds down to 0)
    const timeElapsed = 30 - timer; 
    const pointsEarned = correct ? Math.max(1000 - Math.round(timeElapsed * 20), 300) : 0;

    // Set feedback state locally
    setFeedback({
      correct,
      points: pointsEarned,
      correctAnswerIndex: currentQuestion.correctAnswer,
    });

    // Update local score
    if (correct) {
      setScore((prev) => prev + pointsEarned);
    }

    // Send answer to Host
    sendMessage('SUBMIT_ANSWER', {
      playerId: stateRef.current.playerId || playerId,
      optionIndex,
      timeElapsed,
      roomCode: stateRef.current.roomCode || roomCode,
    });

    // Play visual feedback pop
    if (correct) {
      confetti({
        particleCount: 40,
        spread: 40,
        colors: ['#22c55e', '#3b82f6', '#8b5cf6'],
        origin: { y: 0.8 }
      });
    }
  };

  const nextQuestion = () => {
    if (userRole !== 'host' || !currentQuiz) return;

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < currentQuiz.questions.length) {
      // Clear answers count and proceed
      setAnswersCount(0);
      setCurrentQuestionIndex(nextIndex);
      
      // Reset players status for the new question
      setPlayers((prev) => 
        prev.map(p => ({
          ...p,
          lastAnsweredCorrectly: null,
          lastScoreEarned: 0
        }))
      );

      sendMessage('NEXT_QUESTION', {
        roomCode: stateRef.current.roomCode || roomCode,
        questionIndex: nextIndex
      });

      setGameState('playing');
      startCountdown();
    } else {
      endGame();
    }
  };

  const showLeaderboard = () => {
    if (userRole !== 'host') return;

    stopCountdown();

    // Broadcast current scores
    sendMessage('SHOW_LEADERBOARD', {
      roomCode: stateRef.current.roomCode || roomCode,
      players: stateRef.current.players || players
    });

    setGameState('leaderboard');
  };

  const endGame = () => {
    if (userRole !== 'host') return;

    stopCountdown();

    // Broadcast game over
    sendMessage('GAME_OVER', {
      roomCode: stateRef.current.roomCode || roomCode,
      players: stateRef.current.players || players
    });

    setGameState('gameover');

    // Trigger big podium confetti
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 }
      });
    }, 500);
  };

  const resetGame = () => {
    stopCountdown();
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }
    setUserRole(null);
    setRoomCode(null);
    setNickname(null);
    setPlayerId(null);
    setPlayers([]);
    setCurrentQuiz(null);
    setGameState('idle');
    setCurrentQuestionIndex(0);
    setTimer(30);
    setAnswersCount(0);
    setHasAnswered(false);
    setScore(0);
    setFeedback(null);
  };

  return (
    <GameContext.Provider
      value={{
        userRole,
        roomCode,
        nickname,
        playerId,
        players,
        quizzes,
        currentQuiz,
        gameState,
        currentQuestionIndex,
        timer,
        answersCount,
        hasAnswered,
        score,
        feedback,
        createLobby,
        joinLobby,
        addBotPlayer,
        removePlayer,
        startGame,
        submitAnswer,
        nextQuestion,
        showLeaderboard,
        endGame,
        resetGame,
        saveQuiz,
        setUserRole,
        setGameState,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
