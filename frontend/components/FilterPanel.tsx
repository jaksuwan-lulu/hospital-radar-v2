'use client';
import { FilterType, FilterStatus } from '../types/hospital';
import { Building2, Shield, LayoutGrid, SlidersHorizontal } from 'lucide-react';

interface Props {
  filterType:     FilterType;
  filterStatus:   FilterStatus;
  onTypeChange:   (t: FilterType)   => void;
  onStatusChange: (s: FilterStatus) => void;
  count:          number;
  radius:         number;
  onRadiusChange: (r: number) => void;
  scope:          'nearby' | 'all';
  onScopeChange:  (s: 'nearby' | 'all') => void;
  error:          string | null;
}

const RADIUS_OPTIONS = [
  { label: '1 กม.', value: 1000 },
  { label: '3 กม.', value: 3000 },
  { label: '5 กม.', value: 5000 },
  { label: '10 กม.', value: 10000 },
  { label: 'ทั่วไทย', value: -1 },
];

export default function FilterPanel({
  filterType, filterStatus, onTypeChange, onStatusChange,
  count, radius, onRadiusChange, scope, onScopeChange, error,
}: Props) {
  const typeOpts: { value: FilterType; label: string; icon: React.ReactNode }[] = [
    { value: 'all',        label: 'ทั้งหมด', icon: <LayoutGrid size={12} /> },
    { value: 'government', label: 'รัฐบาล',  icon: <Shield size={12} />    },
    { value: 'private',    label: 'เอกชน',   icon: <Building2 size={12} /> },
  ];
  const statusOpts: { value: FilterStatus; label: string; dot?: string }[] = [
    { value: 'all',     label: 'ทุกสถานะ' },
    { value: 'open',    label: 'เปิด',    dot: 'bg-[#00ff88]' },
    { value: 'closed',  label: 'ปิด',     dot: 'bg-[#ff4757]' },
    { value: 'unknown', label: 'ไม่ทราบ', dot: 'bg-[#ffd32a]' },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[900] flex flex-col items-center gap-2 pointer-events-none w-full px-4 max-w-md">

      {/* Error banner — mobile: แสดงบนแถบ, desktop: popup */}
      {error && (
        <>
          {/* Mobile */}
          <div className="pointer-events-auto md:hidden w-full flex items-center gap-2 bg-[#ff4757]/20 border border-[#ff4757]/40 text-[#ff4757] text-xs px-3 py-2 rounded-xl backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff4757] flex-shrink-0" />
            {error}
          </div>
          {/* Desktop popup */}
          <div className="pointer-events-auto hidden md:flex items-center gap-2 bg-[#161b22]/95 border border-[#ff4757]/50 text-[#ff4757] text-sm px-4 py-2.5 rounded-xl backdrop-blur shadow-lg shadow-[#ff4757]/10">
            <span className="w-2 h-2 rounded-full bg-[#ff4757] flex-shrink-0" />
            {error}
          </div>
        </>
      )}

      {/* Count badge */}
      <div className="pointer-events-auto bg-[#161b22]/90 backdrop-blur border border-[rgba(255,255,255,0.1)] rounded-full px-3 py-1 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]" style={{ animation: 'blink 2s ease-in-out infinite' }} />
        <span className="text-xs text-white/70 font-mono">{count} โรงพยาบาล</span>
      </div>

      {/* Type filter */}
      <div className="pointer-events-auto flex items-center bg-[#161b22]/90 backdrop-blur border border-[rgba(255,255,255,0.1)] rounded-full p-1 gap-0.5">
        {typeOpts.map(opt => (
          <button key={opt.value} onClick={() => onTypeChange(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterType === opt.value ? 'bg-[#00e5ff] text-[#0d1117]' : 'text-white/50 hover:text-white/80'}`}>
            {opt.icon}{opt.label}
          </button>
        ))}
      </div>

      {/* Status + Radius row */}
      <div className="pointer-events-auto flex items-center gap-2 flex-wrap justify-center">
        {/* Status */}
        <div className="flex items-center bg-[#161b22]/90 backdrop-blur border border-[rgba(255,255,255,0.1)] rounded-full p-1 gap-0.5">
          {statusOpts.map(opt => (
            <button key={opt.value} onClick={() => onStatusChange(opt.value)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${filterStatus === opt.value ? 'bg-white/15 text-white border border-white/20' : 'text-white/50 hover:bg-white/5'}`}>
              {opt.dot && <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Radius selector */}
      <div className="pointer-events-auto flex items-center bg-[#161b22]/90 backdrop-blur border border-[rgba(255,255,255,0.1)] rounded-full p-1 gap-0.5">
        <SlidersHorizontal size={11} className="text-white/40 ml-2 mr-1" />
        {RADIUS_OPTIONS.map(opt => {
          const isActive = opt.value === -1 ? scope === 'all' : (scope === 'nearby' && radius === opt.value);
          return (
            <button key={opt.value}
              onClick={() => {
                if (opt.value === -1) { onScopeChange('all'); }
                else { onScopeChange('nearby'); onRadiusChange(opt.value); }
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? opt.value === -1
                    ? 'bg-[#ff8c00] text-white'
                    : 'bg-[#00e5ff] text-[#0d1117]'
                  : 'text-white/50 hover:text-white/80'
              }`}>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
