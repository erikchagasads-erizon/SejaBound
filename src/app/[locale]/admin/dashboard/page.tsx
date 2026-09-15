import { createClient } from '@/lib/supabase/server';
import { Users, Briefcase, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { AdminDashboardCharts } from '@/components/admin/dashboard-charts';
import type { TaskRow, TaskActivityRow, ProfileRow } from '@/lib/supabase/types';

export const metadata = { title: 'Dashboard' };

async function getDashboardData() {
  const supabase = await createClient();

  const [
    { count: totalClients },
    { count: totalCollaborators },
    { count: activeTasks },
    { count: pendingApprovals },
    { count: completedThisMonth },
    { data: rawActivity },
    { data: rawTasks },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'collaborator'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).not('column_id', 'is', null),
    supabase.from('deliveries').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase
      .from('task_activity')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('tasks').select('type'),
  ]);

  const tasks = (rawTasks ?? []) as Pick<TaskRow, 'type'>[];
  const activity = (rawActivity ?? []) as (TaskActivityRow & { profiles: Pick<ProfileRow, 'full_name'> | null })[];

  const typeCount: Record<string, number> = {};
  tasks.forEach(t => { typeCount[t.type] = (typeCount[t.type] ?? 0) + 1; });

  return {
    totalClients: totalClients ?? 0,
    totalCollaborators: totalCollaborators ?? 0,
    activeTasks: activeTasks ?? 0,
    pendingApprovals: pendingApprovals ?? 0,
    completedThisMonth: completedThisMonth ?? 0,
    recentActivity: activity,
    tasksByType: typeCount,
  };
}

const TYPE_LABELS: Record<string, string> = {
  design: 'Design', social_media: 'Social', traffic: 'Tráfego',
  content: 'Conteúdo', web: 'Web', video: 'Vídeo', photo: 'Foto',
  report: 'Relatório', other: 'Outro',
};

export default async function AdminDashboard() {
  const data = await getDashboardData();

  const stats = [
    { id: 'stat-clients',          label: 'Clientes',             value: data.totalClients,       icon: Users,        color: 'hsl(25 45% 17%)',  bg: 'hsl(25 45% 17% / 0.12)'  },
    { id: 'stat-collaborators',    label: 'Colaboradores',        value: data.totalCollaborators,  icon: Briefcase,    color: 'hsl(103 22% 23%)', bg: 'hsl(103 22% 23% / 0.12)' },
    { id: 'stat-active-tasks',     label: 'Tarefas Ativas',       value: data.activeTasks,         icon: Clock,        color: 'hsl(33 73% 50%)',  bg: 'hsl(33 73% 50% / 0.12)'  },
    { id: 'stat-pending-approvals',label: 'Aguardando Aprovação', value: data.pendingApprovals,    icon: AlertCircle,  color: 'hsl(23 36% 49%)',  bg: 'hsl(23 36% 49% / 0.12)'  },
    { id: 'stat-completed',        label: 'Concluídas este mês',  value: data.completedThisMonth,  icon: CheckCircle,  color: 'hsl(122 39% 38%)', bg: 'hsl(122 39% 38% / 0.12)' },
  ];

  const chartData = Object.entries(data.tasksByType).map(([type, count]) => ({
    name: TYPE_LABELS[type] ?? type,
    value: count,
  }));

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 28 }}>
            Dashboard <span className="gradient-text">Admin</span>
          </h1>
          <p className="page-subtitle">Visão geral da operação da agência</p>
        </div>
        <div className="header-badge">
          <TrendingUp size={14} />
          <span>Ao vivo</span>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} id={stat.id} className="stat-card card">
              <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>
                <Icon size={22} />
              </div>
              <div className="stat-body">
                <span className="stat-value">{stat.value.toLocaleString('pt-BR')}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <div className="card chart-card">
          <h2 className="card-title">Tarefas por Categoria</h2>
          <AdminDashboardCharts data={chartData} />
        </div>
        <div className="card activity-card">
          <h2 className="card-title">Atividade Recente</h2>
          <div className="activity-list">
            {data.recentActivity.length === 0 ? (
              <p className="empty-state">Nenhuma atividade registrada.</p>
            ) : (
              data.recentActivity.map((item) => (
                <div key={item.id} className="activity-item">
                  <div className="activity-dot" />
                  <div className="activity-content">
                    <span className="activity-actor">{item.profiles?.full_name ?? 'Usuário'}</span>
                    <span className="activity-action">{item.action}</span>
                    {item.new_value && <span className="activity-value">{item.new_value}</span>}
                    <span className="activity-time">
                      {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
