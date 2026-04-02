'use client';
import { Hospital } from '../types/hospital';
import { formatDistance, getGoogleMapsUrl } from '../lib/utils';
import { X, Phone, MapPin, Heart, Navigation, Building2, Shield, Zap, Clock } from 'lucide-react';

interface Props {
  hospital: Hospital | null;
  onClose: () => void;
  onFavorite: (id: string) => void;
  favorites: Set<string>;
}

export default function HospitalDetail({ hospital, onClose, onFavorite, favorites }: Props) {
  if (!hospital) return null;

  const isFav  = favorites.has(hospital.id);
  const isOpen = hospital.status === 'open';
  const isGov  = hospital.type === 'government';

  const statusConfig = {
    open:    { label: 'เปิดให้บริการ', color: 'text-[#00ff88]', bg: 'bg-[#00ff88]/15', border: 'border-[#00ff88]/30', dot: 'bg-[#00ff88] animate-blink' },
    closed:  { label: 'ปิดให้บริการ',  color: 'text-[#ff4757]', bg: 'bg-[#ff4757]/15', border: 'border-[#ff4757]/30', dot: 'bg-[#ff4757]' },
    unknown: { label: 'ไม่ทราบเวลา',   color: 'text-[#ffd32a]', bg: 'bg-[#ffd32a]/15', border: 'border-[#ffd32a]/30', dot: 'bg-[#ffd32a]' },
  }[hospital.status];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[900] md:bottom-auto md:top-0 md:right-0 md:left-auto md:h-full">
      <div className="fixed inset-0 bg-black/40 md:hidden" onClick={onClose} />

      <div className="relative bg-[#161b22] md:w-96 w-full md:h-full rounded-t-3xl md:rounded-none border-t md:border-t-0 md:border-l border-[rgba(255,255,255,0.08)] overflow-y-auto flex flex-col shadow-2xl shadow-black/80">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 md:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-0">
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
            <p className="text-white/50 text-sm mt-0.5">{hospital.name}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onFavorite(hospital.id)}
              className={`p-2 rounded-xl transition-all ${isFav ? 'bg-[#ff4757]/20 text-[#ff4757] border border-[#ff4757]/30' : 'bg-white/5 text-white/40 border border-white/10 hover:text-white/70'}`}
            >
              <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-white/40 border border-white/10 hover:text-white/70 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Distance */}
        {hospital.distance !== undefined && (
          <div className="mx-5 mt-4 bg-[#1c2128] rounded-xl p-3 text-center border border-[rgba(255,255,255,0.06)]">
            <p className="text-[#00e5ff] font-bold text-2xl font-mono">{formatDistance(hospital.distance)}</p>
            <p className="text-white/40 text-xs mt-0.5">ระยะทางจากคุณ</p>
          </div>
        )}

        {/* Opening hours */}
        {hospital.opening_hours && (
          <div className="flex items-center gap-3 mx-5 mt-3 bg-[#1c2128] rounded-xl p-3 border border-[rgba(255,255,255,0.06)]">
            <Clock size={15} className="text-white/40 flex-shrink-0" />
            <p className="text-white/70 text-sm font-mono">{hospital.opening_hours}</p>
          </div>
        )}

        {/* Info */}
        <div className="mx-5 mt-3 space-y-3">
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

        {/* Navigate */}
        <div className="mx-5 mt-4 mb-6">
          <a
            href={getGoogleMapsUrl(hospital.lat, hospital.lng, hospital.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#00e5ff] hover:bg-[#00c8e0] text-[#0d1117] font-bold text-sm py-3.5 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#00e5ff]/20"
          >
            <Navigation size={16} />
            นำทางไปโรงพยาบาล
          </a>
        </div>
      </div>
    </div>
  );
}
