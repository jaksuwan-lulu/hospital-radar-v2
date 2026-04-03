import { Hospital } from '../types';

// ── Cache ─────────────────────────────────────────────────────────────────────
let nearbyCache: { data: Hospital[]; ts: number; lat: number; lng: number } | null = null;
let thailandCache: { data: Hospital[]; ts: number } | null = null;
const NEARBY_TTL   = 60 * 60 * 1000;
const THAILAND_TTL = 6 * 60 * 60 * 1000;

// ── Haversine ─────────────────────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = 6371000;
  const f1 = (lat1 * Math.PI) / 180;
  const f2 = (lat2 * Math.PI) / 180;
  const df = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const a  = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Smart status guess ────────────────────────────────────────────────────────
export function guessStatus(name: string, nameTh: string, isGov: boolean, emergency: boolean): 'open' | 'closed' | 'unknown' {
  const combined = (name + nameTh).toLowerCase();
  const is24h = /(?:bumrungrad|samitivej|สมิติเวช|บำรุงราษฎร์|เวชธานี|mission|มิชชั่น|พระราม9|เปาโล|bangkok\s*hospital|โรงพยาบาลกรุงเทพ)/i.test(combined);
  if (is24h || emergency) return 'open';
  const bkk  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const day  = bkk.getDay();
  const mins = bkk.getHours() * 60 + bkk.getMinutes();
  if (isGov) {
    if (day >= 1 && day <= 5 && mins >= 450 && mins < 1200) return 'open';
    if (day === 6 && mins >= 450 && mins < 720) return 'open';
    return 'closed';
  }
  if (day >= 1 && day <= 6 && mins >= 480 && mins < 1200) return 'open';
  return 'closed';
}

// ── Parse opening_hours ───────────────────────────────────────────────────────
export function parseOpeningHours(oh: string | undefined): 'open' | 'closed' | 'unknown' {
  if (!oh) return 'unknown';
  if (oh === '24/7') return 'open';
  const bkk  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const day  = bkk.getDay();
  const nowMins = bkk.getHours() * 60 + bkk.getMinutes();
  const DAY_MAP: Record<string, number> = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0 };
  for (const rule of oh.split(';').map(r => r.trim()).filter(Boolean)) {
    const m = rule.match(/^([A-Z][a-z](?:[,-][A-Z][a-z])*)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    if (!m) continue;
    const [, daysPart, startStr, endStr] = m;
    const startMins = +startStr.split(':')[0] * 60 + +startStr.split(':')[1];
    const endMins   = +endStr.split(':')[0]   * 60 + +endStr.split(':')[1];
    const validDays = new Set<number>();
    for (const seg of daysPart.split(',')) {
      if (seg.includes('-')) {
        const [f, t] = seg.split('-').map(s => DAY_MAP[s] ?? -1);
        if (f === -1 || t === -1) continue;
        let cur = f;
        while (cur !== t) { validDays.add(cur); cur = (cur + 1) % 7; }
        validDays.add(t);
      } else { const d = DAY_MAP[seg]; if (d !== undefined) validDays.add(d); }
    }
    if (validDays.has(day) && nowMins >= startMins && nowMins < endMins) return 'open';
  }
  return 'closed';
}

// ── Map Nominatim item → Hospital ─────────────────────────────────────────────
function mapItem(item: any, userLat: number, userLng: number): Hospital {
  const tags   = item.extratags ?? {};
  const nameTh = tags['name:th'] || item.name || 'โรงพยาบาล';
  const nameEn = tags['name:en'] || item.name || nameTh;
  const isGov  = /(?:โรงพยาบาล(?:รัฐ|ศิริราช|รามา|จุฬา|วชิระ|ตำรวจ|พระมงกุฎ|เลิดสิน|วชิรพยาบาล|ราชวิถี|พระนั่งเกล้า|นพรัตน)|general\s*hospital|regional|district|community|สถาบัน|ศูนย์การแพทย์(?!วิชัยยุทธ)|โรงพยาบาลส่งเสริม)/i
    .test(nameEn + nameTh + (tags.operator ?? ''));
  const emergency = tags.emergency === 'yes';
  const oh        = tags.opening_hours as string | undefined;
  const status    = oh ? parseOpeningHours(oh) : guessStatus(nameEn, nameTh, isGov, emergency);
  const lat = parseFloat(item.lat);
  const lng = parseFloat(item.lon);
  return {
    id:            `osm-${item.osm_id}`,
    osm_id:        item.osm_id,
    name:          nameEn,
    name_th:       nameTh,
    type:          isGov ? 'government' : 'private',
    status,
    lat, lng,
    address:       item.display_name?.split(',').slice(0, 3).join(',') ?? '',
    phone:         tags.phone || tags['contact:phone'] || '',
    emergency,
    opening_hours: oh,
    distance:      Math.round(haversine(userLat, userLng, lat, lng)),
  };
}

// ── Nominatim search ──────────────────────────────────────────────────────────
// Nominatim max limit = 50 per request — ต้องแบ่ง bbox เพื่อให้ครอบคลุม
async function nominatimSearch(viewbox: string, limit = 50): Promise<any[]> {
  const url = `https://nominatim.openstreetmap.org/search?` +
    `amenity=hospital&format=jsonv2&limit=${limit}&bounded=1&viewbox=${viewbox}&addressdetails=1&extratags=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'HospitalRadar/2.0 (opensource)' },
    signal:  AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return res.json() as Promise<any[]>;
}

// แบ่ง bbox ใหญ่เป็น grid เพื่อดึงข้อมูลได้มากกว่า limit=50
async function nominatimSearchGrid(
  minLng: number, minLat: number, maxLng: number, maxLat: number,
  cols = 2, rows = 2
): Promise<any[]> {
  const cellW = (maxLng - minLng) / cols;
  const cellH = (maxLat - minLat) / rows;
  const cells: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const w = minLng + c * cellW;
      const s = minLat + r * cellH;
      const e = w + cellW;
      const n = s + cellH;
      cells.push(`${w},${s},${e},${n}`);
    }
  }
  const results = await Promise.allSettled(cells.map(bb => nominatimSearch(bb, 50)));
  const seen = new Set<number>();
  const all: any[] = [];
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const item of r.value) {
      if (seen.has(item.osm_id)) continue;
      seen.add(item.osm_id);
      all.push(item);
    }
  }
  return all;
}

// ── Nearby (radius-based) ─────────────────────────────────────────────────────
export async function fetchHospitalsNearby(lat: number, lng: number, radiusM: number): Promise<Hospital[]> {
  if (nearbyCache && Date.now() - nearbyCache.ts < NEARBY_TTL) {
    const moved = haversine(lat, lng, nearbyCache.lat, nearbyCache.lng);
    if (moved < 500) {
      return nearbyCache.data
        .map(h => ({ ...h, distance: Math.round(haversine(lat, lng, h.lat, h.lng)) }))
        .filter(h => h.distance! <= radiusM)
        .sort((a, b) => a.distance! - b.distance!);
    }
  }
  // ใช้ deg * 2 (ไม่ * 1.5) เพื่อให้ bbox ครอบคลุมกว่าเดิม
  // แบ่ง 2x2 grid เพื่อเลี่ยง limit 50 ของ Nominatim
  const deg = (radiusM / 111000) * 2;
  const items = await nominatimSearchGrid(lng - deg, lat - deg, lng + deg, lat + deg, 2, 2);
  const hospitals = items.map(i => mapItem(i, lat, lng)).filter(h => !isNaN(h.lat) && !isNaN(h.lng));
  nearbyCache = { data: hospitals, ts: Date.now(), lat, lng };
  return hospitals.filter(h => h.distance! <= radiusM).sort((a, b) => a.distance! - b.distance!);
}

// ── All Thailand ──────────────────────────────────────────────────────────────
export async function fetchAllThailand(userLat: number, userLng: number): Promise<Hospital[]> {
  if (thailandCache && Date.now() - thailandCache.ts < THAILAND_TTL) {
    return thailandCache.data
      .map(h => ({ ...h, distance: Math.round(haversine(userLat, userLng, h.lat, h.lng)) }))
      .sort((a, b) => a.distance! - b.distance!);
  }
  // 4x4 grid ทั่วไทย = 16 requests → ~800 โรงพยาบาล
  const items = await nominatimSearchGrid(97.5, 5.5, 105.7, 20.5, 4, 4);
  const seen = new Set<number>();
  const all: Hospital[] = [];
  for (const item of items) {
    if (seen.has(item.osm_id)) continue;
    seen.add(item.osm_id);
    const h = mapItem(item, userLat, userLng);
    if (!isNaN(h.lat) && !isNaN(h.lng)) all.push(h);
  }
  thailandCache = { data: all, ts: Date.now() };
  return all.sort((a, b) => a.distance! - b.distance!);
}

export function refreshStatuses(): void {
  const refresh = (h: Hospital): Hospital => ({
    ...h,
    status: h.opening_hours ? parseOpeningHours(h.opening_hours) : guessStatus(h.name, h.name_th, h.type === 'government', h.emergency),
  });
  if (nearbyCache)   nearbyCache.data   = nearbyCache.data.map(refresh);
  if (thailandCache) thailandCache.data = thailandCache.data.map(refresh);
}
