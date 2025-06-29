import React, { useState } from 'react';
import { Eye, Type, Volume2, Check } from 'lucide-react';
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
    reducedMotion,
    toggleReducedMotion
  } = useSettings();

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

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Customize your Aeva experience for optimal productivity and comfort.</p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appearance Section */}
            <motion.section variants={itemVariants} className="bg-card rounded-2xl shadow-warm p-6 border border-appBorder">
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
                    <h3 className="font-medium text-card-foreground">Reduced Motion</h3>
                    <p className="text-sm text-muted-foreground">Minimize animations and transitions throughout the app</p>
                  </div>
                  <ToggleSwitch isOn={reducedMotion} onToggle={toggleReducedMotion} />
                </div>
              </div>
            </motion.section>
            
            {/* Text & Reading Section */}
            <motion.section variants={itemVariants} className="bg-card rounded-2xl shadow-warm p-6 border border-appBorder">
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
              </div>
            </motion.section>
          </div>
          
          {/* Preview Panel */}
          <div className="space-y-6">
            <motion.section variants={itemVariants} className="bg-card rounded-2xl shadow-warm p-6 border border-appBorder">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Live Preview</h2>
              <p className="text-sm text-muted-foreground mb-4">See how your text settings affect readability in real-time</p>
              
              <div 
                className="p-4 bg-background rounded-xl border border-appBorder transition-all duration-200"
                style={{ 
                  fontSize: `${fontScale}rem`, 
                  lineHeight: lineSpacing 
                }}
              >
                <h3 className="font-semibold mb-2 text-foreground">
                  Sample Heading
                </h3>
                <p className="text-muted-foreground">
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
            
            <motion.section variants={itemVariants} className="bg-card rounded-2xl shadow-warm p-6 border border-appBorder">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">About Your Settings</h2>
              
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <p className="text-card-foreground">
                    <strong>Automatic Saving:</strong> All your preferences are automatically saved and will be remembered the next time you visit.
                  </p>
                </div>
                
                <div className="p-3 bg-secondary/5 rounded-xl border border-secondary/20">
                  <p className="text-card-foreground">
                    <strong>Accessibility:</strong> These settings are designed to make Aeva more accessible and comfortable for users with ADHD, dyslexia, and other learning differences.
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
      </motion.div>
    </div>
  );
};

export default Settings;