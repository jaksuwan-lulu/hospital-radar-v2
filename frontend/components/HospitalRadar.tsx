'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Hospital, UserLocation, FilterType, FilterStatus, AuthUser } from '../types/hospital';
import { formatDistance } from '../lib/utils';
import { fetchHospitals, getFavorites, toggleFavoriteAPI, logout } from '../lib/api';
import LocationPermissionPopup from './LocationPermissionPopup';
import HospitalDetail from './HospitalDetail';
import HospitalList from './HospitalList';
import FilterPanel from './FilterPanel';
import { Locate, LogOut, User } from 'lucide-react';

declare global { interface Window { L: any; } }

interface Props {
  user: AuthUser | null;
  onLogout: () => void;
}

export default function HospitalRadar({ user, onLogout }: Props) {
  const mapRef             = useRef<any>(null);
  const leafletRef         = useRef<any>(null);
  const mapContainerRef    = useRef<HTMLDivElement>(null);
  const userMarkerRef      = useRef<any>(null);
  const circleRef          = useRef<any>(null);
  const hospitalMarkersRef = useRef<Map<string, any>>(new Map());

  const [userLocation, setUserLocation]   = useState<UserLocation | null>(null);
  const [hospitals, setHospitals]         = useState<Hospital[]>([]);
  const [filteredHospitals, setFiltered]  = useState<Hospital[]>([]);
  const [selectedHospital, setSelected]   = useState<Hospital | null>(null);
  const [showLocationPopup, setShowPopup] = useState(true);
  const [favorites, setFavorites]         = useState<Set<string>>(new Set());
  const [filterType, setFilterType]       = useState<FilterType>('all');
  const [filterStatus, setFilterStatus]   = useState<FilterStatus>('all');
  const [radius, setRadius]               = useState(5000);
  const [scope, setScope]                 = useState<'nearby' | 'all'>('nearby');
  const [showList, setShowList]           = useState(false);
  const [mapReady, setMapReady]           = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // ── Load Leaflet ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (window.L) { initMap(window.L); return; }
    const script  = document.createElement('script');
    script.src    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => { if (window.L) initMap(window.L); };
    document.head.appendChild(script);
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    if (!user) return;
    getFavorites().then(ids => setFavorites(new Set(ids)));
  }, [user]);

  const initMap = (L: any) => {
    if (!mapContainerRef.current || mapRef.current) return;
    leafletRef.current = L;
    const map = L.map(mapContainerRef.current, {
      center: [13.0, 101.5], zoom: 6,
      zoomControl: false, attributionControl: true,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CartoDB', maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    setMapReady(true);
  };

  // ── Fetch hospitals ─────────────────────────────────────────────────────────
  const loadHospitals = useCallback(async (loc: UserLocation, L: any, currentScope: 'nearby' | 'all', currentRadius: number) => {
    setLoading(true); setError(null);
    try {
      const data = await fetchHospitals(loc.lat, loc.lng, currentRadius, filterType, filterStatus, currentScope);
      setHospitals(data);
      drawMarkers(data, loc, L, currentRadius, currentScope);
    } catch {
      setError('ไม่สามารถดึงข้อมูลโรงพยาบาลได้ กรุณาลองใหม่');
    } finally { setLoading(false); }
  }, [filterType, filterStatus]);

  // ── When location set ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!userLocation || !mapReady) return;
    const L = leafletRef.current; const map = mapRef.current;
    if (!L || !map) return;
    if (userMarkerRef.current) { try { map.removeLayer(userMarkerRef.current); } catch (_) {} }
    if (circleRef.current)     { try { map.removeLayer(circleRef.current);     } catch (_) {} }

    const userIcon = L.divIcon({
      className: '',
      html: `<div style="width:18px;height:18px;background:#00e5ff;border:3px solid white;border-radius:50%;box-shadow:0 0 12px #00e5ffaa,0 0 24px #00e5ff44;"></div>`,
      iconSize: [18, 18], iconAnchor: [9, 9],
    });
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindTooltip('<span style="font-family:Sarabun;font-size:12px;color:white;background:#161b22;border:1px solid rgba(0,229,255,0.3);padding:4px 8px;border-radius:8px;">📍 คุณอยู่ที่นี่</span>',
        { className: 'custom-tooltip', permanent: false, direction: 'top' });

    if (scope !== 'all') {
      circleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius, color: '#ff8c00', weight: 1.5, opacity: 0.6,
        fillColor: '#ff8c00', fillOpacity: 0.06, dashArray: '6,4',
      }).addTo(map);
    }
    map.setView([userLocation.lat, userLocation.lng], scope === 'all' ? 6 : 13, { animate: true });
    loadHospitals(userLocation, L, scope, radius);
  }, [userLocation, mapReady]);

  // ── Reload when filter/radius/scope changes ─────────────────────────────────
  useEffect(() => {
    if (!userLocation || !mapReady) return;
    const L = leafletRef.current; if (!L) return;

    // อัพเดท circle
    const map = mapRef.current;
    if (circleRef.current) { try { map.removeLayer(circleRef.current); } catch (_) {} }
    if (scope !== 'all') {
      circleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius, color: '#ff8c00', weight: 1.5, opacity: 0.6,
        fillColor: '#ff8c00', fillOpacity: 0.06, dashArray: '6,4',
      }).addTo(map);
      map.setView([userLocation.lat, userLocation.lng], 13, { animate: true });
    } else {
      map.setView([userLocation.lat, userLocation.lng], 6, { animate: true });
    }
    loadHospitals(userLocation, L, scope, radius);
  }, [filterType, filterStatus, radius, scope]);

  // ── Draw markers ─────────────────────────────────────────────────────────────
  const drawMarkers = (list: Hospital[], userLoc: UserLocation, L: any, currentRadius: number, currentScope: 'nearby' | 'all') => {
    const map = mapRef.current; if (!map || !L) return;
    hospitalMarkersRef.current.forEach(m => { try { map.removeLayer(m); } catch (_) {} });
    hospitalMarkersRef.current.clear();

    list.forEach(h => {
      const isOpen     = h.status === 'open';
      const isGov      = h.type === 'government';
      const inRadius   = currentScope === 'all' ? false : (h.distance ?? 0) <= currentRadius;
      const dotColor   = isOpen ? '#00ff88' : h.status === 'unknown' ? '#ffd32a' : '#ff4757';
      const dotBorder  = isGov ? '#0099ff' : '#ffd32a';
      // โรงพยาบาลนอก radius → opacity 70%
      const opacity    = inRadius || currentScope === 'all' ? 1 : 0.7;

      const icon = L.divIcon({
        className: 'hospital-marker-icon',
        html: `<div style="position:relative;width:28px;height:28px;opacity:${opacity};">
          <div style="width:14px;height:14px;background:${dotColor};border:2px solid ${dotBorder};border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);box-shadow:0 0 8px ${dotColor}99;"></div>
          ${inRadius ? `<div style="width:28px;height:28px;background:${dotColor}22;border-radius:50%;position:absolute;top:0;left:0;animation:radar-pulse 2s ease-out infinite;"></div>` : ''}
        </div>`,
        iconSize: [28, 28], iconAnchor: [14, 14],
      });

      const typeBadge   = isGov ? `<span style="color:#60a5fa;font-size:10px;">🏛 รัฐบาล</span>` : `<span style="color:#f59e0b;font-size:10px;">🏥 เอกชน</span>`;
      const statusLabel = isOpen ? 'เปิด' : h.status === 'unknown' ? 'ไม่ทราบ' : 'ปิด';
      const statusColor = isOpen ? '#00ff88' : h.status === 'unknown' ? '#ffd32a' : '#ff4757';
      const distTxt     = h.distance !== undefined ? `<br/><span style="color:#00e5ff;font-size:11px;">${formatDistance(h.distance)}</span>` : '';

      const marker = L.marker([h.lat, h.lng], { icon }).addTo(map);
      marker.bindTooltip(
        `<div style="background:#161b22;border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:8px 10px;min-width:160px;font-family:'Sarabun',sans-serif;">
          <div style="font-weight:600;font-size:13px;color:white;margin-bottom:4px;">${h.name_th}</div>
          <div style="display:flex;gap:8px;align-items:center;">${typeBadge}<span style="color:${statusColor};font-size:10px;">● ${statusLabel}</span></div>
          ${distTxt}
        </div>`,
        { className: 'custom-tooltip', direction: 'top', offset: [0, -8], opacity: 1 }
      );

      const el = marker.getElement();
      if (el) {
        el.style.cursor = 'default';
        el.addEventListener('mouseenter', () => { el.style.cursor = 'pointer'; });
        el.addEventListener('mouseleave', () => { el.style.cursor = 'default'; });
      }
      marker.on('click', () => setSelected(h));
      hospitalMarkersRef.current.set(h.id, marker);
    });
  };

  // ── Filter list ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let result = [...hospitals];
    if (filterType   !== 'all') result = result.filter(h => h.type   === filterType);
    if (filterStatus !== 'all') result = result.filter(h => h.status === filterStatus);
    result.sort((a, b) => {
      const aFav = favorites.has(a.id) ? 0 : 1;
      const bFav = favorites.has(b.id) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      return (a.distance ?? 99999) - (b.distance ?? 99999);
    });
    setFiltered(result);
  }, [hospitals, filterType, filterStatus, favorites]);

  // ── Geolocation ─────────────────────────────────────────────────────────────
  const handleAllowLocation = useCallback(() => {
    setShowPopup(false);
    if (!navigator.geolocation) { setUserLocation({ lat: 13.7563, lng: 100.5018 }); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => { console.warn('[GPS]', err.message); setUserLocation({ lat: 13.7563, lng: 100.5018 }); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const handleToggleFavorite = useCallback(async (id: string) => {
    setFavorites(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
    if (user) {
      try { await toggleFavoriteAPI(id); }
      catch { setFavorites(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); }
    }
  }, [user]);

  const handleLogout = async () => { await logout(); onLogout(); };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0d1117]">
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />
      <style>{`
        .custom-tooltip{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important;}
        .custom-tooltip::before{display:none!important;}
        .leaflet-tooltip{background:transparent;border:none;box-shadow:none;padding:0;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes radar-pulse{0%{transform:scale(0.5);opacity:1}100%{transform:scale(1.8);opacity:0}}
        .animate-blink{animation:blink 2s ease-in-out infinite;}
      `}</style>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[800] flex items-center justify-between px-4 py-3 bg-gradient-to-b from-[#0d1117] to-transparent pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-[#00e5ff]/15 border border-[#00e5ff]/30 flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[#00e5ff] relative">
              <div className="absolute inset-0.5 rounded-full bg-[#00e5ff]/40" />
            </div>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Hospital Radar</p>
            <p className="text-white/40 text-xs font-mono mt-0.5">
              {loading ? '⌛ กำลังโหลด...' : userLocation ? '● LIVE' : '○ NO LOCATION'}
            </p>
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          {userLocation && (
            <button onClick={() => mapRef.current?.setView([userLocation.lat, userLocation.lng], scope === 'all' ? 6 : 13, { animate: true })}
              className="p-2.5 bg-[#161b22]/90 backdrop-blur border border-white/10 rounded-xl hover:border-[#00e5ff]/40 hover:text-[#00e5ff] text-white/60 transition-all">
              <Locate size={16} />
            </button>
          )}
          {user && (
            <div className="flex items-center gap-2 bg-[#161b22]/90 backdrop-blur border border-white/10 rounded-xl px-3 py-2">
              {user.picture ? <img src={user.picture} className="w-6 h-6 rounded-full" alt="" /> : <User size={14} className="text-white/60" />}
              <span className="text-white/80 text-xs max-w-[80px] truncate">{user.name}</span>
              <button onClick={handleLogout} className="text-white/30 hover:text-[#ff4757] transition-colors ml-1"><LogOut size={13} /></button>
            </div>
          )}
        </div>
      </div>

      {showLocationPopup && <LocationPermissionPopup onAllow={handleAllowLocation} onDeny={() => setShowPopup(false)} />}

      <FilterPanel
        filterType={filterType} filterStatus={filterStatus}
        onTypeChange={setFilterType} onStatusChange={setFilterStatus}
        count={filteredHospitals.length}
        radius={radius} onRadiusChange={setRadius}
        scope={scope} onScopeChange={setScope}
        error={error}
      />

      <HospitalList
        hospitals={filteredHospitals}
        onSelect={h => { setSelected(h); setShowList(false); }}
        favorites={favorites} onFavorite={handleToggleFavorite}
        isOpen={showList} onToggle={() => setShowList(p => !p)}
        isLoggedIn={!!user}
      />

      {selectedHospital && (
        <HospitalDetail
          hospital={selectedHospital} onClose={() => setSelected(null)}
          onFavorite={handleToggleFavorite} favorites={favorites} isLoggedIn={!!user}
        />
      )}

      {!userLocation && !showLocationPopup && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[800] bg-[#161b22]/90 backdrop-blur border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#ff9f43] animate-blink" />
          <p className="text-white/60 text-sm">เปิดตำแหน่งเพื่อดูโรงพยาบาลใกล้เคียง</p>
          <button onClick={() => setShowPopup(true)} className="text-[#00e5ff] text-sm font-medium hover:underline">เปิด</button>
        </div>
      )}
    </div>
  );
}
