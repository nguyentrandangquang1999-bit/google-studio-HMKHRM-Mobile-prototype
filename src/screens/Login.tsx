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
    <div className="mobile-container bg-surface justify-center px-6 relative overflow-hidden">
      {/* Decorative Brand Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-light rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm mx-auto relative z-10"
      >
        <div className="flex flex-col items-center justify-center mb-10 mt-safe-top">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center shadow-2xl shadow-primary/40 mb-5 border border-primary-dark">
            <Building2 className="text-white w-8 h-8" strokeWidth={1.5} />
          </div>
          <h1 className="text-[28px] font-bold text-text-main text-center tracking-tight">
            HMK Retail
          </h1>
          <p className="text-text-muted mt-1.5 text-center text-sm font-medium">
            Hệ thống Quản trị Vận hành & Nhân sự
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              Mã nhân viên / Email
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-md border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium placeholder:font-normal"
              placeholder="VD: EMP-2023-045"
              required
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-text-main">
                Mật khẩu
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-12 py-3.5 rounded-md border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium placeholder:font-normal"
                placeholder="••••••••"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-main transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 accent-primary"
              />
              <label htmlFor="remember" className="ml-2 text-sm font-medium text-text-muted">
                Ghi nhớ đăng nhập
              </label>
            </div>
            <Link to="/forgot-password" className="text-sm text-primary font-bold hover:underline">
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-md shadow-xl shadow-primary/20 transition-all flex items-center justify-center group disabled:opacity-60 active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Đăng nhập
                <ChevronRight className="w-5 h-5 ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 relative flex items-center justify-center">
          <div className="border-t border-gray-100 w-full absolute"></div>
          <span className="bg-surface px-4 text-xs font-bold text-gray-400 relative z-10 uppercase tracking-widest">
            Xác thực rảnh tay
          </span>
        </div>

        <button 
           type="button"
           className="w-full mt-6 bg-white border border-gray-200 hover:border-primary/30 hover:bg-primary-light/10 text-text-main font-bold py-3.5 rounded-md transition-all flex items-center justify-center shadow-sm active:scale-[0.98]"
        >
          <Fingerprint className="w-5 h-5 mr-2 text-primary" />
          Mở khoá bằng Face ID / Vân tay
        </button>
      </motion.div>
    </div>
  );
}
