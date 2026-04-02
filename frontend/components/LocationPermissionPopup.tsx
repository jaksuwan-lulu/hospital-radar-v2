'use client';
import { MapPin, Navigation, X } from 'lucide-react';

interface Props {
  onAllow: () => void;
  onDeny: () => void;
}

export default function LocationPermissionPopup({ onAllow, onDeny }: Props) {
  return (
    <div className="absolute top-4 left-4 z-[1000] w-80 location-popup">
      <div className="bg-[#161b22] border border-[rgba(0,229,255,0.2)] rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#00e5ff]/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#00e5ff]" />
            </div>
            <span className="text-xs text-white/70 font-mono-radar tracking-wide">hospitalradar.th</span>
          </div>
          <button onClick={onDeny} className="text-white/30 hover:text-white/70 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center flex-shrink-0">
              <MapPin size={18} className="text-[#00e5ff]" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">อนุญาตการเข้าถึงตำแหน่ง</p>
              <p className="text-white/50 text-xs mt-0.5">เพื่อแสดงโรงพยาบาลใกล้เคียง</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={onAllow}
              className="w-full flex items-center justify-center gap-2 bg-[#00e5ff] hover:bg-[#00c8e0] text-[#0d1117] font-semibold text-sm py-2.5 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Navigation size={14} />
              อนุญาตขณะเยี่ยมชมเว็บไซต์
            </button>
            <button
              onClick={onAllow}
              className="w-full bg-[#1c2128] hover:bg-[#21262d] text-white/80 font-medium text-sm py-2.5 px-4 rounded-xl transition-all duration-200 border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]"
            >
              อนุญาตครั้งนี้เท่านั้น
            </button>
            <button
              onClick={onDeny}
              className="w-full text-white/40 hover:text-white/60 font-medium text-sm py-2 px-4 rounded-xl transition-colors"
            >
              ไม่อนุญาต
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
