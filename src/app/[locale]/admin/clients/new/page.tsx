import { ClientForm } from '@/components/admin/client-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Novo Cliente | Bound Admin' };

export default async function NewClientPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={`/${locale}/admin/clients`} className="back-btn" aria-label="Voltar">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title" style={{ fontSize: 26 }}>Novo <span className="gradient-text">Cliente</span></h1>
            <p className="page-subtitle">Preencha os dados do cliente</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 28, maxWidth: 760 }}>
        <ClientForm />
      </div>


    </div>
  );
}
