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
}

export default function HospitalList({ hospitals, onSelect, favorites, onFavorite, isOpen, onToggle }: Props) {
  return (
    <>
      {/* FAB ปุ่มรายการ */}
      <button
        onClick={onToggle}
        className="absolute bottom-6 left-4 z-[900] flex items-center gap-2 bg-[#00e5ff] hover:bg-[#00c8e0] text-[#0d1117] font-bold text-sm px-5 py-3.5 rounded-2xl shadow-lg shadow-[#00e5ff]/25 transition-all hover:scale-[1.02] active:scale-[0.97]"
        style={{ minWidth: 'fit-content' }}
      >
        <span className="text-base leading-none">≡</span>
        รายการ
        <span className="bg-[#0d1117]/20 text-[#0d1117] text-xs font-bold px-1.5 py-0.5 rounded-lg">{hospitals.length}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[840] bg-black/50 backdrop-blur-sm" onClick={onToggle} />

          {/* Sheet — bottom on mobile, left sidebar on md+ */}
          <div className="fixed bottom-0 left-0 right-0 z-[850] md:right-auto md:top-0 md:w-80 md:bottom-0 flex flex-col bg-[#161b22] border-t md:border-t-0 md:border-r border-white/10 shadow-2xl rounded-t-3xl md:rounded-none"
            style={{ maxHeight: '75vh', height: 'auto' }}
          >
            {/* Drag handle (mobile only) */}
            <div className="flex items-center justify-between px-5 pt-3 pb-0 md:pt-4">
              <div className="w-10 h-1 bg-white/20 rounded-full md:hidden mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                <div className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse" />
                <h3 className="font-bold text-white text-sm">โรงพยาบาลใกล้เคียง</h3>
                <span className="text-white/40 text-xs font-mono ml-1">{hospitals.length} แห่ง</span>
              </div>
              <button onClick={onToggle} className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 py-2 mt-2">
              {hospitals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-white/30 text-sm gap-2">
                  <span className="text-2xl">🏥</span>
                  ไม่พบโรงพยาบาลในบริเวณนี้
                </div>
              ) : (
                hospitals.map(h => {
                  const statusColor =
                    h.status === 'open'    ? 'bg-[#00ff88]' :
                    h.status === 'unknown' ? 'bg-[#ffd32a]' : 'bg-[#ff4757]';
                  const statusLabel =
                    h.status === 'open'    ? 'เปิด' :
                    h.status === 'unknown' ? 'ไม่ทราบ' : 'ปิด';
                  return (
                    <div
                      key={h.id}
                      onClick={() => onSelect(h)}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 active:bg-white/10 cursor-pointer transition-colors group border-b border-white/[0.04] last:border-0"
                    >
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate leading-snug">{h.name_th}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`flex items-center gap-0.5 text-xs ${h.type === 'government' ? 'text-blue-400' : 'text-amber-400'}`}>
                            {h.type === 'government' ? <Shield size={9} /> : <Building2 size={9} />}
                            {h.type === 'government' ? 'รัฐบาล' : 'เอกชน'}
                          </span>
                          <span className="text-white/20 text-xs">·</span>
                          <span className={`text-xs font-mono ${
                            h.status === 'open' ? 'text-[#00ff88]' :
                            h.status === 'unknown' ? 'text-[#ffd32a]' : 'text-[#ff4757]'
                          }`}>{statusLabel}</span>
                          {h.distance !== undefined && (
                            <>
                              <span className="text-white/20 text-xs">·</span>
                              <span className="text-[#00e5ff] text-xs font-mono">{formatDistance(h.distance)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); onFavorite(h.id); }}
                        className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                          favorites.has(h.id)
                            ? 'text-[#ff4757] bg-[#ff4757]/10'
                            : 'text-white/20 hover:text-white/60 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Heart size={14} fill={favorites.has(h.id) ? 'currentColor' : 'none'} />
                      </button>
                      <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 flex-shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
