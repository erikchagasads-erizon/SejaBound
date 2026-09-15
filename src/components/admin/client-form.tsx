'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Mail, Palette, Link, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { createClientAction, updateClientAction } from '@/app/actions/clients';
import type { ClientRow } from '@/lib/supabase/types';

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório (mín. 2 caracteres)'),
  company: z.string().optional(),
  contact_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  primary_color: z.string().optional(),
  logo_url: z.string().url('URL inválida').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface ClientFormProps {
  initialData?: ClientRow;
}

export function ClientForm({ initialData }: ClientFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? '',
      company: initialData?.company ?? '',
      contact_email: initialData?.contact_email ?? '',
      primary_color: initialData?.primary_color ?? '#3D2817',
      logo_url: initialData?.logo_url ?? '',
    },
  });

  const primaryColor = useWatch({ control, name: 'primary_color' });

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    startTransition(async () => {
      const result = initialData
        ? await updateClientAction(initialData.id, values)
        : await createClientAction(values);

      if (result?.error) {
        setServerError(result.error);
      } else {
        router.push('/pt/admin/clients');
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="client-form" noValidate>
      {serverError && (
        <div className="form-error-banner" role="alert">
          {serverError}
        </div>
      )}

      <div className="form-grid">
        <Input
          id="client-name"
          label="Nome do Cliente"
          required
          placeholder="Ex: Acme Corp"
          leftIcon={<Building2 size={16} />}
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          id="client-company"
          label="Empresa / Fantasia"
          placeholder="Ex: Acme Corporation Ltda"
          leftIcon={<Building2 size={16} />}
          error={errors.company?.message}
          {...register('company')}
        />

        <Input
          id="client-email"
          label="E-mail de Contato"
          type="email"
          placeholder="contato@empresa.com"
          leftIcon={<Mail size={16} />}
          error={errors.contact_email?.message}
          {...register('contact_email')}
        />

        <Input
          id="client-logo"
          label="URL do Logo"
          placeholder="https://..."
          leftIcon={<Link size={16} />}
          error={errors.logo_url?.message}
          {...register('logo_url')}
        />

        {/* Color picker */}
        <div className="color-field">
          <label className="color-label" htmlFor="client-color">
            <Palette size={14} />
            Cor Principal
          </label>
          <div className="color-row">
            <input
              id="client-color"
              type="color"
              className="color-swatch"
              {...register('primary_color')}
            />
            <span className="color-value">{primaryColor}</span>
            <div className="color-preview" style={{ background: primaryColor }} />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isPending}
          id="client-form-submit"
        >
          {isPending ? <Loader2 size={16} className="spin" /> : null}
          {initialData ? 'Salvar alterações' : 'Criar cliente'}
        </button>
      </div>

      <style jsx>{`
        .client-form { display: flex; flex-direction: column; gap: 28px; }

        .form-error-banner {
          padding: 12px 16px;
          background: hsl(var(--error) / 0.1);
          border: 1px solid hsl(var(--error) / 0.3);
          border-radius: var(--radius-md);
          color: hsl(var(--error));
          font-size: 14px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 640px) {
          .form-grid { grid-template-columns: 1fr; }
        }

        .color-field { display: flex; flex-direction: column; gap: 8px; }
        .color-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: hsl(var(--text-secondary));
        }

        .color-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .color-swatch {
          width: 40px;
          height: 40px;
          border: 1px solid hsl(var(--border-default));
          border-radius: var(--radius-md);
          padding: 2px;
          background: hsl(var(--bg-elevated));
          cursor: pointer;
        }

        .color-value {
          font-size: 13px;
          font-family: monospace;
          color: hsl(var(--text-muted));
        }

        .color-preview {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid hsl(var(--border-default));
        }

        .form-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 4px;
        }

        .btn-ghost {
          padding: 9px 18px;
          border-radius: var(--radius-md);
          background: transparent;
          border: 1px solid hsl(var(--border-default));
          color: hsl(var(--text-secondary));
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ghost:hover:not(:disabled) { background: hsl(var(--bg-elevated)); }
        .btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 20px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          border: none;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        :global(.spin) { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </form>
  );
}
