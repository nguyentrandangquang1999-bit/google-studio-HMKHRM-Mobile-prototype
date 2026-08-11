import React, { useState } from "react";
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, subDays, addDays, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

// Dữ liệu mock: Lịch sử chấm công
const mockHistory = [
  {
    id: 1,
    date: new Date(),
    status: "present",
    shift: "Ca Sáng",
    in: "08:00",
    out: "15:05",
    baseHours: 7,
    otHours: 0,
    note: "Đúng giờ",
  },
  {
    id: 2,
    date: subDays(new Date(), 1),
    status: "late-resolved",
    shift: "Ca Tối",
    in: "15:15",
    out: "22:30",
    baseHours: 6.75,
    otHours: 0,
    note: "Đi trễ 15p",
    resolveNote: "Đã duyệt: Trừ UT 15p, Phạt 50,000đ",
  },
  {
    id: 3,
    date: subDays(new Date(), 2),
    status: "exception-resolved",
    shift: "Ca Sáng",
    in: "08:00",
    out: "16:00",
    baseHours: 7,
    otHours: 1,
    note: "Làm thêm giờ",
    resolveNote: "Đã duyệt OT: Quản lý xác nhận làm thêm",
  },
  {
    id: 4,
    date: subDays(new Date(), 3),
    status: "exception-resolved-waived",
    shift: "Ca Sáng",
    in: "08:00",
    out: "15:00",
    baseHours: 7,
    otHours: 0,
    note: "Quên check-in",
    resolveNote: "Đã duyệt: Lý do khách quan - Miễn trừ phạt",
  },
  {
    id: 5,
    date: subDays(new Date(), 4),
    status: "missing",
    shift: "Ca Sáng",
    in: null,
    out: null,
    baseHours: 0,
    otHours: 0,
    note: "Nghỉ không phép",
  },
];

export default function Timesheet() {
  const navigate = useNavigate();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "present":
        return {
          label: "Hợp lệ",
          color: "text-green-700",
          bg: "bg-green-100",
          icon: CheckCircle2,
        };
      case "late":
        return {
          label: "Đi trễ",
          color: "text-amber-700",
          bg: "bg-amber-100",
          icon: Clock,
        };
      case "late-resolved":
        return {
          label: "Đã xử lý trễ",
          color: "text-orange-700",
          bg: "bg-orange-100",
          icon: AlertTriangle,
        };
      case "exception":
        return {
          label: "Ngoại lệ",
          color: "text-blue-600",
          bg: "bg-blue-50",
          icon: AlertTriangle,
        };
      case "exception-resolved":
        return {
          label: "OT đã duyệt",
          color: "text-primary",
          bg: "bg-primary/10",
          icon: CheckCircle2,
        };
      case "exception-resolved-waived":
        return {
          label: "Hợp lệ hóa",
          color: "text-indigo-700",
          bg: "bg-indigo-100",
          icon: CheckCircle2,
        };
      case "missing":
        return {
          label: "Vắng",
          color: "text-red-700",
          bg: "bg-red-100",
          icon: XCircle,
        };
      default:
        return {
          label: "Unknown",
          color: "text-gray-500",
          bg: "bg-gray-100",
          icon: Clock,
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen relative pb-20 overflow-y-auto">
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-text-main font-sans">
          Lịch sử chấm công
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="p-4 space-y-4">
        {/* Month Selector */}
        <div className="bg-white rounded-md p-3 shadow-sm border border-gray-100 flex items-center justify-between">
          <button className="p-2 text-gray-400 hover:text-gray-800">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 font-bold text-text-main">
            <CalendarIcon className="w-4 h-4 text-primary" /> Tháng 10/2023
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-800">
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
        </div>

        {/* Bảng công tổng quan */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <CheckCircle2 className="w-8 h-8 text-success/10" />
            </div>
            <p className="text-xs font-semibold text-gray-500 mb-1">
              Công chuẩn
            </p>
            <p className="text-xl font-bold font-mono text-primary tracking-tight">
              185h
            </p>
          </div>
          <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <Clock className="w-8 h-8 text-primary/10" />
            </div>
            <p className="text-xs font-semibold text-gray-500 mb-1">
              Tăng ca (OT)
            </p>
            <p className="text-xl font-bold font-mono text-success tracking-tight">
              20h
            </p>
          </div>
        </div>

        {/* List of records */}
        <div className="mb-2">
          <h2 className="text-sm font-bold text-text-main mb-3">
            Chi tiết theo ngày
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {mockHistory.map((record, idx) => {
              const statusConfig = getStatusConfig(record.status);
              const StatusIcon = statusConfig.icon;
              return (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className="p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-text-main">
                        {record.date instanceof Date ? format(record.date, "dd/MM/yyyy") : ""}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {record.shift}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center text-[10px] font-bold px-2 py-0.5 rounded",
                        statusConfig.bg,
                        statusConfig.color,
                      )}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />{" "}
                      {statusConfig.label}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-gray-400 mr-1 font-medium">
                          In:
                        </span>
                        <span className="font-mono font-bold text-text-main">
                          {record.in || "--:--"}
                        </span>
                      </div>
                      <div className="w-px h-3 bg-gray-200"></div>
                      <div>
                        <span className="text-gray-400 mr-1 font-medium">
                          Out:
                        </span>
                        <span className="font-mono font-bold text-text-main">
                          {record.out || "--:--"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="font-mono font-bold text-primary">
                        {record.baseHours + record.otHours}h
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Chi tiết */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center"
            onClick={() => setSelectedRecord(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-t-xl p-5 pb-safe"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5 shrink-0"></div>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-text-main">
                    Chi tiết ca làm việc
                  </h3>
                  <p className="text-sm font-medium text-text-muted mt-0.5">
                    {selectedRecord.date instanceof Date ? format(selectedRecord.date, "EEEE, dd/MM/yyyy", {
                      locale: vi,
                    }) : ""}
                  </p>
                </div>
                {(() => {
                  const conf = getStatusConfig(selectedRecord.status);
                  const Icon = conf.icon;
                  return (
                    <span
                      className={cn(
                        "px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1",
                        conf.bg,
                        conf.color,
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" /> {conf.label}
                    </span>
                  );
                })()}
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 border border-gray-100 rounded-md p-4 flex gap-4">
                  <div className="flex-1 relative">
                    <div className="w-2 h-2 rounded-full bg-primary absolute -left-2.5 top-1.5"></div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Check-in
                    </p>
                    <p className="font-mono text-lg font-bold text-text-main">
                      {selectedRecord.in || "--:--"}
                    </p>
                    {selectedRecord.status === "late" && (
                      <span className="text-[10px] text-error font-medium">
                        Trễ 15p
                      </span>
                    )}
                  </div>
                  <div className="w-px bg-gray-200"></div>
                  <div className="flex-1 relative">
                    <div className="w-2 h-2 rounded-full bg-gray-800 absolute -left-2.5 top-1.5"></div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Check-out
                    </p>
                    <p className="font-mono text-lg font-bold text-text-main">
                      {selectedRecord.out || "--:--"}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-md p-4 shadow-sm border-dashed">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                    Phân tích giờ công
                  </h4>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-text-main">
                      Giờ công tiêu chuẩn (Base)
                    </span>
                    <span className="font-mono font-bold text-text-main">
                      {selectedRecord.baseHours}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-text-main">
                      Làm thêm (OT)
                    </span>
                    <span className="font-mono font-bold text-primary">
                      {selectedRecord.otHours}h
                    </span>
                  </div>
                  {selectedRecord.note && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">
                        Ghi chú hệ thống:
                      </span>
                      <span className="text-sm font-medium text-text-main">
                        "{selectedRecord.note}"
                      </span>
                    </div>
                  )}
                  {selectedRecord.resolveNote && (
                    <div className="mt-3 pt-3 border-t border-blue-100 bg-blue-50/50 -mx-4 px-4 pb-1">
                      <span className="text-xs text-blue-600 font-bold block mb-1 uppercase tracking-wider">
                        Kết quả xử lý từ Quản lý:
                      </span>
                      <span className="text-sm font-bold text-gray-800 leading-relaxed block mb-2">
                        {selectedRecord.resolveNote}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-text-main font-bold rounded-md transition-all"
              >
                Đóng
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
