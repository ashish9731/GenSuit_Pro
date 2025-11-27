import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, LayoutGrid, AlertCircle, Loader2 } from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from '../services/firebase';

export const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }

    if (isSignUp && !formData.name.trim()) {
      setError("Full Name is required for sign up.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign Up Logic
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        // Update profile with name
        await updateProfile(userCredential.user, {
            displayName: formData.name
        });
      } else {
        // Login Logic
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
      // App.tsx auth listener will handle redirection
    } catch (err: any) {
        console.error(err);
        let msg = "Authentication failed.";
        if (err.code === 'auth/email-already-in-use') msg = "This email is already in use.";
        if (err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
        if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
      setError('');
      setLoading(true);
      try {
          await signInWithPopup(auth, googleProvider);
      } catch (err: any) {
          console.error(err);
          setError("Google Sign-In failed. Please try again.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in relative overflow-hidden">
      {/* Background decoration matching Home */}
      <div className="absolute inset-0 -z-10 bg-white dark:bg-slate-950">
         <div className="absolute inset-x-0 -top-40 transform-gpu overflow-hidden blur-3xl sm:-top-80 opacity-20">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 relative z-10">
        <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                <LayoutGrid className="w-7 h-7 text-white" />
            </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-2">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
          {isSignUp ? "Join GenSuite Pro today." : "Enter your credentials to access your workspace."}
        </p>

        {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-medium animate-pulse">
                <AlertCircle size={18} />
                {error}
            </div>
        )}

        {/* Google Sign In Button */}
        <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3 mb-6 relative overflow-hidden"
        >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Sign in with Google
        </button>

        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-slate-400">Or continue with email</span>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="email" 
                placeholder="name@company.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : (
                <>
                    {isSignUp ? 'Create Workspace' : 'Sign In'} <ArrowRight size={20} />
                </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="ml-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline outline-none"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};