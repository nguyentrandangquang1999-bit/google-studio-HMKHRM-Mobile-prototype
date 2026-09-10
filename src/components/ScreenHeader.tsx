import React from 'react';

interface ScreenHeaderProps {
  title: string;
  description: string;
  className?: string;
  rightAction?: React.ReactNode;
}

export default function ScreenHeader({
  title,
  description,
  className = '',
  rightAction,
}: ScreenHeaderProps) {
  return (
    <div className={`px-4 pt-4 pb-2 flex items-start justify-between ${className}`}>
      <div>
        <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-tight font-display">
          {title}
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5 leading-snug">
          {description}
        </p>
      </div>
      {rightAction && <div className="shrink-0 ml-3 pt-0.5">{rightAction}</div>}
    </div>
  );
}
