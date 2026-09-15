'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, User, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { inviteCollaboratorAction } from '@/app/actions/collaborators';
import type { ClientRow } from '@/lib/supabase/types';

const schema = z.object({
  full_name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
});

type FormValues = z.infer<typeof schema>;

interface InviteFormProps {
  clients: Pick<ClientRow, 'id' | 'name' | 'primary_color'>[];
  locale: string;
}

export function InviteCollaboratorForm({ clients, locale }: InviteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', email: '' },
  });

  const toggleClient = (id: string) => {
    setSelectedClients((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    startTransition(async () => {
      const result = await inviteCollaboratorAction(values.email, values.full_name, selectedClients);
      if (result?.error) {
        setServerError(result.error);
      } else {
        setSuccess(true);
      }
    });
  };

  if (success) {
    return (
      <div className="success-state">
        <div className="success-icon">✉️</div>
        <h2 className="success-title">Convite enviado!</h2>
        <p className="success-text">
          O colaborador receberá um e-mail com link de acesso. Após aceitar o convite, aparecerá na lista.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button className="btn-ghost" onClick={() => router.push(`/${locale}/admin/collaborators`)}>
            Ver colaboradores
          </button>
          <button className="btn-primary" onClick={() => { setSuccess(false); }}>
            Convidar outro
          </button>
        </div>

        <style jsx>{`
          .success-state {
            display: flex; flex-direction: column; align-items: center;
            gap: 16px; padding: 32px 24px; text-align: center;
          }
          .success-icon { font-size: 48px; }
          .success-title { font-size: 22px; font-weight: 700; color: hsl(var(--text-primary)); }
          .success-text { font-size: 14px; color: hsl(var(--text-secondary)); max-width: 380px; line-height: 1.6; }
          .btn-ghost {
            padding: 9px 18px; border-radius: var(--radius-md);
            background: transparent; border: 1px solid hsl(var(--border-default));
            color: hsl(var(--text-secondary)); font-size: 14px; font-weight: 500;
            cursor: pointer; transition: all 0.2s;
          }
          .btn-primary {
            padding: 9px 18px; border-radius: var(--radius-md);
            background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
            border: none; color: white; font-size: 14px; font-weight: 600;
            cursor: pointer; transition: all 0.2s;
          }
        `}</style>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="invite-form" noValidate>
      {serverError && (
        <div className="form-error-banner" role="alert">{serverError}</div>
      )}

      <Input
        id="invite-name"
        label="Nome Completo"
        required
        placeholder="João Silva"
        leftIcon={<User size={16} />}
        error={errors.full_name?.message}
        {...register('full_name')}
      />

      <Input
        id="invite-email"
        label="E-mail"
        type="email"
        required
        placeholder="colaborador@empresa.com"
        leftIcon={<Mail size={16} />}
        error={errors.email?.message}
        {...register('email')}
      />

      {/* Client selection */}
      <div className="client-select-section">
        <label className="section-label">
          Vincular a clientes <span className="optional">(opcional)</span>
        </label>
        <div className="client-chips">
          {clients.length === 0 && (
            <span className="no-clients">Nenhum cliente cadastrado.</span>
          )}
          {clients.map((client) => {
            const isSelected = selectedClients.includes(client.id);
            return (
              <button
                key={client.id}
                type="button"
                className={`client-chip ${isSelected ? 'selected' : ''}`}
                style={{
                  '--chip-color': client.primary_color ?? 'hsl(var(--brand-primary))',
                } as React.CSSProperties}
                onClick={() => toggleClient(client.id)}
                id={`chip-${client.id}`}
              >
                <div className="chip-dot" style={{ background: client.primary_color ?? 'hsl(var(--brand-primary))' }} />
                {client.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={() => router.back()} disabled={isPending}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={isPending} id="invite-submit">
          {isPending ? <Loader2 size={16} className="spin" /> : <Mail size={16} />}
          Enviar convite
        </button>
      </div>

      <style jsx>{`
        .invite-form { display: flex; flex-direction: column; gap: 20px; }

        .form-error-banner {
          padding: 12px 16px; background: hsl(var(--error) / 0.1);
          border: 1px solid hsl(var(--error) / 0.3); border-radius: var(--radius-md);
          color: hsl(var(--error)); font-size: 14px;
        }

        .client-select-section { display: flex; flex-direction: column; gap: 10px; }
        .section-label { font-size: 13px; font-weight: 600; color: hsl(var(--text-secondary)); }
        .optional { font-weight: 400; color: hsl(var(--text-muted)); font-size: 12px; }
        .no-clients { font-size: 13px; color: hsl(var(--text-muted)); }

        .client-chips { display: flex; flex-wrap: wrap; gap: 8px; }

        .client-chip {
          display: flex; align-items: center; gap: 7px;
          padding: 6px 12px; border-radius: 20px;
          border: 1px solid hsl(var(--border-default));
          background: hsl(var(--bg-elevated));
          color: hsl(var(--text-secondary));
          font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;
        }
        .client-chip:hover {
          border-color: var(--chip-color);
          color: var(--chip-color);
        }
        .client-chip.selected {
          border-color: var(--chip-color);
          background: color-mix(in srgb, var(--chip-color) 15%, transparent);
          color: var(--chip-color);
        }

        .chip-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        .form-actions {
          display: flex; align-items: center; justify-content: flex-end;
          gap: 10px; padding-top: 4px;
        }

        .btn-ghost {
          padding: 9px 18px; border-radius: var(--radius-md);
          background: transparent; border: 1px solid hsl(var(--border-default));
          color: hsl(var(--text-secondary)); font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-primary {
          display: flex; align-items: center; gap: 8px; padding: 9px 20px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          border: none; color: white; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        :global(.spin) { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </form>
  );
}
