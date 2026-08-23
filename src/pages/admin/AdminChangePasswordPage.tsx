import React, { useState } from 'react';
import { KeyRound, Lock, Check, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';

const ADMIN_PASSWORD_KEY = 'adminPassword';
const DEFAULT_ADMIN_PASS = 'dissof2026!';

export const AdminChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim() || !newPassword.trim()) {
      setErrorMsg('Semua kolom password wajib diisi.');
      return;
    }

    const activePassword = localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASS;
    if (currentPassword !== activePassword) {
      setErrorMsg('Password saat ini salah.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Save permanently to LocalStorage under 'adminPassword'
      localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);

      // Attempt background backend sync if available
      try {
        await api.changePassword({ currentPassword, newPassword });
      } catch {
        // Silently ignore background API failure, local auth is primary
      }

      setSuccessMsg('Password admin berhasil diperbarui dan tersimpan! Silakan gunakan password baru ini saat login berikutnya.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengubah password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      
      <div className="border-b border-black/5 pb-4">
        <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2D2D2D]">
          Ganti Password Admin
        </h1>
        <p className="text-xs text-[#A08C8C] mt-0.5 font-medium">
          Amankan akses portal toko DISSOF.ID dengan memperbarui password secara berkala.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-2xl flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium leading-relaxed">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-2xl shadow-xs animate-in fade-in duration-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-black/5 shadow-xs space-y-4 text-xs">
        
        <div className="space-y-1.5">
          <label className="font-bold text-[#2D2D2D] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#FF9AA2]" />
            <span>Password Saat Ini</span>
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-[#2D2D2D] flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-[#FF9AA2]" />
            <span>Password Baru</span>
          </label>
          <input
            type="password"
            required
            placeholder="Minimal 6 karakter"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-[#2D2D2D] flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-[#FF9AA2]" />
            <span>Ulangi Password Baru</span>
          </label>
          <input
            type="password"
            required
            placeholder="Ulangi password baru"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
          />
        </div>

        <div className="pt-4 border-t border-black/5 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 rounded-full bg-[#2D2D2D] hover:bg-black text-white font-bold text-xs uppercase tracking-wider shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Menyimpan...' : 'Perbarui Password'}
          </button>
        </div>

      </form>

    </div>
  );
};
