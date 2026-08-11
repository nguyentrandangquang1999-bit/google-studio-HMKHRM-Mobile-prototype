import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, Key, ArrowLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

type Step = 'email' | 'otp' | 'reset' | 'success';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = (nextStep: Step) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(nextStep);
    }, 800);
  };

  const currentStepIndex = ['email', 'otp', 'reset', 'success'].indexOf(step);

  return (
    <div className="mobile-container bg-white flex flex-col px-6 pt-safe-top pb-10">
      {/* Header */}
      <div className="pt-6 pb-4 flex items-center">
        {step !== 'success' && (
          <button 
            onClick={() => step === 'email' ? navigate('/login') : setStep(step === 'otp' ? 'email' : 'otp')}
            className="w-10 h-10 -ml-2 rounded-md flex items-center justify-center text-text-main hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {step !== 'success' && (
        <div className="flex gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: i <= currentStepIndex ? "100%" : "0%" }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {/* STEP 1: EMAIL */}
          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-text-main mb-2">Quên mật khẩu?</h1>
              <p className="text-text-muted text-sm mb-8 leading-relaxed">
                Đừng lo lắng! Hãy nhập email hoặc mã nhân viên được liên kết với tài khoản của bạn.
              </p>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-main mb-1.5">
                  Email / Mã nhân viên
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-md border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    placeholder="VD: nguyen.vana@company.com"
                  />
                </div>
              </div>

              <button
                onClick={() => handleNext('otp')}
                disabled={!email || isLoading}
                className="w-full mt-8 bg-primary hover:bg-primary-dark text-white font-semibold py-4 rounded-md shadow-lg shadow-primary/20 transition-all flex items-center justify-center disabled:opacity-70 active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Gửi mã xác nhận"}
              </button>
            </motion.div>
          )}

          {/* STEP 2: OTP */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-text-main mb-2">Nhập mã OTP</h1>
              <p className="text-text-muted text-sm mb-8 leading-relaxed">
                Chúng tôi vừa gửi mã xác nhận 4 số đến <br/>
                <span className="font-semibold text-text-main">{email || 'email của bạn'}</span>
              </p>

              <div className="flex justify-between gap-3 mb-8">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    className="w-16 h-16 text-center text-2xl font-bold rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    placeholder="-"
                    onChange={(e) => {
                      const newOtp = [...otp];
                      newOtp[i] = e.target.value;
                      setOtp(newOtp);
                      // Auto focus logic can be added here
                    }}
                  />
                ))}
              </div>

              <div className="text-center mb-8">
                <p className="text-sm text-text-muted">
                  Chưa nhận được mã? <button className="font-semibold text-primary hover:underline">Gửi lại (00:59)</button>
                </p>
              </div>

              <button
                onClick={() => handleNext('reset')}
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 rounded-md shadow-lg shadow-primary/20 transition-all flex items-center justify-center disabled:opacity-70 active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Xác thực mã OTP"}
              </button>
            </motion.div>
          )}

          {/* STEP 3: RESET PASSWORD */}
          {step === 'reset' && (
            <motion.div
              key="reset"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                <Key className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-text-main mb-2">Tạo mật khẩu mới</h1>
              <p className="text-text-muted text-sm mb-8 leading-relaxed">
                Mật khẩu mới của bạn phải khác với mật khẩu đã sử dụng trước đó.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1.5">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3.5 rounded-md border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    placeholder="Ít nhất 8 ký tự"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1.5">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3.5 rounded-md border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                onClick={() => handleNext('success')}
                disabled={isLoading}
                className="w-full mt-8 bg-primary hover:bg-primary-dark text-white font-semibold py-4 rounded-md shadow-lg shadow-primary/20 transition-all flex items-center justify-center disabled:opacity-70 active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Đổi mật khẩu"}
              </button>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center pb-20"
            >
              <div className="w-24 h-24 bg-success-light rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-text-main mb-3">Thành công!</h1>
              <p className="text-text-muted text-sm mb-10 max-w-[280px]">
                Mật khẩu của bạn đã được đặt lại thành công. Vui lòng đăng nhập lại với mật khẩu mới.
              </p>

              <button
                onClick={() => navigate('/login')}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 rounded-md shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                Quay lại Đăng nhập
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
