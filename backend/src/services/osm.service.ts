import { Hospital } from '../types';

// Cache 1 ชั่วโมง
let cache: { data: Hospital[]; ts: number; lat: number; lng: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000;

// ── Parse opening_hours → open | closed | unknown ─────────────────────────────
export function parseOpeningHours(oh: string | undefined): 'open' | 'closed' | 'unknown' {
  if (!oh) return 'unknown';
  if (oh === '24/7') return 'open';

  const now = new Date();
  const bkk = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const day  = bkk.getDay();
  const nowMins = bkk.getHours() * 60 + bkk.getMinutes();

  const DAY_MAP: Record<string, number> = {
    Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0,
  };

  const rules = oh.split(';').map(r => r.trim()).filter(Boolean);
  for (const rule of rules) {
    const m = rule.match(/^([A-Z][a-z](?:[,-][A-Z][a-z])*)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    if (!m) continue;
    const [, daysPart, startStr, endStr] = m;
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins   = eh * 60 + em;

    const validDays = new Set<number>();
    for (const seg of daysPart.split(',')) {
      if (seg.includes('-')) {
        const [from, to] = seg.split('-');
        let cur = DAY_MAP[from] ?? -1;
        const end = DAY_MAP[to] ?? -1;
        if (cur === -1 || end === -1) continue;
        while (cur !== end) { validDays.add(cur); cur = (cur + 1) % 7; }
        validDays.add(end);
      } else {
        const d = DAY_MAP[seg];
        if (d !== undefined) validDays.add(d);
      }
    }
    if (validDays.has(day) && nowMins >= startMins && nowMins < endMins) return 'open';
  }
  return 'closed';
}

// ── Haversine distance ────────────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = 6371000;
  const f1 = (lat1 * Math.PI) / 180;
  const f2 = (lat2 * Math.PI) / 180;
  const df = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const a  = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Fetch via Nominatim search (ไม่ต้องการ Overpass) ─────────────────────────
async function fetchViaNominatim(lat: number, lng: number, radiusM: number): Promise<Hospital[]> {
  // Nominatim reverse bbox search
  const degOffset = (radiusM / 111000) * 1.5;
  const bbox = `${lng - degOffset},${lat - degOffset},${lng + degOffset},${lat + degOffset}`;
  
  const url = `https://nominatim.openstreetmap.org/search?` +
    `amenity=hospital&format=jsonv2&limit=50&bounded=1&viewbox=${bbox}&addressdetails=1&extratags=1`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'HospitalRadar/2.0 (hospital-radar-v2)' },
    signal:  AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Nominatim error ${res.status}`);

  const items = await res.json() as any[];

  return items.map((item: any): Hospital => {
    const tags = item.extratags ?? {};
    const nameTh = tags['name:th'] || item.name || 'โรงพยาบาล';
    const nameEn = tags['name:en'] || item.name || nameTh;
    const isGov  = /(?:โรงพยาบาล(?:รัฐ|ศิริราช|รามา|จุฬา|วชิระ|ตำรวจ|พระมงกุฎ|เลิดสิน|วชิรพยาบาล)|general\s*hospital|regional|district|community)/i
      .test(nameEn + nameTh + (tags.operator ?? ''));

    return {
      id:            `osm-${item.osm_id}`,
      osm_id:        item.osm_id,
      name:          nameEn,
      name_th:       nameTh,
      type:          isGov ? 'government' : 'private',
      status:        parseOpeningHours(tags.opening_hours),
      lat:           parseFloat(item.lat),
      lng:           parseFloat(item.lon),
      address:       item.display_name?.split(',').slice(0, 3).join(',') ?? '',
      phone:         tags.phone || tags['contact:phone'] || '',
      emergency:     tags.emergency === 'yes',
      opening_hours: tags.opening_hours,
    };
  }).filter(h => !isNaN(h.lat) && !isNaN(h.lng));
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function fetchHospitalsNearby(
  lat: number,
  lng: number,
  radiusM = 5000
): Promise<Hospital[]> {
  // ใช้ cache ถ้ายังไม่หมดอายุและตำแหน่งใกล้กัน
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    const moved = haversine(lat, lng, cache.lat, cache.lng);
    if (moved < 500) {
      return cache.data
        .map(h => ({ ...h, distance: Math.round(haversine(lat, lng, h.lat, h.lng)) }))
        .filter(h => h.distance! <= radiusM)
        .sort((a, b) => a.distance! - b.distance!);
    }
  }

  const hospitals = await fetchViaNominatim(lat, lng, radiusM);
  cache = { data: hospitals, ts: Date.now(), lat, lng };

  return hospitals
    .map(h => ({ ...h, distance: Math.round(haversine(lat, lng, h.lat, h.lng)) }))
    .filter(h => h.distance! <= radiusM)
    .sort((a, b) => a.distance! - b.distance!);
}

export function refreshStatuses(): void {
  if (!cache) return;
  cache.data = cache.data.map(h => ({
    ...h,
    status: parseOpeningHours(h.opening_hours),
  }));
}
