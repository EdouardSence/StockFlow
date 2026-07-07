-- Changement de mot de passe self-service (issue #13).
--
-- users_update est admin-only (voir 004_rls_policies.sql) : un technicien ne
-- peut pas modifier sa propre ligne, donc pas son password_hash. Comme pour
-- le login, deux fonctions SECURITY DEFINER dédiées bypass RLS pour cette
-- seule colonne — jamais appelées avec un id arbitraire venant du client,
-- toujours avec context.user.id résolu depuis le JWT côté serveur
-- (changePassword dans auth-server.ts).

CREATE OR REPLACE FUNCTION auth_password_lookup(p_user_id text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT u.password_hash FROM users u WHERE u.id = p_user_id
$$;
REVOKE ALL ON FUNCTION auth_password_lookup(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_password_lookup(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION auth_password_lookup(text) TO stockflow_app;

CREATE OR REPLACE FUNCTION auth_change_password(p_user_id text, p_new_hash text)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE users SET password_hash = p_new_hash WHERE id = p_user_id
$$;
REVOKE ALL ON FUNCTION auth_change_password(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_change_password(text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION auth_change_password(text, text) TO stockflow_app;
