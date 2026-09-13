import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import ScreenHeader from "@/components/ScreenHeader";
import { useApp, Shift } from "@/context/AppContext";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  Users,
  MapPin,
  Search,
  Send,
  CheckCircle2,
  CalendarDays,
  Sun,
  Moon,
  Sunset,
  Lock,
  Flame,
  AlertCircle,
  RefreshCw,
  Shield,
  Filter,
  X,
  Building2,
  Sparkles,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";

import Toast, { ToastType } from "@/components/Toast";

type TabView = "my-schedule" | "register";

const MOCK_ROSTER = [
  {
    id: "1",
    name: "Đoàn Tú",
    role: "Store Manager",
    avatar: "https://i.pravatar.cc/150?u=a04258a",
  },
  {
    id: "2",
    name: "Thanh Nhàn",
    role: "Thu ngân",
    avatar: "https://i.pravatar.cc/150?u=a04258b",
  },
  {
    id: "3",
    name: "Minh Quang",
    role: "Tư vấn",
    avatar: "https://i.pravatar.cc/150?u=a04258c",
  },
];

// --- UI RENDER HELPERS ---
const getShiftIcon = (shiftName: string) => {
  if (shiftName.includes("Sáng"))
    return <Sun className="w-4 h-4 text-orange-500" />;
  if (shiftName.includes("Chiều"))
    return <Sunset className="w-4 h-4 text-orange-600" />;
  if (shiftName.includes("Đêm"))
    return <Moon className="w-4 h-4 text-purple-600" />;
  return <Clock className="w-4 h-4 text-gray-400" />;
};

const renderStatus = (status: string) => {
  switch (status) {
    case "approved":
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-soft">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Đã duyệt
        </span>
      );
    case "pending":
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-soft">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Chờ duyệt
        </span>
      );
    case "assigned":
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#558BAD] bg-[#F0F6FA] border border-[#558BAD]/30 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-soft">
          <span className="w-1.5 h-1.5 rounded-full bg-[#558BAD]"></span>Gán tay
        </span>
      );
    case "full":
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200/80 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-soft">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Đã đầy
        </span>
      );
    case "rejected":
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200/80 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-soft">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Từ chối
        </span>
      );
    case "cancelled":
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-soft">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Huỷ đăng ký
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-soft">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Còn trống
        </span>
      );
  }
};

const ShiftAuditInfoTooltip: React.FC<{ shift: Shift }> = ({ shift }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleDocumentClick = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [isOpen]);

  // Xác định người tạo
  const creator =
    shift.createdBy ||
    (shift.status === "open" || shift.isBuddyStore
      ? "Hệ thống (Auto-schedule)"
      : "Phan Hải Đăng (CHT)");

  // Xác định thời gian tạo
  const shiftDate = shift.date instanceof Date ? shift.date : new Date(shift.date);
  const createdAt = shift.createdAt
    ? (shift.createdAt instanceof Date ? shift.createdAt : new Date(shift.createdAt))
    : new Date(shiftDate.getTime() - 3 * 24 * 3600 * 1000 + 8 * 3600 * 1000);

  // Xác định thời gian cập nhật trạng thái
  const statusUpdatedAt = shift.statusUpdatedAt
    ? (shift.statusUpdatedAt instanceof Date ? shift.statusUpdatedAt : new Date(shift.statusUpdatedAt))
    : (shift.createdAt || createdAt);

  return (
    <div
      ref={tooltipRef}
      className="relative inline-flex items-center group/tooltip"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="p-1 rounded-md text-slate-400 hover:text-[#558BAD] hover:bg-slate-100 transition-colors focus:outline-none focus:ring-1 focus:ring-[#558BAD]/40 cursor-pointer"
        title="Xem thông tin ca"
        aria-label="Xem thông tin ca"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {/* Tooltip Content */}
      <div
        className={cn(
          "absolute right-0 top-full mt-2 w-64 p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700/80 z-50 transition-all duration-150 text-left",
          isOpen
            ? "opacity-100 translate-y-0 visible pointer-events-auto"
            : "opacity-0 -translate-y-1 invisible pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:visible group-hover/tooltip:translate-y-0 group-hover/tooltip:pointer-events-auto",
        )}
      >
        {/* Pointer Arrow */}
        <div className="absolute -top-1.5 right-2.5 w-3 h-3 bg-slate-900 border-t border-l border-slate-700/80 rotate-45 transform" />

        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-200">
            <Info className="w-3.5 h-3.5 text-[#88B3D0] shrink-0" />
            <span>Thông tin ca làm việc</span>
          </div>

          <div className="space-y-1.5 text-[11px] leading-snug">
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-400 shrink-0">Người tạo:</span>
              <span className="text-slate-100 font-medium text-right">{creator}</span>
            </div>

            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400 shrink-0">Thời gian tạo:</span>
              <span className="text-slate-100 font-medium font-mono text-right">
                {format(createdAt, "dd/MM/yyyy HH:mm")}
              </span>
            </div>

            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400 shrink-0">Cập nhật trạng thái:</span>
              <span className="text-emerald-400 font-medium font-mono text-right">
                {format(statusUpdatedAt, "dd/MM/yyyy HH:mm")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SharedShiftCard: React.FC<{
  shift: Shift;
  user: any;
  isDisabled?: boolean;
  isPast?: boolean;
  isPreview?: boolean;
  onClick: () => void;
  key?: string | number;
}> = ({ shift, user, isDisabled, isPast, isPreview, onClick }) => {
  // CR-12SEP-01: Branch Eligibility
  // Normal shift registration is restricted to Employee.ActiveWorkingBranches.
  // Support shifts are allowed across branches.
  const isBranchEligible =
    shift.isSupportShift ||
    (user?.workingBranches
      ? user.workingBranches.some(
          (b: any) =>
            b.status === "ACTIVE" &&
            (b.branchName === shift.storeName || b.branchId === shift.branchId)
        )
      : user?.authorizedBranches?.includes(shift.storeName) ?? true);

  // CR-12SEP-02: Skill Eligibility
  const userActiveSkills = user?.skillTags
    ? user.skillTags.filter((st: any) => st.status === "ACTIVE").map((st: any) => st.skillTagName)
    : user?.skills || [];

  const matchedSlots = (shift.slots ? shift.slots.map((s) => s.skillTag) : [shift.skillTag]).filter(
    (tag) => userActiveSkills.includes(tag)
  );
  const hasMatchedSlot = matchedSlots.length > 0;

  // Capacity / Slot Availability Check
  const isOverallFull = shift.maxStaff > 0 && (shift.currentStaff || 0) >= shift.maxStaff;
  const hasAvailableSlotForUser = shift.slots
    ? shift.slots.some((s) => userActiveSkills.includes(s.skillTag) && s.current < s.max)
    : !isOverallFull;

  const isShiftFull = isOverallFull || (shift.slots ? !hasAvailableSlotForUser : false);
  const isEligible = isBranchEligible && hasMatchedSlot && !isShiftFull;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "w-full text-left p-5 mb-4 rounded-2xl relative transition-all flex flex-col focus:outline-none",
        shift.status === "cancelled"
          ? "opacity-50 bg-slate-50 border border-slate-200 grayscale cursor-not-allowed"
          : !isBranchEligible || !hasMatchedSlot
            ? "opacity-75 bg-slate-50/90 border border-slate-200/80"
            : isShiftFull
              ? "opacity-80 bg-slate-50 border border-slate-200"
              : isDisabled
                ? "opacity-90 bg-slate-50/80 border border-slate-200"
                : "hover:shadow-lg hover:-translate-y-0.5 bg-white border border-slate-100 shadow-card",
      )}
    >
      <div className="flex justify-between items-start w-full">
        <div className="flex-1">
          <p className="font-display text-2xl font-black text-slate-900 tracking-tight">
            {shift.timeStr}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{shift.hours}h</span>
            <span className="text-slate-200 text-[10px]">•</span>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              {shift.date instanceof Date ? format(shift.date, "dd/MM") : ""}
            </span>
          </div>
        </div>
        <div className="text-right flex-1 flex flex-col items-end">
          <div className="flex flex-col items-end gap-1.5">
            {isPast && (
              <span className="text-[8px] font-black bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-widest">
                Lịch đã chốt
              </span>
            )}
            {isPreview && (
              <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-widest">
                Chưa mở
              </span>
            )}
            {shift.isSupportShift && (
              <span className="text-[8px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase tracking-widest border border-indigo-200">
                HỖ TRỢ
              </span>
            )}
            <h3
              className={cn(
                "font-bold text-sm tracking-tight",
                !isEligible ? "text-slate-400" : "text-slate-900",
              )}
            >
              {shift.shiftName}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#558BAD] mt-1 max-w-full truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{shift.storeName || "Home Store"}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 w-full pt-4 border-t border-slate-100/50">
        {!isBranchEligible ? (
          <span className="text-[10px] text-amber-700 font-extrabold uppercase tracking-widest flex items-center bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
            <Lock className="w-3 h-3 mr-1.5 shrink-0 text-amber-600" /> Ngoài chi nhánh làm việc
          </span>
        ) : !hasMatchedSlot ? (
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center bg-slate-100 px-2 py-0.5 rounded-md">
            <Lock className="w-3 h-3 mr-1.5 opacity-60" /> Không đúng kỹ năng
          </span>
        ) : isShiftFull ? (
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest flex items-center bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
            <Lock className="w-3 h-3 mr-1.5 text-slate-400" /> Ca đã đầy
          </span>
        ) : isDisabled ? (
          <span className="text-[10px] font-extrabold text-slate-400 flex items-center uppercase tracking-widest">
            {isPast ? "Chế độ xem lại" : "Sắp mở đăng ký"}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#558BAD] bg-[#F0F6FA] px-2 py-0.5 rounded-md border border-[#558BAD]/20">
              {matchedSlots.join(" · ")}
            </span>
            <span className="text-[10px] font-extrabold text-[#558BAD] flex items-center transition-colors uppercase tracking-widest">
              Đăng ký
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-1.5">
            {[...Array(Math.min(shift.currentStaff || 0, 3))].map((_, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center overflow-hidden z-10 shadow-soft"
              >
                <img
                  src={`https://i.pravatar.cc/100?u=${shift.id}_${i}`}
                  alt="Avatar"
                />
              </div>
            ))}
          </div>
          {shift.maxStaff > shift.currentStaff ? (
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              +{(shift.maxStaff || 1) - (shift.currentStaff || 0)} Trống
            </span>
          ) : (
            <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-wider border border-amber-200">
              Đã đủ
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

export default function Schedule() {
  const {
    user,
    availableShifts,
    registeredHours,
    maxHoursPerWeek,
    handleShiftAction,
    acknowledgeDispatch,
    hasLeaveConflict,
    getLeaveRequestsByDateRange,
    qaNotificationScenario,
    setQaDiagnosticResult,
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabView>("my-schedule");
  const [searchParams] = useSearchParams();
  const [highlightedShiftId, setHighlightedShiftId] = useState<string | null>(null);
  const [myScheduleSubTab, setMyScheduleSubTab] = useState<"active" | "history">("active");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [searchQuery, setSearchQuery] = useState("");
  const [regSearchQuery, setRegSearchQuery] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("");
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>("");
  const [onlyFitFilter, setOnlyFitFilter] = useState<boolean>(false);
  const [timeFrom, setTimeFrom] = useState<string>("");
  const [timeTo, setTimeTo] = useState<string>("");

  const [tempSelectedStatuses, setTempSelectedStatuses] = useState<string[]>([]);
  const [tempBranchFilter, setTempBranchFilter] = useState<string>("");
  const [tempSkillFilter, setTempSkillFilter] = useState<string>("");
  const [tempOnlyFitFilter, setTempOnlyFitFilter] = useState<boolean>(false);
  const [tempTimeFrom, setTempTimeFrom] = useState<string>("");
  const [tempTimeTo, setTempTimeTo] = useState<string>("");

  // Register View offset
  const [weekOffset, setWeekOffset] = useState(1);

  // Modals
  const [showRoster, setShowRoster] = useState<Shift | null>(null);
  const [showSwap, setShowSwap] = useState<Shift | null>(null);
  const [swapSearchQuery, setSwapSearchQuery] = useState<string>("");
  const [shiftDetailModal, setShiftDetailModal] = useState<Shift | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);
  const [calWeekOffset, setCalWeekOffset] = useState<number>(0);

  const startOfCurWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const viewCalWeekStart = addDays(startOfCurWeek, calWeekOffset * 7);
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    addDays(viewCalWeekStart, i),
  );

  // Active branches and skills for employee
  const userActiveWorkingBranches = useMemo(() => {
    return user?.workingBranches
      ? user.workingBranches.filter((b: any) => b.status === "ACTIVE").map((b: any) => b.branchName)
      : user?.authorizedBranches || [];
  }, [user]);

  const userActiveSkills = useMemo(() => {
    return user?.skillTags
      ? user.skillTags.filter((st: any) => st.status === "ACTIVE").map((st: any) => st.skillTagName)
      : user?.skills || [];
  }, [user]);

  // --- GET DATA ---
  const activeShiftStatuses = ["approved", "pending", "assigned"];
  const historyShiftStatuses = ["rejected", "cancelled"];

  const myShiftsThisWeek = availableShifts.filter((s) =>
    activeShiftStatuses.includes(s.status) || historyShiftStatuses.includes(s.status)
  );

  const myShiftsTodayRaw = myShiftsThisWeek.filter((s) =>
    isSameDay(s.date, selectedDate),
  );

  const myShiftsToday = myShiftsTodayRaw.filter((s) => {
    // Search query: shiftName, storeName, skillTag
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = s.shiftName.toLowerCase().includes(q);
      const matchStore = s.storeName?.toLowerCase().includes(q);
      const matchSkill = (s.assignedSkillTagId || s.requestedSkillTagId || s.skillTag)?.toLowerCase().includes(q);
      if (!matchName && !matchStore && !matchSkill) return false;
    }
    // Status filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(s.status)) {
      return false;
    }
    // Branch filter
    if (selectedBranchFilter && s.storeName !== selectedBranchFilter) {
      return false;
    }
    // Skill filter
    if (selectedSkillFilter && (s.assignedSkillTagId || s.requestedSkillTagId || s.skillTag) !== selectedSkillFilter) {
      return false;
    }
    // Time filter
    if (timeFrom || timeTo) {
      const [shiftStartStr, shiftEndStr] = s.timeStr.split(" - ");
      if (timeFrom && shiftStartStr < timeFrom) return false;
      if (timeTo && shiftEndStr > timeTo) return false;
    }
    return true;
  });

  const activeShiftsToday = myShiftsToday.filter(s => activeShiftStatuses.includes(s.status));
  const historyShiftsToday = myShiftsToday.filter(s => historyShiftStatuses.includes(s.status));

  // Filter shifts based on weekOffset for Registration Tab
  const targetWeekStart = addDays(startOfCurWeek, weekOffset * 7);
  const targetWeekEnd = addDays(targetWeekStart, 7);

  const nextWeekShiftsByDate = availableShifts
    .filter((s) => s.date >= targetWeekStart && s.date < targetWeekEnd)
    .filter((s) => {
      // Search query in Registration tab
      if (regSearchQuery) {
        const q = regSearchQuery.toLowerCase();
        const matchName = s.shiftName.toLowerCase().includes(q);
        const matchStore = s.storeName?.toLowerCase().includes(q);
        if (!matchName && !matchStore) return false;
      }
      // Branch filter
      if (selectedBranchFilter && s.storeName !== selectedBranchFilter) {
        return false;
      }
      // Skill filter
      if (selectedSkillFilter) {
        const hasSkill = s.slots
          ? s.slots.some((slot) => slot.skillTag === selectedSkillFilter)
          : s.skillTag === selectedSkillFilter;
        if (!hasSkill) return false;
      }
      // Only fit filter
      if (onlyFitFilter) {
        const isBranchOk = s.isSupportShift || userActiveWorkingBranches.includes(s.storeName);
        const isSkillOk = s.slots
          ? s.slots.some((slot) => userActiveSkills.includes(slot.skillTag))
          : userActiveSkills.includes(s.skillTag);
        if (!isBranchOk || !isSkillOk) return false;
      }
      return true;
    })
    .reduce((acc: Record<string, Shift[]>, shift) => {
      const sDate = shift.date instanceof Date ? shift.date : new Date(shift.date);
      if (isNaN(sDate.getTime())) return acc;
      
      const dayKey = sDate.toISOString();
      if (!acc[dayKey]) acc[dayKey] = [];
      acc[dayKey].push(shift);
      return acc;
    }, {});

  const getDayDotVariant = (date: Date) => {
    const shift = myShiftsThisWeek.find((s) => isSameDay(s.date, date));
    if (!shift) return "bg-transparent";
    return shift.status === "approved" ? "bg-success" : "bg-warning";
  };

  const availableShiftsRef = useRef(availableShifts);
  availableShiftsRef.current = availableShifts;

  const handledShiftIdRef = useRef<string | null>(null);

  const shiftIdParam = searchParams.get("shiftId");
  const requestedDateStr = searchParams.get("date");

  // Handle Contextual Navigation from Notifications (SHIFT group)
  useEffect(() => {
    if (shiftIdParam) {
      if (handledShiftIdRef.current === shiftIdParam) {
        return;
      }
      handledShiftIdRef.current = shiftIdParam;

      // Find shift in availableShifts to get its real date & current status
      const targetShift = availableShiftsRef.current.find((s) => s.id === shiftIdParam);

      if (!targetShift) {
        setActiveTab("my-schedule");
        setToast({
          message: "Ca làm việc này không còn khả dụng trên lịch hiện tại.",
          type: "info"
        });
        if (qaNotificationScenario?.id === "QA-10") {
          setQaDiagnosticResult({
            scenarioId: "QA-10",
            timestamp: new Date(),
            status: "PASS",
            details: "Xác minh an toàn: Mục tiêu SHIFT-MISSING-999 không tồn tại, chuyển về Lịch cá nhân, không highlight ca lạ, hiển thị Toast.",
            currentTab: "Lịch cá nhân",
          });
        }
        return;
      }

      // Switch to my-schedule tab
      setActiveTab("my-schedule");

      // Set sub-tab based on real shift status
      if (targetShift.status === "cancelled" || targetShift.status === "rejected") {
        setMyScheduleSubTab("history");
      } else {
        setMyScheduleSubTab("active");
      }

      // Calculate the date of the shift
      const shiftDate = targetShift.date instanceof Date ? targetShift.date : new Date(targetShift.date);
      setSelectedDate(shiftDate);

      // Adjust calWeekOffset so the shift's week is visible in the top weekly strip
      const shiftWeekStart = startOfWeek(shiftDate, { weekStartsOn: 1 });
      const curWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const diffWeeks = Math.round((shiftWeekStart.getTime() - curWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
      setCalWeekOffset(diffWeeks);

      // Reset filters so the card is visible
      setSearchQuery("");
      setSelectedStatuses((prev) => (prev.length === 0 ? prev : []));
      setSelectedBranchFilter("");
      setSelectedSkillFilter("");
      setTimeFrom("");
      setTimeTo("");

      // Set highlight
      setHighlightedShiftId(shiftIdParam);

      // Smooth scroll to card
      setTimeout(() => {
        const el = document.getElementById(`shift-card-${shiftIdParam}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);

      // Clear highlight after 1.8s (approx 2 pulses, 1.5 - 2 seconds)
      const timer = setTimeout(() => {
        setHighlightedShiftId(null);
      }, 1800);

      if (qaNotificationScenario) {
        setQaDiagnosticResult({
          scenarioId: qaNotificationScenario.id,
          timestamp: new Date(),
          status: "PASS",
          details: `Đã định vị chính xác Ca làm việc [${shiftIdParam}] trên Lịch cá nhân, điều chỉnh tuần/ngày phù hợp và kích hoạt highlight 1.8s.`,
          locatedEntityId: shiftIdParam,
          currentTab: "Lịch cá nhân",
        });
      }

      return () => clearTimeout(timer);
    } else {
      handledShiftIdRef.current = null;
      if (requestedDateStr) {
        const parsedDate = new Date(requestedDateStr);
        if (!isNaN(parsedDate.getTime())) {
          setActiveTab("my-schedule");
          setSelectedDate(parsedDate);
        }
      }
    }
  }, [shiftIdParam, requestedDateStr]);

  return (
    <div className="flex flex-col h-full bg-background pb-10">
      {/* Header & Tabs */}
      <div className="bg-surface sticky top-0 z-30 shadow-soft border-b border-slate-100 flex flex-col">
        <ScreenHeader
          title="Work Schedule"
          description="View and manage your assigned work shifts"
        />

        <div className="px-4 pb-3">
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab("my-schedule")}
              className={cn(
                "flex-1 py-2 text-[13px] transition-all rounded-lg font-bold tracking-tight",
                activeTab === "my-schedule"
                  ? "bg-white text-[#558BAD] shadow-sm border border-[#558BAD]/20"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              Lịch cá nhân
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={cn(
                "flex-1 py-2 text-[13px] transition-all rounded-lg font-bold tracking-tight",
                activeTab === "register"
                  ? "bg-white text-[#558BAD] shadow-sm border border-[#558BAD]/20"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              Đăng ký ca
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <AnimatePresence>
          {toast && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast(null)} 
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ======================= TAB 1: MY SCHEDULE ======================= */}
          {activeTab === "my-schedule" && (
            <motion.div
              key="my-schedule"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4"
            >
              {/* Horizontal Calendar */}
              <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-slate-400" /> Tháng {(weekDays[0] instanceof Date ? format(weekDays[0], "MM, yyyy") : "")}
                  </h3>
                  <div className="flex gap-1.5">
                    <button onClick={() => setCalWeekOffset(prev => prev - 1)} className="w-8 h-8 bg-white hover:bg-slate-50 flex items-center justify-center rounded-lg border border-slate-100 shadow-soft transition-all active:scale-95">
                      <ChevronLeft className="w-4 h-4 text-slate-400" />
                    </button>
                    <button onClick={() => setCalWeekOffset(prev => prev + 1)} className="w-8 h-8 bg-white hover:bg-slate-50 flex items-center justify-center rounded-lg border border-slate-100 shadow-soft transition-all active:scale-95">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  {weekDays.map((day) => {
                    const isSelected = isSameDay(day, selectedDate);
                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className="flex flex-col items-center gap-2.5 cursor-pointer group"
                      >
                        <span
                          className={cn(
                            "text-[9px] font-extrabold uppercase transition-colors tracking-widest leading-none",
                            isSelected ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600",
                          )}
                        >
                          {format(day, "EEE", { locale: vi }).replace(
                            "th ",
                            "T",
                          )}
                        </span>
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all relative overflow-hidden",
                            isSelected
                              ? "bg-[#558BAD] text-white shadow-md shadow-[#558BAD]/30"
                              : "bg-slate-50 text-slate-600 group-hover:bg-slate-100",
                          )}
                        >
                          {format(day, "d")}
                          {isSelected && (
                            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white"></div>
                          )}
                        </div>
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full transition-colors",
                            getDayDotVariant(day).replace("bg-success", "bg-[#558BAD]"),
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm ca, chi nhánh, vị trí..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#558BAD]/20 focus:border-[#558BAD] transition-all placeholder:text-slate-400 text-slate-900"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setTempSelectedStatuses(selectedStatuses);
                      setTempBranchFilter(selectedBranchFilter);
                      setTempSkillFilter(selectedSkillFilter);
                      setTempOnlyFitFilter(onlyFitFilter);
                      setTempTimeFrom(timeFrom);
                      setTempTimeTo(timeTo);
                      setIsFilterModalOpen(true);
                    }}
                    className={cn(
                      "flex items-center justify-center w-[42px] h-[42px] rounded-xl border transition-all shrink-0",
                      selectedStatuses.length > 0 || selectedBranchFilter || selectedSkillFilter || onlyFitFilter || timeFrom || timeTo
                        ? "bg-[#F0F6FA] border-[#558BAD]/30 text-[#558BAD]"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>

                {/* Applied Filter Chips */}
                {(selectedStatuses.length > 0 || selectedBranchFilter || selectedSkillFilter || onlyFitFilter || timeFrom || timeTo) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedBranchFilter && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0F6FA] text-[#558BAD] text-[10px] font-bold border border-[#558BAD]/20">
                        <MapPin className="w-3 h-3 text-[#558BAD]" /> {selectedBranchFilter}
                        <button onClick={() => setSelectedBranchFilter("")} className="hover:text-[#375A72]">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {selectedSkillFilter && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0F6FA] text-[#558BAD] text-[10px] font-bold border border-[#558BAD]/20">
                        Vị trí: {selectedSkillFilter}
                        <button onClick={() => setSelectedSkillFilter("")} className="hover:text-[#375A72]">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {onlyFitFilter && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0F6FA] text-[#558BAD] text-[10px] font-bold border border-[#558BAD]/20">
                        <CheckCircle2 className="w-3 h-3 text-[#558BAD]" /> Chỉ ca phù hợp
                        <button onClick={() => setOnlyFitFilter(false)} className="hover:text-[#375A72]">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {selectedStatuses.map(status => {
                      let label = "";
                      switch (status) {
                        case "pending": label = "Chờ duyệt"; break;
                        case "approved": label = "Đã duyệt"; break;
                        case "assigned": label = "Gán tay"; break;
                        case "rejected": label = "Từ chối"; break;
                        case "cancelled": label = "Huỷ đăng ký"; break;
                      }
                      return (
                        <span key={status} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0F6FA] text-[#558BAD] text-[10px] font-bold border border-[#558BAD]/20">
                          {label}
                          <button onClick={() => setSelectedStatuses(prev => prev.filter(s => s !== status))} className="hover:text-[#375A72]">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                    {(timeFrom || timeTo) && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0F6FA] text-[#558BAD] text-[10px] font-bold border border-[#558BAD]/20">
                        {timeFrom || "00:00"} - {timeTo || "23:59"}
                        <button onClick={() => { setTimeFrom(""); setTimeTo(""); }} className="hover:text-[#375A72]">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setSelectedStatuses([]);
                        setSelectedBranchFilter("");
                        setSelectedSkillFilter("");
                        setOnlyFitFilter(false);
                        setTimeFrom("");
                        setTimeTo("");
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-700 ml-1 underline decoration-slate-300 underline-offset-2"
                    >
                      Xoá tất cả
                    </button>
                  </div>
                )}
              </div>

              {/* Segmented Control */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-2 border border-slate-200">
                <button
                  onClick={() => setMyScheduleSubTab("active")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                    myScheduleSubTab === "active"
                      ? "bg-white text-[#558BAD] shadow-sm border border-[#558BAD]/20"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Đang hiệu lực {activeShiftsToday.length > 0 && `(${activeShiftsToday.length})`}
                </button>
                <button
                  onClick={() => setMyScheduleSubTab("history")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                    myScheduleSubTab === "history"
                      ? "bg-white text-[#558BAD] shadow-sm border border-[#558BAD]/20"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Không còn hiệu lực {historyShiftsToday.length > 0 && `(${historyShiftsToday.length})`}
                </button>
              </div>
              
              {myScheduleSubTab === "history" && (
                <p className="text-[11px] text-slate-500 mb-3 px-1">
                  Chỉ hiển thị các ca đã bị từ chối hoặc đã huỷ đăng ký.
                </p>
              )}

              {/* Shift List for Selected Day */}
              <h3 className="text-sm font-bold text-text-main pl-1 mb-2 mt-2">
                Ngày {(selectedDate instanceof Date ? format(selectedDate, "dd/MM/yyyy") : "")}
              </h3>

              {(() => {
                 const leaves = getLeaveRequestsByDateRange(selectedDate, selectedDate);
                 const pendingLeave = leaves.find(l => l.status === "Chờ duyệt");
                 const approvedLeave = leaves.find(l => l.status === "Đã duyệt");
                 
                 if (myScheduleSubTab === "active" && approvedLeave) {
                    return (
                       <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex gap-3 text-green-800">
                          <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
                          <div>
                             <p className="text-sm font-bold">Đã nghỉ phép</p>
                             <p className="text-xs font-medium mt-0.5 opacity-80">{approvedLeave.type} • {approvedLeave.reason}</p>
                          </div>
                       </div>
                    );
                 }
                 
                 const currentTabShifts = myScheduleSubTab === "active" ? activeShiftsToday : historyShiftsToday;

                 return (
                   <>
                     {myScheduleSubTab === "active" && pendingLeave && (
                       <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-3 text-amber-800 text-sm font-bold items-center mb-2">
                         <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                         Có đơn nghỉ phép đang chờ duyệt
                       </div>
                     )}
                     
                     {currentTabShifts.length > 0 ? (
                       <div className="space-y-3 px-0.5 pb-2">
                         {currentTabShifts.map((shift) => (
                    <div
                      key={shift.id}
                      id={`shift-card-${shift.id}`}
                      className={cn(
                        "relative flex flex-col p-4 sm:p-5 rounded-2xl border-2 transition-all group",
                        highlightedShiftId === shift.id && "locator-highlight",
                        myScheduleSubTab === "history" || shift.status === "cancelled" || shift.status === "rejected"
                          ? "bg-slate-50 border-slate-200 grayscale opacity-80"
                          : shift.isBuddyStore
                            ? "bg-indigo-50/40 border-indigo-100 hover:border-indigo-200"
                            : "bg-white border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md",
                      )}
                    >
                      {/* Header: Roles + Status */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md",
                              shift.isSupportShift
                                ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                                : shift.isReturnShift
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : shift.isBuddyStore
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-gray-100 text-gray-700",
                            )}
                          >
                            {shift.isSupportShift ? "HỖ TRỢ" : shift.isReturnShift ? "CA QUAY LẠI" : shift.shiftName}
                          </span>
                          <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                            {shift.skillTag}
                          </span>
                          {shift.allowSwap && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Có thể đổi ca
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          {shift.isBuddyStore ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              Điều Phối
                            </span>
                          ) : (
                            renderStatus(shift.status)
                          )}
                          <ShiftAuditInfoTooltip shift={shift} />
                        </div>
                      </div>

                      {/* Time and Location */}
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4 mt-1">
                        <div>
                          <p className="font-mono text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-none mb-2">
                            {shift.timeStr.split(" - ")[0]}
                            <span className="text-gray-400 font-medium mx-1">
                              -
                            </span>
                            {shift.timeStr.split(" - ")[1]}
                          </p>
                          <div
                            className={cn(
                              "flex items-center text-xs font-bold",
                              shift.isBuddyStore
                                ? "text-indigo-600"
                                : "text-gray-500",
                            )}
                          >
                            <MapPin
                              className={cn(
                                "w-3.5 h-3.5 mr-1.5 shrink-0",
                                shift.isBuddyStore
                                  ? "text-indigo-500"
                                  : "text-gray-400",
                              )}
                            />
                            <span className="truncate">{shift.storeName}</span>
                          </div>
                        </div>
                      </div>

                      {((myScheduleSubTab !== "history" && shift.status !== "cancelled" && shift.status !== "rejected") || shift.cancelReason || shift.adhocReason) && (
                        <div
                          className={cn(
                            "w-full h-px border-t-2 border-dashed mb-3",
                            shift.isBuddyStore
                              ? "border-indigo-200"
                              : "border-gray-100",
                          )}
                        ></div>
                      )}

                      {myScheduleSubTab === "history" || shift.status === "cancelled" || shift.status === "rejected" ? (
                         (shift.cancelReason || shift.adhocReason) ? (
                           <div className="pt-1">
                             <p className="text-xs text-slate-500 font-medium">
                               {shift.status === "rejected" ? "Lý do từ chối: " : "Lý do huỷ: "} 
                               <span className="text-slate-700">{shift.cancelReason || shift.adhocReason}</span>
                             </p>
                           </div>
                         ) : null
                      ) : (
                        <>
                          <div className="flex gap-2.5 shrink-0 justify-end w-full">
                            <button
                              onClick={() => setShowRoster(shift)}
                              className={cn(
                                "flex-1 sm:flex-none px-4 py-2 sm:py-2 text-xs font-bold rounded-xl flex items-center justify-center transition-colors border",
                                shift.isBuddyStore
                                  ? "bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                  : "bg-gray-50 border-transparent hover:bg-gray-100 text-gray-700",
                              )}
                            >
                              <Users className="w-4 h-4 flex-shrink-0 sm:mr-1.5" />
                              <span className="">Đội hình</span>
                            </button>
                            {(() => {
                              const today = new Date();
                              const curDay = today.getDay(); // 0 is Sun, 5 is Fri
                              
                              // Simplified week difference:
                              // If shift date is <= this Sunday, diffWeeks <= 0
                              const currentWeekEnd = new Date(today);
                              currentWeekEnd.setDate(today.getDate() + (7 - curDay) % 7);
                              currentWeekEnd.setHours(23, 59, 59, 999);
                              
                              const shiftEnd = new Date(shift.date);
                              const isCurrentOrPastWeek = shiftEnd <= currentWeekEnd;
                              
                              // If shift is next week, is current day >= Friday?
                              let isTimeFenced = false;
                              if (isCurrentOrPastWeek) {
                                  isTimeFenced = true;
                              } else {
                                  // If shift is next week:
                                  const isNextWeek = shiftEnd.getTime() <= currentWeekEnd.getTime() + 7 * 24 * 3600 * 1000;
                                  if (isNextWeek && (curDay === 5 || curDay === 6 || curDay === 0)) {
                                      isTimeFenced = true;
                                  }
                              }

                              // If shift has allowSwap flag enabled, bypass time fence for testing/authorized swap
                              const effectiveTimeFenced = shift.allowSwap ? false : isTimeFenced;
                              const disableSwap = shift.isPendingSwap || shift.status === "cancelled" || effectiveTimeFenced;

                              return (
                                <button
                                  onClick={() => {
                                    if (effectiveTimeFenced) {
                                      setToast({
                                        message: "Đã qua thời hạn Đổi/Hủy ca. Bạn chỉ có thể thao tác từ Thứ 2 đến Thứ 5 của tuần trước khi ca diễn ra.",
                                        type: 'warning'
                                      });
                                    } else {
                                      setShowSwap(shift);
                                    }
                                  }}
                                  disabled={disableSwap}
                                  className={cn(
                                    "flex-1 sm:flex-none px-4 py-2 sm:py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center border",
                                    disableSwap
                                      ? "bg-gray-50/50 border-transparent text-gray-400 cursor-not-allowed"
                                      : shift.isBuddyStore
                                        ? "bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                        : "bg-[#F0F6FA] border-[#558BAD]/30 hover:bg-[#558BAD]/10 text-[#558BAD] font-extrabold shadow-sm active:scale-95",
                                  )}
                                >
                                  <span className="">Đổi ca</span>
                                </button>
                              );
                            })()}
                          </div>

                          {shift.isPendingSwap && (
                            <div className="flex items-center gap-2 mt-4 text-[11px] text-amber-700 font-bold bg-amber-50 border border-amber-100 p-3 rounded-xl uppercase tracking-wide">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                              Khóa do yêu cầu đổi ca
                            </div>
                          )}

                          {shift.requireHandshake && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <div className="bg-[#F0F6FA] border border-[#558BAD]/30 shadow-soft rounded-xl p-4 flex flex-col relative overflow-hidden transition-colors">
                                <div className="flex items-start gap-3 relative z-10 mb-3.5">
                                  <div className="w-8 h-8 rounded-xl bg-[#558BAD]/10 flex items-center justify-center shrink-0 border border-[#558BAD]/20 shadow-soft">
                                    <AlertTriangle className="w-4 h-4 text-[#558BAD]" />
                                  </div>
                                  <div>
                                    <h4 className="text-[11px] font-extrabold text-[#375A72] uppercase tracking-widest leading-tight mb-1">
                                      Lệnh Điều Phát Sinh
                                    </h4>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed pr-2">
                                      Bạn cần xác nhận để mở khóa Check-in tại Cửa
                                      hàng{" "}
                                      <span className="font-bold text-slate-900">
                                        {shift.storeName}
                                      </span>
                                      .
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => acknowledgeDispatch(shift.id)}
                                  className="relative z-10 w-full bg-[#558BAD] hover:bg-[#446E8A] text-white font-bold py-2.5 rounded-xl text-[11px] uppercase tracking-wider transition-all shadow-md shadow-[#558BAD]/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Xác nhận
                                  Handshake
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface border border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                    <Clock className="w-5 h-5 text-gray-300" />
                  </div>
                  {(searchQuery || selectedStatuses.length > 0 || timeFrom || timeTo) ? (
                    <>
                      <p className="text-sm font-semibold text-text-main text-center">
                        Không tìm thấy ca phù hợp
                      </p>
                      <p className="text-xs text-text-muted mt-1 text-center">
                        Hãy thử đổi từ khoá tìm kiếm hoặc điều chỉnh bộ lọc.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedStatuses([]);
                          setTimeFrom("");
                          setTimeTo("");
                        }}
                        className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all active:scale-95"
                      >
                        Xoá bộ lọc
                      </button>
                    </>
                  ) : myScheduleSubTab === "active" ? (
                    <>
                      <p className="text-sm font-semibold text-text-main text-center">
                        Không có ca đang hiệu lực trong ngày này.
                      </p>
                      <p className="text-xs text-text-muted mt-1 text-center">
                        Bạn có thể chuyển sang Đăng ký ca để tìm ca phù hợp.
                      </p>
                      <button
                        onClick={() => setActiveTab("register")}
                        className="mt-4 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl transition-all active:scale-95 shadow-md"
                      >
                        Đăng ký ca
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-text-main text-center">
                        Không có ca bị từ chối hoặc đã huỷ trong ngày này.
                      </p>
                      <p className="text-xs text-text-muted mt-1 text-center">
                        Các ca không còn hiệu lực sẽ được lưu tại đây để bạn dễ theo dõi.
                      </p>
                    </>
                  )}
                </div>
              )}
             </>
            );
          })()}
            </motion.div>
          )}

          {/* ======================= TAB 2: REGISTER ======================= */}
          {activeTab === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4"
            >
              {/* Hard-cap Time-fence Error UI */}
              {(() => {
                return (
                  <>
                    <div className="flex items-center justify-between bg-white border border-slate-100 p-1.5 rounded-2xl mb-8 shadow-soft">
                      <button
                        onClick={() => setWeekOffset((prev) => prev - 1)}
                        className="w-10 h-10 flex items-center justify-center text-slate-600 bg-slate-50 shadow-soft rounded-xl hover:bg-slate-100 transition-all active:scale-95 border border-slate-100"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mb-0.5">
                          {weekOffset === 1 ? "Đang mở đăng ký ca" : 
                           weekOffset === 0 ? "Lịch đã chốt (Chỉ xem)" :
                           weekOffset > 1 ? "Chưa mở đăng ký (Xem trước)" :
                           "Quá khứ (Chỉ xem)"}
                        </span>
                        <div className="text-[13px] font-bold text-slate-900 uppercase tracking-tight whitespace-nowrap">
                          Tuần {targetWeekStart instanceof Date ? Math.ceil(targetWeekStart.getDate() / 7) : "?"} Tháng {targetWeekStart instanceof Date ? format(targetWeekStart, "M") : ""} <span className="opacity-70 ml-1">({targetWeekStart instanceof Date ? format(targetWeekStart, "dd/MM") : ""} - {targetWeekStart instanceof Date ? format(addDays(targetWeekStart, 6), "dd/MM") : ""})</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setWeekOffset((prev) => prev + 1)}
                        className="w-10 h-10 flex items-center justify-center text-slate-600 bg-slate-50 shadow-soft rounded-xl hover:bg-slate-100 transition-all active:scale-95 border border-slate-100"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Registration Search & Filter Controls */}
                    <div className="space-y-3 mb-4">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Tìm ca, chi nhánh..."
                            value={regSearchQuery}
                            onChange={(e) => setRegSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#558BAD]/20 focus:border-[#558BAD] transition-all placeholder:text-slate-400 text-slate-900"
                          />
                          {regSearchQuery && (
                            <button
                              onClick={() => setRegSearchQuery("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setTempSelectedStatuses(selectedStatuses);
                            setTempBranchFilter(selectedBranchFilter);
                            setTempSkillFilter(selectedSkillFilter);
                            setTempOnlyFitFilter(onlyFitFilter);
                            setTempTimeFrom(timeFrom);
                            setTempTimeTo(timeTo);
                            setIsFilterModalOpen(true);
                          }}
                          className={cn(
                            "flex items-center justify-center w-[42px] h-[42px] rounded-xl border transition-all shrink-0",
                            selectedBranchFilter || selectedSkillFilter || onlyFitFilter
                              ? "bg-[#F0F6FA] border-[#558BAD]/30 text-[#558BAD]"
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          <Filter className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick Filter Pill Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setOnlyFitFilter(prev => !prev)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                            onlyFitFilter
                              ? "bg-[#558BAD] text-white border-[#558BAD] shadow-sm"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Chỉ ca phù hợp
                        </button>

                        {selectedBranchFilter && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0F6FA] text-[#558BAD] text-[10px] font-bold border border-[#558BAD]/20">
                            <MapPin className="w-3 h-3 text-[#558BAD]" /> {selectedBranchFilter}
                            <button onClick={() => setSelectedBranchFilter("")} className="hover:text-[#375A72]">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )}

                        {selectedSkillFilter && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0F6FA] text-[#558BAD] text-[10px] font-bold border border-[#558BAD]/20">
                            Vị trí: {selectedSkillFilter}
                            <button onClick={() => setSelectedSkillFilter("")} className="hover:text-[#375A72]">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )}

                        {(selectedBranchFilter || selectedSkillFilter || onlyFitFilter || regSearchQuery) && (
                          <button
                            onClick={() => {
                              setSelectedBranchFilter("");
                              setSelectedSkillFilter("");
                              setOnlyFitFilter(false);
                              setRegSearchQuery("");
                            }}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-700 ml-1 underline decoration-slate-300 underline-offset-2"
                          >
                            Xoá lọc
                          </button>
                        )}
                      </div>
                    </div>

                    {Object.keys(nextWeekShiftsByDate).length === 0 ? (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center my-4">
                        <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700">
                          Không tìm thấy ca phù hợp với điều kiện tìm kiếm
                        </p>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                          Hãy thử tắt bộ lọc "Chỉ ca phù hợp" hoặc đổi từ khoá tìm kiếm.
                        </p>
                        <button
                          onClick={() => {
                            setSelectedBranchFilter("");
                            setSelectedSkillFilter("");
                            setOnlyFitFilter(false);
                            setRegSearchQuery("");
                          }}
                          className="mt-4 px-4 py-2 bg-[#558BAD] text-white font-bold text-xs rounded-xl transition-all active:scale-95 shadow-sm"
                        >
                          Xoá bộ lọc
                        </button>
                      </div>
                    ) : (
                      (Object.entries(nextWeekShiftsByDate).sort((a,b) => a[0].localeCompare(b[0])) as [string, Shift[]][]).map(
                        ([dateStr, shifts]) => (
                          <div key={dateStr} className="space-y-2">
                            <h3 className="text-sm font-bold text-text-main pt-4 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-slate-200 block"></span>
                              {(() => {
                                const d = new Date(dateStr);
                                return isNaN(d.getTime()) ? dateStr : format(d, "EEEE, dd/MM", { locale: vi });
                              })()}
                            </h3>

                            <div className="space-y-3 px-0.5 mt-2">
                              {(shifts as Shift[]).map((shift) => {
                                const isDisabled = weekOffset !== 1;

                                return (
                                  <SharedShiftCard
                                    key={shift.id}
                                    shift={shift}
                                    user={user}
                                    isDisabled={isDisabled}
                                    isPast={weekOffset <= 0}
                                    isPreview={weekOffset >= 2}
                                    onClick={() => {
                                      if (hasLeaveConflict(shift.date)) {
                                        setToast({ message: "Trùng lịch nghỉ phép.", type: 'error' });
                                        return;
                                      }
                                      setShiftDetailModal(shift);
                                      const firstAvailableSlot =
                                        shift.slots?.find(
                                          (s) =>
                                            userActiveSkills.includes(s.skillTag) &&
                                            s.current < s.max,
                                        );
                                      setSelectedSlotId(
                                        firstAvailableSlot?.id || null,
                                      );
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ),
                      )
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ======================= MODAL: ROSTER ======================= */}
      <AnimatePresence>
        {showRoster && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end"
            onClick={() => setShowRoster(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-t-2xl p-5 pb-safe flex flex-col max-h-[85vh] shadow-[0_-8px_30px_rgb(0,0,0,0.12)]"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 shrink-0"></div>

              <div className="mb-8 text-center">
                <h3 className="text-xl font-bold text-text-main mb-1">
                  Đội hình cửa hàng
                </h3>
                <p className="text-sm font-medium text-gray-500">
                  {showRoster.shiftName} -{" "}
                  {showRoster.date instanceof Date ? format(showRoster.date, "dd/MM/yyyy") : "N/A"}
                </p>
              </div>

              <div className="space-y-6 overflow-y-auto w-full pb-8">
                {MOCK_ROSTER.map((member, idx) => (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center justify-between",
                      idx !== MOCK_ROSTER.length - 1
                        ? "border-b border-gray-100 pb-6"
                        : "",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={member.avatar}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full bg-gray-100 object-cover"
                      />
                      <div>
                        <p className="text-base font-bold text-text-main">
                          {member.name}
                        </p>
                        <p className="text-sm font-medium text-gray-400">
                          {member.role === "Store Manager"
                            ? "Quản lý"
                            : "Nhân viên"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold tracking-wide text-gray-400 uppercase">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================= MODAL: SWAP CONFIG ======================= */}
      <AnimatePresence>
        {showSwap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end"
            onClick={() => setShowSwap(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-t-2xl px-5 pt-5 pb-8 flex flex-col max-h-[90vh] shadow-[0_-8px_30px_rgb(0,0,0,0.12)]"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 shrink-0"></div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900">
                  Nhường / Đổi ca
                </h3>
                <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide uppercase">
                  Quy trình 3 bước
                </span>
              </div>

              <div className="flex-1 overflow-y-auto mb-4 space-y-8 pb-4">
                <div className="space-y-4 px-1">
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-400">
                    Ca của bạn
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium whitespace-nowrap mr-4 flex items-center gap-2">
                      {getShiftIcon(showSwap.shiftName)} {showSwap.shiftName}
                    </span>
                    <span className="font-bold text-gray-900 text-right">
                      {showSwap.date instanceof Date ? format(showSwap.date, "dd/MM/yyyy") : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Khung giờ</span>
                    <span className="font-bold text-gray-900">
                      {showSwap.timeStr}{" "}
                      <span className="text-gray-400 font-medium ml-1">
                        ({showSwap.hours}h)
                      </span>
                    </span>
                  </div>
                </div>

                {/* Progress Flow */}
                <div className="px-1 pt-2">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-400 mb-2">
                    <div className="flex flex-col items-center gap-2 text-primary">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                        1
                      </div>
                      <span className="tracking-wide">Bạn Gửi</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-100 mx-3 mt-[-16px]"></div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 text-gray-400 flex items-center justify-center">
                        2
                      </div>
                      <span className="tracking-wide">NV B Chốt</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-100 mx-3 mt-[-16px]"></div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 text-gray-400 flex items-center justify-center">
                        3
                      </div>
                      <span className="tracking-wide">Q.Lý Duyệt</span>
                    </div>
                  </div>
                </div>

                {(() => {
                  const targetSkill = showSwap.assignedSkillTagId || showSwap.requestedSkillTagId || showSwap.skillTag;
                  const targetBranch = showSwap.storeName;

                  const candidatePeers = [
                    {
                      id: "peer_2",
                      name: "Thanh Nhàn",
                      code: "HMK-082",
                      role: "Thu ngân",
                      workingBranches: ["HMK Nguyễn Trãi", "HMK Cầu Giấy", "HMK Q7"],
                      skills: ["Thu ngân", "Tư vấn"],
                      avatar: "https://i.pravatar.cc/150?u=a04258b",
                    },
                    {
                      id: "peer_3",
                      name: "Minh Quang",
                      code: "HMK-044",
                      role: "Tư vấn",
                      workingBranches: ["HMK Nguyễn Trãi", "HMK Cầu Giấy"],
                      skills: ["Tư vấn", "Kho"],
                      avatar: "https://i.pravatar.cc/150?u=a04258c",
                    },
                    {
                      id: "peer_4",
                      name: "Bảo Ngân",
                      code: "HMK-095",
                      role: "Tư vấn & Thu ngân",
                      workingBranches: ["HMK Nguyễn Trãi", "HMK Cầu Giấy", "HMK Bình Thạnh"],
                      skills: ["Tư vấn", "Thu ngân", "Kiểm kho"],
                      avatar: "https://i.pravatar.cc/150?u=a04258d",
                    },
                    {
                      id: "peer_5",
                      name: "Hồng Đào",
                      code: "HMK-112",
                      role: "Thu ngân",
                      workingBranches: ["HMK Thủ Đức"],
                      skills: ["Thu ngân"],
                      avatar: "https://i.pravatar.cc/150?u=a04258e",
                    },
                  ];

                  const eligibleCandidates = candidatePeers.filter((m) => {
                    const isBranchOk = showSwap.isSupportShift || m.workingBranches.some(b => targetBranch.includes(b) || b.includes(targetBranch));
                    const isSkillOk = m.skills.includes(targetSkill);
                    if (!isBranchOk || !isSkillOk) return false;
                    if (swapSearchQuery) {
                      const q = swapSearchQuery.toLowerCase();
                      return m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q);
                    }
                    return true;
                  });

                  return (
                    <>
                      <div className="bg-[#F0F6FA] rounded-xl p-4 flex gap-3 text-slate-700 border border-[#558BAD]/20 mx-1">
                        <Shield className="w-5 h-5 text-[#558BAD] mt-0.5 shrink-0" />
                        <div className="text-xs font-medium leading-relaxed">
                          <p className="font-bold text-slate-900 mb-1">
                            Điều kiện đổi ca theo quy định:
                          </p>
                          <p className="text-slate-600">
                            Nhân viên nhận ca phải có thẩm quyền làm việc tại <span className="font-bold text-[#558BAD]">{targetBranch}</span> và có kỹ năng <span className="font-bold text-slate-900">[{targetSkill}]</span> phù hợp.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 px-1">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                            Chọn người nhận
                          </label>
                          <span className="text-xs font-semibold text-[#558BAD] bg-[#F0F6FA] px-2.5 py-0.5 rounded-full border border-[#558BAD]/20">
                            {eligibleCandidates.length} nhân viên phù hợp
                          </span>
                        </div>

                        {/* Search candidate */}
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Tìm nhân viên theo tên hoặc mã..."
                            value={swapSearchQuery}
                            onChange={(e) => setSwapSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#558BAD]/20 focus:border-[#558BAD] transition-all text-slate-900"
                          />
                          {swapSearchQuery && (
                            <button
                              onClick={() => setSwapSearchQuery("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          {eligibleCandidates.length > 0 ? (
                            eligibleCandidates.map((member, i) => (
                              <label
                                key={member.id}
                                className="flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-2xl cursor-pointer has-[:checked]:border-[#558BAD] has-[:checked]:bg-[#F0F6FA]/30 transition-all hover:border-slate-200 shadow-soft"
                              >
                                <div className="flex items-center gap-3.5">
                                  <img
                                    src={member.avatar}
                                    alt="Avatar"
                                    className="w-11 h-11 rounded-full bg-gray-100 object-cover border border-slate-200 shrink-0"
                                  />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-bold text-gray-900">
                                        {member.name}
                                      </p>
                                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                                        {member.code}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                      <span className="text-[10px] font-bold text-[#558BAD] bg-[#F0F6FA] border border-[#558BAD]/20 px-2 py-0.5 rounded-full flex items-center">
                                        <CheckCircle2 className="w-3 h-3 mr-1 text-[#558BAD]" />
                                        {targetSkill}
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex items-center">
                                        <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                                        {targetBranch}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <input
                                  type="radio"
                                  name="swapPeer"
                                  defaultChecked={i === 0}
                                  className="w-5 h-5 accent-[#558BAD] shrink-0"
                                />
                              </label>
                            ))
                          ) : (
                            <div className="bg-slate-50 border border-dashed border-slate-200 p-4 rounded-xl text-center">
                              <p className="text-xs font-semibold text-slate-600">
                                Không có nhân viên nào đủ điều kiện kỹ năng [{targetSkill}] và chi nhánh [{targetBranch}].
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}

                <div className="space-y-4 px-1">
                  <label className="text-sm font-bold text-gray-900 uppercase tracking-wide block">
                    Đề xuất ca muốn đổi
                  </label>
                  <select className="w-full bg-white border-2 border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:border-black font-medium text-gray-900 transition-colors">
                    <option value="">
                      Chỉ nhường ca (Không lấy lại ca nào)
                    </option>
                    <option value="1">Ca Sáng - Thứ 6 (20/11) - 7h</option>
                    <option value="2">Ca Đêm - Chủ Nhật (22/11) - 8h</option>
                  </select>
                </div>

                <div className="space-y-4 px-1">
                  <label className="text-sm font-bold text-gray-900 uppercase tracking-wide block">
                    Lời nhắn (tuỳ chọn)
                  </label>
                  <textarea
                    className="w-full bg-white border-2 border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:border-black font-medium text-gray-900 transition-colors"
                    placeholder="Nhập lời nhắn cho đồng nghiệp..."
                    rows={2}
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 flex gap-3 pb-safe bg-white w-full sticky bottom-0 z-10 border-t border-slate-100">
                <button
                  onClick={() => setShowSwap(null)}
                  className="flex-[1] py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all shadow-soft"
                >
                  Huỷ
                </button>
                <button
                  onClick={() => {
                    setToast({
                      message: "Đã gửi yêu cầu tới đồng nghiệp! Yêu cầu sẽ được chuyển cho Quản lý khi đồng nghiệp đồng ý.",
                      type: 'success'
                    });
                    setShowSwap(null);
                  }}
                  className="flex-[2] py-3.5 bg-[#558BAD] hover:bg-[#446E8A] text-white font-bold rounded-xl flex items-center justify-center transition-all shadow-md shadow-[#558BAD]/20"
                >
                  <Send className="w-4 h-4 mr-2" /> Gửi yêu cầu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================= MODAL: SHIFT DETAIL (REGISTER VIEW) ======================= */}
      <AnimatePresence>
        {shiftDetailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end"
            onClick={() => setShiftDetailModal(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-t-2xl px-5 pt-5 pb-8 flex flex-col max-h-[90vh] shadow-[0_-8px_30px_rgb(0,0,0,0.12)]"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 shrink-0"></div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {shiftDetailModal.shiftName}
                </h3>
                <span className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                  {shiftDetailModal.date instanceof Date ? format(shiftDetailModal.date, "EEEE, dd/MM/yyyy", {
                    locale: vi,
                  }) : "N/A"}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto w-full pb-6 space-y-8">
                {(() => {
                  const isModalBranchEligible =
                    shiftDetailModal.isSupportShift ||
                    (user?.workingBranches
                      ? user.workingBranches.some(
                          (b: any) =>
                            b.status === "ACTIVE" &&
                            (b.branchName === shiftDetailModal.storeName || b.branchId === shiftDetailModal.branchId)
                        )
                      : user?.authorizedBranches?.includes(shiftDetailModal.storeName) ?? true);

                  if (!isModalBranchEligible) {
                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-amber-800 text-xs font-semibold">
                        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Ca này thuộc chi nhánh ngoài danh sách làm việc của bạn.</span>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="space-y-4 px-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Khung giờ</span>
                    <span className="font-bold text-gray-900">
                      {shiftDetailModal.timeStr}{" "}
                      <span className="text-gray-400 font-medium tracking-normal ml-1">
                        ({shiftDetailModal.hours}h)
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Địa điểm</span>
                    <span className="font-bold text-gray-900">
                      {shiftDetailModal.storeName || "Chi nhánh mặc định"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">
                      Số lượng ĐK
                    </span>
                    <span className="font-bold text-gray-900">
                      {shiftDetailModal.currentStaff}{" "}
                      <span className="text-gray-400 font-medium">
                        / {shiftDetailModal.maxStaff}
                      </span>
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 px-1 uppercase tracking-wide">
                    Chi tiết định biên
                  </h4>
                  <div className="space-y-3">
                    {shiftDetailModal.slots ? (
                      shiftDetailModal.slots.map((slot) => {
                        const isMatched = user?.skills.includes(slot.skillTag);
                        const isSlotFull = slot.current >= slot.max;
                        const isSelectable = isMatched && !isSlotFull;
                        const isSelected = selectedSlotId === slot.id;

                        return (
                          <div
                            key={slot.id}
                            onClick={() => {
                              if (isSelectable) setSelectedSlotId(slot.id);
                            }}
                            className={cn(
                              "p-4 rounded-xl border-2 flex justify-between items-center transition-all cursor-pointer relative",
                              !isMatched
                                ? "border-gray-100 bg-gray-50/50 opacity-60 cursor-not-allowed"
                                : isSlotFull
                                  ? "border-gray-100 bg-gray-50 opacity-80 cursor-not-allowed"
                                  : isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-200 bg-white hover:border-gray-300 shadow-sm",
                            )}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <div
                                  className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                    isSelected
                                      ? "border-primary bg-primary text-white"
                                      : "border-gray-300 bg-white",
                                  )}
                                >
                                  {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                  )}
                                </div>
                                <h5
                                  className={cn(
                                    "font-bold text-base",
                                    !isMatched
                                      ? "text-gray-400"
                                      : "text-gray-900",
                                  )}
                                >
                                  {slot.title}
                                </h5>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 pl-8 mt-1">
                                {!isMatched && (
                                  <span className="text-gray-500 text-[11px] font-medium flex items-center bg-gray-100 px-2 py-0.5 rounded-full">
                                    <Lock className="w-3 h-3 mr-1" /> Thiếu Tag
                                  </span>
                                )}
                                {isMatched && (
                                  <span className="text-primary text-[11px] font-bold flex items-center bg-primary/10 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />{" "}
                                    Phù hợp
                                  </span>
                                )}
                                <span className="text-xs text-gray-500 font-medium">
                                  Tag yêu cầu:{" "}
                                  <span className="font-bold text-gray-700">
                                    {slot.skillTag}
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span
                                className={cn(
                                  "font-bold text-base",
                                  isSlotFull
                                    ? "text-orange-500"
                                    : "text-primary",
                                )}
                              >
                                {slot.current}{" "}
                                <span className="text-sm font-medium text-gray-400">
                                  / {slot.max}
                                </span>
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-xl text-center">
                        <p className="text-sm font-medium text-gray-500">
                          Ca làm chưa được phân tách kỹ năng chi tiết.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100 flex gap-3 pb-safe bg-white w-full sticky bottom-0 z-10">
                <button
                  onClick={() => setShiftDetailModal(null)}
                  className="flex-[1] py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all shadow-sm"
                >
                  Đóng
                </button>

                {(() => {
                  if (weekOffset <= 0 || weekOffset >= 2) {
                    return null;
                  }

                  // 1. Branch Eligibility Check
                  const isModalBranchEligible =
                    shiftDetailModal.isSupportShift ||
                    (user?.workingBranches
                      ? user.workingBranches.some(
                          (b: any) =>
                            b.status === "ACTIVE" &&
                            (b.branchName === shiftDetailModal.storeName || b.branchId === shiftDetailModal.branchId)
                        )
                      : user?.authorizedBranches?.includes(shiftDetailModal.storeName) ?? true);

                  if (!isModalBranchEligible) {
                    return (
                      <button
                        disabled
                        className="flex-[2] py-3.5 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider"
                      >
                        <Lock className="w-4 h-4 text-amber-600" />
                        Ngoài chi nhánh làm việc
                      </button>
                    );
                  }

                  // 2. Pending Registration (Allow cancel)
                  if (shiftDetailModal.status === "pending") {
                    return (
                      <button
                        onClick={() => {
                          const res = handleShiftAction(shiftDetailModal.id, "cancel");
                          if (res) {
                            setToast({message: "Hủy ca thành công!", type: 'success'});
                            setShiftDetailModal(null);
                          }
                        }}
                        className="flex-[2] py-3.5 bg-white border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-all shadow-sm active:scale-[0.98] text-xs uppercase tracking-wider"
                      >
                        Hủy đăng ký
                      </button>
                    );
                  }

                  // 3. Skill Eligibility Check
                  const activeSkills = user?.skillTags
                    ? user.skillTags.filter((st: any) => st.status === "ACTIVE").map((st: any) => st.skillTagName)
                    : user?.skills || [];

                  const hasMatchedSkill = (shiftDetailModal.slots
                    ? shiftDetailModal.slots.map((s) => s.skillTag)
                    : [shiftDetailModal.skillTag]
                  ).some((t) => activeSkills.includes(t));

                  if (!hasMatchedSkill) {
                    return (
                      <button
                        disabled
                        className="flex-[2] py-3.5 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider border border-slate-200"
                      >
                        <Lock className="w-4 h-4" />
                        Không đúng kỹ năng
                      </button>
                    );
                  }

                  // 4. Shift Capacity & Slot Capacity Check
                  const isShiftOverallFull =
                    shiftDetailModal.maxStaff > 0 &&
                    (shiftDetailModal.currentStaff || 0) >= shiftDetailModal.maxStaff;

                  const hasMatchedSkillAndSlot = shiftDetailModal.slots
                    ? shiftDetailModal.slots.some(
                        (s) =>
                          activeSkills.includes(s.skillTag) &&
                          s.current < s.max,
                      )
                    : !isShiftOverallFull;

                  if (isShiftOverallFull || !hasMatchedSkillAndSlot) {
                    return (
                      <button
                        disabled
                        className="flex-[2] py-3.5 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed transition-all border border-slate-200 text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-4 h-4" />
                        Ca đã đầy
                      </button>
                    );
                  }

                  const needsSlotSelection =
                    shiftDetailModal.slots && selectedSlotId === null;

                  if (shiftDetailModal.status === "open") {
                    return (
                      <button
                        disabled={!!needsSlotSelection}
                        onClick={() => {
                          const res = handleShiftAction(shiftDetailModal.id, "register");
                          if (res) {
                            setToast({message: "Đăng ký ca thành công! Ca đang được CHỜ DUYỆT.", type: 'success'});
                            setShiftDetailModal(null);
                          }
                        }}
                        className={cn(
                          "flex-[2] py-3.5 font-bold rounded-xl flex items-center justify-center transition-all shadow-md text-xs uppercase tracking-wider",
                          needsSlotSelection
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                            : "bg-[#558BAD] hover:bg-[#446E8A] text-white shadow-[#558BAD]/20 active:scale-[0.98]",
                        )}
                      >
                        {needsSlotSelection
                          ? "Chọn Kỹ năng"
                          : "Đăng ký ngay"}
                      </button>
                    );
                  }

                  return (
                    <button
                      disabled
                      className="flex-[2] py-3.5 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed transition-all border border-slate-200 text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-4 h-4" />
                      Ca đã đầy
                    </button>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================= MODAL: FILTER ======================= */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-center items-end bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center p-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">
                  Bộ lọc lịch làm việc
                </h3>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-6">
                {/* Chi nhánh làm việc (CR-12SEP-01) */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#558BAD]" />
                      Chi nhánh làm việc
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {userActiveWorkingBranches.length} chi nhánh hiệu lực
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setTempBranchFilter("")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                        !tempBranchFilter
                          ? "bg-[#558BAD] text-white border-[#558BAD] shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      Tất cả chi nhánh
                    </button>
                    {userActiveWorkingBranches.map(branch => {
                      const isSelected = tempBranchFilter === branch;
                      return (
                        <button
                          key={branch}
                          onClick={() => setTempBranchFilter(isSelected ? "" : branch)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1",
                            isSelected
                              ? "bg-[#F0F6FA] border-[#558BAD] text-[#558BAD] shadow-sm ring-1 ring-[#558BAD]"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {branch}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vị trí / Kỹ năng (CR-12SEP-02) */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#558BAD]" />
                      Vị trí / Kỹ năng
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {userActiveSkills.length} kỹ năng hiệu lực
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setTempSkillFilter("")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                        !tempSkillFilter
                          ? "bg-[#558BAD] text-white border-[#558BAD] shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      Tất cả vị trí
                    </button>
                    {userActiveSkills.map(skill => {
                      const isSelected = tempSkillFilter === skill;
                      return (
                        <button
                          key={skill}
                          onClick={() => setTempSkillFilter(isSelected ? "" : skill)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1",
                            isSelected
                              ? "bg-[#F0F6FA] border-[#558BAD] text-[#558BAD] shadow-sm ring-1 ring-[#558BAD]"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <CheckCircle2 className="w-3 h-3 text-[#558BAD]" />
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bộ lọc phù hợp điều kiện */}
                <div className="bg-[#F0F6FA] p-3.5 rounded-2xl border border-[#558BAD]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-5 h-5 text-[#558BAD] shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Chỉ hiện ca phù hợp với tôi
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Khớp với Chi nhánh làm việc & Kỹ năng hiệu lực
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempOnlyFitFilter}
                      onChange={(e) => setTempOnlyFitFilter(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#558BAD]"></div>
                  </label>
                </div>

                {/* Trạng thái (áp dụng cho Lịch của tôi) */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Trạng thái (Lịch của tôi)</h4>
                  
                  {/* Group 1: Đang hiệu lực */}
                  <p className="text-[11px] font-semibold text-slate-500 mb-2 mt-2 uppercase tracking-wider">Đang hiệu lực</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "pending", label: "Chờ duyệt" },
                      { id: "approved", label: "Đã duyệt" },
                      { id: "assigned", label: "Gán tay" },
                    ].map(status => {
                      const isSelected = tempSelectedStatuses.includes(status.id);
                      return (
                        <button
                          key={status.id}
                          onClick={() => {
                            setTempSelectedStatuses(prev => 
                              isSelected ? prev.filter(s => s !== status.id) : [...prev, status.id]
                            )
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                            isSelected 
                              ? "bg-[#F0F6FA] border-[#558BAD] text-[#558BAD]" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {status.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Group 2: Không còn hiệu lực */}
                  <p className="text-[11px] font-semibold text-slate-500 mb-2 mt-3 uppercase tracking-wider">Không còn hiệu lực</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "rejected", label: "Từ chối" },
                      { id: "cancelled", label: "Huỷ đăng ký" },
                    ].map(status => {
                      const isSelected = tempSelectedStatuses.includes(status.id);
                      return (
                        <button
                          key={status.id}
                          onClick={() => {
                            setTempSelectedStatuses(prev => 
                              isSelected ? prev.filter(s => s !== status.id) : [...prev, status.id]
                            )
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                            isSelected 
                              ? "bg-red-50 border-red-200 text-red-600" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {status.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Thời gian */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2.5">Lọc giờ trong ngày</h4>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Từ giờ</label>
                      <input 
                        type="time" 
                        value={tempTimeFrom}
                        onChange={(e) => setTempTimeFrom(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#558BAD]/20 focus:border-[#558BAD] transition-all"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Đến giờ</label>
                      <input 
                        type="time" 
                        value={tempTimeTo}
                        onChange={(e) => setTempTimeTo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#558BAD]/20 focus:border-[#558BAD] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 flex gap-3 bg-white pb-safe">
                <button
                  onClick={() => {
                    setTempSelectedStatuses([]);
                    setTempBranchFilter("");
                    setTempSkillFilter("");
                    setTempOnlyFitFilter(false);
                    setTempTimeFrom("");
                    setTempTimeTo("");
                  }}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  Đặt lại
                </button>
                <button
                  onClick={() => {
                    setSelectedStatuses(tempSelectedStatuses);
                    setSelectedBranchFilter(tempBranchFilter);
                    setSelectedSkillFilter(tempSkillFilter);
                    setOnlyFitFilter(tempOnlyFitFilter);
                    setTimeFrom(tempTimeFrom);
                    setTimeTo(tempTimeTo);
                    
                    // Auto-switch segment if possible
                    const hasActive = tempSelectedStatuses.some(s => activeShiftStatuses.includes(s));
                    const hasInactive = tempSelectedStatuses.some(s => historyShiftStatuses.includes(s));
                    
                    if (hasActive && !hasInactive) {
                      setMyScheduleSubTab("active");
                    } else if (hasInactive && !hasActive) {
                      setMyScheduleSubTab("history");
                    }
                    
                    setIsFilterModalOpen(false);
                  }}
                  className="flex-[2] py-3.5 bg-[#558BAD] text-white hover:bg-[#446E8A] font-bold rounded-xl transition-all shadow-md shadow-[#558BAD]/20 active:scale-[0.98]"
                >
                  Áp dụng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
