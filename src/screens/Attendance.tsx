import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Wifi,
  Crosshair,
  Fingerprint,
  CalendarDays,
  AlertTriangle,
  CheckSquare,
  Square,
  FileText,
  Camera,
  ChevronRight,
  ArrowRight,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { useSearchParams, Link, useNavigate } from "react-router-dom";

type AttState =
  | "checking_location"
  | "pending_in"
  | "checklist_open"
  | "working"
  | "checklist_close"
  | "done";
type ShiftType = "morning" | "night";
type Scenario =
  | "normal"
  | "late_out"
  | "forgot_in"
  | "forgot_out"
  | "missing_checkout";

export default function Attendance() {
  const [searchParams] = useSearchParams();
  const initScenario = (searchParams.get("scenario") as Scenario) || "normal";

  const [time, setTime] = useState(new Date());

  // Dev State Toggles
  const [inZone, setInZone] = useState(true);
  const [shiftType, setShiftType] = useState<ShiftType>("morning");
  const [scenario, setScenario] = useState<Scenario>(initScenario);
  const [showAdhocModal, setShowAdhocModal] = useState(false);
  const [adhocStore, setAdhocStore] = useState("");
  const [adhocReason, setAdhocReason] = useState("");
  const [adhocSkill, setAdhocSkill] = useState("");
  const [missingCheckoutAlert, setMissingCheckoutAlert] = useState(false);
  const [adhocStartTime, setAdhocStartTime] = useState<Date | null>(null);

  // App State
  const {
    user,
    setHasCheckedIn,
    availableShifts,
    acknowledgeDispatch,
    addAdhocShift,
  } = useApp();
  const [attState, setAttState] = useState<AttState>("pending_in");
  const [checks, setChecks] = useState<boolean[]>([false, false, false]);
  const [logs, setLogs] = useState<
    { type: "in" | "out" | "exception"; note: string; time: Date }[]
  >([]);

  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);

  // Modals
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [showLateOutModal, setShowLateOutModal] = useState(false);
  const [showForgotInModal, setShowForgotInModal] = useState(false);
  const [showForgotOutModal, setShowForgotOutModal] = useState(false);
  const [showBlockCheckinModal, setShowBlockCheckinModal] = useState(false);
  const navigate = useNavigate();

  // Hold Action State
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startHoldAction = (action: () => void) => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    let progress = 0;
    holdTimerRef.current = setInterval(() => {
      progress += 5; // 5% every 50ms = 1000ms = 1 second
      setHoldProgress(progress);
      if (progress >= 100) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        action();
        setHoldProgress(0);
      }
    }, 50);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    setHoldProgress(0);
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (initScenario === "forgot_in") {
      setShowForgotInModal(true);
    } else if (initScenario === "forgot_out") {
      setShowForgotOutModal(true);
    }
  }, [initScenario]);

  // Filter approved shifts for demo purposes as "today shifts"
  const todayShifts = availableShifts
    .filter((s) => s.status === "approved")
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // --- Handlers ---
  const handleCheckInAttempt = () => {
    if (!inZone) {
      setShowGpsModal(true);
      return;
    }
    // Strategy 4: Block check-in if there are unresolved prior shifts
    if (scenario === "forgot_in" || scenario === "forgot_out") {
      setShowBlockCheckinModal(true);
      return;
    }
    proceedCheckIn();
  };

  const proceedCheckIn = (reason?: string) => {
    const isAdhoc = activeShiftId?.startsWith("adhoc_");
    setLogs((prev) => [
      {
        type: reason || isAdhoc ? ("exception" as const) : ("in" as const),
        note: reason
          ? `Check-in ngoại lệ: ${reason}`
          : isAdhoc
            ? "Check-in đột xuất"
            : "Check-in thành công",
        time: new Date(),
      },
      ...prev,
    ]);
    setAttState(shiftType === "morning" ? "checklist_open" : "working");
    setHasCheckedIn(true);
  };

  const handleCheckOutAttempt = () => {
    if (scenario === "forgot_in" && attState === "pending_in") {
      setShowForgotInModal(true);
      return;
    }

    if (shiftType === "night") {
      setAttState("checklist_close");
      setChecks([false, false, false]);
    } else {
      processFinalCheckOut();
    }
  };

  const processFinalCheckOut = (reason?: string) => {
    if (scenario === "late_out" && !reason) {
      setShowLateOutModal(true);
      return;
    }

    setLogs((prev) => [
      {
        type: reason || scenario === "forgot_in" ? "exception" : "out",
        note: reason ? `Check-out: ${reason}` : "Check-out thành công",
        time: new Date(),
      },
      ...prev,
    ]);
    setAttState("done");
    setHasCheckedIn(false);
  };

  return (
    <div className="flex flex-col h-full relative bg-background pb-20">
      {/* --- SCENARIO TESTING CONTROLS --- */}
      <div className="mt-8 px-4 pb-8">
        <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 border-dashed">
          <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider text-center">
            Bảng điều khiển Test Case (QA)
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <select
              className="bg-white border border-gray-200 text-gray-900 text-xs font-bold rounded-md px-3 py-2 outline-none focus:border-gray-900"
              value={shiftType}
              onChange={(e) => {
                setShiftType(e.target.value as any);
                setAttState("pending_in");
                setLogs([]);
              }}
            >
              <option value="morning">Mô phỏng: Ca Sáng</option>
              <option value="night">Mô phỏng: Ca Tối</option>
            </select>
            <select
              className="bg-white border border-gray-200 text-gray-900 text-xs font-bold rounded-md px-3 py-2 outline-none focus:border-gray-900"
              value={scenario}
              onChange={(e) => {
                const val = e.target.value as any;
                setScenario(val);
                if (val === "missing_checkout") {
                  setAttState("done");
                  setMissingCheckoutAlert(true);
                  setHasCheckedIn(false);
                } else {
                  setAttState("pending_in");
                  setLogs([]);
                  setHasCheckedIn(false);
                  setActiveShiftId(null);
                }
              }}
            >
              <option value="normal">Normal Out (Chuẩn)</option>
              <option value="late_out">Late Out (&gt;15p)</option>
              <option value="forgot_in">Forgot IN -&gt; OUT</option>
              <option value="forgot_out">Forgot OUT (Auto Close)</option>
              <option value="missing_checkout">
                Missing Checkout (Auto-close)
              </option>
            </select>
          </div>
          <button
            onClick={() => setInZone(!inZone)}
            className={cn(
              "w-full py-2.5 rounded-lg text-xs font-bold transition-all border",
              inZone
                ? "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                : "border-red-200 text-red-600 bg-red-50 hover:bg-red-100",
            )}
          >
            Trạng thái GPS hiện tại:{" "}
            {inZone ? "HỢP LỆ" : "NGOÀI VÙNG (Sẽ hiện form Ngoại lệ)"}
          </button>
        </div>
      </div>

      {/* SCENARIO ALERTS */}
      <AnimatePresence>
        {(scenario === "forgot_in" || scenario === "forgot_out") && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-600 text-white sticky top-0 z-50 overflow-hidden shadow-md"
          >
            <div className="p-3 pl-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide">
                    Hành động bắt buộc
                  </h4>
                  <p className="text-[11px] text-red-100 font-medium">
                    Bạn có ca làm việc lỗi chưa giải quyết.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/requests")}
                className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-widest whitespace-nowrap active:scale-95 transition-all"
              >
                Xử lý
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 py-2" id="attendance-workspace">
        <h1 className="text-2xl font-bold font-display text-slate-900 mb-6 mt-4 tracking-tight">
          Chấm công
        </h1>

        {/* Lịch làm việc hôm nay */}
        {!activeShiftId && (
          <div className="mb-8">
            {todayShifts.length > 0 && (
              <h2 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" /> Lịch làm việc hôm nay
              </h2>
            )}
            <div className="space-y-4">
              {todayShifts.map((shift) => (
                <div
                  key={shift.id}
                  className={cn(
                    "p-5 rounded-2xl border transition-all relative overflow-hidden",
                    shift.requireHandshake
                      ? "bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-soft"
                      : "bg-white border-slate-100 hover:border-slate-200 shadow-card",
                  )}
                >
                  {shift.requireHandshake && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                  )}
                  <div className="flex justify-between items-start mb-4 relative z-10 w-full">
                    <div className="flex-1">
                      <p className="font-display text-2xl font-black text-slate-900 tracking-tight">
                        {shift.timeStr}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{shift.hours}h</span>
                        <span className="text-slate-200 text-[10px]">•</span>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{(shift.date instanceof Date ? format(shift.date, "dd/MM") : "")}</span>
                      </div>
                    </div>
                    <div className="text-right flex-1 flex flex-col items-end">
                      <div className="flex flex-col items-end gap-1.5">
                        {shift.requireHandshake && (
                          <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-widest border border-indigo-200">
                            Điều phối mới
                          </span>
                        )}
                        <h3 className="font-bold text-sm tracking-tight text-slate-900">
                          {shift.shiftName}
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 mt-1 max-w-full truncate uppercase tracking-widest">
                        {shift.storeName || "Home Store"}
                      </span>
                    </div>
                  </div>

                  {shift.requireHandshake ? (
                    <div className="mt-4 pt-4 border-t border-dashed border-indigo-100 relative z-10">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center shrink-0 shadow-soft">
                          <AlertTriangle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-widest leading-tight mb-1">
                            Đã thay đổi địa điểm ca
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed pr-2">
                            Quản lý vừa điều phối bạn tới <span className="text-slate-900 font-bold">{shift.storeName}</span>. 
                            Vui lòng xác nhận để tiếp tục.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => acknowledgeDispatch(shift.id)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Xác nhận & Mở ca
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          setActiveShiftId(shift.id);
                          setShiftType(
                            shift.shiftName.includes("Sáng")
                              ? "morning"
                              : "night",
                          );
                          setAttState("checking_location");
                          setTimeout(() => {
                            if (!inZone) {
                              setShowGpsModal(true);
                              setAttState("pending_in");
                            } else {
                              setAttState("pending_in");
                            }
                          }, 2500);
                        }}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg active:scale-[0.98] uppercase tracking-widest"
                      >
                        Vào làm ngay
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAdhocModal(true)}
              className="w-full mt-6 border-2 border-dashed border-slate-200 bg-white py-5 rounded-2xl text-slate-500 font-bold uppercase tracking-[0.1em] text-[11px] hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-soft group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-left">
                <p className="text-slate-900 leading-tight">Chấm công đột xuất</p>
                <p className="text-[10px] text-slate-400 font-medium normal-case tracking-normal">Dành cho trường hợp chưa có lịch trên hệ thống</p>
              </div>
            </button>
          </div>
        )}

        {/* Main Card */}
        {activeShiftId && (
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={() => setActiveShiftId(null)}
              className="text-xs font-bold text-gray-500 hover:text-gray-900 uppercase tracking-wide flex items-center gap-1 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" /> Quay lại danh sách
              ca
            </button>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {(!todayShifts.length || activeShiftId) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-xl shadow-sm border-2 border-gray-100 overflow-hidden relative"
            >
              {/* Card Header */}
              <div className="bg-slate-50 p-6 flex justify-between items-start border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900 text-[15px] tracking-tight">
                    {activeShiftId
                      ? todayShifts.find((s) => s.id === activeShiftId)
                          ?.shiftName
                      : shiftType === "morning"
                        ? "Ca Sáng"
                        : "Ca Tối"}
                    {" - "}
                    {activeShiftId
                      ? todayShifts.find((s) => s.id === activeShiftId)
                          ?.storeName
                      : "HMK Nguyễn Trãi"}
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      {activeShiftId
                        ? todayShifts.find((s) => s.id === activeShiftId)?.timeStr
                        : shiftType === "morning"
                          ? "08:00 - 15:00"
                          : "15:00 - 22:00"}
                    </div>
                  </div>
                </div>
                  <div className="flex flex-col items-end gap-2">
                    {attState !== "checking_location" && (
                      <div
                        className={cn(
                          "text-[9px] px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-widest border",
                          inZone
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-600 border-red-200 shadow-soft shadow-red-100",
                        )}
                      >
                        {inZone ? "GPS Hợp lệ" : "Sai Vị trí"}
                      </div>
                    )}
                    {activeShiftId?.startsWith("adhoc_") &&
                      attState === "pending_in" && (
                        <button
                          onClick={() => setShowAdhocModal(true)}
                          className="text-[9px] bg-slate-900 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest font-extrabold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-colors"
                        >
                          Sửa thông tin
                        </button>
                      )}
                    {attState === "pending_in" && scenario === "forgot_in" && (
                    <span className="text-[9px] bg-red-600 text-white border border-red-700 font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-lg shadow-red-500/20">
                      [QUÊN CHECK-IN]
                    </span>
                  )}
                </div>
              </div>

              <div className="p-8 flex flex-col items-center justify-center min-h-[260px] relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-50 ring-inset ring-slate-100/50"></div>
                <h3 className="text-4xl font-display tracking-tight font-black text-slate-900 mb-10">
                  {time instanceof Date ? format(time, "HH:mm:ss") : "00:00:00"}
                </h3>

                <AnimatePresence mode="wait">
                  {/* --- STATE: CHECKING LOCATION --- */}
                  {attState === "checking_location" && (
                    <motion.div
                      key="checking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center space-y-4"
                    >
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <motion.div
                          className="absolute inset-0 border-4 border-indigo-200 rounded-full"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                          className="absolute inset-0 border-4 border-indigo-400 rounded-full"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        />
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center z-10 border-2 border-indigo-300">
                          <MapPin className="w-6 h-6 text-indigo-600 animate-pulse" />
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                        Đang kiểm tra vị trí GPS...
                      </p>
                    </motion.div>
                  )}

                  {/* --- STATE: PENDING IN --- */}
                  {(attState === "pending_in" ||
                    (attState === "done" && scenario === "forgot_in")) && (
                    <motion.div
                      key="in"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      {attState !== "done" ? (
                        <>
                          <div
                            className={cn(
                              "relative flex items-center justify-center w-40 h-40 group cursor-pointer",
                              (scenario === "forgot_in" ||
                                scenario === "forgot_out") &&
                                "grayscale opacity-90",
                            )}
                            onPointerDown={() =>
                              startHoldAction(handleCheckInAttempt)
                            }
                            onPointerUp={cancelHold}
                            onPointerLeave={cancelHold}
                            onContextMenu={(e) => e.preventDefault()}
                            style={{ touchAction: "none" }}
                          >
                            {/* Background Outline */}
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none transition-transform duration-300">
                              <circle
                                cx="80"
                                cy="80"
                                r="72"
                                className="stroke-slate-100"
                                strokeWidth="8"
                                fill="none"
                              />
                              {/* Progress Outline */}
                              <circle
                                cx="80"
                                cy="80"
                                r="72"
                                className="stroke-slate-900 transition-all duration-75"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray="452.39"
                                strokeDashoffset={
                                  452.39 - (452.39 * holdProgress) / 100
                                }
                                strokeLinecap="round"
                              />
                            </svg>

                            <button
                              className={cn(
                                "w-32 h-32 rounded-full flex flex-col items-center justify-center text-white transition-all duration-300 pointer-events-none relative overflow-hidden",
                                scenario === "forgot_in" ||
                                  scenario === "forgot_out"
                                  ? "bg-red-500 shadow-lg shadow-red-200"
                                  : "bg-slate-900 shadow-xl shadow-slate-200",
                                holdProgress > 0
                                  ? "scale-90"
                                  : "group-hover:scale-105",
                              )}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                              <AnimatePresence mode="wait">
                                {holdProgress > 0 && (
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-white/10"
                                  />
                                )}
                              </AnimatePresence>
                              
                              {scenario === "forgot_in" ||
                              scenario === "forgot_out" ? (
                                <Lock
                                  className={cn(
                                    "w-10 h-10 mb-2 transition-all duration-75 relative z-10",
                                    holdProgress > 0
                                      ? "scale-110"
                                      : "opacity-100",
                                  )}
                                />
                              ) : (
                                <Fingerprint
                                  className={cn(
                                    "w-10 h-10 mb-2 transition-all duration-200 relative z-10",
                                    holdProgress > 0
                                      ? "scale-110"
                                      : "opacity-100",
                                  )}
                                />
                              )}
                              <span className="font-extrabold tracking-[0.2em] text-[10px] uppercase relative z-10">
                                {scenario === "forgot_in" ||
                                scenario === "forgot_out"
                                  ? "BỊ KHÓA"
                                  : "CHECK-IN"}
                              </span>
                            </button>
                          </div>

                          <div className="mt-8 flex flex-col items-center gap-3">
                            {scenario === "forgot_in" ||
                            scenario === "forgot_out" ? (
                              <div className="flex flex-col items-center gap-2">
                                <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg uppercase text-[10px] font-bold tracking-widest border border-red-100">
                                  Hành động chưa xử lý
                                </span>
                                <p className="text-[11px] text-slate-400 font-medium">Bấm vào thanh thông báo phía trên</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                                    Sẵn sàng vào ca
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium">Ấn và giữ để quét vân tay</p>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-5 bg-gray-50 rounded-xl border border-gray-100">
                          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                          <h4 className="font-bold text-gray-900">
                            Ca làm việc đã kết thúc
                          </h4>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* --- STATE: CHECKLIST OPEN/CLOSE --- */}
                  {(attState === "checklist_open" ||
                    attState === "checklist_close") && (
                    <motion.div
                      key="checklist"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="w-full"
                    >
                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-5 flex items-start gap-3">
                        <Info className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-orange-900 mb-1">
                            {attState === "checklist_open"
                              ? "Checklist Mở Ca"
                              : "Checklist Đóng Ca"}
                          </p>
                          <p className="text-xs font-medium text-orange-800">
                            {attState === "checklist_open"
                              ? "Hoàn thành Checklist Mở ca để nhận Task công việc."
                              : "Bắt buộc hoàn thành Checklist trước khi Check-out."}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 mb-8 relative">
                        {[
                          attState === "checklist_open"
                            ? "Vệ sinh khu vực cửa hàng"
                            : "Tắt toàn bộ hệ thống điện",
                          attState === "checklist_open"
                            ? "Kiểm đếm quỹ tiền mặt"
                            : "Chốt bàn giao và khóa két",
                          attState === "checklist_open"
                            ? "Bật điều hòa và biển hiệu"
                            : "Khóa cửa cuốn, niêm phong",
                        ].map((task, i) => (
                          <label
                            key={i}
                            className={cn(
                              "flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all duration-200 group relative overflow-hidden",
                              checks[i]
                                ? "bg-slate-50 border-slate-200"
                                : "bg-white border-slate-100 shadow-soft hover:border-slate-200"
                            )}
                          >
                            <div className={cn(
                              "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 shrink-0",
                              checks[i] 
                                ? "bg-slate-900 border-slate-900 scale-110 shadow-lg shadow-slate-200" 
                                : "bg-white border-slate-200 group-hover:border-slate-400"
                            )}>
                              <CheckCircle2 className={cn(
                                "w-4 h-4 text-white transition-all duration-300",
                                checks[i] ? "scale-100 opacity-100" : "scale-50 opacity-0"
                              )} />
                            </div>
                            <input
                              type="checkbox"
                              checked={checks[i]}
                              onChange={() =>
                                setChecks((p) => {
                                  const n = [...p];
                                  n[i] = !n[i];
                                  return n;
                                })
                              }
                              className="hidden"
                            />
                            <span
                              className={cn(
                                "text-sm font-bold transition-all duration-300",
                                checks[i]
                                  ? "text-slate-400 font-medium"
                                  : "text-slate-900",
                              )}
                            >
                              {task}
                            </span>
                            {checks[i] && (
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                className="absolute bottom-0 left-0 h-0.5 bg-slate-900/10"
                              />
                            )}
                          </label>
                        ))}
                      </div>

                      <button
                        disabled={!checks.every(Boolean)}
                        onClick={() => {
                          if (attState === "checklist_open")
                            setAttState("working");
                          else processFinalCheckOut();
                        }}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-100 border border-transparent disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-[0.15em]"
                      >
                        {attState === "checklist_open"
                          ? "Bắt đầu làm việc"
                          : "Hoàn tất & Check-out"}
                      </button>
                    </motion.div>
                  )}

                  {/* --- STATE: WORKING --- */}
                  {attState === "working" && (
                    <motion.div
                      key="working"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 relative z-0 border border-green-100">
                        <div className="absolute inset-0 border-2 border-green-500 border-dashed rounded-full animate-spin-slow opacity-50 z-[-1]"></div>
                        <Clock className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="font-bold text-xl text-gray-900 mb-1.5">
                        Đang trong ca...
                      </h3>
                      <p className="text-xs font-bold text-gray-500 mb-8 uppercase tracking-wide">
                        Bạn có thể thu nhỏ màn hình này
                      </p>

                      <div
                        className="relative flex items-center justify-center w-40 h-40 group cursor-pointer"
                        onPointerDown={() =>
                          startHoldAction(handleCheckOutAttempt)
                        }
                        onPointerUp={cancelHold}
                        onPointerLeave={cancelHold}
                        onContextMenu={(e) => e.preventDefault()}
                        style={{ touchAction: "none" }}
                      >
                        {/* Background Outline */}
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none drop-shadow-md">
                          <circle
                            cx="80"
                            cy="80"
                            r="76"
                            className="stroke-gray-100"
                            strokeWidth="6"
                            fill="none"
                          />
                          {/* Progress Outline */}
                          <circle
                            cx="80"
                            cy="80"
                            r="76"
                            className="transition-all duration-75 stroke-gray-800"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray="478"
                            strokeDashoffset={478 - (478 * holdProgress) / 100}
                            strokeLinecap="round"
                          />
                        </svg>

                        <button
                          className={cn(
                            "w-32 h-32 rounded-full flex flex-col items-center justify-center text-white transition-all duration-75 pointer-events-none bg-gray-900",
                            holdProgress > 0
                              ? "scale-95 shadow-none"
                              : "group-hover:scale-[1.02]",
                          )}
                        >
                          <Fingerprint
                            className={cn(
                              "w-10 h-10 mb-1 transition-all duration-75 text-gray-300",
                              holdProgress > 0
                                ? "scale-110 opacity-80"
                                : "opacity-100",
                            )}
                          />
                          <span className="font-bold tracking-widest text-sm text-white">
                            CHECK-OUT
                          </span>
                        </button>
                      </div>

                      {/* VIRTUAL SHIFT COUNTDOWN */}
                    {activeShiftId?.startsWith("adhoc_") ? (
                      <div className="mt-6 mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="flex items-center justify-between mb-3 relative z-10">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-600" />
                            <span className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-widest leading-none mt-0.5">Ca ảo đang chạy</span>
                          </div>
                          <span className="text-[9px] bg-indigo-100 text-indigo-700 font-extrabold px-2 py-1 rounded shadow-sm border border-indigo-200">GIỚI HẠN: 8H</span>
                        </div>
                        <div className="flex items-center gap-3 relative z-10 bg-white/50 p-2.5 rounded-xl border border-indigo-50 backdrop-blur-sm shadow-sm group-hover:bg-white/80 transition-colors">
                          <div className="flex-1 bg-indigo-200/50 h-2 rounded-full overflow-hidden border border-indigo-100">
                            <motion.div 
                              initial={{ width: "0%" }}
                              animate={{ width: "25%" }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="bg-indigo-500 h-full rounded-full shadow-inner shadow-indigo-600/50"
                            />
                          </div>
                          <span className="font-mono text-sm font-bold text-indigo-900 tracking-tight shrink-0 bg-white px-2 py-0.5 rounded shadow-sm">05:42:15</span>
                        </div>
                        <p className="text-[10px] text-indigo-600/80 mt-3 font-medium leading-relaxed relative z-10 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>Hệ thống áp dụng Auto Check-out sau 8 tiếng đối với ca chưa có lịch để tránh gian lận giờ làm.</span>
                        </p>
                      </div>
                    ) : (
                      <div className="mt-6 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-200/50 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="flex items-center justify-between mb-3 relative z-10">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span className="text-[10px] font-extrabold uppercase tracking-widest leading-none mt-0.5">Thời gian thực</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 relative z-10 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm group-hover:shadow transition-shadow">
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: "0%" }}
                              animate={{ width: "70%" }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="bg-slate-400 h-full rounded-full"
                            />
                          </div>
                          <span className="font-mono text-sm font-bold text-slate-800 tracking-tight shrink-0">05:42:15</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-3 font-medium leading-relaxed relative z-10 flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>Cảnh báo OT sau 90 phút (End_shift) và tự động đóng ca tại mốc 120 phút. Nếu bị bắt lỗi Missing_Checkout, bạn sẽ phải làm ticket báo cáo.</span>
                        </p>
                      </div>
                    )}
                    <p className="text-xs font-medium text-text-muted mt-6 flex flex-col items-center gap-1">
                      <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase text-[10px] font-bold tracking-wider">
                          Tan ca
                        </span>
                        Giữ 1 giây để kết thúc ca làm việc
                      </p>
                    </motion.div>
                  )}

                  {/* --- STATE: DONE --- */}
                  {attState === "done" && scenario !== "forgot_in" && (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center w-full flex flex-col items-center"
                    >
                      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 border border-green-100">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Đã hoàn tất ca
                      </h3>
                      <p className="text-xs font-bold text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100 w-full text-center">
                        Dữ liệu đã được ghi nhận. Hẹn gặp lại!
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- LOGS --- */}
        <div className="mt-8 mb-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
              Lịch sử hôm nay
            </h3>
            <Link
              to="/timesheet"
              className="text-[11px] font-bold text-gray-500 flex items-center hover:text-black uppercase tracking-wide"
            >
              Bảng công <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="space-y-3 relative">
            {logs.length > 1 && (
              <div className="absolute left-[1.125rem] top-6 bottom-6 w-0.5 bg-gray-100 -z-10"></div>
            )}
            <AnimatePresence>
              {logs.map((log, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm flex items-start gap-4"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm text-white",
                      log.type === "in"
                        ? "bg-black"
                        : log.type === "out"
                          ? "bg-gray-800"
                          : "bg-orange-500",
                    )}
                  >
                    {log.type === "in" || log.type === "exception" ? (
                      <ArrowRight className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 mt-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-sm">
                        {log.type === "in"
                          ? "Vào ca"
                          : log.type === "out"
                            ? "Tan ca"
                            : "Ngoại lệ"}
                      </p>
                      {log.type === "exception" && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                          Chờ QC duyệt
                        </span>
                      )}
                      <span className="font-mono text-gray-500 text-[11px] font-bold tracking-tight bg-gray-100 px-1.5 py-0.5 rounded">
                        {log.time instanceof Date ? format(log.time, "HH:mm") : ""}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-500 mt-1">
                      {log.note}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {logs.length === 0 && (
              <p className="text-center text-xs font-bold text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-xl">
                Chưa có dữ liệu lịch sử
              </p>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODAL: LỖI GPS / VALIDATION EXCEPTION
          ===================================================================== */}
      <AnimatePresence>
        {showGpsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-xl w-full max-w-sm m-4"
            >
              <div className="bg-red-50 border border-red-100 p-3 rounded-xl inline-flex mb-4 text-red-600 shadow-sm">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Lỗi xác thực vị trí
              </h3>
              <p className="text-xs text-gray-500 mb-5 font-medium leading-relaxed">
                Hệ thống phát hiện thiết bị đang nằm{" "}
                <span className="font-bold text-red-600">
                  ngoài vùng định vị (GPS)
                </span>{" "}
                hoặc sai địa chỉ MAC Wifi cửa hàng.
              </p>

              <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                Lý do (Bắt buộc):
              </label>
              <select
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-black mb-3 appearance-none"
                onChange={(e) => {
                  const val = e.target.value;
                  // Handle setting exception reason in state if needed, or just use ref/value
                }}
                id="exception-reason"
              >
                <option value="Lỗi GPS thiết bị / Mạng chập chờn">
                  Lỗi GPS thiết bị / Mạng chập chờn
                </option>
                <option value="Mất điện / Không có Wifi cửa hàng">
                  Mất điện / Không có Wifi cửa hàng
                </option>
                <option value="Điểm danh hộ (Có sự đồng ý của Quản lý)">
                  Điểm danh hộ (Có sự đồng ý của Quản lý)
                </option>
                <option value="Khác">Khác...</option>
              </select>

              <textarea
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 text-xs focus:outline-none focus:border-black mb-3"
                rows={2}
                placeholder="Mô tả thêm chi tiết (Tùy chọn)..."
                id="exception-note"
              ></textarea>

              <button 
                id="selfie-btn"
                onClick={(e) => {
                  const btn = e.currentTarget;
                  btn.classList.remove("bg-white", "border-gray-200", "text-gray-700");
                  btn.classList.add("bg-emerald-50", "border-solid", "border-emerald-500", "text-emerald-700");
                  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2 w-4 h-4 mr-2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg> Đã chụp Selfie Timestamp`;
                  const submitBtn = document.getElementById("exception-submit-btn") as HTMLButtonElement | null;
                  if (submitBtn) {
                     submitBtn.disabled = false;
                     submitBtn.classList.remove("bg-gray-200", "text-gray-400", "cursor-not-allowed");
                     submitBtn.classList.add("bg-blue-600", "hover:bg-blue-700", "text-white", "shadow-sm");
                  }
                }}
                className="w-full flex items-center justify-center py-3 bg-white border-2 border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-700 mb-6 transition-all hover:bg-gray-50"
              >
                <Camera className="w-4 h-4 mr-2" /> Chụp Selfie vòng quét (Bắt buộc)
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowGpsModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 border border-transparent text-gray-700 font-bold rounded-xl text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  id="exception-submit-btn"
                  disabled
                  onClick={() => {
                    setShowGpsModal(false);
                    const reason = (
                      document.getElementById(
                        "exception-reason",
                      ) as HTMLSelectElement
                    )?.value;
                    const note = (
                      document.getElementById(
                        "exception-note",
                      ) as HTMLTextAreaElement
                    )?.value;
                    proceedCheckIn(
                      `Ngoại lệ: ${reason}${note ? " - " + note : ""} [Đã đính kèm Selfie]`,
                    );
                  }}
                  className="flex-[2] py-3 bg-gray-200 text-gray-400 cursor-not-allowed font-bold rounded-xl text-sm transition-colors"
                >
                  Gửi Ngoại lệ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: LATE OUT */}
        {showLateOutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg w-full max-w-sm m-4"
            >
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl inline-flex mb-4 text-blue-600">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Phân loại giờ tan ca
              </h3>
              <p className="text-xs text-gray-500 mb-5 font-medium leading-relaxed">
                Hệ thống nhận thấy bạn đang tan ca trễ{" "}
                <span className="font-bold text-blue-600">45 phút</span> so với
                lịch đăng ký. Vui lòng xác định tính chất:
              </p>

              <div className="space-y-3 mb-6">
                <label className="flex items-start gap-3 p-4 bg-white border-2 border-gray-100 rounded-xl cursor-pointer has-[:checked]:bg-blue-50/50 has-[:checked]:border-blue-500 transition-all shadow-sm">
                  <input
                    type="radio"
                    name="lateout"
                    className="w-5 h-5 accent-blue-600 mt-0.5"
                    defaultChecked
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Làm thêm giờ (OT)
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-tight font-medium">
                      Yêu cầu tính lương OT. Sẽ tạo Ticket tự động.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 bg-white border-2 border-gray-100 rounded-xl cursor-pointer has-[:checked]:bg-gray-50 has-[:checked]:border-black transition-all shadow-sm">
                  <input
                    type="radio"
                    name="lateout"
                    className="w-5 h-5 accent-black mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Lý do cá nhân
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-tight font-medium">
                      Ở lại đợi bạn bè, che mưa... KHÔNG được tính lương.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLateOutModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors border border-transparent"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    setShowLateOutModal(false);
                    processFinalCheckOut("Phân loại: OT");
                  }}
                  className="flex-[2] py-3 bg-black hover:bg-gray-900 text-white font-bold rounded-xl text-sm transition-all border border-transparent shadow-sm"
                >
                  Check-out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: FORGOT CHECK-IN BLOCKER */}
        {showForgotInModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 border-2 border-red-100 shadow-xl w-full max-w-sm m-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>

              <div className="flex items-center gap-3 mb-5 relative z-10">
                <div className="bg-red-50 border border-red-100 w-12 h-12 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">
                    Bổ sung Check-in
                  </h3>
                  <p className="text-xs text-red-600 font-bold uppercase tracking-wide mt-0.5">
                    Hệ thống thiếu dữ liệu
                  </p>
                </div>
              </div>

              <div className="relative z-10">
                {/* Context Card */}
                <div className="bg-gray-50 border-2 border-gray-100 rounded-xl p-3.5 mb-5 flex items-start gap-3">
                  <div className="bg-white border border-gray-200 w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-gray-400">
                      T{new Date().getDay() + 1}
                    </span>
                    <span className="text-sm font-bold text-gray-900 leading-none">
                      {new Date().getDate()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {shiftType === "morning" ? "Ca Sáng" : "Ca Tối"}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-mono font-medium mt-0.5">
                      {shiftType === "morning"
                        ? "08:00 - 12:00"
                        : "15:00 - 19:00"}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border-2 border-red-100 mb-6 shadow-sm">
                  <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    Giờ vào ca thực tế <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="forgot-in-time"
                    type="time"
                    className="w-full bg-gray-50 border-2 border-gray-100 py-3 px-4 rounded-xl focus:outline-none focus:border-red-500 mb-4 font-mono font-bold text-base transition-all"
                    defaultValue={shiftType === "morning" ? "08:00" : "15:00"}
                  />

                  <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    Lý do quên check-in <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="forgot-in-reason"
                    className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl text-sm focus:outline-none focus:border-red-500 mb-1 transition-all"
                    rows={2}
                    placeholder="VD: Điện thoại hết pin, máy lỗi ứng dụng..."
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 relative z-10">
                <button
                  onClick={() => setShowForgotInModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    setShowForgotInModal(false);
                    const time =
                      (
                        document.getElementById(
                          "forgot-in-time",
                        ) as HTMLInputElement
                      )?.value || "08:00";
                    const reason =
                      (
                        document.getElementById(
                          "forgot-in-reason",
                        ) as HTMLTextAreaElement
                      )?.value || "Quên check-in";

                    // Call Fake API Pause Incident Ticket
                    setLogs((prev) => [
                      {
                        type: "exception",
                        note: `Check-in bổ sung (${time}): ${reason}`,
                        // Note: Mocking Pause Incident Ticket & CHT notification
                        time: new Date(),
                      },
                      ...prev,
                    ]);

                    // Recover the UI
                    setScenario("normal");
                    setAttState(
                      shiftType === "morning" ? "checklist_open" : "working",
                    );
                    setHasCheckedIn(true);
                  }}
                  className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
                >
                  Gửi yêu cầu bổ sung
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: FORGOT OUT (AUTO CHECKOUT) */}
        {showForgotOutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 border-2 border-amber-100 shadow-xl w-full max-w-sm m-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>

              <div className="flex items-center gap-3 mb-5 relative z-10">
                <div className="bg-amber-50 border border-amber-100 w-12 h-12 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">
                    Bổ sung Check-out
                  </h3>
                  <p className="text-xs text-amber-600 font-bold uppercase tracking-wide mt-0.5">
                    Hệ thống đóng ca tự động
                  </p>
                </div>
              </div>

              <div className="relative z-10">
                <p className="text-xs text-gray-500 mb-4 font-medium leading-relaxed">
                  Ca làm việc của bạn đã kéo dài quá giới hạn và bị đóng tự
                  động. Vui lòng khai báo giờ ra ca thực tế.
                </p>

                {/* Context Card */}
                <div className="bg-gray-50 border-2 border-gray-100 rounded-xl p-3.5 mb-5 flex items-start gap-3">
                  <div className="bg-white border border-gray-200 w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-gray-400">
                      T{new Date().getDay() + 1}
                    </span>
                    <span className="text-sm font-bold text-gray-900 leading-none">
                      {new Date().getDate()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {shiftType === "morning" ? "Ca Sáng" : "Ca Tối"}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-mono font-medium mt-0.5">
                      {shiftType === "morning"
                        ? "08:00 - 12:00"
                        : "15:00 - 19:00"}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border-2 border-amber-100 mb-6 shadow-sm">
                  <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    Giờ ra ca thực tế <span className="text-amber-500">*</span>
                  </label>
                  <input
                    id="forgot-out-time"
                    type="time"
                    className="w-full bg-gray-50 border-2 border-gray-100 py-3 px-4 rounded-xl focus:outline-none focus:border-amber-500 mb-4 font-mono font-bold text-base transition-all"
                    defaultValue={shiftType === "morning" ? "12:00" : "19:00"}
                  />

                  <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    Lý do quên check-out{" "}
                    <span className="text-amber-500">*</span>
                  </label>
                  <textarea
                    id="forgot-out-reason"
                    className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl text-sm focus:outline-none focus:border-amber-500 mb-1 transition-all"
                    rows={2}
                    placeholder="VD: Khách đông quá, máy pos lỗi..."
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 relative z-10">
                <button
                  onClick={() => setShowForgotOutModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 border border-transparent text-gray-700 font-bold rounded-xl text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    setShowForgotOutModal(false);
                    const time =
                      (
                        document.getElementById(
                          "forgot-out-time",
                        ) as HTMLInputElement
                      )?.value || "20:00";
                    const reason =
                      (
                        document.getElementById(
                          "forgot-out-reason",
                        ) as HTMLTextAreaElement
                      )?.value || "Quên check-out";

                    setLogs((prev) => [
                      {
                        type: "exception",
                        note: `Check-out bổ sung (${time}): ${reason}`,
                        time: new Date(),
                      },
                      ...prev,
                    ]);

                    setScenario("normal");
                    setAttState("done");
                  }}
                  className="flex-[2] py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
                >
                  Gửi yêu cầu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {/* MODAL: BLOCK CHECKIN */}
        {showBlockCheckinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 border-2 border-red-100 shadow-xl w-full max-w-sm m-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>

              <div className="flex items-center gap-3 mb-5 relative z-10">
                <div className="bg-red-50 border border-red-100 w-12 h-12 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">
                    Không thể Check-in
                  </h3>
                  <p className="text-xs text-red-600 font-bold uppercase tracking-wide mt-0.5">
                    Hệ thống bị khóa
                  </p>
                </div>
              </div>

              <div className="relative z-10">
                <p className="text-xs text-gray-600 font-medium leading-relaxed mb-6">
                  Bạn không thể bắt đầu ca làm việc mới vì chưa giải quyết các
                  sự cố chấm công từ ca làm việc trước đó. Vui lòng trở về
                  Action Center để bổ sung thông tin!
                </p>
              </div>

              <div className="flex gap-3 relative z-10">
                <button
                  onClick={() => setShowBlockCheckinModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 border border-transparent text-gray-700 font-bold rounded-xl text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    setShowBlockCheckinModal(false);
                    navigate("/requests");
                  }}
                  className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
                >
                  Về Action Center
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: AD-HOC SHIFT */}
        {showAdhocModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 border-2 border-indigo-100 shadow-xl w-full max-w-sm m-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>

              <div className="flex items-center gap-3 mb-5 relative z-10">
                <div className="bg-indigo-50 border border-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">
                    Ca Đột Xuất
                  </h3>
                  <p className="text-xs text-indigo-600 font-bold uppercase tracking-wide mt-0.5">
                    Khai báo thông tin
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-4 relative z-10">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Cửa hàng
                  </label>
                  <select
                    value={adhocStore}
                    onChange={(e) => setAdhocStore(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium appearance-none"
                  >
                    <option value="" disabled>
                      Chọn cửa hàng...
                    </option>
                    <option value="HMK Nguyễn Trãi">HMK Nguyễn Trãi</option>
                    <option value="HMK Cầu Giấy">HMK Cầu Giấy</option>
                    <option value="HMK Thái Hà">HMK Thái Hà</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Lý do
                  </label>
                  <select
                    value={adhocReason}
                    onChange={(e) => setAdhocReason(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium appearance-none"
                  >
                    <option value="" disabled>
                      Chọn lý do...
                    </option>
                    <option value="Tăng cường giờ cao điểm">
                      Tăng cường giờ cao điểm
                    </option>
                    <option value="Quản lý gọi hỗ trợ">
                      Quản lý gọi hỗ trợ
                    </option>
                    <option value="Thay thế nhân sự ốm">
                      Thay thế nhân sự ốm
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Vai trò đảm nhiệm
                  </label>
                  <select
                    value={adhocSkill}
                    onChange={(e) => setAdhocSkill(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium appearance-none"
                  >
                    <option value="" disabled>
                      Chọn vai trò...
                    </option>
                    {user?.skills?.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 mb-6 relative z-10 flex gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                  Vì là ca Đột xuất, thao tác này sẽ kích hoạt <span className="font-bold text-amber-800">Cờ Ngoại lệ</span>. Quản lý bắt buộc phải <span className="font-bold text-amber-800 underline">Hợp thức hóa</span> ca này sau khi bạn kết thúc, nếu không bạn sẽ không được tính lương!
                </p>
              </div>

              <div className="flex gap-3 relative z-10">
                <button
                  onClick={() => setShowAdhocModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 border border-transparent text-gray-700 font-bold rounded-xl text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  disabled={!adhocStore || !adhocReason || !adhocSkill}
                  onClick={() => {
                    setShowAdhocModal(false);
                    const newShift = addAdhocShift(
                      adhocStore,
                      adhocSkill,
                      adhocReason,
                    );
                    setActiveShiftId(newShift.id);
                    setShiftType("morning"); // arbitrary
                    setAttState("pending_in");
                  }}
                  className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
                >
                  {activeShiftId?.startsWith("adhoc_") ? "Cập nhật" : "Tiếp tục"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {/* MODAL: AD-HOC SHIFT */}
      </AnimatePresence>
    </div>
  );
}
