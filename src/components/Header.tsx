import React from 'react';
import { useApp } from '@/context/AppContext';
import { Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user } = useApp();
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-40 glass border-b border-slate-100 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative group cursor-pointer" onClick={() => navigate('/profile')}>
          <div className="absolute inset-0 bg-slate-900 rounded-full blur-md opacity-0 group-hover:opacity-20 transition-opacity"></div>
          <img 
            src={user?.avatar} 
            alt="Avatar" 
            className="w-10 h-10 rounded-full object-cover border-[1.5px] border-white shadow-soft relative z-10"
          />
          <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-success border-2 border-white rounded-full z-20"></div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Chào buổi sáng,</p>
          <p className="text-sm font-bold text-slate-900 line-clamp-1">{user?.name}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5">
        <button className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-soft">
          <Search className="w-4 h-4" />
        </button>
        <button 
          onClick={() => navigate('/notifications')}
          className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all active:scale-95 relative shadow-soft"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error border-2 border-white rounded-full"></span>
        </button>
      </div>
    </div>
  );
}
