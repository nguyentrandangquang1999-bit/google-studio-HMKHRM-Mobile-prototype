import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Mail,
  Phone,
  Calendar,
  Wallet,
  Bell,
  Moon,
  Languages,
  Shield,
  LogOut,
  ChevronRight,
  Lock,
  AlertTriangle,
} from "lucide-react";

export default function Profile() {
  const { user, logout } = useApp();
  const [showPayroll, setShowPayroll] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Header Profile */}
      <div className="bg-white relative pb-8 border-b-2 border-gray-100">
        <div className="h-32 bg-gray-900"></div>
        <div className="px-5 flex flex-col items-center -mt-12 relative z-10">
          <img
            src={user?.avatar}
            alt="Profile"
            className="w-24 h-24 rounded-full border-4 border-white shadow-md mb-3 object-cover bg-gray-100"
          />
          <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
          <p className="text-sm font-medium text-gray-500 mb-2">{user?.role}</p>
          <div className="bg-gray-100 border border-gray-200 px-4 py-1.5 rounded-full text-xs font-bold text-gray-700 tracking-wide mt-1">
            ID: {user?.employeeId}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Skill Portfolio */}
        <section className="bg-white rounded-xl p-5 shadow-sm border-2 border-gray-100">
          <h2 className="text-xs font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center justify-between">
            <span>Danh mục Kỹ năng</span>
            <span className="bg-gray-50 text-gray-600 text-[10px] px-2.5 py-1 rounded-full border border-gray-200 track-normal normal-case font-bold">
              {user?.skills.length} Tags
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {user?.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold rounded-lg shadow-sm"
              >
                {skill}
              </span>
            ))}
            {user?.skills.length === 0 && (
              <p className="text-xs text-gray-400 italic">
                Chưa có kỹ năng nào được cập nhật.
              </p>
            )}
          </div>
        </section>

        {/* Tracking Đào tạo */}
        <section className="bg-white rounded-xl p-5 shadow-sm border-2 border-gray-100">
          <h2 className="text-xs font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center justify-between">
            <span>Tiến độ Đào tạo</span>
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-0.5">
                  An toàn Vệ sinh thực phẩm
                </h3>
                <div className="flex justify-between items-center mt-1.5">
                  <p className="text-xs font-medium text-gray-500">
                    Hoàn thành: 100%
                  </p>
                  <p className="text-[10px] font-bold text-green-700 border border-green-200 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Đạt
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-red-50/50 p-3 -mx-3 rounded-xl border border-red-100 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 border border-red-200 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-600 mb-0.5">
                  Nghiệp vụ Pha chế Nâng cao
                </h3>
                <div className="flex justify-between items-center mt-1.5">
                  <p className="text-[11px] text-red-500 font-medium">
                    Chứng chỉ sắp hết hạn!
                  </p>
                  <p className="text-[10px] font-bold text-white bg-red-500 px-2 py-1 rounded border border-red-600 uppercase tracking-wide shadow-sm shadow-red-500/20">
                    Còn 12 ngày
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Personal Info */}
        <section className="bg-white rounded-xl p-5 shadow-sm border-2 border-gray-100">
          <h2 className="text-xs font-bold text-gray-900 mb-5 uppercase tracking-wide">
            Thông tin liên hệ
          </h2>
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 tracking-wide uppercase mb-0.5">
                  Số điện thoại
                </p>
                <p className="text-sm font-bold text-gray-900">0987 654 321</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 tracking-wide uppercase mb-0.5">
                  Email công ty
                </p>
                <p className="text-sm font-bold text-gray-900">
                  nguyen.vana@company.com
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 tracking-wide uppercase mb-0.5">
                  Ngày vào làm
                </p>
                <p className="text-sm font-bold text-gray-900">15/04/2023</p>
              </div>
            </div>
          </div>
        </section>

        {/* Secure Wallet */}
        <section>
          <button
            onClick={() => setShowPayroll(!showPayroll)}
            className="w-full bg-white border-2 border-gray-100 rounded-xl p-5 flex items-center shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mr-4 group-hover:bg-white transition-colors">
              <Wallet className="w-6 h-6 text-gray-900" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-gray-900 text-sm">
                Ví lương (Payroll)
              </h3>
              <p className="text-xs font-medium text-gray-500 mt-0.5">
                Yêu cầu xác thực bảo mật
              </p>
            </div>
            <Lock className="w-5 h-5 text-gray-400" />
          </button>
        </section>

        {/* Settings */}
        <section className="bg-white rounded-xl shadow-sm border-2 border-gray-100 overflow-hidden">
          <h2 className="text-xs font-bold text-gray-900 p-5 pb-2 uppercase tracking-wide border-b-2 border-gray-50">
            Cài đặt
          </h2>
          <div className="flex flex-col">
            <button className="flex items-center px-5 py-4 hover:bg-gray-50 transition-colors border-b-2 border-gray-50 last:border-b-0">
              <Bell className="w-5 h-5 text-gray-400 mr-4 shrink-0" />
              <span className="flex-1 text-left text-sm font-bold text-gray-700">
                Cài đặt thông báo
              </span>
              <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
            </button>
            <button className="flex items-center px-5 py-4 hover:bg-gray-50 transition-colors border-b-2 border-gray-50 last:border-b-0">
              <Moon className="w-5 h-5 text-gray-400 mr-4 shrink-0" />
              <span className="flex-1 text-left text-sm font-bold text-gray-700">
                Chế độ tối
              </span>
              <div className="w-11 h-6 bg-gray-200 rounded-full relative shrink-0">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </button>
            <button className="flex items-center px-5 py-4 hover:bg-gray-50 transition-colors border-b-2 border-gray-50 last:border-b-0">
              <Languages className="w-5 h-5 text-gray-400 mr-4 shrink-0" />
              <span className="flex-1 text-left text-sm font-bold text-gray-700">
                Ngôn ngữ
              </span>
              <span className="text-xs font-bold text-gray-500 mr-2 bg-gray-100 px-2 py-0.5 rounded">
                Tiếng Việt
              </span>
              <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
            </button>
            <button className="flex items-center px-5 py-4 hover:bg-gray-50 transition-colors border-b-2 border-gray-50 last:border-b-0">
              <Shield className="w-5 h-5 text-gray-400 mr-4 shrink-0" />
              <span className="flex-1 text-left text-sm font-bold text-gray-700">
                Đổi mật khẩu
              </span>
              <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
            </button>
          </div>
        </section>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full mt-4 bg-white border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold py-4 rounded-xl transition-all flex items-center justify-center active:scale-95 mb-8 shadow-sm"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Đăng xuất
        </button>

        <p className="text-center text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-8 pb-4">
          Phiên bản 2.1.0 • Build 345
        </p>
      </div>
    </div>
  );
}
