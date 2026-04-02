'use client';
import { Hospital } from '../types/hospital';
import { formatDistance, getGoogleMapsUrl } from '../lib/utils';
import { X, Phone, MapPin, Heart, Navigation, Building2, Shield, Zap, Clock, Info } from 'lucide-react';

interface Props {
  hospital:    Hospital | null;
  onClose:     () => void;
  onFavorite:  (id: string) => void;
  favorites:   Set<string>;
  isLoggedIn:  boolean;
}

export default function HospitalDetail({ hospital, onClose, onFavorite, favorites, isLoggedIn }: Props) {
  if (!hospital) return null;

  const isFav = favorites.has(hospital.id);
  const isGov = hospital.type === 'government';

  const statusConfig = {
    open:    { label: 'เปิดให้บริการ', color: 'text-[#00ff88]', bg: 'bg-[#00ff88]/15', border: 'border-[#00ff88]/30', dot: 'bg-[#00ff88] animate-blink' },
    closed:  { label: 'ปิดให้บริการ',  color: 'text-[#ff4757]', bg: 'bg-[#ff4757]/15', border: 'border-[#ff4757]/30', dot: 'bg-[#ff4757]' },
    unknown: { label: 'เปิดให้บริการ *โดยประมาณ', color: 'text-[#00ff88]', bg: 'bg-[#00ff88]/10', border: 'border-[#00ff88]/20', dot: 'bg-[#00ff88]' },
  }[hospital.status];

  return (
    <div className="fixed inset-0 z-[970] flex items-end md:items-stretch md:justify-end pointer-events-none">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto md:hidden" onClick={onClose} />

      {/* panel */}
      <div className="
        relative pointer-events-auto
        w-full md:w-96
        max-h-[85vh] md:max-h-none md:h-full
        bg-[#161b22]
        rounded-t-3xl md:rounded-none
        border-t md:border-t-0 md:border-l border-[rgba(255,255,255,0.08)]
        overflow-y-auto flex flex-col
        shadow-2xl shadow-black/80
      ">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 md:hidden flex-shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-0 flex-shrink-0">
          <div className="flex-1 pr-3">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isGov ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
                {isGov ? <Shield size={10} /> : <Building2 size={10} />}
                {isGov ? 'รัฐบาล' : 'เอกชน'}
              </span>
              {hospital.emergency && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                  <Zap size={10} /> ER
                </span>
              )}
            </div>
            <h2 className="text-white font-bold text-lg leading-tight">{hospital.name_th}</h2>
            {hospital.name !== hospital.name_th && (
              <p className="text-white/50 text-sm mt-0.5">{hospital.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* favorite button เฉพาะ login */}
            {isLoggedIn && (
              <button
                onClick={() => onFavorite(hospital.id)}
                className={`p-2 rounded-xl transition-all active:scale-90 ${isFav ? 'bg-[#ff4757]/20 text-[#ff4757] border border-[#ff4757]/30' : 'bg-white/5 text-white/40 border border-white/10 hover:text-white/70'}`}
              >
                <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-white/40 border border-white/10 hover:text-white/70 transition-colors active:scale-90">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Distance */}
        {hospital.distance !== undefined && (
          <div className="mx-5 mt-4 bg-[#1c2128] rounded-xl p-3 text-center border border-[rgba(255,255,255,0.06)] flex-shrink-0">
            <p className="text-[#00e5ff] font-bold text-2xl font-mono">{formatDistance(hospital.distance)}</p>
            <p className="text-white/40 text-xs mt-0.5">ระยะทางจากคุณ</p>
          </div>
        )}

        {/* Opening hours หรือ note เมื่อไม่มีข้อมูล */}
        {hospital.opening_hours ? (
          <div className="flex items-center gap-3 mx-5 mt-3 bg-[#1c2128] rounded-xl p-3 border border-[rgba(255,255,255,0.06)] flex-shrink-0">
            <Clock size={15} className="text-white/40 flex-shrink-0" />
            <p className="text-white/70 text-sm font-mono">{hospital.opening_hours}</p>
          </div>
        ) : (
          <div className="flex items-start gap-3 mx-5 mt-3 bg-[#1c2128] rounded-xl p-3 border border-[rgba(255,255,255,0.06)] flex-shrink-0">
            <Info size={14} className="text-white/30 flex-shrink-0 mt-0.5" />
            <p className="text-white/40 text-xs leading-relaxed">ไม่มีข้อมูลเวลาทำการจาก OSM — สถานะข้างต้นเป็นการประมาณจากประเภทโรงพยาบาล</p>
          </div>
        )}

        {/* Info */}
        <div className="mx-5 mt-3 space-y-3 flex-shrink-0">
          {hospital.address && (
            <div className="flex items-start gap-3 bg-[#1c2128] rounded-xl p-3 border border-[rgba(255,255,255,0.06)]">
              <MapPin size={16} className="text-white/40 mt-0.5 flex-shrink-0" />
              <p className="text-white/70 text-sm leading-relaxed">{hospital.address}</p>
            </div>
          )}
          {hospital.phone && (
            <div className="flex items-center gap-3 bg-[#1c2128] rounded-xl p-3 border border-[rgba(255,255,255,0.06)]">
              <Phone size={16} className="text-white/40 flex-shrink-0" />
              <a href={`tel:${hospital.phone}`} className="text-[#00e5ff] text-sm hover:underline">{hospital.phone}</a>
            </div>
          )}
        </div>

        {/* Navigate — sticky bottom */}
        <div className="sticky bottom-0 mx-5 mt-4 mb-6 pt-2 bg-[#161b22] flex-shrink-0">
          <a
            href={getGoogleMapsUrl(hospital.lat, hospital.lng, hospital.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#00e5ff] hover:bg-[#00c8e0] text-[#0d1117] font-bold text-base py-4 px-4 rounded-2xl transition-all duration-200 active:scale-[0.97] shadow-lg shadow-[#00e5ff]/20"
          >
            <Navigation size={18} />
            นำทางไปโรงพยาบาล
          </a>
        </div>
      </div>
    </div>
  );
}
