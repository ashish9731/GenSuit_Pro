import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, AlertCircle } from 'lucide-react';
import { chatWithDocument } from '../services/geminiService';

interface DocChatProps {
  documentContext: string;
}

export const DocChat: React.FC<DocChatProps> = ({ documentContext }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Hello! I am ready to answer questions about your uploaded document.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !documentContext) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // Format history for Gemini API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await chatWithDocument(history, userMsg, documentContext);
      
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an error processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!documentContext) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full mb-4">
            <FileText className="w-8 h-8 text-orange-500 dark:text-orange-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Document Found</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md text-sm md:text-base">
          Please upload a document in the <strong>Analytics</strong> tab first. The chatbot needs data to answer your questions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white dark:bg-slate-900 md:shadow-xl md:rounded-2xl overflow-hidden md:my-6 md:border md:border-gray-200 dark:md:border-slate-800 transition-colors">
      <div className="bg-indigo-600 dark:bg-indigo-900 p-4 flex items-center justify-between shadow-md z-10 sticky top-0">
        <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
                <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
                <h3 className="text-white font-bold text-lg">Doc Assistant</h3>
                <p className="text-indigo-200 text-xs">Strict Context Mode Active</p>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-slate-950 pb-24 md:pb-6 transition-colors">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start max-w-[85%] md:max-w-[80%] gap-2 md:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 hidden md:flex ${msg.role === 'user' ? 'bg-indigo-100 dark:bg-indigo-900' : 'bg-green-100 dark:bg-green-900'}`}>
                {msg.role === 'user' ? <User size={16} className="text-indigo-600 dark:text-indigo-300"/> : <Bot size={16} className="text-green-600 dark:text-green-400"/>}
              </div>
              <div className={`p-3 md:p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-slate-700 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-slate-700 shadow-sm md:ml-11">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 p-2 rounded-xl border border-gray-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 transition-all">
          <input
            type="text"
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-2 outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
            placeholder="Ask about the document..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 mt-2 flex items-center justify-center gap-1">
            <AlertCircle size={10} /> 
            AI will adhere strictly to the document context.
        </p>
      </div>
    </div>
  );
};