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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, AttendanceTicket } from "@/context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import NotificationQaSwitcher from "@/components/NotificationQaSwitcher";
import { QaScenario } from "@/types/qaNotification";

type NotificationType = "system" | "task" | "approval" | "briefing";

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
  
  const initialTab = searchParams.get("tab") as NotificationType | "all" | null;
  const [activeTab, setActiveTab] = useState<"all" | NotificationType>(initialTab && ["all", "system", "task", "approval", "briefing"].includes(initialTab) ? initialTab : "all");
  
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
        setActiveTab("briefing");
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
        setActiveTab("briefing");
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

  const tabs: { id: "all" | NotificationType; label: string }[] = [
    { id: "all", label: "Tất cả" },
    { id: "briefing", label: "Bảng tin" },
    { id: "system", label: "Hệ thống" },
    { id: "task", label: "Công việc" },
    { id: "approval", label: "Phê duyệt" },
  ];

  const filtered = allNotifications.filter(
    (n) => activeTab === "all" || n.type === activeTab,
  ).sort((a, b) => {
    // Put urgent unacknowledged briefings first
    if (a.isUrgent && !a.isAcknowledged && !(b.isUrgent && !b.isAcknowledged)) return -1;
    if (!(a.isUrgent && !a.isAcknowledged) && b.isUrgent && !b.isAcknowledged) return 1;
    return 0;
  });

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
      <div className="bg-white px-4 py-3 sticky top-0 z-30 shadow-sm border-b-2 border-gray-100 flex flex-col">
        <div className="flex items-center justify-between mb-4 pt-safe">
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
            onClick={handleMarkAllAsRead}
            className="text-xs font-bold text-primary uppercase tracking-wide hover:underline"
          >
            Đọc tất cả
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 uppercase tracking-wide flex items-center gap-1.5",
                activeTab === tab.id
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-gray-500 border-gray-100 hover:border-gray-200 hover:text-gray-900",
              )}
            >
              {tab.label}
              {tab.id === "all" && allNotifications.some((n) => !n.isRead) ? (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 line-block"></span>
              ) : null}
              {tab.id === "briefing" && allNotifications.some(n => n.type === "briefing" && !n.isRead) ? (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 line-block"></span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* MOCK / QA-ONLY SCENARIO SWITCHER TEST HARNESS */}
      <NotificationQaSwitcher
        onApplyScenario={handleApplyScenario}
        onResetToDefault={handleResetToDefault}
        onSimulatePushTap={handleSimulatePushTap}
      />

      <div className="flex-1 overflow-y-auto w-full bg-gray-50/50">
        {filtered.length > 0 ? (
          <div className="p-4 space-y-3">
            {filtered.map((notification) => (
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
                  "p-4 bg-white border-2 rounded-xl transition-all cursor-pointer active:scale-[0.98] shadow-sm relative overflow-hidden",
                  !notification.isRead
                    ? (notification.isUrgent && !notification.isAcknowledged ? "border-orange-300 shadow-md bg-orange-50/20" : "border-primary/30 shadow-md")
                    : "border-gray-100 opacity-80",
                )}
              >
                {!notification.isRead && (
                  <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full m-3 blur-[2px]"></div>
                )}
                <div className="flex gap-3">
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2",
                        getBg(notification.type, notification.isUrgent),
                      )}
                    >
                      {getIcon(notification.type, notification.isUrgent)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex justify-between items-start mb-1.5 gap-2">
                      <h3
                        className={cn(
                          "text-sm tracking-tight leading-snug break-words",
                          !notification.isRead
                            ? "font-bold text-gray-900"
                            : "font-semibold text-gray-500",
                        )}
                      >
                        {notification.title}
                      </h3>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider shrink-0 whitespace-nowrap pt-0.5 border px-1.5 py-0.5 rounded-md",
                        notification.isUrgent && !notification.isAcknowledged ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-gray-50 text-gray-400 border-gray-100"
                      )}>
                        {notification.time}
                      </span>
                    </div>
                    {notification.storeName && (
                      <p className="text-[10px] font-bold text-primary mb-1 uppercase tracking-wide">
                         {notification.storeName}
                      </p>
                    )}
                    <p
                      className={cn(
                        "text-xs leading-relaxed max-w-[280px]",
                        !notification.isRead
                          ? "text-gray-600 font-medium"
                          : "text-gray-400 font-medium",
                      )}
                    >
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-24 h-24 bg-white border-2 border-dashed border-gray-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Bell className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Không có thông báo nào
            </p>
            <p className="text-gray-500 text-xs mt-1.5 font-medium">
              Góc làm việc của bạn đang rất gọn gàng!
            </p>
          </div>
        )}
      </div>

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
    </div>
  );
}
