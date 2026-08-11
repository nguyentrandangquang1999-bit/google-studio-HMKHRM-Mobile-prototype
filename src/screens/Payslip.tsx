import React, { useState } from 'react';
import { ChevronLeft, Lock, Fingerprint, Eye, EyeOff, ShieldCheck, Download, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export default function Payslip() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMethod, setAuthMethod] = useState<'biometric' | 'password'>('biometric');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  // Authenticate simulation
  const handleAuthenticate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (authMethod === 'password') {
      if (password === '123456') { // Mock secure PIN
        setIsAuthenticated(true);
      } else {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    } else {
      // Simulate Face ID / Fingerprint
      setTimeout(() => {
        setIsAuthenticated(true);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen relative pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-50 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-800">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-text-main font-sans">Phiếu lương</h1>
        <div className="w-10"></div> {/* Placeholder for balance */}
      </div>

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div 
            key="lock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 mt-10"
          >
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Lock className="w-10 h-10" />
            </div>
            
            <h2 className="text-xl font-bold text-text-main mb-2">Bảo mật thông tin</h2>
            <p className="text-sm text-text-muted text-center mb-8">Vui lòng xác thực danh tính để xem chi tiết thu nhập của bạn.</p>

            {authMethod === 'biometric' ? (
              <div className="flex flex-col items-center w-full max-w-sm">
                <button 
                  onClick={() => handleAuthenticate()}
                  className="w-24 h-24 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm hover:border-primary hover:text-primary transition-all mb-6 text-gray-700 active:scale-95"
                >
                  <Fingerprint className="w-12 h-12" />
                </button>
                <p className="text-xs text-gray-500 mb-6">Chạm vào cảm biến vân tay / Face ID</p>
                <button onClick={() => setAuthMethod('password')} className="text-sm font-bold text-primary">Sử dụng Mật khẩu / PIN</button>
              </div>
            ) : (
              <form onSubmit={handleAuthenticate} className="w-full max-w-sm space-y-4">
                <div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Nhập Mật khẩu / PIN cấp 2"
                      className={cn(
                        "w-full bg-white border rounded-md px-4 py-3.5 text-sm font-medium focus:outline-none transition-colors",
                        error ? "border-error focus:border-error" : "border-gray-200 focus:border-primary"
                      )}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                    </button>
                  </div>
                  {error && <p className="text-xs text-error mt-2 font-medium">Mã PIN không đúng (Gợi ý: 123456)</p>}
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-md shadow-lg shadow-primary/20 transition-all font-mono tracking-tight"
                >
                  MỞ KHÓA
                </button>
                <div className="text-center mt-4">
                  <button type="button" onClick={() => setAuthMethod('biometric')} className="text-sm font-bold text-primary">Xác thực Sinh trắc học</button>
                </div>
              </form>
            )}
            
            <div className="mt-auto pt-10 flex items-center gap-2 text-xs text-gray-400">
               <ShieldCheck className="w-4 h-4" /> Dữ liệu được mã hóa đầu cuối
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="payslip"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 space-y-4"
          >
            {/* Header / Total */}
            <div className="bg-primary text-white rounded-lg p-5 shadow-lg shadow-primary/20 relative overflow-hidden">
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
               <div className="relative z-10">
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-white/80 text-sm font-medium">Kỳ lương Tháng 10/2023</span>
                   <span className="bg-white/20 text-xs px-2 py-0.5 rounded text-white font-bold tracking-wider">ĐÃ CHUYỂN</span>
                 </div>
                 <h2 className="text-2xl font-bold font-mono tracking-tight my-2">12,450,000 <span className="text-lg font-sans font-medium text-white/80">VNĐ</span></h2>
                 <p className="text-xs text-white/80 break-words">Thanh toán qua số TK: Techcombank - **** 4567</p>
               </div>
            </div>

            {/* Income Details */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
               <h3 className="font-bold text-text-main mb-4 flex justify-between items-center text-sm">CHI TIẾT THU NHẬP <span className="font-mono text-primary font-bold">+12,800,000</span></h3>
               <div className="space-y-4 text-sm">
                 <div className="flex justify-between items-end border-b border-gray-50 pb-3">
                   <div>
                     <p className="font-medium text-text-main">Lương căn bản</p>
                     <p className="text-[11px] text-text-muted mt-0.5">26 ngày công x 300K</p>
                   </div>
                   <p className="font-mono font-semibold text-primary">7,800,000</p>
                 </div>
                 <div className="flex justify-between items-end border-b border-gray-50 pb-3">
                   <div>
                     <p className="font-medium text-text-main">Phụ cấp trách nhiệm</p>
                     <p className="text-[11px] text-text-muted mt-0.5">Vị trí: Cửa hàng phó</p>
                   </div>
                   <p className="font-mono font-semibold text-primary">2,000,000</p>
                 </div>
                 <div className="flex justify-between items-end border-b border-gray-50 pb-3">
                   <div>
                     <p className="font-medium text-text-main">Lương OT (Làm thêm)</p>
                     <p className="text-[11px] text-text-muted mt-0.5">15 giờ x 150% rate</p>
                   </div>
                   <p className="font-mono font-semibold text-primary">1,000,000</p>
                 </div>
                 <div className="flex justify-between items-end">
                   <div>
                     <p className="font-medium text-text-main">Thưởng KPI Doanh số</p>
                     <p className="text-[11px] text-text-muted mt-0.5">Đạt 110% target cửa hàng</p>
                   </div>
                   <p className="font-mono font-semibold text-primary">2,000,000</p>
                 </div>
               </div>
            </div>

            {/* Deductions */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
               <h3 className="font-bold text-text-main mb-4 flex justify-between items-center text-sm">CÁC KHOẢN GIẢM TRỪ <span className="font-mono text-error font-bold">-350,000</span></h3>
               <div className="space-y-4 text-sm">
                 <div className="flex justify-between items-end border-b border-gray-50 pb-3">
                   <div>
                     <p className="font-medium text-text-main">Bảo hiểm (BHXH, BHYT)</p>
                     <p className="text-[11px] text-text-muted mt-0.5">10.5% Mức đóng cơ sở</p>
                   </div>
                   <p className="font-mono font-semibold text-error">-300,000</p>
                 </div>
                 <div className="flex justify-between items-end">
                   <div>
                     <p className="font-medium text-error">Phạt vi phạm quy định</p>
                     <p className="text-[11px] text-error/70 mt-0.5">Đi trễ 3 lần (Tổng 45 phút)</p>
                   </div>
                   <p className="font-mono font-semibold text-error">-50,000</p>
                 </div>
               </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 flex gap-3 mt-4">
              <Info className="w-5 h-5 text-gray-500 shrink-0" />
              <p className="text-xs text-text-muted leading-relaxed font-medium">Mọi thắc mắc về phiếu lương, vui lòng liên hệ phòng hành chính nhân sự qua mục "Yêu cầu hỗ trợ" trong vòng 3 ngày kể từ ngày nhận phiếu.</p>
            </div>

            <button className="w-full py-3.5 mt-2 bg-gray-100 hover:bg-gray-200 text-text-main font-bold rounded-md flex items-center justify-center gap-2 transition-colors">
              <Download className="w-5 h-5" /> TẢI VỀ BẢN PDF
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
