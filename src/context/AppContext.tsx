import React, { createContext, useContext, useState, ReactNode } from "react";

export type User = {
  id: string;
  name: string;
  employeeId: string;
  role: string;
  department: string;
  avatar: string;
  skills: string[]; // Thêm Skill Tag
  annualLeaveEligible: boolean; // Thêm cho Leave Foundation MOB-01
};

export type ShiftSlot = {
  id: string;
  skillTag: string;
  title: string;
  current: number;
  max: number;
};

export type ShiftStatus =
  | "open"
  | "full"
  | "pending"
  | "approved"
  | "assigned"
  | "rejected"
  | "cancelled"
  | "removed_due_to_leave"; // Added for leave logic

export type LeaveRequestStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "AUTO_REJECTED";

export type LeaveRequestType = "ANNUAL_LEAVE" | "UNPAID_LEAVE";

export type RoundingRule = "ROUND_UP_TO_BLOCK" | "EXACT" | "ROUND_DOWN";

export type LeavePolicy = {
  standardLeaveDayMinutes: number; // e.g. 480 (8 hours)
  minimumLeaveBlockDays: number; // e.g. 0.5
  roundingRule: RoundingRule; // "ROUND_UP_TO_BLOCK"
};

export type LeaveBalance = {
  currentBalance: number; // Official balance (e.g. 6.0)
  reserved: number; // Reserved balance for PENDING requests (e.g. 1.0)
  available: number; // Available balance = currentBalance - reserved (e.g. 5.0)
};

export type ReservationStatus = "ACTIVE" | "RELEASED" | "CONVERTED";

export type LeaveCancelRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "AUTO_REJECTED";

export type AttendanceTicketStatus = "PENDING" | "APPROVED" | "REJECTED" | "AUTO_REJECTED" | "CANCELLED";
export type AttendanceOutcomeType = "ANNUAL_LEAVE" | "UNPAID_ABSENCE" | null;

export type AttendanceTicketType =
  | "missing_both"
  | "missing_check_in"
  | "missing_checkout"
  | "forgot_in"
  | "forgot_out"
  | "device_error"
  | "security_violation"
  | "travel_return";

export type SecurityViolationType = "GPS" | "WIFI" | "DEVICE";
export type AttendanceActionType = "CHECK_IN" | "CHECK_OUT";

export type AttendanceTicket = {
  id: string;
  employeeId: string;
  type: AttendanceTicketType;
  date: Date;
  actualTime?: string;
  reason: string;
  useAnnualLeaveIntent: boolean;
  relatedShift?: {
    id: string;
    shiftName: string;
    timeStr: string;
    storeName: string;
    hours: number;
    isReturnShift?: boolean;
    isSupportShift?: boolean;
  };
  submittedAt: Date;
  status: AttendanceTicketStatus;
  outcomeType?: AttendanceOutcomeType;
  systemReason?: string;
  managerNote?: string;
  violationType?: SecurityViolationType;
  actionType?: AttendanceActionType;
  claimMinutes?: number;
  actualAbsenceMinutes?: number;
  checkoutBTime?: string;
  checkinATime?: string;
  isExplained?: boolean;
  employeeExplanation?: string;
  dispatchGroupId?: string;
};

export type LeaveCancelRequest = {
  id: string;
  leaveRequestId: string;
  employeeId: string;
  reason: string;
  submittedAt: Date;
  status: LeaveCancelRequestStatus;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  systemReason?: string;
};

export type LeaveReservation = {
  id: string;
  leaveRequestId: string;
  reservedDays: number;
  status: ReservationStatus;
  createdAt: Date;
};

export type AffectedShiftSnapshot = {
  shiftId?: string;
  date: string;
  shiftName: string;
  timeStr?: string;
  startTime?: string;
  endTime?: string;
  storeName?: string;
  hours?: number;
  scheduledDurationMinutes: number;
};

export type LeaveRequest = {
  id: string;
  employeeId: string;
  type: LeaveRequestType;
  fromDate: Date;
  toDate: Date;
  reason: string;
  status: LeaveRequestStatus;
  submittedAt: Date;
  managerNote?: string;
  rejectionReason?: string;
  affectedShiftIds?: string[];
  affectedShiftsList?: AffectedShiftSnapshot[];
  affectedShiftMinutes?: number;
  requestedLeaveDays?: number;
  officialDebitedDays?: number;
  reservationId?: string;
  reservedDays?: number;
  balanceBefore?: number;
  availableBalanceAfterReservation?: number;
  approvedAt?: Date;
  rejectedAt?: Date;
  cancelledAt?: Date;
  cancellationSource?: "EMPLOYEE_CANCEL_PENDING" | "APPROVED_CANCEL_REQUEST";
  systemReason?: string;
  branch?: string;
  attachment?: string;
  period?: "Cả ngày" | "Buổi sáng" | "Buổi chiều" | "Theo ca đã xếp";
  affectedShifts?: number;
};

export type Shift = {
  id: string;
  date: Date;
  shiftName: string;
  timeStr: string;
  hours: number;
  currentStaff: number;
  maxStaff: number;
  status: ShiftStatus;
  statusUpdatedAt?: Date; // Added for status update timestamp
  storeName: string;
  skillTag: string; // Keep for legacy/marketplace matching or remove
  slots?: ShiftSlot[]; // Detailed skill slots
  isNew?: boolean;
  isPendingSwap?: boolean;
  isBuddyStore?: boolean;
  requireHandshake?: boolean;
  isSandwichHandshake?: boolean;
  isSupportShift?: boolean;
  isReturnShift?: boolean;
  dispatchGroupId?: string;
  sandwichDetails?: {
    originalStore: string;
    supportStore: string;
    returnStore: string;
    originalHours: string;
    supportHours: string;
    returnHours: string;
    status: "pending" | "accepted" | "rejected";
  };
  cancelReason?: string; // e.g., "no_show_replaced"
  isAdhoc?: boolean;
  adhocReason?: string;
};

export type ShiftBriefing = {
  id: string;
  title: string;
  message: string;
  storeName: string;
  shiftName?: string;
  shiftTime?: string;
  senderName: string;
  senderRole: string;
  sentAt: Date;
  effectiveDate: Date;
  isUrgent: boolean;
  isRead: boolean;
  isAcknowledged: boolean;
  acknowledgedAt?: Date;
  goals?: string[];
};

type AppContextType = {
  user: User | null;
  login: (email: string, pass: string) => void;
  logout: () => void;
  hasCheckedIn: boolean;
  setHasCheckedIn: (val: boolean) => void;
  hasAcknowledgedBriefing: boolean;
  setHasAcknowledgedBriefing: (val: boolean) => void;

  // Shift Registration Management
  availableShifts: Shift[];
  registeredHours: number;
  maxHoursPerWeek: number;
  handleShiftAction: (shiftId: string, action: "register" | "cancel") => boolean;
  acknowledgeDispatch: (shiftId: string) => void;
  addAdhocShift: (
    storeName: string,
    skill: string,
    reason: string,
  ) => Shift;

  // Leave Management & MOB-01
  leaveRequests: LeaveRequest[];
  leaveCancelRequests: LeaveCancelRequest[];
  leavePolicy: LeavePolicy;
  leaveBalance: LeaveBalance;
  leaveReservations: LeaveReservation[];
  submitLeaveRequest: (req: Partial<LeaveRequest>, affectedShiftsCount?: number) => void;
  cancelLeaveRequest: (id: string, isApproved?: boolean) => void;
  cancelPendingLeaveRequest: (id: string) => void;
  submitLeaveCancelRequest: (leaveRequestId: string, reason: string) => { success: boolean; message: string };
  getCancelRequestForLeave: (leaveRequestId: string) => LeaveCancelRequest | undefined;
  processLeaveCancelRequest: (cancelRequestId: string, action: "APPROVE" | "REJECT", note?: string) => void;
  hasLeaveConflict: (date: Date) => boolean;
  getLeaveRequestsByDateRange: (start: Date, end: Date) => LeaveRequest[];
  getLeaveStatusLabel: (status: LeaveRequestStatus) => string;
  getLeaveTypeLabel: (type: LeaveRequestType) => string;
  calculateLeaveDaysFromMinutes: (totalMinutes: number, policy?: LeavePolicy) => { rawDays: number; finalDays: number };
  toggleAnnualLeaveEligibility: () => void;

  // Attendance Tickets & MOB-06
  attendanceTickets: AttendanceTicket[];
  submitAttendanceTicket: (
    ticket: Omit<AttendanceTicket, "id" | "employeeId" | "submittedAt" | "status">
  ) => AttendanceTicket;
  cancelPendingAttendanceTicket: (id: string) => void;
  submitSecurityTicket: (data: {
    shift: Shift;
    action: AttendanceActionType;
    violationType: SecurityViolationType;
    reason: string;
  }) => AttendanceTicket;
  submitMissingCheckInExplanation: (ticketId: string, reason: string) => void;
  autoCancelMissingCheckInOnSuccess: (shiftId?: string) => AttendanceTicket | undefined;
  submitTravelClaimTicket: (data: {
    shiftId: string;
    storeA: string;
    storeB: string;
    checkoutBTime: string;
    checkinATime: string;
    actualAbsenceMinutes: number;
    claimMinutes: number;
  }) => AttendanceTicket;
  acceptSandwichHandshake: (shiftId: string) => void;
  rejectSandwichHandshake: (shiftId: string, reason?: string) => void;
  transitionShiftToMissingBoth: (shiftId?: string) => AttendanceTicket;

  // Briefing Management
  briefings: ShiftBriefing[];
  markBriefingAsRead: (id: string) => void;
  acknowledgeBriefing: (id: string) => void;
};

const mockUser: User = {
  id: "u1",
  name: "Nguyễn Văn A",
  employeeId: "HMK-2023-045",
  role: "Nhân viên bán hàng (NV)",
  department: "Cửa hàng HMK Nguyễn Trãi",
  avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
  skills: ["Tư vấn", "Thu ngân"], // User này không có kỹ năng 'Kho'
  annualLeaveEligible: true, // Default: eligible for Annual Leave
};

const defaultLeavePolicy: LeavePolicy = {
  standardLeaveDayMinutes: 480, // 8 hours = 480 minutes
  minimumLeaveBlockDays: 0.5,
  roundingRule: "ROUND_UP_TO_BLOCK",
};

const initialLeaveBalance: LeaveBalance = {
  currentBalance: 6.0,
  reserved: 1.0,
  available: 5.0, // available = currentBalance - reserved
};

const initialLeaveReservations: LeaveReservation[] = [
  {
    id: "RES-001",
    leaveRequestId: "LR-001",
    reservedDays: 1.0,
    status: "ACTIVE",
    createdAt: new Date(),
  },
];

export const calculateLeaveDaysFromMinutes = (
  totalMinutes: number,
  policy: LeavePolicy = defaultLeavePolicy
): { rawDays: number; finalDays: number } => {
  if (totalMinutes <= 0) {
    return { rawDays: 0, finalDays: 0 };
  }
  const rawDays = totalMinutes / policy.standardLeaveDayMinutes;
  let finalDays = rawDays;

  if (policy.roundingRule === "ROUND_UP_TO_BLOCK") {
    const block = policy.minimumLeaveBlockDays || 0.5;
    finalDays = Math.ceil(rawDays / block) * block;
  }

  return { rawDays, finalDays };
};

export const getLeaveStatusLabel = (status: LeaveRequestStatus | string): string => {
  switch (status) {
    case "DRAFT":
      return "Bản nháp";
    case "PENDING":
    case "Chờ duyệt":
      return "Chờ duyệt";
    case "APPROVED":
    case "Đã duyệt":
      return "Đã duyệt";
    case "REJECTED":
    case "Đã từ chối":
      return "Đã từ chối";
    case "CANCELLED":
    case "Đã hủy":
      return "Đã hủy";
    case "AUTO_REJECTED":
      return "Tự động từ chối";
    default:
      return status;
  }
};

export const getLeaveTypeLabel = (type: LeaveRequestType | string): string => {
  switch (type) {
    case "ANNUAL_LEAVE":
    case "Phép năm":
      return "Phép năm";
    case "UNPAID_LEAVE":
    case "Nghỉ không lương":
      return "Nghỉ không lương";
    default:
      return type;
  }
};

const getNextMonday = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
  return d;
};

// Generate mock shifts
const generateShifts = (): Shift[] => {
  const shifts: Shift[] = [];
  const startOfCurrentWeek = new Date();
  startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() - ((startOfCurrentWeek.getDay() + 6) % 7));
  startOfCurrentWeek.setHours(0, 0, 0, 0);

  // Helper to add shifts for a specific week offset
  const addShiftsForWeek = (weekOffset: number, statusPrefix: string) => {
    const monday = new Date(startOfCurrentWeek);
    monday.setDate(monday.getDate() + weekOffset * 7);

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(monday);
      date.setDate(date.getDate() + dayOffset);

      // Add 2 shifts per day for variety
      const types = [
        { name: "Ca Sáng", time: "08:00 - 15:00", hours: 7, tag: "Tư vấn" },
        { name: "Ca Chiều", time: "15:00 - 22:00", hours: 7, tag: "Thu ngân" },
      ];

      types.forEach((type, i) => {
        const isPast = date < new Date();
        const shiftStatus: ShiftStatus = isPast ? "approved" : "open";
        
        shifts.push({
          id: `${statusPrefix}_${weekOffset}_${dayOffset}_${i}`,
          date,
          statusUpdatedAt: new Date(date.getTime() - 24 * 3600 * 1000),
          shiftName: type.name,
          timeStr: type.time,
          hours: type.hours,
          currentStaff: isPast ? 4 : 1,
          maxStaff: 5,
          status: shiftStatus,
          storeName: "HMK Nguyễn Trãi",
          skillTag: type.tag,
          slots: [
            {
              id: `${statusPrefix}_${weekOffset}_${dayOffset}_${i}_1`,
              skillTag: "Tư vấn",
              title: "Tư vấn bán hàng",
              current: isPast ? 3 : 1,
              max: 3,
            },
            {
              id: `${statusPrefix}_${weekOffset}_${dayOffset}_${i}_2`,
              skillTag: "Thu ngân",
              title: "Thu ngân",
              current: isPast ? 1 : 0,
              max: 2,
            },
          ],
        });
      });
    }
  };

  // Generate for 4 weeks: Previous, Current, Next, Future
  addShiftsForWeek(-1, "past");
  addShiftsForWeek(0, "current");
  addShiftsForWeek(1, "next");
  addShiftsForWeek(2, "future");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const nextWeekDay = new Date(today);
  nextWeekDay.setDate(today.getDate() + 7);

  const finalShifts = shifts.filter(
    (s) =>
      s.date.getTime() !== today.getTime() &&
      s.date.getTime() !== tomorrow.getTime() &&
      s.date.getTime() !== nextWeekDay.getTime()
  );

  finalShifts.push({
    id: `case_approved_today`,
    date: today,
    statusUpdatedAt: new Date(today.getTime() - 24 * 3600 * 1000),
    shiftName: "Ca Sáng",
    timeStr: "08:00 - 15:00",
    hours: 7,
    currentStaff: 4,
    maxStaff: 5,
    status: "approved",
    storeName: "HMK Nguyễn Trãi",
    skillTag: "Tư vấn",
  });

  finalShifts.push({
    id: `case_pending_today`,
    date: today,
    statusUpdatedAt: new Date(today.getTime() - 24 * 3600 * 1000),
    shiftName: "Ca Chiều",
    timeStr: "15:00 - 22:00",
    hours: 7,
    currentStaff: 3,
    maxStaff: 5,
    status: "pending",
    storeName: "HMK Nguyễn Trãi",
    skillTag: "Tư vấn",
  });

  finalShifts.push({
    id: `case_cancelled_today`,
    date: today,
    statusUpdatedAt: new Date(today.getTime() - 24 * 3600 * 1000),
    shiftName: "Ca Tối",
    timeStr: "17:00 - 23:00",
    hours: 6,
    currentStaff: 3,
    maxStaff: 5,
    status: "cancelled",
    storeName: "HMK Nguyễn Trãi",
    skillTag: "Thu ngân",
  });

  finalShifts.push({
    id: `case_handshake_today`,
    date: today,
    statusUpdatedAt: new Date(today.getTime() - 24 * 3600 * 1000),
    shiftName: "Điều động Kẹp Ca (A → B → A)",
    timeStr: "08:00 - 18:00",
    hours: 10,
    currentStaff: 1,
    maxStaff: 1,
    status: "approved",
    storeName: "HMK Nguyễn Trãi",
    skillTag: "Tư vấn",
    isBuddyStore: true,
    requireHandshake: true,
    isSandwichHandshake: true,
    sandwichDetails: {
      originalStore: "HMK Nguyễn Trãi (Store A)",
      supportStore: "HMK Cầu Giấy (Store B)",
      returnStore: "HMK Nguyễn Trãi (Store A)",
      originalHours: "08:00 - 11:00",
      supportHours: "11:00 - 15:00",
      returnHours: "15:00 - 18:00",
      status: "pending",
    },
  });

  finalShifts.push({
    id: `case_swap_tomorrow`,
    date: tomorrow,
    statusUpdatedAt: new Date(tomorrow.getTime() - 24 * 3600 * 1000),
    shiftName: "Ca Xuyên Đêm",
    timeStr: "00:00 - 08:00",
    hours: 8,
    currentStaff: 2,
    maxStaff: 2,
    status: "approved",
    storeName: "HMK Nguyễn Trãi",
    skillTag: "Kho",
    isPendingSwap: true,
  });

  finalShifts.push({
    id: `case_approved_next_week`,
    date: nextWeekDay,
    statusUpdatedAt: new Date(nextWeekDay.getTime() - 24 * 3600 * 1000),
    shiftName: "Ca Sáng",
    timeStr: "08:00 - 15:00",
    hours: 7,
    currentStaff: 5,
    maxStaff: 5,
    status: "approved",
    storeName: "HMK Nguyễn Trãi",
    skillTag: "Tư vấn",
  });

  return finalShifts;
};

// Generate mock leave requests
const generateLeaveRequests = (): LeaveRequest[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);

  return [
    {
      id: "LR-001",
      employeeId: "u1",
      type: "ANNUAL_LEAVE",
      fromDate: tomorrow,
      toDate: tomorrow,
      period: "Cả ngày",
      reason: "Việc gia đình",
      status: "PENDING",
      submittedAt: new Date(today.getTime() - 1000 * 60 * 60 * 2), // 2 hours ago
      branch: "HMK Nguyễn Trãi",
      affectedShifts: 1,
      affectedShiftMinutes: 480,
      requestedLeaveDays: 1.0,
      officialDebitedDays: 0,
      reservationId: "RES-001",
      reservedDays: 1.0,
      balanceBefore: 6.0,
      availableBalanceAfterReservation: 5.0,
      affectedShiftsList: [
        {
          shiftId: "s-tomorrow-1",
          date: tomorrow.toISOString().split("T")[0],
          shiftName: "Ca Sáng",
          timeStr: "08:00 - 16:00",
          storeName: "HMK Nguyễn Trãi",
          hours: 8,
          scheduledDurationMinutes: 480,
        },
      ],
    },
    {
      id: "LR-002",
      employeeId: "u1",
      type: "ANNUAL_LEAVE",
      fromDate: lastWeek,
      toDate: lastWeek,
      period: "Cả ngày",
      reason: "Nghỉ phép cá nhân năm",
      status: "APPROVED",
      submittedAt: new Date(lastWeek.getTime() - 1000 * 60 * 60 * 24 * 2),
      approvedAt: new Date(lastWeek.getTime() - 1000 * 60 * 60 * 24),
      branch: "HMK Nguyễn Trãi",
      managerNote: "Đã duyệt đơn nghỉ phép năm",
      affectedShifts: 2,
      affectedShiftMinutes: 840,
      requestedLeaveDays: 2.0,
      officialDebitedDays: 2.0,
      reservedDays: 0,
      affectedShiftsList: [
        {
          shiftId: "s-lw-1",
          date: lastWeek.toISOString().split("T")[0],
          shiftName: "Ca Sáng",
          timeStr: "08:00 - 15:00",
          storeName: "HMK Nguyễn Trãi",
          hours: 7,
          scheduledDurationMinutes: 420,
        },
        {
          shiftId: "s-lw-2",
          date: lastWeek.toISOString().split("T")[0],
          shiftName: "Ca Tối",
          timeStr: "15:00 - 22:00",
          storeName: "HMK Nguyễn Trãi",
          hours: 7,
          scheduledDurationMinutes: 420,
        },
      ],
    },
    {
      id: "LR-003",
      employeeId: "u1",
      type: "UNPAID_LEAVE",
      fromDate: nextWeek,
      toDate: nextWeek,
      period: "Cả ngày",
      reason: "Việc cá nhân gia đình",
      status: "REJECTED",
      submittedAt: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 2),
      rejectedAt: new Date(today.getTime() - 1000 * 60 * 60 * 24),
      branch: "HMK Nguyễn Trãi",
      managerNote: "Cửa hàng đang thiếu nhân sự trong ca này",
      rejectionReason: "Cửa hàng đang thiếu nhân sự trong ca này",
      affectedShifts: 1,
      affectedShiftMinutes: 480,
      requestedLeaveDays: 1.0,
      officialDebitedDays: 0,
      affectedShiftsList: [
        {
          shiftId: "s-nw-1",
          date: nextWeek.toISOString().split("T")[0],
          shiftName: "Ca Sáng",
          timeStr: "08:00 - 16:00",
          storeName: "HMK Nguyễn Trãi",
          hours: 8,
          scheduledDurationMinutes: 480,
        },
      ],
    },
    {
      id: "LR-004",
      employeeId: "u1",
      type: "ANNUAL_LEAVE",
      fromDate: twoWeeksAgo,
      toDate: twoWeeksAgo,
      period: "Cả ngày",
      reason: "Việc riêng gia đình",
      status: "CANCELLED",
      submittedAt: new Date(twoWeeksAgo.getTime() - 1000 * 60 * 60 * 24 * 3),
      cancelledAt: new Date(twoWeeksAgo.getTime() - 1000 * 60 * 60 * 24 * 2),
      branch: "HMK Nguyễn Trãi",
      affectedShifts: 1,
      affectedShiftMinutes: 480,
      requestedLeaveDays: 1.0,
      officialDebitedDays: 0,
      reservedDays: 1.0,
      affectedShiftsList: [
        {
          shiftId: "s-twa-1",
          date: twoWeeksAgo.toISOString().split("T")[0],
          shiftName: "Ca Sáng",
          timeStr: "08:00 - 16:00",
          storeName: "HMK Nguyễn Trãi",
          hours: 8,
          scheduledDurationMinutes: 480,
        },
      ],
    },
    {
      id: "LR-005",
      employeeId: "u1",
      type: "ANNUAL_LEAVE",
      fromDate: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 10),
      toDate: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 10),
      period: "Cả ngày",
      reason: "Đăng ký nghỉ ngày tổng kiểm kê",
      status: "AUTO_REJECTED",
      submittedAt: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 5),
      rejectedAt: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 4),
      branch: "HMK Nguyễn Trãi",
      systemReason: "Tự động từ chối do trùng thời gian khóa đăng ký nghỉ phép cửa hàng",
      affectedShifts: 1,
      affectedShiftMinutes: 480,
      requestedLeaveDays: 1.0,
      officialDebitedDays: 0,
      reservedDays: 1.0,
      affectedShiftsList: [
        {
          shiftId: "s-ar-1",
          date: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 10).toISOString().split("T")[0],
          shiftName: "Ca Sáng",
          timeStr: "08:00 - 16:00",
          storeName: "HMK Nguyễn Trãi",
          hours: 8,
          scheduledDurationMinutes: 480,
        },
      ],
    },
  ];
};

const mockBriefingsData: ShiftBriefing[] = [
  {
    id: "briefing-001",
    title: "Mục tiêu ca sáng",
    storeName: "HMK Nguyễn Trãi",
    shiftName: "Ca Sáng",
    shiftTime: "08:00 - 15:00",
    senderName: "Nguyễn Minh Anh",
    senderRole: "CHT",
    isUrgent: true,
    isRead: false,
    isAcknowledged: false,
    sentAt: new Date(new Date().getTime() - 1000 * 60 * 30),
    effectiveDate: new Date(),
    message: "Hôm nay tập trung kiểm tra trưng bày quầy kính mát, nhắc khách chương trình ưu đãi và báo ngay cho CHT nếu thiếu hàng.",
    goals: [
      "Kiểm tra trưng bày quầy kính mát",
      "Nhắc khách chương trình ưu đãi",
      "Báo CHT nếu thiếu hàng"
    ]
  },
  {
    id: "briefing-002",
    title: "Nhắc kiểm tồn cuối ca",
    storeName: "HMK Cầu Giấy",
    shiftName: "Ca Tối",
    shiftTime: "17:00 - 23:00",
    senderName: "Trần Quốc Bảo",
    senderRole: "CHT",
    isUrgent: false,
    isRead: true,
    isAcknowledged: true,
    sentAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
    effectiveDate: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
    acknowledgedAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 23),
    message: "Các bạn ca tối nhớ kiểm tồn trước khi đóng cửa nhé."
  },
  {
    id: "briefing-003",
    title: "Lưu ý vệ sinh khu vực thử kính",
    storeName: "HMK Nguyễn Trãi",
    shiftName: "Ca Gãy",
    shiftTime: "10:00 - 14:00",
    senderName: "Lê Thanh Hà",
    senderRole: "CHT",
    isUrgent: false,
    isRead: false,
    isAcknowledged: false,
    sentAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 2),
    effectiveDate: new Date(),
    message: "Khu vực thử kính đang hơi bụi, các bạn đầu ca nhớ lau qua một lượt nhé."
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(mockUser);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasAcknowledgedBriefing, setHasAcknowledgedBriefing] = useState(false);

  const [availableShifts, setAvailableShifts] =
    useState<Shift[]>(generateShifts());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(generateLeaveRequests());
  const [leaveCancelRequests, setLeaveCancelRequests] = useState<LeaveCancelRequest[]>([]);
  const [attendanceTickets, setAttendanceTickets] = useState<AttendanceTicket[]>([
    {
      id: "TK-ATT-001",
      employeeId: "u1",
      type: "missing_both",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      reason: "Quên check-in & check-out do máy điện thoại hết pin đột xuất.",
      useAnnualLeaveIntent: true,
      relatedShift: {
        id: "s-past-1",
        shiftName: "Ca Sáng",
        timeStr: "08:00 - 15:00",
        storeName: "HMK Nguyễn Trãi",
        hours: 7,
      },
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "PENDING",
    },
  ]);
  const [leavePolicy] = useState<LeavePolicy>(defaultLeavePolicy);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>(initialLeaveBalance);
  const [leaveReservations, setLeaveReservations] = useState<LeaveReservation[]>(initialLeaveReservations);
  const [briefings, setBriefings] = useState<ShiftBriefing[]>(mockBriefingsData);
  const maxHoursPerWeek = 60;

  const registeredHours = availableShifts
    .filter((s) => s.status === "pending" || s.status === "approved")
    .reduce((acc, curr) => acc + curr.hours, 0);

  const login = (email: string, pass: string) => {
    setTimeout(() => setUser(mockUser), 500);
  };

  const logout = () => setUser(null);

  const toggleAnnualLeaveEligibility = () => {
    setUser(prev => prev ? { ...prev, annualLeaveEligible: !prev.annualLeaveEligible } : null);
  };

  // --- Leave Request Methods ---
  const submitLeaveRequest = (req: Partial<LeaveRequest>, affectedShiftsCount: number = 0) => {
    const newReq: LeaveRequest = {
      id: `LR-${Date.now().toString().slice(-4)}`,
      employeeId: user?.id || "u1",
      type: req.type || "ANNUAL_LEAVE",
      fromDate: req.fromDate || new Date(),
      toDate: req.toDate || new Date(),
      reason: req.reason || "",
      status: "PENDING",
      submittedAt: new Date(),
      branch: req.branch || user?.department || "HMK Nguyễn Trãi",
      affectedShifts: affectedShiftsCount,
      affectedShiftMinutes: req.affectedShiftMinutes || 0,
      requestedLeaveDays: req.requestedLeaveDays !== undefined ? req.requestedLeaveDays : 0,
      officialDebitedDays: req.officialDebitedDays || 0,
      affectedShiftsList: req.affectedShiftsList || [],
      period: req.period || "Cả ngày",
      attachment: req.attachment,
    };

    // If Annual Leave, create active reservation and deduct available balance
    if (newReq.type === "ANNUAL_LEAVE") {
      const daysToReserve = newReq.requestedLeaveDays || 0;
      const resId = `RES-${Date.now().toString().slice(-4)}`;
      newReq.reservationId = resId;
      newReq.reservedDays = daysToReserve;
      newReq.balanceBefore = leaveBalance.currentBalance;
      newReq.availableBalanceAfterReservation = leaveBalance.available - daysToReserve;

      const newReservation: LeaveReservation = {
        id: resId,
        leaveRequestId: newReq.id,
        reservedDays: daysToReserve,
        status: "ACTIVE",
        createdAt: new Date(),
      };

      setLeaveReservations(prev => [newReservation, ...prev]);
      setLeaveBalance(prev => {
        const newReserved = prev.reserved + daysToReserve;
        return {
          ...prev,
          reserved: newReserved,
          available: prev.currentBalance - newReserved,
        };
      });
    }

    setLeaveRequests((prev) => [newReq, ...prev]);
  };

  const cancelPendingLeaveRequest = (id: string) => {
    const req = leaveRequests.find((r) => r.id === id);
    if (!req) return;

    if (req.status !== "PENDING" && (req.status as string) !== "Chờ duyệt") {
      console.warn("Chỉ đơn ở trạng thái PENDING mới có thể tự hủy bởi nhân viên.");
      return;
    }

    setLeaveRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "CANCELLED", cancelledAt: new Date(), cancellationSource: "EMPLOYEE_CANCEL_PENDING" }
          : r
      )
    );

    // Release reservation for ANNUAL_LEAVE
    if (req.type === "ANNUAL_LEAVE" || (req.type as string) === "Phép năm") {
      setLeaveReservations((prev) =>
        prev.map((res) =>
          (res.id === req.reservationId || res.leaveRequestId === id) && res.status === "ACTIVE"
            ? { ...res, status: "RELEASED" }
            : res
        )
      );

      const releasedDays = req.reservedDays !== undefined ? req.reservedDays : (req.requestedLeaveDays || 0);
      setLeaveBalance((prev) => {
        const newReserved = Math.max(0, prev.reserved - releasedDays);
        return {
          ...prev,
          reserved: newReserved,
          available: prev.currentBalance - newReserved,
        };
      });
    }
  };

  const cancelLeaveRequest = (id: string, isApproved?: boolean) => {
    const req = leaveRequests.find((r) => r.id === id);
    if (!req) return;

    // RULE: PENDING leave can be cancelled directly by employee (PENDING -> CANCELLED).
    // APPROVED leave CANNOT be directly cancelled here without a separate LeaveCancelRequest (handled in Web Admin flow).
    if (req.status === "APPROVED" || (req.status as string) === "Đã duyệt") {
      console.warn("Đơn phép đã duyệt không thể tự hủy trực tiếp. Phải gửi Yêu cầu hủy nghỉ phép.");
      return;
    }

    if (req.status === "PENDING" || (req.status as string) === "Chờ duyệt") {
      cancelPendingLeaveRequest(id);
    }
  };

  const getCancelRequestForLeave = (leaveRequestId: string) => {
    return leaveCancelRequests.find((cr) => cr.leaveRequestId === leaveRequestId && cr.status !== "AUTO_REJECTED");
  };

  const submitLeaveCancelRequest = (leaveRequestId: string, reason: string): { success: boolean; message: string } => {
    const origReq = leaveRequests.find((r) => r.id === leaveRequestId);
    if (!origReq) {
      return { success: false, message: "Không tìm thấy đơn nghỉ phép gốc." };
    }

    if (origReq.status !== "APPROVED" && (origReq.status as string) !== "Đã duyệt") {
      return {
        success: false,
        message: "Chỉ cho phép tạo yêu cầu hủy khi đơn nghỉ phép ban đầu ở trạng thái ĐÃ DUYỆT.",
      };
    }

    // Duplicate protection
    const existingPending = leaveCancelRequests.find(
      (cr) => cr.leaveRequestId === leaveRequestId && cr.status === "PENDING"
    );
    if (existingPending) {
      return { success: false, message: "Yêu cầu hủy đang chờ xử lý." };
    }

    const newCancelReq: LeaveCancelRequest = {
      id: `LCR-${Date.now().toString().slice(-4)}`,
      leaveRequestId,
      employeeId: user?.id || "u1",
      reason,
      submittedAt: new Date(),
      status: "PENDING",
    };

    setLeaveCancelRequests((prev) => [newCancelReq, ...prev]);

    return {
      success: true,
      message: "Đã gửi yêu cầu hủy nghỉ phép. Yêu cầu đang chờ quản lý xử lý.",
    };
  };

  /**
   * DEV/MOCK ONLY: Background server synchronization helper.
   * NOT used in Employee Mobile UI as Mobile is strictly Employee-only.
   */
  const processLeaveCancelRequest = (cancelRequestId: string, action: "APPROVE" | "REJECT", note?: string) => {
    const cancelReq = leaveCancelRequests.find((cr) => cr.id === cancelRequestId);
    if (!cancelReq) return;

    if (action === "APPROVE") {
      setLeaveCancelRequests((prev) =>
        prev.map((cr) =>
          cr.id === cancelRequestId
            ? { ...cr, status: "APPROVED", approvedAt: new Date() }
            : cr
        )
      );

      const origReq = leaveRequests.find((r) => r.id === cancelReq.leaveRequestId);
      if (origReq) {
        setLeaveRequests((prev) =>
          prev.map((r) =>
            r.id === cancelReq.leaveRequestId
              ? { ...r, status: "CANCELLED", cancelledAt: new Date(), cancellationSource: "APPROVED_CANCEL_REQUEST" }
              : r
          )
        );

        if (origReq.type === "ANNUAL_LEAVE" || (origReq.type as string) === "Phép năm") {
          const daysToRestore = origReq.requestedLeaveDays || origReq.reservedDays || 1.0;
          setLeaveBalance((prev) => ({
            ...prev,
            currentBalance: prev.currentBalance + daysToRestore,
            available: prev.currentBalance + daysToRestore - prev.reserved,
          }));
        }
      }
    } else {
      setLeaveCancelRequests((prev) =>
        prev.map((cr) =>
          cr.id === cancelRequestId
            ? { ...cr, status: "REJECTED", rejectedAt: new Date(), rejectionReason: note }
            : cr
        )
      );
    }
  };

  const hasLeaveConflict = (date: Date) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    return leaveRequests.some((req) => {
      const from = new Date(req.fromDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(req.toDate);
      to.setHours(0, 0, 0, 0);

      const isActiveStatus =
        req.status === "PENDING" ||
        req.status === "APPROVED" ||
        (req.status as string) === "Chờ duyệt" ||
        (req.status as string) === "Đã duyệt";

      return (
        isActiveStatus &&
        targetDate.getTime() >= from.getTime() &&
        targetDate.getTime() <= to.getTime()
      );
    });
  };

  const getLeaveRequestsByDateRange = (start: Date, end: Date) => {
    const startTime = start.getTime();
    const endTime = end.getTime();
    
    return leaveRequests.filter((req) => {
       const reqFrom = req.fromDate.getTime();
       const reqTo = req.toDate.getTime();
       return reqFrom <= endTime && reqTo >= startTime;
    });
  };
  // -----------------------------

  const handleShiftAction = (
    shiftId: string,
    action: "register" | "cancel",
  ): boolean => {
    if (action === "register") {
      const targetShift = availableShifts.find((s) => s.id === shiftId);
      if (targetShift) {
        // Check if there is a leave conflict
        if (hasLeaveConflict(targetShift.date)) {
          console.warn("Lỗi: Trùng lịch nghỉ phép.");
          return false;
        }

        // Check overlap
        const myActiveShifts = availableShifts.filter(
          (s) =>
            (s.status === "approved" || s.status === "pending") &&
            s.date.toDateString() === targetShift.date.toDateString(),
        );

        const parseTime = (t: string) => parseInt(t.replace(":", ""), 10);
        const [tS1, tE1] = targetShift.timeStr.split(" - ").map(parseTime);

        const hasOverlap = myActiveShifts.some((s) => {
          if (!s.timeStr.includes(" - ")) return false;
          const [sS2, sE2] = s.timeStr.split(" - ").map(parseTime);
          return tS1 < sE2 && sS2 < tE1;
        });

        if (hasOverlap) {
          console.warn("Lỗi: Ca đăng ký bị trùng lặp thời gian với ca hiện tại của bạn!");
          return false;
        }
      }
    }

    setAvailableShifts((prev) =>
      prev.map((shift) => {
        if (shift.id === shiftId) {
          if (action === "cancel") {
            return {
              ...shift,
              status: shift.currentStaff >= shift.maxStaff ? "full" : "open",
            };
          }
          if (action === "register") {
            return { ...shift, status: "pending" };
          }
        }
        return shift;
      }),
    );
    return true;
  };

  const acknowledgeDispatch = (shiftId: string) => {
    setAvailableShifts((prev) =>
      prev.map((shift) => {
        if (shift.id === shiftId) {
          return { ...shift, requireHandshake: false };
        }
        return shift;
      }),
    );
  };

  const addAdhocShift = (storeName: string, skill: string, reason: string) => {
    const shiftStart = new Date();
    // Default maximum duration logic or similar
    const shiftEnd = new Date(shiftStart.getTime() + 8 * 60 * 60 * 1000); // 8 hours max

    const newShift: Shift = {
      id: `adhoc_${Date.now()}`,
      date: shiftStart,
      statusUpdatedAt: new Date(),
      shiftName: "Ca Đột Xuất",
      timeStr: `${shiftStart.getHours()}:${shiftStart.getMinutes().toString().padStart(2, "0")} - ${shiftEnd.getHours()}:${shiftEnd.getMinutes().toString().padStart(2, "0")}`,
      hours: 8,
      currentStaff: 1,
      maxStaff: 1,
      status: "approved", // adhoc is basically self-approved for check-in
      storeName: storeName,
      skillTag: skill,
      isAdhoc: true,
      adhocReason: reason,
    };

    console.info("Bạn đang tạo 1 ca đột xuất. Record này sẽ được gán cờ Flagged_Exception chờ Quản lý duyệt.");

    setAvailableShifts((prev) => [...prev, newShift]);
    return newShift;
  };

  const submitAttendanceTicket = (
    ticket: Omit<AttendanceTicket, "id" | "employeeId" | "submittedAt" | "status">
  ): AttendanceTicket => {
    const newTicket: AttendanceTicket = {
      ...ticket,
      id: `TK-ATT-${Date.now().toString().slice(-4)}`,
      employeeId: user?.id || "u1",
      submittedAt: new Date(),
      status: "PENDING",
    };

    setAttendanceTickets((prev) => [newTicket, ...prev]);
    return newTicket;
  };

  const cancelPendingAttendanceTicket = (id: string) => {
    setAttendanceTickets((prev) =>
      prev.map((t) =>
        t.id === id && t.status === "PENDING"
          ? { ...t, status: "CANCELLED", outcomeType: null }
          : t
      )
    );
  };

  const submitSecurityTicket = (data: {
    shift: Shift;
    action: AttendanceActionType;
    violationType: SecurityViolationType;
    reason: string;
  }): AttendanceTicket => {
    const empId = user?.id || "u1";
    // Duplicate detection scoped by: Employee + Shift + Action (CHECK_IN/CHECK_OUT) + Violation Type (GPS/WIFI/DEVICE) + Active Status
    const existing = attendanceTickets.find(
      (t) =>
        t.type === "security_violation" &&
        t.employeeId === empId &&
        t.relatedShift?.id === data.shift.id &&
        t.actionType === data.action &&
        t.violationType === data.violationType &&
        t.status !== "CANCELLED"
    );

    if (existing) {
      // Update reason if new reason provided and return existing ticket
      setAttendanceTickets((prev) =>
        prev.map((t) => (t.id === existing.id ? { ...t, reason: data.reason } : t))
      );
      return { ...existing, reason: data.reason };
    }

    const shiftDisplayName = data.shift.isReturnShift
      ? `Ca quay lại — ${data.shift.storeName}`
      : data.shift.isSupportShift
      ? `Ca Hỗ Trợ — ${data.shift.storeName}`
      : data.shift.shiftName;

    const newTicket: AttendanceTicket = {
      id: `TK-SEC-${Date.now().toString().slice(-4)}`,
      employeeId: empId,
      type: "security_violation",
      date: new Date(),
      reason: data.reason,
      useAnnualLeaveIntent: false,
      relatedShift: {
        id: data.shift.id,
        shiftName: shiftDisplayName,
        timeStr: data.shift.timeStr,
        storeName: data.shift.storeName,
        hours: data.shift.hours,
        isReturnShift: data.shift.isReturnShift,
        isSupportShift: data.shift.isSupportShift,
      },
      submittedAt: new Date(),
      status: "PENDING",
      violationType: data.violationType,
      actionType: data.action,
    };

    setAttendanceTickets((prev) => [newTicket, ...prev]);
    return newTicket;
  };

  const submitMissingCheckInExplanation = (ticketId: string, reason: string) => {
    setAttendanceTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              reason: reason,
              employeeExplanation: reason,
              isExplained: true,
              systemReason: "Đã giải trình bởi nhân viên — Chờ kết thúc ca",
            }
          : t
      )
    );
  };

  const autoCancelMissingCheckInOnSuccess = (shiftId?: string): AttendanceTicket | undefined => {
    let cancelledTicket: AttendanceTicket | undefined;
    setAttendanceTickets((prev) =>
      prev.map((t) => {
        if (
          t.type === "missing_check_in" &&
          t.status === "PENDING" &&
          (!shiftId || t.relatedShift?.id === shiftId || !t.relatedShift)
        ) {
          cancelledTicket = {
            ...t,
            status: "CANCELLED",
            systemReason: "Hệ thống tự động hủy do nhân viên đã Check-in thành công sau đó",
          };
          return cancelledTicket;
        }
        return t;
      })
    );
    return cancelledTicket;
  };

  const submitTravelClaimTicket = (data: {
    shiftId: string;
    storeA: string;
    storeB: string;
    checkoutBTime: string;
    checkinATime: string;
    actualAbsenceMinutes: number;
    claimMinutes: number;
  }): AttendanceTicket => {
    const newTicket: AttendanceTicket = {
      id: `TK-TRV-${Date.now().toString().slice(-4)}`,
      employeeId: user?.id || "u1",
      type: "travel_return",
      date: new Date(),
      reason: `Khai báo thời gian di chuyển từ ${data.storeB} về ${data.storeA} (${data.claimMinutes}/${data.actualAbsenceMinutes} phút)`,
      useAnnualLeaveIntent: false,
      relatedShift: {
        id: data.shiftId,
        shiftName: `Ca quay lại — ${data.storeA}`,
        timeStr: `${data.checkinATime} - 18:00`,
        storeName: data.storeA,
        hours: 3,
        isReturnShift: true,
      },
      submittedAt: new Date(),
      status: "PENDING",
      claimMinutes: data.claimMinutes,
      actualAbsenceMinutes: data.actualAbsenceMinutes,
      checkoutBTime: data.checkoutBTime,
      checkinATime: data.checkinATime,
    };

    setAttendanceTickets((prev) => [newTicket, ...prev]);
    return newTicket;
  };

  const acceptSandwichHandshake = (shiftId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dispatchGroupId = `DSP-SANDWICH-${Date.now().toString().slice(-6)}`;

    setAvailableShifts((prev) => {
      const filtered = prev.filter((s) => s.id !== shiftId && s.id !== "case_approved_today");

      const origShift: Shift = {
        id: `shift_sandwich_orig_${Date.now()}`,
        date: today,
        shiftName: "Ca Gốc (Store A)",
        timeStr: "08:00 - 11:00",
        hours: 3,
        currentStaff: 4,
        maxStaff: 5,
        status: "approved",
        storeName: "HMK Nguyễn Trãi (Store A)",
        skillTag: "Tư vấn",
        dispatchGroupId: dispatchGroupId,
      };

      const supportShift: Shift = {
        id: `shift_sandwich_support_${Date.now()}`,
        date: today,
        shiftName: "Ca Hỗ Trợ (Store B)",
        timeStr: "11:00 - 15:00",
        hours: 4,
        currentStaff: 5,
        maxStaff: 5,
        status: "approved",
        storeName: "HMK Cầu Giấy (Store B)",
        skillTag: "Tư vấn",
        isBuddyStore: true,
        isSupportShift: true,
        dispatchGroupId: dispatchGroupId,
      };

      const returnShift: Shift = {
        id: `shift_sandwich_return_${Date.now()}`,
        date: today,
        shiftName: "Ca quay lại — HMK Nguyễn Trãi (Store A)",
        timeStr: "15:00 - 18:00",
        hours: 3,
        currentStaff: 4,
        maxStaff: 5,
        status: "approved",
        storeName: "HMK Nguyễn Trãi (Store A)",
        skillTag: "Tư vấn",
        isReturnShift: true,
        dispatchGroupId: dispatchGroupId,
      };

      return [origShift, supportShift, returnShift, ...filtered];
    });
  };

  const rejectSandwichHandshake = (shiftId: string, reason?: string) => {
    setAvailableShifts((prev) =>
      prev.map((s) => {
        if (s.id === shiftId) {
          return {
            ...s,
            requireHandshake: false,
            status: "rejected",
            cancelReason: reason || "Nhân viên từ chối điều động kẹp ca",
          };
        }
        return s;
      })
    );
  };

  const transitionShiftToMissingBoth = (shiftId?: string): AttendanceTicket => {
    const today = new Date();
    const targetShiftId = shiftId || "case_approved_today";
    const targetShift = availableShifts.find((s) => s.id === targetShiftId);

    // 1. Find existing missing check in for this exact shift to carry explanation forward
    const existingMissingIn = attendanceTickets.find(
      (t) =>
        t.type === "missing_check_in" &&
        t.status === "PENDING" &&
        t.relatedShift?.id === targetShiftId
    );

    const priorExplanation =
      existingMissingIn?.employeeExplanation ||
      (existingMissingIn?.isExplained ? existingMissingIn?.reason : undefined);

    // Cancel ONLY the active missing check-in belonging to this exact shift
    setAttendanceTickets((prev) =>
      prev.map((t) => {
        if (
          t.type === "missing_check_in" &&
          t.status === "PENDING" &&
          t.relatedShift?.id === targetShiftId
        ) {
          return {
            ...t,
            status: "CANCELLED",
            systemReason: "Chuyển thành Missing Both do ca đã kết thúc",
          };
        }
        return t;
      })
    );

    const shiftDisplayName = targetShift?.isReturnShift
      ? `Ca quay lại — ${targetShift.storeName}`
      : targetShift?.isSupportShift
      ? `Ca Hỗ Trợ — ${targetShift.storeName}`
      : targetShift?.shiftName || "Ca Sáng";

    // 2. Create missing both ticket preserving explanation
    const missingBothTicket: AttendanceTicket = {
      id: `TK-MB-${Date.now().toString().slice(-4)}`,
      employeeId: user?.id || "u1",
      type: "missing_both",
      date: today,
      reason: priorExplanation
        ? `Giải trình của nhân viên: "${priorExplanation}". Ca đã kết thúc không có Check-in/Check-out hợp lệ.`
        : "Ca đã kết thúc nhưng không có ghi nhận Check-in và Check-out hợp lệ.",
      employeeExplanation: priorExplanation,
      useAnnualLeaveIntent: false,
      relatedShift: {
        id: targetShiftId,
        shiftName: shiftDisplayName,
        timeStr: targetShift?.timeStr || "08:00 - 15:00",
        storeName: targetShift?.storeName || "HMK Nguyễn Trãi",
        hours: targetShift?.hours || 7,
        isReturnShift: targetShift?.isReturnShift,
        isSupportShift: targetShift?.isSupportShift,
      },
      submittedAt: today,
      status: "PENDING",
      systemReason: "Hệ thống tự động ghi nhận vắng mặt cả ca (Missing Both) sau giờ đóng ca",
    };

    setAttendanceTickets((prev) => [missingBothTicket, ...prev]);
    return missingBothTicket;
  };

  const markBriefingAsRead = (id: string) => {
    setBriefings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isRead: true } : b))
    );
  };

  const acknowledgeBriefing = (id: string) => {
    setBriefings((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, isRead: true, isAcknowledged: true, acknowledgedAt: new Date() }
          : b
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        hasCheckedIn,
        setHasCheckedIn,
        hasAcknowledgedBriefing,
        setHasAcknowledgedBriefing,
        availableShifts,
        registeredHours,
        maxHoursPerWeek,
        handleShiftAction,
        acknowledgeDispatch,
        addAdhocShift,
        leaveRequests,
        leaveCancelRequests,
        leavePolicy,
        leaveBalance,
        leaveReservations,
        submitLeaveRequest,
        cancelLeaveRequest,
        cancelPendingLeaveRequest,
        submitLeaveCancelRequest,
        getCancelRequestForLeave,
        processLeaveCancelRequest,
        hasLeaveConflict,
        getLeaveRequestsByDateRange,
        getLeaveStatusLabel,
        getLeaveTypeLabel,
        calculateLeaveDaysFromMinutes,
        toggleAnnualLeaveEligibility,
        briefings,
        markBriefingAsRead,
        acknowledgeBriefing,
        attendanceTickets,
        submitAttendanceTicket,
        cancelPendingAttendanceTicket,
        submitSecurityTicket,
        submitMissingCheckInExplanation,
        autoCancelMissingCheckInOnSuccess,
        submitTravelClaimTicket,
        acceptSandwichHandshake,
        rejectSandwichHandshake,
        transitionShiftToMissingBoth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined)
    throw new Error("useApp must be used within AppProvider");
  return context;
}
