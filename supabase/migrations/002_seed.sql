-- ============================================================
-- Bound Marketing — Seed Data
-- ATENÇÃO: Execute APÓS criar os usuários via Supabase Auth
-- Dashboard ou via API. Substitua os UUIDs pelos reais.
-- ============================================================

-- PASSO 1: Crie os usuários no Supabase Auth Dashboard:
--   Admin:        admin@boundmarketing.com.br  / Admin@123
--   Colaborador:  joana@boundmarketing.com.br  / Collab@123
--   Cliente:      cliente@empresaexemplo.com   / Client@123

-- PASSO 2: Anote os UUIDs gerados e substitua abaixo:
-- (O trigger handle_new_user já cria os profiles automaticamente)

-- PASSO 3: Atualize os roles manualmente (o trigger cria como 'client' por padrão)
-- UPDATE profiles SET role = 'admin'        WHERE id = 'UUID-DO-ADMIN';
-- UPDATE profiles SET role = 'collaborator' WHERE id = 'UUID-DO-COLABORADOR';
-- UPDATE profiles SET full_name = 'Administrador Bound'  WHERE id = 'UUID-DO-ADMIN';
-- UPDATE profiles SET full_name = 'Joana Silva'          WHERE id = 'UUID-DO-COLABORADOR';
-- UPDATE profiles SET full_name = 'Carlos Empresa'       WHERE id = 'UUID-DO-CLIENTE';

-- PASSO 4: Crie um cliente de exemplo
-- INSERT INTO clients (name, company, contact_email, created_by)
-- VALUES ('Empresa Exemplo Ltda', 'Empresa Exemplo', 'carlos@empresaexemplo.com', 'UUID-DO-ADMIN');

-- PASSO 5: Vincule o perfil de cliente ao registro de cliente
-- INSERT INTO client_users (client_id, profile_id)
-- VALUES ('UUID-DO-CLIENT-RECORD', 'UUID-DO-CLIENTE');

-- PASSO 6: Vincule o colaborador ao cliente
-- INSERT INTO collaborator_clients (collaborator_id, client_id)
-- VALUES ('UUID-DO-COLABORADOR', 'UUID-DO-CLIENT-RECORD');

-- PASSO 7: Verifique se as colunas kanban foram criadas (pelo schema)
-- SELECT * FROM kanban_columns ORDER BY position;

-- Script alternativo: seed automatizado (execute após ter ao menos 1 admin)
-- Este script usa a função para buscar o primeiro admin
DO $$
DECLARE
  v_admin_id uuid;
  v_collab_id uuid;
  v_client_profile_id uuid;
  v_client_id uuid;
  v_column_backlog_id uuid;
BEGIN
  -- Busca o primeiro admin
  SELECT id INTO v_admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
  SELECT id INTO v_collab_id FROM profiles WHERE role = 'collaborator' LIMIT 1;
  SELECT id INTO v_client_profile_id FROM profiles WHERE role = 'client' LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'Nenhum admin encontrado. Crie o usuário admin primeiro.';
    RETURN;
  END IF;

  -- Cria colunas kanban se não existirem
  IF NOT EXISTS (SELECT 1 FROM kanban_columns LIMIT 1) THEN
    INSERT INTO kanban_columns (name, color, position, is_final, created_by) VALUES
      ('Backlog',              '#6B7280', 1, false, v_admin_id),
      ('Em Andamento',         '#3B82F6', 2, false, v_admin_id),
      ('Em Revisão',           '#F59E0B', 3, false, v_admin_id),
      ('Aguardando Aprovação', '#8B5CF6', 4, false, v_admin_id),
      ('Concluído',            '#10B981', 5, true,  v_admin_id);
    RAISE NOTICE 'Colunas Kanban criadas.';
  END IF;

  -- Cria cliente de exemplo se não existir
  IF v_client_id IS NULL AND v_collab_id IS NOT NULL AND v_client_profile_id IS NOT NULL THEN
    INSERT INTO clients (name, company, contact_email, created_by)
    VALUES ('Empresa Exemplo Ltda', 'Empresa Exemplo', 'cliente@exemplo.com', v_admin_id)
    RETURNING id INTO v_client_id;

    INSERT INTO client_users (client_id, profile_id) VALUES (v_client_id, v_client_profile_id);
    INSERT INTO collaborator_clients (collaborator_id, client_id) VALUES (v_collab_id, v_client_id);

    -- Tarefa de exemplo
    SELECT id INTO v_column_backlog_id FROM kanban_columns WHERE position = 1 LIMIT 1;
    INSERT INTO tasks (title, description, type, client_id, column_id, assignee_id, priority, created_by)
    VALUES ('Identidade Visual — Logo', 'Criar logo principal e variações', 'design', v_client_id, v_column_backlog_id, v_collab_id, 'high', v_admin_id);

    RAISE NOTICE 'Seed concluído com sucesso!';
  END IF;
END $$;
