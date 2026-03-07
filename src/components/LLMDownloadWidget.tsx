import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Brain, X, Download, Zap } from 'lucide-react';
import foxIcon from '../assets/fox.png';
import { useOfflineLLM } from '../hooks/useOfflineLLM';

const CONSENT_KEY = 'aeva_llm_consent';

const LLMDownloadWidget: React.FC = () => {
  const { status, progress, error, modelSize, load } = useOfflineLLM();
  const [dismissed, setDismissed] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  const isReady = status === 'ready';

  // On mount, check if user already consented — if so, auto-load
  useEffect(() => {
    const consented = localStorage.getItem(CONSENT_KEY);
    if (consented === 'true' && status === 'idle') {
      load();
    } else if (!consented && status === 'idle') {
      const timer = setTimeout(() => setShowConsent(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss 5s after ready, 8s after error
  useEffect(() => {
    if ((isReady || status === 'error') && !dismissed) {
      const delay = status === 'error' ? 8000 : 5000;
      const timer = setTimeout(() => setDismissed(true), delay);
      return () => clearTimeout(timer);
    }
  }, [isReady, status, dismissed]);

  const handleConsent = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setShowConsent(false);
    load();
  };

  const handleDecline = () => {
    setShowConsent(false);
    setDismissed(true);
  };

  // ── Consent prompt ──
  if (showConsent && status === 'idle') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-40 max-w-[320px]"
        >
          <div className="bg-card border border-appBorder rounded-2xl shadow-warm p-4">
            <button
              onClick={handleDecline}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1"
            >
              <X size={14} />
            </button>

            <div className="flex items-start gap-3">
              <img src={foxIcon} alt="Aeva" className="w-10 h-10 object-contain flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Enable Offline AI?</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  I'll download a Llama 3.2 model so I work even without internet. Uses WebGPU for fast, private, on-device inference. The best model for your device will be selected automatically.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Zap size={10} /> WebGPU powered</span>
              <span>·</span>
              <span>Llama 3.2 (1B/3B)</span>
              <span>·</span>
              <span>One-time download</span>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleDecline}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-xl border border-appBorder hover:bg-muted transition-colors"
              >
                Not now
              </button>
              <button
                onClick={handleConsent}
                className="flex-1 px-3 py-1.5 text-xs font-medium btn-primary flex items-center justify-center gap-1.5"
              >
                <Download size={12} />
                Download
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Don't show if idle, dismissed, or generating
  if (status === 'idle' || status === 'generating' || dismissed) return null;

  // ── Loading / Ready / Error states ──
  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 80 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-40"
        >
          <div className="relative flex items-center gap-3 bg-card border border-appBorder rounded-2xl shadow-lg px-4 py-3 min-w-[200px]">
            {/* Close button */}
            {(isReady || status === 'error') && (
              <button
                onClick={() => setDismissed(true)}
                className="absolute -top-2 -right-2 bg-muted rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            )}

            {/* Fox avatar with progress ring */}
            <div className="relative flex-shrink-0">
              <motion.div
                animate={status === 'loading' ? {
                  rotate: [0, 5, -5, 0],
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <img src={foxIcon} alt="Aeva" className="w-10 h-10 object-contain" />
              </motion.div>

              {/* Circular progress ring */}
              {status === 'loading' && (
                <svg className="absolute -inset-1 w-12 h-12" viewBox="0 0 48 48">
                  <circle
                    cx="24" cy="24" r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted/30"
                  />
                  <circle
                    cx="24" cy="24" r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="text-primary"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                    transform="rotate(-90 24 24)"
                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                  />
                </svg>
              )}

              {/* Ready checkmark */}
              {isReady && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5"
                >
                  <Check size={10} className="text-primary-foreground" />
                </motion.div>
              )}

              {/* Error indicator */}
              {status === 'error' && (
                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                  <X size={10} className="text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              {status === 'loading' && (
                <>
                  <p className="text-xs font-medium text-foreground truncate">
                    Downloading Llama 3.2{modelSize ? ` ${modelSize}` : ''}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{progress}%</span>
                  </div>
                </>
              )}
              {isReady && (
                <div className="flex items-center gap-1.5">
                  <Brain size={12} className="text-primary" />
                  <p className="text-xs font-medium text-primary">
                    Llama 3.2 {modelSize} ready (WebGPU)
                  </p>
                </div>
              )}
              {status === 'error' && (
                <p className="text-xs font-medium text-primary">
                  {error || 'Download failed'}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LLMDownloadWidget;
