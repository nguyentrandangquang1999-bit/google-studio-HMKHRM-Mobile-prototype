import React, { useEffect, useState, useMemo } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import Header from "@/components/Header";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ChevronRight,
  BellRing,
  Megaphone,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { getMergedAttendanceRecords, formatWorkHours } from "@/screens/Timesheet";

export default function Dashboard() {
  const {
    hasCheckedIn,
    availableShifts,
    briefings,
    attendanceSessions,
    markBriefingAsRead,
    acknowledgeBriefing,
    hasAcknowledgedBriefing,
    setHasAcknowledgedBriefing,
    acknowledgeDispatch,
  } = useApp();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Same week boundary convention (Monday -> Sunday) for both KPIs
  const startOfCurWeek = useMemo(() => startOfWeek(time, { weekStartsOn: 1 }), [time]);
  const endOfCurWeek = useMemo(() => endOfWeek(time, { weekStartsOn: 1 }), [time]);

  // KPI #1: GIỜ CA ĐÃ XẾP
  // Total scheduled duration of the employee's effective work assignments for the current week
  // Only includes effective assignments: approved/published normal shifts, manager-assigned shifts, valid dispatch/support
  // Pending registration requests are NOT counted. Cancelled/removed are NOT counted.
  const scheduledWorkHours = useMemo(() => {
    return availableShifts
      .filter((s) => {
        const sDate = s.date instanceof Date ? s.date : new Date(s.date);
        const isEffectiveSchedule = s.status === "approved" || s.status === "assigned";
        return isEffectiveSchedule && sDate >= startOfCurWeek && sDate <= endOfCurWeek;
      })
      .reduce((sum, s) => sum + (s.hours || 0), 0);
  }, [availableShifts, startOfCurWeek, endOfCurWeek]);

  // KPI #2: GIỜ CÔNG THỰC TẾ
  // Total current official/effective work hours recorded for the employee during the current week
  // Derived from existing attendance calculation records (actualWorkHours) in the same week
  const allAttendanceRecords = useMemo(() => {
    return getMergedAttendanceRecords(attendanceSessions);
  }, [attendanceSessions]);

  const actualWorkHours = useMemo(() => {
    return allAttendanceRecords
      .filter((r) => {
        const rDate = r.date instanceof Date ? r.date : new Date(r.date);
        return rDate >= startOfCurWeek && rDate <= endOfCurWeek;
      })
      .reduce((sum, r) => sum + (r.actualWorkHours || 0), 0);
  }, [allAttendanceRecords, startOfCurWeek, endOfCurWeek]);

  const registeredShifts = availableShifts
    .filter((t) => t.status === "approved" || t.status === "pending")
    .sort((a, b) => (a.date instanceof Date && b.date instanceof Date) ? a.date.getTime() - b.date.getTime() : 0)
    .slice(0, 3);

  // Get today's active briefings
  const todayBriefings = briefings.filter(b => {
    return true;
  });

  const urgentUnackBriefing = todayBriefings.find(b => b.isUrgent && !b.isAcknowledged);
  const otherBriefings = todayBriefings.filter(b => b !== urgentUnackBriefing);

  return (
    <div className="w-full flex flex-col h-full relative">
      <ScreenHeader
        title="Home"
        description="Your daily work overview and important updates"
      />
      <Header />

      <div className="p-4 space-y-4 pb-12">
        {/* Morning Objective / Briefing Section */}
        <section>
          <div className="flex justify-between items-center mb-4 mt-1">
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

        {/* Weekly Work Analysis Card */}
        <section id="weekly-work-analysis-section">
          <div className="flex justify-between items-center mb-3 mt-6">
            <h2 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em]">
              Phân tích công / Tuần
            </h2>
            <Link
              id="weekly-analysis-detail-link"
              to="/timesheet"
              className="text-[10px] font-bold text-[#558BAD] bg-[#F0F6FA] border border-[#558BAD]/20 px-2.5 py-1 rounded-lg hover:bg-[#E2EDF4] flex items-center uppercase tracking-wide transition-colors"
            >
              Chi tiết <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

          <div
            id="weekly-work-analysis-card"
            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-card"
          >
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              {/* KPI #1: GIỜ CA ĐÃ XẾP */}
              <div id="kpi-scheduled-hours" className="pr-3 sm:pr-4 flex flex-col justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 leading-tight">
                  Giờ ca đã xếp
                </p>
                <div className="flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-extrabold font-display text-[#558BAD] tracking-tight">
                    {formatWorkHours(scheduledWorkHours)}
                  </span>
                </div>
              </div>

              {/* KPI #2: GIỜ CÔNG THỰC TẾ */}
              <div id="kpi-actual-hours" className="pl-3 sm:pl-4 flex flex-col justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 leading-tight">
                  Giờ công thực tế
                </p>
                <div className="flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-extrabold font-display text-[#558BAD] tracking-tight">
                    {formatWorkHours(actualWorkHours)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
