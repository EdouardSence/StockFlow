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

refresh_tokens                      -- sessions (rotation/révocation, migration 003)
  id            text PRIMARY KEY
  user_id       text NOT NULL REFERENCES users(id) ON DELETE CASCADE
  token_hash    text NOT NULL UNIQUE
  expires_at    timestamptz NOT NULL
  revoked_at    timestamptz
  created_at    timestamptz NOT NULL DEFAULT now()
```

S'ajoute à `users` la colonne `password_hash text` (nullable = compte non activable,
migration 003) — illisible par le rôle applicatif (grant par colonnes, voir
`09-securisation.md`).

## Migrations

`src/db/migrations/*.sql`, appliquées dans l'ordre alphabétique par `scripts/migrate.ts`
(`bun run migrate`).

- `001_init.sql` — création des 3 tables.
- `002_equipment_type_reduce_enum.sql` — réduction de `equipment.type` de
  `pc|laptop|screen|printer|phone|other` à `pc|screen|printer|other`, avec remap des données
  existantes (`laptop`→`pc`, `phone`→`other`) et ajout de la contrainte CHECK correspondante.
  Appliquée en production le 2026-07-02 (0 ligne affectée, tables vides à ce moment).
- `003_auth_password_refresh_tokens.sql` — `users.password_hash` + table `refresh_tokens`.
- `004_rls_policies.sql` — rôle `stockflow_app`, RLS sur les 4 tables, fonction
  `auth_login_lookup` (SECURITY DEFINER), grants par colonne.
- `005_password_self_service.sql` — support du changement de mot de passe self-service.
- `006_admin_user_management.sql` — création de comptes via UI admin,
  `auth_list_users_with_status()` (statut actif/désactivé sans exposer le hash).

Les migrations sont idempotentes par convention (`IF NOT EXISTS`, `CREATE OR REPLACE`) :
le script les rejoue toutes à chaque exécution, sans table de suivi — voir
`16-manuel-mise-a-jour.md`.

## Accès

Exclusivement via Kysely (`src/db/client.ts`), typé par `src/db/types.ts`. Aucun SQL brut
concaténé dans le code applicatif (seules les migrations contiennent du SQL littéral, dans des
fichiers dédiés et versionnés).

## Points historiques (résolus depuis la rédaction initiale)

- ~~RLS désactivé sur les 3 tables~~ **Résolu (session 2, 2026-07-03)** : RLS actif sur
  les 4 tables avec le rôle `stockflow_app`, fail-closed — voir `09-securisation.md`.
- ~~`incidents` inutilisée~~ **Résolu (session 6, 2026-07-05)** : signalement mobile,
  écran admin `/incidents`, cycle de vie complet — voir `18-architecture.md`.
