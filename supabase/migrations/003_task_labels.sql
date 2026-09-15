-- ============================================================
-- Migration 003: task_labels
-- Tabela de labels vinculadas a tasks, alimentada inicialmente
-- pelo import de Trello (cópia denormalizada de name + color).
-- RLS segue o mesmo padrão de tasks: admin full, collaborator
-- CRUD nos clientes vinculados, client read nas próprias.
-- ============================================================

CREATE TABLE task_labels (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_labels_task_id ON task_labels(task_id);

ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_labels: admin full" ON task_labels
  FOR ALL USING (is_admin());

CREATE POLICY "task_labels: via task collaborator" ON task_labels
  FOR ALL USING (
    get_my_role() = 'collaborator' AND
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN collaborator_clients cc ON cc.client_id = t.client_id
      WHERE cc.collaborator_id = auth.uid()
    )
  );

CREATE POLICY "task_labels: via task client read" ON task_labels
  FOR SELECT USING (
    get_my_role() = 'client' AND
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN client_users cu ON cu.client_id = t.client_id
      WHERE cu.profile_id = auth.uid()
    )
  );
