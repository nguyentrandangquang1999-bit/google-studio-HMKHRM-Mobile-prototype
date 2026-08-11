import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, ScanFace, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '@/context/AppContext';

export default function BiometricSetup() {
  const navigate = useNavigate();
  const [isActivating, setIsActivating] = useState(false);
  const { setHasCheckedIn } = useApp(); // Just using it to avoid TS warnings if needed, actually we just navigate

  const handleActivate = () => {
    setIsActivating(true);
    // Simulate biometric native prompt
    setTimeout(() => {
      setIsActivating(false);
      navigate('/');
    }, 1500);
  };

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <div className="mobile-container bg-surface flex flex-col px-6 pb-safe relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-50 to-transparent -z-10 pattern-dots opacity-50"></div>
      
      <div className="flex-1 flex flex-col items-center justify-center pt-10">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="relative mb-10"
        >
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping"></div>
          <div className="w-32 h-32 bg-primary/10 border-4 border-white rounded-full flex items-center justify-center relative z-10 shadow-xl shadow-primary/10 backdrop-blur-sm">
            <ScanFace className="w-14 h-14 text-primary" strokeWidth={1.5} />
          </div>
          
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-success rounded-full border-4 border-white flex items-center justify-center shadow-md z-20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
        </motion.div>

        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="text-center"
        >
          <h1 className="text-2xl font-bold text-text-main mb-3">Đăng nhập bằng Face ID</h1>
          <p className="text-text-muted text-sm leading-relaxed mb-8 max-w-[280px] mx-auto">
            Sử dụng Face ID hoặc Vân tay để đăng nhập nhanh chóng, đồng thời cung cấp lớp bảo mật bổ sung khi truy cập <strong>Ví Lương</strong>.
          </p>

          <div className="space-y-4 text-left w-full max-w-sm mx-auto mb-10 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <span className="font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-main">Không cần nhớ mật khẩu</h4>
                <p className="text-xs text-text-muted">Đăng nhập vào ca làm việc chỉ với 1 chạm.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                <span className="font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-main">Tiêu chuẩn bảo mật ERP</h4>
                <p className="text-xs text-text-muted">Bắt buộc để xác thực các giao dịch phê duyệt vượt cấp.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="pb-8 pt-4 space-y-3"
      >
        <button
          onClick={handleActivate}
          disabled={isActivating}
          className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 rounded-md shadow-xl shadow-primary/20 transition-all flex items-center justify-center active:scale-[0.98]"
        >
          {isActivating ? (
             <div className="flex items-center">
               <Fingerprint className="w-5 h-5 mr-2 animate-pulse" />
               Đang xác thực...
             </div>
          ) : (
            <>
              Kích hoạt ngay
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
        
        <button
           onClick={handleSkip}
           disabled={isActivating}
           className="w-full py-4 rounded-md font-bold text-text-muted hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          Bỏ qua lúc này
        </button>
      </motion.div>
    </div>
  );
}
