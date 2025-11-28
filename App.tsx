
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Home } from './views/Home';
import { EmailDrafter } from './views/EmailDrafter';
import { AnalyticsDashboard } from './views/AnalyticsDashboard';
import { DocChat } from './views/DocChat';
import { LearningHub } from './views/LearningHub';
import { AppView } from './types';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [uploadedDataContext, setUploadedDataContext] = useState<string>('');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLaunch = () => {
    setCurrentView(AppView.EMAIL_DRAFTER);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.HOME:
        return <Home 
            onStart={handleLaunch} 
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
        />;
      case AppView.EMAIL_DRAFTER:
        return <EmailDrafter />;
      case AppView.ANALYTICS:
        return <AnalyticsDashboard onDataLoaded={setUploadedDataContext} isDarkMode={isDarkMode} />;
      case AppView.DOC_CHAT:
        return <DocChat documentContext={uploadedDataContext} />;
      case AppView.LEARNING:
        return <LearningHub />;
      default:
        return <Home 
            onStart={handleLaunch} 
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
        />;
    }
  };

  const isHome = currentView === AppView.HOME;
  const showSidebar = !isHome;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar handles both Desktop (Side) and Mobile (Bottom) rendering. Hidden on Home. */}
      {showSidebar && (
        <Sidebar 
          currentView={currentView} 
          onChangeView={setCurrentView} 
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      )}
      
      <main className="flex-1 overflow-hidden relative flex flex-col h-full w-full">
        {/* Background Pattern - only show inside app */}
        {showSidebar && <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none"></div>}
        
        {/* View Container */}
        {/* Mobile: pt-16 for top header, pb-20 for bottom nav. Desktop: no padding needed here as layout handles it. */}
        <div className={`flex-1 overflow-y-auto w-full ${showSidebar ? 'pt-16 pb-20 md:pt-0 md:pb-0' : ''}`}>
          {renderView()}
        </div>
      </main>
    </div>
  );
}

export default App;
