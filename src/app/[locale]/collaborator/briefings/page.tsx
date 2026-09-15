import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ClipboardList, Calendar, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { BriefingRow, ClientRow } from '@/lib/supabase/types';
import type { BriefingStatus } from '@/lib/supabase/database.types';

export const metadata = { title: 'Briefings | Bound' };

type BriefingWithClient = BriefingRow & {
  clients: Pick<ClientRow, 'name' | 'primary_color'> | null;
};

export default async function CollaboratorBriefingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data } = await supabase
    .from('briefings')
    .select('*, clients(name, primary_color)')
    .order('created_at', { ascending: false });

  const briefings = (data ?? []) as BriefingWithClient[];

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 28 }}>
            <ClipboardList size={26} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
            <span className="gradient-text">Briefings</span>
          </h1>
          <p className="page-subtitle">{briefings.length} briefing{briefings.length !== 1 ? 's' : ''} registrado{briefings.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {briefings.length === 0 ? (
        <div className="card empty-state-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Nenhum briefing registrado ainda.</p>
        </div>
      ) : (
        <div className="briefing-grid">
          {briefings.map((briefing) => (
            <div key={briefing.id} className="briefing-card card" id={`briefing-${briefing.id}`}>
              {/* Client color stripe */}
              <div
                className="briefing-stripe"
                style={{ background: briefing.clients?.primary_color ?? 'hsl(var(--brand-primary))' }}
              />
              <div className="briefing-body">
                <div className="briefing-header">
                  <div className="briefing-header-left">
                    {briefing.clients && (
                      <span
                        className="briefing-client"
                        style={{ color: briefing.clients.primary_color ?? undefined }}
                      >
                        {briefing.clients.name}
                      </span>
                    )}
                    {briefing.category && (
                      <span className="briefing-category">{briefing.category}</span>
                    )}
                  </div>
                  <Badge value={briefing.status as BriefingStatus} variant="briefing" />
                </div>

                <h2 className="briefing-title">{briefing.title}</h2>
                <p className="briefing-desc">{briefing.description}</p>

                {/* Attachments */}
                {Array.isArray(briefing.attachments) && briefing.attachments.length > 0 && (
                  <div className="attachments">
                    <span className="attach-label">Anexos:</span>
                    <div className="attach-list">
                      {(briefing.attachments as Array<{ url: string; name?: string }>).map((att, i) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="attach-link"
                        >
                          <ExternalLink size={12} />
                          {att.name ?? `Arquivo ${i + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="briefing-footer">
                  <span className="briefing-date">
                    <Calendar size={12} />
                    {new Date(briefing.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
