'use client';
import { Hospital } from '../types/hospital';
import { formatDistance } from '../lib/utils';
import { Heart, ChevronRight, Shield, Building2, Clock } from 'lucide-react';

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
      <button
        onClick={onToggle}
        className="absolute bottom-6 left-4 z-[900] flex items-center gap-2 bg-[#00e5ff] hover:bg-[#00c8e0] text-[#0d1117] font-bold text-sm px-4 py-3 rounded-2xl shadow-lg shadow-[#00e5ff]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <span className="text-xs">≡</span>
        รายการ ({hospitals.length})
      </button>

      {isOpen && (
        <div className="absolute bottom-0 left-0 z-[850] w-full md:w-80 md:top-0 md:bottom-0">
          <div className="fixed inset-0 bg-black/40 md:hidden" onClick={onToggle} />
          <div className="relative bg-[#161b22] md:h-full w-full max-h-[70vh] md:max-h-none rounded-t-3xl md:rounded-none border-t md:border-t-0 md:border-r border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 md:hidden" />

            <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00e5ff]" style={{ animation: 'blink 2s ease-in-out infinite' }} />
                <h3 className="font-bold text-white">โรงพยาบาลใกล้เคียง</h3>
                <span className="ml-auto text-xs text-white/40 font-mono">{hospitals.length} แห่ง</span>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 py-2">
              {hospitals.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-white/30 text-sm">ไม่พบโรงพยาบาลในบริเวณนี้</div>
              ) : (
                hospitals.map(h => {
                  const statusColor = h.status === 'open' ? 'bg-[#00ff88]' : h.status === 'unknown' ? 'bg-[#ffd32a]' : 'bg-[#ff4757]';
                  return (
                    <div
                      key={h.id}
                      onClick={() => onSelect(h)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors group border-b border-[rgba(255,255,255,0.04)] last:border-0"
                    >
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{h.name_th}</p>
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
                      <button
                        onClick={e => { e.stopPropagation(); onFavorite(h.id); }}
                        className={`p-1.5 rounded-lg transition-all ${favorites.has(h.id) ? 'text-[#ff4757]' : 'text-white/20 hover:text-white/50 opacity-0 group-hover:opacity-100'}`}
                      >
                        <Heart size={13} fill={favorites.has(h.id) ? 'currentColor' : 'none'} />
                      </button>
                      <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 flex-shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
