import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  fontScale: number;
  setFontScale: (scale: number) => void;
  lineSpacing: number;
  setLineSpacing: (spacing: number) => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
  readingGuide: boolean;
  toggleReadingGuide: () => void;
  notificationStyle: 'visual' | 'audio' | 'both';
  setNotificationStyle: (style: 'visual' | 'audio' | 'both') => void;
  focusSounds: boolean;
  toggleFocusSounds: () => void;
}

const defaultSettings: Omit<SettingsContextType, 'toggleDarkMode' | 'setFontScale' | 'setLineSpacing' | 'toggleHighContrast' | 'toggleReducedMotion' | 'toggleReadingGuide' | 'setNotificationStyle' | 'toggleFocusSounds'> = {
  darkMode: false,
  fontScale: 1,
  lineSpacing: 1.5,
  highContrast: false,
  reducedMotion: false,
  readingGuide: false,
  notificationStyle: 'visual',
  focusSounds: false,
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load settings from localStorage or use defaults
  const [settings, setSettings] = useState<typeof defaultSettings>(() => {
    const savedSettings = localStorage.getItem('focusAssistSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('focusAssistSettings', JSON.stringify(settings));
    
    // Apply dark mode to document
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply reduced motion preference
    if (settings.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
    
  }, [settings]);

  const toggleDarkMode = () => {
    setSettings((prev: typeof defaultSettings) => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const setFontScale = (scale: number) => {
    setSettings((prev: typeof defaultSettings) => ({ ...prev, fontScale: scale }));
  };

  const setLineSpacing = (spacing: number) => {
    setSettings((prev: typeof defaultSettings) => ({ ...prev, lineSpacing: spacing }));
  };

  const toggleHighContrast = () => {
    setSettings((prev: typeof defaultSettings) => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const toggleReducedMotion = () => {
    setSettings((prev: typeof defaultSettings) => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  const toggleReadingGuide = () => {
    setSettings((prev: typeof defaultSettings) => ({ ...prev, readingGuide: !prev.readingGuide }));
  };

  const setNotificationStyle = (style: 'visual' | 'audio' | 'both') => {
    setSettings((prev: typeof defaultSettings) => ({ ...prev, notificationStyle: style }));
  };

  const toggleFocusSounds = () => {
    setSettings((prev: typeof defaultSettings) => ({ ...prev, focusSounds: !prev.focusSounds }));
  };

  const value = {
    ...settings,
    toggleDarkMode,
    setFontScale,
    setLineSpacing,
    toggleHighContrast,
    toggleReducedMotion,
    toggleReadingGuide,
    setNotificationStyle,
    toggleFocusSounds,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};