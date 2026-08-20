import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, LeaveRequestType, AttendanceTicket } from "@/context/AppContext";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  Plus,
  Plane,
  Umbrella,
  Clock,
  FileText,
  ChevronRight,
  RefreshCw,
  Send,
  Inbox,
  CheckCircle2,
  XCircle,
  Camera,
  X,
  AlertTriangle,
  FastForward,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

const formatDateDDMMYYYY = (d: any): string => {
  if (!d) return "";
  if (typeof d === "string") {
    if (d.includes("T")) {
      return format(new Date(d), "dd/MM/yyyy", { locale: vi });
    }
    const parts = d.split("-");
    if (parts.length === 3) {
      return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
    }
  }
  if (d instanceof Date) {
    return format(d, "dd/MM/yyyy", { locale: vi });
  }
  return format(new Date(d), "dd/MM/yyyy", { locale: vi });
};

type RequestTab = "sent" | "received";

const mockSentRequests = [
  {
    id: "RQ-SWAP-01",
    type: "swap",
    title: "Yêu cầu đổi ca",
    date: "Vừa xong",
    status: "pending-peer",
    icon: RefreshCw,
    color: "text-primary",
    detail: {
      peer: "Thanh Nhàn",
      giveShift: "Ca Sáng (20/11)",
      takeShift: "Không có",
    },
  },
  {
    id: "RQ-SWAP-04",
    type: "swap",
    title: "Yêu cầu đổi ca",
    date: "Hôm qua",
    status: "rejected-peer",
    icon: RefreshCw,
    color: "text-gray-500",
    detail: {
      peer: "Hải Đăng",
      giveShift: "Ca Sáng (18/11)",
      takeShift: "Ca Chiều (19/11)",
      rejectReason:
        'Đồng nghiệp từ chối: "Mình có việc bận đột xuất rồi bạn nhé"',
    },
  },
  {
    id: "RQ-SWAP-05",
    type: "swap",
    title: "Yêu cầu đổi ca",
    date: "Thứ 2",
    status: "rejected-manager",
    icon: RefreshCw,
    color: "text-gray-500",
    detail: {
      peer: "Trần Vũ",
      giveShift: "Ca Chiều (15/11)",
      takeShift: "Không có",
      rejectReason: 'Quản lý từ chối: "Trần Vũ chưa đủ cứng để đứng ca 1 mình"',
    },
  },
];

const mockReceivedRequests = [
  {
    id: "TK-OUT-032",
    type: "forgot_out",
    title: "Bổ sung Check-out",
    date: "30/07/2026 13:45",
    status: "action-needed",
    statusLabel: "CẦN XỬ LÝ",
    icon: AlertTriangle,
    color: "text-red-600",
    isActionable: true,
    detail: {
      peer: "Hệ thống báo lỗi",
      msg: "Ca làm việc tối qua đã bị đóng tự động do bạn quên check-out.",
    },
  },
  {
    id: "TK-IN-017",
    type: "forgot_in",
    title: "Bổ sung Check-in",
    date: "21/05/2026 08:15",
    status: "action-needed",
    statusLabel: "CẦN XỬ LÝ",
    icon: AlertTriangle,
    color: "text-red-600",
    isActionable: true,
    detail: {
      peer: "Hệ thống báo lỗi",
      msg: "Hệ thống không ghi nhận giờ Check-in ca sáng.",
    },
  },
  {
    id: "RQ-SWAP-02",
    type: "swap",
    title: "Lời mời đổi ca",
    date: "Vài giờ trước",
    status: "pending-peer",
    icon: RefreshCw,
    color: "text-primary",
    detail: {
      peer: "Đoàn Tú",
      giveShift: "Ca Đêm (22/11)",
      takeShift: "Ca Sáng (23/11)",
      msg: "Tuần này mình kẹt lịch học, đổi giúp mình nhé!",
    },
    isActionable: true,
  },
];

import Toast, { ToastType } from "@/components/Toast";

export default function Requests() {
  const navigate = useNavigate();
  const {
    user,
    leaveRequests,
    leaveCancelRequests,
    leavePolicy,
    leaveBalance,
    getLeaveStatusLabel,
    getLeaveTypeLabel,
    submitLeaveRequest,
    cancelLeaveRequest,
    cancelPendingLeaveRequest,
    submitLeaveCancelRequest,
    getCancelRequestForLeave,
    availableShifts,
    hasLeaveConflict,
    calculateLeaveDaysFromMinutes,
    attendanceTickets,
    submitAttendanceTicket,
    cancelPendingAttendanceTicket,
    createBackdatedLeaveFromMissingBoth,
    commitAttendanceCorrection,
    togglePeriodLockForTicket,
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<RequestTab>("received");
  const [receivedRevs, setReceivedRevs] = useState(mockReceivedRequests);
  const [sentRevs, setSentRevs] = useState(mockSentRequests);

  // Leave Form State
  const [leaveType, setLeaveType] = useState<LeaveRequestType>("ANNUAL_LEAVE");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [selectedLeave, setSelectedLeave] = useState<any>(null); // For detail view

  // MOB-06 Attendance Ticket Form State
  const [attType, setAttType] = useState<"missing_both" | "forgot_in" | "forgot_out" | "device_error">("missing_both");
  const [attDate, setAttDate] = useState("");
  const [attTime, setAttTime] = useState("");
  const [attReason, setAttReason] = useState("");
  const [useAnnualLeaveIntent, setUseAnnualLeaveIntent] = useState(false);

  // Missing Both -> Path A: Attendance Correction State
  const [showAttendanceCorrectionModal, setShowAttendanceCorrectionModal] = useState(false);
  const [correctionTicket, setCorrectionTicket] = useState<AttendanceTicket | null>(null);
  const [correctionInTime, setCorrectionInTime] = useState("08:00");
  const [correctionOutTime, setCorrectionOutTime] = useState("15:00");
  const [correctionReason, setCorrectionReason] = useState("");

  // Missing Both -> Path B: Backdated Leave State
  const [showBackdatedLeaveModal, setShowBackdatedLeaveModal] = useState(false);
  const [backdatedTicket, setBackdatedTicket] = useState<AttendanceTicket | null>(null);
  const [backdatedLeaveType, setBackdatedLeaveType] = useState<LeaveRequestType | null>("ANNUAL_LEAVE");
  const [backdatedReason, setBackdatedReason] = useState("");

  // MOB-05 Cancel Approved Leave State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [cancelModalLeave, setCancelModalLeave] = useState<any>(null);

  // MOB-01 Leave Ledger Modal State
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  // Pending Leave Cancel Confirmation Modal State
  const [showPendingCancelModal, setShowPendingCancelModal] = useState(false);
  const [pendingCancelTarget, setPendingCancelTarget] = useState<any>(null);

  // Ensure leaveType defaults to UNPAID_LEAVE if user is not eligible for Annual Leave
  React.useEffect(() => {
    if (user && !user.annualLeaveEligible && leaveType === "ANNUAL_LEAVE") {
      setLeaveType("UNPAID_LEAVE");
    }
  }, [user, leaveType]);

  // Create Request State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reqType, setReqType] = useState<"leave" | "ot" | "attendance">("leave");

  // Calculate affected scheduled shifts and shift minutes
  const getAffectedShiftsData = () => {
    if (!fromDate || !toDate) return { affectedShifts: [], totalMinutes: 0, affectedCount: 0 };
    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(0, 0, 0, 0);

    if (start > end) return { affectedShifts: [], totalMinutes: 0, affectedCount: 0 };

    const affectedShifts: typeof availableShifts = [];
    let totalMinutes = 0;

    const curr = new Date(start);
    while (curr <= end) {
      const sTime = curr.getTime();
      const shiftsOnDay = availableShifts.filter((s) => {
        const sDate = new Date(s.date);
        sDate.setHours(0, 0, 0, 0);
        const isValidScheduledState = s.status === "approved" || s.status === "assigned";
        return isValidScheduledState && sDate.getTime() === sTime;
      });

      shiftsOnDay.forEach((s) => {
        affectedShifts.push(s);
        const shiftMins = (s.hours || 8) * 60;
        totalMinutes += shiftMins;
      });

      curr.setDate(curr.getDate() + 1);
    }

    return {
      affectedShifts,
      totalMinutes,
      affectedCount: affectedShifts.length,
    };
  };

  const { affectedShifts, totalMinutes, affectedCount } = getAffectedShiftsData();
  const { finalDays: calculatedLeaveDays } = calculateLeaveDaysFromMinutes(totalMinutes, leavePolicy);

  const todayObj = new Date();
  todayObj.setHours(0, 0, 0, 0);

  const startDateObj = fromDate ? new Date(fromDate) : null;
  if (startDateObj) startDateObj.setHours(0, 0, 0, 0);

  const endDateObj = toDate ? new Date(toDate) : null;
  if (endDateObj) endDateObj.setHours(0, 0, 0, 0);

  const isPastDateSelected = Boolean(startDateObj && startDateObj < todayObj);
  const isInvalidDateRange = Boolean(startDateObj && endDateObj && startDateObj > endDateObj);
  const isZeroShiftSelected = Boolean(fromDate && toDate && !isInvalidDateRange && !isPastDateSelected && affectedCount === 0);

  const availableAfterSubmit = Math.max(0, leaveBalance.available - calculatedLeaveDays);
  const isInsufficientBalance = leaveType === "ANNUAL_LEAVE" && (leaveBalance.available - calculatedLeaveDays) < 0;

  const handleAction = (id: string, action: "accept" | "reject") => {
    setReceivedRevs((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            status: action === "accept" ? "pending-manager" : "rejected",
            isActionable: false,
          };
        }
        return r;
      }),
    );
    setToast({
      message: action === "accept"
        ? "Đã đồng ý đổi ca. Đang chờ Quản lý phê duyệt!"
        : "Đã từ chối yêu cầu đổi ca.",
      type: action === "accept" ? 'success' : 'warning'
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reqType === "leave") {
      if (!fromDate || !toDate || !leaveType || !leaveReason) {
        setToast({ message: "Vui lòng điền đầy đủ thông tin.", type: 'error' });
        return;
      }
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(toDate);
      end.setHours(0, 0, 0, 0);

      if (start > end) {
        setToast({ message: "Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.", type: 'error' });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today || isPastDateSelected) {
        setToast({
          message: "Không thể tạo đơn nghỉ phép cho ngày đã qua. Nếu cần giải trình vắng mặt, vui lòng sử dụng Bổ sung công.",
          type: 'error'
        });
        return;
      }

      if (isZeroShiftSelected || affectedCount === 0 || totalMinutes === 0) {
        setToast({
          message: "Không có ca làm việc được xếp trong khoảng thời gian đã chọn. Bạn không cần tạo yêu cầu nghỉ phép cho khoảng thời gian này.",
          type: 'error'
        });
        return;
      }

      if (leaveType === "ANNUAL_LEAVE") {
        if (!user?.annualLeaveEligible) {
          setToast({ message: "Bạn chưa thuộc đối tượng được hưởng phép năm.", type: 'error' });
          return;
        }
        if (isInsufficientBalance) {
          setToast({ message: "Số dư phép khả dụng không đủ cho yêu cầu này.", type: 'error' });
          return;
        }
      }
      
      // Check conflict with active leave requests (PENDING / APPROVED)
      let conflict = false;
      const curr = new Date(start);
      while (curr <= end) {
        if (hasLeaveConflict(curr)) {
          conflict = true;
          break;
        }
        curr.setDate(curr.getDate() + 1);
      }
      
      if (conflict) {
        setToast({ message: "Bạn đã có yêu cầu nghỉ phép đang hiệu lực trong thời gian này.", type: 'error' });
        return;
      }

      const affectedShiftsSnapshot = affectedShifts.map((s) => {
        const [startT, endT] = (s.timeStr || "").split("-").map((t) => t.trim());
        const scheduledMins = (s.hours || 8) * 60;
        return {
          shiftId: s.id,
          date: typeof s.date === "string" ? s.date : s.date.toISOString().split("T")[0],
          shiftName: s.shiftName,
          timeStr: s.timeStr,
          startTime: startT,
          endTime: endT,
          storeName: s.storeName,
          hours: s.hours,
          scheduledDurationMinutes: scheduledMins,
        };
      });

      const uniqueStores = Array.from<string>(
        new Set(affectedShifts.map((s) => s.storeName).filter((name): name is string => Boolean(name)))
      );
      let branchSummary = "";
      if (uniqueStores.length === 1) {
        branchSummary = uniqueStores[0];
      } else if (uniqueStores.length > 1) {
        branchSummary = "Nhiều cửa hàng";
      } else {
        branchSummary = user?.department || "HMK Nguyễn Trãi";
      }

      submitLeaveRequest({
        type: leaveType,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        reason: leaveReason,
        period: "Cả ngày",
        affectedShiftMinutes: totalMinutes,
        requestedLeaveDays: calculatedLeaveDays,
        reservedDays: leaveType === "ANNUAL_LEAVE" ? calculatedLeaveDays : 0,
        officialDebitedDays: 0,
        affectedShiftIds: affectedShifts.map((s) => s.id),
        affectedShiftsList: affectedShiftsSnapshot,
        branch: branchSummary,
      }, affectedCount);
      
      setToast({
        message: leaveType === "ANNUAL_LEAVE"
          ? "Đã gửi yêu cầu nghỉ phép. Số phép tương ứng đang được giữ chỗ trong thời gian chờ duyệt."
          : "Đã gửi yêu cầu nghỉ không lương.",
        type: 'success'
      });
      setShowCreateModal(false);
      setFromDate("");
      setToDate("");
      setLeaveReason("");
      return;
    }

    if (reqType === "attendance") {
      if (!attDate || !attReason) {
        setToast({ message: "Vui lòng chọn ngày làm và nhập lý do giải trình.", type: 'error' });
        return;
      }

      const targetDate = new Date(attDate);
      targetDate.setHours(0, 0, 0, 0);
      const foundShift = availableShifts.find((s) => {
        const sDate = new Date(s.date);
        sDate.setHours(0, 0, 0, 0);
        return sDate.getTime() === targetDate.getTime();
      });

      const relatedShift = foundShift ? {
        id: foundShift.id,
        shiftName: foundShift.shiftName,
        timeStr: foundShift.timeStr,
        storeName: foundShift.storeName,
        hours: foundShift.hours,
      } : undefined;

      submitAttendanceTicket({
        type: attType,
        date: new Date(attDate),
        actualTime: attTime,
        reason: attReason,
        useAnnualLeaveIntent: user?.annualLeaveEligible ? useAnnualLeaveIntent : false,
        relatedShift,
      });

      setToast({ message: "Đã gửi giải trình điểm danh. Chờ quản lý xử lý.", type: 'success' });
      setShowCreateModal(false);
      setAttDate("");
      setAttTime("");
      setAttReason("");
      setUseAnnualLeaveIntent(false);
      return;
    }
    
    setToast({ message: "Đã gửi yêu cầu thành công. Chờ quản lý phê duyệt.", type: 'success' });
    setShowCreateModal(false);
  };

  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);

  const combinedSentRequests = [
    ...(sentRevs || []).filter((r) => r && r.type !== "leave"),
    ...(leaveRequests || []).map((lr) => {
      const isBackdated = lr.requestMode === "BACKDATED_MISSING_BOTH";
      const typeLabel = isBackdated ? "Nghỉ đột xuất" : getLeaveTypeLabel(lr.type);
      const statusLabel = getLeaveStatusLabel(lr.status);

      let mappedStatus = "pending-manager";
      let icon = Umbrella;
      let color = "text-amber-500";

      if (lr.status === "PENDING" || (lr.status as string) === "Chờ duyệt") {
        mappedStatus = "pending-manager";
        color = "text-amber-500";
      } else if (lr.status === "APPROVED" || (lr.status as string) === "Đã duyệt") {
        mappedStatus = "approved";
        color = "text-green-500";
      } else if (lr.status === "REJECTED" || (lr.status as string) === "Đã từ chối") {
        mappedStatus = "rejected-manager";
        color = "text-red-500";
      } else if (lr.status === "CANCELLED" || (lr.status as string) === "Đã hủy") {
        mappedStatus = "cancelled";
        icon = XCircle;
        color = "text-gray-500";
      } else if (lr.status === "AUTO_REJECTED") {
        mappedStatus = "auto-rejected";
        icon = XCircle;
        color = "text-purple-600";
      }

      // Calculate matching shifts for detail using stored snapshot first
      const storedList = lr.affectedShiftsList || [];
      let finalShiftList: any[] = [];

      if (storedList.length > 0) {
        finalShiftList = storedList.map((s) => ({
          id: s.shiftId || `s-${s.date}`,
          date: s.date,
          shiftName: s.shiftName,
          timeStr: s.timeStr || (s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : "08:00 - 16:00"),
          storeName: s.storeName || lr.branch || "HMK Nguyễn Trãi",
          hours: s.hours || (s.scheduledDurationMinutes ? s.scheduledDurationMinutes / 60 : 8),
          scheduledDurationMinutes: s.scheduledDurationMinutes || (s.hours ? s.hours * 60 : 480),
        }));
      } else {
        const start = new Date(lr.fromDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(lr.toDate);
        end.setHours(0, 0, 0, 0);

        const matchedShifts = availableShifts.filter((s) => {
          const sDate = new Date(s.date);
          sDate.setHours(0, 0, 0, 0);
          const isValid = s.status === "approved" || s.status === "assigned";
          return isValid && sDate.getTime() >= start.getTime() && sDate.getTime() <= end.getTime();
        });

        finalShiftList = matchedShifts.map((s) => ({
          id: s.id,
          date: typeof s.date === "string" ? s.date : s.date.toISOString().split("T")[0],
          shiftName: s.shiftName,
          timeStr: s.timeStr,
          storeName: s.storeName,
          hours: s.hours,
          scheduledDurationMinutes: (s.hours || 8) * 60,
        }));
      }

      const uniqueStores = Array.from<string>(
        new Set(finalShiftList.map((s) => s.storeName).filter((name): name is string => Boolean(name)))
      );
      let branchSummary = "";
      if (uniqueStores.length === 1) {
        branchSummary = uniqueStores[0];
      } else if (uniqueStores.length > 1) {
        branchSummary = "Nhiều cửa hàng";
      } else if (lr.branch) {
        branchSummary = lr.branch;
      } else {
        branchSummary = "N/A";
      }

      const affectedShiftsCount = lr.affectedShifts !== undefined && lr.affectedShifts > 0 ? lr.affectedShifts : finalShiftList.length;
      const totalShiftMins = lr.affectedShiftMinutes && lr.affectedShiftMinutes > 0
        ? lr.affectedShiftMinutes
        : finalShiftList.reduce((acc, s) => acc + (s.scheduledDurationMinutes || (s.hours || 8) * 60), 0);

      const reqDays = lr.requestedLeaveDays !== undefined && lr.requestedLeaveDays > 0
        ? lr.requestedLeaveDays
        : (totalShiftMins > 0 ? calculateLeaveDaysFromMinutes(totalShiftMins, leavePolicy).finalDays : 0);

      const officialDebitedDays = lr.officialDebitedDays !== undefined
        ? lr.officialDebitedDays
        : (lr.status === "APPROVED" ? reqDays : 0);

      const resDays = lr.reservedDays !== undefined ? lr.reservedDays : (lr.status === "PENDING" ? reqDays : 0);

      return {
        id: lr.id,
        type: "leave",
        title: typeLabel,
        date:
          (lr.fromDate instanceof Date ? format(lr.fromDate, "dd/MM/yyyy", { locale: vi }) : "Invalid Date") +
          (lr.fromDate instanceof Date && lr.toDate instanceof Date && lr.fromDate.getTime() !== lr.toDate.getTime()
            ? ` - ${format(lr.toDate, "dd/MM/yyyy", { locale: vi })}`
            : ""),
        status: mappedStatus,
        statusLabel: statusLabel,
        icon,
        color,
        detail: {
          reason: lr.reason,
          submittedAt: lr.submittedAt instanceof Date ? format(lr.submittedAt, "HH:mm, dd/MM/yyyy", { locale: vi }) : "N/A",
          branch: branchSummary,
          affectedShifts: affectedShiftsCount,
          affectedShiftMinutes: totalShiftMins,
          requestedLeaveDays: reqDays,
          officialDebitedDays: officialDebitedDays,
          reservedDays: resDays,
          affectedShiftList: finalShiftList,
          managerNote: lr.managerNote || lr.rejectionReason,
          systemReason: lr.systemReason,
          attachment: lr.attachment,
          rawType: lr.type,
          rawStatus: lr.status,
          requestMode: lr.requestMode,
          sourceTicketId: lr.sourceTicketId,
          sourceType: lr.sourceType,
        },
        originalRequest: lr,
      };
    }),
    ...(attendanceTickets || []).map((att) => {
      let mappedStatus = "pending-manager";
      let color = "text-amber-500";
      let statusLabel = "Chờ xử lý";

      if (att.status === "PENDING") {
        mappedStatus = "pending-manager";
        color = "text-amber-500";
        statusLabel = "Chờ xử lý";
      } else if (att.status === "APPROVED") {
        if (att.outcomeType === "ANNUAL_LEAVE") {
          mappedStatus = "approved-annual";
          color = "text-emerald-600";
          statusLabel = "Đã duyệt · Nghỉ phép năm";
        } else if (att.outcomeType === "UNPAID_ABSENCE") {
          mappedStatus = "approved-unpaid";
          color = "text-sky-600";
          statusLabel = "Đã duyệt · Nghỉ không lương";
        } else {
          mappedStatus = "approved";
          color = "text-green-600";
          statusLabel = "Đã duyệt";
        }
      } else if (att.status === "REJECTED") {
        mappedStatus = "rejected-manager";
        color = "text-red-600";
        statusLabel = "Đã từ chối";
      } else if (att.status === "AUTO_REJECTED") {
        mappedStatus = "auto-rejected";
        color = "text-purple-600";
        statusLabel = "Tự động từ chối";
      } else if (att.status === "CANCELLED") {
        mappedStatus = "cancelled";
        color = "text-gray-500";
        statusLabel = "Đã hủy";
      }

      const typeTitles: Record<string, string> = {
        missing_both: "Giải trình vắng mặt (Missing Both)",
        forgot_in: "Bổ sung Check-in",
        forgot_out: "Bổ sung Check-out",
        device_error: "Báo lỗi thiết bị chấm công",
      };

      return {
        id: att.id,
        type: "attendance_ticket",
        title: typeTitles[att.type] || "Bổ sung công",
        date: formatDateDDMMYYYY(att.date),
        status: mappedStatus,
        statusLabel: statusLabel,
        icon: Clock,
        color,
        detail: {
          reason: att.reason,
          submittedAt: att.submittedAt instanceof Date ? format(att.submittedAt, "HH:mm, dd/MM/yyyy", { locale: vi }) : "N/A",
          useAnnualLeaveIntent: att.useAnnualLeaveIntent,
          relatedShift: att.relatedShift,
          actualTime: att.actualTime,
          rawStatus: att.status,
          outcomeType: att.outcomeType,
          systemReason: att.systemReason,
          managerNote: att.managerNote,
          branch: att.relatedShift?.storeName || user?.department || "HMK Nguyễn Trãi",
        },
        originalTicket: att,
      };
    }),
  ].sort((a, b) => {
    if (a.type === "leave" && b.type === "leave" && a.originalRequest?.submittedAt instanceof Date && b.originalRequest?.submittedAt instanceof Date) {
      return b.originalRequest.submittedAt.getTime() - a.originalRequest.submittedAt.getTime();
    }
    return 0;
  });

  const renderStatus = (status: string, statusLabel?: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm">
            {statusLabel || "Đã duyệt"}
          </span>
        );
      case "approved-annual":
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm">
            {statusLabel || "Đã duyệt · Nghỉ phép năm"}
          </span>
        );
      case "approved-unpaid":
        return (
          <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm">
            {statusLabel || "Đã duyệt · Nghỉ không lương"}
          </span>
        );
      case "rejected":
      case "rejected-peer":
      case "rejected-manager":
        return (
          <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm">
            {statusLabel || "Đã từ chối"}
          </span>
        );
      case "auto-rejected":
        return (
          <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm">
            {statusLabel || "Tự động từ chối"}
          </span>
        );
      case "cancelled":
        return (
          <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm">
            {statusLabel || "Đã hủy"}
          </span>
        );
      case "pending-peer":
        return (
          <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm">
            Chờ xác nhận
          </span>
        );
      case "pending-manager":
        return (
          <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm">
            {statusLabel || "Chờ duyệt"}
          </span>
        );
      case "action-needed":
        return (
          <span className="bg-red-600 text-white border border-red-700 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm shadow-red-200">
            Cần xử lý
          </span>
        );
      case "locked":
        return (
          <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm">
            {statusLabel || "Kỳ công đã khóa"}
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm">
            {statusLabel || "Chờ xử lý"}
          </span>
        );
    }
  };

  const actionableMissingBothTickets = (attendanceTickets || [])
    .filter((att) => att.type === "missing_both")
    .map((att) => {
      let mappedStatus = "action-needed";
      let statusLabel = "Cần xử lý";
      if (att.isPeriodLocked) {
        mappedStatus = "locked";
        statusLabel = "Kỳ công đã khóa";
      } else if (att.resolutionPath === "BACKDATED_LEAVE") {
        mappedStatus = "pending-manager";
        statusLabel = "Chờ duyệt nghỉ phép";
      } else if (att.resolutionPath === "ATTENDANCE_CORRECTION") {
        mappedStatus = "pending-manager";
        statusLabel = "Chờ duyệt bổ sung công";
      }

      return {
        id: att.id,
        type: "missing_both",
        title: "Thiếu dữ liệu chấm công (Missing Both)",
        date: formatDateDDMMYYYY(att.date),
        status: mappedStatus,
        statusLabel: statusLabel,
        icon: AlertTriangle,
        color: "text-red-600",
        isActionable: !att.isPeriodLocked && !att.resolutionPath,
        resolutionPath: att.resolutionPath,
        linkedLeaveRequestId: att.linkedLeaveRequestId,
        isPeriodLocked: att.isPeriodLocked,
        ticket: att,
        detail: {
          peer: "Hệ thống tự động ghi nhận",
          msg: "Hệ thống không ghi nhận dữ liệu Check-in và Check-out cho ca làm việc này.",
          relatedShift: att.relatedShift,
          hours: att.relatedShift?.hours || 7,
          minutes: (att.relatedShift?.hours || 7) * 60,
          reason: att.reason,
        },
      };
    });

  const currentList = activeTab === "sent" 
    ? combinedSentRequests 
    : [
        ...actionableMissingBothTickets,
        ...receivedRevs.filter((r) => r.type !== "missing_both"),
      ];

  const [filterType, setFilterType] = useState<string>("all");
  const filteredList = currentList.filter((req) => {
    if (filterType === "all") return true;
    if (filterType === "leave") return req.type === "leave";
    if (filterType === "swap") return req.type === "swap";
    if (filterType === "missing_both") return req.type === "missing_both";
    if (filterType === "forgot_in") return req.type === "forgot_in";
    if (filterType === "forgot_out") return req.type === "forgot_out";
    if (filterType === "attendance") return req.type === "attendance_ticket" || req.type === "missing_both" || req.type === "forgot_in" || req.type === "forgot_out";
    return req.type === filterType;
  });

  return (
    <div className="flex flex-col h-full bg-background relative pb-20">
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
      <div className="bg-white px-4 py-3 sticky top-0 z-30 flex flex-col gap-3 pb-3 border-b border-gray-100">
        <div className="flex justify-between items-center pt-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Yêu cầu
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab("received");
              setFilterType("all");
            }}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 border",
              activeTab === "received"
                ? "bg-primary/10 text-primary border-primary"
                : "bg-transparent text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-400",
            )}
          >
            <Inbox
              className={cn(
                "w-4 h-4",
                activeTab === "received" ? "text-primary" : "text-gray-400",
              )}
            />{" "}
            Xử lý
            {receivedRevs.some((r) => r.isActionable) && (
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("sent");
              setFilterType("all");
            }}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 border",
              activeTab === "sent"
                ? "bg-primary/10 text-primary border-primary"
                : "bg-transparent text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-400",
            )}
          >
            <Send
              className={cn(
                "w-4 h-4",
                activeTab === "sent" ? "text-primary" : "text-gray-400",
              )}
            />{" "}
            Đã gửi
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setFilterType("all")}
            className={cn(
              "px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg border transition-all whitespace-nowrap",
              filterType === "all"
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
            )}
          >
            Tất cả
          </button>
          {activeTab === "received" && (
            <>
              <button
                onClick={() => setFilterType("forgot_in")}
                className={cn(
                  "px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg border transition-all whitespace-nowrap",
                  filterType === "forgot_in"
                    ? "bg-red-50 text-red-600 border-red-200"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
                )}
              >
                Thiếu Check-in
              </button>
              <button
                onClick={() => setFilterType("forgot_out")}
                className={cn(
                  "px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg border transition-all whitespace-nowrap",
                  filterType === "forgot_out"
                    ? "bg-red-50 text-red-600 border-red-200"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
                )}
              >
                Thiếu Check-out
              </button>
            </>
          )}
          <button
            onClick={() => setFilterType("swap")}
            className={cn(
              "px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg border transition-all whitespace-nowrap",
              filterType === "swap"
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
            )}
          >
            Đổi ca
          </button>
          <button
            onClick={() => setFilterType("leave")}
            className={cn(
              "px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg border transition-all whitespace-nowrap",
              filterType === "leave"
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
            )}
          >
            Nghỉ phép
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {/* MOB-01: Thẻ Số dư phép năm (Leave Balance Card) */}
        <div className="bg-gradient-to-br from-[#416C87] to-[#558BAD] text-white rounded-2xl p-4 shadow-sm relative overflow-hidden border border-[#558BAD]/30 mb-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-1.5 text-white/80 text-xs font-semibold uppercase tracking-wider">
                <Umbrella className="w-4 h-4 text-white" />
                <span>Số dư phép năm</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  {leaveBalance.available}
                </span>
                <span className="text-xs font-medium text-white/80">ngày khả dụng</span>
              </div>
            </div>
            <button
              onClick={() => setShowLedgerModal(true)}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-xs font-bold rounded-lg border border-white/30 transition-all flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span>Lịch sử phép</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-xs">
            <div className="bg-black/15 rounded-xl p-2.5 backdrop-blur-xs">
              <span className="text-white/70 block text-[10px] font-medium uppercase tracking-wider">Số dư quỹ phép</span>
              <span className="text-sm font-bold text-white">{leaveBalance.currentBalance} ngày</span>
            </div>
            <div className="bg-black/15 rounded-xl p-2.5 backdrop-blur-xs">
              <span className="text-amber-200 block text-[10px] font-medium uppercase tracking-wider">Đang giữ chỗ</span>
              <span className="text-sm font-bold text-amber-300">{leaveBalance.reserved} ngày</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${filterType}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 mt-2">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-300 mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-gray-900 font-bold text-base mb-1">
                  Tuế Nguyệt Tĩnh Hảo!
                </h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Không có yêu cầu nào cần bạn xử lý lúc này.
                  <br /> Hãy tận hưởng sự bình yên nhé.
                </p>
              </div>
            ) : (
              filteredList.map((req) => (
                  <div
                  key={req.id}
                  onClick={() => (req.type === "leave" || req.type === "attendance_ticket") && setSelectedLeave(req)}
                  className={cn(
                    "bg-white border-2 rounded-2xl p-4 shadow-sm transition-all relative overflow-hidden",
                    (req.type === "leave" || req.type === "attendance_ticket") ? "cursor-pointer active:scale-[0.98] hover:border-gray-300" : "",
                    req.type === "forgot_in" || req.type === "forgot_out"
                      ? "border-red-100 bg-red-50/10"
                      : req.type === "swap"
                        ? "border-blue-100"
                        : "border-gray-100",
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 border shadow-sm rounded-full flex items-center justify-center shrink-0",
                          req.type === "forgot_in" || req.type === "forgot_out" || req.type === "missing_both"
                            ? "bg-red-50 border-red-200 text-red-600"
                            : "bg-gray-50 border-gray-200 text-gray-600",
                        )}
                      >
                        <req.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm mb-0.5 tracking-tight flex items-center gap-2">
                          {req.title}
                          {req.type === "swap" && (
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          )}
                          {(req.type === "forgot_in" ||
                            req.type === "forgot_out" ||
                            req.type === "missing_both") && (
                            <span className="w-1.5 h-1.5 animate-pulse bg-red-500 rounded-full"></span>
                          )}
                        </h3>
                        <p className="text-[11px] text-gray-500 font-medium">
                          {req.type === "swap" ? (
                            <>
                              {req.detail?.peer && (
                                <span className="text-gray-400 mr-1">
                                  TỪ: {req.detail.peer} •
                                </span>
                              )}
                              <span>{req.date}</span>
                            </>
                          ) : (
                            <>
                              <span>{req.date}</span>
                              {req.id && (
                                <>
                                  <span className="mx-1 text-gray-400">•</span>
                                  <span>Mã ticket: <span className="font-semibold text-gray-700">{req.id}</span></span>
                                </>
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    {renderStatus(req.status, req.statusLabel)}
                  </div>

                  {(req.type === "forgot_in" || req.type === "forgot_out") &&
                    req.detail && (
                      <div className="bg-white border-2 border-red-50 rounded-xl p-3 mb-3 text-sm space-y-3">
                        <p className="text-xs text-red-900 font-medium leading-relaxed bg-red-50/60 p-2.5 rounded-lg border border-red-100">
                          {req.detail.msg}
                        </p>
                        <button
                          onClick={() =>
                            navigate(`/attendance?scenario=${req.type}`)
                          }
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs tracking-wider transition-all shadow-sm active:scale-[0.98] w-full flex items-center justify-center gap-1.5"
                        >
                          <span>Bổ sung dữ liệu</span>
                        </button>
                      </div>
                    )}

                  {req.type === "missing_both" && (
                    <div className="bg-white border-2 border-red-50 rounded-xl p-3 mb-3 space-y-3">
                      <p className="text-xs text-red-900 font-medium leading-relaxed bg-red-50/60 p-2.5 rounded-lg border border-red-100">
                        {req.detail.msg || "Hệ thống không ghi nhận dữ liệu Check-in và Check-out cho ca làm việc này."}
                      </p>

                      {req.detail?.relatedShift && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>{req.detail.relatedShift.shiftName} ({req.detail.relatedShift.timeStr})</span>
                            <span className="text-slate-700 bg-white px-2 py-0.5 rounded text-[11px] border border-slate-200 font-semibold">
                              {req.detail.hours} giờ ({req.detail.minutes} phút)
                            </span>
                          </div>
                          <p className="text-slate-600 font-medium text-[11px]">
                            🏬 {req.detail.relatedShift.storeName}
                          </p>
                        </div>
                      )}

                      {/* Condition 1: Period Locked */}
                      {req.isPeriodLocked && (
                        <div className="space-y-2">
                          <div className="p-2.5 bg-red-100/90 border border-red-300 rounded-lg text-xs font-bold text-red-900 flex items-center gap-2">
                            <span>⚠️</span> Kỳ công đã khóa. Không thể xử lý yêu cầu này.
                          </div>
                          <div className="grid grid-cols-2 gap-2 opacity-50 cursor-not-allowed">
                            <button disabled className="py-2.5 bg-gray-100 border border-gray-200 text-gray-400 font-bold rounded-lg text-xs cursor-not-allowed">
                              Bổ sung dữ liệu
                            </button>
                            <button disabled className="py-2.5 bg-gray-100 border border-gray-200 text-gray-400 font-bold rounded-lg text-xs cursor-not-allowed">
                              Tạo nghỉ phép
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Condition 2: Routed to Backdated Leave */}
                      {!req.isPeriodLocked && req.resolutionPath === "BACKDATED_LEAVE" && (
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-900 flex items-center gap-1">
                                <span className="text-primary font-bold">✓</span> Đã tạo yêu cầu nghỉ đột xuất
                              </p>
                              <p className="text-slate-600 text-[11px]">
                                Đang chờ Quản lý xử lý. Không tạo giữ chỗ quỹ phép.
                              </p>
                            </div>
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded font-bold text-[10px]">
                              Chờ duyệt
                            </span>
                          </div>
                          {req.linkedLeaveRequestId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const matchedReq = combinedSentRequests.find(r => r.id === req.linkedLeaveRequestId);
                                if (matchedReq) {
                                  setSelectedLeave(matchedReq);
                                } else {
                                  setToast({ message: `Mã đơn nghỉ đột xuất: ${req.linkedLeaveRequestId}`, type: "info" });
                                }
                              }}
                              className="w-full py-2 bg-primary hover:bg-primary/90 active:scale-[0.98] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
                            >
                              <span>Xem yêu cầu</span> <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Condition 3: Routed to Attendance Correction */}
                      {!req.isPeriodLocked && req.resolutionPath === "ATTENDANCE_CORRECTION" && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-emerald-950 flex items-center gap-1">
                                <span>✓</span> Đã gửi bổ sung dữ liệu chấm công
                              </p>
                              <p className="text-emerald-800 text-[11px]">
                                Đang chờ Quản lý duyệt chấm công.
                              </p>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded font-bold text-[10px]">
                              Chờ duyệt công
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLeave({
                                id: req.id,
                                type: "attendance_ticket",
                                title: "Bổ sung dữ liệu chấm công",
                                date: req.date,
                                status: "pending-manager",
                                statusLabel: "Chờ duyệt",
                                detail: {
                                  reason: req.ticket?.reason || req.detail?.reason || "Bổ sung giờ vào ra thực tế",
                                  submittedAt: req.ticket?.submittedAt instanceof Date ? format(req.ticket.submittedAt, "HH:mm, dd/MM/yyyy", { locale: vi }) : "N/A",
                                  branch: req.detail?.relatedShift?.storeName || "HMK Nguyễn Trãi",
                                  actualTime: req.ticket?.actualTime || "08:00 - 15:00",
                                  relatedShift: req.detail?.relatedShift,
                                  useAnnualLeaveIntent: false,
                                  rawStatus: "PENDING",
                                }
                              });
                            }}
                            className="w-full py-2 bg-primary hover:bg-primary/90 active:scale-[0.98] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>Xem chi tiết bổ sung công</span> <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Condition 4: No path chosen yet (Both actions active and mutually exclusive) */}
                      {!req.isPeriodLocked && !req.resolutionPath && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCorrectionTicket(req.ticket);
                              setCorrectionInTime("08:00");
                              setCorrectionOutTime("15:00");
                              setCorrectionReason(req.ticket?.reason || "");
                              setShowAttendanceCorrectionModal(true);
                            }}
                            className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                          >
                            <span>Bổ sung dữ liệu</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setBackdatedTicket(req.ticket);
                              setBackdatedLeaveType(user?.annualLeaveEligible ? "ANNUAL_LEAVE" : null);
                              setBackdatedReason("");
                              setShowBackdatedLeaveModal(true);
                            }}
                            className="py-2.5 px-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg text-xs shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                          >
                            <span>Tạo nghỉ phép</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {req.type === "swap" && req.detail && (
                    <div className="bg-gray-50/50 border-2 border-gray-100 rounded-xl p-4 mb-3 text-sm">
                      {req.detail.msg && (
                        <p className="text-xs text-gray-600 italic mb-4 font-medium">
                          "{req.detail.msg}"
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                        <div className="bg-white p-3 rounded-xl border-2 border-gray-100">
                          <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                            {activeTab === "received"
                              ? "Bạn lấy ca:"
                              : "Bạn bỏ ca:"}
                          </span>
                          <span className="font-bold text-gray-900 tracking-tight">
                            {req.detail.giveShift}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border-2 border-gray-100">
                          <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                            {activeTab === "received"
                              ? "Bạn nhường ca:"
                              : "Bồi hoàn ca:"}
                          </span>
                          <span className="font-bold text-gray-900 tracking-tight">
                            {req.detail.takeShift}
                          </span>
                        </div>
                      </div>

                      {req.detail.rejectReason && (
                        <div className="pt-3 border-t-2 border-red-100 text-xs text-red-600 font-bold flex gap-2 items-start bg-red-50 p-3 rounded-xl mt-3">
                          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">
                            {req.detail.rejectReason}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hành động (Chỉ cho tab received và đang pending) */}
                  {activeTab === "received" &&
                    req.isActionable &&
                    req.type === "swap" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(req.id, "reject")}
                          className="flex-[1] py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center justify-center transition-all"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" /> Từ chối
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "accept")}
                          className="flex-[2] py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm text-xs flex items-center justify-center transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Đồng ý đổi
                        </button>
                      </div>
                    )}

                  {/* Hành động Hủy request (Chỉ cho tab sent) */}
                  {activeTab === "sent" && req.status === "pending-peer" && (
                    <button
                      onClick={() =>
                        setSentRevs((prev) =>
                          prev.filter((r) => r.id !== req.id),
                        )
                      }
                      className="w-full mt-2 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl text-xs transition-colors hover:bg-red-100 border border-red-100"
                    >
                      Thu hồi yêu cầu
                    </button>
                  )}
                </div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CREATE REQUEST STICKY BUTTON */}
      {activeTab === "sent" && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-40 px-6 flex justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="pointer-events-auto px-6 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center text-white active:scale-95 transition-all hover:bg-primary/90 shadow-primary/20 gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-bold text-sm">Tạo yêu cầu</span>
          </button>
        </div>
      )}

      {/* CREATE REQUEST BOTTOM SHEET */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 1 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-md rounded-t-2xl max-h-[95vh] flex flex-col shadow-[0_-8px_30px_rgb(0,0,0,0.12)] relative"
            >
              {/* Drag Handle */}
              <div className="w-full flex justify-center pt-3 pb-2 absolute top-0 left-0 z-20">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-8 pb-4 bg-white sticky top-0 z-10 shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Tạo Yêu cầu
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Chọn loại yêu cầu và điền thông tin
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto no-scrollbar pb-32">
                {/* Type Selector Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-1">
                  {[
                    { id: "leave", label: "Nghỉ phép" },
                    { id: "ot", label: "Làm thêm" },
                    { id: "attendance", label: "Bổ sung công" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setReqType(t.id as any)}
                      className={cn(
                        "px-4 py-2 text-xs font-bold rounded-full transition-all border shrink-0 whitespace-nowrap",
                        reqType === t.id
                          ? "bg-primary/10 text-primary border-primary"
                          : "bg-transparent text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-400",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-6">
                  {/* --- XIN NGHỈ (LEAVE) --- */}
                  {reqType === "leave" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-5"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide">
                            Loại phép
                          </label>
                        </div>
                        <select 
                          value={leaveType}
                          onChange={(e) => setLeaveType(e.target.value as LeaveRequestType)}
                          className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-4 text-sm font-bold focus:outline-none focus:border-primary text-gray-900 transition-all appearance-none">
                          <option value="ANNUAL_LEAVE" disabled={!user?.annualLeaveEligible}>
                            Phép năm {!user?.annualLeaveEligible ? "(Chưa đủ điều kiện)" : `— Khả dụng ${leaveBalance.available} ngày`}
                          </option>
                          <option value="UNPAID_LEAVE">Nghỉ không lương</option>
                        </select>
                        {!user?.annualLeaveEligible && (
                          <p className="text-xs text-amber-700 font-medium mt-2 flex items-center gap-1.5 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                            <span>⚠️</span> Bạn chưa thuộc đối tượng được hưởng phép năm.
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                            Từ ngày
                          </label>
                          <div className="relative">
                            <div className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-4 text-sm font-bold text-gray-900 flex items-center justify-between">
                              <span>{fromDate ? formatDateDDMMYYYY(fromDate) : "dd/mm/yyyy"}</span>
                              <Clock className="w-4 h-4 text-gray-400" />
                            </div>
                            <input
                              type="date"
                              value={fromDate}
                              onChange={(e) => setFromDate(e.target.value)}
                              required
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                            Đến ngày
                          </label>
                          <div className="relative">
                            <div className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-4 text-sm font-bold text-gray-900 flex items-center justify-between">
                              <span>{toDate ? formatDateDDMMYYYY(toDate) : "dd/mm/yyyy"}</span>
                              <Clock className="w-4 h-4 text-gray-400" />
                            </div>
                            <input
                              type="date"
                              value={toDate}
                              onChange={(e) => setToDate(e.target.value)}
                              required
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Inline error for past date */}
                      {fromDate && isPastDateSelected && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                          <p className="leading-relaxed">
                            Không thể tạo đơn nghỉ phép cho ngày đã qua. Nếu cần giải trình vắng mặt, vui lòng sử dụng Bổ sung công.
                          </p>
                        </div>
                      )}

                      {/* Inline warning for zero affected shifts */}
                      {fromDate && toDate && !isInvalidDateRange && !isPastDateSelected && isZeroShiftSelected && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-900 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                          <p className="leading-relaxed">
                            Không có ca làm việc được xếp trong khoảng thời gian đã chọn. Bạn không cần tạo yêu cầu nghỉ phép cho khoảng thời gian này.
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                          Lý do
                        </label>
                        <textarea
                          rows={3}
                          value={leaveReason}
                          onChange={(e) => setLeaveReason(e.target.value)}
                          required
                          placeholder="Mô tả tóm tắt lý do xin nghỉ..."
                          className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-4 text-sm font-medium focus:outline-none focus:border-primary resize-none transition-all placeholder:text-gray-400"
                        ></textarea>
                      </div>

                      {/* --- PREVIEW SECTION FOR ANNUAL LEAVE --- */}
                      {fromDate && toDate && !isInvalidDateRange && !isPastDateSelected && !isZeroShiftSelected && leaveType === "ANNUAL_LEAVE" && (
                        <div className="space-y-4 pt-2">
                          {/* 1. Quy đổi phép */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                              <span>📊</span> Quy đổi phép
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                                <span className="text-[10px] text-gray-500 font-medium block">Tổng phút ca bị ảnh hưởng</span>
                                <span className="font-bold text-gray-900 text-sm">{totalMinutes} phút ({totalMinutes / 60} giờ)</span>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                                <span className="text-[10px] text-gray-500 font-medium block">Số phút chuẩn / ngày phép</span>
                                <span className="font-bold text-gray-900 text-sm">{leavePolicy.standardLeaveDayMinutes} phút</span>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                                <span className="text-[10px] text-gray-500 font-medium block">Block phép tối thiểu</span>
                                <span className="font-bold text-gray-900 text-sm">{leavePolicy.minimumLeaveBlockDays} ngày</span>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                                <span className="text-[10px] text-gray-500 font-medium block">Số phép dự kiến sử dụng</span>
                                <span className="font-bold text-primary text-sm">{calculatedLeaveDays} ngày</span>
                              </div>
                            </div>
                          </div>

                          {/* 2. Quỹ phép của bạn */}
                          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 space-y-2">
                            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                              <span>💳</span> Quỹ phép của bạn
                            </h4>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between text-gray-700">
                                <span>Số dư quỹ phép:</span>
                                <span className="font-bold">{leaveBalance.currentBalance} ngày</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>Phép đang giữ chỗ bởi yêu cầu khác:</span>
                                <span className="font-semibold text-amber-700">{leaveBalance.reserved} ngày</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>Khả dụng hiện tại:</span>
                                <span className="font-semibold text-blue-800">{leaveBalance.available} ngày</span>
                              </div>
                              <div className="flex justify-between text-gray-700 border-t border-blue-200 pt-1.5 font-bold">
                                <span>Dự kiến giữ chỗ cho yêu cầu này:</span>
                                <span className="text-amber-800">{calculatedLeaveDays} ngày</span>
                              </div>
                              <div className={cn("flex justify-between text-sm pt-1 border-t border-blue-200 font-bold", isInsufficientBalance ? "text-red-600" : "text-green-700")}>
                                <span>Còn khả dụng sau khi gửi:</span>
                                <span>{availableAfterSubmit} ngày</span>
                              </div>
                            </div>
                          </div>

                          {/* 3. Cảnh báo thiếu số dư */}
                          {isInsufficientBalance && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                              <span>⚠️</span>
                              <p>Số dư phép khả dụng không đủ cho yêu cầu này.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* --- PREVIEW SECTION FOR UNPAID LEAVE --- */}
                      {fromDate && toDate && !isInvalidDateRange && !isPastDateSelected && !isZeroShiftSelected && leaveType === "UNPAID_LEAVE" && (
                        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-xs font-medium text-sky-900 flex items-center gap-2">
                          <span className="text-base">ℹ️</span>
                          <p>Nghỉ không lương không sử dụng quỹ phép năm.</p>
                        </div>
                      )}

                      {/* Affected Scheduled Shifts & Days Without Shift Scan */}
                      {fromDate && toDate && !isInvalidDateRange && !isPastDateSelected && (
                        <div className="space-y-3 pt-2">
                          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide">
                            Lịch ca ảnh hưởng
                          </label>
                          <div className="space-y-2">
                            {(() => {
                              const start = new Date(fromDate);
                              start.setHours(0, 0, 0, 0);
                              const end = new Date(toDate);
                              end.setHours(0, 0, 0, 0);

                              const daysList: { date: Date; shifts: typeof availableShifts }[] = [];
                              const curr = new Date(start);

                              while (curr <= end) {
                                const d = new Date(curr);
                                const shiftsOnDay = availableShifts.filter((s) => {
                                  const sDate = new Date(s.date);
                                  sDate.setHours(0, 0, 0, 0);
                                  const isValidScheduledState = s.status === "approved" || s.status === "assigned";
                                  return isValidScheduledState && sDate.getTime() === d.getTime();
                                });
                                daysList.push({ date: d, shifts: shiftsOnDay });
                                curr.setDate(curr.getDate() + 1);
                              }

                              if (daysList.length === 0) return null;

                              return daysList.map((item, idx) => {
                                const dateStr = format(item.date, "dd/MM/yyyy", { locale: vi });
                                if (item.shifts.length === 0) {
                                  return (
                                    <div
                                      key={idx}
                                      className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex justify-between items-center text-xs text-gray-500"
                                    >
                                      <span className="font-bold text-gray-700">{dateStr}</span>
                                      <span className="bg-gray-200/70 text-gray-600 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                                        Không có ca làm việc — Không tính phép
                                      </span>
                                    </div>
                                  );
                                }

                                return item.shifts.map((s) => (
                                  <div
                                    key={s.id}
                                    className="bg-amber-50/40 border-2 border-amber-200 rounded-xl p-3.5 flex justify-between items-center text-sm"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                                          {dateStr}
                                        </span>
                                        <p className="font-bold text-gray-900">{s.shiftName}</p>
                                      </div>
                                      <p className="text-xs text-gray-600 font-medium">
                                        ⏰ {s.timeStr} • 🏬 {s.storeName} • ⏱️ {s.hours} giờ
                                      </p>
                                    </div>
                                    <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">
                                      Có ca xếp
                                    </span>
                                  </div>
                                ));
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* --- LÀM THÊM GIỜ (OT) --- */}
                  {reqType === "ot" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-5"
                    >
                      <div>
                        <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                          Ngày làm thêm
                        </label>
                        <input
                          type="date"
                          className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-4 text-sm font-bold focus:outline-none focus:border-black transition-all text-gray-900"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                            Từ giờ
                          </label>
                          <input
                            type="time"
                            className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-4 text-sm font-bold focus:outline-none focus:border-black transition-all text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                            Đến giờ
                          </label>
                          <input
                            type="time"
                            className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-4 text-sm font-bold focus:outline-none focus:border-black transition-all text-gray-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                          Lý do
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Ca tối đông khách, Quản lý yêu cầu ở lại hỗ trợ..."
                          className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-4 text-sm font-medium focus:outline-none focus:border-black resize-none transition-all placeholder:text-gray-400"
                        ></textarea>
                      </div>
                    </motion.div>
                  )}

                  {/* --- BỔ SUNG CÔNG (ATTENDANCE / MISSING BOTH - MOB-06) --- */}
                  {reqType === "attendance" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-5"
                    >
                      <div className="bg-amber-50 text-amber-900 px-4 py-3 rounded-xl border border-amber-100 flex gap-3 text-sm font-medium">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="leading-relaxed text-xs">
                          Dành cho giải trình vắng mặt không báo trước (Missing Both) hoặc quên chấm công. Yêu cầu sẽ được chuyển tới Quản lý / Web Admin xem xét.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                          Loại yêu cầu
                        </label>
                        <select
                          value={attType}
                          onChange={(e) => setAttType(e.target.value as any)}
                          className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3.5 text-xs font-bold focus:outline-none focus:border-black text-gray-900 transition-all appearance-none"
                        >
                          <option value="missing_both">Vắng mặt cả ngày / Quên check-in & check-out (Missing Both)</option>
                          <option value="forgot_in">Quên Check-in</option>
                          <option value="forgot_out">Quên Check-out</option>
                          <option value="device_error">Lỗi thiết bị chấm công</option>
                        </select>
                      </div>

                      <div className={cn("grid gap-4", attType === "missing_both" ? "grid-cols-1" : "grid-cols-2")}>
                        <div>
                          <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                            Ngày làm / Vắng mặt <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3.5 text-xs font-bold text-gray-900 flex items-center justify-between">
                              <span>{attDate ? formatDateDDMMYYYY(attDate) : "dd/mm/yyyy"}</span>
                              <Clock className="w-4 h-4 text-gray-400" />
                            </div>
                            <input
                              type="date"
                              value={attDate}
                              onChange={(e) => setAttDate(e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                          </div>
                        </div>
                        {attType !== "missing_both" && (
                          <div>
                            <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                              {attType === "forgot_in"
                                ? "Giờ Check-in thực tế"
                                : attType === "forgot_out"
                                ? "Giờ Check-out thực tế"
                                : "Giờ thực tế (nếu có)"}
                            </label>
                            <input
                              type="time"
                              value={attTime}
                              onChange={(e) => setAttTime(e.target.value)}
                              className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3.5 text-xs font-bold focus:outline-none focus:border-black transition-all text-gray-900"
                            />
                          </div>
                        )}
                      </div>

                      {/* RELATED SHIFT DISPLAY */}
                      {attDate && (
                        <div>
                          <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wide">
                            Ca làm việc liên quan
                          </label>
                          {(() => {
                            const targetDate = new Date(attDate);
                            targetDate.setHours(0, 0, 0, 0);
                            const foundShift = availableShifts.find((s) => {
                              const sDate = new Date(s.date);
                              sDate.setHours(0, 0, 0, 0);
                              return sDate.getTime() === targetDate.getTime();
                            });

                            if (foundShift) {
                              return (
                                <div className="bg-indigo-50/70 border-2 border-indigo-200 rounded-xl p-3.5 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-indigo-950 text-xs">{foundShift.shiftName}</span>
                                    <span className="text-[10px] font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded">
                                      {foundShift.hours} giờ
                                    </span>
                                  </div>
                                  <p className="text-xs text-indigo-800 font-medium">
                                    ⏰ {foundShift.timeStr} • 🏬 {foundShift.storeName}
                                  </p>
                                  <p className="text-[10px] text-indigo-600 italic pt-0.5">
                                    ✓ Quản lý sẽ căn cứ ca làm việc này để xử lý giải trình.
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600">
                                <p className="font-medium text-gray-700">Chưa xác định được ca làm việc liên quan. Quản lý sẽ kiểm tra khi xử lý giải trình.</p>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* INTENT SELECTION: ĐỀ NGHỊ DÙNG PHÉP NĂM */}
                      <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <label className={cn(
                              "text-xs font-bold block cursor-pointer",
                              user?.annualLeaveEligible ? "text-gray-900" : "text-gray-400"
                            )}>
                              Đề nghị dùng phép năm
                            </label>
                            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                              Nếu được quản lý chấp thuận, thời gian nghỉ sẽ được quy đổi và trừ từ quỹ phép năm.
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            disabled={!user?.annualLeaveEligible}
                            checked={user?.annualLeaveEligible ? useAnnualLeaveIntent : false}
                            onChange={(e) => setUseAnnualLeaveIntent(e.target.checked)}
                            className="w-5 h-5 rounded text-primary focus:ring-primary border-gray-300 mt-1 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </div>

                        {!user?.annualLeaveEligible && (
                          <p className="text-xs text-amber-800 font-medium bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                            <span>⚠️</span> Bạn chưa thuộc đối tượng được hưởng phép năm.
                          </p>
                        )}

                        {user?.annualLeaveEligible && useAnnualLeaveIntent && (
                          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                            <div className="flex justify-between font-bold">
                              <span>Phép khả dụng hiện tại:</span>
                              <span className="text-blue-900">{leaveBalance.available} ngày</span>
                            </div>
                            <p className="text-[11px] text-blue-700 leading-normal pt-1 border-t border-blue-200">
                              ℹ️ Quỹ phép chỉ được trừ sau khi quản lý duyệt giải trình theo hình thức nghỉ phép năm.
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                          Lý do giải trình <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={attReason}
                          onChange={(e) => setAttReason(e.target.value)}
                          placeholder="VD: Do điện thoại hết pin đột xuất nên không thể điểm danh..."
                          className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3.5 text-xs font-medium focus:outline-none focus:border-black resize-none transition-all placeholder:text-gray-400"
                        ></textarea>
                      </div>
                    </motion.div>
                  )}

                  {/* Absolute positioning for sticky footer effect in bottom sheet */}
                  <div className="absolute bottom-0 left-0 w-full bg-white flex p-4 pb-safe z-20">
                    {(() => {
                      const isLeaveDisabled = reqType === "leave" && (
                        !fromDate ||
                        !toDate ||
                        isPastDateSelected ||
                        isInvalidDateRange ||
                        isZeroShiftSelected ||
                        (leaveType === "ANNUAL_LEAVE" && (!user?.annualLeaveEligible || isInsufficientBalance))
                      );
                      return (
                        <button
                          type="submit"
                          disabled={isLeaveDisabled}
                          className={cn(
                            "w-full py-4 border font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md",
                            isLeaveDisabled
                              ? "bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-primary border-primary hover:bg-primary/90 text-white"
                          )}
                        >
                          <Send className="w-5 h-5" /> GỬI YÊU CẦU
                        </button>
                      );
                    })()}
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEAVE REQUEST DETAIL BOTTOM SHEET */}
      <AnimatePresence>
        {selectedLeave && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end"
            onClick={() => setSelectedLeave(null)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 1 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-md rounded-t-2xl max-h-[90vh] flex flex-col shadow-[0_-8px_30px_rgb(0,0,0,0.12)] relative"
            >
              {/* Drag Handle */}
              <div className="w-full flex justify-center pt-3 pb-2 absolute top-0 left-0 z-20">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="flex justify-between items-start px-5 pt-8 pb-4 bg-white sticky top-0 z-10 shrink-0 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {selectedLeave.type === "attendance_ticket" ? "Chi tiết giải trình điểm danh" : "Chi tiết đơn nghỉ phép"}
                  </h2>
                  <div className="flex items-center gap-2">
                    {renderStatus(selectedLeave.status, selectedLeave.statusLabel)}
                    <span className="text-xs text-gray-500 font-bold uppercase">{selectedLeave.id}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLeave(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto no-scrollbar space-y-5 pb-28">
                
                {/* Summary */}
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3.5 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                        {selectedLeave.type === "attendance_ticket" ? "Loại yêu cầu" : "Loại phép"}
                      </span>
                      <p className="font-bold text-gray-900 text-sm">{selectedLeave.title}</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Thời gian gửi</span>
                      <p className="font-bold text-gray-900 text-sm">{selectedLeave.detail.submittedAt}</p>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Chi nhánh / Cửa hàng</span>
                    <p className="font-medium text-gray-700 text-sm">{selectedLeave.detail.branch}</p>
                  </div>

                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                      {selectedLeave.type === "attendance_ticket" ? "Ngày vắng mặt / làm việc" : "Thời gian nghỉ"}
                    </span>
                    <p className="font-bold text-primary text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" /> {selectedLeave.date}
                    </p>
                  </div>

                  {selectedLeave.type === "attendance_ticket" && (
                    <>
                      <div>
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Giờ thực tế</span>
                        <p className="font-medium text-gray-800 text-sm">{selectedLeave.detail.actualTime || "N/A"}</p>
                      </div>

                      <div>
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Ca làm việc liên quan</span>
                        {selectedLeave.detail.relatedShift ? (
                          <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-2.5 text-xs text-indigo-950 font-medium space-y-0.5">
                            <p className="font-bold">{selectedLeave.detail.relatedShift.shiftName} ({selectedLeave.detail.relatedShift.timeStr})</p>
                            <p className="text-indigo-800">🏬 {selectedLeave.detail.relatedShift.storeName} • ⏱️ {selectedLeave.detail.relatedShift.hours} giờ</p>
                          </div>
                        ) : (
                          <p className="font-medium text-gray-500 text-sm italic">Chưa xác định được ca liên quan</p>
                        )}
                      </div>

                      <div>
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Ý định sử dụng phép năm</span>
                        <p className="font-bold text-sm text-gray-800">
                          {selectedLeave.detail.useAnnualLeaveIntent ? "Có đề nghị dùng phép năm" : "Không đề nghị dùng phép năm"}
                        </p>
                      </div>
                    </>
                  )}

                  {selectedLeave.type !== "attendance_ticket" && (
                    <div>
                      <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Ca bị ảnh hưởng</span>
                      <p className="font-bold text-gray-800 text-xs mb-1.5">
                        {selectedLeave.detail.affectedShifts} ca ({selectedLeave.detail.affectedShiftMinutes || (selectedLeave.detail.affectedShifts * 480)} phút)
                      </p>
                      {selectedLeave.detail.affectedShiftList && selectedLeave.detail.affectedShiftList.length > 0 && (
                        <div className="space-y-2">
                          {selectedLeave.detail.affectedShiftList.map((s: any) => (
                            <div key={s.id || s.shiftId || s.date} className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-2.5 text-xs">
                              <div className="flex items-center justify-between font-bold text-gray-900 mb-0.5">
                                <span>{formatDateDDMMYYYY(s.date)} • {s.shiftName}</span>
                                <span className="text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">{s.hours || (s.scheduledDurationMinutes ? s.scheduledDurationMinutes / 60 : 8)} giờ</span>
                              </div>
                              <p className="text-gray-600 font-medium text-[11px]">
                                ⏰ {s.timeStr} • 🏬 {s.storeName}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                      {selectedLeave.type === "attendance_ticket" ? "Lý do giải trình" : "Lý do"}
                    </span>
                    <p className="font-medium text-gray-700 text-sm leading-relaxed">{selectedLeave.detail.reason}</p>
                  </div>

                  {selectedLeave.detail.attachment && (
                    <div>
                      <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Đính kèm</span>
                      <div className="flex items-center gap-2 text-sm text-blue-600 font-medium bg-blue-50 p-2 rounded-lg border border-blue-100 w-max">
                        <FileText className="w-4 h-4" />
                        {selectedLeave.detail.attachment}
                      </div>
                    </div>
                  )}
                </div>

                {/* --- ATTENDANCE TICKET SPECIFIC STATUS INFO (MOB-06) --- */}
                {selectedLeave.type === "attendance_ticket" && (
                  <div className="space-y-3">
                    {selectedLeave.detail.rawStatus === "PENDING" && (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-900 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <span>⏳</span> Đang chờ xem xét
                        </p>
                        <p className="leading-relaxed text-amber-800">
                          Yêu cầu đang chờ quản lý / Web Admin xử lý. Quỹ phép năm của bạn hiện tại không bị giữ chỗ hay khấu trừ.
                        </p>
                      </div>
                    )}

                    {selectedLeave.detail.rawStatus === "APPROVED" && selectedLeave.detail.outcomeType === "ANNUAL_LEAVE" && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-900 space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                          <span>✓</span> Đã duyệt · Nghỉ phép năm
                        </p>
                        <p className="leading-relaxed text-emerald-800">
                          Giải trình của bạn đã được quản lý chấp thuận và ghi nhận trừ quỹ phép năm cho ngày vắng mặt.
                        </p>
                      </div>
                    )}

                    {selectedLeave.detail.rawStatus === "APPROVED" && selectedLeave.detail.outcomeType === "UNPAID_ABSENCE" && (
                      <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-xs font-medium text-sky-900 space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-sky-900">
                          <span>✓</span> Đã duyệt · Nghỉ không lương
                        </p>
                        <p className="leading-relaxed text-sky-800">
                          Giải trình của bạn đã được chấp thuận ghi nhận nghỉ không lương, không trừ vào quỹ phép năm.
                        </p>
                      </div>
                    )}

                    {selectedLeave.detail.rawStatus === "REJECTED" && (
                      <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-900 space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-red-900">
                          <span>✗</span> Đã từ chối
                        </p>
                        <p className="leading-relaxed text-red-800">
                          {selectedLeave.detail.managerNote || "Quản lý đã từ chối giải trình điểm danh này."}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* --- PENDING ANNUAL LEAVE INFO --- */}
                {(selectedLeave.status === "pending-manager" || selectedLeave.detail.rawStatus === "PENDING") && selectedLeave.detail.rawType === "ANNUAL_LEAVE" && (
                  <div className="space-y-3">
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-2">
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                        <span>💳</span> Quỹ phép liên quan
                      </h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-gray-700">
                          <span>Số phép yêu cầu:</span>
                          <span className="font-bold">{selectedLeave.detail.requestedLeaveDays} ngày</span>
                        </div>
                        {selectedLeave.detail?.requestMode === "BACKDATED_MISSING_BOTH" || selectedLeave.originalRequest?.requestMode === "BACKDATED_MISSING_BOTH" ? (
                          <div className="flex justify-between text-purple-800">
                            <span>Trạng thái giữ chỗ:</span>
                            <span className="font-bold">Không tạo giữ chỗ</span>
                          </div>
                        ) : (
                          <div className="flex justify-between text-amber-800">
                            <span>Phép đang giữ chỗ của yêu cầu này:</span>
                            <span className="font-bold">{selectedLeave.detail.reservedDays || selectedLeave.detail.requestedLeaveDays} ngày</span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-700 border-t border-amber-200 pt-1">
                          <span>Số dư khả dụng hiện tại:</span>
                          <span className="font-bold text-blue-800">{leaveBalance.available} ngày</span>
                        </div>
                      </div>
                    </div>

                    {selectedLeave.detail?.requestMode === "BACKDATED_MISSING_BOTH" || selectedLeave.originalRequest?.requestMode === "BACKDATED_MISSING_BOTH" ? (
                      <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs font-medium text-purple-900 flex items-start gap-2">
                        <span className="text-base shrink-0">ℹ️</span>
                        <p className="leading-relaxed">
                          Yêu cầu nghỉ đột xuất không tạo giữ chỗ phép. Quỹ phép chỉ được trừ nếu Quản lý duyệt theo hình thức Phép năm.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs font-medium text-blue-900 flex items-start gap-2">
                        <span className="text-base shrink-0">ℹ️</span>
                        <p className="leading-relaxed">Yêu cầu đang chờ duyệt. Số phép tương ứng đang được giữ chỗ và chưa bị trừ chính thức.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* --- PENDING UNPAID LEAVE INFO --- */}
                {(selectedLeave.status === "pending-manager" || selectedLeave.detail.rawStatus === "PENDING") && selectedLeave.detail.rawType === "UNPAID_LEAVE" && (
                  <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-xs font-medium text-sky-900 flex items-center gap-2">
                    <span className="text-base shrink-0">ℹ️</span>
                    <p>
                      {selectedLeave.detail?.requestMode === "BACKDATED_MISSING_BOTH" || selectedLeave.originalRequest?.requestMode === "BACKDATED_MISSING_BOTH"
                        ? "Nghỉ không lương không sử dụng quỹ phép năm. Khi được duyệt, số dư phép năm của bạn không thay đổi."
                        : "Nghỉ không lương không sử dụng quỹ phép năm."}
                    </p>
                  </div>
                )}

                {/* --- CANCELLED INFO --- */}
                {(selectedLeave.status === "cancelled" || selectedLeave.detail.rawStatus === "CANCELLED") && (
                  <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 flex items-center gap-2">
                    <span className="text-base">ℹ️</span>
                    <p>
                      {selectedLeave.detail.rawType === "ANNUAL_LEAVE"
                        ? "Phần phép từng giữ chỗ đã được giải phóng."
                        : "Yêu cầu đã được hủy bởi bạn."}
                    </p>
                  </div>
                )}

                {/* --- REJECTED / AUTO_REJECTED REASON --- */}
                {(selectedLeave.status === "rejected-manager" || selectedLeave.status === "auto-rejected" || selectedLeave.detail.rawStatus === "REJECTED" || selectedLeave.detail.rawStatus === "AUTO_REJECTED") && (
                  <div className={cn(
                    "p-4 rounded-xl border space-y-1",
                    selectedLeave.status === "auto-rejected" || selectedLeave.detail.rawStatus === "AUTO_REJECTED" ? "bg-purple-50 border-purple-200 text-purple-900" : "bg-red-50 border-red-200 text-red-900"
                  )}>
                    <span className="block text-[10px] font-bold uppercase tracking-wider">
                      {selectedLeave.status === "auto-rejected" || selectedLeave.detail.rawStatus === "AUTO_REJECTED" ? "Lý do tự động từ chối" : "Lý do từ chối từ quản lý"}
                    </span>
                    <p className="font-medium text-sm leading-relaxed">
                      {selectedLeave.detail.systemReason || selectedLeave.detail.managerNote || (selectedLeave.status === "auto-rejected" ? "Tự động từ chối do kỳ công đã được khóa." : "Quản lý chưa nhập lý do cụ thể.")}
                    </p>
                  </div>
                )}

                {/* --- LINKED LEAVE CANCEL REQUEST DISPLAY (MOB-05) --- */}
                {(() => {
                  const cancelReq = getCancelRequestForLeave(selectedLeave.id);
                  if (!cancelReq) return null;

                  return (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                          <span>🛑</span> Yêu cầu hủy nghỉ phép
                        </h4>
                        <span className={cn(
                          "px-2 py-0.5 text-[10px] font-bold rounded-full",
                          cancelReq.status === "PENDING" ? "bg-amber-200 text-amber-900" :
                          cancelReq.status === "APPROVED" ? "bg-green-100 text-green-800" :
                          cancelReq.status === "AUTO_REJECTED" ? "bg-purple-100 text-purple-800" :
                          "bg-red-100 text-red-800"
                        )}>
                          {cancelReq.status === "PENDING" ? "Chờ quản lý xử lý" :
                           cancelReq.status === "APPROVED" ? "Đã duyệt hủy" :
                           cancelReq.status === "AUTO_REJECTED" ? "Tự động từ chối" : "Đã từ chối"}
                        </span>
                      </div>
                      <div className="text-xs space-y-1 text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Mã yêu cầu hủy:</span>
                          <span className="font-semibold">{cancelReq.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Thời gian gửi:</span>
                          <span>{cancelReq.submittedAt ? format(new Date(cancelReq.submittedAt), "HH:mm, dd/MM/yyyy", { locale: vi }) : "Vừa xong"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-0.5">Lý do hủy:</span>
                          <p className="font-medium bg-white p-2 rounded-lg border border-slate-200">{cancelReq.reason}</p>
                        </div>
                        {cancelReq.status === "APPROVED" && (
                          <div className="text-[11px] text-green-800 font-medium pt-1 space-y-0.5 border-t border-amber-200 mt-2">
                            <p>✓ Yêu cầu hủy đã được duyệt. Quỹ phép đã được hoàn lại.</p>
                            <p className="text-slate-600 font-normal">⚠️ Lịch làm việc trước đó không được tự động khôi phục.</p>
                          </div>
                        )}
                        {cancelReq.status === "REJECTED" && (
                          <p className="text-[11px] text-red-700 font-medium pt-1">
                            Lý do từ chối: {cancelReq.rejectionReason || "Quản lý chưa nhập lý do."}
                          </p>
                        )}
                        {cancelReq.status === "AUTO_REJECTED" && (
                          <p className="text-[11px] text-purple-700 font-medium pt-1">
                            {cancelReq.systemReason || "Tự động từ chối do kỳ công đã được khóa."}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Timeline */}
                <div>
                   <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Tiến trình</h3>
                   <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                      <div className="relative flex items-center justify-between group is-active">
                         <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-primary text-white shadow shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                         </div>
                         <div className="w-[calc(100%-2.5rem)] bg-white p-2.5 rounded-xl border border-slate-200">
                            <div className="text-xs font-bold text-slate-900">Đã gửi đơn</div>
                            <div className="text-[10px] text-slate-500 font-medium">{selectedLeave.detail.submittedAt}</div>
                         </div>
                      </div>

                      <div className="relative flex items-center justify-between group is-active">
                         <div className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full border-2 border-white text-white shadow shrink-0",
                            selectedLeave.status === "pending-manager" || selectedLeave.detail.rawStatus === "PENDING"
                              ? "bg-amber-500"
                              : selectedLeave.status === "approved" || selectedLeave.detail.rawStatus === "APPROVED"
                              ? "bg-green-500"
                              : selectedLeave.status === "cancelled" || selectedLeave.detail.rawStatus === "CANCELLED"
                              ? "bg-gray-500"
                              : selectedLeave.status === "auto-rejected" || selectedLeave.detail.rawStatus === "AUTO_REJECTED"
                              ? "bg-purple-600"
                              : "bg-red-500"
                         )}>
                            {selectedLeave.status === "approved" || selectedLeave.detail.rawStatus === "APPROVED" ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                         </div>
                         <div className="w-[calc(100%-2.5rem)] bg-white p-2.5 rounded-xl border border-slate-200">
                            <div className="text-xs font-bold text-slate-900">
                               {selectedLeave.status === "pending-manager" || selectedLeave.detail.rawStatus === "PENDING"
                                  ? "Chờ duyệt"
                                  : selectedLeave.status === "approved" || selectedLeave.detail.rawStatus === "APPROVED"
                                  ? "Đã duyệt"
                                  : selectedLeave.status === "cancelled" || selectedLeave.detail.rawStatus === "CANCELLED"
                                  ? (selectedLeave.originalRequest?.cancellationSource === "APPROVED_CANCEL_REQUEST" || getCancelRequestForLeave(selectedLeave.id)?.status === "APPROVED"
                                      ? "Yêu cầu hủy đã được duyệt"
                                      : "Đã hủy bởi bạn")
                                  : selectedLeave.status === "auto-rejected" || selectedLeave.detail.rawStatus === "AUTO_REJECTED"
                                  ? "Tự động từ chối"
                                  : "Đã từ chối"}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

              </div>

              {/* Bottom Actions CTA Matrix */}
              {selectedLeave.type === "attendance_ticket" ? (
                (selectedLeave.status === "pending-manager" || selectedLeave.detail?.rawStatus === "PENDING") && (
                  <div className="absolute bottom-0 left-0 w-full bg-white flex p-4 pb-safe z-20 border-t border-gray-100 shadow-lg">
                    <button
                      onClick={() => {
                        setPendingCancelTarget(selectedLeave);
                        setShowPendingCancelModal(true);
                      }}
                      className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-xl transition-all border border-red-200 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Hủy yêu cầu
                    </button>
                  </div>
                )
              ) : (
                (() => {
                  const isBackdated = selectedLeave.detail?.requestMode === "BACKDATED_MISSING_BOTH" || selectedLeave.originalRequest?.requestMode === "BACKDATED_MISSING_BOTH";
                  const isPending = selectedLeave.status === "pending-manager" || selectedLeave.detail?.rawStatus === "PENDING";
                  const isApproved = selectedLeave.status === "approved" || selectedLeave.detail?.rawStatus === "APPROVED";

                  if (isPending && isBackdated) {
                    return null;
                  }

                  if (!isPending && !isApproved) {
                    return null;
                  }

                  return (
                    <div className="absolute bottom-0 left-0 w-full bg-white flex p-4 pb-safe z-20 border-t border-gray-100 shadow-lg">
                      {isPending && !isBackdated && (
                        <button
                          onClick={() => {
                            setPendingCancelTarget(selectedLeave);
                            setShowPendingCancelModal(true);
                          }}
                          className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-xl transition-all border border-red-200 flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Hủy yêu cầu
                        </button>
                      )}
                      {isApproved && (
                        (() => {
                          const cancelReq = getCancelRequestForLeave(selectedLeave.id);
                          if (cancelReq && cancelReq.status === "PENDING") {
                            return (
                              <button
                                disabled
                                className="w-full py-3.5 bg-gray-100 text-gray-500 font-bold text-sm rounded-xl cursor-not-allowed border border-gray-200 flex items-center justify-center gap-2"
                              >
                                <Clock className="w-4 h-4 text-amber-500" /> Yêu cầu hủy đang chờ xử lý
                              </button>
                            );
                          }
                          return (
                            <button
                              onClick={() => {
                                setCancelModalLeave(selectedLeave);
                                setCancelReasonInput("");
                                setShowCancelModal(true);
                              }}
                              className="w-full py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                              Yêu cầu hủy nghỉ phép
                            </button>
                          );
                        })()
                      )}
                    </div>
                  );
                })()
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CANCEL APPROVED LEAVE REQUEST MODAL (MOB-05) */}
      <AnimatePresence>
        {showCancelModal && cancelModalLeave && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Yêu cầu hủy nghỉ phép</h2>
                  <p className="text-xs text-gray-500">Mã đơn gốc: {cancelModalLeave.id}</p>
                </div>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2">
                  <h4 className="font-bold text-amber-900 uppercase tracking-wide">Thông tin đơn nghỉ gốc</h4>
                  <div className="space-y-1 text-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Loại phép:</span>
                      <span className="font-bold">
                        {cancelModalLeave.detail?.rawType === "ANNUAL_LEAVE"
                          ? "Phép năm"
                          : cancelModalLeave.detail?.rawType === "UNPAID_LEAVE"
                          ? "Nghỉ không lương"
                          : "Nghỉ phép"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Thời gian nghỉ:</span>
                      <span className="font-bold">{cancelModalLeave.date}</span>
                    </div>
                    {cancelModalLeave.detail?.rawType === "ANNUAL_LEAVE" && (
                      <div className="flex justify-between text-amber-800">
                        <span>Số phép đã trừ:</span>
                        <span className="font-bold">{cancelModalLeave.detail?.officialDebitedDays || cancelModalLeave.detail?.requestedLeaveDays || 1.0} ngày</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Duplicate protection warning */}
                {(() => {
                  const activePending = getCancelRequestForLeave(cancelModalLeave.id);
                  if (activePending && activePending.status === "PENDING") {
                    return (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>Yêu cầu hủy đang chờ xử lý. Bạn không thể tạo thêm yêu cầu trùng lặp.</span>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div>
                  <label className="block font-bold text-gray-800 mb-1.5">
                    Lý do yêu cầu hủy <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={cancelReasonInput}
                    onChange={(e) => setCancelReasonInput(e.target.value)}
                    placeholder="Nhập lý do bạn muốn yêu cầu hủy đơn nghỉ phép này..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                  ></textarea>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 text-[11px] leading-relaxed">
                  ℹ️ Yêu cầu hủy sẽ được gửi tới Quản lý để duyệt. Sau khi duyệt, số phép năm (nếu có) sẽ được hoàn trả lại. Lịch làm việc trước đó không được tự động khôi phục.
                </div>
              </div>

              {/* Footer Action */}
              <div className="p-4 border-t border-gray-100 bg-white">
                {(() => {
                  const activePending = getCancelRequestForLeave(cancelModalLeave.id);
                  const isPending = activePending && activePending.status === "PENDING";
                  return (
                    <button
                      disabled={isPending || !cancelReasonInput.trim()}
                      onClick={() => {
                        const res = submitLeaveCancelRequest(cancelModalLeave.id, cancelReasonInput);
                        if (res.success) {
                          setShowCancelModal(false);
                          setCancelReasonInput("");
                          setToast({ message: res.message, type: "success" });
                        } else {
                          setToast({ message: res.message, type: "error" });
                        }
                      }}
                      className={cn(
                        "w-full py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md text-sm",
                        isPending || !cancelReasonInput.trim()
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-primary text-white hover:bg-primary/90"
                      )}
                    >
                      <Send className="w-4 h-4" /> Gửi yêu cầu hủy
                    </button>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOB-01: Modal Lịch sử phép năm (Leave Ledger) */}
      <AnimatePresence>
        {showLedgerModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-xl"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-gray-900 text-base">Lịch sử phép năm</h3>
                </div>
                <button
                  onClick={() => setShowLedgerModal(false)}
                  className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {/* Balance Summary in Ledger */}
                <div className="bg-gradient-to-br from-[#416C87] to-[#558BAD] text-white rounded-xl p-3.5 flex justify-between items-center text-xs shadow-sm">
                  <div>
                    <span className="text-white/80 block text-[10px] uppercase font-medium">Số dư quỹ phép</span>
                    <span className="text-base font-bold text-white">{leaveBalance.currentBalance} ngày</span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-200 block text-[10px] uppercase font-medium">Đang giữ chỗ</span>
                    <span className="text-base font-bold text-amber-300">{leaveBalance.reserved} ngày</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-200 block text-[10px] uppercase font-medium">Khả dụng</span>
                    <span className="text-base font-bold text-emerald-300">{leaveBalance.available} ngày</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nhật ký biến động quỹ phép</h4>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-white">
                    <div className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-gray-900">Cấp phép năm đầu kỳ 2026</p>
                        <p className="text-[10px] text-gray-400">01/01/2026 · Hệ thống</p>
                      </div>
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                        +6.0 ngày
                      </span>
                    </div>

                    {leaveRequests.filter(r => r.type === "ANNUAL_LEAVE").map((req) => (
                      <div key={req.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-gray-900">
                            Đơn phép {req.id} ({getLeaveStatusLabel(req.status)})
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {format(new Date(req.submittedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </p>
                        </div>
                        {req.status === "PENDING" && (
                          <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                            Giữ chỗ {req.reservedDays || req.requestedLeaveDays} ngày
                          </span>
                        )}
                        {req.status === "APPROVED" && (
                          <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                            Khấu trừ -{req.officialDebitedDays || req.requestedLeaveDays} ngày
                          </span>
                        )}
                        {req.status === "CANCELLED" && (
                          <span className="font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                            {req.cancellationSource === "APPROVED_CANCEL_REQUEST"
                              ? `Hoàn phép +${req.officialDebitedDays || req.requestedLeaveDays} ngày`
                              : `Giải phóng giữ chỗ ${req.reservedDays || req.requestedLeaveDays} ngày`}
                          </span>
                        )}
                        {(req.status === "REJECTED" || req.status === "AUTO_REJECTED") && (
                          <span className="font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                            Giải phóng giữ chỗ {req.reservedDays || req.requestedLeaveDays} ngày
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                <button
                  onClick={() => setShowLedgerModal(false)}
                  className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PENDING CANCELLATION CONFIRM MODAL */}
      <AnimatePresence>
        {showPendingCancelModal && pendingCancelTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl"
            >
              {pendingCancelTarget.type === "attendance_ticket" || pendingCancelTarget.originalTicket ? (
                <>
                  <div className="flex items-center gap-3 text-red-600">
                    <div className="p-2.5 bg-red-100 rounded-full">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">Hủy yêu cầu giải trình</h3>
                      <p className="text-xs text-gray-500">Yêu cầu đang chờ xử lý</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                    Bạn có chắc muốn hủy yêu cầu giải trình này? Sau khi hủy, yêu cầu sẽ không còn chờ Quản lý/Web Admin xử lý.
                  </p>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setShowPendingCancelModal(false);
                        setPendingCancelTarget(null);
                      }}
                      className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={() => {
                        if (pendingCancelTarget) {
                          const ticketId = pendingCancelTarget.id || pendingCancelTarget.originalTicket?.id;
                          cancelPendingAttendanceTicket(ticketId);
                          setShowPendingCancelModal(false);
                          setPendingCancelTarget(null);
                          setSelectedLeave(null);
                          setToast({
                            message: "Đã hủy yêu cầu giải trình thành công.",
                            type: 'success'
                          });
                        }
                      }}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                    >
                      Xác nhận hủy
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 text-red-600">
                    <div className="p-2.5 bg-red-100 rounded-full">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">Hủy yêu cầu nghỉ phép</h3>
                      <p className="text-xs text-gray-500">Đơn ở trạng thái Chờ duyệt</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {pendingCancelTarget.detail?.rawType === "ANNUAL_LEAVE"
                      ? `Bạn có chắc chắn muốn hủy yêu cầu nghỉ phép này không? Số phép đang giữ chỗ (${pendingCancelTarget.detail?.requestedLeaveDays || 0} ngày) sẽ được giải tỏa và hoàn trả vào số dư khả dụng ngay lập tức.`
                      : "Bạn có chắc chắn muốn hủy yêu cầu nghỉ phép này không?"}
                  </p>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setShowPendingCancelModal(false);
                        setPendingCancelTarget(null);
                      }}
                      className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={() => {
                        if (pendingCancelTarget) {
                          cancelPendingLeaveRequest(pendingCancelTarget.id);
                          setShowPendingCancelModal(false);
                          setPendingCancelTarget(null);
                          setSelectedLeave(null);
                          setToast({
                            message: "Đã hủy yêu cầu nghỉ phép thành công. Số phép giữ chỗ đã được giải phóng.",
                            type: 'success'
                          });
                        }
                      }}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                    >
                      Xác nhận hủy
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: BỔ SUNG DỮ LIỆU CHẤM CÔNG (ATTENDANCE CORRECTION) */}
      <AnimatePresence>
        {showAttendanceCorrectionModal && correctionTicket && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Bổ sung dữ liệu chấm công</h3>
                    <p className="text-[11px] text-gray-500">Mã ticket: {correctionTicket.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAttendanceCorrectionModal(false);
                    setCorrectionTicket(null);
                  }}
                  className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Related Shift Info Banner */}
                {(() => {
                  const shift = correctionTicket.relatedShift || availableShifts.find((s: any) => s.id === correctionTicket.shiftId);
                  const storeName = shift?.storeName || "HMK Nguyễn Trãi";
                  const shiftName = shift?.shiftName || "Ca Sáng";
                  const timeStr = shift?.timeStr || "08:00 - 15:00";
                  const durationMinutes = shift?.scheduledDurationMinutes || 420;

                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center text-slate-800">
                        <span className="font-bold text-slate-900 text-sm">{formatDateDDMMYYYY(correctionTicket.date)}</span>
                        <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-[11px]">
                          {shiftName}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <div>
                          <span className="text-gray-400 block text-[10px]">Thời gian ca:</span>
                          <span className="font-semibold">{timeStr} ({durationMinutes / 60}h)</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">Cửa hàng:</span>
                          <span className="font-semibold">{storeName}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Time Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Giờ Check-in thực tế <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={correctionInTime}
                      onChange={(e) => setCorrectionInTime(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Giờ Check-out thực tế <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={correctionOutTime}
                      onChange={(e) => setCorrectionOutTime(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Lý do bổ sung công <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="Nhập lý do quên bấm vân tay / chấm công thực tế..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                  ></textarea>
                </div>

                {/* Attachment */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Minh chứng đính kèm (Hình ảnh, tin nhắn xác nhận)
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                    <p className="text-gray-500 text-xs">📸 Chạm để chọn ảnh / tài liệu minh chứng</p>
                  </div>
                </div>

                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-slate-800 text-[11px] leading-relaxed">
                  ℹ️ Giải trình điểm danh sau khi gửi sẽ chuyển tới Quản lý xét duyệt và không tác động vào quỹ phép năm.
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <button
                  disabled={!correctionInTime || !correctionOutTime || !correctionReason.trim()}
                  onClick={() => {
                    const res = commitAttendanceCorrection(
                      correctionTicket.id,
                      correctionInTime,
                      correctionOutTime,
                      correctionReason.trim(),
                      undefined
                    );
                    if (res.success) {
                      setShowAttendanceCorrectionModal(false);
                      setCorrectionTicket(null);
                      setToast({ message: res.message, type: "success" });
                    } else {
                      setToast({ message: res.message, type: "error" });
                    }
                  }}
                  className={cn(
                    "w-full py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md text-sm",
                    !correctionInTime || !correctionOutTime || !correctionReason.trim()
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90 text-white"
                  )}
                >
                  <Send className="w-4 h-4" /> Gửi bổ sung dữ liệu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: TẠO NGHỈ PHÉP TỪ MISSING BOTH (BACKDATED LEAVE) */}
      <AnimatePresence>
        {showBackdatedLeaveModal && backdatedTicket && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-primary/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Umbrella className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Tạo yêu cầu nghỉ đột xuất</h3>
                    <p className="text-[11px] text-gray-500">Từ ticket Missing Both {backdatedTicket.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowBackdatedLeaveModal(false);
                    setBackdatedTicket(null);
                  }}
                  className="p-1.5 rounded-full hover:bg-primary/20 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Related Shift Info Banner */}
                {(() => {
                  const shift = backdatedTicket.relatedShift || availableShifts.find((s: any) => s.id === backdatedTicket.shiftId);
                  const storeName = shift?.storeName || "HMK Nguyễn Trãi";
                  const shiftName = shift?.shiftName || "Ca Sáng";
                  const timeStr = shift?.timeStr || "08:00 - 15:00";
                  const durationMinutes = shift?.scheduledDurationMinutes || 420;
                  const ratio = durationMinutes / 480;
                  const calcDays = ratio >= 0.875 ? 1.0 : Number(ratio.toFixed(2));

                  return (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 text-sm">{formatDateDDMMYYYY(backdatedTicket.date)}</span>
                        <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-[11px]">
                          {shiftName}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-700">
                        <div>
                          <span className="text-gray-500 block text-[10px]">Thời lượng ca:</span>
                          <span className="font-bold">{durationMinutes} phút ({timeStr})</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-[10px]">Cửa hàng:</span>
                          <span className="font-bold">{storeName}</span>
                        </div>
                      </div>
                      
                      {backdatedLeaveType === "ANNUAL_LEAVE" ? (
                        <div className="pt-2 border-t border-primary/20 flex items-center justify-between text-slate-900">
                          <span>Quy đổi ngày phép tính toán:</span>
                          <span className="font-bold text-sm text-primary bg-white px-2 py-0.5 rounded-md border border-primary/30">
                            {calcDays} ngày ({durationMinutes}/480p)
                          </span>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-primary/20 text-sky-800 text-[11px] font-medium">
                          ℹ️ Nghỉ không lương không sử dụng quỹ phép năm.
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Leave Type Selection */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Chọn loại nghỉ phép <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={!user?.annualLeaveEligible}
                      onClick={() => user?.annualLeaveEligible && setBackdatedLeaveType("ANNUAL_LEAVE")}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between",
                        backdatedLeaveType === "ANNUAL_LEAVE"
                          ? "bg-primary/10 border-primary ring-2 ring-primary/40"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100",
                        !user?.annualLeaveEligible && "opacity-60 cursor-not-allowed bg-gray-100"
                      )}
                    >
                      <div>
                        <div className="font-bold text-gray-900 flex items-center justify-between mb-1">
                          <span>Phép năm</span>
                          {backdatedLeaveType === "ANNUAL_LEAVE" && (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        {user?.annualLeaveEligible ? (
                          <p className="text-[10px] text-gray-500">Khả dụng: {leaveBalance.available} ngày</p>
                        ) : (
                          <p className="text-[10px] text-red-600 font-medium leading-tight mt-0.5">
                            Bạn chưa thuộc đối tượng được hưởng phép năm.
                          </p>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBackdatedLeaveType("UNPAID_LEAVE")}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between",
                        backdatedLeaveType === "UNPAID_LEAVE"
                          ? "bg-primary/10 border-primary ring-2 ring-primary/40"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      )}
                    >
                      <div>
                        <div className="font-bold text-gray-900 flex items-center justify-between mb-1">
                          <span>Nghỉ không lương</span>
                          {backdatedLeaveType === "UNPAID_LEAVE" && (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500">Không trừ quỹ phép</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Important Non-Reservation Note */}
                {backdatedLeaveType === "ANNUAL_LEAVE" ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed space-y-1">
                    <p className="font-bold flex items-center gap-1 text-amber-950">
                      <span>ℹ️</span> Quy định xử lý nghỉ đột xuất từ Missing Both:
                    </p>
                    <p>
                      Yêu cầu nghỉ đột xuất không tạo giữ chỗ phép. Quỹ phép chỉ được trừ nếu Quản lý duyệt theo hình thức Phép năm.
                    </p>
                  </div>
                ) : backdatedLeaveType === "UNPAID_LEAVE" ? (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 text-[11px] leading-relaxed space-y-1">
                    <p className="font-bold flex items-center gap-1 text-sky-950">
                      <span>ℹ️</span> Quy định xử lý nghỉ đột xuất từ Missing Both:
                    </p>
                    <p>
                      Nghỉ không lương không sử dụng quỹ phép năm. Khi được duyệt, số dư phép năm của bạn không thay đổi.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-[11px] leading-relaxed">
                    <span>ℹ️ Vui lòng chọn loại nghỉ phép (Phép năm hoặc Nghỉ không lương) để tiếp tục.</span>
                  </div>
                )}

                {/* Reason Input */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Lý do nghỉ phép đột xuất <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={backdatedReason}
                    onChange={(e) => setBackdatedReason(e.target.value)}
                    placeholder="Nhập lý do bạn đã vắng mặt trong ca làm việc..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <button
                  disabled={!backdatedReason.trim() || !backdatedLeaveType || (backdatedLeaveType === "ANNUAL_LEAVE" && !user?.annualLeaveEligible)}
                  onClick={() => {
                    if (!backdatedLeaveType) return;
                    const res = createBackdatedLeaveFromMissingBoth(
                      backdatedTicket.id,
                      backdatedLeaveType,
                      backdatedReason.trim(),
                      undefined
                    );
                    if (res.success) {
                      setShowBackdatedLeaveModal(false);
                      setBackdatedTicket(null);
                      setToast({ message: res.message, type: "success" });
                    } else {
                      setToast({ message: res.message, type: "error" });
                    }
                  }}
                  className={cn(
                    "w-full py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md text-sm",
                    !backdatedReason.trim() || !backdatedLeaveType || (backdatedLeaveType === "ANNUAL_LEAVE" && !user?.annualLeaveEligible)
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90 text-white"
                  )}
                >
                  <Send className="w-4 h-4" /> Gửi yêu cầu nghỉ đột xuất
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
