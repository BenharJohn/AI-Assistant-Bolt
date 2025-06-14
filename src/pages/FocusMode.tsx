import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings as SettingsIcon, Wind, CloudRain, Coffee, Leaf, X, BrainCircuit } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

type SoundPlayer = 'noise' | 'rain' | 'coffee' | 'nature' | null;
type GameStatus = 'idle' | 'showing' | 'playing' | 'lost';

const soundSources = {
  noise: 'https://cdn.pixabay.com/download/audio/2022/10/10/audio_2ff6192d19.mp3', // White Noise
  rain: 'https://cdn.pixabay.com/download/audio/2022/08/04/audio_383f709a80.mp3', // Gentle Rain
  coffee: 'https://cdn.pixabay.com/download/audio/2022/07/16/audio_95015b6b8d.mp3', // Coffee Shop Ambience
  nature: 'https://cdn.pixabay.com/download/audio/2022/05/10/audio_5a83733363.mp3', // Forest Sounds
};

const FocusMode: React.FC = () => {
  // Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [sessionType, setSessionType] = useState<'focus' | 'break'>('focus');
  
  // Settings State
  const [focusLength, setFocusLength] = useState(25);
  const [breakLength, setBreakLength] = useState(5);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Sound State
  const [soundOn, setSoundOn] = useState(true);
  const [activeSound, setActiveSound] = useState<SoundPlayer>(null);
  
  // --- NEW: Pattern Recall Game State ---
  const [gameSequence, setGameSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [activeButton, setActiveButton] = useState<number | null>(null);

  const { reducedMotion } = useSettings();
  
  const timerRef = useRef<number | null>(null);
  const soundPlayers = useRef<{ [key: string]: HTMLAudioElement }>({});
  const alarmSoundRef = useRef<HTMLAudioElement | null>(null);




  // --- Initialize Audio Players ---
  useEffect(() => {
    // Pre-load audio elements for smoother playback
    Object.entries(soundSources).forEach(([key, src]) => {
      soundPlayers.current[key] = new Audio(src);
      soundPlayers.current[key].loop = true;
    });
    alarmSoundRef.current = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_921c33dc64.mp3'); // A simple chime sound

    // Cleanup function to pause sounds when the component unmounts
    return () => {
      Object.values(soundPlayers.current).forEach(player => player.pause());
    };
  }, []);

  // --- Core Timer Logic (with updated alarm sound) ---
  useEffect(() => {
    if (timerActive) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            if (soundOn && alarmSoundRef.current) {
              alarmSoundRef.current.play();
            }
            if (sessionType === 'focus') {
              setSessionsCompleted(prev => prev + 1);
              setSessionType('break');
              setTimeLeft(breakLength * 60);
            } else {
              setSessionType('focus');
              setTimeLeft(focusLength * 60);
            }
            setTimerActive(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive, sessionType, breakLength, focusLength, soundOn]);

  // --- NEW: Ambient Sound Logic using HTML Audio ---
  const stopAllSounds = () => {
    Object.values(soundPlayers.current).forEach(player => {
        player.pause();
        player.currentTime = 0; // Rewind the audio
    });
    setActiveSound(null);
  };

  const toggleSoundPlayer = (sound: SoundPlayer) => {
    if (activeSound === sound) {
      stopAllSounds();
      return;
    }

    stopAllSounds();
    
    if (sound) {
      const player = soundPlayers.current[sound];
      if (player) {
        player.play();
        setActiveSound(sound);
      }
    }
  };




  
  // --- Pattern Recall Game Logic ---
  const startGame = () => {
    setGameSequence([]);
    setPlayerSequence([]);
    setGameStatus('showing');
  };

  useEffect(() => {
    if (gameStatus === 'showing') {
      const nextSequence = [...gameSequence, Math.floor(Math.random() * 4)];
      setGameSequence(nextSequence);
      showSequence(nextSequence);
    }
  }, [gameStatus]);

  const showSequence = (sequence: number[]) => {
    let i = 0;
    const interval = setInterval(() => {
      setActiveButton(sequence[i]);
      setTimeout(() => setActiveButton(null), 300);
      i++;
      if (i >= sequence.length) {
        clearInterval(interval);
        setGameStatus('playing');
      }
    }, 600);
  };
  
  const handlePlayerInput = (buttonIndex: number) => {
    if (gameStatus !== 'playing') return;
    const newPlayerSequence = [...playerSequence, buttonIndex];
    setPlayerSequence(newPlayerSequence);

    if (newPlayerSequence[newPlayerSequence.length - 1] !== gameSequence[newPlayerSequence.length - 1]) {
      setGameStatus('lost');
      setTimeout(() => setGameStatus('idle'), 1500);
      return;
    }

    if (newPlayerSequence.length === gameSequence.length) {
      setPlayerSequence([]);
      setTimeout(() => setGameStatus('showing'), 1000);
    }
  };

  const formatTime = (seconds: number): string => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  const toggleTimer = () => setTimerActive(!timerActive);
  const resetTimer = () => { setTimerActive(false); setTimeLeft(focusLength * 60); setSessionType('focus'); };
  const applySettings = () => { if (!timerActive) { setTimeLeft(focusLength * 60); setSessionType('focus'); } setShowSettings(false); };
  const calculateProgress = (): number => { const totalTime = sessionType === 'focus' ? focusLength * 60 : breakLength * 60; if (totalTime === 0) return 0; return ((totalTime - timeLeft) / totalTime) * 100; };
  const getSessionColor = () => sessionType === 'focus' ? 'stroke-primary' : 'stroke-secondary';

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl text-foreground">
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-foreground mb-6 text-center">
        Focus Mode
      </motion.h1>
      
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card rounded-2xl shadow-warm p-8 border border-appBorder">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-card-foreground">{sessionType === 'focus' ? 'Focus Session' : 'Break Time'}</h2>
            <div className="flex space-x-2">
              <button onClick={() => setSoundOn(!soundOn)} className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors"><Volume2 size={20} /></button>
              <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors"><SettingsIcon size={20} /></button>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-64 h-64 mb-8">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" className="stroke-muted/30" strokeWidth="10" />
                <motion.circle cx="50" cy="50" r="45" fill="none" className={getSessionColor()} strokeWidth="10" strokeLinecap="round" strokeDasharray="282.7" transform="rotate(-90 50 50)" initial={{ strokeDashoffset: 282.7 }} animate={{ strokeDashoffset: 282.7 - (282.7 * calculateProgress()) / 100 }} transition={{ duration: reducedMotion ? 0 : 0.5 }} />
                <text x="50" y="52" textAnchor="middle" dominantBaseline="middle" className="fill-foreground" style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatTime(timeLeft)}</text>
                <text x="50" y="68" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{sessionType}</text>
              </svg>
            </div>
            <div className="flex space-x-4">
              <button onClick={toggleTimer} className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl text-primary-foreground shadow-lg transition-all duration-200 ${timerActive ? 'bg-secondary hover:bg-secondary-hover' : 'bg-primary hover:bg-primary-hover'}`}>{timerActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}</button>
              <button onClick={resetTimer} className="w-20 h-20 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground shadow-lg transition-all"><RotateCcw size={28} /></button>
            </div>
            <p className="text-muted-foreground mt-8">Sessions completed: <span className="font-bold text-foreground">{sessionsCompleted}</span></p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-card rounded-2xl shadow-warm p-6 border border-appBorder">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Ambient Sounds</h2>
            <div className="grid grid-cols-2 gap-3">
              {([ { id: 'noise', label: 'White Noise', icon: Wind }, { id: 'rain', label: 'Rain', icon: CloudRain }, { id: 'coffee', label: 'Coffee Shop', icon: Coffee }, { id: 'nature', label: 'Nature', icon: Leaf } ] as const).map(({id, label, icon: Icon}) => (
                <button key={id} onClick={() => toggleSoundPlayer(id)} className={`flex flex-col items-center justify-center p-3 rounded-xl transition-colors text-sm font-medium h-20 ${activeSound === id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'}`}><Icon className="w-6 h-6 mb-1" />{label}</button>
              ))}
            </div>
          </div>
          
          <div className="bg-card rounded-2xl shadow-warm p-6 border border-appBorder">
            <AnimatePresence mode="wait">
              <motion.div key={sessionType} initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                {sessionType === 'focus' ? (
                   <div>
                     <h2 className="text-lg font-semibold text-card-foreground mb-2">Focus Tip</h2>
                     <p className="text-sm text-muted-foreground">Stay on track. The Pomodoro Technique suggests focused 25-minute intervals. You can do this!</p>
                   </div>
                ) : (
                   <div>
                     <h2 className="text-lg font-semibold text-card-foreground mb-2">Pattern Recall</h2>
                     <p className="text-sm text-muted-foreground mb-4">It's break time! Sharpen your mind by repeating the sequence.</p>
                     <div className="grid grid-cols-2 gap-2 h-40">
                      {[0, 1, 2, 3].map(i => (
                        <button key={i} onClick={() => handlePlayerInput(i)} className={`w-full h-full rounded-lg transition-all duration-150 ${activeButton === i ? 'bg-secondary scale-105' : 'bg-muted hover:bg-muted/80'}`}/>
                      ))}
                     </div>
                     <div className="text-center mt-4 h-6">
                       {gameStatus === 'idle' && <button onClick={startGame} className="btn-secondary py-2 px-4 text-sm">Start Game</button>}
                       {gameStatus === 'showing' && <p className="text-sm text-muted-foreground animate-pulse">Watch carefully...</p>}
                       {gameStatus === 'playing' && <p className="text-sm text-muted-foreground">Your turn!</p>}
                       {gameStatus === 'lost' && <p className="text-sm text-red-500 font-bold">Try again!</p>}
                     </div>
                   </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
      
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
            <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 border border-appBorder" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-card-foreground">Timer Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Focus Length (minutes)</label>
                  <input type="number" min="1" max="60" value={focusLength} onChange={(e) => setFocusLength(Number(e.target.value))} className="w-full bg-background border border-appBorder rounded-xl p-2 text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Break Length (minutes)</label>
                  <input type="number" min="1" max="30" value={breakLength} onChange={(e) => setBreakLength(Number(e.target.value))} className="w-full bg-background border border-appBorder rounded-xl p-2 text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"/>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={applySettings} className="btn-primary">Apply Settings</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FocusMode;
