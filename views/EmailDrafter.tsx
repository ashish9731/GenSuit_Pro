import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, Sparkles, Wand2, Copy, AlertTriangle, CheckCircle2, Loader2, X, Settings, Mail, ExternalLink } from 'lucide-react';
import { generateEmailDraft, enhanceUserPrompt } from '../services/geminiService';

export const EmailDrafter: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Speech Recognition Setup
  useEffect(() => {
    let recognition: any = null;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setPrompt(prev => prev + ' ' + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }

    if (isListening && recognition) {
      recognition.start();
    } else if (recognition) {
      recognition.stop();
    }

    return () => {
      if (recognition) recognition.stop();
    };
  }, [isListening]);

  const handleEnhancePrompt = async () => {
    if (!prompt) return;
    setIsLoading(true);
    try {
      const enhanced = await enhanceUserPrompt(prompt);
      setPrompt(enhanced);
    } catch (e) {
      console.error(e);
      alert("Failed to enhance prompt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    try {
      const draft = await generateEmailDraft(prompt, false);
      setGeneratedEmail(draft);
      
      // Attempt to extract subject if generated
      const lines = draft.split('\n');
      const subjectLine = lines.find(l => l.toLowerCase().startsWith('subject:'));
      if (subjectLine) {
        setSubject(subjectLine.replace(/^subject:\s*/i, ''));
        setGeneratedEmail(draft.replace(subjectLine, '').trim());
      } else if (!subject) {
        setSubject("Regarding your request");
      }

    } catch (e) {
      console.error(e);
      alert("Failed to generate draft");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendClick = () => {
    if (!recipient || !generatedEmail) {
        alert("Please enter a recipient and generate an email first.");
        return;
    }
    setShowConfirm(true);
  };

  const openInProvider = (provider: 'gmail' | 'outlook') => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(generatedEmail);
    const encodedRecipient = encodeURIComponent(recipient);
    
    let url = '';
    if (provider === 'gmail') {
      url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedRecipient}&su=${encodedSubject}&body=${encodedBody}`;
    } else {
      url = `https://outlook.office.com/mail/deeplink/compose?to=${encodedRecipient}&subject=${encodedSubject}&body=${encodedBody}`;
    }
    window.open(url, '_blank');
    setShowConfirm(false);
  };

  return (
    <div className="flex flex-col min-h-full max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 animate-fade-in relative z-0">
      <header className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Smart Email Drafter</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-lg">Dictate or type your request, and let AI craft the perfect message.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-10 flex-1 min-h-[600px]">
        {/* Input Section */}
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors duration-300">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
             <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                Instructions
             </label>
             {prompt && (
                <button onClick={() => setPrompt('')} className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors">Clear</button>
             )}
          </div>
          
          <div className="relative flex-1 p-6">
            <textarea
              className="w-full h-full bg-transparent border-0 focus:ring-0 resize-none outline-none text-slate-700 dark:text-slate-200 text-lg leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-600"
              placeholder="e.g. Write a polite follow-up email to John regarding the Q3 sales report. Ask for a meeting next Tuesday at 2 PM..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={() => setIsListening(!isListening)}
              className={`absolute bottom-6 right-6 p-4 rounded-full transition-all duration-300 shadow-lg ${
                isListening 
                ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-100 dark:ring-red-900' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-110'
              }`}
            >
              {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleEnhancePrompt}
              disabled={isLoading || !prompt}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 disabled:opacity-50 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4" /> Enhance Prompt
            </button>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt}
              className="flex-[2] flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-200 dark:shadow-none"
            >
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Wand2 className="w-5 h-5" />}
              {isLoading ? 'Crafting Email...' : 'Generate Draft'}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
             <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Draft Preview</span>
                {generatedEmail && (
                    <button onClick={() => navigator.clipboard.writeText(generatedEmail)} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
                        <Copy className="w-3 h-3" /> Copy
                    </button>
                )}
             </div>

             <div className="flex-1 p-6 md:p-8 bg-slate-50/30 dark:bg-slate-950/30 overflow-y-auto">
                 {generatedEmail ? (
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-slate-400 w-12 text-right">To:</span>
                                <input 
                                    type="email" 
                                    placeholder="recipient@example.com"
                                    className="bg-transparent border-b border-transparent focus:border-indigo-300 outline-none text-slate-600 dark:text-slate-300 text-sm flex-1 transition-colors"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-slate-400 w-12 text-right">Subject:</span>
                                <input 
                                    type="text" 
                                    placeholder="Subject line..."
                                    className="bg-transparent border-b border-transparent focus:border-indigo-300 outline-none text-slate-800 dark:text-slate-200 font-medium text-sm flex-1 transition-colors"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed font-normal text-base">
                            {generatedEmail}
                        </div>
                    </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                             <div className="w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-700"></div>
                        </div>
                        <p className="font-medium">Generated content will appear here...</p>
                    </div>
                 )}
             </div>

             {generatedEmail && (
                 <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
                     <button
                        onClick={handleSendClick}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all transform hover:-translate-y-0.5"
                     >
                        <Send className="w-4 h-4" /> Send Email
                     </button>
                 </div>
             )}
        </div>
      </div>

      {/* Simplified Send Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-scale-up border border-slate-100 dark:border-slate-800 relative">
                <button onClick={() => setShowConfirm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>

                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 mx-auto text-indigo-600 dark:text-indigo-400">
                    <Mail className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">Send Email</h3>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm md:text-base px-4">
                    Choose your email provider to proceed.
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => openInProvider('gmail')}
                        className="flex flex-col items-center justify-center gap-3 py-6 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-700 dark:text-slate-200 rounded-2xl font-bold transition-all group"
                    >
                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Mail size={20} />
                        </div>
                        Gmail
                    </button>
                    <button 
                        onClick={() => openInProvider('outlook')}
                        className="flex flex-col items-center justify-center gap-3 py-6 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-200 rounded-2xl font-bold transition-all group"
                    >
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Mail size={20} />
                        </div>
                        Outlook
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};