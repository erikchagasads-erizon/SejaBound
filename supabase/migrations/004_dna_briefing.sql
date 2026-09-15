-- ============================================================
-- Migration 004: dna_briefing_submissions
-- Respostas do questionário público "Briefing com método DNA
-- BND" (/briefing-dna). Formulário sem login, acessado via link
-- privado — não existe nenhuma policy pública. Todo insert
-- acontece via o client admin (service role) na Server Action,
-- que já bypassa RLS; a policy abaixo só habilita leitura/gestão
-- futura pelo painel admin autenticado.
-- ============================================================

CREATE TABLE dna_briefing_submissions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problema_real        text NOT NULL,
  clientes_atuais      text NOT NULL,
  objecao_venda        text NOT NULL,
  ticket_medio         text NOT NULL,
  meta_faturamento     text NOT NULL,
  concorrentes         text NOT NULL,
  diferencial          text NOT NULL,
  founder_story        text NOT NULL,
  marketing_anterior   text NOT NULL,
  submitted_at         timestamptz NOT NULL DEFAULT now(),
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dna_briefing_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dna_briefing_submissions: admin full" ON dna_briefing_submissions
  FOR ALL USING (is_admin());
