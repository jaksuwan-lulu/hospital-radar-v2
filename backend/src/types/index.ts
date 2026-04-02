export interface Hospital {
  id: string;          // OSM node id
  name: string;
  name_th: string;
  type: 'government' | 'private';
  status: 'open' | 'closed' | 'unknown';
  lat: number;
  lng: number;
  address: string;
  phone: string;
  distance?: number;   // meters, computed at request time
  emergency: boolean;
  opening_hours?: string; // raw OSM string e.g. "Mo-Fr 08:00-17:00"
  osm_id: number;
}

export interface JWTPayload {
  sub: string;         // user line_uid
  name: string;
  picture: string;
  iat: number;
  exp: number;
  jti: string;         // unique token id for blacklist
}

export interface User {
  id: string;
  line_uid: string;
  name: string;
  picture: string;
  created_at: Date;
}
