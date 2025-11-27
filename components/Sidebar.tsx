import React from 'react';
import { Mail, BarChart2, MessageSquare, GraduationCap, LayoutGrid, Sun, Moon, Home, LogOut, User as UserIcon } from 'lucide-react';
import { AppView, User } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  user?: User | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isDarkMode, toggleTheme, user, onLogout }) => {
  const navItems = [
    { id: AppView.EMAIL_DRAFTER, label: 'Email', icon: Mail },
    { id: AppView.ANALYTICS, label: 'Analytics', icon: BarChart2 },
    { id: AppView.DOC_CHAT, label: 'Chat', icon: MessageSquare },
    { id: AppView.LEARNING, label: 'Learn', icon: GraduationCap },
  ];

  // Mobile nav includes Home as the first item
  const mobileNavItems = [
    { id: AppView.HOME, label: 'Home', icon: Home },
    ...navItems
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between px-4 transition-colors duration-300">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
                <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">GenSuite Pro</span>
         </div>
         <div className="flex items-center gap-2">
             <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
             >
                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
             </button>
             {user && (
                 <button onClick={onLogout} className="p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                     <LogOut size={20} />
                 </button>
             )}
         </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-72 bg-white dark:bg-slate-900 h-full border-r border-slate-200 dark:border-slate-800 flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-30 transition-colors duration-300">
        
        {/* Fixed Header */}
        <div className="p-8 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
            <LayoutGrid className="w-6 h-6 text-white" />
          </div>
          <div>
             <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none">GenSuite</h1>
             <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">Pro Edition</span>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Workspace</div>
            <nav className="space-y-1 pb-4">
            <button
                onClick={() => onChangeView(AppView.HOME)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                    currentView === AppView.HOME
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                >
                {currentView === AppView.HOME && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full"></div>
                )}
                <Home
                    className={`w-5 h-5 transition-colors ${
                    currentView === AppView.HOME ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                />
                Home
            </button>
            {navItems.map((item) => (
                <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                    currentView === item.id
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                >
                {currentView === item.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full"></div>
                )}
                <item.icon
                    className={`w-5 h-5 transition-colors ${
                    currentView === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                />
                {item.label}
                </button>
            ))}
            </nav>
        </div>

        {/* Fixed Footer with User Profile */}
        <div className="p-4 space-y-4 flex-shrink-0 border-t border-slate-100 dark:border-slate-800">
            {user && (
                <div className="flex items-center gap-3 px-2 mb-2">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt={user.name} className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button 
                        onClick={onLogout}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1" 
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            )}

            {/* Theme Toggle */}
            <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
                <span className="text-sm font-medium flex items-center gap-2">
                    {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                </span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${isDarkMode ? 'left-6' : 'left-1'}`}></div>
                </div>
            </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors duration-300">
        <nav className="flex justify-around items-center h-16 px-2">
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${
                currentView === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {currentView === item.id && (
                  <span className="absolute -top-[1px] w-8 h-1 bg-indigo-600 rounded-b-lg"></span>
              )}
              <item.icon
                className={`w-6 h-6 transition-transform ${
                  currentView === item.id ? '-translate-y-0.5' : ''
                }`}
                strokeWidth={currentView === item.id ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
};