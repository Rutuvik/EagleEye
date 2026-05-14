import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { Zap } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-sm p-8 space-y-8">
        <div className="text-center space-y-2">
            <Zap className="w-10 h-10 fill-blue-600 text-blue-600 mx-auto" />
            <h1 className="text-2xl font-bold text-slate-900">{isLogin ? 'Welcome Back' : 'Get Started'}</h1>
            <p className="text-slate-500 text-sm">Please {isLogin ? 'sign in' : 'create an account'} to continue</p>
        </div>

        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="w-full bg-blue-600 text-white rounded-xl p-3 font-bold text-sm hover:bg-blue-700 transition-all">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <button onClick={handleGoogleSignIn} className="w-full border border-slate-200 text-slate-900 rounded-xl p-3 font-bold text-sm hover:bg-slate-50 transition-all">
          Continue with Google
        </button>

        <p className="text-center text-xs text-slate-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-bold hover:underline">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
