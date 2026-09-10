import React from "react";
import ScreenHeader from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import {
  Mail,
  Phone,
  Calendar,
  Bell,
  Moon,
  Languages,
  Shield,
  LogOut,
  ChevronRight,
  Store,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";

export default function Profile() {
  const { user, logout } = useApp();

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <ScreenHeader
        title="Profile"
        description="Manage your personal information and preferences"
      />

      {/* Header Profile */}
      <div className="bg-white relative pb-8 border-b-2 border-gray-100">
        <div className="h-32 bg-gradient-to-r from-[#416C87] to-[#558BAD]"></div>
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

        {/* Thông tin liên hệ & Đơn vị (2 columns) */}
        <section className="bg-white rounded-xl p-5 shadow-sm border-2 border-gray-100">
          <h2 className="text-xs font-bold text-gray-900 mb-4 uppercase tracking-wide">
            Thông tin liên hệ & Chi nhánh
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Số điện thoại */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-[#558BAD] shadow-xs mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Số điện thoại
                </p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user?.phone || "0987 654 321"}
                </p>
              </div>
            </div>

            {/* Email công ty */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-[#558BAD] shadow-xs mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Email công ty
                </p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user?.email || "my.duong@hmkoptics.com"}
                </p>
              </div>
            </div>

            {/* Chi nhánh làm việc chính */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-[#558BAD] shadow-xs mt-0.5">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Chi nhánh làm việc chính
                </p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user?.mainBranch || user?.department || "HMK Nguyễn Trãi"}
                </p>
              </div>
            </div>

            {/* Số điện thoại chi nhánh */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-[#558BAD] shadow-xs mt-0.5">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Số điện thoại chi nhánh
                </p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user?.branchPhone || "028 7300 6886"}
                </p>
              </div>
            </div>

            {/* Ngày vào làm */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-[#558BAD] shadow-xs mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Ngày vào làm
                </p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user?.joinDate || "15/04/2023"}
                </p>
              </div>
            </div>

            {/* Chi nhánh được phân quyền */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-[#558BAD] shadow-xs mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Chi nhánh được phân quyền
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(user?.authorizedBranches || ["HMK Nguyễn Trãi", "HMK Cầu Giấy", "HMK Thủ Đức"]).map((branch, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-white border border-[#558BAD]/30 text-[#558BAD] text-xs font-bold rounded-md shadow-2xs"
                    >
                      {branch}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
