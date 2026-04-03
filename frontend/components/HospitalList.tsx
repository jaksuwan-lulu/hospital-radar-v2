'use client';
import { Hospital } from '../types/hospital';
import { formatDistance } from '../lib/utils';
import { Heart, ChevronRight, Shield, Building2, Clock, X } from 'lucide-react';

interface Props {
  hospitals:   Hospital[];
  onSelect:    (h: Hospital) => void;
  favorites:   Set<string>;
  onFavorite:  (id: string) => void;
  isOpen:      boolean;
  onToggle:    () => void;
  isLoggedIn:  boolean;
}

export default function HospitalList({ hospitals, onSelect, favorites, onFavorite, isOpen, onToggle, isLoggedIn }: Props) {
  return (
    <>
      {/* ปุ่มเปิด list — safe area bottom สำหรับมือถือ */}
      <button
        onClick={onToggle}
        className="absolute bottom-6 left-4 z-[950] flex items-center gap-2 bg-[#00e5ff] hover:bg-[#00c8e0] active:scale-[0.97] text-[#0d1117] font-bold text-sm px-5 py-3.5 rounded-2xl shadow-lg shadow-[#00e5ff]/20 transition-all"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <span className="text-base leading-none">≡</span>
        รายการ ({hospitals.length})
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[960] flex items-end md:items-stretch md:justify-start pointer-events-none">
          <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={onToggle} />

          <div className="
            relative pointer-events-auto
            w-full md:w-80
            bg-[#161b22]
            rounded-t-3xl md:rounded-none
            border-t md:border-t-0 md:border-r border-[rgba(255,255,255,0.08)]
            shadow-2xl flex flex-col
          "
          style={{ maxHeight: 'calc(75vh - env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 md:hidden flex-shrink-0" />

            <div className="flex items-center gap-2 px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-[#00e5ff]" style={{ animation: 'blink 2s ease-in-out infinite' }} />
              <h3 className="font-bold text-white flex-1">โรงพยาบาลใกล้เคียง</h3>
              <span className="text-xs text-white/40 font-mono mr-2">{hospitals.length} แห่ง</span>
              <button onClick={onToggle} className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white/70 transition-colors">
                <X size={14} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-2">
              {hospitals.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-white/30 text-sm">ไม่พบโรงพยาบาลในบริเวณนี้</div>
              ) : (
                hospitals.map(h => {
                  const isFav = favorites.has(h.id);
                  const statusColor = h.status === 'open' ? 'bg-[#00ff88]' : h.status === 'unknown' ? 'bg-[#ffd32a]' : 'bg-[#ff4757]';
                  return (
                    <div
                      key={h.id}
                      onClick={() => onSelect(h)}
                      className={`flex items-center gap-3 px-4 py-3.5 active:bg-white/10 cursor-pointer transition-colors group border-b border-[rgba(255,255,255,0.04)] last:border-0 ${isFav ? 'bg-[#ff4757]/5' : 'hover:bg-white/5'}`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColor}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isFav && <span className="text-[#ff4757] text-xs flex-shrink-0">❤️</span>}
                          <p className="text-white text-sm font-medium truncate">{h.name_th}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`flex items-center gap-0.5 text-xs ${h.type === 'government' ? 'text-blue-400' : 'text-amber-400'}`}>
                            {h.type === 'government' ? <Shield size={9} /> : <Building2 size={9} />}
                            {h.type === 'government' ? 'รัฐบาล' : 'เอกชน'}
                          </span>
                          {h.distance !== undefined && (
                            <>
                              <span className="text-white/20">·</span>
                              <span className="text-[#00e5ff] text-xs font-mono">{formatDistance(h.distance)}</span>
                            </>
                          )}
                          {h.opening_hours && (
                            <>
                              <span className="text-white/20">·</span>
                              <Clock size={9} className="text-white/30" />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Favorite — แสดงเฉพาะ login */}
                      {isLoggedIn && (
                        <button
                          onClick={e => { e.stopPropagation(); onFavorite(h.id); }}
                          className={`p-2.5 rounded-xl transition-all active:scale-90 flex-shrink-0 ${
                            isFav
                              ? 'text-[#ff4757] bg-[#ff4757]/10'
                              : 'text-white/25 hover:text-white/60 md:opacity-0 md:group-hover:opacity-100'
                          }`}
                        >
                          <Heart size={15} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                      )}
                      <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 flex-shrink-0" />
                    </div>
                  );
                })
              )}
            </div>

            {!isLoggedIn && (
              <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.06)] flex-shrink-0">
                <p className="text-white/30 text-xs text-center">เข้าสู่ระบบด้วย LINE เพื่อบันทึก Favorite</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
