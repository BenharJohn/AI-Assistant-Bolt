import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings as SettingsIcon, Wind, CloudRain, Coffee, Leaf } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

// Define types for our sound players for better state management
type SoundPlayer = 'noise' | 'rain' | 'coffee' | 'nature' | null;

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
  
  const { reducedMotion } = useSettings();
  
  // Refs for the timer interval and Tone.js players
  const timerRef = useRef<number | null>(null);
  const noisePlayer = useRef<any>(null);
  const rainPlayer = useRef<any>(null);
  const coffeePlayer = useRef<any>(null);
  const naturePlayer = useRef<any>(null);

  // --- Core Timer Logic ---
  useEffect(() => {
    if (timerActive) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            
            if (soundOn) {
              // Play a simple alarm sound with Tone.js when timer ends
              const alarm = new (window as any).Tone.Synth().toDestination();
              alarm.triggerAttackRelease("C5", "8n");
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, sessionType, breakLength, focusLength, soundOn]);
  
  // --- Ambient Sound Logic using Tone.js ---
  const stopAllSounds = () => {
    if (noisePlayer.current) noisePlayer.current.stop();
    if (rainPlayer.current) rainPlayer.current.stop();
    if (coffeePlayer.current) coffeePlayer.current.stop();
    if (naturePlayer.current) naturePlayer.current.stop();
    setActiveSound(null);
  }
  
  const toggleSoundPlayer = (sound: SoundPlayer) => {
    if (activeSound === sound) {
      stopAllSounds();
      return;
    }

    stopAllSounds();
    setActiveSound(sound);
    
    // Ensure Tone.js context is running
    (window as any).Tone.start();

    switch (sound) {
      case 'noise':
        noisePlayer.current = new (window as any).Tone.Noise("white").toDestination().start();
        noisePlayer.current.volume.value = -20; // Lower volume for noise
        break;
      case 'rain':
        rainPlayer.current = new (window as any).Tone.Noise("pink").toDestination().start();
        const filter = new (window as any).Tone.AutoFilter("4n").toDestination().start();
        rainPlayer.current.connect(filter);
        rainPlayer.current.volume.value = -15;
        break;
      case 'coffee':
         coffeePlayer.current = new (window as any).Tone.Noise("brown").toDestination().start();
         const coffeeFilter = new (window as any).Tone.AutoFilter({frequency: "8n", baseFrequency: 400, octaves: 2}).toDestination().start();
         coffeePlayer.current.connect(coffeeFilter);
         coffeePlayer.current.volume.value = -12;
        break;
       case 'nature':
         naturePlayer.current = new (window as any).Tone.Noise("pink").toDestination().start();
         const lfo = new (window as any).Tone.LFO("2n", 400, 1000).start();
         const natureFilter = new (window as any).Tone.AutoFilter().toDestination().start();
         lfo.connect(natureFilter.frequency);
         naturePlayer.current.connect(natureFilter);
         naturePlayer.current.volume.value = -20;
        break;
      default:
        break;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setTimerActive(!timerActive);

  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(focusLength * 60);
    setSessionType('focus');
  };

  const applySettings = () => {
    if(!timerActive) {
      setTimeLeft(focusLength * 60);
      setSessionType('focus');
    }
    setShowSettings(false);
  };

  const calculateProgress = (): number => {
    const totalTime = sessionType === 'focus' ? focusLength * 60 : breakLength * 60;
    if (totalTime === 0) return 0;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };
  
  const getSessionColor = () => sessionType === 'focus' ? 'stroke-primary' : 'stroke-secondary';
  const getSessionBgColor = () => sessionType === 'focus' ? 'bg-primary/10' : 'bg-secondary/10';

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl text-foreground">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-foreground mb-6 text-center"
      >
        Focus Mode
      </motion.h1>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Focus Timer */}
        <div className="lg:col-span-2 bg-card rounded-2xl shadow-warm p-8 border border-appBorder">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-card-foreground">
              {sessionType === 'focus' ? 'Focus Session' : 'Break Time'}
            </h2>
            <div className="flex space-x-2">
              <button onClick={() => setSoundOn(!soundOn)} className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors">
                {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors">
                <SettingsIcon size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="relative w-64 h-64 mb-8">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" className="stroke-muted/30" strokeWidth="10" />
                <motion.circle
                  cx="50" cy="50" r="45" fill="none"
                  className={getSessionColor()}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray="282.7"
                  transform="rotate(-90 50 50)"
                  initial={{ strokeDashoffset: 282.7 }}
                  animate={{ strokeDashoffset: 282.7 - (282.7 * calculateProgress()) / 100 }}
                  transition={{ duration: reducedMotion ? 0 : 0.5 }}
                />
                <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="text-5xl font-bold fill-foreground">
                  {formatTime(timeLeft)}
                </text>
              </svg>
            </div>
            
            <div className="flex space-x-4">
              <button onClick={toggleTimer} className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl text-primary-foreground shadow-lg transition-all duration-200 ${timerActive ? 'bg-secondary hover:bg-secondary-hover' : 'bg-primary hover:bg-primary-hover'}`}>
                {timerActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
              </button>
              <button onClick={resetTimer} className="w-20 h-20 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground shadow-lg transition-all">
                <RotateCcw size={28} />
              </button>
            </div>
            <p className="text-muted-foreground mt-8">Sessions completed: <span className="font-bold text-foreground">{sessionsCompleted}</span></p>
          </div>
        </div>
        
        {/* Ambient Sounds & Techniques */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl shadow-warm p-6 border border-appBorder">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Ambient Sounds</h2>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { id: 'noise', label: 'White Noise', icon: Wind },
                  { id: 'rain', label: 'Rain', icon: CloudRain },
                  { id: 'coffee', label: 'Coffee Shop', icon: Coffee },
                  { id: 'nature', label: 'Nature', icon: Leaf },
                ] as const
              ).map(({id, label, icon: Icon}) => (
                <button 
                  key={id} 
                  onClick={() => toggleSoundPlayer(id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-colors text-sm font-medium h-20 ${activeSound === id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
                  <Icon className="w-6 h-6 mb-1" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-2xl shadow-warm p-6 border border-appBorder">
             <h2 className="text-lg font-semibold text-card-foreground mb-4">Focus Techniques</h2>
             <div className={`p-4 rounded-lg ${getSessionColor().replace('stroke', 'bg')}/10`}>
                <h3 className={`font-medium mb-2 ${getSessionColor().replace('stroke', 'text')}`}>{sessionType === 'focus' ? "The Pomodoro Technique" : "Mindful Break"}</h3>
                <p className="text-sm text-muted-foreground">
                    {sessionType === 'focus' 
                        ? "Work in focused 25-minute intervals. Eliminate distractions and concentrate on a single task." 
                        : "Step away from your work. Stretch, get some water, or simply close your eyes and breathe."}
                </p>
             </div>
          </div>
        </div>
      </div>
      
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 border border-appBorder"
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-card-foreground">Timer Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
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
                <button onClick={applySettings} className="btn-primary">
                  Apply Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FocusMode;
