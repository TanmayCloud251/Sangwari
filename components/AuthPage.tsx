import React, { useState } from 'react';
import { AppScreen } from '../types';

interface AuthPageProps {
  onLogin: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(false); // Default to signup based on screenshot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate auth
    onLogin();
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-8 bg-cream-50 relative overflow-hidden">
      {/* Background decoration circles (abstract) */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-brand-orange/10 rounded-full blur-3xl" />

      <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden min-h-[600px]">
        
        {/* Left Side - Hero/Info */}
        <div className="w-full md:w-1/2 bg-cream-100 flex flex-col items-center justify-center p-12 text-center relative">
            {/* Logo placeholder */}
            <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mb-6 shadow-lg">
                 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                    <path d="M8.5 8.5v.01" />
                    <path d="M16 12v.01" />
                    <path d="M12 16v.01" />
                 </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Sangwari se judo</h1>
            <p className="text-gray-600 font-medium">Apan Chhattisgarhi dost se baat kare bar.</p>

            {/* Decorative background elements matching screenshot */}
            <div className="absolute bottom-10 left-10 w-12 h-20 bg-brand-orange/20 rounded-full transform -rotate-45" />
            <div className="absolute bottom-8 right-20 w-16 h-16 bg-brand-orange/10 rounded-full" />
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center md:text-left">
            {isLogin ? 'Wapas Swagat Hai!' : 'Apan Account Banao'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Email / Username</label>
              <input
                type="email"
                placeholder="tumar@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-cream-50 rounded-xl border border-transparent focus:border-brand-orange focus:bg-white focus:ring-0 transition-all outline-none text-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-cream-50 rounded-xl border border-transparent focus:border-brand-orange focus:bg-white focus:ring-0 transition-all outline-none text-gray-700"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-cream-50 rounded-xl border border-transparent focus:border-brand-orange focus:bg-white focus:ring-0 transition-all outline-none text-gray-700"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-400 to-amber-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:from-orange-500 hover:to-amber-600 transition-all transform active:scale-95"
            >
              {isLogin ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500">
              {isLogin ? "Account nahi he?" : "Pahle se account hai?"}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-brand-orange font-bold hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;