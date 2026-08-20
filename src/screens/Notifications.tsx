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
import { useApp } from "@/context/AppContext";
import { motion, AnimatePresence } from "motion/react";

type NotificationType = "system" | "task" | "approval" | "briefing";

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
}

const mockNotifications: NotificationProps[] = [
  {
    id: "lr-noti-1",
    type: "approval",
    title: "Đơn nghỉ phép đã được gửi",
    message: "Đơn nghỉ phép của bạn đã được hệ thống ghi nhận. Phản hồi sẽ sớm được cập nhật.",
    time: "2 giờ trước",
    isRead: false,
    navigateUrl: "/requests"
  },
  {
    id: "lr-noti-2",
    type: "approval",
    title: "Đơn nghỉ phép LR-002 đã được duyệt",
    message: "Đơn nghỉ phép tuần trước của bạn đã được duyệt.",
    time: "1 ngày trước",
    isRead: true,
    navigateUrl: "/requests"
  },
  {
    id: "lr-noti-3",
    type: "approval",
    title: "Đơn nghỉ phép LR-003 đã bị từ chối",
    message: "Đơn nghỉ phép của bạn bị từ chối. Lý do: Cửa hàng đang thiếu nhân sự trong ca này.",
    time: "2 ngày trước",
    isRead: true,
    navigateUrl: "/requests"
  },
  {
    id: "app-1",
    type: "approval",
    title: "Kết quả duyệt: Bổ sung Check-out",
    message:
      "Ticket của bạn (Ca Sáng, 21/05) đã được duyệt: Hợp lệ hóa do Lỗi hệ thống. Phần Check-out đã được cập nhật thành 12:00. Bạn có thể xem chi tiết trong Lịch sử chấm công.",
    time: "2 phút trước",
    isRead: false,
  },
  {
    id: "app-2",
    type: "approval",
    title: "Kết quả duyệt: Đi trễ",
    message:
      "Ticket của bạn (Ca Tối, 20/05) đã được duyệt: Khấu trừ UT 15 phút và Áp dụng mức phạt Đi trễ 50,000đ.",
    time: "10 phút trước",
    isRead: false,
  },
  {
    id: "ns-1",
    type: "system",
    title: "Ca làm việc đã bị tước (No-show)",
    message:
      "Quản lý đã Handshake thay thế nhân sự cho Ca Chiều (Hôm nay) do bạn No-show quá hạn. Ca này đã bị Hủy trong Lịch làm việc của bạn.",
    time: "Vài giây trước",
    isRead: false,
  },
  {
    id: "sys-1",
    type: "system",
    title: "Tự động gọt giờ (Smart Overlap)",
    message:
      "[Xung đột Lịch] Hệ thống tự động cấn trừ 30 phút (Travel Time) ca Sáng do bạn có ca Tối liền kề lúc 15:00 tại Cầu Giấy.",
    time: "5 phút trước",
    isRead: false,
  },
  {
    id: "sys-2",
    type: "system",
    title: "Phân công khẩn cấp (Chi viện Vận hành)",
    message:
      "Bạn được phân công khẩn cấp vào vị trí 'Kho'. Hành động điều động chéo chuyên môn đã được lưu Audit Log đỏ.",
    time: "20 phút trước",
    isRead: false,
  },
  {
    id: "0",
    type: "system",
    title: "Lịch làm việc tuần sau đã công bố!",
    message:
      "Bạn có 1 ca Điều phối làm việc tại cửa hàng khác (HMK Cầu Giấy). Vui lòng kiểm tra Lịch cá nhân.",
    time: "1 giờ trước",
    isRead: false,
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
    title: "Đơn xin nghỉ phép đã được phê duyệt",
    message: "Đơn nghỉ phép ngày 25/11 của bạn đã được CHT phê duyệt.",
    time: "2 giờ trước",
    isRead: true,
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
      "Nhân viên Minh Tuấn muốn đổi ca Chờ xác nhận của bạn (Thứ 6, 21/11).",
    time: "2 ngày trước",
    isRead: true,
  },
];

export default function Notifications() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { briefings, markBriefingAsRead, acknowledgeBriefing } = useApp();
  
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

      <div className="flex-1 overflow-y-auto w-full bg-gray-50/50">
        {filtered.length > 0 ? (
          <div className="p-4 space-y-3">
            {filtered.map((notification) => (
              <div
                key={notification.id}
                onClick={() => { 
                   handleMarkAsRead(notification.id, notification.type);
                   if (notification.type === "briefing") {
                      setSelectedBriefingId(notification.id);
                   } else if(notification.navigateUrl) {
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
