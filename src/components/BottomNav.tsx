import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, MapPin, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

const tabs = [
  { id: 'home', icon: Home, label: 'Trang chủ', path: '/' },
  { id: 'schedule', icon: CalendarDays, label: 'Lịch làm', path: '/schedule' },
  { id: 'attendance', icon: MapPin, label: 'Chấm công', path: '/attendance' },
  { id: 'requests', icon: FileText, label: 'Yêu cầu', path: '/requests' },
  { id: 'profile', icon: User, label: 'Cá nhân', path: '/profile' },
];

export default function BottomNav() {
  return (
    <div className="bg-white border-t border-slate-200/80 px-3 py-2 pb-safe absolute bottom-0 w-full flex justify-between items-center z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      {tabs.map((tab) => (
        <NavLink
          key={tab.id}
          to={tab.path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center py-1.5 px-2 rounded-xl transition-all duration-200 relative w-16",
              isActive ? "text-primary font-bold" : "text-slate-400 hover:text-slate-600"
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="bubble"
                  className="absolute inset-0 bg-[#F0F6FA] border border-[#558BAD]/20 rounded-xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon className="w-5 h-5 mb-1" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] tracking-tight whitespace-nowrap">
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
