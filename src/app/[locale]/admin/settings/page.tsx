import { createClient } from '@/lib/supabase/server';
import { KanbanColumnEditor } from '@/components/admin/kanban-column-editor';
import { Settings, Info } from 'lucide-react';
import type { KanbanColumnRow } from '@/lib/supabase/types';

export const metadata = { title: 'Configurações | Bound Admin' };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('kanban_columns')
    .select('*')
    .order('position', { ascending: true });

  const columns = (data ?? []) as KanbanColumnRow[];

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 28 }}>
            <Settings size={26} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
            <span className="gradient-text">Configurações</span>
          </h1>
          <p className="page-subtitle">Personalize as colunas do Kanban</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Column Editor */}
        <div className="card" style={{ padding: 24 }}>
          <div className="section-header">
            <h2 className="section-title">Colunas do Kanban</h2>
            <p className="section-desc">Arraste para reordenar. Clique no ✓ para marcar como coluna final (concluído).</p>
          </div>

          <KanbanColumnEditor initialColumns={columns} />
        </div>

        {/* Info card */}
        <div className="card info-card" style={{ padding: 20 }}>
          <div className="info-icon"><Info size={18} /></div>
          <h3 className="info-title">Como funciona</h3>
          <ul className="info-list">
            <li>As colunas aparecem no <strong>Kanban Global</strong> e no painel do colaborador.</li>
            <li>Colunas marcadas como <strong>Final</strong> indicam tarefas concluídas.</li>
            <li>Excluir uma coluna <strong>não</strong> exclui as tarefas vinculadas.</li>
            <li>A ordem aqui define a ordem no quadro Kanban.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
