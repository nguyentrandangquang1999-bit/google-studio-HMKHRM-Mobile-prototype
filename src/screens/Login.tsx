import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Fingerprint, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { user, login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      login(email, password);
      navigate('/setup-biometric');
    }, 800);
  };

  return (
    <div className="mobile-container bg-white justify-center px-6 relative overflow-hidden">
      {/* Decorative Brand Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#558BAD]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm mx-auto relative z-10"
      >
        <div className="flex flex-col items-center justify-center mb-8 mt-safe-top">
          <div className="w-16 h-16 bg-[#558BAD] rounded-2xl flex items-center justify-center shadow-lg shadow-[#558BAD]/25 mb-4 border border-[#446E8A]/30">
            <Building2 className="text-white w-8 h-8" strokeWidth={1.75} />
          </div>
          <h1 className="text-[26px] font-bold text-slate-900 text-center tracking-tight">
            HMK Retail
          </h1>
          <p className="text-slate-500 mt-1 text-center text-xs font-medium">
            Hệ thống Quản trị Vận hành & Nhân sự
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Mã nhân viên / Email
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:ring-2 focus:ring-[#558BAD]/20 focus:border-[#558BAD] transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal text-sm"
              placeholder="VD: EMP-2023-045"
              required
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mật khẩu
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:ring-2 focus:ring-[#558BAD]/20 focus:border-[#558BAD] transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal text-sm"
                placeholder="••••••••"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 pb-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded text-[#558BAD] focus:ring-[#558BAD] border-slate-300 accent-[#558BAD]"
              />
              <label htmlFor="remember" className="ml-2 text-xs font-medium text-slate-500 cursor-pointer">
                Ghi nhớ đăng nhập
              </label>
            </div>
            <Link to="/forgot-password" className="text-xs text-[#558BAD] font-bold hover:underline">
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-[#558BAD] hover:bg-[#446E8A] active:bg-[#375A72] text-white text-sm font-bold py-3.5 rounded-xl shadow-md shadow-[#558BAD]/20 transition-all flex items-center justify-center group disabled:opacity-50 active:scale-[0.99]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Đăng nhập
                <ChevronRight className="w-4 h-4 ml-1.5 opacity-80 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 relative flex items-center justify-center">
          <div className="border-t border-slate-100 w-full absolute"></div>
          <span className="bg-white px-3 text-[10px] font-bold text-slate-400 relative z-10 uppercase tracking-widest">
            Xác thực rảnh tay
          </span>
        </div>

        <button 
           type="button"
           className="w-full mt-5 bg-white border border-slate-200 hover:border-[#558BAD]/40 hover:bg-[#F0F6FA] text-slate-800 text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center shadow-soft active:scale-[0.99]"
        >
          <Fingerprint className="w-4 h-4 mr-2 text-[#558BAD]" />
          Mở khoá bằng Face ID / Vân tay
        </button>
      </motion.div>
    </div>
  );
}
