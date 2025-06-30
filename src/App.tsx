import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PageTransition from './components/PageTransition';
import Dashboard from './pages/Dashboard';
import TaskManager from './pages/TaskManager';
import FocusMode from './pages/FocusMode';
import Settings from './pages/Settings';
import LearningTools from './pages/LearningTools';
import Journal from './pages/Journal';
import AICompanion from './pages/AICompanion';
import { TaskProvider } from './context/TaskContext';
import { SettingsProvider } from './context/SettingsContext';
import { AIProvider } from './context/AIContext';
import SplashScreen from './components/SplashScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashAnimationComplete = () => {
    setShowSplash(false);
  };

  return (
    <SettingsProvider>
      <AIProvider>
        <TaskProvider>
          {showSplash ? (
            <SplashScreen onAnimationComplete={handleSplashAnimationComplete} />
          ) : (
            <Router>
              <Layout>
                <PageTransition>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tasks" element={<TaskManager />} />
                    <Route path="/focus" element={<FocusMode />} />
                    <Route path="/learning" element={<LearningTools />} />
                    <Route path="/journal" element={<Journal />} />
                    <Route path="/companion" element={<AICompanion />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </PageTransition>
              </Layout>
            </Router>
          )}
        </TaskProvider>
      </AIProvider>
    </SettingsProvider>
  );
}

export default App;