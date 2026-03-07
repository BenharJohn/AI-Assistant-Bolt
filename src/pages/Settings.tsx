import React, { useState } from 'react';
import { Eye, Type, Bell, Volume2, Check, Cpu, Zap, Globe, Shield, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import { useOfflineLLM } from '../hooks/useOfflineLLM';

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

  const offlineLLM = useOfflineLLM();

  // Sample text for preview
  const [previewText, setPreviewText] = useState(
    "The quick brown fox jumps over the lazy dog. This is a sample text to demonstrate how your settings affect text display and readability throughout the application."
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const ToggleSwitch = ({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
        isOn ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span className="sr-only">Toggle setting</span>
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
          isOn ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const SliderInput = ({ 
    label, 
    value, 
    min, 
    max, 
    step, 
    unit = '', 
    onChange, 
    leftLabel, 
    rightLabel 
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    onChange: (value: number) => void;
    leftLabel?: string;
    rightLabel?: string;
  }) => (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-card-foreground">{label}</h3>
        <span className="text-sm text-muted-foreground">
          {Math.round(value * (unit === '%' ? 100 : 1))}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, hsl(13, 58%, 66%) 0%, hsl(13, 58%, 66%) ${((value - min) / (max - min)) * 100}%, hsl(33, 50%, 96%) ${((value - min) / (max - min)) * 100}%, hsl(33, 50%, 96%) 100%)`
        }}
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );

  const NotificationButton = ({ 
    style, 
    isSelected, 
    onClick, 
    icon: Icon, 
    label 
  }: {
    style: 'visual' | 'audio' | 'both';
    isSelected: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
  }) => (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl text-sm flex flex-col items-center space-y-2 transition-all duration-200 ${
        isSelected
          ? 'bg-primary/10 text-primary border-2 border-primary/30'
          : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border-2 border-transparent'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
      {isSelected && (
        <Check size={16} className="text-primary" />
      )}
    </button>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Customize your FocusAssist experience for optimal productivity and comfort.</p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appearance Section */}
            <motion.section variants={itemVariants} className="bg-card rounded-2xl shadow-soft hover:shadow-warm transition-shadow duration-300 p-6 border border-appBorder">
              <h2 className="text-xl font-semibold text-card-foreground mb-6 flex items-center">
                <Eye className="mr-3 text-primary" size={24} />
                Appearance & Visual
              </h2>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-card-foreground">Dark Mode</h3>
                    <p className="text-sm text-muted-foreground">Switch to a darker color scheme for low light environments</p>
                  </div>
                  <ToggleSwitch isOn={darkMode} onToggle={toggleDarkMode} />
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-card-foreground">High Contrast</h3>
                    <p className="text-sm text-muted-foreground">Increase contrast between text and background for better readability</p>
                  </div>
                  <ToggleSwitch isOn={highContrast} onToggle={toggleHighContrast} />
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-card-foreground">Reduced Motion</h3>
                    <p className="text-sm text-muted-foreground">Minimize animations and transitions throughout the app</p>
                  </div>
                  <ToggleSwitch isOn={reducedMotion} onToggle={toggleReducedMotion} />
                </div>
              </div>
            </motion.section>
            
            {/* Text & Reading Section */}
            <motion.section variants={itemVariants} className="bg-card rounded-2xl shadow-soft hover:shadow-warm transition-shadow duration-300 p-6 border border-appBorder">
              <h2 className="text-xl font-semibold text-card-foreground mb-6 flex items-center">
                <Type className="mr-3 text-secondary" size={24} />
                Text & Reading
              </h2>
              
              <div className="space-y-6">
                <SliderInput
                  label="Font Size"
                  value={fontScale}
                  min={0.8}
                  max={1.6}
                  step={0.05}
                  unit="%"
                  onChange={setFontScale}
                  leftLabel="Smaller"
                  rightLabel="Larger"
                />
                
                <SliderInput
                  label="Line Spacing"
                  value={lineSpacing}
                  min={1.0}
                  max={2.5}
                  step={0.1}
                  unit="x"
                  onChange={setLineSpacing}
                  leftLabel="Compact"
                  rightLabel="Spacious"
                />
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-card-foreground">Reading Guide</h3>
                    <p className="text-sm text-muted-foreground">Highlight the current line being read for better focus</p>
                  </div>
                  <ToggleSwitch isOn={readingGuide} onToggle={toggleReadingGuide} />
                </div>
              </div>
            </motion.section>
            
            {/* Audio & Notifications Section */}
            <motion.section variants={itemVariants} className="bg-card rounded-2xl shadow-soft hover:shadow-warm transition-shadow duration-300 p-6 border border-appBorder">
              <h2 className="text-xl font-semibold text-card-foreground mb-6 flex items-center">
                <Bell className="mr-3 text-accent" size={24} />
                Audio & Notifications
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-card-foreground mb-4">Notification Style</h3>
                  <p className="text-sm text-muted-foreground mb-4">Choose how you want to receive notifications from the app</p>
                  <div className="grid grid-cols-3 gap-3">
                    <NotificationButton
                      style="visual"
                      isSelected={notificationStyle === 'visual'}
                      onClick={() => setNotificationStyle('visual')}
                      icon={Eye}
                      label="Visual Only"
                    />
                    <NotificationButton
                      style="audio"
                      isSelected={notificationStyle === 'audio'}
                      onClick={() => setNotificationStyle('audio')}
                      icon={Volume2}
                      label="Audio Only"
                    />
                    <NotificationButton
                      style="both"
                      isSelected={notificationStyle === 'both'}
                      onClick={() => setNotificationStyle('both')}
                      icon={Bell}
                      label="Both"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-card-foreground">Focus Session Sounds</h3>
                    <p className="text-sm text-muted-foreground">Play ambient sounds during focus sessions to help concentration</p>
                  </div>
                  <ToggleSwitch isOn={focusSounds} onToggle={toggleFocusSounds} />
                </div>
              </div>
            </motion.section>
          </div>
          
          {/* Preview Panel */}
          <div className="space-y-6">
            <motion.section variants={itemVariants} className="bg-card rounded-2xl shadow-soft hover:shadow-warm transition-shadow duration-300 p-6 border border-appBorder">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Live Preview</h2>
              <p className="text-sm text-muted-foreground mb-4">See how your text settings affect readability in real-time</p>
              
              <div 
                className={`p-4 bg-background rounded-xl border border-appBorder transition-all duration-200 ${
                  highContrast ? 'border-foreground' : ''
                }`}
                style={{ 
                  fontSize: `${fontScale}rem`, 
                  lineHeight: lineSpacing 
                }}
              >
                <h3 className={`font-semibold mb-2 ${highContrast ? 'text-foreground' : 'text-foreground'}`}>
                  Sample Heading
                </h3>
                <p className={`${highContrast ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {previewText}
                </p>
              </div>
              
              <div className="mt-4">
                <label htmlFor="preview-text" className="block text-sm font-medium text-card-foreground mb-2">
                  Customize Preview Text
                </label>
                <textarea
                  id="preview-text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  rows={4}
                  className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none"
                  placeholder="Enter your own text to see how it looks with your settings..."
                />
              </div>
            </motion.section>
            
            <motion.section variants={itemVariants} className="bg-card rounded-2xl shadow-soft hover:shadow-warm transition-shadow duration-300 p-6 border border-appBorder">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">About Your Settings</h2>
              
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <p className="text-card-foreground">
                    <strong>Automatic Saving:</strong> All your preferences are automatically saved and will be remembered the next time you visit.
                  </p>
                </div>
                
                <div className="p-3 bg-secondary/5 rounded-xl border border-secondary/20">
                  <p className="text-card-foreground">
                    <strong>Accessibility:</strong> These settings are designed to make FocusAssist more accessible and comfortable for users with ADHD, dyslexia, and other learning differences.
                  </p>
                </div>
                
                <div className="p-3 bg-accent/5 rounded-xl border border-accent/20">
                  <p className="text-card-foreground">
                    <strong>Privacy:</strong> All settings are stored locally in your browser. No personal preferences are sent to external servers.
                  </p>
                </div>
              </div>
            </motion.section>
          </div>
        </div>

        {/* Tech Stack Showcase */}
        <motion.section variants={itemVariants} className="mt-8 bg-card rounded-2xl shadow-soft hover:shadow-warm transition-shadow duration-300 p-6 border border-appBorder">
          <h2 className="text-xl font-semibold text-card-foreground mb-2 flex items-center">
            <Zap className="mr-3 text-primary" size={24} />
            Powered By
          </h2>
          <p className="text-sm text-muted-foreground mb-6">The technology behind Aeva's intelligent features</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-background rounded-xl border border-appBorder">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={18} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">On-Device LLM</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Llama 3.2 {offlineLLM.modelSize || '1B/3B'} running entirely in your browser via WebLLM (WebGPU). Auto-selects 3B on powerful devices
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${offlineLLM.status === 'ready' ? 'bg-green-400' : offlineLLM.status === 'loading' ? 'bg-yellow-400 animate-pulse' : 'bg-muted-foreground'}`} />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  {offlineLLM.status === 'ready' ? 'Active' : offlineLLM.status === 'loading' ? 'Loading' : 'Standby'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-background rounded-xl border border-appBorder">
              <div className="flex items-center gap-2 mb-2">
                <Cpu size={18} className="text-secondary" />
                <h3 className="text-sm font-semibold text-foreground">WebGPU Inference</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                GPU-accelerated neural network inference using WebGPU with TVM compiler optimization
              </p>
              <div className="mt-2">
                <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-medium">
                  WebGPU Accelerated
                </span>
              </div>
            </div>

            <div className="p-4 bg-background rounded-xl border border-appBorder">
              <div className="flex items-center gap-2 mb-2">
                <Globe size={18} className="text-accent" />
                <h3 className="text-sm font-semibold text-foreground">Gemini API</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cloud AI via Google Gemini 1.5 Flash for learning tools, flashcards, and rich explanations
              </p>
              <div className="mt-2">
                <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">Online Primary</span>
              </div>
            </div>

            <div className="p-4 bg-background rounded-xl border border-appBorder">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={18} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Privacy First</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All data stored locally in localStorage. Offline AI runs on-device — your conversations never leave your browser
              </p>
              <div className="mt-2">
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">100% Client-Side</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Web Workers', 'WebGPU', 'WebLLM', 'Llama 3.2', 'Gemini API'].map(tech => (
              <span key={tech} className="text-[10px] bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                {tech}
              </span>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default Settings;