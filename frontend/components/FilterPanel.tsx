'use client';
import { FilterType, FilterStatus } from '../types/hospital';
import { Building2, Shield, LayoutGrid, ChevronLeft, ChevronRight, Globe, MapPin } from 'lucide-react';

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
  isOpen:         boolean;
  onToggle:       () => void;
}

const RADIUS_STEPS = [500, 1000, 2000, 3000, 5000, 7000, 10000, 15000, 20000];

function formatRadius(m: number) {
  if (m < 1000) return `${m} ม.`;
  return `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1)} กม.`;
}

export default function FilterPanel({
  filterType, filterStatus, onTypeChange, onStatusChange,
  count, radius, onRadiusChange, scope, onScopeChange,
  error, isOpen, onToggle,
}: Props) {
  const typeOpts: { value: FilterType; label: string; icon: React.ReactNode }[] = [
    { value: 'all',        label: 'ทั้งหมด', icon: <LayoutGrid size={13} /> },
    { value: 'government', label: 'รัฐบาล',  icon: <Shield size={13} />    },
    { value: 'private',    label: 'เอกชน',   icon: <Building2 size={13} /> },
  ];
  const statusOpts: { value: FilterStatus; label: string; dot?: string }[] = [
    { value: 'all',     label: 'ทุกสถานะ' },
    { value: 'open',    label: 'เปิด',    dot: 'bg-[#00ff88]' },
    { value: 'closed',  label: 'ปิด',     dot: 'bg-[#ff4757]' },
    { value: 'unknown', label: 'ไม่ทราบ', dot: 'bg-[#ffd32a]' },
  ];

  const stepIdx    = RADIUS_STEPS.indexOf(radius);
  const canDec     = scope === 'nearby' && stepIdx > 0;
  const canInc     = scope === 'nearby' && stepIdx < RADIUS_STEPS.length - 1;
  const pct        = scope === 'nearby' ? (stepIdx / (RADIUS_STEPS.length - 1)) * 100 : 100;

  return (
    <>
      {/* Burger toggle button — ใต้ header ซ้ายบน */}
      <button
        onClick={onToggle}
        className="absolute top-14 left-4 z-[900] w-9 h-9 flex items-center justify-center bg-[#161b22]/90 backdrop-blur border border-[rgba(255,255,255,0.12)] rounded-xl hover:border-[#00e5ff]/40 text-white/60 hover:text-[#00e5ff] transition-all active:scale-90"
        title="เมนูตัวกรอง"
      >
        <div className="flex flex-col gap-[4px] items-center">
          <span className={`block h-[2px] bg-current rounded-full transition-all duration-200 ${isOpen ? 'w-4 rotate-45 translate-y-[6px]' : 'w-4'}`} />
          <span className={`block h-[2px] bg-current rounded-full transition-all duration-200 ${isOpen ? 'opacity-0 w-0' : 'w-3'}`} />
          <span className={`block h-[2px] bg-current rounded-full transition-all duration-200 ${isOpen ? 'w-4 -rotate-45 -translate-y-[6px]' : 'w-4'}`} />
        </div>
      </button>

      {/* Count badge — กลางบน */}
      <div className="absolute top-[58px] left-1/2 -translate-x-1/2 z-[800] pointer-events-none">
        <div className="bg-[#161b22]/90 backdrop-blur border border-[rgba(255,255,255,0.1)] rounded-full px-3 py-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]" style={{ animation: 'blink 2s ease-in-out infinite' }} />
          <span className="text-xs text-white/70 font-mono">{count} โรงพยาบาล</span>
        </div>
      </div>

      {/* Sidebar panel */}
      <div className={`
        fixed top-0 left-0 h-full z-[910] flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* backdrop (mobile) */}
        {isOpen && (
          <div className="fixed inset-0 bg-black/40 z-[-1] md:hidden" onClick={onToggle} />
        )}

        <div className="h-full w-72 bg-[#0d1117]/95 backdrop-blur-xl border-r border-[rgba(255,255,255,0.08)] flex flex-col shadow-2xl shadow-black/60 overflow-y-auto">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#00e5ff]/15 border border-[#00e5ff]/30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-[#00e5ff]" />
              </div>
              <span className="text-white font-bold text-sm">ตัวกรอง</span>
            </div>
            <button onClick={onToggle} className="text-white/30 hover:text-white/70 transition-colors p-1">
              <ChevronLeft size={16} />
            </button>
          </div>

          <div className="flex-1 px-4 py-5 space-y-6">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-[#ff4757]/15 border border-[#ff4757]/30 text-[#ff4757] text-xs px-3 py-2.5 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff4757] flex-shrink-0" />
                {error}
              </div>
            )}

            {/* ─── ประเภท ─────────────────────── */}
            <div>
              <p className="text-white/40 text-xs font-mono uppercase tracking-wider mb-2.5">ประเภท</p>
              <div className="flex flex-col gap-1.5">
                {typeOpts.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onTypeChange(opt.value)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      filterType === opt.value
                        ? 'bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                    {filterType === opt.value && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00e5ff]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── สถานะ ──────────────────────── */}
            <div>
              <p className="text-white/40 text-xs font-mono uppercase tracking-wider mb-2.5">สถานะ</p>
              <div className="flex flex-col gap-1.5">
                {statusOpts.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onStatusChange(opt.value)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      filterStatus === opt.value
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {opt.dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />}
                    {!opt.dot && <span className="w-2 h-2 rounded-full border border-white/20 flex-shrink-0" />}
                    {opt.label}
                    {filterStatus === opt.value && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── ระยะทาง ────────────────────── */}
            <div>
              <p className="text-white/40 text-xs font-mono uppercase tracking-wider mb-2.5">ระยะค้นหา</p>

              {/* Scope toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => onScopeChange('nearby')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    scope === 'nearby'
                      ? 'bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30'
                      : 'text-white/40 hover:text-white/60 border border-white/10'
                  }`}
                >
                  <MapPin size={11} /> ใกล้เคียง
                </button>
                <button
                  onClick={() => onScopeChange('all')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    scope === 'all'
                      ? 'bg-[#ff8c00]/15 text-[#ff8c00] border border-[#ff8c00]/30'
                      : 'text-white/40 hover:text-white/60 border border-white/10'
                  }`}
                >
                  <Globe size={11} /> ทั่วไทย
                </button>
              </div>

              {/* Slider + ปุ่ม (เฉพาะ scope=nearby) */}
              {scope === 'nearby' && (
                <div className="space-y-3">
                  {/* ปุ่ม ลด / เพิ่ม + แสดงค่า */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => canDec && onRadiusChange(RADIUS_STEPS[stepIdx - 1])}
                      disabled={!canDec}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-[#00e5ff] font-bold text-lg font-mono">{formatRadius(radius)}</span>
                    </div>
                    <button
                      onClick={() => canInc && onRadiusChange(RADIUS_STEPS[stepIdx + 1])}
                      disabled={!canInc}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* Progress bar แบบเลื่อนได้ */}
                  <div className="relative h-6 flex items-center">
                    <div className="absolute inset-x-0 h-1.5 bg-white/10 rounded-full" />
                    <div
                      className="absolute left-0 h-1.5 bg-[#00e5ff] rounded-full transition-all duration-200"
                      style={{ width: `${pct}%` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={RADIUS_STEPS.length - 1}
                      value={stepIdx === -1 ? 0 : stepIdx}
                      onChange={e => onRadiusChange(RADIUS_STEPS[+e.target.value])}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-6"
                    />
                    {/* Thumb */}
                    <div
                      className="absolute w-4 h-4 rounded-full bg-[#00e5ff] border-2 border-white shadow-lg shadow-[#00e5ff]/30 transition-all duration-200 -translate-x-1/2"
                      style={{ left: `${pct}%` }}
                    />
                  </div>

                  {/* Min/Max labels */}
                  <div className="flex justify-between text-[10px] text-white/30 font-mono px-0.5">
                    <span>500 ม.</span>
                    <span>20 กม.</span>
                  </div>
                </div>
              )}

              {scope === 'all' && (
                <div className="flex items-center gap-2 bg-[#ff8c00]/10 border border-[#ff8c00]/20 rounded-xl px-3 py-2.5">
                  <Globe size={13} className="text-[#ff8c00] flex-shrink-0" />
                  <p className="text-[#ff8c00]/80 text-xs">แสดงโรงพยาบาลทั่วประเทศไทย</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-[rgba(255,255,255,0.06)] flex-shrink-0">
            <p className="text-white/20 text-[10px] text-center font-mono">Hospital Radar v2 • OSM Data</p>
          </div>
        </div>
      </div>
    </>
  );
}