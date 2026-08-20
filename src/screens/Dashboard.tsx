import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Wallet,
  CalendarIcon,
  CalendarDays,
  Users,
  ArrowRight,
  ChevronRight,
  Target,
  Flame,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Megaphone,
  BellRing,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

const news = [
  {
    id: 1,
    title: "Chính sách bảo hiểm y tế mới áp dụng từ tháng 11",
    time: "2 giờ trước",
    img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80",
  },
  {
    id: 2,
    title: "Thông báo: Lịch nghỉ lễ Quốc Khánh 2/9 năm nay",
    time: "1 ngày trước",
    img: "https://images.unsplash.com/photo-1511871893393-82ce9c1a50a1?w=400&q=80",
  },
];

export default function Dashboard() {
  const {
    hasCheckedIn,
    availableShifts,
    briefings,
    markBriefingAsRead,
    acknowledgeBriefing,
    hasAcknowledgedBriefing,
    setHasAcknowledgedBriefing,
    acknowledgeDispatch,
    registeredHours,
    maxHoursPerWeek,
  } = useApp();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [missingCheckoutAlert, setMissingCheckoutAlert] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const registeredShifts = availableShifts
    .filter((t) => t.status === "approved" || t.status === "pending")
    .sort((a, b) => (a.date instanceof Date && b.date instanceof Date) ? a.date.getTime() - b.date.getTime() : 0)
    .slice(0, 3); // Show top 3 maybe

  // Get today's active briefings
  const todayBriefings = briefings.filter(b => {
    // Basic filter: just show mock data for demonstration
    return true;
  });

  const urgentUnackBriefing = todayBriefings.find(b => b.isUrgent && !b.isAcknowledged);
  const otherBriefings = todayBriefings.filter(b => b !== urgentUnackBriefing);

  return (
    <div className="w-full flex flex-col h-full relative">
      <Header />

      <div className="p-4 space-y-4 pb-20">
        {/* Timesheet Tracker */}
        <section>
          <div className="flex justify-between items-center mb-4 mt-2">
            <h2 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em]">
              Bảng tin đầu ca
            </h2>
            <Link
              to="/notifications?tab=briefing"
              className="text-[10px] font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md hover:bg-slate-200 flex items-center uppercase tracking-wide transition-colors"
            >
              Xem tất cả <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {urgentUnackBriefing ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-card relative overflow-hidden">
                <div className="flex items-start gap-3 relative z-10 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F0F6FA] border border-[#558BAD]/20 flex items-center justify-center shrink-0 shadow-soft">
                    <BellRing className="w-5 h-5 text-[#558BAD]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold bg-red-50 text-red-600 border border-red-100 uppercase tracking-wider">
                        Khẩn cấp
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#F0F6FA] text-[#558BAD] border border-[#558BAD]/20 uppercase tracking-wider">
                        Cần xác nhận
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {urgentUnackBriefing.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                      {urgentUnackBriefing.senderRole} {urgentUnackBriefing.senderName} • {urgentUnackBriefing.storeName}
                    </p>
                  </div>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-2">
                  {urgentUnackBriefing.message}
                </p>

                <div className="flex gap-2">
                  <Link
                    to={`/notifications?tab=briefing&id=${urgentUnackBriefing.id}`}
                    className="flex-1 py-2.5 bg-[#558BAD] hover:bg-[#446E8A] text-white text-xs font-bold rounded-xl flex items-center justify-center transition-all shadow-soft active:scale-98"
                  >
                    Đọc & xác nhận
                  </Link>
                </div>
              </div>
            ) : null}

            {otherBriefings.length > 0 && !urgentUnackBriefing ? (
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x no-scrollbar -mx-4 px-4">
                {otherBriefings.map(briefing => (
                  <Link
                    key={briefing.id}
                    to={`/notifications?tab=briefing&id=${briefing.id}`}
                    className={cn(
                      "min-w-[280px] snap-center bg-white border border-slate-100 rounded-2xl p-4 shadow-card hover:border-slate-200 transition-colors flex flex-col relative overflow-hidden",
                      !briefing.isRead && "border-[#558BAD]/30 bg-[#F0F6FA]/50"
                    )}
                  >
                    {!briefing.isRead && (
                      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#558BAD]"></div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Megaphone className={cn("w-4 h-4", !briefing.isRead ? "text-[#558BAD]" : "text-slate-400")} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        {briefing.senderRole} {briefing.senderName}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                      {briefing.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {briefing.message}
                    </p>
                  </Link>
                ))}
              </div>
            ) : null}
            
            {todayBriefings.length === 0 ? (
               <div className="bg-slate-50/70 rounded-2xl p-6 text-center border border-slate-200">
                  <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Chưa có bảng tin đầu ca</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[220px] mx-auto">Khi quản lý gửi lời nhắn hoặc mục tiêu đầu ca, nội dung sẽ hiển thị tại đây.</p>
               </div>
            ) : null}
          </div>
        </section>

        {/* Timesheet Tracker */}
        <section>
          <div className="flex justify-between items-center mb-4 mt-6">
            <h2 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em]">
              Phân tích công / Tuần
            </h2>
            <Link
              to="/timesheet"
              className="text-[10px] font-bold text-[#558BAD] bg-[#F0F6FA] border border-[#558BAD]/20 px-2.5 py-1 rounded-lg hover:bg-[#E2EDF4] flex items-center uppercase tracking-wide transition-colors"
            >
              Chi tiết <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-card flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
                  Thời lượng đăng ký
                </p>
                <div className="flex items-baseline gap-1.5 min-h-[32px]">
                  <span className="text-3xl font-bold font-display text-slate-900 tracking-tight">
                    {registeredHours}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    / {maxHoursPerWeek}h
                  </span>
                </div>
              </div>

              <div className="border-l border-slate-100 pl-6">
                <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
                  Chỉ số vi phạm
                </p>
                <div className="flex items-baseline gap-1.5 min-h-[32px]">
                  <span className="text-3xl font-bold font-display text-red-500 tracking-tight">
                    45
                  </span>
                  <span className="text-[10px] font-extrabold text-red-400 uppercase">
                    Phút
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-[0.1em]">
                <span className="text-slate-500">Mức độ cam kết</span>
                <span
                  className={cn(
                    registeredHours > maxHoursPerWeek
                      ? "text-red-500"
                      : "text-[#558BAD]",
                  )}
                >
                  {Math.round((registeredHours / maxHoursPerWeek) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex border border-slate-200/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${Math.min(100, (registeredHours / maxHoursPerWeek) * 100)}%` 
                  }}
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    registeredHours > maxHoursPerWeek
                      ? "bg-red-500"
                      : "bg-[#558BAD]",
                  )}
                ></motion.div>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] pt-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-slate-400">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      registeredHours > maxHoursPerWeek
                        ? "bg-red-500"
                        : "bg-[#558BAD]",
                    )}
                  ></span>
                  <span>
                    Hiện hữu:{" "}
                    <span className="text-slate-900 font-display text-sm ml-1 lowercase">
                      {registeredHours}h
                    </span>
                  </span>
                </div>
              </div>
              <p className="text-red-600 font-bold font-display text-xs bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg tracking-tight flex items-center shadow-soft">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> -50.000đ
              </p>
            </div>
          </div>
        </section>



        {/* News Feed */}
        <section>
          <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide mt-6">
            Bảng tin
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar -mx-4 px-4">
            {news.map((item) => (
              <div
                key={item.id}
                className="min-w-[260px] w-[260px] snap-center bg-white border-2 border-gray-100 rounded-xl overflow-hidden shadow-sm hover:border-gray-200 transition-colors cursor-pointer"
              >
                <div className="h-32 bg-gray-100 w-full relative">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="text-[10px] text-gray-400 font-bold tracking-wide uppercase mb-1.5">
                    {item.time}
                  </p>
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-relaxed">
                    {item.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
