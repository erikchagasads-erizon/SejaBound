-- ============================================================
-- Bound Marketing Portal — Schema Completo
-- Execute no Supabase SQL Editor
-- ============================================================

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'collaborator', 'client');
CREATE TYPE task_type AS ENUM ('design', 'social_media', 'traffic', 'content', 'web', 'video', 'photo', 'report', 'other');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE delivery_status AS ENUM ('pending', 'approved', 'revision_requested');
CREATE TYPE briefing_status AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE email_status AS ENUM ('sent', 'failed');

-- ============================================================
-- PROFILES (extensão de auth.users)
-- ============================================================
CREATE TABLE profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text,
  avatar_url    text,
  role          user_role NOT NULL DEFAULT 'client',
  preferred_lang text NOT NULL DEFAULT 'pt',
  theme         text NOT NULL DEFAULT 'dark',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Trigger: cria profile automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE clients (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  logo_url       text,
  company        text,
  primary_color  text,
  contact_email  text,
  created_by     uuid NOT NULL REFERENCES profiles(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- CLIENT_USERS (vincula profile de role=client a um client)
-- ============================================================
CREATE TABLE client_users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  profile_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(client_id, profile_id)
);

-- ============================================================
-- COLLABORATOR_CLIENTS (vincula colaborador a cliente)
-- ============================================================
CREATE TABLE collaborator_clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  UNIQUE(collaborator_id, client_id)
);

-- ============================================================
-- KANBAN_COLUMNS (configuráveis pelo admin)
-- ============================================================
CREATE TABLE kanban_columns (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  color       text,
  position    int NOT NULL,
  is_final    boolean NOT NULL DEFAULT false,
  created_by  uuid NOT NULL REFERENCES profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Colunas default
INSERT INTO kanban_columns (name, color, position, is_final, created_by)
SELECT 'Backlog', '#6B7280', 1, false, id FROM profiles WHERE role = 'admin' LIMIT 1;
INSERT INTO kanban_columns (name, color, position, is_final, created_by)
SELECT 'Em Andamento', '#3B82F6', 2, false, id FROM profiles WHERE role = 'admin' LIMIT 1;
INSERT INTO kanban_columns (name, color, position, is_final, created_by)
SELECT 'Em Revisão', '#F59E0B', 3, false, id FROM profiles WHERE role = 'admin' LIMIT 1;
INSERT INTO kanban_columns (name, color, position, is_final, created_by)
SELECT 'Aguardando Aprovação', '#8B5CF6', 4, false, id FROM profiles WHERE role = 'admin' LIMIT 1;
INSERT INTO kanban_columns (name, color, position, is_final, created_by)
SELECT 'Concluído', '#10B981', 5, true, id FROM profiles WHERE role = 'admin' LIMIT 1;

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text,
  type         task_type NOT NULL DEFAULT 'other',
  client_id    uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  column_id    uuid NOT NULL REFERENCES kanban_columns(id),
  assignee_id  uuid REFERENCES profiles(id),
  due_date     date,
  priority     task_priority NOT NULL DEFAULT 'medium',
  sprint_week  text,
  created_by   uuid NOT NULL REFERENCES profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Trigger: atualiza updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TASK_ACTIVITY (timeline de histórico)
-- ============================================================
CREATE TABLE task_activity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id    uuid NOT NULL REFERENCES profiles(id),
  action      text NOT NULL,
  old_value   text,
  new_value   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- DELIVERIES
-- ============================================================
CREATE TABLE deliveries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id          uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  status           delivery_status NOT NULL DEFAULT 'pending',
  client_feedback  text,
  reviewed_by      uuid REFERENCES profiles(id),
  reviewed_at      timestamptz,
  created_by       uuid NOT NULL REFERENCES profiles(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- DELIVERY_FILES
-- ============================================================
CREATE TABLE delivery_files (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id  uuid NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  file_name    text NOT NULL,
  file_url     text NOT NULL,
  file_size    bigint,
  mime_type    text,
  uploaded_by  uuid NOT NULL REFERENCES profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- BRIEFINGS
-- ============================================================
CREATE TABLE briefings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  submitted_by  uuid NOT NULL REFERENCES profiles(id),
  title         text NOT NULL,
  description   text NOT NULL,
  category      text,
  attachments   jsonb NOT NULL DEFAULT '[]',
  status        briefing_status NOT NULL DEFAULT 'open',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title         text NOT NULL,
  period_start  date,
  period_end    date,
  data          jsonb NOT NULL DEFAULT '{}',
  created_by    uuid NOT NULL REFERENCES profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- EMAIL_NOTIFICATIONS
-- ============================================================
CREATE TABLE email_notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  uuid NOT NULL REFERENCES profiles(id),
  template      text,
  subject       text,
  sent_at       timestamptz NOT NULL DEFAULT now(),
  status        email_status NOT NULL DEFAULT 'sent'
);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-files', 'delivery-files', false);

INSERT INTO storage.buckets (id, name, public)
VALUES ('briefing-attachments', 'briefing-attachments', false);

INSERT INTO storage.buckets (id, name, public)
VALUES ('client-logos', 'client-logos', true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborator_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT get_my_role() = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES policies
-- ============================================================
CREATE POLICY "profiles: admin full access" ON profiles
  FOR ALL USING (is_admin());

CREATE POLICY "profiles: self read/update" ON profiles
  FOR ALL USING (id = auth.uid());

-- ============================================================
-- CLIENTS policies
-- ============================================================
CREATE POLICY "clients: admin full" ON clients
  FOR ALL USING (is_admin());

CREATE POLICY "clients: collaborator read assigned" ON clients
  FOR SELECT USING (
    get_my_role() = 'collaborator' AND
    id IN (SELECT client_id FROM collaborator_clients WHERE collaborator_id = auth.uid())
  );

CREATE POLICY "clients: client read own" ON clients
  FOR SELECT USING (
    get_my_role() = 'client' AND
    id IN (SELECT client_id FROM client_users WHERE profile_id = auth.uid())
  );

-- ============================================================
-- CLIENT_USERS policies
-- ============================================================
CREATE POLICY "client_users: admin full" ON client_users
  FOR ALL USING (is_admin());

CREATE POLICY "client_users: self read" ON client_users
  FOR SELECT USING (profile_id = auth.uid());

-- ============================================================
-- COLLABORATOR_CLIENTS policies
-- ============================================================
CREATE POLICY "collaborator_clients: admin full" ON collaborator_clients
  FOR ALL USING (is_admin());

CREATE POLICY "collaborator_clients: self read" ON collaborator_clients
  FOR SELECT USING (collaborator_id = auth.uid());

-- ============================================================
-- KANBAN_COLUMNS policies
-- ============================================================
CREATE POLICY "kanban_columns: admin full" ON kanban_columns
  FOR ALL USING (is_admin());

CREATE POLICY "kanban_columns: others read" ON kanban_columns
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- TASKS policies
-- ============================================================
CREATE POLICY "tasks: admin full" ON tasks
  FOR ALL USING (is_admin());

CREATE POLICY "tasks: collaborator crud assigned" ON tasks
  FOR ALL USING (
    get_my_role() = 'collaborator' AND
    client_id IN (SELECT client_id FROM collaborator_clients WHERE collaborator_id = auth.uid())
  );

CREATE POLICY "tasks: client read own" ON tasks
  FOR SELECT USING (
    get_my_role() = 'client' AND
    client_id IN (SELECT client_id FROM client_users WHERE profile_id = auth.uid())
  );

-- ============================================================
-- TASK_ACTIVITY policies
-- ============================================================
CREATE POLICY "task_activity: admin full" ON task_activity
  FOR ALL USING (is_admin());

CREATE POLICY "task_activity: collaborator read/insert own tasks" ON task_activity
  FOR ALL USING (
    get_my_role() = 'collaborator' AND
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN collaborator_clients cc ON cc.client_id = t.client_id
      WHERE cc.collaborator_id = auth.uid()
    )
  );

CREATE POLICY "task_activity: client read own tasks" ON task_activity
  FOR SELECT USING (
    get_my_role() = 'client' AND
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN client_users cu ON cu.client_id = t.client_id
      WHERE cu.profile_id = auth.uid()
    )
  );

-- ============================================================
-- DELIVERIES policies
-- ============================================================
CREATE POLICY "deliveries: admin full" ON deliveries
  FOR ALL USING (is_admin());

CREATE POLICY "deliveries: collaborator crud own tasks" ON deliveries
  FOR ALL USING (
    get_my_role() = 'collaborator' AND
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN collaborator_clients cc ON cc.client_id = t.client_id
      WHERE cc.collaborator_id = auth.uid()
    )
  );

CREATE POLICY "deliveries: client read and review own" ON deliveries
  FOR ALL USING (
    get_my_role() = 'client' AND
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN client_users cu ON cu.client_id = t.client_id
      WHERE cu.profile_id = auth.uid()
    )
  );

-- ============================================================
-- DELIVERY_FILES policies
-- ============================================================
CREATE POLICY "delivery_files: admin full" ON delivery_files
  FOR ALL USING (is_admin());

CREATE POLICY "delivery_files: collaborator upload/manage" ON delivery_files
  FOR ALL USING (
    get_my_role() = 'collaborator' AND
    delivery_id IN (
      SELECT d.id FROM deliveries d
      JOIN tasks t ON t.id = d.task_id
      JOIN collaborator_clients cc ON cc.client_id = t.client_id
      WHERE cc.collaborator_id = auth.uid()
    )
  );

CREATE POLICY "delivery_files: client read own" ON delivery_files
  FOR SELECT USING (
    get_my_role() = 'client' AND
    delivery_id IN (
      SELECT d.id FROM deliveries d
      JOIN tasks t ON t.id = d.task_id
      JOIN client_users cu ON cu.client_id = t.client_id
      WHERE cu.profile_id = auth.uid()
    )
  );

-- ============================================================
-- BRIEFINGS policies
-- ============================================================
CREATE POLICY "briefings: admin full" ON briefings
  FOR ALL USING (is_admin());

CREATE POLICY "briefings: collaborator read assigned" ON briefings
  FOR SELECT USING (
    get_my_role() = 'collaborator' AND
    client_id IN (SELECT client_id FROM collaborator_clients WHERE collaborator_id = auth.uid())
  );

CREATE POLICY "briefings: client crud own" ON briefings
  FOR ALL USING (
    get_my_role() = 'client' AND
    client_id IN (SELECT client_id FROM client_users WHERE profile_id = auth.uid())
  );

-- ============================================================
-- REPORTS policies
-- ============================================================
CREATE POLICY "reports: admin full" ON reports
  FOR ALL USING (is_admin());

CREATE POLICY "reports: collaborator read assigned" ON reports
  FOR SELECT USING (
    get_my_role() = 'collaborator' AND
    client_id IN (SELECT client_id FROM collaborator_clients WHERE collaborator_id = auth.uid())
  );

CREATE POLICY "reports: client read own" ON reports
  FOR SELECT USING (
    get_my_role() = 'client' AND
    client_id IN (SELECT client_id FROM client_users WHERE profile_id = auth.uid())
  );

-- ============================================================
-- EMAIL_NOTIFICATIONS policies
-- ============================================================
CREATE POLICY "email_notifications: admin full" ON email_notifications
  FOR ALL USING (is_admin());

CREATE POLICY "email_notifications: self read" ON email_notifications
  FOR SELECT USING (recipient_id = auth.uid());

-- ============================================================
-- STORAGE policies
-- ============================================================

-- delivery-files: colaboradores fazem upload, clientes e admin leem
CREATE POLICY "delivery-files: admin full" ON storage.objects
  FOR ALL USING (bucket_id = 'delivery-files' AND is_admin());

CREATE POLICY "delivery-files: collaborator upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'delivery-files' AND
    get_my_role() = 'collaborator'
  );

CREATE POLICY "delivery-files: collaborator manage own" ON storage.objects
  FOR ALL USING (
    bucket_id = 'delivery-files' AND
    get_my_role() = 'collaborator' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "delivery-files: authenticated read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'delivery-files' AND
    auth.uid() IS NOT NULL
  );

-- client-logos: público para leitura, admin para escrita
CREATE POLICY "client-logos: admin manage" ON storage.objects
  FOR ALL USING (bucket_id = 'client-logos' AND is_admin());

CREATE POLICY "client-logos: public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'client-logos');

-- avatars: cada usuário gerencia o próprio
CREATE POLICY "avatars: self manage" ON storage.objects
  FOR ALL USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars: public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- briefing-attachments: clientes e admin gerenciam
CREATE POLICY "briefing-attachments: auth manage" ON storage.objects
  FOR ALL USING (
    bucket_id = 'briefing-attachments' AND
    auth.uid() IS NOT NULL
  );

