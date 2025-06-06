import React, { useState } from 'react';
import { Moon, Sun, Sliders, Eye, Text, Weight as LineHeight, Bell, Volume2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

const Settings: React.FC = () => {
  const { 
    darkMode, 
    toggleDarkMode,
    fontScale,
    setFontScale,
    lineSpacing,
    setLineSpacing,
    highContrast,
    toggleHighContrast,
    reducedMotion,
    toggleReducedMotion,
    readingGuide,
    toggleReadingGuide,
    notificationStyle,
    setNotificationStyle,
    focusSounds,
    toggleFocusSounds
  } = useSettings();

  // Sample text for preview
  const [previewText, setPreviewText] = useState(
    "The quick brown fox jumps over the lazy dog. This is a sample text to demonstrate how your settings affect text display."
  );
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appearance */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Eye className="mr-2" size={20} />
              Appearance
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Dark Mode</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reduce eye strain in low light environments</p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    darkMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span className="sr-only">Toggle Dark Mode</span>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">High Contrast</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Increase contrast for better readability</p>
                </div>
                <button
                  onClick={toggleHighContrast}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    highContrast ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span className="sr-only">Toggle High Contrast</span>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      highContrast ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Reduced Motion</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Minimize animations throughout the app</p>
                </div>
                <button
                  onClick={toggleReducedMotion}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    reducedMotion ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span className="sr-only">Toggle Reduced Motion</span>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      reducedMotion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>
          
          {/* Text Settings */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Text className="mr-2" size={20} />
              Text Settings
            </h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">Font Size</h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(fontScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.05"
                  value={fontScale}
                  onChange={(e) => setFontScale(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>A</span>
                  <span>A</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">Line Spacing</h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{lineSpacing}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.1"
                  value={lineSpacing}
                  onChange={(e) => setLineSpacing(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Compact</span>
                  <span>Spacious</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Reading Guide</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Highlight the line being read</p>
                </div>
                <button
                  onClick={toggleReadingGuide}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    readingGuide ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span className="sr-only">Toggle Reading Guide</span>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      readingGuide ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>
          
          {/* Notifications */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Bell className="mr-2" size={20} />
              Notifications
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Notification Style</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setNotificationStyle('visual')}
                    className={`p-3 rounded-lg text-sm flex flex-col items-center space-y-2 transition-colors duration-200 ${
                      notificationStyle === 'visual'
                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Eye size={20} />
                    <span>Visual</span>
                    {notificationStyle === 'visual' && (
                      <Check size={16} className="text-indigo-600 dark:text-indigo-400" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => setNotificationStyle('audio')}
                    className={`p-3 rounded-lg text-sm flex flex-col items-center space-y-2 transition-colors duration-200 ${
                      notificationStyle === 'audio'
                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Volume2 size={20} />
                    <span>Audio</span>
                    {notificationStyle === 'audio' && (
                      <Check size={16} className="text-indigo-600 dark:text-indigo-400" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => setNotificationStyle('both')}
                    className={`p-3 rounded-lg text-sm flex flex-col items-center space-y-2 transition-colors duration-200 ${
                      notificationStyle === 'both'
                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Sliders size={20} />
                    <span>Both</span>
                    {notificationStyle === 'both' && (
                      <Check size={16} className="text-indigo-600 dark:text-indigo-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Focus Sounds</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Play ambient sounds during focus sessions</p>
                </div>
                <button
                  onClick={toggleFocusSounds}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    focusSounds ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span className="sr-only">Toggle Focus Sounds</span>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      focusSounds ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>
        </div>
        
        {/* Preview Panel */}
        <div className="space-y-6">
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Text Preview</h2>
            
            <div 
              className={`p-4 bg-gray-50 dark:bg-gray-700 rounded-lg ${highContrast ? 'text-black dark:text-white' : ''}`}
              style={{ 
                fontSize: `${fontScale}rem`, 
                lineHeight: lineSpacing 
              }}
            >
              <p>{previewText}</p>
            </div>
            
            <div className="mt-4">
              <label htmlFor="preview-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Preview Text
              </label>
              <textarea
                id="preview-text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </section>
          
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data & Privacy</h2>
            
            <div className="space-y-4">
              <button className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 text-sm font-medium">
                Export Your Data
              </button>
              
              <button className="w-full py-2 px-4 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg transition-colors duration-200 text-sm font-medium">
                Delete All Data
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              <p>All your data is stored locally on your device. We don't collect or store any personal information.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;