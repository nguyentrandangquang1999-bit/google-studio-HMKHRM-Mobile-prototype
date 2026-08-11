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
    <div className="bg-surface border-t border-gray-100 px-4 py-2 pb-safe absolute bottom-0 w-full flex justify-between items-center z-50">
      {tabs.map((tab) => (
        <NavLink
          key={tab.id}
          to={tab.path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center p-2 rounded-md transition-colors duration-200 relative w-16",
              isActive ? "text-primary" : "text-text-muted hover:bg-gray-50"
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="bubble"
                  className="absolute inset-0 bg-primary-light rounded-md -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
