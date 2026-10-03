-- 010_user_profiles_insert_policy.sql
-- Tambahkan policy INSERT agar user bisa membuat profil pertama kali

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);