import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MapPin,
  Wifi,
  Smartphone,
  Shield,
  Fingerprint,
  CalendarDays,
  AlertTriangle,
  FileText,
  Camera,
  ChevronRight,
  ArrowRight,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  RefreshCw,
  X,
  AlertCircle,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  useApp,
  Shift,
  AttendanceTicket,
  SecurityViolationType,
  AttendanceActionType,
} from "@/context/AppContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import Toast, { ToastType } from "@/components/Toast";

type AttState =
  | "checking_location"
  | "pending_in"
  | "checklist_open"
  | "working"
  | "checklist_close"
  | "done";

type ShiftType = "morning" | "night";

export type ScenarioType =
  | "normal"
  | "early_window"
  | "early_beyond"
  | "gps_fail"
  | "wifi_fail"
  | "device_fail"
  | "multi_fail"
  | "missing_in_created"
  | "missing_in_explained"
  | "missing_in_then_in"
  | "missing_both_ended"
  | "sandwich_handshake"
  | "sandwich_return_ready"
  | "travel_return_modal"
  | "travel_return_invalid"
  | "return_missing_in";

export default function Attendance() {
  const [searchParams] = useSearchParams();
  const initScenario = (searchParams.get("scenario") as ScenarioType) || "normal";

  const [time, setTime] = useState(new Date());

  // Dev & Scenario State
  const [scenario, setScenario] = useState<ScenarioType>(initScenario);
  const [shiftType, setShiftType] = useState<ShiftType>("morning");

  // Security Status States (GPS, Wi-Fi/MAC, Device)
  const [gpsStatus, setGpsStatus] = useState<"PASS" | "FAIL">("PASS");
  const [wifiStatus, setWifiStatus] = useState<"PASS" | "FAIL">("PASS");
  const [deviceStatus, setDeviceStatus] = useState<"PASS" | "FAIL">("PASS");
  const [lastCheckedTime, setLastCheckedTime] = useState<string>(
    format(new Date(), "HH:mm:ss")
  );
  const [isCheckingSecurity, setIsCheckingSecurity] = useState(false);

  // App State from Context
  const {
    user,
    setHasCheckedIn,
    availableShifts,
    attendanceTickets,
    submitAttendanceTicket,
    submitSecurityTicket,
    submitMissingCheckInExplanation,
    autoCancelMissingCheckInOnSuccess,
    submitTravelClaimTicket,
    acceptSandwichHandshake,
    rejectSandwichHandshake,
    transitionShiftToMissingBoth,
    addAdhocShift,
  } = useApp();

  const [attState, setAttState] = useState<AttState>("pending_in");
  const [checks, setChecks] = useState<boolean[]>([false, false, false]);
  const [logs, setLogs] = useState<
    { type: "in" | "out" | "exception"; note: string; time: Date }[]
  >([]);
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; subMessage?: string; type: ToastType } | null>(
    null
  );

  // Modals & Bottom Sheets
  const [showSecurityModal, setShowSecurityModal] = useState<{
    open: boolean;
    violationType: SecurityViolationType;
    actionType: AttendanceActionType;
  } | null>(null);

  const [showViewTicketModal, setShowViewTicketModal] = useState<AttendanceTicket | null>(null);
  const [showMissingInExplanationModal, setShowMissingInExplanationModal] = useState(false);
  const [showTravelReturnModal, setShowTravelReturnModal] = useState(false);
  const [checkoutBTime, setCheckoutBTime] = useState<string | null>("15:03");
  const [checkinATime, setCheckinATime] = useState<string | null>("15:42");
  const [travelClaimMinutes, setTravelClaimMinutes] = useState<number>(39);
  const [travelClaimError, setTravelClaimError] = useState<string | null>(null);
  const [travelSubmitted, setTravelSubmitted] = useState(false);

  // Helper to parse "HH:mm" to minutes from midnight
  const parseTimeToMinutes = (timeStr: string): number => {
    const parts = timeStr.split(":");
    if (parts.length < 2) return 0;
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  // Dynamically calculate actual absence minutes from checkout B & checkin A
  const calculatedActualAbsenceMinutes = useMemo(() => {
    if (!checkoutBTime || !checkinATime) return 0;
    const outMins = parseTimeToMinutes(checkoutBTime);
    const inMins = parseTimeToMinutes(checkinATime);
    return Math.max(0, inMins - outMins);
  }, [checkoutBTime, checkinATime]);

  const [showAdhocModal, setShowAdhocModal] = useState(false);
  const [adhocStore, setAdhocStore] = useState("");
  const [adhocReason, setAdhocReason] = useState("");
  const [adhocSkill, setAdhocSkill] = useState("");

  const [showLateOutModal, setShowLateOutModal] = useState(false);

  const navigate = useNavigate();

  // Hold Action State
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Apply scenario settings
  useEffect(() => {
    applyScenario(scenario);
  }, [scenario]);

  const applyScenario = (sc: ScenarioType) => {
    setIsCheckingSecurity(false);
    setLastCheckedTime(format(new Date(), "HH:mm:ss"));

    switch (sc) {
      case "normal":
        setGpsStatus("PASS");
        setWifiStatus("PASS");
        setDeviceStatus("PASS");
        setAttState("pending_in");
        setHasCheckedIn(false);
        break;
      case "early_window":
      case "early_beyond":
        setGpsStatus("PASS");
        setWifiStatus("PASS");
        setDeviceStatus("PASS");
        setAttState("pending_in");
        setHasCheckedIn(false);
        break;
      case "gps_fail":
        setGpsStatus("FAIL");
        setWifiStatus("PASS");
        setDeviceStatus("PASS");
        setAttState("pending_in");
        break;
      case "wifi_fail":
        setGpsStatus("PASS");
        setWifiStatus("FAIL");
        setDeviceStatus("PASS");
        setAttState("pending_in");
        break;
      case "device_fail":
        setGpsStatus("PASS");
        setWifiStatus("PASS");
        setDeviceStatus("FAIL");
        setAttState("pending_in");
        break;
      case "multi_fail":
        setGpsStatus("FAIL");
        setWifiStatus("FAIL");
        setDeviceStatus("PASS");
        setAttState("pending_in");
        break;
      case "missing_in_created":
        setGpsStatus("PASS");
        setWifiStatus("PASS");
        setDeviceStatus("PASS");
        setAttState("pending_in");
        setHasCheckedIn(false);
        break;
      case "missing_in_explained":
        setGpsStatus("PASS");
        setWifiStatus("PASS");
        setDeviceStatus("PASS");
        setAttState("pending_in");
        setHasCheckedIn(false);
        break;
      case "missing_in_then_in":
        setGpsStatus("PASS");
        setWifiStatus("PASS");
        setDeviceStatus("PASS");
        setAttState("pending_in");
        setHasCheckedIn(false);
        break;
      case "missing_both_ended":
        setGpsStatus("PASS");
        setWifiStatus("PASS");
        setDeviceStatus("PASS");
        setAttState("done");
        setHasCheckedIn(false);
        break;
      case "sandwich_handshake":
        setGpsStatus("PASS");
        setWifiStatus("PASS");
        setDeviceStatus("PASS");
        setActiveShiftId("case_handshake_today");
        break;
      case "sandwich_return_ready":
        setGpsStatus("PASS");
        setWifiStatus("PASS");
        setDeviceStatus("PASS");
        setAttState("pending_in");
        setHasCheckedIn(false);
        break;
      case "travel_return_modal":
        setGpsStatus("PASS");
        setWifiStatus("PASS");
        setDeviceStatus("PASS");
        setAttState("working");
        setHasCheckedIn(true);
        setTravelClaimMinutes(39);
        setTravelClaimError(null);
        setShowTravelReturnModal(true);
        break;
      case "travel_return_invalid":
        setGpsStatus("PASS");
        setWifiStatus("PASS");
        setDeviceStatus("PASS");
        setAttState("working");
        setHasCheckedIn(true);
        setTravelClaimMinutes(45); // Invalid > 39
        setTravelClaimError("Thời gian đề nghị không được lớn hơn thời gian vắng thực tế.");
        setShowTravelReturnModal(true);
        break;
      case "return_missing_in":
        setGpsStatus("PASS");
        setWifiStatus("PASS");
        setDeviceStatus("PASS");
        setAttState("pending_in");
        break;
      default:
        break;
    }
  };

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Enter Attendance screen trigger (mount)
  useEffect(() => {
    recheckSecurity();
  }, []);

  // 2. App returns to foreground (visibilitychange & focus) & 4. Return to Attendance from another screen
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        recheckSecurity();
      }
    };
    const handleWindowFocus = () => {
      recheckSecurity();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  // Security recheck trigger function (used for triggers 1, 2, 3, 4)
  const recheckSecurity = () => {
    setIsCheckingSecurity(true);
    setTimeout(() => {
      setIsCheckingSecurity(false);
      setLastCheckedTime(format(new Date(), "HH:mm:ss"));
      // Re-apply based on current scenario or toggle
      if (
        scenario === "gps_fail" ||
        scenario === "wifi_fail" ||
        scenario === "device_fail" ||
        scenario === "multi_fail"
      ) {
        // Preserves current fail state in fail scenarios
      } else {
        setGpsStatus("PASS");
        setWifiStatus("PASS");
        setDeviceStatus("PASS");
      }
    }, 400);
  };

  // Immediate synchronous security evaluation right before final punch (triggers 5 & 6)
  const evaluateSecurityNow = (): boolean => {
    const nowTime = format(new Date(), "HH:mm:ss");
    setLastCheckedTime(nowTime);
    return gpsStatus === "PASS" && wifiStatus === "PASS" && deviceStatus === "PASS";
  };

  // Check if security is completely valid
  const isSecurityValid =
    gpsStatus === "PASS" && wifiStatus === "PASS" && deviceStatus === "PASS";

  // Filter approved shifts for today
  const todayShifts = availableShifts
    .filter((s) => s.status === "approved" || s.requireHandshake)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const currentShift =
    todayShifts.find((s) => s.id === activeShiftId) || todayShifts[0];

  // Look for existing security tickets for the current shift & action
  const currentAction: AttendanceActionType =
    attState === "working" ? "CHECK_OUT" : "CHECK_IN";

  // Item 2: Duplicate detection scoped by Employee + Shift + Action (CHECK_IN/CHECK_OUT) + Violation Type + Active Ticket State
  const getExistingTicketForViolation = (violationType: SecurityViolationType) => {
    return attendanceTickets.find(
      (t) =>
        t.type === "security_violation" &&
        t.violationType === violationType &&
        t.actionType === currentAction &&
        t.status !== "CANCELLED" &&
        (!user || t.employeeId === user.id) &&
        (!currentShift || t.relatedShift?.id === currentShift.id)
    );
  };

  // Check if there is an active Missing Check-In ticket
  const activeMissingInTicket = attendanceTickets.find(
    (t) =>
      t.type === "missing_check_in" &&
      t.status === "PENDING" &&
      (!currentShift || t.relatedShift?.id === currentShift.id)
  );

  const activeMissingBothTicket = attendanceTickets.find(
    (t) =>
      t.type === "missing_both" &&
      t.status === "PENDING" &&
      (!currentShift || t.relatedShift?.id === currentShift.id)
  );

  // Missing Check-in Gate: if active missing check in exists and is not explained, block normal check-in
  const isMissingInUnexplained =
    scenario === "missing_in_created" ||
    scenario === "return_missing_in" ||
    (Boolean(activeMissingInTicket) && activeMissingInTicket?.isExplained !== true);

  // Hold Action handlers
  const startHoldAction = (action: () => void) => {
    if (isCheckingSecurity) return;
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    let progress = 0;
    holdTimerRef.current = setInterval(() => {
      progress += 5; // 5% every 50ms = 1000ms = 1s hold
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

  // Check-In Attempt Handler
  const handleCheckInAttempt = () => {
    // 1. Trigger 5: Re-evaluate security IMMEDIATELY before submitting real Check-in
    const freshValid = evaluateSecurityNow();
    if (!freshValid) {
      setToast({
        message: "Không thể chấm công do điều kiện bảo mật chưa hợp lệ.",
        type: "error",
      });
      return;
    }

    // 2. Missing Check-In explanation gate: MUST be blocked if unexplained
    if (isMissingInUnexplained) {
      setToast({
        message: "Vui lòng gửi giải trình Missing Check-In trước khi tiếp tục Check-in.",
        type: "error",
      });
      return;
    }

    // Scenario specific flows
    if (scenario === "early_beyond") {
      proceedCheckIn("Early Check-In Exception (Sớm hơn khung cho phép)");
      return;
    }

    if (
      scenario === "missing_in_explained" ||
      scenario === "missing_in_then_in" ||
      activeMissingInTicket
    ) {
      // Check-in after missing check-in: auto-cancel missing check-in ticket
      autoCancelMissingCheckInOnSuccess(currentShift?.id);
      proceedCheckIn();
      setToast({
        message: "Check-in thành công",
        subMessage: "Ticket Missing Check-In đã được hệ thống tự động hủy.",
        type: "success",
      });
      return;
    }

    if (scenario === "sandwich_return_ready" || currentShift?.isReturnShift) {
      proceedCheckIn("Check-in ca quay lại Store A");
      const punchTimeStr = format(new Date(), "HH:mm");
      setCheckinATime(punchTimeStr);
      if (!checkoutBTime) setCheckoutBTime("15:03");
      const calculatedMins = Math.max(
        0,
        parseTimeToMinutes(punchTimeStr) - parseTimeToMinutes(checkoutBTime || "15:03")
      );
      setTravelClaimMinutes(calculatedMins > 0 ? calculatedMins : 39);
      // Trigger travel claim bottom sheet AFTER valid Check-in A
      setTimeout(() => {
        setShowTravelReturnModal(true);
      }, 600);
      return;
    }

    proceedCheckIn();
  };

  const proceedCheckIn = (notePrefix?: string) => {
    const isAdhoc = activeShiftId?.startsWith("adhoc_");
    const punchNote = notePrefix
      ? notePrefix
      : isAdhoc
      ? "Check-in đột xuất"
      : "Check-in thành công";

    setLogs((prev) => [
      {
        type: notePrefix || isAdhoc ? "exception" : "in",
        note: punchNote,
        time: new Date(),
      },
      ...prev,
    ]);

    setAttState(shiftType === "morning" ? "checklist_open" : "working");
    setHasCheckedIn(true);

    if (!toast) {
      setToast({
        message: "Check-in thành công!",
        type: "success",
      });
    }
  };

  // Check-Out Attempt Handler
  const handleCheckOutAttempt = () => {
    // Trigger 6: Re-evaluate security IMMEDIATELY before submitting real Check-out
    const freshValid = evaluateSecurityNow();
    if (!freshValid) {
      setToast({
        message: "Không thể Check-out do điều kiện bảo mật chưa hợp lệ.",
        type: "error",
      });
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
    setLogs((prev) => [
      {
        type: reason ? "exception" : "out",
        note: reason ? `Check-out: ${reason}` : "Check-out thành công",
        time: new Date(),
      },
      ...prev,
    ]);
    setAttState("done");
    setHasCheckedIn(false);
    setToast({
      message: "Check-out hoàn tất ca làm việc!",
      type: "success",
    });
  };

  // Handle Travel Claim Input Change
  const handleTravelClaimChange = (val: number) => {
    setTravelClaimMinutes(val);
    if (val > calculatedActualAbsenceMinutes) {
      setTravelClaimError(
        `Thời gian đề nghị không được lớn hơn thời gian vắng thực tế (${calculatedActualAbsenceMinutes} phút).`
      );
    } else if (val < 0) {
      setTravelClaimError("Thời gian đề nghị không hợp lệ.");
    } else {
      setTravelClaimError(null);
    }
  };

  const handleTravelClaimSubmit = () => {
    if (!checkoutBTime || !checkinATime) return;
    if (travelClaimMinutes > calculatedActualAbsenceMinutes || travelClaimMinutes < 0) return;

    submitTravelClaimTicket({
      shiftId: currentShift?.id || "shift_return",
      storeA: currentShift?.storeName || "HMK Nguyễn Trãi (Store A)",
      storeB: "HMK Cầu Giấy (Store B)",
      checkoutBTime: checkoutBTime,
      checkinATime: checkinATime,
      actualAbsenceMinutes: calculatedActualAbsenceMinutes,
      claimMinutes: travelClaimMinutes,
    });

    setTravelSubmitted(true);
    setTimeout(() => {
      setShowTravelReturnModal(false);
      setTravelSubmitted(false);
      setToast({
        message: "Đã gửi thời gian di chuyển chiều về",
        subMessage: "Đang chờ Quản lý Store A phê duyệt.",
        type: "success",
      });
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full relative bg-slate-50/50 pb-24">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* --- SCENARIO TESTING CONTROLS (QA PANEL) --- */}
      <div className="pt-4 px-4 pb-2">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-600" /> Bảng điều khiển kiểm thử (QA Scenarios)
            </h3>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
              MOB-06 & Attendance
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Kịch bản Chấm công
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                value={scenario}
                onChange={(e) => {
                  const val = e.target.value as ScenarioType;
                  setScenario(val);
                }}
              >
                <optgroup label="Bảo mật & Check-in Chuẩn">
                  <option value="normal">1. Chuẩn (Bảo mật 3/3 Hợp lệ, đúng giờ)</option>
                  <option value="early_window">2. Check-in sớm trong khung cho phép (Hợp lệ)</option>
                  <option value="early_beyond">3. Check-in sớm hơn khung (Early Exception)</option>
                </optgroup>
                <optgroup label="Lỗi Bảo mật Độc lập (Security Fail)">
                  <option value="gps_fail">4. Lỗi GPS (Không hợp lệ)</option>
                  <option value="wifi_fail">5. Lỗi Wi-Fi / MAC (Không hợp lệ)</option>
                  <option value="device_fail">6. Lỗi Thiết bị (Không hợp lệ)</option>
                  <option value="multi_fail">7. Nhiều lỗi bảo mật cùng lúc (GPS + Wi-Fi)</option>
                </optgroup>
                <optgroup label="Missing Check-In & Missing Both">
                  <option value="missing_in_created">8. Missing Check-In (Hệ thống tạo tự động)</option>
                  <option value="missing_in_explained">9. Missing Check-In (Đã giải trình - Chờ hết ca)</option>
                  <option value="missing_in_then_in">10. Missing Check-In -&gt; Check-in thành công (Auto-cancel)</option>
                  <option value="missing_both_ended">11. Ca kết thúc -&gt; Chuyển thành Missing Both</option>
                </optgroup>
                <optgroup label="Kẹp ca (Sandwich A-B-A) & Di chuyển">
                  <option value="sandwich_handshake">12. Điều động Kẹp Ca A→B→A (Chờ Handshake)</option>
                  <option value="sandwich_return_ready">13. Ca quay lại A (Sẵn sàng Check-in tại A)</option>
                  <option value="travel_return_modal">14. Khai báo di chuyển chiều về (Hợp lệ 39p)</option>
                  <option value="travel_return_invalid">15. Khai báo di chuyển (Test lỗi Claim &gt; Vắng thực tế)</option>
                  <option value="return_missing_in">16. Ca quay lại - Missing Check-In</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Ca làm việc mô phỏng
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                value={shiftType}
                onChange={(e) => {
                  setShiftType(e.target.value as ShiftType);
                  setAttState("pending_in");
                  setLogs([]);
                }}
              >
                <option value="morning">Ca Sáng (08:00 - 15:00 · Checklist Mở)</option>
                <option value="night">Ca Tối (15:00 - 22:00 · Checklist Đóng)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
            <button
              onClick={() => setGpsStatus((p) => (p === "PASS" ? "FAIL" : "PASS"))}
              className={cn(
                "py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all flex items-center justify-center gap-1",
                gpsStatus === "PASS"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-600 border-red-200"
              )}
            >
              GPS: {gpsStatus === "PASS" ? "✅ PASS" : "❌ FAIL"}
            </button>
            <button
              onClick={() => setWifiStatus((p) => (p === "PASS" ? "FAIL" : "PASS"))}
              className={cn(
                "py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all flex items-center justify-center gap-1",
                wifiStatus === "PASS"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-600 border-red-200"
              )}
            >
              Wi-Fi: {wifiStatus === "PASS" ? "✅ PASS" : "❌ FAIL"}
            </button>
            <button
              onClick={() => setDeviceStatus((p) => (p === "PASS" ? "FAIL" : "PASS"))}
              className={cn(
                "py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all flex items-center justify-center gap-1",
                deviceStatus === "PASS"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-600 border-red-200"
              )}
            >
              Thiết bị: {deviceStatus === "PASS" ? "✅ PASS" : "❌ FAIL"}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-2" id="attendance-workspace">
        {/* Header */}
        <div className="flex justify-between items-end mb-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
              Chấm công
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ghi nhận ca làm việc & điều kiện bảo mật
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Hôm nay
            </span>
            <span className="text-sm font-black text-slate-800">
              {format(new Date(), "dd/MM/yyyy")}
            </span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* SECTION A: COMPACT SECURITY STATUS CARD */}
        {/* ==================================================== */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center",
                isSecurityValid ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 leading-tight">
                  Điều kiện chấm công
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  Xác thực 3 lớp độc lập
                </p>
              </div>
            </div>

            <button
              onClick={recheckSecurity}
              disabled={isCheckingSecurity}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                className={cn(
                  "w-3.5 h-3.5",
                  isCheckingSecurity && "animate-spin text-indigo-600"
                )}
              />
              {isCheckingSecurity ? "Đang kiểm tra..." : "Kiểm tra lại"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* GPS */}
            <div
              className={cn(
                "p-2.5 rounded-xl border flex flex-col justify-between transition-all",
                gpsStatus === "PASS"
                  ? "bg-slate-50/60 border-slate-100"
                  : "bg-red-50/50 border-red-200"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> GPS
                </span>
                {gpsStatus === "PASS" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-extrabold uppercase tracking-wide",
                  gpsStatus === "PASS" ? "text-emerald-700" : "text-red-700"
                )}
              >
                {gpsStatus === "PASS" ? "Hợp lệ" : "Không hợp lệ"}
              </span>
            </div>

            {/* Wi-Fi/MAC */}
            <div
              className={cn(
                "p-2.5 rounded-xl border flex flex-col justify-between transition-all",
                wifiStatus === "PASS"
                  ? "bg-slate-50/60 border-slate-100"
                  : "bg-red-50/50 border-red-200"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-slate-400" /> Wi-Fi/MAC
                </span>
                {wifiStatus === "PASS" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-extrabold uppercase tracking-wide",
                  wifiStatus === "PASS" ? "text-emerald-700" : "text-red-700"
                )}
              >
                {wifiStatus === "PASS" ? "Hợp lệ" : "Không hợp lệ"}
              </span>
            </div>

            {/* Device */}
            <div
              className={cn(
                "p-2.5 rounded-xl border flex flex-col justify-between transition-all",
                deviceStatus === "PASS"
                  ? "bg-slate-50/60 border-slate-100"
                  : "bg-red-50/50 border-red-200"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" /> Thiết bị
                </span>
                {deviceStatus === "PASS" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-extrabold uppercase tracking-wide",
                  deviceStatus === "PASS" ? "text-emerald-700" : "text-red-700"
                )}
              >
                {deviceStatus === "PASS" ? "Hợp lệ" : "Không hợp lệ"}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Kiểm tra lần cuối: {lastCheckedTime}</span>
            <span
              className={cn(
                "font-bold",
                isSecurityValid ? "text-emerald-600" : "text-red-600"
              )}
            >
              {isSecurityValid ? "Đủ điều kiện chấm công (3/3)" : "Phát hiện lỗi bảo mật"}
            </span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* SECTION B: SECURITY FAIL UI & TICKET CREATION CTAs */}
        {/* ==================================================== */}
        {!isSecurityValid && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 shadow-xs"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0 text-red-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide">
                  Không thể chấm công do điều kiện bảo mật chưa hợp lệ.
                </h4>
                <p className="text-[11px] text-red-700 mt-0.5 font-medium leading-relaxed">
                  Vui lòng kiểm tra kết nối mạng hoặc gửi phiếu giải trình độc lập cho từng sự cố bảo mật dưới đây:
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-red-200/60">
              {/* GPS Failure row */}
              {gpsStatus === "FAIL" && (() => {
                const existing = getExistingTicketForViolation("GPS");
                return (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-red-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Lỗi GPS / Vị trí</span>
                        <span className="text-[10px] text-slate-400">Nằm ngoài bán kính cho phép của cửa hàng</span>
                      </div>
                    </div>
                    {existing ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                          Đã gửi phiếu — Chờ duyệt
                        </span>
                        <button
                          onClick={() => setShowViewTicketModal(existing)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline px-1"
                        >
                          Xem phiếu
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setShowSecurityModal({
                            open: true,
                            violationType: "GPS",
                            actionType: currentAction,
                          })
                        }
                        className="text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-xl transition-all shadow-xs active:scale-95"
                      >
                        Tạo phiếu GPS
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Wi-Fi Failure row */}
              {wifiStatus === "FAIL" && (() => {
                const existing = getExistingTicketForViolation("WIFI");
                return (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-red-100">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-3.5 h-3.5 text-red-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Lỗi Wi-Fi / BSSID</span>
                        <span className="text-[10px] text-slate-400">Chưa kết nối đúng mạng Wi-Fi đã đăng ký</span>
                      </div>
                    </div>
                    {existing ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                          Đã gửi phiếu — Chờ duyệt
                        </span>
                        <button
                          onClick={() => setShowViewTicketModal(existing)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline px-1"
                        >
                          Xem phiếu
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setShowSecurityModal({
                            open: true,
                            violationType: "WIFI",
                            actionType: currentAction,
                          })
                        }
                        className="text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-xl transition-all shadow-xs active:scale-95"
                      >
                        Tạo phiếu Wi-Fi/MAC
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Device Failure row */}
              {deviceStatus === "FAIL" && (() => {
                const existing = getExistingTicketForViolation("DEVICE");
                return (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-red-100">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-red-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Lỗi Thiết bị chấm công</span>
                        <span className="text-[10px] text-slate-400">Thiết bị không trùng khớp mã phần cứng đã duyệt</span>
                      </div>
                    </div>
                    {existing ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                          Đã gửi phiếu — Chờ duyệt
                        </span>
                        <button
                          onClick={() => setShowViewTicketModal(existing)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline px-1"
                        >
                          Xem phiếu
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setShowSecurityModal({
                            open: true,
                            violationType: "DEVICE",
                            actionType: currentAction,
                          })
                        }
                        className="text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-xl transition-all shadow-xs active:scale-95"
                      >
                        Tạo phiếu thiết bị
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* ==================================================== */}
        {/* SECTION C: EARLY CHECK-IN BANNERS */}
        {/* ==================================================== */}
        {scenario === "early_window" && isSecurityValid && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-5 shadow-xs flex items-start gap-3"
          >
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                Bạn đang Check-in sớm trong khung cho phép.
              </h4>
              <p className="text-[11px] text-indigo-800 mt-0.5 font-medium leading-relaxed">
                Giờ bấm thực tế sẽ được ghi nhận; giờ tính công mặc định bắt đầu từ giờ chuẩn của ca ({currentShift?.timeStr.split(" - ")[0] || "08:00"}).
              </p>
            </div>
          </motion.div>
        )}

        {scenario === "early_beyond" && isSecurityValid && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 shadow-xs flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                Bạn đang Check-in sớm hơn khung cho phép.
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5 font-medium leading-relaxed">
                Nếu điều kiện bảo mật hợp lệ, hệ thống vẫn ghi nhận Check-in và tạo <span className="font-bold">Early Check-In Exception</span> gửi Quản lý phê duyệt.
              </p>
            </div>
          </motion.div>
        )}

        {/* ==================================================== */}
        {/* SECTION E & G: MISSING CHECK-IN & MISSING BOTH CARDS */}
        {/* ==================================================== */}
        {/* 1. Missing Check-In (Pending Explanation or Explained) */}
        {(scenario === "missing_in_created" ||
          scenario === "missing_in_explained" ||
          scenario === "return_missing_in" ||
          activeMissingInTicket) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-2xl p-4 mb-5 border shadow-card",
              activeMissingInTicket?.isExplained || scenario === "missing_in_explained"
                ? "bg-amber-50/70 border-amber-200"
                : "bg-red-50/70 border-red-200"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
                    activeMissingInTicket?.isExplained || scenario === "missing_in_explained"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-600"
                  )}
                >
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    {activeMissingInTicket?.isExplained || scenario === "missing_in_explained"
                      ? "Đã giải trình – Chờ kết thúc ca"
                      : `Bạn chưa Check-in cho ca ${currentShift?.timeStr || "08:00 – 15:00"}`}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium leading-relaxed">
                    {activeMissingInTicket?.isExplained || scenario === "missing_in_explained"
                      ? "Bạn có thể thực hiện Check-in lại bất cứ lúc nào nếu ca làm việc vẫn đang diễn ra."
                      : "Hệ thống tự động ghi nhận sự cố Missing Check-in. Vui lòng gửi giải trình lý do chưa vào ca."}
                  </p>
                </div>
              </div>

              {!(activeMissingInTicket?.isExplained || scenario === "missing_in_explained") && (
                <button
                  onClick={() => setShowMissingInExplanationModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs shrink-0 active:scale-95 uppercase tracking-wider"
                >
                  Giải trình
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* 2. Missing Both (Shift Ended without Punches) */}
        {(scenario === "missing_both_ended" || activeMissingBothTicket) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 text-white rounded-2xl p-5 mb-5 shadow-lg border border-slate-800"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0 text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-red-500 text-white px-2 py-0.5 rounded">
                    Missing Both
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Ca 08:00 – 15:00</span>
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Ca đã kết thúc — Chờ quản lý xác minh
                </h4>
                <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                  Ca làm việc đã quá giờ kết thúc mà không có dữ liệu Check-in và Check-out hợp lệ. Hồ sơ đã được chuyển tới Action Center / Yêu cầu.
                </p>
                <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">Trạng thái: Chờ Quản lý xác minh</span>
                  <button
                    onClick={() => navigate("/requests")}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    Xem trong Action Center <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================================================== */}
        {/* SECTION J: SANDWICH HANDSHAKE CARD (A → B → A) */}
        {/* ==================================================== */}
        {currentShift?.requireHandshake && currentShift.isSandwichHandshake && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-5 mb-6 shadow-xl border border-indigo-500/30 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-[10px] font-black bg-indigo-500 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-xs">
                Yêu cầu điều động
              </span>
              <span className="text-xs text-indigo-200 font-bold">
                {currentShift.timeStr}
              </span>
            </div>

            <h3 className="text-lg font-black tracking-tight text-white mb-2 relative z-10">
              Điều động kẹp ca A → B → A
            </h3>
            <p className="text-xs text-slate-300 font-medium leading-relaxed mb-5 relative z-10">
              Bạn được quản lý phân công hỗ trợ chi nhánh khác trong ca làm việc. Vui lòng xác nhận lịch trình:
            </p>

            {/* Sandwich 3 steps visual */}
            <div className="space-y-2.5 mb-6 relative z-10 bg-white/5 p-3.5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Ca gốc (Store A):
                </span>
                <span className="font-bold text-white">HMK Nguyễn Trãi · 08:00 – 11:00</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-y border-white/10">
                <span className="font-bold text-indigo-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span> Hỗ trợ (Store B):
                </span>
                <span className="font-bold text-white">HMK Cầu Giấy · 11:00 – 15:00</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Quay lại (Store A):
                </span>
                <span className="font-bold text-white">HMK Nguyễn Trãi · 15:00 – 18:00</span>
              </div>
            </div>

            <div className="flex gap-3 relative z-10">
              <button
                onClick={() => {
                  rejectSandwichHandshake(currentShift.id);
                  setToast({
                    message: "Đã từ chối điều động kẹp ca",
                    type: "info",
                  });
                }}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all uppercase tracking-wider active:scale-95"
              >
                Từ chối
              </button>
              <button
                onClick={() => {
                  acceptSandwichHandshake(currentShift.id);
                  setToast({
                    message: "Đã đồng ý điều động kẹp ca A → B → A",
                    subMessage: "Lịch làm việc đã được tách thành 3 ca độc lập.",
                    type: "success",
                  });
                }}
                className="flex-[2] py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <Check className="w-4 h-4" /> Đồng ý nhận ca
              </button>
            </div>
          </motion.div>
        )}

        {/* ==================================================== */}
        {/* SHIFTS LIST (WHEN MULTIPLE SHIFTS TODAY) */}
        {/* ==================================================== */}
        {!activeShiftId && (
          <div className="mb-6">
            <h2 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Danh sách ca hôm nay
            </h2>

            <div className="space-y-3">
              {todayShifts.map((shift) => (
                <div
                  key={shift.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all relative overflow-hidden bg-white shadow-card",
                    shift.isReturnShift
                      ? "border-amber-200 bg-amber-50/20"
                      : shift.isSupportShift
                      ? "border-indigo-200 bg-indigo-50/20"
                      : "border-slate-100"
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xl font-black text-slate-900">
                          {shift.timeStr}
                        </span>
                        {shift.isSupportShift && (
                          <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-wider border border-indigo-200">
                            HỖ TRỢ
                          </span>
                        )}
                        {shift.isReturnShift && (
                          <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase tracking-wider border border-amber-200">
                            CA QUAY LẠI
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-600 mt-0.5">
                        {shift.shiftName} · {shift.storeName}
                      </p>
                    </div>

                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                      {shift.hours} giờ
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveShiftId(shift.id);
                      setShiftType(
                        shift.shiftName.includes("Tối") || shift.shiftName.includes("Đêm")
                          ? "night"
                          : "morning"
                      );
                      setAttState("pending_in");
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    Vào chấm công ca này <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back button if a shift is selected */}
        {activeShiftId && (
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setActiveShiftId(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wide flex items-center gap-1 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" /> Xem tất cả ca hôm nay
            </button>

            {currentShift?.isReturnShift && (
              <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-amber-200">
                Ca quay lại — Store A
              </span>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* MAIN PUNCH WORKSPACE CARD */}
        {/* ==================================================== */}
        {scenario !== "missing_both_ended" && (
          <div className="bg-white rounded-3xl shadow-card border border-slate-200 overflow-hidden relative mb-6">
            {/* Card Header */}
            <div className="bg-slate-50/80 p-5 flex justify-between items-start border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2">
                  {currentShift?.shiftName || "Ca Sáng"}
                  {" · "}
                  <span className="text-slate-600 font-semibold">
                    {currentShift?.storeName || "HMK Nguyễn Trãi"}
                  </span>
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {currentShift?.timeStr || "08:00 - 15:00"}
                  </div>
                  {currentShift?.isReturnShift && (
                    <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase tracking-wider">
                      Store A (Nguyễn Trãi)
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span
                  className={cn(
                    "text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider border block text-center",
                    attState === "working"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  )}
                >
                  {attState === "working" ? "Đang trong ca" : "Chưa vào ca"}
                </span>
              </div>
            </div>

            {/* Time Display & Punch Control */}
            <div className="p-8 flex flex-col items-center justify-center min-h-[260px] relative">
              <h3 className="text-4xl font-display tracking-tight font-black text-slate-900 mb-8 font-mono">
                {time instanceof Date ? format(time, "HH:mm:ss") : "00:00:00"}
              </h3>

              <AnimatePresence mode="wait">
                {/* --- STATE: PENDING IN (CHECK-IN) --- */}
                {attState === "pending_in" && (
                  <motion.div
                    key="in-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div
                      className={cn(
                        "relative flex items-center justify-center w-40 h-40 group cursor-pointer select-none",
                        !isSecurityValid && "cursor-not-allowed opacity-80"
                      )}
                      onPointerDown={() => {
                        if (!isSecurityValid) {
                          setToast({
                            message: "Không thể chấm công do điều kiện bảo mật chưa hợp lệ.",
                            type: "error",
                          });
                        } else if (isMissingInUnexplained) {
                          setToast({
                            message: "Vui lòng gửi giải trình Missing Check-In trước khi tiếp tục Check-in.",
                            type: "error",
                          });
                        } else {
                          startHoldAction(handleCheckInAttempt);
                        }
                      }}
                      onPointerUp={cancelHold}
                      onPointerLeave={cancelHold}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ touchAction: "none" }}
                    >
                      {/* Outline circle */}
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none">
                        <circle
                          cx="80"
                          cy="80"
                          r="72"
                          className="stroke-slate-100"
                          strokeWidth="8"
                          fill="none"
                        />
                        {/* Hold Progress Circle */}
                        <circle
                          cx="80"
                          cy="80"
                          r="72"
                          className={cn(
                            "transition-all duration-75",
                            !isSecurityValid ? "stroke-red-500" : isMissingInUnexplained ? "stroke-amber-500" : "stroke-slate-900"
                          )}
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray="452.39"
                          strokeDashoffset={
                            452.39 - (452.39 * holdProgress) / 100
                          }
                          strokeLinecap="round"
                        />
                      </svg>

                      {/* Fingerprint Button */}
                      <button
                        className={cn(
                          "w-32 h-32 rounded-full flex flex-col items-center justify-center text-white transition-all duration-300 pointer-events-none relative overflow-hidden shadow-xl",
                          !isSecurityValid
                            ? "bg-red-500 shadow-red-200"
                            : isMissingInUnexplained
                            ? "bg-amber-600 shadow-amber-200"
                            : "bg-slate-900 shadow-slate-200",
                          holdProgress > 0 ? "scale-90" : "group-hover:scale-105"
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        <AnimatePresence mode="wait">
                          {holdProgress > 0 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 bg-white/15"
                            />
                          )}
                        </AnimatePresence>

                        {!isSecurityValid ? (
                          <Lock className="w-10 h-10 mb-1.5 relative z-10" />
                        ) : isMissingInUnexplained ? (
                          <AlertTriangle className="w-10 h-10 mb-1.5 relative z-10 text-amber-100" />
                        ) : (
                          <Fingerprint className="w-10 h-10 mb-1.5 relative z-10" />
                        )}

                        <span className="font-black tracking-[0.2em] text-[10px] uppercase relative z-10 text-center px-1">
                          {!isSecurityValid ? "BỊ KHÓA" : isMissingInUnexplained ? "CẦN GIẢI TRÌNH" : "CHECK-IN"}
                        </span>
                      </button>
                    </div>

                    <div className="mt-6 flex flex-col items-center gap-2">
                      {!isSecurityValid ? (
                        <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full text-red-700 text-xs font-bold">
                          <XCircle className="w-4 h-4" /> Điều kiện bảo mật chưa đạt
                        </div>
                      ) : isMissingInUnexplained ? (
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full text-amber-800 text-xs font-bold">
                          <AlertTriangle className="w-4 h-4 text-amber-600" /> Cần gửi giải trình Missing Check-In
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Ấn & giữ 1 giây để quét vân tay
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* --- STATE: WORKING (CHECK-OUT) --- */}
                {attState === "working" && (
                  <motion.div
                    key="working-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div
                      className={cn(
                        "relative flex items-center justify-center w-40 h-40 group cursor-pointer select-none",
                        !isSecurityValid && "cursor-not-allowed opacity-80"
                      )}
                      onPointerDown={() => {
                        if (isSecurityValid) {
                          startHoldAction(handleCheckOutAttempt);
                        } else {
                          setToast({
                            message: "Không thể Check-out do điều kiện bảo mật chưa hợp lệ.",
                            type: "error",
                          });
                        }
                      }}
                      onPointerUp={cancelHold}
                      onPointerLeave={cancelHold}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ touchAction: "none" }}
                    >
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none">
                        <circle
                          cx="80"
                          cy="80"
                          r="72"
                          className="stroke-slate-100"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="72"
                          className="stroke-amber-600 transition-all duration-75"
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
                          "w-32 h-32 rounded-full flex flex-col items-center justify-center text-white transition-all duration-300 pointer-events-none relative overflow-hidden shadow-xl bg-amber-600 shadow-amber-200",
                          holdProgress > 0 ? "scale-90" : "group-hover:scale-105"
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        <Fingerprint className="w-10 h-10 mb-1.5 relative z-10" />
                        <span className="font-black tracking-[0.2em] text-[10px] uppercase relative z-10">
                          CHECK-OUT
                        </span>
                      </button>
                    </div>

                    <div className="mt-6 flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                        <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                          Ấn & giữ để kết thúc ca
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* --- STATE: CHECKLIST OPEN/CLOSE --- */}
                {(attState === "checklist_open" ||
                  attState === "checklist_close") && (
                  <motion.div
                    key="checklist"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="w-full"
                  >
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-5 flex items-start gap-3">
                      <Info className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-indigo-950 mb-0.5">
                          {attState === "checklist_open"
                            ? "Checklist Mở Ca Làm Việc"
                            : "Checklist Đóng Ca & Bàn Giao"}
                        </p>
                        <p className="text-xs text-indigo-800 font-medium">
                          {attState === "checklist_open"
                            ? "Hoàn thành các hạng mục đầu ca trước khi nhận tác vụ."
                            : "Kiểm tra an toàn cửa hàng trước khi hoàn tất Check-out."}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-6">
                      {[
                        attState === "checklist_open"
                          ? "Vệ sinh khu vực quầy & tủ kính"
                          : "Tắt toàn bộ hệ thống điều hòa & đèn",
                        attState === "checklist_open"
                          ? "Kiểm đếm tiền quỹ đầu ca"
                          : "Chốt két & niêm phong doanh thu",
                        attState === "checklist_open"
                          ? "Khởi động hệ thống POS & Camera"
                          : "Khóa cửa cuốn, kích hoạt báo động",
                      ].map((task, i) => (
                        <label
                          key={i}
                          className={cn(
                            "flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all",
                            checks[i]
                              ? "bg-slate-50 border-slate-300"
                              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                              checks[i]
                                ? "bg-slate-900 border-slate-900 text-white"
                                : "bg-white border-slate-300"
                            )}
                          >
                            {checks[i] && <Check className="w-3.5 h-3.5" />}
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
                              "text-xs font-bold transition-all",
                              checks[i] ? "text-slate-400 line-through" : "text-slate-800"
                            )}
                          >
                            {task}
                          </span>
                        </label>
                      ))}
                    </div>

                    <button
                      disabled={!checks.every(Boolean)}
                      onClick={() => {
                        if (attState === "checklist_open") {
                          setAttState("working");
                          setToast({
                            message: "Hoàn tất Checklist Mở ca! Bắt đầu tính công.",
                            type: "success",
                          });
                        } else {
                          processFinalCheckOut();
                        }
                      }}
                      className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-98"
                    >
                      {attState === "checklist_open"
                        ? "Xác nhận & Bắt đầu làm việc"
                        : "Xác nhận & Hoàn tất Check-out"}
                    </button>
                  </motion.div>
                )}

                {/* --- STATE: DONE --- */}
                {attState === "done" && (
                  <motion.div
                    key="done-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100 w-full"
                  >
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2.5" />
                    <h4 className="font-bold text-slate-900 text-base">
                      Ca làm việc đã kết thúc
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Dữ liệu chấm công đã được đồng bộ với hệ thống tính lương.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Adhoc Shift Button */}
        <button
          onClick={() => setShowAdhocModal(true)}
          className="w-full border-2 border-dashed border-slate-200 bg-white py-4 rounded-2xl text-slate-600 font-bold uppercase tracking-wider text-xs hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-xs"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-slate-900 text-xs font-bold leading-tight">Chấm công ca đột xuất</p>
            <p className="text-[10px] text-slate-400 font-normal normal-case">Dành cho trường hợp hỗ trợ chưa có lịch trước</p>
          </div>
        </button>

        {/* Attendance Activity Logs */}
        {logs.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Nhật ký bấm công hôm nay
            </h3>
            <div className="space-y-2">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        log.type === "in"
                          ? "bg-emerald-500"
                          : log.type === "out"
                          ? "bg-amber-500"
                          : "bg-indigo-500"
                      )}
                    ></span>
                    <span className="font-bold text-slate-800">{log.note}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 font-medium">
                    {format(log.time, "HH:mm:ss")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL: SECURITY TICKET CREATION (GPS / WIFI / DEVICE) */}
      {/* ==================================================== */}
      <AnimatePresence>
        {showSecurityModal?.open && (
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
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl w-full max-w-sm m-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Tạo phiếu {showSecurityModal.violationType}
                    </h3>
                    <p className="text-[11px] text-red-600 font-bold uppercase tracking-wider">
                      Giải trình vi phạm bảo mật
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSecurityModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Read-only Context */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Ca làm việc:</span>
                  <span className="font-bold text-slate-900">
                    {currentShift?.shiftName || "Ca Sáng"} ({currentShift?.timeStr || "08:00 - 15:00"})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Địa điểm:</span>
                  <span className="font-bold text-slate-900">
                    {currentShift?.storeName || "HMK Nguyễn Trãi"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Thao tác:</span>
                  <span className="font-bold text-slate-900">
                    {showSecurityModal.actionType === "CHECK_IN" ? "Check-in" : "Check-out"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Loại sự cố:</span>
                  <span className="font-bold text-red-600">
                    {showSecurityModal.violationType === "GPS"
                      ? "Lỗi Vị trí GPS"
                      : showSecurityModal.violationType === "WIFI"
                      ? "Lỗi Wi-Fi / MAC"
                      : "Lỗi Thiết bị chấm công"}
                  </span>
                </div>
              </div>

              {/* Editable Reason */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
                  Lý do giải trình <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="security-violation-reason"
                  rows={3}
                  placeholder="Mô tả chi tiết nguyên nhân (VD: Khu vực bị mất sóng GPS, Wi-Fi cửa hàng vừa đổi mật khẩu...)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-slate-900 transition-all placeholder:text-slate-400"
                ></textarea>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowSecurityModal(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    const reason =
                      (
                        document.getElementById(
                          "security-violation-reason"
                        ) as HTMLTextAreaElement
                      )?.value || "Giải trình sự cố bảo mật chấm công";

                    if (!currentShift) return;

                    submitSecurityTicket({
                      shift: currentShift,
                      action: showSecurityModal.actionType,
                      violationType: showSecurityModal.violationType,
                      reason: reason,
                    });

                    setShowSecurityModal(null);
                    setToast({
                      message: "Đã gửi phiếu giải trình bảo mật",
                      subMessage: "Phiếu đang chờ Quản lý cửa hàng phê duyệt.",
                      type: "success",
                    });
                  }}
                  className="flex-[2] py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  Gửi phiếu giải trình
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ==================================================== */}
        {/* MODAL: VIEW TICKET DETAILS (FOR EXISTING TICKETS) */}
        {/* ==================================================== */}
        {showViewTicketModal && (
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
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl w-full max-w-sm m-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {showViewTicketModal.id}
                  </span>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded uppercase">
                    Chờ duyệt
                  </span>
                </div>
                <button
                  onClick={() => setShowViewTicketModal(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2">
                Phiếu giải trình {showViewTicketModal.violationType || "Bảo mật"}
              </h3>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5 text-xs mb-5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ca:</span>
                  <span className="font-bold text-slate-900">
                    {showViewTicketModal.relatedShift?.shiftName || "Ca Sáng"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian gửi:</span>
                  <span className="font-bold text-slate-900">
                    {format(showViewTicketModal.submittedAt, "HH:mm, dd/MM/yyyy")}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-slate-500 block mb-1">Nội dung giải trình:</span>
                  <p className="text-slate-800 font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                    {showViewTicketModal.reason}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowViewTicketModal(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Đóng
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ==================================================== */}
        {/* MODAL: MISSING CHECK-IN EXPLANATION */}
        {/* ==================================================== */}
        {showMissingInExplanationModal && (
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
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl w-full max-w-sm m-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Giải trình Missing Check-In
                    </h3>
                    <p className="text-[11px] text-red-600 font-bold uppercase tracking-wide">
                      Hệ thống tự động ghi nhận
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMissingInExplanationModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Context Summary */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Cửa hàng:</span>
                  <span className="font-bold text-slate-900">
                    {currentShift?.storeName || "HMK Nguyễn Trãi"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Ca làm việc:</span>
                  <span className="font-bold text-slate-900">
                    {currentShift?.shiftName || "Ca Sáng"} ({currentShift?.timeStr || "08:00 – 15:00"})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Trạng thái ticket:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Chờ giải trình
                  </span>
                </div>
              </div>

              {/* Explanation textarea (NO manual time input!) */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
                  Lý do giải trình <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="missing-checkin-reason"
                  rows={3}
                  placeholder="Nhập lý do chưa bấm Check-in (VD: Khách đông phục vụ liên tục, hỗ trợ chi nhánh khác...)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-slate-900 transition-all placeholder:text-slate-400"
                ></textarea>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowMissingInExplanationModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    const reason =
                      (
                        document.getElementById(
                          "missing-checkin-reason"
                        ) as HTMLTextAreaElement
                      )?.value || "Đã giải trình Missing Check-In";

                    if (activeMissingInTicket) {
                      submitMissingCheckInExplanation(activeMissingInTicket.id, reason);
                    } else {
                      submitAttendanceTicket({
                        type: "missing_check_in",
                        date: new Date(),
                        reason: reason,
                        useAnnualLeaveIntent: false,
                        relatedShift: currentShift ? {
                          id: currentShift.id,
                          shiftName: currentShift.shiftName,
                          timeStr: currentShift.timeStr,
                          storeName: currentShift.storeName,
                          hours: currentShift.hours,
                        } : undefined,
                      });
                    }

                    setShowMissingInExplanationModal(false);
                    setScenario("missing_in_explained");
                    setToast({
                      message: "Đã lưu giải trình Missing Check-In",
                      subMessage: "Bạn vẫn có thể Check-in lại bình thường trong thời gian diễn ra ca.",
                      type: "success",
                    });
                  }}
                  className="flex-[2] py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ==================================================== */}
        {/* SECTION L: TRAVEL RETURN CLAIM MODAL / BOTTOM SHEET */}
        {/* ==================================================== */}
        {showTravelReturnModal && (
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
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl w-full max-w-sm m-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Khai báo di chuyển chiều về
                    </h3>
                    <p className="text-[11px] text-indigo-600 font-bold uppercase tracking-wide">
                      Hỗ trợ B → Quay lại A
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTravelReturnModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Read-only Absence Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5 text-xs mb-5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Check-out tại Store B (Cầu Giấy):</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {checkoutBTime || "Chưa ghi nhận"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Check-in tại Store A (Nguyễn Trãi):</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {checkinATime || "Chưa ghi nhận"}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-slate-700 font-bold">Thời gian vắng thực tế:</span>
                  <span className="font-extrabold text-indigo-700 font-mono text-sm">
                    {calculatedActualAbsenceMinutes} phút
                  </span>
                </div>
              </div>

              {(!checkoutBTime || !checkinATime) && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Khai báo di chuyển chỉ khả dụng sau khi có đầy đủ Check-out tại Store B và Check-in tại Store A.
                </div>
              )}

              {/* Editable Travel Minutes Claim */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
                  Thời gian di chuyển đề nghị (phút) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={travelClaimMinutes}
                    onChange={(e) => handleTravelClaimChange(parseInt(e.target.value) || 0)}
                    min={0}
                    max={60}
                    disabled={!checkoutBTime || !checkinATime || calculatedActualAbsenceMinutes <= 0}
                    className={cn(
                      "w-full bg-slate-50 border rounded-xl py-3 px-4 text-base font-bold font-mono focus:outline-none transition-all",
                      travelClaimError
                        ? "border-red-500 text-red-700 bg-red-50/50"
                        : "border-slate-200 text-slate-900 focus:border-slate-900",
                      (!checkoutBTime || !checkinATime) && "opacity-60 cursor-not-allowed"
                    )}
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">
                    phút
                  </span>
                </div>

                {/* Inline Validation Error */}
                {travelClaimError && (
                  <p className="text-[11px] text-red-600 font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {travelClaimError}
                  </p>
                )}
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowTravelReturnModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Bỏ qua
                </button>
                <button
                  disabled={
                    !!travelClaimError ||
                    travelClaimMinutes <= 0 ||
                    !checkoutBTime ||
                    !checkinATime ||
                    calculatedActualAbsenceMinutes <= 0
                  }
                  onClick={handleTravelClaimSubmit}
                  className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  {travelSubmitted ? "Đang gửi..." : "Gửi xác nhận di chuyển"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ==================================================== */}
        {/* MODAL: AD-HOC SHIFT */}
        {/* ==================================================== */}
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
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl w-full max-w-sm m-4 relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-indigo-50 w-11 h-11 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Chấm công Ca Đột Xuất
                  </h3>
                  <p className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">
                    Khai báo thông tin ca
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Cửa hàng
                  </label>
                  <select
                    value={adhocStore}
                    onChange={(e) => setAdhocStore(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-3 outline-none focus:border-slate-900 font-semibold"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Lý do đột xuất
                  </label>
                  <select
                    value={adhocReason}
                    onChange={(e) => setAdhocReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-3 outline-none focus:border-slate-900 font-semibold"
                  >
                    <option value="" disabled>
                      Chọn lý do...
                    </option>
                    <option value="Tăng cường giờ cao điểm">Tăng cường giờ cao điểm</option>
                    <option value="Quản lý gọi hỗ trợ gấp">Quản lý gọi hỗ trợ gấp</option>
                    <option value="Thay thế nhân sự nghỉ đột xuất">Thay thế nhân sự nghỉ đột xuất</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Vai trò đảm nhiệm
                  </label>
                  <select
                    value={adhocSkill}
                    onChange={(e) => setAdhocSkill(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-3 outline-none focus:border-slate-900 font-semibold"
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

              <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 mb-5 flex gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                  Ca đột xuất sẽ được gửi kèm <span className="font-bold">Cờ ngoại lệ</span> để Quản lý duyệt hợp thức hóa sau khi bạn hoàn thành ca.
                </p>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowAdhocModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
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
                      adhocReason
                    );
                    setActiveShiftId(newShift.id);
                    setShiftType("morning");
                    setAttState("pending_in");
                    setToast({
                      message: "Đã tạo ca đột xuất thành công",
                      type: "info",
                    });
                  }}
                  className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  Vào ca ngay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
