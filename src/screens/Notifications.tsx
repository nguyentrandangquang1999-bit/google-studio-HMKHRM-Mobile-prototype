import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CheckSquare,
  FileText,
  CheckCircle2,
  Circle,
  Megaphone,
  BellRing,
  X,
  CheckCircle,
  SlidersHorizontal,
  Calendar,
  RotateCcw,
  Check,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, AttendanceTicket } from "@/context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import NotificationQaSwitcher from "@/components/NotificationQaSwitcher";
import { QaScenario } from "@/types/qaNotification";

type NotificationType = "system" | "task" | "approval" | "briefing";
export type QuickFilterTab = "all" | "action_needed" | "unread";

export type NotificationTypeFilter = "ALL" | "TICKET" | "SHIFT" | "SHIFT_BRIEFING" | "SYSTEM";
export type ProcessingStatusFilter = "ALL" | "ACTION_NEEDED" | "PROCESSED";
export type ReadStatusFilter = "ALL" | "UNREAD" | "READ";
export type TimeFilter = "ALL" | "TODAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "CUSTOM";

export interface AdvancedFilterState {
  type: NotificationTypeFilter;
  processingStatus: ProcessingStatusFilter;
  readStatus: ReadStatusFilter;
  time: TimeFilter;
  customStartDate?: string;
  customEndDate?: string;
}

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilterState = {
  type: "ALL",
  processingStatus: "ALL",
  readStatus: "ALL",
  time: "ALL",
};

export type NotificationGroup = "TICKET" | "SHIFT" | "SHIFT_BRIEFING";

interface NotificationProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  navigateUrl?: string;
  isUrgent?: boolean;
  isAcknowledged?: boolean;
  storeName?: string;
  // Contextual Navigation
  notificationGroup?: NotificationGroup;
  ticketId?: string;
  shiftId?: string;
  briefingId?: string;
  shiftDate?: string;
}

const mockNotifications: NotificationProps[] = [
  {
    id: "lr-noti-1",
    type: "approval",
    title: "Đơn nghỉ phép đã được gửi",
    message: "Đơn nghỉ phép của bạn đã được hệ thống ghi nhận. Phản hồi sẽ sớm được cập nhật.",
    time: "2 giờ trước",
    isRead: false,
    notificationGroup: "TICKET",
    ticketId: "LR-001",
  },
  {
    id: "lr-noti-2",
    type: "approval",
    title: "Đơn nghỉ phép LR-002 đã được duyệt",
    message: "Đơn nghỉ phép tuần trước của bạn đã được duyệt.",
    time: "1 ngày trước",
    isRead: true,
    notificationGroup: "TICKET",
    ticketId: "LR-002",
  },
  {
    id: "lr-noti-3",
    type: "approval",
    title: "Đơn nghỉ phép LR-003 đã bị từ chối",
    message: "Đơn nghỉ phép của bạn bị từ chối. Lý do: Cửa hàng đang thiếu nhân sự trong ca này.",
    time: "2 ngày trước",
    isRead: true,
    notificationGroup: "TICKET",
    ticketId: "LR-003",
  },
  {
    id: "app-1",
    type: "approval",
    title: "Cần xử lý: Bổ sung Check-out",
    message:
      "Ticket của bạn (Ca Sáng, 30/07) chưa có dữ liệu check-out. Vui lòng kiểm tra và xử lý bổ sung công.",
    time: "2 phút trước",
    isRead: false,
    notificationGroup: "TICKET",
    ticketId: "TK-OUT-032",
  },
  {
    id: "app-2",
    type: "approval",
    title: "Cần xử lý: Bổ sung Check-in",
    message:
      "Hệ thống không ghi nhận giờ Check-in ca sáng (21/05). Vui lòng xử lý giải trình.",
    time: "10 phút trước",
    isRead: false,
    notificationGroup: "TICKET",
    ticketId: "TK-IN-017",
  },
  {
    id: "ns-1",
    type: "system",
    title: "Ca làm việc đã bị tước (No-show)",
    message:
      "Quản lý đã Handshake thay thế nhân sự cho Ca Chiều (Hôm nay) do bạn No-show quá hạn. Ca này đã bị Hủy trong Lịch làm việc của bạn.",
    time: "Vài giây trước",
    isRead: false,
    notificationGroup: "SHIFT",
    shiftId: "case_cancelled_today",
  },
  {
    id: "sys-1",
    type: "system",
    title: "Tự động gọt giờ (Smart Overlap)",
    message:
      "[Xung đột Lịch] Hệ thống tự động cấn trừ 30 phút (Travel Time) ca Sáng do bạn có ca Tối liền kề lúc 15:00 tại Cầu Giấy.",
    time: "5 phút trước",
    isRead: false,
    notificationGroup: "SHIFT",
    shiftId: "case_approved_today",
  },
  {
    id: "sys-2",
    type: "system",
    title: "Phân công khẩn cấp (Chi viện Vận hành)",
    message:
      "Bạn được phân công vào ca làm việc tại HMK Cầu Giấy. Vui lòng kiểm tra chi tiết trong Lịch cá nhân.",
    time: "20 phút trước",
    isRead: false,
    notificationGroup: "SHIFT",
    shiftId: "case_approved_cg_today",
  },
  {
    id: "0",
    type: "system",
    title: "Lịch làm việc ca mới đã được xếp!",
    message:
      "Bạn có ca làm việc tại HMK Nguyễn Trãi (Ca Sáng). Vui lòng kiểm tra Lịch cá nhân.",
    time: "1 giờ trước",
    isRead: false,
    notificationGroup: "SHIFT",
    shiftId: "case_approved_today",
  },
  {
    id: "1",
    type: "system",
    title: "Thông báo hệ thống",
    message: "Hệ thống sẽ bảo trì từ 23:00 đến 02:00 sáng mai.",
    time: "10 phút trước",
    isRead: false,
  },
  {
    id: "2",
    type: "task",
    title: "Bạn được giao công việc mới",
    message: "Set up quầy kệ trưng bày sản phẩm mới. Hạn chót: 15:00 hôm nay.",
    time: "1 giờ trước",
    isRead: false,
  },
  {
    id: "3",
    type: "approval",
    title: "Yêu cầu đổi ca được gửi",
    message: "Yêu cầu đổi ca cho Ca Chiều đã được gửi đến quản lý.",
    time: "2 giờ trước",
    isRead: true,
    notificationGroup: "TICKET",
    ticketId: "RQ-SWAP-05",
  },
  {
    id: "4",
    type: "system",
    title: "Chính sách mới",
    message: "Vui lòng đọc và xác nhận chính sách đi trễ/về sớm mới cập nhật.",
    time: "Hôm qua",
    isRead: true,
  },
  {
    id: "5",
    type: "task",
    title: "Công việc sắp đến hạn",
    message: 'Công việc "kiểm kho cuối ngày" còn 30 phút nữa đến hạn.',
    time: "Hôm qua",
    isRead: true,
  },
  {
    id: "6",
    type: "approval",
    title: "Chờ duyệt đổi ca",
    message:
      "Nhân viên Minh Tuấn muốn đổi ca Chờ xác nhận của bạn. Xem trong tab Xử lý.",
    time: "2 ngày trước",
    isRead: true,
    notificationGroup: "TICKET",
    ticketId: "RQ-SWAP-02",
  },
];

export default function Notifications() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    briefings,
    markBriefingAsRead,
    acknowledgeBriefing,
    availableShifts,
    setAvailableShifts,
    leaveRequests,
    setLeaveRequests,
    attendanceTickets,
    setAttendanceTickets,
    setBriefings,
    qaNotificationScenario,
    setQaNotificationScenario,
    qaDiagnosticResult,
    setQaDiagnosticResult,
  } = useApp();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);
  
  const initialTab = searchParams.get("tab") as QuickFilterTab | null;
  const [activeTab, setActiveTab] = useState<QuickFilterTab>(
    initialTab && ["all", "action_needed", "unread"].includes(initialTab) ? initialTab : "all"
  );
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilterState>(DEFAULT_ADVANCED_FILTERS);
  const [tempFilters, setTempFilters] = useState<AdvancedFilterState>(DEFAULT_ADVANCED_FILTERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMarkAllConfirm, setShowMarkAllConfirm] = useState(false);

  const [localNotifications, setLocalNotifications] = useState(mockNotifications);

  const [selectedBriefingId, setSelectedBriefingId] = useState<string | null>(searchParams.get("id"));

  useEffect(() => {
    if (selectedBriefingId) {
      const b = briefings.find(b => b.id === selectedBriefingId);
      if (b && !b.isRead) {
        markBriefingAsRead(b.id);
      }
    }
  }, [selectedBriefingId]);

  const handleApplyScenario = (scenario: QaScenario) => {
    setSearchParams({});
    setSelectedBriefingId(null);
    setQaNotificationScenario(scenario);
    setQaDiagnosticResult(null);

    switch (scenario.id) {
      case "QA-01": {
        setAttendanceTickets((prev) => prev.filter((t) => t.id !== "TK-OUT-032"));
        const seededNoti: NotificationProps = {
          id: "noti-qa-01",
          type: "approval",
          title: "Cần xử lý: Bổ sung Check-out",
          message: "Ticket của bạn (Ca Sáng, 30/07) chưa có dữ liệu check-out. Vui lòng kiểm tra và xử lý bổ sung công.",
          time: "Vừa xong",
          isRead: false,
          notificationGroup: "TICKET",
          ticketId: "TK-OUT-032",
        };
        setLocalNotifications([seededNoti, ...mockNotifications.filter((n) => n.id !== "app-1")]);
        setActiveTab("all");
        break;
      }

      case "QA-02": {
        const seededNoti: NotificationProps = {
          id: "noti-qa-02",
          type: "approval",
          title: "Đơn nghỉ phép LR-002 đã được duyệt",
          message: "Đơn nghỉ phép tuần trước của bạn đã được duyệt bởi Quản lý.",
          time: "Vừa xong",
          isRead: false,
          notificationGroup: "TICKET",
          ticketId: "LR-002",
        };
        setLocalNotifications([seededNoti, ...mockNotifications.filter((n) => n.id !== "lr-noti-2")]);
        setActiveTab("all");
        break;
      }

      case "QA-03": {
        const submittedTicket: AttendanceTicket = {
          id: "TK-OUT-032",
          employeeId: "u1",
          type: "forgot_out",
          date: new Date(2026, 6, 30),
          reason: "Đã gửi giải trình bổ sung giờ ra ca 13:45",
          useAnnualLeaveIntent: false,
          relatedShift: {
            id: "shift_qa_03",
            shiftName: "Ca Sáng",
            timeStr: "08:00 - 15:00",
            storeName: "HMK Nguyễn Trãi",
            hours: 7,
          },
          actualTime: "13:45",
          submittedAt: new Date(),
          status: "PENDING",
          resolutionPath: null,
          linkedLeaveRequestId: null,
          isPeriodLocked: false,
        };
        setAttendanceTickets((prev) => [submittedTicket, ...prev.filter((t) => t.id !== "TK-OUT-032")]);
        const seededNoti: NotificationProps = {
          id: "noti-qa-03",
          type: "approval",
          title: "Cần xử lý: Bổ sung Check-out (Snapshot cũ)",
          message: "[Snapshot cũ lúc gửi] Ticket cần xử lý bổ sung Check-out ca 30/07.",
          time: "Vừa xong",
          isRead: false,
          notificationGroup: "TICKET",
          ticketId: "TK-OUT-032",
        };
        setLocalNotifications([seededNoti, ...mockNotifications.filter((n) => n.id !== "app-1")]);
        setActiveTab("all");
        break;
      }

      case "QA-04": {
        setAttendanceTickets((prev) => prev.filter((t) => t.id !== "TK-IN-017"));
        const seededNoti: NotificationProps = {
          id: "noti-qa-04",
          type: "approval",
          title: "Yêu cầu đã gửi (Snapshot cũ)",
          message: "[Snapshot cũ] Yêu cầu bổ sung Check-in đã được gửi đi.",
          time: "Vừa xong",
          isRead: false,
          notificationGroup: "TICKET",
          ticketId: "TK-IN-017",
        };
        setLocalNotifications([seededNoti, ...mockNotifications.filter((n) => n.id !== "app-2")]);
        setActiveTab("all");
        break;
      }

      case "QA-05": {
        setAttendanceTickets((prev) => prev.filter((t) => t.id !== "TK-MISSING-999"));
        const seededNoti: NotificationProps = {
          id: "noti-qa-05",
          type: "approval",
          title: "Cần xử lý: Ticket đã bị xóa / hủy",
          message: "Thông báo liên quan đến yêu cầu công việc TK-MISSING-999.",
          time: "Vừa xong",
          isRead: false,
          notificationGroup: "TICKET",
          ticketId: "TK-MISSING-999",
        };
        setLocalNotifications([seededNoti, ...mockNotifications]);
        setActiveTab("all");
        break;
      }

      case "QA-06": {
        const seededNoti: NotificationProps = {
          id: "noti-qa-06",
          type: "system",
          title: "Lịch làm việc ca mới đã được xếp!",
          message: "Bạn có ca làm việc tại HMK Nguyễn Trãi (Ca Sáng). Vui lòng kiểm tra Lịch cá nhân.",
          time: "Vừa xong",
          isRead: false,
          notificationGroup: "SHIFT",
          shiftId: "case_approved_today",
        };
        setLocalNotifications([seededNoti, ...mockNotifications]);
        setActiveTab("all");
        break;
      }

      case "QA-07": {
        const outsideShift: any = {
          id: "shift_outside_week_018",
          date: new Date(2026, 8, 18),
          title: "Ca Tối",
          timeStr: "15:00 - 22:00",
          storeName: "HMK Nguyễn Trãi",
          branchId: "br-nt",
          skillTag: "Bán hàng",
          status: "approved",
          requiredRole: "Nhân viên",
          hours: 7,
        };
        setAvailableShifts((prev) => [outsideShift, ...prev.filter((s) => s.id !== "shift_outside_week_018")]);
        const seededNoti: NotificationProps = {
          id: "noti-qa-07",
          type: "system",
          title: "Phân công ca làm việc ngày 18/09",
          message: "Bạn đã được phân công Ca Tối ngày 18/09/2026 tại HMK Nguyễn Trãi.",
          time: "Vừa xong",
          isRead: false,
          notificationGroup: "SHIFT",
          shiftId: "shift_outside_week_018",
        };
        setLocalNotifications([seededNoti, ...mockNotifications]);
        setActiveTab("all");
        break;
      }

      case "QA-08": {
        const seededNoti: NotificationProps = {
          id: "noti-qa-08",
          type: "system",
          title: "Ca làm việc đã bị tước (No-show)",
          message: "Quản lý đã Handshake thay thế nhân sự. Ca này đã bị Hủy trong Lịch làm việc.",
          time: "Vừa xong",
          isRead: false,
          notificationGroup: "SHIFT",
          shiftId: "case_cancelled_today",
        };
        setLocalNotifications([seededNoti, ...mockNotifications]);
        setActiveTab("all");
        break;
      }

      case "QA-09": {
        const changedShift: any = {
          id: "shift_status_changed_demo",
          date: new Date(),
          title: "Ca Chiều",
          timeStr: "13:00 - 20:00",
          storeName: "HMK Cầu Giấy",
          branchId: "br-cg",
          skillTag: "Bán hàng",
          status: "cancelled",
          cancelReason: "Quản lý điều động lại nhân sự cửa hàng",
          requiredRole: "Nhân viên",
          hours: 7,
        };
        setAvailableShifts((prev) => [changedShift, ...prev.filter((s) => s.id !== "shift_status_changed_demo")]);
        const seededNoti: NotificationProps = {
          id: "noti-qa-09",
          type: "system",
          title: "Thông báo ca làm việc mới: Ca Chiều hôm nay",
          message: "[Snapshot cũ lúc xếp] Bạn được xếp Ca Chiều tại HMK Cầu Giấy.",
          time: "Vừa xong",
          isRead: false,
          notificationGroup: "SHIFT",
          shiftId: "shift_status_changed_demo",
        };
        setLocalNotifications([seededNoti, ...mockNotifications]);
        setActiveTab("all");
        break;
      }

      case "QA-10": {
        setAvailableShifts((prev) => prev.filter((s) => s.id !== "SHIFT-MISSING-999"));
        const seededNoti: NotificationProps = {
          id: "noti-qa-10",
          type: "system",
          title: "Ca làm việc đã bị xóa khỏi hệ thống",
          message: "Thông tin ca làm việc SHIFT-MISSING-999.",
          time: "Vừa xong",
          isRead: false,
          notificationGroup: "SHIFT",
          shiftId: "SHIFT-MISSING-999",
        };
        setLocalNotifications([seededNoti, ...mockNotifications]);
        setActiveTab("all");
        break;
      }

      case "QA-11": {
        const shift101: any = {
          id: "SHIFT-101",
          date: new Date(),
          title: "Ca Sáng",
          timeStr: "08:00 - 15:00",
          storeName: "HMK Nguyễn Trãi",
          branchId: "br-nt",
          skillTag: "Bán hàng",
          status: "approved",
          requiredRole: "Nhân viên",
          hours: 7,
        };
        const shift102: any = {
          id: "SHIFT-102",
          date: new Date(),
          title: "Ca Sáng",
          timeStr: "08:00 - 15:00",
          storeName: "HMK Nguyễn Trãi",
          branchId: "br-nt",
          skillTag: "Bán hàng",
          status: "approved",
          requiredRole: "Nhân viên",
          hours: 7,
        };
        setAvailableShifts((prev) => [shift101, shift102, ...prev.filter((s) => s.id !== "SHIFT-101" && s.id !== "SHIFT-102")]);
        const seededNoti: NotificationProps = {
          id: "noti-qa-11",
          type: "system",
          title: "Phân công: Ca Sáng HMK Nguyễn Trãi (SHIFT-102)",
          message: "Kiểm tra định vị chính xác ca SHIFT-102 thay vì SHIFT-101 có cùng tên và giờ.",
          time: "Vừa xong",
          isRead: false,
          notificationGroup: "SHIFT",
          shiftId: "SHIFT-102",
        };
        setLocalNotifications([seededNoti, ...mockNotifications]);
        setActiveTab("all");
        break;
      }

      case "QA-12": {
        const urgentBriefing: any = {
          id: "briefing_qa_12",
          title: "Bản tin đầu ca: Ra mắt BST Kính Mát Mùa Thu",
          message: "Chi tiết quy trình tư vấn và chính sách bảo hành mới cho BST Thu 2026. Tất cả nhân sự trong ca cần đọc kỹ.",
          content: "Nội dung chi tiết về bộ sưu tập Kính Mát Mùa Thu 2026:\n1. Điểm nổi bật: Tròng kính phân cực chống tia UV400 chuẩn Châu Âu.\n2. Giá bán đề xuất: 550.000đ - 1.200.000đ.\n3. Quà tặng kèm: Hộp da cao cấp và khăn lau nano kháng khuẩn.",
          senderRole: "Quản lý cửa hàng",
          senderName: "Trần Anh Tuấn",
          sentAt: new Date().toISOString(),
          storeName: "HMK Nguyễn Trãi",
          isUrgent: true,
          isRead: false,
          isAcknowledged: false,
        };
        setBriefings((prev) => [urgentBriefing, ...prev.filter((b) => b.id !== "briefing_qa_12")]);
        setActiveTab("action_needed");
        break;
      }

      case "QA-13": {
        const ackBriefing: any = {
          id: "briefing_qa_13",
          title: "Bản tin an toàn: Hướng dẫn PCCC định kỳ",
          message: "Bản tin an toàn định kỳ đã được bạn đọc và xác nhận đầy đủ.",
          content: "Quy chuẩn an toàn PCCC tháng 9/2026:\n- Kiểm tra lối thoát hiểm tại cửa sau.\n- Bình chữa cháy CO2 đã được kiểm định đầy đủ.",
          senderRole: "Trưởng ca",
          senderName: "Lê Hoàng Yến",
          sentAt: new Date(Date.now() - 3600000).toISOString(),
          storeName: "HMK Nguyễn Trãi",
          isUrgent: false,
          isRead: true,
          isAcknowledged: true,
          acknowledgedAt: new Date(Date.now() - 1800000).toISOString(),
        };
        setBriefings((prev) => [ackBriefing, ...prev.filter((b) => b.id !== "briefing_qa_13")]);
        setActiveTab("all");
        break;
      }

      case "QA-14": {
        const unreadNoti: NotificationProps = {
          id: "noti-qa-14-unread",
          type: "approval",
          title: "Thông báo A (Chưa đọc): Bổ sung Check-out",
          message: "Thông báo chưa đọc có chấm đỏ. Thử bấm để kiểm tra điều hướng và tự động chuyển sang đã đọc.",
          time: "1 phút trước",
          isRead: false,
          notificationGroup: "TICKET",
          ticketId: "TK-OUT-032",
        };
        const readNoti: NotificationProps = {
          id: "noti-qa-14-read",
          type: "approval",
          title: "Thông báo B (Đã đọc): Bổ sung Check-out",
          message: "Thông báo đã đọc. Thử bấm để kiểm tra điều hướng đến cùng mục tiêu chính xác.",
          time: "1 giờ trước",
          isRead: true,
          notificationGroup: "TICKET",
          ticketId: "TK-OUT-032",
        };
        setLocalNotifications([unreadNoti, readNoti, ...mockNotifications]);
        setActiveTab("all");
        break;
      }

      case "QA-15": {
        const deepTickets: AttendanceTicket[] = [];
        for (let i = 1; i <= 9; i++) {
          deepTickets.push({
            id: `TK-DUMMY-${i}`,
            employeeId: "u1",
            type: "missing_both",
            date: new Date(2026, 7, i),
            reason: `Thẻ đệm danh sách số ${i}`,
            useAnnualLeaveIntent: false,
            relatedShift: { id: `s-d-${i}`, shiftName: `Ca Sáng ${i}`, timeStr: "08:00 - 15:00", storeName: "HMK", hours: 7 },
            submittedAt: new Date(2026, 7, i),
            status: "PENDING",
            resolutionPath: null,
            linkedLeaveRequestId: null,
            isPeriodLocked: false,
          });
        }
        deepTickets.push({
          id: "TK-DEEP-LIST-015",
          employeeId: "u1",
          type: "missing_both",
          date: new Date(2026, 7, 10),
          reason: "Thẻ mục tiêu nằm sâu ở cuối danh sách (Thẻ thứ 10)",
          useAnnualLeaveIntent: false,
          relatedShift: { id: "s-deep", shiftName: "Ca Chiều", timeStr: "15:00 - 22:00", storeName: "HMK Nguyễn Trãi", hours: 7 },
          submittedAt: new Date(2026, 7, 10),
          status: "PENDING",
          resolutionPath: null,
          linkedLeaveRequestId: null,
          isPeriodLocked: false,
        });
        setAttendanceTickets(deepTickets);
        const seededNoti: NotificationProps = {
          id: "noti-qa-15",
          type: "approval",
          title: "Cần xử lý: Thẻ nằm sâu trong danh sách",
          message: "Mục tiêu TK-DEEP-LIST-015 nằm ở vị trí thứ 10. Thử bấm để kiểm tra tính năng auto-scroll.",
          time: "Vừa xong",
          isRead: false,
          notificationGroup: "TICKET",
          ticketId: "TK-DEEP-LIST-015",
        };
        setLocalNotifications([seededNoti, ...mockNotifications]);
        setActiveTab("all");
        break;
      }

      case "QA-16": {
        const seededNoti: NotificationProps = {
          id: "noti-qa-16",
          type: "approval",
          title: "Cần xử lý: Bổ sung Check-out (Override tab)",
          message: "Trước đó bạn đang ở tab Đã gửi. Bấm để kiểm tra tự động chuyển tab về Xử lý và hiển thị TK-OUT-032.",
          time: "Vừa xong",
          isRead: false,
          notificationGroup: "TICKET",
          ticketId: "TK-OUT-032",
        };
        setLocalNotifications([seededNoti, ...mockNotifications]);
        setActiveTab("all");
        break;
      }

      case "QA-17": {
        const seededNoti: NotificationProps = {
          id: "noti-qa-17",
          type: "approval",
          title: "Cần xử lý: Bổ sung Check-out (Đích đến: TK-OUT-032)",
          message: "Có 2 ticket cùng tên 'Bổ sung Check-out' (TK-OUT-031 và TK-OUT-032). Bấm để kiểm tra chỉ highlight TK-OUT-032.",
          time: "Vừa xong",
          isRead: false,
          notificationGroup: "TICKET",
          ticketId: "TK-OUT-032",
        };
        setLocalNotifications([seededNoti, ...mockNotifications]);
        setActiveTab("all");
        break;
      }

      case "QA-18": {
        const seededNoti: NotificationProps = {
          id: "noti-qa-18",
          type: "approval",
          title: "Thông báo lỗi định tuyến (targetEntityId = null)",
          message: "Thông báo này có group = TICKET nhưng bị thiếu trường ticketId. Thử bấm để kiểm tra cơ chế phòng thủ.",
          time: "Vừa xong",
          isRead: false,
          notificationGroup: "TICKET",
          ticketId: undefined,
        };
        setLocalNotifications([seededNoti, ...mockNotifications]);
        setActiveTab("all");
        break;
      }

      case "QA-19": {
        const seededNoti: NotificationProps = {
          id: "noti-qa-19",
          type: "approval",
          title: "Mô phỏng mở từ Push Notification",
          message: "Payload: group=TICKET, ticketId=TK-OUT-032. Bấm nút Test Push phía trên để kiểm tra.",
          time: "Vừa xong",
          isRead: false,
          notificationGroup: "TICKET",
          ticketId: "TK-OUT-032",
        };
        setLocalNotifications([seededNoti, ...mockNotifications]);
        setActiveTab("all");
        break;
      }

      default:
        break;
    }
  };

  const handleResetToDefault = () => {
    setQaNotificationScenario(null);
    setQaDiagnosticResult(null);
    setLocalNotifications(mockNotifications);
    setActiveTab("all");
    setAppliedFilters(DEFAULT_ADVANCED_FILTERS);
    setTempFilters(DEFAULT_ADVANCED_FILTERS);
    setSelectedBriefingId(null);
    setAttendanceTickets([
      {
        id: "TK-MB-301",
        employeeId: "u1",
        type: "missing_both",
        date: new Date(2026, 7, 2),
        reason: "Không có dữ liệu Check-in & Check-out trong ca làm việc.",
        useAnnualLeaveIntent: false,
        relatedShift: {
          id: "s-mb-301",
          shiftName: "Ca Sáng",
          timeStr: "08:00 - 15:00",
          storeName: "HMK Nguyễn Trãi",
          hours: 7,
        },
        submittedAt: new Date(2026, 7, 2, 15, 30),
        status: "PENDING",
        resolutionPath: null,
        linkedLeaveRequestId: null,
        isPeriodLocked: false,
      },
    ]);
  };

  const handleSimulatePushTap = (scenario: QaScenario) => {
    if (scenario.notificationGroup === "TICKET") {
      if (!scenario.targetEntityId) {
        setToastMessage("Không thể mở nội dung liên quan của thông báo này.");
        return;
      }
      navigate(`/requests?ticketId=${scenario.targetEntityId}`);
    } else if (scenario.notificationGroup === "SHIFT") {
      if (!scenario.targetEntityId) {
        setToastMessage("Không thể mở nội dung liên quan của thông báo này.");
        return;
      }
      navigate(`/schedule?shiftId=${scenario.targetEntityId}`);
    } else if (scenario.notificationGroup === "SHIFT_BRIEFING") {
      if (scenario.targetEntityId) {
        setSelectedBriefingId(scenario.targetEntityId);
      }
    }
  };

  const allNotifications: NotificationProps[] = [
    ...localNotifications,
    ...briefings.map(b => ({
      id: b.id,
      type: "briefing" as NotificationType,
      title: b.title,
      message: b.message,
      time: b.isUrgent && !b.isAcknowledged ? "Cần xác nhận" : "Hôm nay",
      isRead: b.isRead,
      isUrgent: b.isUrgent,
      isAcknowledged: b.isAcknowledged,
      storeName: b.storeName,
      notificationGroup: "SHIFT_BRIEFING" as NotificationGroup,
      briefingId: b.id,
    }))
  ];

  const formatDateDDMMYYYY = (d: any): string => {
    if (!d) return "";
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return "";
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  interface BusinessStatusBadge {
    label: string;
    badgeClass: string;
  }

  const getNotificationBusinessStatus = (notification: NotificationProps): BusinessStatusBadge | null => {
    // 1. Shift Briefing
    if (notification.type === "briefing" || notification.notificationGroup === "SHIFT_BRIEFING" || notification.briefingId) {
      const bId = notification.briefingId || notification.id;
      const b = briefings.find((item) => item.id === bId);
      if (b) {
        if (b.isAcknowledged) {
          return {
            label: "ĐÃ XÁC NHẬN",
            badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
          };
        }
        if (b.isUrgent) {
          return {
            label: "CẦN XÁC NHẬN",
            badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
          };
        }
      }
      if (notification.isAcknowledged) {
        return {
          label: "ĐÃ XÁC NHẬN",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      }
      if (notification.isUrgent) {
        return {
          label: "CẦN XÁC NHẬN",
          badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
        };
      }
      return null;
    }

    // 2. Ticket / Request
    if (notification.notificationGroup === "TICKET" || notification.ticketId) {
      const tId = notification.ticketId;
      if (tId) {
        // Check in attendanceTickets
        const att = attendanceTickets.find((t) => t.id === tId);
        if (att) {
          if (att.status === "APPROVED") {
            return { label: "ĐÃ DUYỆT", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
          }
          if (att.status === "REJECTED" || att.status === "AUTO_REJECTED") {
            return { label: "ĐÃ TỪ CHỐI", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" };
          }
          if (att.status === "CANCELLED") {
            return { label: "ĐÃ HỦY", badgeClass: "bg-slate-100 text-slate-600 border-slate-200" };
          }
          if (att.status === "PENDING") {
            // If already resolved/submitted by employee
            if (att.resolutionPath || att.linkedLeaveRequestId || att.reason?.includes("Đã gửi")) {
              return { label: "ĐÃ GỬI", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" };
            }
            return { label: "CẦN XỬ LÝ", badgeClass: "bg-red-50 text-red-700 border-red-200" };
          }
        }

        // Check in leaveRequests
        const lr = leaveRequests.find((r) => r.id === tId);
        if (lr) {
          if (lr.status === "APPROVED") {
            return { label: "ĐÃ DUYỆT", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
          }
          if (lr.status === "REJECTED" || lr.status === "AUTO_REJECTED") {
            return { label: "ĐÃ TỪ CHỐI", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" };
          }
          if (lr.status === "CANCELLED") {
            return { label: "ĐÃ HỦY", badgeClass: "bg-slate-100 text-slate-600 border-slate-200" };
          }
          if (lr.status === "PENDING") {
            return { label: "ĐÃ GỬI", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" };
          }
        }

        // Static matches for seed tickets
        if (tId === "LR-001") {
          return { label: "ĐÃ GỬI", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" };
        }
        if (tId === "LR-002") {
          return { label: "ĐÃ DUYỆT", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
        }
        if (tId === "LR-003") {
          return { label: "ĐÃ TỪ CHỐI", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" };
        }
        if (tId === "RQ-SWAP-01") {
          return { label: "ĐÃ GỬI", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" };
        }
        if (tId === "RQ-SWAP-02") {
          return { label: "CẦN XÁC NHẬN", badgeClass: "bg-orange-50 text-orange-700 border-orange-200" };
        }
        if (tId === "RQ-SWAP-05") {
          return { label: "ĐÃ TỪ CHỐI", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" };
        }
        if (tId === "TK-OUT-032" || tId === "TK-IN-017" || tId === "TK-MB-301" || tId.startsWith("TK-DEEP")) {
          return { label: "CẦN XỬ LÝ", badgeClass: "bg-red-50 text-red-700 border-red-200" };
        }
      }

      if (notification.title.includes("Cần xử lý") || notification.title.includes("Chờ xử lý")) {
        return { label: "CẦN XỬ LÝ", badgeClass: "bg-red-50 text-red-700 border-red-200" };
      }
      if (notification.title.includes("đã được duyệt") || notification.title.includes("Đã duyệt")) {
        return { label: "ĐÃ DUYỆT", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      }
      if (notification.title.includes("từ chối") || notification.title.includes("bị từ chối")) {
        return { label: "ĐÃ TỪ CHỐI", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" };
      }
      if (notification.title.includes("đã được gửi") || notification.title.includes("được gửi")) {
        return { label: "ĐÃ GỬI", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" };
      }
    }

    // 3. Shift
    if (notification.notificationGroup === "SHIFT" || notification.shiftId) {
      const sId = notification.shiftId;
      if (sId) {
        const shift = availableShifts.find((s) => s.id === sId);
        if (shift) {
          if (shift.status === "approved" || shift.status === "assigned" || shift.status === "open") {
            return { label: "ĐÃ DUYỆT", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
          }
          if (shift.status === "cancelled") {
            return { label: "ĐÃ HỦY", badgeClass: "bg-slate-100 text-slate-600 border-slate-200" };
          }
          if (shift.status === "rejected") {
            return { label: "ĐÃ TỪ CHỐI", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" };
          }
          if (shift.status === "pending") {
            return { label: "ĐÃ GỬI", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" };
          }
        }
        if (sId === "case_cancelled_today" || sId === "SHIFT-MISSING-999") {
          return { label: "ĐÃ HỦY", badgeClass: "bg-slate-100 text-slate-600 border-slate-200" };
        }
        if (sId === "case_approved_today" || sId === "case_approved_cg_today" || sId === "shift_outside_week_018" || sId === "SHIFT-101" || sId === "SHIFT-102") {
          return { label: "ĐÃ DUYỆT", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
        }
      }
      if (notification.title.includes("bị tước") || notification.title.includes("đã bị Hủy") || notification.title.includes("bị xóa")) {
        return { label: "ĐÃ HỦY", badgeClass: "bg-slate-100 text-slate-600 border-slate-200" };
      }
      if (notification.title.includes("xếp") || notification.title.includes("Phân công") || notification.title.includes("mới")) {
        return { label: "ĐÃ DUYỆT", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      }
    }

    // 4. Task
    if (notification.type === "task") {
      if (notification.isRead) {
        return null;
      }
      return { label: "CẦN XỬ LÝ", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" };
    }

    // 5. System policy
    if (notification.type === "system" && notification.title.includes("Chính sách mới")) {
      return notification.isRead ? null : { label: "CẦN XÁC NHẬN", badgeClass: "bg-orange-50 text-orange-700 border-orange-200" };
    }

    return null;
  };

  const getNotificationBusinessContext = (notification: NotificationProps): string | null => {
    // 1. Shift Briefing
    if (notification.type === "briefing" || notification.notificationGroup === "SHIFT_BRIEFING" || notification.briefingId) {
      const bId = notification.briefingId || notification.id;
      const b = briefings.find((item) => item.id === bId);
      if (b) {
        const parts = [b.storeName || "HMK Nguyễn Trãi"];
        if (b.shiftName) parts.push(b.shiftName);
        if (b.shiftTime) parts.push(b.shiftTime);
        return parts.join(" • ");
      }
      return notification.storeName ? `Bảng tin • ${notification.storeName}` : "Bảng tin đầu ca • HMK Nguyễn Trãi";
    }

    // 2. Ticket / Request
    if (notification.notificationGroup === "TICKET" || notification.ticketId) {
      const tId = notification.ticketId;
      if (tId) {
        // Check in attendanceTickets
        const att = attendanceTickets.find((t) => t.id === tId);
        if (att) {
          const parts = [`Ticket ${att.id}`];
          if (att.relatedShift?.shiftName) parts.push(att.relatedShift.shiftName);
          if (att.relatedShift?.storeName) parts.push(att.relatedShift.storeName);
          else if (notification.storeName) parts.push(notification.storeName);
          return parts.join(" • ");
        }

        // Check in leaveRequests
        const lr = leaveRequests.find((r) => r.id === tId);
        if (lr) {
          const parts = [`Đơn ${lr.id}`];
          if (lr.branch) parts.push(lr.branch);
          else parts.push("HMK Nguyễn Trãi");
          return parts.join(" • ");
        }

        if (tId.startsWith("TK-")) {
          return `Ticket ${tId} • HMK Nguyễn Trãi`;
        }
        if (tId.startsWith("LR-")) {
          return `Đơn nghỉ phép ${tId} • HMK Nguyễn Trãi`;
        }
        if (tId.startsWith("RQ-SWAP")) {
          return `Đổi ca ${tId} • HMK Nguyễn Trãi`;
        }
      }
      return null;
    }

    // 3. Shift
    if (notification.notificationGroup === "SHIFT" || notification.shiftId) {
      const sId = notification.shiftId;
      if (sId) {
        const shift = availableShifts.find((s) => s.id === sId);
        if (shift) {
          const parts: string[] = [];
          if (shift.date) {
            const d = shift.date instanceof Date ? shift.date : new Date(shift.date);
            const now = new Date();
            if (d.toDateString() !== now.toDateString()) {
              parts.push(formatDateDDMMYYYY(d));
            }
          }
          if (shift.shiftName) parts.push(shift.shiftName);
          if (shift.timeStr) parts.push(shift.timeStr);
          if (shift.storeName) parts.push(shift.storeName);
          return parts.length > 0 ? parts.join(" • ") : null;
        }

        if (sId === "case_approved_today" || sId === "0" || sId === "sys-1") {
          return "Ca Sáng • 08:00–15:00 • HMK Nguyễn Trãi";
        }
        if (sId === "case_approved_cg_today" || sId === "sys-2") {
          return "Ca Sáng • 08:00–15:00 • HMK Cầu Giấy";
        }
        if (sId === "case_cancelled_today" || sId === "ns-1") {
          return "Ca Chiều • HMK Nguyễn Trãi";
        }
        if (sId === "shift_outside_week_018") {
          return "18/09/2026 • Ca Tối • HMK Nguyễn Trãi";
        }
        if (sId === "shift_status_changed_demo") {
          return "Ca Chiều • 13:00–20:00 • HMK Cầu Giấy";
        }
        if (sId === "SHIFT-101" || sId === "SHIFT-102") {
          return "Ca Sáng • 08:00–15:00 • HMK Nguyễn Trãi";
        }
        if (sId === "SHIFT-MISSING-999") {
          return "Ca làm việc • HMK Nguyễn Trãi";
        }
      }
      return notification.storeName ? `Ca làm • ${notification.storeName}` : null;
    }

    // 4. Task
    if (notification.type === "task") {
      if (notification.title.includes("giao công việc")) {
        return "Nhiệm vụ • Hạn 15:00 hôm nay";
      }
      if (notification.title.includes("đến hạn")) {
        return "Kiểm kho • Còn 30 phút";
      }
      return "Nhiệm vụ công việc";
    }

    // 5. System
    if (notification.type === "system") {
      if (notification.title.includes("Chính sách")) {
        return "Chính sách vận hành • Toàn hệ thống";
      }
      if (notification.title.includes("Bảo trì") || notification.message.includes("bảo trì")) {
        return "Bảo trì hệ thống";
      }
    }

    return notification.storeName || null;
  };

  const isNotificationActionNeeded = (notification: NotificationProps): boolean => {
    // 1. Shift Briefing: requires urgent acknowledgement and not yet acknowledged in current business state
    if (notification.type === "briefing" || notification.notificationGroup === "SHIFT_BRIEFING" || notification.briefingId) {
      const bId = notification.briefingId || notification.id;
      const b = briefings.find((item) => item.id === bId);
      if (b) {
        return Boolean(b.isUrgent && !b.isAcknowledged);
      }
      return Boolean(notification.isUrgent && !notification.isAcknowledged);
    }

    // 2. Ticket: currently belonging to Yêu cầu → Xử lý (Received / Processing tab)
    if (notification.notificationGroup === "TICKET" || notification.ticketId) {
      const tId = notification.ticketId;
      if (!tId) return false;

      // Check in current attendanceTickets state
      const att = attendanceTickets.find((t) => t.id === tId);
      if (att) {
        // If the attendance ticket is still unresolved / pending employee explanation in "Xử lý"
        return att.status === "PENDING" && !att.resolutionPath && !att.linkedLeaveRequestId && !att.reason?.includes("Đã gửi");
      }

      // Special received request items from peers needing employee action (e.g. incoming swap)
      if (tId === "RQ-SWAP-02") {
        return true;
      }
      if (tId === "TK-OUT-032" || tId === "TK-IN-017" || tId.startsWith("TK-DEEP")) {
        return true;
      }

      return false;
    }

    return false;
  };

  const getNotificationCategory = (n: NotificationProps): NotificationTypeFilter => {
    if (n.notificationGroup === "TICKET" || Boolean(n.ticketId)) {
      return "TICKET";
    }
    if (n.notificationGroup === "SHIFT" || Boolean(n.shiftId)) {
      return "SHIFT";
    }
    if (n.notificationGroup === "SHIFT_BRIEFING" || n.type === "briefing" || Boolean(n.briefingId)) {
      return "SHIFT_BRIEFING";
    }
    return "SYSTEM";
  };

  const isNotificationInTimeRange = (
    n: NotificationProps,
    timeFilter: TimeFilter,
    customStart?: string,
    customEnd?: string
  ): boolean => {
    if (timeFilter === "ALL") return true;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let notiDate = new Date();
    const timeStr = n.time || "";

    if (
      timeStr.includes("phút") ||
      timeStr.includes("giờ") ||
      timeStr.includes("Vừa xong") ||
      timeStr.includes("Vài giây") ||
      timeStr.includes("Hôm nay") ||
      timeStr.includes("Cần xác nhận")
    ) {
      notiDate = new Date(todayStart + 12 * 3600 * 1000);
    } else if (timeStr.includes("Hôm qua") || timeStr.includes("1 ngày trước")) {
      notiDate = new Date(todayStart - 24 * 3600 * 1000);
    } else if (timeStr.includes("2 ngày trước")) {
      notiDate = new Date(todayStart - 2 * 24 * 3600 * 1000);
    } else if (timeStr.includes("3 ngày trước")) {
      notiDate = new Date(todayStart - 3 * 24 * 3600 * 1000);
    } else if (timeStr.includes("7 ngày trước") || timeStr.includes("1 tuần trước")) {
      notiDate = new Date(todayStart - 7 * 24 * 3600 * 1000);
    }

    const notiTime = notiDate.getTime();

    if (timeFilter === "TODAY") {
      return notiTime >= todayStart;
    }

    if (timeFilter === "LAST_7_DAYS") {
      const sevenDaysAgo = todayStart - 7 * 24 * 3600 * 1000;
      return notiTime >= sevenDaysAgo;
    }

    if (timeFilter === "LAST_30_DAYS") {
      const thirtyDaysAgo = todayStart - 30 * 24 * 3600 * 1000;
      return notiTime >= thirtyDaysAgo;
    }

    if (timeFilter === "CUSTOM") {
      if (!customStart && !customEnd) return true;
      if (customStart) {
        const start = new Date(customStart).getTime();
        if (notiTime < start) return false;
      }
      if (customEnd) {
        const end = new Date(customEnd).getTime() + 24 * 3600 * 1000 - 1;
        if (notiTime > end) return false;
      }
      return true;
    }

    return true;
  };

  const actionNeededCount = allNotifications.filter(isNotificationActionNeeded).length;
  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  const quickFilterTabs: { id: QuickFilterTab; label: string }[] = [
    { id: "all", label: "Tất cả" },
    { id: "action_needed", label: `Cần xử lý (${actionNeededCount})` },
    { id: "unread", label: `Chưa đọc (${unreadCount})` },
  ];

  const activeAdvancedCount = [
    appliedFilters.type !== "ALL",
    appliedFilters.processingStatus !== "ALL",
    appliedFilters.readStatus !== "ALL",
    appliedFilters.time !== "ALL",
  ].filter(Boolean).length;

  const filtered = allNotifications.filter((n) => {
    // 1. Search Query filter (matches title, ticketId, shiftId, shift name, store name, message, business context)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = n.title?.toLowerCase().includes(q);
      const messageMatch = n.message?.toLowerCase().includes(q);
      const ticketMatch = n.ticketId?.toLowerCase().includes(q);
      const shiftMatch = n.shiftId?.toLowerCase().includes(q);
      const storeMatch = n.storeName?.toLowerCase().includes(q);
      
      const bContext = getNotificationBusinessContext(n)?.toLowerCase() || "";
      const contextMatch = bContext.includes(q);

      if (!titleMatch && !messageMatch && !ticketMatch && !shiftMatch && !storeMatch && !contextMatch) {
        return false;
      }
    }

    // 2. Quick Filters
    if (activeTab === "action_needed") {
      if (!isNotificationActionNeeded(n)) return false;
    } else if (activeTab === "unread") {
      if (n.isRead) return false;
    }

    // 3. Advanced: Loại thông báo
    if (appliedFilters.type !== "ALL") {
      if (getNotificationCategory(n) !== appliedFilters.type) return false;
    }

    // 4. Advanced: Trạng thái xử lý
    if (appliedFilters.processingStatus !== "ALL") {
      const isAction = isNotificationActionNeeded(n);
      if (appliedFilters.processingStatus === "ACTION_NEEDED" && !isAction) return false;
      if (appliedFilters.processingStatus === "PROCESSED" && isAction) return false;
    }

    // 5. Advanced: Trạng thái đọc
    if (appliedFilters.readStatus !== "ALL") {
      if (appliedFilters.readStatus === "UNREAD" && n.isRead) return false;
      if (appliedFilters.readStatus === "READ" && !n.isRead) return false;
    }

    // 6. Advanced: Thời gian
    if (appliedFilters.time !== "ALL") {
      if (!isNotificationInTimeRange(n, appliedFilters.time, appliedFilters.customStartDate, appliedFilters.customEndDate)) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    // Put actionable items first
    const aAction = isNotificationActionNeeded(a);
    const bAction = isNotificationActionNeeded(b);
    if (aAction && !bAction) return -1;
    if (!aAction && bAction) return 1;
    return 0;
  });

  const getEmptyStateContent = () => {
    // Priority 1: Search query has no results
    if (searchQuery.trim()) {
      return {
        title: "Không tìm thấy thông báo phù hợp.",
        subtitle: `Không có kết quả nào khớp với từ khóa "${searchQuery.trim()}".`,
      };
    }

    // Priority 2: Advanced Filters active with no results
    if (activeAdvancedCount > 0) {
      return {
        title: "Không có thông báo phù hợp với bộ lọc hiện tại.",
        subtitle: "Thử điều chỉnh hoặc xóa bớt tiêu chí lọc nâng cao.",
      };
    }

    // Priority 3: Quick Filter "Cần xử lý"
    if (activeTab === "action_needed") {
      return {
        title: "Không có thông báo nào cần bạn xử lý.",
        subtitle: "Tất cả yêu cầu và đầu việc hiện tại đã được giải quyết.",
      };
    }

    // Priority 4: Quick Filter "Chưa đọc"
    if (activeTab === "unread") {
      return {
        title: "Bạn đã đọc tất cả thông báo.",
        subtitle: "Không còn thông báo mới chưa đọc nào.",
      };
    }

    // Priority 5: Default empty
    return {
      title: "Không có thông báo nào.",
      subtitle: "Hộp thư thông báo của bạn đang trống.",
    };
  };

  type ChronoGroup = "HÔM NAY" | "HÔM QUA" | "TRƯỚC ĐÓ";

  const getNotificationChronoGroup = (n: NotificationProps): ChronoGroup => {
    const timeStr = (n.time || "").toLowerCase();
    if (
      timeStr.includes("phút") ||
      timeStr.includes("giờ") ||
      timeStr.includes("vừa xong") ||
      timeStr.includes("vài giây") ||
      timeStr.includes("hôm nay") ||
      timeStr.includes("cần xác nhận")
    ) {
      return "HÔM NAY";
    }

    if (
      timeStr.includes("hôm qua") ||
      timeStr.includes("1 ngày trước")
    ) {
      return "HÔM QUA";
    }

    return "TRƯỚC ĐÓ";
  };

  const rawGrouped: { group: ChronoGroup; items: NotificationProps[] }[] = [
    {
      group: "HÔM NAY",
      items: filtered.filter((n) => getNotificationChronoGroup(n) === "HÔM NAY"),
    },
    {
      group: "HÔM QUA",
      items: filtered.filter((n) => getNotificationChronoGroup(n) === "HÔM QUA"),
    },
    {
      group: "TRƯỚC ĐÓ",
      items: filtered.filter((n) => getNotificationChronoGroup(n) === "TRƯỚC ĐÓ"),
    },
  ];
  const groupedNotifications = rawGrouped.filter((g) => g.items.length > 0);

  const getIcon = (type: NotificationType, isUrgent?: boolean) => {
    if (type === "briefing") {
      return isUrgent ? <BellRing className="w-5 h-5 text-orange-600" /> : <Megaphone className="w-5 h-5 text-primary" />;
    }
    switch (type) {
      case "system":
        return <Bell className="w-5 h-5 text-primary" />;
      case "task":
        return <CheckSquare className="w-5 h-5 text-amber-500" />;
      case "approval":
        return <FileText className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getBg = (type: NotificationType, isUrgent?: boolean) => {
    if (type === "briefing") {
      return isUrgent ? "bg-orange-100 border-orange-200" : "bg-primary/10 border-primary/20";
    }
    switch (type) {
      case "system":
        return "bg-primary/10 border-primary/20";
      case "task":
        return "bg-amber-50 border-amber-100";
      case "approval":
        return "bg-emerald-50 border-emerald-100";
    }
  };

  const handleMarkAsRead = (id: string, type: NotificationType) => {
    if (type === "briefing") {
      markBriefingAsRead(id);
    } else {
      setLocalNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    }
  };

  const handleMarkAllAsRead = () => {
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    briefings.forEach(b => markBriefingAsRead(b.id));
  };

  return (
    <div className="mobile-container bg-background flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white px-4 py-3 sticky top-0 z-30 shadow-sm border-b-2 border-gray-100 flex flex-col gap-3">
        {/* Top Header Row */}
        <div className="flex items-center justify-between pt-safe">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 -ml-2 rounded-md flex items-center justify-center text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 ml-1">Thông báo</h1>
          </div>
          <button
            onClick={() => {
              if (unreadCount > 0) {
                setShowMarkAllConfirm(true);
              }
            }}
            disabled={unreadCount === 0}
            className={cn(
              "text-xs font-bold uppercase tracking-wide transition-all",
              unreadCount > 0
                ? "text-primary hover:underline cursor-pointer"
                : "text-gray-300 cursor-not-allowed",
            )}
          >
            Đọc tất cả
          </button>
        </div>

        {/* Compact Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm thông báo..."
            className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filters + Compact Filter Button */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {quickFilterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 uppercase tracking-wide flex items-center gap-1.5 shrink-0",
                  activeTab === tab.id
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-gray-500 border-gray-100 hover:border-gray-200 hover:text-gray-900",
                )}
              >
                {tab.label}
                {tab.id === "all" && unreadCount > 0 ? (
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    activeTab === "all" ? "bg-white" : "bg-red-500"
                  )}></span>
                ) : null}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setTempFilters(appliedFilters);
              setIsFilterOpen(true);
            }}
            className={cn(
              "px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 flex items-center gap-1.5 shrink-0 shadow-sm",
              activeAdvancedCount > 0
                ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{activeAdvancedCount > 0 ? `Bộ lọc (${activeAdvancedCount})` : "Bộ lọc"}</span>
          </button>
        </div>
      </div>

      {/* MOCK / QA-ONLY SCENARIO SWITCHER TEST HARNESS */}
      <NotificationQaSwitcher
        onApplyScenario={handleApplyScenario}
        onResetToDefault={handleResetToDefault}
        onSimulatePushTap={handleSimulatePushTap}
      />

      <div className="flex-1 overflow-y-auto w-full bg-gray-50/50">
        {groupedNotifications.length > 0 ? (
          <div className="p-4 space-y-5">
            {groupedNotifications.map(({ group, items }) => (
              <div key={group} className="space-y-2.5">
                {/* Compact Section Header */}
                <div className="flex items-center gap-2 px-1 pt-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                    {group}
                  </span>
                  <div className="flex-1 h-[1px] bg-gray-200/80" />
                </div>

                {/* Items in Chrono Group */}
                <div className="space-y-2.5">
                  {items.map((notification) => {
                    const statusBadge = getNotificationBusinessStatus(notification);
                    const businessContext = getNotificationBusinessContext(notification);

                    return (
                      <div
                        key={notification.id}
                        onClick={() => {
                          handleMarkAsRead(notification.id, notification.type);

                          const group = notification.notificationGroup || (
                            notification.type === "briefing"
                              ? "SHIFT_BRIEFING"
                              : notification.ticketId
                                ? "TICKET"
                                : notification.shiftId
                                  ? "SHIFT"
                                  : null
                          );

                          if (group === "SHIFT_BRIEFING" || notification.type === "briefing") {
                            const targetBriefingId = notification.briefingId || notification.id;
                            const exists = briefings.some(b => b.id === targetBriefingId);
                            if (exists) {
                              setSelectedBriefingId(targetBriefingId);
                              if (qaNotificationScenario?.category === "SHIFT_BRIEFING") {
                                setQaDiagnosticResult({
                                  scenarioId: qaNotificationScenario.id,
                                  timestamp: new Date(),
                                  status: "PASS",
                                  details: `Đã mở bản tin [${targetBriefingId}] tại chỗ trong modal Thông báo.`,
                                  locatedEntityId: targetBriefingId,
                                });
                              }
                            } else {
                              setToastMessage("Bản tin đầu ca không còn tồn tại.");
                            }
                            return;
                          }

                          if (group === "TICKET" || notification.ticketId) {
                            const targetTicketId = notification.ticketId;
                            if (!targetTicketId) {
                              setToastMessage("Không thể mở nội dung liên quan của thông báo này.");
                              if (qaNotificationScenario?.id === "QA-18") {
                                setQaDiagnosticResult({
                                  scenarioId: "QA-18",
                                  timestamp: new Date(),
                                  status: "PASS",
                                  details: "Phòng thủ an toàn: targetEntityId = null không bị crash hay chuyển trang ngẫu nhiên.",
                                });
                              }
                              return;
                            }
                            navigate(`/requests?ticketId=${targetTicketId}`);
                            return;
                          }

                          if (group === "SHIFT" || notification.shiftId) {
                            const targetShiftId = notification.shiftId;
                            if (!targetShiftId) {
                              setToastMessage("Không thể mở nội dung liên quan của thông báo này.");
                              return;
                            }
                            const foundShift = availableShifts.find(s => s.id === targetShiftId);
                            if (foundShift) {
                              const shiftDate = foundShift.date instanceof Date 
                                ? foundShift.date.toISOString().split("T")[0] 
                                : String(foundShift.date);
                              navigate(`/schedule?shiftId=${targetShiftId}&date=${shiftDate}`);
                            } else {
                              navigate(`/schedule?shiftId=${targetShiftId}`);
                            }
                            return;
                          }

                          if (notification.navigateUrl) {
                            navigate(notification.navigateUrl);
                          }
                        }}
                        className={cn(
                          "p-3.5 bg-white border rounded-2xl transition-all cursor-pointer active:scale-[0.98] shadow-sm relative overflow-hidden",
                          !notification.isRead
                            ? "border-primary/30 bg-white ring-1 ring-primary/10"
                            : "border-gray-200/80 bg-white hover:border-gray-300 opacity-95",
                        )}
                      >
                        <div className="flex gap-3 items-start">
                          {/* Leading Category / Type Icon */}
                          <div className="relative shrink-0 pt-0.5">
                            <div
                              className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center border",
                                getBg(notification.type, notification.isUrgent && !notification.isAcknowledged),
                              )}
                            >
                              {getIcon(notification.type, notification.isUrgent && !notification.isAcknowledged)}
                            </div>
                          </div>

                          {/* Content Column */}
                          <div className="flex-1 min-w-0">
                            {/* Top Line: Title + Status Badge */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3
                                className={cn(
                                  "text-sm tracking-tight leading-snug break-words flex-1",
                                  !notification.isRead
                                    ? "font-bold text-gray-900"
                                    : "font-semibold text-gray-700",
                                )}
                              >
                                {notification.title}
                              </h3>

                              {/* Current Business Status Badge */}
                              {statusBadge && (
                                <span
                                  className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap",
                                    statusBadge.badgeClass
                                  )}
                                >
                                  {statusBadge.label}
                                </span>
                              )}
                            </div>

                            {/* Business Context Line */}
                            {businessContext && (
                              <p className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                                <span>{businessContext}</span>
                              </p>
                            )}

                            {/* Short Body Preview (2-3 lines with ellipsis) */}
                            <p
                              className={cn(
                                "text-xs leading-relaxed line-clamp-2",
                                !notification.isRead ? "text-gray-600 font-normal" : "text-gray-500 font-normal",
                              )}
                            >
                              {notification.message}
                            </p>

                            {/* Card Footer: Timestamp + Crisp Unread Dot */}
                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100/90">
                              <span className="text-[11px] font-medium text-gray-400">
                                {notification.time}
                              </span>

                              {/* Small crisp unread indicator (no aggressive red blur) */}
                              {!notification.isRead && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-primary">Mới</span>
                                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          (() => {
            const emptyContent = getEmptyStateContent();
            return (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-20 h-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  {searchQuery.trim() ? (
                    <Search className="w-8 h-8 text-gray-300" />
                  ) : activeAdvancedCount > 0 ? (
                    <SlidersHorizontal className="w-8 h-8 text-gray-300" />
                  ) : (
                    <Bell className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <p className="text-sm font-bold text-gray-900 tracking-tight">
                  {emptyContent.title}
                </p>
                <p className="text-gray-500 text-xs mt-1.5 font-normal max-w-[280px]">
                  {emptyContent.subtitle}
                </p>

                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-4 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Xóa tìm kiếm
                  </button>
                )}
              </div>
            );
          })()
        )}
      </div>

      {/* Confirmation Modal for Read All */}
      <AnimatePresence>
        {showMarkAllConfirm && (
          <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5">
                Đánh dấu tất cả thông báo là đã đọc?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-5">
                Thao tác này chỉ cập nhật trạng thái đọc của thông báo và không làm thay đổi trạng thái xử lý của công việc, ticket hay ca làm việc.
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowMarkAllConfirm(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 uppercase tracking-wider transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleMarkAllAsRead();
                    setShowMarkAllConfirm(false);
                    setToastMessage("Đã đánh dấu tất cả thông báo là đã đọc");
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 shadow-sm uppercase tracking-wider transition-all active:scale-[0.98]"
                >
                  Đánh dấu đã đọc
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Message */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-slate-700 pointer-events-none whitespace-nowrap"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Briefing Detail Bottom Sheet */}
      <AnimatePresence>
        {selectedBriefingId && (
          (() => {
             const selectedBriefing = briefings.find(b => b.id === selectedBriefingId);
             if (!selectedBriefing) return null;
             return (
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end"
                 onClick={() => setSelectedBriefingId(null)}
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
                   
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-xl font-bold text-gray-900">Chi tiết bảng tin</h3>
                     <button
                       onClick={() => setSelectedBriefingId(null)}
                       className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                     >
                       <X className="w-5 h-5 text-gray-500" />
                     </button>
                   </div>
                   
                   <div className="overflow-y-auto pb-6 -mx-5 px-5">
                     <div className="flex flex-wrap gap-2 mb-4">
                       {selectedBriefing.isUrgent ? (
                         <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wide">
                           Khẩn cấp
                         </span>
                       ) : (
                         <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-primary/10 text-primary uppercase tracking-wide">
                           Bảng tin
                         </span>
                       )}
                       {selectedBriefing.isAcknowledged ? (
                         <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                           Đã xác nhận
                         </span>
                       ) : selectedBriefing.isUrgent ? (
                         <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700 uppercase tracking-wide">
                           Chưa xác nhận
                         </span>
                       ) : null}
                     </div>

                     <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedBriefing.title}</h2>

                     <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 space-y-3">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                           <span className="text-xs font-bold text-primary uppercase">{selectedBriefing.senderRole}</span>
                         </div>
                         <div>
                           <p className="text-sm font-bold text-gray-900">{selectedBriefing.senderName}</p>
                           <p className="text-xs text-slate-500">{new Date(selectedBriefing.sentAt).toLocaleString("vi-VN")}</p>
                         </div>
                       </div>
                       
                       <div className="border-t border-slate-200 pt-3 flex flex-wrap gap-x-6 gap-y-2">
                         <div className="flex items-center gap-2 text-sm">
                           <Megaphone className="w-4 h-4 text-slate-400" />
                           <span className="font-medium text-slate-700">{selectedBriefing.storeName}</span>
                         </div>
                         {(selectedBriefing.shiftName || selectedBriefing.shiftTime) && (
                           <div className="flex items-center gap-2 text-sm">
                             <Circle className="w-4 h-4 text-slate-400" />
                             <span className="font-medium text-slate-700">{selectedBriefing.shiftName} {selectedBriefing.shiftTime}</span>
                           </div>
                         )}
                       </div>
                     </div>

                     <div className="prose prose-sm prose-slate mb-6">
                       <p className="text-sm leading-relaxed text-gray-700">{selectedBriefing.message}</p>
                     </div>

                     {selectedBriefing.goals && selectedBriefing.goals.length > 0 && (
                       <div className="mb-6">
                         <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Mục tiêu đầu ca</h4>
                         <ul className="space-y-2">
                           {selectedBriefing.goals.map((goal, idx) => (
                             <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                               <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                               <span>{goal}</span>
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}
                   </div>
                   
                   <div className="pt-4 mt-auto border-t border-gray-100 flex gap-3">
                     {selectedBriefing.isUrgent && !selectedBriefing.isAcknowledged ? (
                       <button
                         onClick={() => {
                           acknowledgeBriefing(selectedBriefing.id);
                           setTimeout(() => setSelectedBriefingId(null), 1000); // Close after 1s
                         }}
                         className="w-full py-3.5 bg-orange-600 text-white hover:bg-orange-700 font-bold rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                       >
                         <CheckCircle2 className="w-5 h-5" /> Đã đọc & hiểu
                       </button>
                     ) : selectedBriefing.isAcknowledged ? (
                       <div className="w-full text-center py-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-bold text-sm">
                         Bạn đã xác nhận lúc {selectedBriefing.acknowledgedAt ? new Date(selectedBriefing.acknowledgedAt).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'}) + " " + new Date(selectedBriefing.acknowledgedAt).toLocaleDateString("vi-VN") : "N/A"}
                       </div>
                     ) : (
                       <button
                         onClick={() => setSelectedBriefingId(null)}
                         className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center"
                       >
                         Đóng
                       </button>
                     )}
                   </div>
                 </motion.div>
               </motion.div>
             );
          })()
        )}
      </AnimatePresence>
      {/* Advanced Filter Bottom Sheet */}
      <AnimatePresence>
        {isFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />

            {/* Modal Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10"
            >
              {/* Drag Handle & Header */}
              <div className="p-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-gray-900">Bộ lọc thông báo</h2>
                </div>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Filter Sections */}
              <div className="p-4 overflow-y-auto space-y-5 flex-1 divide-y divide-gray-100">
                {/* 1. Loại thông báo */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Loại thông báo
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "ALL", label: "Tất cả" },
                      { id: "TICKET", label: "Ticket" },
                      { id: "SHIFT", label: "Ca làm việc" },
                      { id: "SHIFT_BRIEFING", label: "Shift Briefing" },
                      { id: "SYSTEM", label: "Hệ thống" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTempFilters(prev => ({ ...prev, type: opt.id as NotificationTypeFilter }))}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border",
                          tempFilters.type === opt.id
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Trạng thái xử lý */}
                <div className="pt-4 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Trạng thái xử lý
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "ALL", label: "Tất cả" },
                      { id: "ACTION_NEEDED", label: "Cần xử lý" },
                      { id: "PROCESSED", label: "Đã xử lý" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTempFilters(prev => ({ ...prev, processingStatus: opt.id as ProcessingStatusFilter }))}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border",
                          tempFilters.processingStatus === opt.id
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Trạng thái đọc */}
                <div className="pt-4 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Trạng thái đọc
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "ALL", label: "Tất cả" },
                      { id: "UNREAD", label: "Chưa đọc" },
                      { id: "READ", label: "Đã đọc" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTempFilters(prev => ({ ...prev, readStatus: opt.id as ReadStatusFilter }))}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border",
                          tempFilters.readStatus === opt.id
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Thời gian */}
                <div className="pt-4 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Thời gian
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "ALL", label: "Tất cả" },
                      { id: "TODAY", label: "Hôm nay" },
                      { id: "LAST_7_DAYS", label: "7 ngày gần nhất" },
                      { id: "LAST_30_DAYS", label: "30 ngày gần nhất" },
                      { id: "CUSTOM", label: "Tùy chỉnh" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTempFilters(prev => ({ ...prev, time: opt.id as TimeFilter }))}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border",
                          tempFilters.time === opt.id
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Range Picker (shown ONLY when Tùy chỉnh is selected) */}
                  {tempFilters.time === "CUSTOM" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-3 grid grid-cols-2 gap-3"
                    >
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 mb-1 block">Từ ngày</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={tempFilters.customStartDate || ""}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, customStartDate: e.target.value }))}
                            className="w-full text-xs font-medium px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 mb-1 block">Đến ngày</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={tempFilters.customEndDate || ""}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, customEndDate: e.target.value }))}
                            className="w-full text-xs font-medium px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-gray-900"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Sheet Footer Actions */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTempFilters(DEFAULT_ADVANCED_FILTERS)}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition-colors uppercase tracking-wider text-center"
                >
                  Xóa bộ lọc
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedFilters(tempFilters);
                    setIsFilterOpen(false);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-md active:scale-[0.98] uppercase tracking-wider text-center"
                >
                  Áp dụng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
