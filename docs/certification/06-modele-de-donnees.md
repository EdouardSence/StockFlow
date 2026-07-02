# 06 — Modèle de données

## Schéma (PostgreSQL, Supabase)

```
users
  id            text PRIMARY KEY
  name          text NOT NULL
  email         text NOT NULL UNIQUE
  role          text NOT NULL CHECK (role IN ('admin', 'technician'))
  created_at    timestamptz NOT NULL DEFAULT now()

equipment
  id            text PRIMARY KEY
  name          text NOT NULL
  type          text NOT NULL CHECK (type IN ('pc', 'screen', 'printer', 'other'))
  brand         text
  model         text
  serial_number text UNIQUE
  qr_code       text NOT NULL UNIQUE
  status        text NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available', 'assigned', 'broken', 'maintenance'))
  assigned_to   text REFERENCES users(id) ON DELETE SET NULL
  notes         text
  created_at    timestamptz NOT NULL DEFAULT now()
  updated_at    timestamptz NOT NULL DEFAULT now()

incidents
  id            text PRIMARY KEY
  equipment_id  text NOT NULL REFERENCES equipment(id) ON DELETE CASCADE
  reported_by   text NOT NULL REFERENCES users(id)
  description   text
  status        text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'in_progress', 'resolved'))
  created_at    timestamptz NOT NULL DEFAULT now()
  resolved_at   timestamptz
```

## Migrations

`src/db/migrations/*.sql`, appliquées dans l'ordre alphabétique par `scripts/migrate.ts`
(`bun run migrate`).

- `001_init.sql` — création des 3 tables.
- `002_equipment_type_reduce_enum.sql` — réduction de `equipment.type` de
  `pc|laptop|screen|printer|phone|other` à `pc|screen|printer|other`, avec remap des données
  existantes (`laptop`→`pc`, `phone`→`other`) et ajout de la contrainte CHECK correspondante.
  Appliquée en production le 2026-07-02 (0 ligne affectée, tables vides à ce moment).

## Accès

Exclusivement via Kysely (`src/db/client.ts`), typé par `src/db/types.ts`. Aucun SQL brut
concaténé dans le code applicatif (seules les migrations contiennent du SQL littéral, dans des
fichiers dédiés et versionnés).

## Points connus non résolus

- **RLS désactivé** sur les 3 tables (exposition anon/authenticated complète). Bloqué par
  l'absence d'authentification — voir Lot Auth dans `PROGRESS.md`.
- `incidents` existe en base et en type TypeScript mais n'est utilisée par aucune route ni
  Server Function à ce jour.
