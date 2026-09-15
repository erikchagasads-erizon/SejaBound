import { createClient } from '@/lib/supabase/server';
import { BarChart3 } from 'lucide-react';
import {
  ReportsDashboard,
  type ReportTaskItem,
  type ReportDeliveryItem,
  type ReportBriefingItem,
  type SavedReport,
} from '@/components/admin/reports-dashboard';
import type { ClientRow } from '@/lib/supabase/types';

export const metadata = { title: 'Relatórios | Bound Admin' };

export default async function ReportsPage() {
  const supabase = await createClient();

  const [
    { data: clients },
    { data: tasks },
    { data: deliveries },
    { data: briefings },
    { data: savedReports },
  ] = await Promise.all([
    supabase.from('clients').select('id, name, primary_color').order('name'),
    supabase
      .from('tasks')
      .select('id, type, priority, status, client_id, column_id, created_at, due_date, kanban_columns(name, is_final)')
      .order('created_at', { ascending: false }),
    supabase
      .from('deliveries')
      .select('id, status, created_at, reviewed_at, task_id, tasks(client_id)')
      .order('created_at', { ascending: false }),
    supabase
      .from('briefings')
      .select('id, status, client_id, created_at, category')
      .order('created_at', { ascending: false }),
    supabase
      .from('reports')
      .select('id, title, client_id, period_start, period_end, created_at, clients(name), profiles:created_by(full_name)')
      .order('created_at', { ascending: false }),
  ]);

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 28 }}>
            <BarChart3 size={26} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
            <span className="gradient-text">Relatórios</span>
          </h1>
          <p className="page-subtitle">Visão geral de produção, entregas e tráfego</p>
        </div>
      </div>

      <ReportsDashboard
        clients={(clients ?? []) as Pick<ClientRow, 'id' | 'name' | 'primary_color'>[]}
        tasks={(tasks ?? []) as unknown as ReportTaskItem[]}
        deliveries={(deliveries ?? []) as unknown as ReportDeliveryItem[]}
        briefings={(briefings ?? []) as unknown as ReportBriefingItem[]}
        savedReports={(savedReports ?? []) as unknown as SavedReport[]}
      />
    </div>
  );
}
