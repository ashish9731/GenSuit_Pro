import React, { useState, useRef, useEffect } from 'react';
import { Award, ChevronRight, PlayCircle, BookOpen, CheckCircle, ChevronLeft } from 'lucide-react';
import { QuizQuestion } from '../types';

const MODULES = [
  {
    id: 1,
    title: 'The C.R.E.A.T.E Formula',
    content: "Stop guessing. To get 10x results, you need a standard operating procedure for your prompts. Use the **C.R.E.A.T.E** formula for every major task:\n\n**C - Character:** Who is the AI? (e.g., Senior Data Scientist)\n**R - Request:** What specifically do you want? (e.g., Analyze this CSV)\n**E - Examples:** Give 1-3 examples of good output. (Few-Shot)\n**A - Adjustments:** Tone, style, and length constraints.\n**T - Type of Output:** Table, JSON, HTML, Bullet points.\n**E - Extras:** Unique constraints (e.g., 'No jargon').\n\nIf you miss one of these, you leave room for the AI to hallucinate or guess your intent.",
    example: "❌ **Weak:** 'Write a marketing email.'\n\n✅ **Master:** \n(Character) Act as a Senior Copywriter with 10 years of experience in SaaS.\n(Request) Write a cold outreach email to CTOs about our new AI security tool.\n(Adjustments) Tone: Professional but urgent. Max 150 words.\n(Type) Output as a plain text email body.\n(Extras) Do not use the word 'synergy'."
  },
  {
    id: 2,
    title: 'The "Few-Shot" Pattern',
    content: "LLMs are pattern matchers. The single most effective way to improve accuracy is **Few-Shot Prompting**. Instead of just asking for a result (Zero-Shot), provide the AI with 2-3 examples of 'Input -> Desired Output'.\n\nThis forces the model to mimic your logic, formatting, and style perfectly. It reduces hallucination by establishing a pattern before the real task begins.",
    example: "**Prompt:**\nExtract the company and revenue from these sentences.\n\nExample 1:\nInput: 'Apple announced $80B in revenue.'\nOutput: { Company: 'Apple', Revenue: '$80B' }\n\nExample 2:\nInput: 'Tesla earned $20B last quarter.'\nOutput: { Company: 'Tesla', Revenue: '$20B' }\n\nTask:\nInput: 'Microsoft just hit $50B in cloud sales.'\nOutput:"
  },
  {
    id: 3,
    title: 'Chain of Thought (CoT)',
    content: "For math, logic, or complex reasoning, AI often rushes to an answer and gets it wrong. You must force it to **'Think Step-by-Step'**.\n\nBy instructing the model to outline its reasoning *before* giving the final answer, you activate its logical processing capabilities. This is scientifically proven to increase accuracy on math and logic tasks significantly.",
    example: "❌ **Weak:** 'How many tennis balls fit in a Boeing 747?'\n\n✅ **Master:** 'Estimate how many tennis balls fit in a Boeing 747. \nInstruction: Think step-by-step. First, estimate the volume of a tennis ball. Next, estimate the usable interior volume of a 747. Then, account for the packing factor (empty space between balls). Finally, provide the calculation and the final number.'"
  },
  {
    id: 4,
    title: 'The "Sandwich" Method (Delimiters)',
    content: "When you paste large blocks of text (articles, code, data) into a prompt, the AI can get confused about where your instructions end and the data begins.\n\nUse **XML Delimiters** (like `<text>` and `</text>`) to 'sandwich' the data. This creates a clear boundary that separates your command from the input material.",
    example: "Summarize the text found inside the <article> tags below. Do not include any outside information.\n\n<article>\n[Paste your 20-page document here]\n</article>"
  },
  {
    id: 5,
    title: 'Persona Anchor & Audience',
    content: "Generic prompts get generic answers. To get expert-level output, you must assign a specific **Persona** and define the **Target Audience**.\n\nThe 'Persona' defines the vocabulary and depth of knowledge. The 'Audience' defines the simplicity and tone.\n\n**Formula:** `Act as [EXPERT ROLE] writing for [SPECIFIC AUDIENCE].`",
    example: "❌ **Weak:** 'Explain Quantum Physics.'\n\n✅ **Master (Option A):** 'Act as a Nobel Prize Physicist explaining Quantum Entanglement to a room of PhD candidates. Use technical equations.'\n\n✅ **Master (Option B):** 'Act as a Kindergarten Teacher explaining Quantum Entanglement to 5-year-olds using an analogy about magic socks.'"
  },
  {
    id: 6,
    title: 'Format Injection (JSON/Tables)',
    content: "Never let the AI decide how to format data. You need 10x efficiency? Force the AI to output machine-readable formats like JSON, CSV, or Markdown Tables.\n\nThis allows you to copy-paste the result directly into Excel or your code without manual editing.",
    example: "**Prompt:**\nAnalyze the sentiment of these reviews. \n\nOUTPUT FORMAT RULE:\nYou must strictly return a valid JSON array of objects. Do not write any conversational text before or after the JSON.\n\nSchema:\n[\n  { \"review_id\": number, \"sentiment\": \"positive\" | \"negative\", \"key_phrase\": string }\n]"
  },
  {
    id: 7,
    title: 'Negative Constraints',
    content: "Telling the AI what *not* to do is as powerful as telling it what *to* do. This is called **Negative Constraint Prompting**.\n\nUse this to filter out marketing fluff, robotic language, or specific formatting habits the AI tends to default to.",
    example: "**Prompt:** Write a blog post about coffee.\n\n**Constraints:**\n1. Do NOT use the word 'delicious'.\n2. Do NOT start sentences with 'In today's fast-paced world...'.\n3. Do NOT use passive voice.\n4. Do NOT include a conclusion paragraph."
  },
  {
    id: 8,
    title: 'The Refinement Loop',
    content: "The first draft is rarely perfect. Use the **Refinement Loop** to make the AI critique its own work.\n\nAfter the AI generates a response, don't just accept it. Ask it to evaluate its own output against a set of criteria and generate a better version.",
    example: "Step 1: [User] 'Write a sales letter.' -> [AI Generates Letter]\n\nStep 2: [User] 'Critique the letter above. specific attention to: Is the hook strong? Is the call to action clear? List 3 weaknesses.' -> [AI Critiques]\n\nStep 3: [User] 'Great. Now rewrite the letter fixing all the weaknesses you listed.'"
  },
  {
    id: 9,
    title: 'Task Splitting (Chaining)',
    content: "If you ask an AI to 'Write a book', it will fail. If you ask it to 'Write an outline', then 'Write Chapter 1 based on the outline', it will succeed.\n\n**Complex tasks must be broken down.** This is called **Chaining**. The output of Prompt A becomes the input of Prompt B.",
    example: "**Goal:** Write a Case Study.\n\n**Prompt 1:** 'Research and bullet point the key facts about [Company X].'\n**Prompt 2:** 'Create a dramatic story arc outline based on these facts.'\n**Prompt 3:** 'Write the introduction section based on the outline.'"
  },
  {
    id: 10,
    title: 'System Instructions (The God Mode)',
    content: "System Instructions are 'persistent memories' or rules that apply to the entire conversation. They are more powerful than standard user messages because they set the behavior boundaries.\n\nUse this to prevent the AI from ever breaking character or discussing forbidden topics.",
    example: "**System Instruction:**\n'You are \"GenBot\", a strict code auditor. You only speak in code comments. You strictly refuse to answer non-coding questions. If a user asks about the weather, reply: // ERROR: OUT OF SCOPE.'"
  }
];

const FINAL_EXAM: QuizQuestion[] = [
  { 
    id: 1, 
    question: "According to the C.R.E.A.T.E formula, what does 'E' stand for regarding input?", 
    options: ["Energy", "Examples (Few-Shot)", "Endurance", "Errors"], 
    correctAnswer: 1 
  },
  { 
    id: 2, 
    question: "Why do we use XML tags like <text>...</text> in the 'Sandwich Method'?", 
    options: ["To make the text look pretty", "To help the AI separate instructions from data", "To convert text to HTML", "It is required by law"], 
    correctAnswer: 1 
  },
  { 
    id: 3, 
    question: "What is 'Chain of Thought' prompting best used for?", 
    options: ["Simple greetings", "Math, logic, and complex reasoning", "Translation tasks", "Formatting JSON"], 
    correctAnswer: 1 
  },
  { 
    id: 4, 
    question: "In the 'Refinement Loop' technique, what do you ask the AI to do?", 
    options: ["Stop generating", "Critique its own work and then rewrite it", "Write a longer version", "Translate the text"], 
    correctAnswer: 1 
  },
  { 
    id: 5, 
    question: "What is the main benefit of 'Few-Shot' prompting?", 
    options: ["It saves tokens", "It establishes a pattern for the AI to mimic", "It makes the AI faster", "It turns off the safety filters"], 
    correctAnswer: 1 
  },
];

export const LearningHub: React.FC = () => {
  const [currentModule, setCurrentModule] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [answers, setAnswers] = useState<number[]>(new Array(FINAL_EXAM.length).fill(-1));
  const [score, setScore] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  const [certificateName, setCertificateName] = useState('');
  
  // Ref for scrolling content to top when module changes
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
        contentRef.current.scrollTop = 0;
    }
  }, [currentModule]);

  const handleNextModule = () => {
    if (currentModule < MODULES.length - 1) {
      setCurrentModule(prev => prev + 1);
    } else {
      setExamStarted(true);
    }
  };

  const handlePrevModule = () => {
    if (currentModule > 0) {
      setCurrentModule(prev => prev - 1);
    }
  };

  const handleSelectAnswer = (qIndex: number, optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const submitExam = () => {
    let correct = 0;
    answers.forEach((ans, idx) => {
      if (ans === FINAL_EXAM[idx].correctAnswer) correct++;
    });
    const finalScore = (correct / FINAL_EXAM.length) * 100;
    setScore(finalScore);
    if (finalScore >= 80) {
        setCertificateName(userName || "Valued Student");
    }
  };

  if (score !== null && score >= 80) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-6 bg-gray-50 dark:bg-slate-950 pb-24 transition-colors">
        <div className="bg-white p-6 md:p-10 border-8 border-double border-indigo-900 shadow-2xl max-w-2xl w-full text-center relative mx-auto transform scale-100 animate-in zoom-in duration-300">
          <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-yellow-500"></div>
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-yellow-500"></div>
          
          <Award className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Certificate of Mastery</h1>
          <p className="text-sm text-gray-500 uppercase tracking-[0.2em] mb-8">GenSuite Pro Academy</p>
          
          <p className="text-lg text-gray-700 italic mb-2">This is to certify that</p>
          <h2 className="text-3xl font-bold text-indigo-800 mb-2 font-serif border-b-2 border-indigo-100 inline-block pb-2 px-8 min-w-[200px] break-words">{certificateName}</h2>
          <p className="text-lg text-gray-700 mt-4">has successfully demonstrated advanced proficiency in</p>
          <h3 className="text-xl font-bold text-gray-900 mt-2">Professional Prompt Engineering</h3>
          
          <div className="mt-12 flex flex-col sm:flex-row justify-between items-end px-8 gap-6 sm:gap-0">
            <div className="text-left w-full sm:w-auto">
              <div className="h-10 w-32 border-b border-gray-400 mb-2 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Signature_sample.svg/1200px-Signature_sample.svg.png')] bg-contain bg-no-repeat bg-bottom opacity-50"></div>
              <p className="text-xs text-gray-500 font-bold uppercase">Chief Instructor</p>
            </div>
            <div className="text-right w-full sm:w-auto">
              <p className="text-sm font-bold text-gray-800">{new Date().toLocaleDateString()}</p>
              <p className="text-xs text-gray-500 font-bold uppercase">Date Issued</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4 mt-8 print:hidden pb-12">
            <button onClick={() => { setScore(null); setExamStarted(false); setAnswers(new Array(5).fill(-1)); }} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium">
                Back to Courses
            </button>
            <button onClick={() => window.print()} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 shadow-md font-medium flex items-center gap-2">
                <CheckCircle size={18} /> Print Certificate
            </button>
        </div>
      </div>
    );
  }

  return (
    // Layout: On Desktop use fixed height calc for split pane. On mobile use auto height for natural scroll.
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:h-[calc(100vh-2rem)] flex flex-col h-auto">
      
      <header className="flex-shrink-0 flex flex-col gap-2 mb-4 md:mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Prompt Engineering Masterclass</h2>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Don't just chat. Engineer your prompts. Complete these 10 advanced modules to earn your certification.</p>
      </header>

      {!examStarted ? (
        // Grid: On desktop it's a fixed container that fits screen. On mobile it flows.
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 lg:min-h-0">
            {/* Sidebar List for Desktop */}
            <div className="hidden lg:flex lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex-col h-full transition-colors">
                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200">Course Curriculum</h3>
                </div>
                {/* Internal Scroll for Sidebar */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {MODULES.map((m, idx) => (
                        <button 
                            key={m.id}
                            onClick={() => setCurrentModule(idx)}
                            className={`w-full text-left p-4 flex items-center gap-3 transition-colors ${
                                idx === currentModule 
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-l-4 border-indigo-600 dark:border-indigo-400' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                idx === currentModule ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'
                            }`}>
                                {idx + 1}
                            </span>
                            <span className="text-sm font-medium line-clamp-1">{m.title}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile Progress Indicator */}
            <div className="lg:hidden bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between sticky top-0 z-20">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Module {currentModule + 1} of {MODULES.length}</span>
                <div className="w-1/2 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                        className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentModule + 1) / MODULES.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Content Area */}
            {/* Desktop: Full height of parent grid, internal scroll. Mobile: Auto height. */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col lg:h-full h-auto transition-colors">
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 p-6 md:p-10 text-white relative overflow-hidden flex-shrink-0">
                    <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 transform translate-x-4">
                        <BookOpen size={140} />
                    </div>
                    <div className="relative z-10">
                        <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold mb-3 border border-white/20">Module {currentModule + 1}</span>
                        <h3 className="text-2xl md:text-4xl font-bold tracking-tight">{MODULES[currentModule].title}</h3>
                    </div>
                </div>
                
                {/* Content Body: Scrolls internally on Desktop. Flows on Mobile. */}
                <div ref={contentRef} className="p-6 md:p-10 flex-1 lg:overflow-y-auto flex flex-col space-y-8">
                    <div className="prose prose-lg prose-indigo dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-8">
                         <div className="whitespace-pre-line text-base md:text-lg">
                            {MODULES[currentModule].content}
                         </div>
                    </div>
                    
                    {MODULES[currentModule].example && (
                        <div className="mt-6">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Sparkles size={16} className="text-amber-500" /> 
                                Real World Application
                            </h4>
                            <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <span className="text-xs text-slate-400 font-mono ml-2">Prompt Editor</span>
                                </div>
                                <div className="p-6 text-sm md:text-base font-mono text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                                    {MODULES[currentModule].example}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons: Fixed at bottom of card on Desktop, natural flow on mobile */}
                <div className="p-6 md:p-8 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/30 flex-shrink-0">
                     <button 
                        onClick={handlePrevModule}
                        disabled={currentModule === 0}
                        className="flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed font-medium transition-all text-sm md:text-base"
                    >
                        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" /> Previous
                    </button>

                    <button 
                        onClick={handleNextModule}
                        className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-6 md:px-8 py-3 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900/50 hover:-translate-y-0.5 text-sm md:text-base font-bold"
                    >
                        {currentModule === MODULES.length - 1 ? 'Start Certification Exam' : 'Next Module'}
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>
            </div>
        </div>
      ) : (
        // Exam Mode Container - Natural Scroll
        <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-right-8 fade-in duration-500 pb-24 h-auto">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-900/30 p-8 rounded-2xl flex flex-col md:flex-row gap-6 items-start shadow-sm">
                <div className="bg-amber-100 dark:bg-amber-900/50 p-4 rounded-full flex-shrink-0 shadow-inner">
                    <Award className="text-amber-600 dark:text-amber-400 w-8 h-8"/>
                </div>
                <div>
                    <h4 className="font-bold text-amber-900 dark:text-amber-200 text-xl mb-2">Final Certification Exam</h4>
                    <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                        You are about to test your knowledge on advanced prompt engineering. 
                        You need a score of <span className="font-bold">80% (4/5)</span> to unlock your certificate. 
                        Take your time and think step-by-step!
                    </p>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Enter Name for Certificate</label>
                <input 
                    type="text" 
                    value={userName} 
                    onChange={(e) => setUserName(e.target.value)} 
                    className="w-full p-4 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
                    placeholder="e.g. Jane Doe"
                />
            </div>

            <div className="space-y-6">
                {userName && FINAL_EXAM.map((q, idx) => (
                    <div key={q.id} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-6 flex gap-4">
                            <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center text-sm">{idx + 1}</span> 
                            {q.question}
                        </h4>
                        <div className="space-y-3 pl-0 md:pl-12">
                            {q.options.map((opt, optIdx) => (
                                <label key={optIdx} className={`flex items-start md:items-center p-4 rounded-xl border cursor-pointer transition-all group ${
                                    answers[idx] === optIdx 
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 dark:border-indigo-500 ring-1 ring-indigo-500 dark:ring-indigo-500' 
                                    : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-indigo-200 dark:hover:border-slate-600'
                                }`}>
                                    <div className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mr-4 mt-0.5 md:mt-0 transition-colors ${
                                        answers[idx] === optIdx ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400 dark:border-gray-600 bg-white dark:bg-slate-800'
                                    }`}>
                                        {answers[idx] === optIdx && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <span className={`text-sm md:text-base ${answers[idx] === optIdx ? 'text-indigo-900 dark:text-indigo-200 font-medium' : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {userName && (
                <button 
                    onClick={submitExam}
                    disabled={answers.includes(-1)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-5 rounded-xl text-xl font-bold hover:shadow-xl hover:shadow-indigo-200 dark:hover:shadow-none transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mb-12"
                >
                    Submit & Get Certified
                </button>
            )}
            
            {score !== null && score < 80 && (
                 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                     <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full text-center animate-scale-up border border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Almost There!</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">You scored {score}%. You need 80% to pass. Review the modules and try again.</p>
                        <button onClick={() => { setScore(null); setAnswers(new Array(5).fill(-1)); }} className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold">
                            Try Again
                        </button>
                     </div>
                 </div>
            )}
        </div>
      )}
    </div>
  );
};

const Sparkles = ({size, className}: {size:number, className?:string}) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>
);

const AlertCircle = ({className}: {className?: string}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);