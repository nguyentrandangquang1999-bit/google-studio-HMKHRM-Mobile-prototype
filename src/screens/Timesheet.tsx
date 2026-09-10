import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Filter,
  MapPin,
  SearchX,
  X,
  RotateCcw,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  format,
  subMonths,
  addMonths,
} from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "@/context/AppContext";

// Type definition for historical attendance records
export type AttendanceHistoryRecord = {
  id: string;
  date: Date;
  shiftName: string;
  workingBranch: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  checkIn: string | null; // e.g. "21:10" or null
  checkOut: string | null; // e.g. "21:04" or null
  standardWorkHours: number; // e.g. 0 or 7
  actualWorkHours: number; // e.g. 0.03 or 7.5
  isOvernight?: boolean;
};

// Mock historical dataset calibrated for September 2026 (Công chuẩn: 76.9h, Công thực tế: 75.8h)
const baseAttendanceHistory: AttendanceHistoryRecord[] = [
  // 07/09/2026
  {
    id: "rec-0709-1",
    date: new Date(2026, 8, 7),
    shiftName: "Ca đột xuất",
    workingBranch: "HMK Nguyễn Trãi",
    scheduledStartTime: "10:30",
    scheduledEndTime: "14:30",
    checkIn: "10:29",
    checkOut: "14:32",
    standardWorkHours: 4.0,
    actualWorkHours: 4.05,
  },

  // 06/09/2026 (Overnight Shift across midnight)
  {
    id: "rec-0609-1",
    date: new Date(2026, 8, 6),
    shiftName: "Ca Đêm Kho & Kiểm Kê",
    workingBranch: "HMK Thủ Đức",
    scheduledStartTime: "22:00",
    scheduledEndTime: "06:00",
    checkIn: "21:55",
    checkOut: "06:05",
    standardWorkHours: 8.0,
    actualWorkHours: 8.1,
    isOvernight: true,
  },

  // 05/09/2026
  {
    id: "rec-0509-1",
    date: new Date(2026, 8, 5),
    shiftName: "Ca Gãy Tư Vấn",
    workingBranch: "HMK Nguyễn Trãi",
    scheduledStartTime: "09:00",
    scheduledEndTime: "13:00",
    checkIn: "08:58",
    checkOut: "13:02",
    standardWorkHours: 4.0,
    actualWorkHours: 4.0,
  },

  // 04/09/2026: Multiple test shifts on same date (Sorted by Check-in ASC)
  {
    id: "rec-0409-1",
    date: new Date(2026, 8, 4),
    shiftName: "Quang test Midshift 19h40 - 19h41 T5 Q1.2",
    workingBranch: "HMK Nguyễn Trãi",
    scheduledStartTime: "19:40",
    scheduledEndTime: "19:41",
    checkIn: "19:40",
    checkOut: "19:41",
    standardWorkHours: 0,
    actualWorkHours: 0.02,
  },
  {
    id: "rec-0409-2",
    date: new Date(2026, 8, 4),
    shiftName: "Quang test Midshift 19h45 - 19h50 T5 Q1.2",
    workingBranch: "HMK Nguyễn Trãi",
    scheduledStartTime: "19:45",
    scheduledEndTime: "19:50",
    checkIn: "19:45",
    checkOut: "19:50",
    standardWorkHours: 0,
    actualWorkHours: 0.08,
  },
  {
    id: "rec-0409-3",
    date: new Date(2026, 8, 4),
    shiftName: "Quang test Offshift 20h40 - 20h45 T5 Q1.2",
    workingBranch: "HMK Nguyễn Trãi",
    scheduledStartTime: "20:40",
    scheduledEndTime: "20:45",
    checkIn: "20:40",
    checkOut: "20:45",
    standardWorkHours: 0,
    actualWorkHours: 0.08,
  },
  {
    id: "rec-0409-4",
    date: new Date(2026, 8, 4),
    shiftName: "Quang test Sandwich Q1.2 (21H10 - 21H20) T6",
    workingBranch: "HMK Nguyễn Trãi",
    scheduledStartTime: "21:00",
    scheduledEndTime: "21:30",
    checkIn: "21:10",
    checkOut: "21:04",
    standardWorkHours: 0,
    actualWorkHours: 0.03,
  },

  // 03/09/2026
  {
    id: "rec-0309-1",
    date: new Date(2026, 8, 3),
    shiftName: "Ca Sáng",
    workingBranch: "HMK Nguyễn Trãi",
    scheduledStartTime: "08:00",
    scheduledEndTime: "15:00",
    checkIn: "07:58",
    checkOut: "15:02",
    standardWorkHours: 7.0,
    actualWorkHours: 7.0,
  },

  // 02/09/2026 (Support / Dispatched Shift at another branch)
  {
    id: "rec-0209-1",
    date: new Date(2026, 8, 2),
    shiftName: "Ca Chiều (Tăng cường)",
    workingBranch: "HMK Cầu Giấy",
    scheduledStartTime: "15:00",
    scheduledEndTime: "22:00",
    checkIn: "14:55",
    checkOut: "22:05",
    standardWorkHours: 7.0,
    actualWorkHours: 7.05,
  },

  // 01/09/2026 (Multi-store work)
  {
    id: "rec-0109-1",
    date: new Date(2026, 8, 1),
    shiftName: "Ca Sáng",
    workingBranch: "HMK Minh Anh",
    scheduledStartTime: "08:00",
    scheduledEndTime: "15:00",
    checkIn: "08:03",
    checkOut: "15:00",
    standardWorkHours: 7.0,
    actualWorkHours: 6.95,
  },

  // 08/09/2026
  {
    id: "rec-0809-1",
    date: new Date(2026, 8, 8),
    shiftName: "Ca Sáng",
    workingBranch: "HMK Nguyễn Trãi",
    scheduledStartTime: "08:00",
    scheduledEndTime: "15:00",
    checkIn: "08:05",
    checkOut: "14:58",
    standardWorkHours: 7.0,
    actualWorkHours: 6.85,
  },

  // 09/09/2026
  {
    id: "rec-0909-1",
    date: new Date(2026, 8, 9),
    shiftName: "Ca Chiều",
    workingBranch: "HMK Cầu Giấy",
    scheduledStartTime: "15:00",
    scheduledEndTime: "22:00",
    checkIn: "14:56",
    checkOut: "22:06",
    standardWorkHours: 7.0,
    actualWorkHours: 7.1,
  },

  // 10/09/2026
  {
    id: "rec-1009-1",
    date: new Date(2026, 8, 10),
    shiftName: "Ca Sáng",
    workingBranch: "HMK Nguyễn Trãi",
    scheduledStartTime: "08:00",
    scheduledEndTime: "15:00",
    checkIn: "07:59",
    checkOut: "15:01",
    standardWorkHours: 7.0,
    actualWorkHours: 7.0,
  },

  // 12/09/2026
  {
    id: "rec-1209-1",
    date: new Date(2026, 8, 12),
    shiftName: "Ca Chiều",
    workingBranch: "HMK Nguyễn Trãi",
    scheduledStartTime: "15:00",
    scheduledEndTime: "22:00",
    checkIn: "15:04",
    checkOut: "21:58",
    standardWorkHours: 7.0,
    actualWorkHours: 6.9,
  },

  // 14/09/2026
  {
    id: "rec-1409-1",
    date: new Date(2026, 8, 14),
    shiftName: "Ca Sáng",
    workingBranch: "HMK Minh Anh",
    scheduledStartTime: "08:00",
    scheduledEndTime: "15:00",
    checkIn: "07:55",
    checkOut: "15:05",
    standardWorkHours: 7.0,
    actualWorkHours: 7.1,
  },

  // 15/09/2026
  {
    id: "rec-1509-1",
    date: new Date(2026, 8, 15),
    shiftName: "Ca Chiều",
    workingBranch: "HMK Nguyễn Trãi",
    scheduledStartTime: "15:00",
    scheduledEndTime: "22:00",
    checkIn: "15:00",
    checkOut: "22:00",
    standardWorkHours: 7.0,
    actualWorkHours: 7.0,
  },

  // 16/09/2026
  {
    id: "rec-1609-1",
    date: new Date(2026, 8, 16),
    shiftName: "Ca Tối Tăng Cường",
    workingBranch: "HMK Thủ Đức",
    scheduledStartTime: "17:30",
    scheduledEndTime: "22:30",
    checkIn: "17:30",
    checkOut: "21:00",
    standardWorkHours: 4.9,
    actualWorkHours: 3.49,
  },

  // Mock records for August 2026 (for testing previous month navigation)
  {
    id: "rec-aug-1",
    date: new Date(2026, 7, 28),
    shiftName: "Ca Sáng",
    workingBranch: "HMK Nguyễn Trãi",
    scheduledStartTime: "08:00",
    scheduledEndTime: "15:00",
    checkIn: "08:00",
    checkOut: "15:00",
    standardWorkHours: 7.0,
    actualWorkHours: 7.0,
  },
  {
    id: "rec-aug-2",
    date: new Date(2026, 7, 29),
    shiftName: "Ca Chiều",
    workingBranch: "HMK Cầu Giấy",
    scheduledStartTime: "15:00",
    scheduledEndTime: "22:00",
    checkIn: "15:02",
    checkOut: "22:00",
    standardWorkHours: 7.0,
    actualWorkHours: 6.97,
  },
];

// Helper to calculate actual shift duration (elapsed time between in and out punches)
export function calculateElapsedDuration(
  inTime?: string | null,
  outTime?: string | null,
  isOvernight?: boolean
): number | null {
  if (!inTime || !outTime || inTime === "--" || outTime === "--") return null;
  const partsIn = inTime.split(":").map(Number);
  const partsOut = outTime.split(":").map(Number);
  if (partsIn.length < 2 || partsOut.length < 2) return null;
  const [inH, inM] = partsIn;
  const [outH, outM] = partsOut;
  if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return null;

  const inTotal = inH * 60 + inM;
  let outTotal = outH * 60 + outM;

  // Handle overnight shift crossing midnight safely (never produce negative duration)
  if (isOvernight || outTotal < inTotal) {
    if (inH >= 18 && outH <= 12) {
      outTotal += 24 * 60;
    } else if (outTotal < inTotal) {
      return 0;
    }
  }

  const durationHours = (outTotal - inTotal) / 60;
  return Number(Math.max(0, durationHours).toFixed(2));
}

// Helper to parse check-in time for ASC sorting within a date
function parseCheckInMinutes(timeStr?: string | null): number {
  if (!timeStr || timeStr === "--") return 9999;
  const parts = timeStr.split(":");
  if (parts.length < 2) return 9999;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  return isNaN(h) || isNaN(m) ? 9999 : h * 60 + m;
}

export default function Timesheet() {
  const navigate = useNavigate();
  const { attendanceSessions } = useApp();

  // Current Month State (defaults to current date, September 2026)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 8, 10));

  // Modal States
  const [selectedRecord, setSelectedRecord] = useState<AttendanceHistoryRecord | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Filter States
  const [filterShiftNames, setFilterShiftNames] = useState<string[]>([]);
  const [filterBranches, setFilterBranches] = useState<string[]>([]);
  const [durationRangeKey, setDurationRangeKey] = useState<string>("all");
  const [workHoursRangeKey, setWorkHoursRangeKey] = useState<string>("all");

  // Merge any completed sessions from AppContext with baseAttendanceHistory
  const allHistoryRecords = useMemo(() => {
    const list = [...baseAttendanceHistory];

    // Check attendanceSessions for any completed session in the active context
    attendanceSessions.forEach((sess) => {
      if (sess.status === "completed" && sess.checkInTime && sess.checkOutTime) {
        const inStr = format(sess.checkInTime, "HH:mm");
        const outStr = format(sess.checkOutTime, "HH:mm");
        const exists = list.some(
          (r) =>
            r.date.toDateString() === sess.date.toDateString() &&
            r.shiftName === sess.shiftName &&
            r.checkIn === inStr
        );
        if (!exists) {
          list.push({
            id: `session_${sess.id}`,
            date: sess.date,
            shiftName: sess.shiftName,
            workingBranch: sess.storeName || "HMK Nguyễn Trãi",
            scheduledStartTime: sess.timeStr?.split("-")[0]?.trim() || inStr,
            scheduledEndTime: sess.timeStr?.split("-")[1]?.trim() || outStr,
            checkIn: inStr,
            checkOut: outStr,
            standardWorkHours: sess.hours || 0,
            actualWorkHours: sess.hours || 0,
          });
        }
      }
    });

    return list;
  }, [attendanceSessions]);

  // Current month's records before filter
  const currentMonthRecords = useMemo(() => {
    return allHistoryRecords.filter(
      (r) =>
        r.date.getFullYear() === currentMonth.getFullYear() &&
        r.date.getMonth() === currentMonth.getMonth()
    );
  }, [allHistoryRecords, currentMonth]);

  // Extract available unique shift names and working branches for the current month
  const availableShiftNames = useMemo(() => {
    const set = new Set<string>();
    currentMonthRecords.forEach((r) => set.add(r.shiftName));
    return Array.from(set);
  }, [currentMonthRecords]);

  const availableBranches = useMemo(() => {
    const set = new Set<string>();
    currentMonthRecords.forEach((r) => set.add(r.workingBranch));
    return Array.from(set);
  }, [currentMonthRecords]);

  // Summary Hours (Standard Work Hours & Actual Work Hours for the month)
  const totalStandardHours = useMemo(() => {
    return currentMonthRecords.reduce((sum, r) => sum + r.standardWorkHours, 0);
  }, [currentMonthRecords]);

  const totalActualHours = useMemo(() => {
    return currentMonthRecords.reduce((sum, r) => sum + r.actualWorkHours, 0);
  }, [currentMonthRecords]);

  // Range matcher helpers
  const matchesRange = (val: number, key: string) => {
    switch (key) {
      case "under_2":
        return val < 2;
      case "2_to_4":
        return val >= 2 && val < 4;
      case "4_to_6":
        return val >= 4 && val < 6;
      case "6_to_8":
        return val >= 6 && val < 8;
      case "above_8":
        return val >= 8;
      default:
        return true;
    }
  };

  // Filtered Records (Combines using AND across groups, OR within multi-select group)
  const filteredRecords = useMemo(() => {
    return currentMonthRecords.filter((record) => {
      // 1. Shift Name (OR within group)
      if (filterShiftNames.length > 0 && !filterShiftNames.includes(record.shiftName)) {
        return false;
      }

      // 2. Working Branch (OR within group)
      if (filterBranches.length > 0 && !filterBranches.includes(record.workingBranch)) {
        return false;
      }

      // 3. Actual Shift Duration (Check-out - Check-in)
      if (durationRangeKey !== "all") {
        const duration = calculateElapsedDuration(
          record.checkIn,
          record.checkOut,
          record.isOvernight
        );
        if (duration === null || !matchesRange(duration, durationRangeKey)) {
          return false;
        }
      }

      // 4. Actual Work Hours (Calculated Work Hours)
      if (workHoursRangeKey !== "all") {
        if (!matchesRange(record.actualWorkHours, workHoursRangeKey)) {
          return false;
        }
      }

      return true;
    });
  }, [currentMonthRecords, filterShiftNames, filterBranches, durationRangeKey, workHoursRangeKey]);

  // Date Grouping & Sorting:
  // Date DESC (newest date first)
  // Inside each date group: Check-in Time ASC (earliest check-in first)
  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: { date: Date; records: AttendanceHistoryRecord[] } } = {};

    filteredRecords.forEach((record) => {
      const key = format(record.date, "yyyy-MM-dd");
      if (!groups[key]) {
        groups[key] = {
          date: record.date,
          records: [],
        };
      }
      groups[key].records.push(record);
    });

    // Sort dates DESC
    const sortedDateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    // For each date, sort records by Check-in ASC
    sortedDateKeys.forEach((key) => {
      groups[key].records.sort(
        (a, b) => parseCheckInMinutes(a.checkIn) - parseCheckInMinutes(b.checkIn)
      );
    });

    return sortedDateKeys.map((key) => groups[key]);
  }, [filteredRecords]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterShiftNames.length > 0) count++;
    if (filterBranches.length > 0) count++;
    if (durationRangeKey !== "all") count++;
    if (workHoursRangeKey !== "all") count++;
    return count;
  }, [filterShiftNames, filterBranches, durationRangeKey, workHoursRangeKey]);

  const isFilterActive = activeFilterCount > 0;

  const handleResetFilters = () => {
    setFilterShiftNames([]);
    setFilterBranches([]);
    setDurationRangeKey("all");
    setWorkHoursRangeKey("all");
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  // Difference calculation for bottom sheet
  const selectedDifference = useMemo(() => {
    if (!selectedRecord) return 0;
    return Number(
      (selectedRecord.actualWorkHours - selectedRecord.standardWorkHours).toFixed(2)
    );
  }, [selectedRecord]);

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] min-h-screen relative pb-20 overflow-y-auto">
      {/* Top App Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-40 flex items-center justify-between shadow-2xs">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-base font-bold text-slate-900 font-sans tracking-tight">
          Lịch sử chấm công
        </h1>
        <div className="w-8"></div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Month Selector */}
        <div className="bg-white rounded-2xl p-2.5 shadow-2xs border border-slate-100 flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            title="Tháng trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 capitalize">
            <CalendarIcon className="w-4 h-4 text-[#558BAD]" />
            <span>
              {format(currentMonth, "'Tháng' M/yyyy", { locale: vi })}
            </span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            title="Tháng sau"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Section 2: Top Summary Cards - Công chuẩn & Công thực tế */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Công chuẩn */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2.5 opacity-5">
              <CalendarIcon className="w-10 h-10 text-slate-900" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Công chuẩn
            </p>
            <p className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {totalStandardHours.toFixed(1)}h
            </p>
          </div>

          {/* Card 2: Công thực tế */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2.5 opacity-10">
              <Clock className="w-10 h-10 text-[#558BAD]" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Công thực tế
            </p>
            <p className="text-2xl font-bold font-mono text-[#558BAD] tracking-tight">
              {totalActualHours.toFixed(1)}h
            </p>
          </div>
        </div>

        {/* Section 8: Header row with Filter Button */}
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Chi tiết theo ngày
          </h2>

          <button
            onClick={() => setShowFilterModal(true)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
              isFilterActive
                ? "bg-[#558BAD]/10 text-[#558BAD] border-[#558BAD] shadow-2xs"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Bộ lọc</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#558BAD] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Section 14: Empty State if filter returns no records */}
        {groupedByDate.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center my-4 shadow-2xs flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <SearchX className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Không tìm thấy dữ liệu chấm công
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mb-4">
              Không có ca làm việc phù hợp với bộ lọc hiện tại.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-[#558BAD] text-white text-xs font-bold rounded-xl hover:bg-[#416C87] transition-colors cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          /* Section 3, 4, 5, 15: Attendance Record List Grouped by Date DESC, Check-in ASC */
          <div className="space-y-4">
            {groupedByDate.map((group) => (
              <div key={format(group.date, "yyyy-MM-dd")} className="space-y-2">
                {/* Date Group Heading */}
                <div className="px-1 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 tracking-wide font-mono">
                    {format(group.date, "dd/MM/yyyy")}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {format(group.date, "EEEE", { locale: vi })}
                  </span>
                </div>

                {/* Shift cards under this date */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs overflow-hidden divide-y divide-slate-100">
                  {group.records.map((record) => (
                    <div
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      className="p-3.5 hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {/* Top: Shift Name (up to 2 lines) & Working Branch */}
                      <div className="mb-1.5">
                        <h4 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                          {record.shiftName}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#558BAD] shrink-0" />
                          <span className="truncate">{record.workingBranch}</span>
                        </div>
                      </div>

                      {/* Bottom line: In/Out Punches and Actual Work Hours (No status badge!) */}
                      <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                          <span>
                            In:{" "}
                            <span className="font-mono font-bold text-slate-900">
                              {record.checkIn || "--"}
                            </span>
                          </span>
                          <span className="text-slate-300">|</span>
                          <span>
                            Out:{" "}
                            <span className="font-mono font-bold text-slate-900">
                              {record.checkOut || "--"}
                            </span>
                          </span>
                        </div>
                        <div>
                          <span className="font-mono font-bold text-sm text-[#558BAD]">
                            {record.actualWorkHours}h
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* SECTION 6 & 7: SHIFT DETAIL BOTTOM SHEET */}
      {/* ==================================================== */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center p-0"
            onClick={() => setSelectedRecord(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              {/* Drag Pill */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 shrink-0"></div>

              {/* Title & Date (No Status Badge) */}
              <div className="mb-5 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  Chi tiết ca làm việc
                </h3>
                <p className="text-xs font-semibold text-slate-500 capitalize mt-0.5">
                  {format(selectedRecord.date, "EEEE, dd/MM/yyyy", { locale: vi })}
                </p>
              </div>

              {/* Shift Details Content */}
              <div className="space-y-4 mb-6">
                {/* 6.2 Tên ca */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    Tên ca
                  </p>
                  <p className="text-sm font-bold text-slate-900 leading-snug">
                    {selectedRecord.shiftName}
                  </p>
                </div>

                {/* 6.3 Chi nhánh làm việc */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    Chi nhánh làm việc
                  </p>
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#558BAD] shrink-0" />
                    <span>{selectedRecord.workingBranch}</span>
                  </p>
                </div>

                {/* 6.4 Thời gian ca tiêu chuẩn */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    Thời gian ca tiêu chuẩn
                  </p>
                  <p className="text-sm font-bold text-slate-900 font-mono">
                    {selectedRecord.scheduledStartTime} - {selectedRecord.scheduledEndTime}
                  </p>
                </div>

                {/* 6.5 Actual Check-in / Check-out Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                      <div className="w-2 h-2 rounded-full bg-[#558BAD]"></div>
                      <span>Check-in</span>
                    </div>
                    <p className="font-mono text-lg font-bold text-slate-900">
                      {selectedRecord.checkIn || "--:--"}
                    </p>
                  </div>
                  <div className="w-px bg-slate-200"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                      <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                      <span>Check-out</span>
                    </div>
                    <p className="font-mono text-lg font-bold text-slate-900">
                      {selectedRecord.checkOut || "--:--"}
                    </p>
                  </div>
                </div>

                {/* 6.6 & 6.7 Phân tích giờ công & Chênh lệch */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs border-dashed">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Phân tích giờ công
                  </h4>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">
                        Giờ công tiêu chuẩn
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {selectedRecord.standardWorkHours}h
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">
                        Giờ công thực tế
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {selectedRecord.actualWorkHours}h
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                      <span className="font-bold text-slate-800">
                        Chênh lệch
                      </span>
                      <span
                        className={cn(
                          "font-mono font-bold",
                          selectedDifference > 0
                            ? "text-emerald-600"
                            : selectedDifference < 0
                            ? "text-rose-600"
                            : "text-slate-700"
                        )}
                      >
                        {selectedDifference > 0
                          ? `+${selectedDifference}h`
                          : `${selectedDifference}h`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-all cursor-pointer"
              >
                Đóng
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* SECTION 9: FILTER BOTTOM SHEET */}
      {/* ==================================================== */}
      <AnimatePresence>
        {showFilterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center p-0"
            onClick={() => setShowFilterModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              {/* Drag Pill */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 shrink-0"></div>

              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Bộ lọc lịch sử chấm công
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Tùy chỉnh điều kiện tìm kiếm ca làm việc
                  </p>
                </div>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5 flex-1 overflow-y-auto pb-4">
                {/* 9.1 Tên ca (Multi-select) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Tên ca
                    </label>
                    {filterShiftNames.length > 0 && (
                      <span className="text-[11px] font-bold text-[#558BAD]">
                        Đã chọn ({filterShiftNames.length})
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableShiftNames.map((name) => {
                      const selected = filterShiftNames.includes(name);
                      return (
                        <button
                          key={name}
                          onClick={() => {
                            setFilterShiftNames((prev) =>
                              selected
                                ? prev.filter((s) => s !== name)
                                : [...prev, name]
                            );
                          }}
                          className={cn(
                            "px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5",
                            selected
                              ? "bg-[#558BAD] text-white border-[#558BAD] shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                          )}
                        >
                          {selected && <Check className="w-3 h-3" />}
                          <span>{name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 9.2 Chi nhánh làm việc (Multi-select) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Chi nhánh làm việc
                    </label>
                    {filterBranches.length > 0 && (
                      <span className="text-[11px] font-bold text-[#558BAD]">
                        Đã chọn ({filterBranches.length})
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableBranches.map((branch) => {
                      const selected = filterBranches.includes(branch);
                      return (
                        <button
                          key={branch}
                          onClick={() => {
                            setFilterBranches((prev) =>
                              selected
                                ? prev.filter((b) => b !== branch)
                                : [...prev, branch]
                            );
                          }}
                          className={cn(
                            "px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5",
                            selected
                              ? "bg-[#558BAD] text-white border-[#558BAD] shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                          )}
                        >
                          {selected && <Check className="w-3 h-3" />}
                          <MapPin className="w-3 h-3 opacity-70" />
                          <span>{branch}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 9.3 Thời lượng ca thực tế (Elapsed duration: Check-out - Check-in) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Thời lượng ca thực tế (Punch In → Out)
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: "all", label: "Tất cả" },
                      { key: "under_2", label: "< 2 giờ" },
                      { key: "2_to_4", label: "2 - < 4h" },
                      { key: "4_to_6", label: "4 - < 6h" },
                      { key: "6_to_8", label: "6 - < 8h" },
                      { key: "above_8", label: "≥ 8 giờ" },
                    ].map((item) => {
                      const selected = durationRangeKey === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => setDurationRangeKey(item.key)}
                          className={cn(
                            "py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center",
                            selected
                              ? "bg-[#558BAD] text-white border-[#558BAD] shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                          )}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 9.4 Giờ công thực tế (Calculated Work Hours) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Giờ công thực tế (Calculated Hours)
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: "all", label: "Tất cả" },
                      { key: "under_2", label: "< 2 giờ" },
                      { key: "2_to_4", label: "2 - < 4h" },
                      { key: "4_to_6", label: "4 - < 6h" },
                      { key: "6_to_8", label: "6 - < 8h" },
                      { key: "above_8", label: "≥ 8 giờ" },
                    ].map((item) => {
                      const selected = workHoursRangeKey === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => setWorkHoursRangeKey(item.key)}
                          className={cn(
                            "py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center",
                            selected
                              ? "bg-[#558BAD] text-white border-[#558BAD] shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                          )}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 11: Filter Action Buttons */}
              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  onClick={handleResetFilters}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại</span>
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="flex-2 py-3 bg-[#558BAD] hover:bg-[#416C87] text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  Áp dụng {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
