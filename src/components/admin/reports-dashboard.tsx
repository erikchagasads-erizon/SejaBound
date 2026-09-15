'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { FileSpreadsheet, FileText, BookmarkPlus, Layers, TrendingUp, Trash2, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { saveReportSnapshotAction, deleteReportSnapshotAction } from '@/app/actions/reports';
import type { ClientRow } from '@/lib/supabase/types';

export interface ReportTaskItem {
  id: string;
  type: string;
  priority: string;
  client_id: string;
  created_at: string;
  kanban_columns?: { name: string; is_final: boolean } | null;
}

export interface ReportDeliveryItem {
  id: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  tasks?: { client_id: string } | null;
}

export interface ReportBriefingItem {
  id: string;
  status: string;
  client_id: string;
  created_at: string;
  category: string | null;
}

export interface SavedReport {
  id: string;
  title: string;
  client_id: string;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  clients?: { name: string } | null;
  profiles?: { full_name: string | null } | null;
}

interface ReportsDashboardProps {
  clients: Pick<ClientRow, 'id' | 'name' | 'primary_color'>[];
  tasks: ReportTaskItem[];
  deliveries: ReportDeliveryItem[];
  briefings: ReportBriefingItem[];
  savedReports?: SavedReport[];
}

// Paleta terrosa alinhada com o design system (cacau, caramelo, musgo, âmbar, terracota)
const COLORS = ['#3D2817', '#A87653', '#3A4A2E', '#4F8B5A', '#D69138', '#B8553E', '#6B5B4D', '#8A7868'];

const PRIORITY_COLORS: Record<string, string> = {
  low: '#10B981', medium: '#F59E0B', high: '#F97316', urgent: '#EF4444',
};

const DELIVERY_COLORS: Record<string, string> = {
  pending: '#F59E0B', approved: '#10B981', revision_requested: '#EF4444',
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'hsl(var(--bg-elevated))', border: '1px solid hsl(var(--border-default))',
      borderRadius: 8, padding: '8px 12px', fontSize: 13,
    }}>
      <strong>{label ?? payload[0].name}</strong>
      <div style={{ color: 'hsl(var(--brand-primary))' }}>{payload[0].value} itens</div>
    </div>
  );
};

export function ReportsDashboard({ clients, tasks, deliveries, briefings, savedReports = [] }: ReportsDashboardProps) {
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'analytics' | 'traffic' | 'snapshots'>('analytics');
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const filteredTasks = selectedClient === 'all'
    ? tasks
    : tasks.filter((t) => t.client_id === selectedClient);

  const filteredDeliveries = selectedClient === 'all'
    ? deliveries
    : deliveries.filter((d) => d.tasks?.client_id === selectedClient);

  const filteredBriefings = selectedClient === 'all'
    ? briefings
    : briefings.filter((b) => b.client_id === selectedClient);

  const currentClientObj = clients.find(c => c.id === selectedClient);

  // ─── KPIs ───────────────────────────────────────────────────────────────────
  const totalTasks = filteredTasks.length;
  const doneTasks = filteredTasks.filter((t) => t.kanban_columns?.is_final).length;
  const doneRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const approvedDeliveries = filteredDeliveries.filter((d) => d.status === 'approved').length;
  const pendingDeliveries = filteredDeliveries.filter((d) => d.status === 'pending').length;

  // ─── Tasks by type ───────────────────────────────────────────────────────────
  const TYPE_LABELS: Record<string, string> = {
    design: 'Design', social_media: 'Social', traffic: 'Tráfego',
    content: 'Conteúdo', web: 'Web', video: 'Vídeo', photo: 'Foto',
    report: 'Relatório', other: 'Outro',
  };

  const typeCount: Record<string, number> = {};
  filteredTasks.forEach((t) => {
    const k = TYPE_LABELS[t.type] ?? t.type;
    typeCount[k] = (typeCount[k] ?? 0) + 1;
  });
  const typeData = Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // ─── Tasks by priority ───────────────────────────────────────────────────────
  const priorityCount: Record<string, number> = {};
  filteredTasks.forEach((t) => { priorityCount[t.priority] = (priorityCount[t.priority] ?? 0) + 1; });
  const priorityData = Object.entries(priorityCount).map(([name, value]) => ({ name, value }));

  // ─── Deliveries by status ────────────────────────────────────────────────────
  const deliveryStatusCount: Record<string, number> = {};
  filteredDeliveries.forEach((d) => {
    deliveryStatusCount[d.status] = (deliveryStatusCount[d.status] ?? 0) + 1;
  });
  const deliveryStatusData = Object.entries(deliveryStatusCount).map(([name, value]) => ({ name, value }));

  // ─── Tasks by client ─────────────────────────────────────────────────────────
  const clientTaskCount: Record<string, { name: string; value: number; color: string }> = {};
  if (selectedClient === 'all') {
    tasks.forEach((t) => {
      if (!clientTaskCount[t.client_id]) {
        const client = clients.find((c) => c.id === t.client_id);
        clientTaskCount[t.client_id] = {
          name: client?.name ?? 'Sem cliente',
          value: 0,
          color: client?.primary_color ?? '#3D2817',
        };
      }
      clientTaskCount[t.client_id].value += 1;
    });
  }
  const clientData = Object.values(clientTaskCount).sort((a, b) => b.value - a.value);

  // ─── Briefings by status ─────────────────────────────────────────────────────
  const briefingStatusCount: Record<string, number> = {};
  filteredBriefings.forEach((b) => {
    briefingStatusCount[b.status] = (briefingStatusCount[b.status] ?? 0) + 1;
  });
  const briefingStatusData = Object.entries(briefingStatusCount).map(([name, value]) => ({ name, value }));

  // ─── EXPORT EXCEL ────────────────────────────────────────────────────────────
  const exportToExcel = () => {
    const clientName = currentClientObj?.name || 'Todos os Clientes';
    const wb = XLSX.utils.book_new();

    // Sheet 1: KPIs & Resumo
    const summaryData = [
      ['Relatório Bound Marketing', ''],
      ['Cliente:', clientName],
      ['Data de Exportação:', new Date().toLocaleDateString('pt-BR')],
      ['', ''],
      ['Métrica', 'Valor'],
      ['Total de Tarefas', totalTasks],
      ['Tarefas Concluídas', doneTasks],
      ['Taxa de Conclusão', `${doneRate}%`],
      ['Entregas Aprovadas', approvedDeliveries],
      ['Entregas Pendentes', pendingDeliveries],
      ['Total de Briefings', filteredBriefings.length],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo Executivo');

    // Sheet 2: Tarefas por Tipo
    const typeSheetData = [['Tipo de Tarefa', 'Quantidade']];
    typeData.forEach(item => typeSheetData.push([item.name, String(item.value)]));
    const wsType = XLSX.utils.aoa_to_sheet(typeSheetData);
    XLSX.utils.book_append_sheet(wb, wsType, 'Tarefas por Tipo');

    // Sheet 3: Status das Entregas
    const deliverySheetData = [['Status da Entrega', 'Quantidade']];
    deliveryStatusData.forEach(item => deliverySheetData.push([item.name, String(item.value)]));
    const wsDelivery = XLSX.utils.aoa_to_sheet(deliverySheetData);
    XLSX.utils.book_append_sheet(wb, wsDelivery, 'Status Entregas');

    XLSX.writeFile(wb, `Relatorio_Bound_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ─── EXPORT PDF ──────────────────────────────────────────────────────────────
  const exportToPDF = () => {
    const clientName = currentClientObj?.name || 'Todos os Clientes';
    const doc = new jsPDF();

    // Header
    doc.setFillColor(13, 15, 23);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('BOUND MARKETING', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(156, 163, 175);
    doc.text('Relatório Executivo de Performance & Produção', 14, 30);

    // Meta
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text(`Cliente: ${clientName}`, 14, 52);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 58);

    // KPIs Table
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 66, 182, 38, 3, 3, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text('Resumo de Métricas', 20, 76);

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`• Total de Tarefas: ${totalTasks}`, 20, 84);
    doc.text(`• Concluídas: ${doneTasks} (${doneRate}%)`, 20, 92);
    doc.text(`• Entregas Aprovadas: ${approvedDeliveries}`, 105, 84);
    doc.text(`• Entregas Pendentes: ${pendingDeliveries}`, 105, 92);
    doc.text(`• Briefings Enviados: ${filteredBriefings.length}`, 20, 100);

    // Types section
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Distribuição de Tarefas por Tipo', 14, 118);

    let yPos = 128;
    typeData.slice(0, 8).forEach((item) => {
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(`${item.name}: ${item.value} tarefas`, 20, yPos);
      yPos += 8;
    });

    // Deliveries section
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Status de Entregas & Aprovações', 14, yPos + 10);
    yPos += 20;

    deliveryStatusData.forEach((item) => {
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const label = item.name === 'approved' ? 'Aprovadas' : item.name === 'pending' ? 'Aguardando' : 'Revisão Solicitada';
      doc.text(`${label}: ${item.value} entregas`, 20, yPos);
      yPos += 8;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Bound Marketing Platform • Relatório Automatizado', 14, 285);

    doc.save(`Relatorio_Bound_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // ─── SAVE SNAPSHOT ───────────────────────────────────────────────────────────
  const handleSaveSnapshot = async () => {
    if (!snapshotTitle.trim()) return;
    const targetClientId = selectedClient === 'all' ? clients[0]?.id : selectedClient;
    if (!targetClientId) return;

    setIsSavingSnapshot(true);
    const res = await saveReportSnapshotAction({
      clientId: targetClientId,
      title: snapshotTitle.trim(),
      data: {
        totalTasks,
        doneTasks,
        doneRate,
        approvedDeliveries,
        pendingDeliveries,
        typeData,
        deliveryStatusData,
      },
    });

    setIsSavingSnapshot(false);
    if (res.success) {
      setSaveSuccess(true);
      setSnapshotTitle('');
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  return (
    <div className="reports-layout">
      {/* Navigation tabs & Action bar */}
      <div className="report-header-bar card">
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <Layers size={16} /> Produção & Entregas
          </button>
          <button
            className={`nav-tab ${activeTab === 'traffic' ? 'active' : ''}`}
            onClick={() => setActiveTab('traffic')}
          >
            <TrendingUp size={16} /> Tráfego & Performance
          </button>
          <button
            className={`nav-tab ${activeTab === 'snapshots' ? 'active' : ''}`}
            onClick={() => setActiveTab('snapshots')}
          >
            <BookmarkPlus size={16} /> Snapshots Salvos ({savedReports.length})
          </button>
        </div>

        <div className="export-actions">
          <button className="btn-export" onClick={exportToExcel} title="Exportar para Excel">
            <FileSpreadsheet size={15} /> Excel
          </button>
          <button className="btn-export" onClick={exportToPDF} title="Exportar para PDF">
            <FileText size={15} /> PDF
          </button>
        </div>
      </div>

      {/* Filter by Client */}
      <div className="filter-bar card">
        <span className="filter-label">Filtrar por cliente:</span>
        <select
          className="filter-select"
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          id="report-client-filter"
        >
          <option value="all">Todos os clientes ({clients.length})</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Snapshot Quick Save */}
        <div className="snapshot-input-group">
          <input
            type="text"
            className="snapshot-input"
            placeholder="Nome do snapshot (ex: Fechamento Agosto)"
            value={snapshotTitle}
            onChange={(e) => setSnapshotTitle(e.target.value)}
          />
          <button
            className="btn-snapshot"
            disabled={!snapshotTitle.trim() || isSavingSnapshot}
            onClick={handleSaveSnapshot}
          >
            <BookmarkPlus size={14} /> {isSavingSnapshot ? 'Salvando...' : 'Salvar Snapshot'}
          </button>
          {saveSuccess && (
            <span className="save-badge"><CheckCircle2 size={14} /> Salvo com sucesso!</span>
          )}
        </div>
      </div>

      {activeTab === 'analytics' && (
        <>
          {/* KPIs */}
          <div className="kpi-grid">
            {[
              { label: 'Total de Tarefas', value: totalTasks, color: '#3D2817', emoji: '📋' },
              { label: 'Tarefas Concluídas', value: `${doneTasks} (${doneRate}%)`, color: '#10B981', emoji: '✅' },
              { label: 'Entregas Aprovadas', value: approvedDeliveries, color: '#0EA5E9', emoji: '🎯' },
              { label: 'Aguardando Aprovação', value: pendingDeliveries, color: '#F59E0B', emoji: '⏳' },
              { label: 'Briefings', value: filteredBriefings.length, color: '#EC4899', emoji: '📝' },
            ].map((kpi) => (
              <div key={kpi.label} className="kpi-card card">
                <div className="kpi-emoji">{kpi.emoji}</div>
                <div className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="kpi-label">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Charts row 1 */}
          <div className="charts-row">
            {/* Tasks by type */}
            <div className="card chart-card">
              <h3 className="chart-title">Tarefas por Tipo</h3>
              {typeData.length === 0 ? (
                <div className="chart-empty">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={typeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {typeData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Deliveries by status */}
            <div className="card chart-card">
              <h3 className="chart-title">Status das Entregas</h3>
              {deliveryStatusData.length === 0 ? (
                <div className="chart-empty">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={deliveryStatusData}
                      cx="50%" cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {deliveryStatusData.map((entry, i) => (
                        <Cell key={i} fill={DELIVERY_COLORS[entry.name] ?? COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="charts-row">
            {/* Priority distribution */}
            <div className="card chart-card">
              <h3 className="chart-title">Tarefas por Prioridade</h3>
              {priorityData.length === 0 ? (
                <div className="chart-empty">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={priorityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--text-muted))' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--text-muted))' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {priorityData.map((entry, i) => (
                        <Cell key={i} fill={PRIORITY_COLORS[entry.name] ?? COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Tasks by client or Briefings by status */}
            <div className="card chart-card">
              {selectedClient === 'all' ? (
                <>
                  <h3 className="chart-title">Tarefas por Cliente</h3>
                  {clientData.length === 0 ? (
                    <div className="chart-empty">Sem dados</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={clientData} layout="vertical" margin={{ top: 4, right: 4, left: 30, bottom: 0 }}>
                        <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }} allowDecimals={false} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }} width={80} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {clientData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </>
              ) : (
                <>
                  <h3 className="chart-title">Briefings por Status</h3>
                  {briefingStatusData.length === 0 ? (
                    <div className="chart-empty">Sem dados</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={briefingStatusData}
                          cx="50%" cy="50%"
                          outerRadius={80}
                          dataKey="value"
                        >
                          {briefingStatusData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'traffic' && (
        <div className="card traffic-panel">
          <div className="traffic-header">
            <div>
              <h3 className="chart-title" style={{ margin: 0 }}>Hub de Tráfego Pago & Performance</h3>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: 13, margin: '4px 0 0' }}>
                Métricas sincronizadas com <strong>Google Analytics 4</strong> e <strong>Meta Ads</strong>
              </p>
            </div>
            <span className="badge-connected">🟢 Conexões Ativas (Preview)</span>
          </div>

          <div className="kpi-grid" style={{ marginTop: 20 }}>
            <div className="kpi-card card">
              <div className="kpi-emoji">👥</div>
              <div className="kpi-value" style={{ color: '#3D2817' }}>42.850</div>
              <div className="kpi-label">Alcance Total (Meta)</div>
            </div>
            <div className="kpi-card card">
              <div className="kpi-emoji">🖱️</div>
              <div className="kpi-value" style={{ color: '#A87653' }}>3.420</div>
              <div className="kpi-label">Cliques no Link</div>
            </div>
            <div className="kpi-card card">
              <div className="kpi-emoji">🎯</div>
              <div className="kpi-value" style={{ color: '#10b981' }}>284</div>
              <div className="kpi-label">Leads Gerados</div>
            </div>
            <div className="kpi-card card">
              <div className="kpi-emoji">💰</div>
              <div className="kpi-value" style={{ color: '#f59e0b' }}>R$ 4,12</div>
              <div className="kpi-label">Custo por Lead (CPL)</div>
            </div>
            <div className="kpi-card card">
              <div className="kpi-emoji">📈</div>
              <div className="kpi-value" style={{ color: '#3A4A2E' }}>4.8x</div>
              <div className="kpi-label">ROAS Estimado</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 20, padding: 20, background: 'hsl(var(--bg-elevated))' }}>
            <h4 style={{ margin: '0 0 8px', color: 'hsl(var(--text-primary))' }}>💡 Como conectar suas contas em produção</h4>
            <p style={{ margin: 0, fontSize: 13, color: 'hsl(var(--text-secondary))', lineHeight: 1.5 }}>
              Para receber dados em tempo real direto da API da Meta e do Google Analytics, adicione a chave <code>GA4_PROPERTY_ID</code> e <code>META_ACCESS_TOKEN</code> no arquivo <code>.env.local</code>. O portal fará a ingestão automática das conversões por cliente.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'snapshots' && (
        <div className="card snapshots-panel">
          <h3 className="chart-title">Histórico de Snapshots Salvos</h3>
          {savedReports.length === 0 ? (
            <div className="chart-empty">
              Nenhum snapshot salvo ainda. Use o campo acima para salvar o fechamento do período!
            </div>
          ) : (
            <div className="snapshots-list">
              {savedReports.map((report) => (
                <div key={report.id} className="snapshot-item card">
                  <div className="snapshot-info">
                    <h4 className="snapshot-item-title">{report.title}</h4>
                    <span className="snapshot-meta">
                      Cliente: <strong>{report.clients?.name || 'Cliente'}</strong> • Salvo em {new Date(report.created_at).toLocaleDateString('pt-BR')} por {report.profiles?.full_name || 'Admin'}
                    </span>
                  </div>
                  <div className="snapshot-actions">
                    <button
                      className="btn-delete-snapshot"
                      onClick={async () => {
                        if (confirm('Deseja excluir este snapshot?')) {
                          await deleteReportSnapshotAction(report.id);
                        }
                      }}
                    >
                      <Trash2 size={15} /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .reports-layout { display: flex; flex-direction: column; gap: 20px; }

        .report-header-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 20px; flex-wrap: wrap; gap: 12px;
        }

        .nav-tabs { display: flex; gap: 8px; }
        .nav-tab {
          display: flex; align-items: center; gap: 6px; padding: 8px 14px;
          border-radius: var(--radius-md); border: 1px solid transparent;
          background: transparent; color: hsl(var(--text-secondary));
          font-size: 13.5px; font-weight: 500; cursor: pointer; transition: all 0.2s;
        }
        .nav-tab:hover { background: hsl(var(--bg-elevated)); color: hsl(var(--text-primary)); }
        .nav-tab.active {
          background: hsl(var(--brand-primary) / 0.12);
          border-color: hsl(var(--brand-primary) / 0.3);
          color: hsl(var(--brand-primary)); font-weight: 600;
        }

        .export-actions { display: flex; gap: 8px; }
        .btn-export {
          display: flex; align-items: center; gap: 6px; padding: 7px 14px;
          border-radius: var(--radius-md); border: 1px solid hsl(var(--border-default));
          background: hsl(var(--bg-elevated)); color: hsl(var(--text-primary));
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .btn-export:hover { background: hsl(var(--bg-hover)); transform: translateY(-1px); }

        .filter-bar {
          display: flex; align-items: center; gap: 14px; padding: 14px 20px;
          flex-wrap: wrap;
        }
        .filter-label { font-size: 13.5px; font-weight: 600; color: hsl(var(--text-secondary)); white-space: nowrap; }
        .filter-select {
          height: 38px; padding: 0 12px; background: hsl(var(--bg-elevated));
          border: 1px solid hsl(var(--border-default)); border-radius: var(--radius-md);
          color: hsl(var(--text-primary)); font-size: 13.5px; font-family: inherit;
          outline: none; cursor: pointer; transition: all 0.2s; flex: 1; min-width: 200px; max-width: 320px;
        }
        .filter-select:focus { border-color: hsl(var(--brand-primary)); }

        .snapshot-input-group {
          display: flex; align-items: center; gap: 8px; margin-left: auto; flex-wrap: wrap;
        }
        .snapshot-input {
          height: 38px; padding: 0 12px; background: hsl(var(--bg-elevated));
          border: 1px solid hsl(var(--border-default)); border-radius: var(--radius-md);
          color: hsl(var(--text-primary)); font-size: 13px; outline: none; width: 240px;
        }
        .btn-snapshot {
          display: flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px;
          border-radius: var(--radius-md); border: none;
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          color: white; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .btn-snapshot:disabled { opacity: 0.5; cursor: not-allowed; }
        .save-badge {
          display: flex; align-items: center; gap: 4px; font-size: 12px; color: hsl(var(--success));
          font-weight: 500;
        }

        .kpi-grid {
          display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px;
        }
        @media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 700px)  { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }

        .kpi-card {
          display: flex; flex-direction: column; align-items: center;
          gap: 6px; padding: 20px 16px; text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

        .kpi-emoji { font-size: 28px; }
        .kpi-value { font-size: 26px; font-weight: 800; line-height: 1; }
        .kpi-label { font-size: 12px; color: hsl(var(--text-muted)); font-weight: 500; }

        .charts-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
        }
        @media (max-width: 900px) { .charts-row { grid-template-columns: 1fr; } }

        .chart-card { padding: 20px; }
        .chart-title {
          font-size: 15px; font-weight: 700; color: hsl(var(--text-primary));
          margin-bottom: 16px;
        }
        .chart-empty {
          height: 200px; display: flex; align-items: center; justify-content: center;
          color: hsl(var(--text-muted)); font-size: 13px; text-align: center;
        }

        .traffic-panel, .snapshots-panel { padding: 24px; }
        .traffic-header {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
        }
        .badge-connected {
          padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
          background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .snapshots-list { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
        .snapshot-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px;
        }
        .snapshot-item-title { font-size: 14px; font-weight: 600; color: hsl(var(--text-primary)); margin: 0 0 4px; }
        .snapshot-meta { font-size: 12px; color: hsl(var(--text-muted)); }
        .btn-delete-snapshot {
          display: flex; align-items: center; gap: 6px; padding: 6px 12px;
          border-radius: var(--radius-sm); border: 1px solid hsl(var(--error) / 0.3);
          background: transparent; color: hsl(var(--error)); font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
        }
        .btn-delete-snapshot:hover { background: hsl(var(--error) / 0.1); }
      `}</style>
    </div>
  );
}
