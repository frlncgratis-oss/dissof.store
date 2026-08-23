import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onBackToStore: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onBackToStore }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Username dan password wajib diisi.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      await login({ username: username.trim(), password: password.trim() });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal. Periksa kembali username & password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-10 border border-pink-100 shadow-xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white mx-auto flex items-center justify-center shadow-lg shadow-pink-200">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="font-playfair text-2xl font-bold text-[#2E241E]">
            Admin Portal DISSOF.ID
          </h2>
          <p className="text-xs text-[#7B6E67]">
            Masuk untuk mengelola produk, pesanan, custom request, dan konten website.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium shadow-xs">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#4A3D36] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-pink-500" />
              <span>Username</span>
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-[#FFFDFB]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#4A3D36] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-pink-500" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-[#FFFDFB] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{isLoading ? 'Memverifikasi...' : 'MASUK KE DASHBOARD'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onBackToStore}
            className="text-xs font-semibold text-[#8C7D75] hover:text-pink-600 transition-colors cursor-pointer"
          >
            ← Kembali ke Website Customer
          </button>
        </div>

      </div>
    </div>
  );
};
