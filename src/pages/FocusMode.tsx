import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings as SettingsIcon, Wind, CloudRain, Coffee, Leaf, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

type SoundPlayer = 'noise' | 'rain' | 'coffee' | 'nature' | null;

const FocusMode: React.FC = () => {
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [sessionType, setSessionType] = useState<'focus' | 'break'>('focus');
  const [focusLength, setFocusLength] = useState(25);
  const [breakLength, setBreakLength] = useState(5);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [activeSound, setActiveSound] = useState<SoundPlayer>(null);
  
  const { reducedMotion } = useSettings();
  
  const timerRef = useRef<number | null>(null);
  const alarmPlayer = useRef<any>(null);
  const soundPlayers = useRef<any>({});
  
  // --- NEW: Refs and state for the Mindful Trace game ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const particles = useRef<any[]>([]);

  // --- Core Timer Logic ---
  useEffect(() => {
    if (timerActive) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            if (soundOn && typeof window !== 'undefined' && (window as any).Tone) {
              alarmPlayer.current = new (window as any).Tone.Synth().toDestination();
              alarmPlayer.current.triggerAttackRelease("C5", "8n");
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

  // --- Ambient Sound Logic ---
  const stopAllSounds = () => {
    Object.values(soundPlayers.current).forEach((player: any) => player?.stop().dispose());
    soundPlayers.current = {};
    setActiveSound(null);
  };

  const toggleSoundPlayer = (sound: SoundPlayer) => {
    if (typeof window === 'undefined' || !(window as any).Tone) return;
    if (activeSound === sound) { stopAllSounds(); return; }
    stopAllSounds();
    setActiveSound(sound);
    (window as any).Tone.start();

    let player;
    switch (sound) {
      case 'noise':
        player = new (window as any).Tone.Noise("white").toDestination();
        player.volume.value = -24;
        break;
      case 'rain':
        player = new (window as any).Tone.Noise("pink").toDestination();
        const rainFilter = new (window as any).Tone.AutoFilter("2n").toDestination().start();
        player.connect(rainFilter);
        player.volume.value = -20;
        break;
      case 'coffee':
        player = new (window as any).Tone.Noise("brown").toDestination();
        const coffeeFilter = new (window as any).Tone.AutoFilter({ frequency: "8n", baseFrequency: 400, octaves: 2 }).toDestination().start();
        player.connect(coffeeFilter);
        player.volume.value = -22;
        break;
      case 'nature':
        player = new (window as any).Tone.Noise("pink").toDestination();
        const lfo = new (window as any).Tone.LFO("4n", 600, 1200).start();
        const natureFilter = new (window as any).Tone.AutoFilter().toDestination().start();
        lfo.connect(natureFilter.frequency);
        player.connect(natureFilter);
        player.volume.value = -25;
        break;
    }
    if (player) {
      player.start();
      soundPlayers.current[sound!] = player;
    }
  };

  // --- Mindful Trace Game Logic ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Resize canvas to fit container
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    canvas.addEventListener('mousemove', (e) => {
      mouse.x = e.offsetX;
      mouse.y = e.offsetY;
    });

    class Particle {
      x: number; y: number; size: number; speedX: number; speedY: number; color: string;
      constructor(x: number, y: number, color: string) {
        this.x = x; this.y = y;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        this.color = color;
      }
      update() { this.x += this.speedX; this.y += this.speedY; if (this.size > 0.2) this.size -= 0.1; }
      draw() { ctx!.fillStyle = this.color; ctx!.beginPath(); ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx!.fill(); }
    }

    const animate = () => {
      ctx!.fillStyle = 'rgba(253, 243, 231, 0.1)'; // Fading effect
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      const particleColor = sessionType === 'focus' ? 'hsl(13, 58%, 66%)' : 'hsl(26, 83%, 77%)';
      particles.current.push(new Particle(mouse.x, mouse.y, particleColor));
      if (particles.current.length > 100) particles.current.shift();
      
      for (let i = 0; i < particles.current.length; i++) {
        particles.current[i].update();
        particles.current[i].draw();
        if (particles.current[i].size <= 0.3) {
          particles.current.splice(i, 1); i--;
        }
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [sessionType]); // Re-initialize if sessionType changes color

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
                <text x="50" y="52" textAnchor="middle" dominantBaseline="middle" className="fill-foreground" style={{ fontSize: '28px', fontWeight: 'bold' }}>
                  {formatTime(timeLeft)}
                </text>
                <text x="50" y="68" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {sessionType}
                </text>
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
          
          {/* New "Mindful Trace" Game */}
          <div className="bg-card rounded-2xl shadow-warm p-6 border border-appBorder">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Mindful Trace</h2>
            <p className="text-sm text-muted-foreground mb-4">A gentle activity for your break. Move your mouse to create calming patterns.</p>
            <canvas ref={canvasRef} className="w-full h-48 rounded-lg bg-background" />
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
