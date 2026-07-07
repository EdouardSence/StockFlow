-- Gestion des comptes via UI admin (issue #12) : création + désactivation.
--
-- Désactivation = password_hash mis à NULL, mécanisme déjà prévu par
-- 003_auth_password_refresh_tokens.sql ("compte non activable, pas de login
-- possible") — pas de nouvelle colonne, pas de double bookkeeping. Création
-- et désactivation passent par un admin authentifié (adminMiddleware) via
-- withAuthContext normal : users_insert/users_update sont déjà admin-only en
-- RLS et le rôle app a les GRANT nécessaires (voir 004_rls_policies.sql), pas
-- besoin de bypass SECURITY DEFINER pour ces deux actions.
--
-- Lister les comptes avec leur statut est le seul cas qui en a besoin : le
-- rôle app ne peut pas SELECT password_hash (grant par colonnes) donc ne
-- peut pas dériver "actif" tout seul. Cette fonction expose uniquement un
-- booléen dérivé, jamais le hash.
CREATE OR REPLACE FUNCTION auth_list_users_with_status()
RETURNS TABLE (id text, name text, email text, role text, created_at timestamptz, active boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT u.id, u.name, u.email, u.role, u.created_at, (u.password_hash IS NOT NULL) AS active
  FROM users u
  ORDER BY u.created_at DESC
$$;
REVOKE ALL ON FUNCTION auth_list_users_with_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_list_users_with_status() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION auth_list_users_with_status() TO stockflow_app;
