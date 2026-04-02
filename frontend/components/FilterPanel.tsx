'use client';
import { FilterType, FilterStatus } from '../types/hospital';
import { Building2, Shield, LayoutGrid } from 'lucide-react';

interface Props {
  filterType:     FilterType;
  filterStatus:   FilterStatus;
  onTypeChange:   (t: FilterType)   => void;
  onStatusChange: (s: FilterStatus) => void;
  count:          number;
}

export default function FilterPanel({ filterType, filterStatus, onTypeChange, onStatusChange, count }: Props) {
  const typeOpts: { value: FilterType; label: string; icon: React.ReactNode }[] = [
    { value: 'all',        label: 'ทั้งหมด', icon: <LayoutGrid size={12} /> },
    { value: 'government', label: 'รัฐบาล',  icon: <Shield size={12} />    },
    { value: 'private',    label: 'เอกชน',   icon: <Building2 size={12} /> },
  ];

  const statusOpts: { value: FilterStatus; label: string; dot?: string }[] = [
    { value: 'all',     label: 'ทุกสถานะ' },
    { value: 'open',    label: 'เปิด',       dot: 'bg-[#00ff88]' },
    { value: 'closed',  label: 'ปิด',        dot: 'bg-[#ff4757]' },
    { value: 'unknown', label: 'ไม่ทราบ',    dot: 'bg-[#ffd32a]' },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[900] flex flex-col items-center gap-2 pointer-events-none">
      <div className="pointer-events-auto bg-[#161b22]/90 backdrop-blur border border-[rgba(255,255,255,0.1)] rounded-full px-3 py-1 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]" style={{ animation: 'blink 2s ease-in-out infinite' }} />
        <span className="text-xs text-white/70 font-mono">{count} โรงพยาบาล</span>
      </div>

      <div className="pointer-events-auto flex items-center bg-[#161b22]/90 backdrop-blur border border-[rgba(255,255,255,0.1)] rounded-full p-1 gap-0.5">
        {typeOpts.map(opt => (
          <button key={opt.value} onClick={() => onTypeChange(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterType === opt.value ? 'bg-[#00e5ff] text-[#0d1117]' : 'text-white/50 hover:text-white/80'}`}>
            {opt.icon}{opt.label}
          </button>
        ))}
      </div>

      <div className="pointer-events-auto flex items-center bg-[#161b22]/90 backdrop-blur border border-[rgba(255,255,255,0.1)] rounded-full p-1 gap-0.5">
        {statusOpts.map(opt => (
          <button key={opt.value} onClick={() => onStatusChange(opt.value)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${filterStatus === opt.value ? 'bg-white/15 text-white border border-white/20' : 'text-white/50 hover:bg-white/5'}`}>
            {opt.dot && <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
