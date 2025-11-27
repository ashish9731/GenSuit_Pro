import React from 'react';
import { Sparkles, BarChart2, MessageSquare, GraduationCap, ArrowRight, LayoutGrid, Sun, Moon } from 'lucide-react';

interface HomeProps {
  onStart: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Home: React.FC<HomeProps> = ({ onStart, isDarkMode, toggleTheme }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-white overflow-y-auto transition-colors duration-300 flex flex-col">
      {/* Fixed Header */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
                    <LayoutGrid className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">GenSuite <span className="text-indigo-600 dark:text-indigo-400">Pro</span></span>
            </div>
            <button 
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                {isDarkMode ? <Moon size={20} className="text-white"/> : <Sun size={20} className="text-slate-900"/>}
            </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 pt-16">
        {/* Hero Section */}
        <div className="relative isolate pt-14 lg:pt-20 overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 dark:opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
            </div>
            
            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20 lg:py-32 text-center">
                <div className="flex justify-center mb-6 animate-fade-in-up">
                    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-600/20 dark:ring-indigo-400/20 bg-indigo-50/50 dark:bg-indigo-900/20 backdrop-blur-sm">
                    <Sparkles size={16} />
                    <span>Powered by Enterprise AI</span>
                    </span>
                </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 animate-gradient-x pb-2">
                Supercharge Your Workflow with AI
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                GenSuite Pro is the ultimate productivity suite. Draft smart emails, analyze complex data, chat with your documents, and master the art of prompting—all in one place.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
                <button
                onClick={onStart}
                className="rounded-full bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-xl hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all transform hover:scale-105 flex items-center gap-2"
                >
                Launch Workspace <ArrowRight size={20} />
                </button>
            </div>
            </div>

            {/* Feature Grid */}
            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <FeatureCard 
                icon={<Sparkles className="w-6 h-6 text-white" />}
                color="bg-purple-500"
                title="Smart Email Drafter"
                desc="Dictate or type instructions. AI writes, refines, and formats professional emails instantly."
                />
                <FeatureCard 
                icon={<BarChart2 className="w-6 h-6 text-white" />}
                color="bg-blue-500"
                title="Data Analytics"
                desc="Upload raw data. Get instant KPIs, charts, and deep personnel analysis summaries."
                />
                <FeatureCard 
                icon={<MessageSquare className="w-6 h-6 text-white" />}
                color="bg-green-500"
                title="Document Chat"
                desc="Upload documents and ask questions. AI answers strictly from your provided context."
                />
                <FeatureCard 
                icon={<GraduationCap className="w-6 h-6 text-white" />}
                color="bg-orange-500"
                title="Prompt Academy"
                desc="Go from beginner to expert. a 10-module interactive course with certification."
                />
            </div>
            </div>

            {/* Bottom decorative gradient */}
            <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
            <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 dark:opacity-10 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, color, title, desc }: { icon: React.ReactNode, color: string, title: string, desc: string }) => (
  <div className="relative group bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">{desc}</p>
  </div>
);