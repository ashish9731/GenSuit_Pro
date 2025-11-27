import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Home } from './views/Home';
import { EmailDrafter } from './views/EmailDrafter';
import { AnalyticsDashboard } from './views/AnalyticsDashboard';
import { DocChat } from './views/DocChat';
import { LearningHub } from './views/LearningHub';
import { Auth } from './views/Auth';
import { AppView, User } from './types';
import { auth, onAuthStateChanged, signOut, FirebaseUser } from './services/firebase';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [uploadedDataContext, setUploadedDataContext] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || undefined
        });
        // If user is on Home or Auth page, redirect to App
        if (currentView === AppView.AUTH) {
            setCurrentView(AppView.EMAIL_DRAFTER);
        }
      } else {
        setUser(null);
        // If user logs out, redirect to Home
        if (currentView !== AppView.HOME && currentView !== AppView.AUTH) {
            setCurrentView(AppView.HOME);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentView]);

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

  const handleLogout = async () => {
    try {
        await signOut(auth);
        setCurrentView(AppView.HOME);
    } catch (error) {
        console.error("Logout failed", error);
    }
  };

  const handleLaunch = () => {
    if (user) {
      setCurrentView(AppView.EMAIL_DRAFTER);
    } else {
      setCurrentView(AppView.AUTH);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.HOME:
        return <Home 
            onStart={handleLaunch} 
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
        />;
      case AppView.AUTH:
        return <Auth />;
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
  const isAuth = currentView === AppView.AUTH;
  const showSidebar = !isHome && !isAuth;

  if (loading && !isHome) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar handles both Desktop (Side) and Mobile (Bottom) rendering. Hidden on Home and Auth. */}
      {showSidebar && (
        <Sidebar 
          currentView={currentView} 
          onChangeView={setCurrentView} 
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          user={user}
          onLogout={handleLogout}
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