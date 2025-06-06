import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings as SettingsIcon } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const FocusMode: React.FC = () => {
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [sessionType, setSessionType] = useState<'focus' | 'break'>('focus');
  const [focusLength, setFocusLength] = useState(25);
  const [breakLength, setBreakLength] = useState(5);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const { reducedMotion } = useSettings();
  
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.5;
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (timerActive) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            
            // Play sound when timer ends
            if (soundOn && audioRef.current) {
              audioRef.current.play();
            }
            
            // Switch session type
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
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, sessionType, breakLength, focusLength, soundOn]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(sessionType === 'focus' ? focusLength * 60 : breakLength * 60);
  };

  const toggleSound = () => {
    setSoundOn(!soundOn);
  };

  const applySettings = () => {
    setTimeLeft(sessionType === 'focus' ? focusLength * 60 : breakLength * 60);
    setShowSettings(false);
  };

  const calculateProgress = (): number => {
    const totalTime = sessionType === 'focus' ? focusLength * 60 : breakLength * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Focus Mode</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Focus Timer */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {sessionType === 'focus' ? 'Focus Session' : 'Break Time'}
            </h2>
            <div className="flex space-x-2">
              <button 
                onClick={toggleSound}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-gray-500 dark:text-gray-400"
              >
                {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-gray-500 dark:text-gray-400"
              >
                <SettingsIcon size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="relative w-64 h-64 mb-6">
              {/* Progress circle */}
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={sessionType === 'focus' ? '#e0e7ff' : '#fef3c7'}
                  strokeWidth="8"
                  className="dark:opacity-20"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={sessionType === 'focus' ? '#6366f1' : '#f59e0b'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 - (282.7 * calculateProgress()) / 100}
                  transform="rotate(-90 50 50)"
                  initial={{ strokeDashoffset: 282.7 }}
                  animate={{ strokeDashoffset: 282.7 - (282.7 * calculateProgress()) / 100 }}
                  transition={{ duration: reducedMotion ? 0 : 0.5 }}
                />
                
                {/* Timer text */}
                <text
                  x="50"
                  y="50"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-3xl font-bold fill-gray-900 dark:fill-white"
                  style={{ fontSize: '16px' }}
                >
                  {formatTime(timeLeft)}
                </text>
                <text
                  x="50"
                  y="62"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-gray-500 dark:fill-gray-400"
                  style={{ fontSize: '8px' }}
                >
                  {sessionType === 'focus' ? 'FOCUS TIME' : 'BREAK TIME'}
                </text>
              </svg>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={toggleTimer}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  timerActive
                    ? 'bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-600 dark:text-red-300'
                    : 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-600 dark:text-green-300'
                }`}
              >
                {timerActive ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button
                onClick={resetTimer}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors duration-200"
              >
                <RotateCcw size={20} />
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Sessions completed today: <span className="font-medium">{sessionsCompleted}</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Focus Techniques */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Focus Techniques</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <h3 className="font-medium text-indigo-700 dark:text-indigo-300 mb-2">Pomodoro Technique</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Work for 25 minutes, then take a 5-minute break. After 4 cycles, take a longer 15-30 minute break.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <h3 className="font-medium text-purple-700 dark:text-purple-300 mb-2">2-Minute Rule</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                If a task takes less than 2 minutes, do it immediately instead of scheduling it for later.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Time Blocking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Schedule specific blocks of time for different tasks to maintain focus and reduce context switching.
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Ambient Sounds</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
                White Noise
              </button>
              <button className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
                Rain Sounds
              </button>
              <button className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
                Coffee Shop
              </button>
              <button className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
                Nature Sounds
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Timer Settings</h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <RotateCcw size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Focus Session Length (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={focusLength}
                    onChange={(e) => setFocusLength(Math.max(1, Math.min(60, parseInt(e.target.value || '25'))))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Break Length (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={breakLength}
                    onChange={(e) => setBreakLength(Math.max(1, Math.min(30, parseInt(e.target.value || '5'))))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sound-toggle"
                    checked={soundOn}
                    onChange={toggleSound}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sound-toggle" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Play sound when timer ends
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={applySettings}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FocusMode;