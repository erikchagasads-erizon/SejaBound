import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ClientForm } from '@/components/admin/client-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ClientRow } from '@/lib/supabase/types';

export const metadata = { title: 'Editar Cliente | Bound Admin' };

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('clients').select('*').eq('id', id).single();

  if (!data) notFound();

  const client = data as ClientRow;

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={`/${locale}/admin/clients`} className="back-btn" aria-label="Voltar">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title" style={{ fontSize: 26 }}>Editar <span className="gradient-text">{client.name}</span></h1>
            <p className="page-subtitle">Atualize os dados do cliente</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 28, maxWidth: 760 }}>
        <ClientForm initialData={client} />
      </div>


    </div>
  );
}
