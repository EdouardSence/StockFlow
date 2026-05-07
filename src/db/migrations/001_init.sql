CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  role       TEXT NOT NULL CHECK (role IN ('admin', 'technician')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS equipment (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,
  brand         TEXT,
  model         TEXT,
  serial_number TEXT UNIQUE,
  qr_code       TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available', 'assigned', 'broken', 'maintenance')),
  assigned_to   TEXT REFERENCES users(id) ON DELETE SET NULL,
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS incidents (
  id           TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  reported_by  TEXT NOT NULL REFERENCES users(id),
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at  TEXT
);
