import { createClient } from '@/lib/supabase/server';
import { Download, FileText, Image as ImageIcon, Film, Archive } from 'lucide-react';
import { formatDate, formatFileSize } from '@/lib/utils';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Downloads' };

function getFileIcon(mime: string | null) {
  if (!mime) return <FileText size={18} />;
  if (mime.startsWith('image/')) return <ImageIcon size={18} />;
  if (mime.startsWith('video/')) return <Film size={18} />;
  if (mime.includes('zip') || mime.includes('rar')) return <Archive size={18} />;
  return <FileText size={18} />;
}

interface DownloadFileItem {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  deliveries: {
    id: string;
    title: string;
    status: string;
    tasks: {
      id: string;
      title: string;
      type: string;
      client_id: string;
    };
  };
}

export default async function DownloadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clientUserData } = await (supabase as any)
    .from('client_users')
    .select('client_id')
    .eq('profile_id', user.id)
    .maybeSingle();
  
  const clientUser = clientUserData as { client_id: string } | null;

  let files: DownloadFileItem[] = [];
  if (clientUser?.client_id) {
    const { data: rawFiles } = await supabase
      .from('delivery_files')
      .select(`*, deliveries!inner(id, title, status, tasks!inner(id, title, type, client_id))`)
      .eq('deliveries.tasks.client_id', clientUser.client_id)
      .eq('deliveries.status', 'approved')
      .order('created_at', { ascending: false });

    files = (rawFiles ?? []) as unknown as DownloadFileItem[];
  }

  // Group by task
  const byTask: Record<string, { taskTitle: string; taskType: string; files: DownloadFileItem[] }> = {};
  files.forEach((f) => {
    const taskId = f.deliveries.tasks.id;
    if (!byTask[taskId]) {
      byTask[taskId] = { taskTitle: f.deliveries.tasks.title, taskType: f.deliveries.tasks.type, files: [] };
    }
    byTask[taskId].files.push(f);
  });

  const taskGroups = Object.entries(byTask);

  return (
    <div className="downloads-page animate-fade-in">
      <div className="page-header">
        <div className="page-header-icon" style={{ background: 'hsl(var(--brand-secondary) / 0.14)', color: 'hsl(var(--brand-secondary))' }}>
          <Download size={22} />
        </div>
        <div>
          <h1 className="page-title">Central de Downloads</h1>
          <p className="page-subtitle">Arquivos aprovados, organizados por projeto</p>
        </div>
        <div className="total-badge">
          {files?.length ?? 0} arquivo{(files?.length ?? 0) !== 1 ? 's' : ''}
        </div>
      </div>

      {taskGroups.length === 0 ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 56, textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>📁</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>Nenhum arquivo disponível para download.</p>
          <span style={{ fontSize: 13, color: 'hsl(var(--text-muted))' }}>Os arquivos aparecem aqui após serem aprovados por você.</span>
        </div>
      ) : (
        <div className="task-groups">
          {taskGroups.map(([taskId, group]) => (
            <div key={taskId} className="task-group card">
              <div className="group-header">
                <h2 className="group-title">{group.taskTitle}</h2>
                <span className="group-count">{group.files.length} arquivo{group.files.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="files-table">
                {group.files.map((file) => (
                  <div key={file.id} className="file-row" id={`file-row-${file.id}`}>
                    <div className="file-type-icon">{getFileIcon(file.mime_type)}</div>
                    <div className="file-details">
                      <span className="file-name">{file.file_name}</span>
                      <div className="file-sub">
                        {file.file_size && <span>{formatFileSize(file.file_size)}</span>}
                        <span>·</span>
                        <span>{formatDate(file.created_at)}</span>
                        <span>·</span>
                        <span className="delivery-tag">{file.deliveries.title}</span>
                      </div>
                    </div>
                    <a href={file.file_url} download={file.file_name} target="_blank" rel="noopener noreferrer"
                       id={`download-btn-${file.id}`} className="download-btn">
                      <Download size={15} />
                      Baixar
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
