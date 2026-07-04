-- RLS — défense en profondeur (architecture « SET LOCAL claims + rôle app dédié »).
--
-- Le runtime applicatif se connecte avec le rôle stockflow_app (non propriétaire,
-- sans BYPASSRLS) : RLS s'applique à lui. L'identité vérifiée du JWT est posée
-- par transaction via set_config('app.user_id'/'app.role', ..., true) — voir
-- withAuthContext dans src/db/client.ts. Sans claims posés, tout est refusé.
--
-- Le mot de passe du rôle n'est PAS dans ce fichier : il est défini hors-git
-- (ALTER ROLE stockflow_app LOGIN PASSWORD '...') et fourni via APP_POSTGRES_URL.

-- 1. Rôle applicatif
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'stockflow_app') THEN
    CREATE ROLE stockflow_app NOLOGIN;
  END IF;
END $$;

-- 2. Grants
GRANT USAGE ON SCHEMA public TO stockflow_app;

-- users : grants PAR COLONNES — password_hash est inscriptible mais jamais
-- lisible via le rôle app ; seule la fonction SECURITY DEFINER de login y accède.
REVOKE ALL ON users FROM stockflow_app;
GRANT SELECT (id, name, email, role, created_at) ON users TO stockflow_app;
GRANT INSERT (id, name, email, role, password_hash, created_at) ON users TO stockflow_app;
GRANT UPDATE (name, email, role, password_hash) ON users TO stockflow_app;
GRANT DELETE ON users TO stockflow_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON equipment TO stockflow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON incidents TO stockflow_app;
GRANT SELECT, INSERT, UPDATE ON refresh_tokens TO stockflow_app;

-- Ceinture-bretelles : les rôles de l'API Data Supabase (PostgREST) n'ont plus
-- aucun privilège sur ces tables (RLS les bloquait déjà par défaut, mais on
-- réduit la surface). service_role (clé serveur Supabase) garde son BYPASSRLS.
REVOKE ALL ON users, equipment, incidents, refresh_tokens FROM anon, authenticated;

-- 3. RLS activé sur les 4 tables
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment      ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- 4. Helpers de lecture des claims (NULL si aucun claim posé → deny)
CREATE OR REPLACE FUNCTION app_role() RETURNS text
LANGUAGE sql STABLE AS $$ SELECT current_setting('app.role', true) $$;

CREATE OR REPLACE FUNCTION app_user_id() RETURNS text
LANGUAGE sql STABLE AS $$ SELECT current_setting('app.user_id', true) $$;

-- 5. Policies
-- equipment : lecture/écriture pour technicien et admin, suppression admin.
DROP POLICY IF EXISTS equipment_select ON equipment;
CREATE POLICY equipment_select ON equipment FOR SELECT TO stockflow_app
  USING (app_role() IN ('technician', 'admin'));
DROP POLICY IF EXISTS equipment_insert ON equipment;
CREATE POLICY equipment_insert ON equipment FOR INSERT TO stockflow_app
  WITH CHECK (app_role() IN ('technician', 'admin'));
DROP POLICY IF EXISTS equipment_update ON equipment;
CREATE POLICY equipment_update ON equipment FOR UPDATE TO stockflow_app
  USING (app_role() IN ('technician', 'admin'))
  WITH CHECK (app_role() IN ('technician', 'admin'));
DROP POLICY IF EXISTS equipment_delete ON equipment;
CREATE POLICY equipment_delete ON equipment FOR DELETE TO stockflow_app
  USING (app_role() = 'admin');

-- incidents : même matrice que equipment.
DROP POLICY IF EXISTS incidents_select ON incidents;
CREATE POLICY incidents_select ON incidents FOR SELECT TO stockflow_app
  USING (app_role() IN ('technician', 'admin'));
DROP POLICY IF EXISTS incidents_insert ON incidents;
CREATE POLICY incidents_insert ON incidents FOR INSERT TO stockflow_app
  WITH CHECK (app_role() IN ('technician', 'admin'));
DROP POLICY IF EXISTS incidents_update ON incidents;
CREATE POLICY incidents_update ON incidents FOR UPDATE TO stockflow_app
  USING (app_role() IN ('technician', 'admin'))
  WITH CHECK (app_role() IN ('technician', 'admin'));
DROP POLICY IF EXISTS incidents_delete ON incidents;
CREATE POLICY incidents_delete ON incidents FOR DELETE TO stockflow_app
  USING (app_role() = 'admin');

-- users : lecture de soi-même ou admin ; écriture admin uniquement.
DROP POLICY IF EXISTS users_select ON users;
CREATE POLICY users_select ON users FOR SELECT TO stockflow_app
  USING (app_role() = 'admin' OR id = app_user_id());
DROP POLICY IF EXISTS users_insert ON users;
CREATE POLICY users_insert ON users FOR INSERT TO stockflow_app
  WITH CHECK (app_role() = 'admin');
DROP POLICY IF EXISTS users_update ON users;
CREATE POLICY users_update ON users FOR UPDATE TO stockflow_app
  USING (app_role() = 'admin')
  WITH CHECK (app_role() = 'admin');
DROP POLICY IF EXISTS users_delete ON users;
CREATE POLICY users_delete ON users FOR DELETE TO stockflow_app
  USING (app_role() = 'admin');

-- refresh_tokens : manipulés par le flux auth AVANT qu'une identité soit posée
-- (login/refresh/logout) → ouverts au rôle app, fermés à tout le reste. Ne
-- contiennent que des hash SHA-256 de tokens aléatoires, pas de secret direct.
DROP POLICY IF EXISTS refresh_tokens_all ON refresh_tokens;
CREATE POLICY refresh_tokens_all ON refresh_tokens FOR ALL TO stockflow_app
  USING (true) WITH CHECK (true);

-- 6. Fonctions SECURITY DEFINER (propriétaire postgres, BYPASSRLS) : seul accès
-- au password_hash pour le login ; lookup user par id pour le refresh.
-- SET search_path fige la résolution pour éviter tout détournement.
CREATE OR REPLACE FUNCTION auth_login_lookup(p_email text)
RETURNS TABLE (id text, name text, email text, role text, password_hash text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT u.id, u.name, u.email, u.role, u.password_hash
  FROM users u WHERE lower(u.email) = lower(p_email)
$$;
REVOKE ALL ON FUNCTION auth_login_lookup(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_login_lookup(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION auth_login_lookup(text) TO stockflow_app;

CREATE OR REPLACE FUNCTION auth_refresh_lookup(p_user_id text)
RETURNS TABLE (id text, name text, email text, role text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT u.id, u.name, u.email, u.role FROM users u WHERE u.id = p_user_id
$$;
REVOKE ALL ON FUNCTION auth_refresh_lookup(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_refresh_lookup(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION auth_refresh_lookup(text) TO stockflow_app;
