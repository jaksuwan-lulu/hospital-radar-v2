-- hospital_radar v2 schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,   -- LINE userId
  name       TEXT NOT NULL,
  picture    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorites (
  id               SERIAL PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_osm_id  TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, hospital_osm_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
