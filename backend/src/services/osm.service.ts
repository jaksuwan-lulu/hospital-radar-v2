import { Hospital } from '../types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Cache hospitals 24h to avoid hammering Overpass API
let cache: { data: Hospital[]; ts: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ── Overpass query ────────────────────────────────────────────────────────────
// ดึง node/way ที่มี amenity=hospital ในไทย
function buildQuery(lat: number, lng: number, radiusM: number): string {
  return `
    [out:json][timeout:30];
    (
      node["amenity"="hospital"](around:${radiusM},${lat},${lng});
      way["amenity"="hospital"](around:${radiusM},${lat},${lng});
    );
    out center tags;
  `;
}

// ── Parse OSM opening_hours string → open | closed | unknown ─────────────────
// รองรับ format พื้นฐาน: "Mo-Fr 08:00-17:00", "24/7", "Mo-Su 00:00-24:00"
export function parseOpeningHours(oh: string | undefined): 'open' | 'closed' | 'unknown' {
  if (!oh) return 'unknown';
  if (oh === '24/7') return 'open';

  const now = new Date();
  // Bangkok time UTC+7
  const bkk = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const day = bkk.getDay(); // 0=Sun 1=Mon ... 6=Sat
  const hour = bkk.getHours();
  const min  = bkk.getMinutes();
  const nowMins = hour * 60 + min;

  const DAY_MAP: Record<string, number> = {
    Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0,
  };

  // Split rules by ";" then evaluate each
  const rules = oh.split(';').map(r => r.trim()).filter(Boolean);
  for (const rule of rules) {
    // Match "Mo-Fr 08:00-17:00" or "Mo,We 09:00-18:00"
    const m = rule.match(
      /^([A-Z][a-z](?:[,-][A-Z][a-z])*)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/
    );
    if (!m) continue;

    const [, daysPart, startStr, endStr] = m;
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins   = eh * 60 + em;

    // Build set of valid days
    const validDays = new Set<number>();
    const segments = daysPart.split(',');
    for (const seg of segments) {
      if (seg.includes('-')) {
        const [from, to] = seg.split('-');
        const f = DAY_MAP[from] ?? -1;
        const t = DAY_MAP[to]   ?? -1;
        if (f === -1 || t === -1) continue;
        // Handle wrap-around week (e.g. Fr-Mo)
        let cur = f;
        while (cur !== t) {
          validDays.add(cur);
          cur = (cur + 1) % 7;
        }
        validDays.add(t);
      } else {
        const d = DAY_MAP[seg];
        if (d !== undefined) validDays.add(d);
      }
    }

    if (validDays.has(day) && nowMins >= startMins && nowMins < endMins) {
      return 'open';
    }
  }

  return 'closed';
}

// ── Map OSM tags → Hospital type ──────────────────────────────────────────────
function mapOsmToHospital(el: any): Hospital | null {
  const tags = el.tags ?? {};
  const lat  = el.lat ?? el.center?.lat;
  const lng  = el.lon ?? el.center?.lon;

  if (!lat || !lng) return null;

  const nameTh = tags['name:th'] || tags['name'] || 'โรงพยาบาล';
  const nameEn = tags['name:en'] || tags['name'] || nameTh;

  // Guess gov/private from operator or name
  const isGov = /(?:โรงพยาบาล(?:รัฐ|ของรัฐ|ศิริราช|รามาธิบดี|จุฬา|วชิระ|ตำรวจ|พระมงกุฎ|เลิดสิน|รัฐบาล)|hospital(?:\s+general)?|(?:ministry|กระทรวง))/i
    .test(nameEn + nameTh + (tags.operator ?? ''));

  const oh     = tags.opening_hours as string | undefined;
  const status = parseOpeningHours(oh);

  return {
    id:            `osm-${el.id}`,
    osm_id:        el.id,
    name:          nameEn,
    name_th:       nameTh,
    type:          isGov ? 'government' : 'private',
    status,
    lat,
    lng,
    address:       [tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ') || tags['addr:full'] || '',
    phone:         tags.phone || tags['contact:phone'] || '',
    emergency:     tags.emergency === 'yes' || tags['emergency:phone'] !== undefined,
    opening_hours: oh,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function fetchHospitalsNearby(
  lat: number,
  lng: number,
  radiusM = 5000
): Promise<Hospital[]> {
  // Serve from cache if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return attachDistances(cache.data, lat, lng, radiusM);
  }

  const query = buildQuery(lat, lng, radiusM);

  const res = await fetch(OVERPASS_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error(`Overpass error ${res.status}`);

  const json = await res.json() as { elements?: any[] };
  const hospitals: Hospital[] = (json.elements ?? [])
    .map((el: any) => mapOsmToHospital(el))
    .filter(Boolean) as Hospital[];

  cache = { data: hospitals, ts: Date.now() };

  return attachDistances(hospitals, lat, lng, radiusM);
}

// ── Helper: attach distance and filter by radius ──────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = 6371000;
  const f1 = (lat1 * Math.PI) / 180;
  const f2 = (lat2 * Math.PI) / 180;
  const df = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const a  = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function attachDistances(
  hospitals: Hospital[],
  lat: number,
  lng: number,
  radiusM: number
): Hospital[] {
  return hospitals
    .map(h => ({ ...h, distance: Math.round(haversine(lat, lng, h.lat, h.lng)) }))
    .filter(h => h.distance! <= radiusM)
    .sort((a, b) => a.distance! - b.distance!);
}

// ── Refresh status for cached hospitals (called every 5 min) ──────────────────
export function refreshStatuses(): void {
  if (!cache) return;
  cache.data = cache.data.map(h => ({
    ...h,
    status: parseOpeningHours(h.opening_hours),
  }));
}
