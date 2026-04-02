export type HospitalType   = 'government' | 'private';
export type HospitalStatus = 'open' | 'closed' | 'unknown';

export interface Hospital {
  id:             string;   // "osm-123456"
  osm_id:         number;
  name:           string;
  name_th:        string;
  type:           HospitalType;
  status:         HospitalStatus;
  lat:            number;
  lng:            number;
  address:        string;
  phone:          string;
  distance?:      number;  // meters
  emergency:      boolean;
  opening_hours?: string;
}

export interface UserLocation { lat: number; lng: number; }
export type FilterType   = 'all' | 'government' | 'private';
export type FilterStatus = 'all' | 'open' | 'closed' | 'unknown';

export interface AuthUser {
  id:      string;
  name:    string;
  picture: string;
}
