'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Loader2 } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/input';
import { createDeliveryAction } from '@/app/actions/deliveries';
import type { DeliveryRow, DeliveryFileRow } from '@/lib/supabase/types';

const schema = z.object({
  title: z.string().min(2, 'Título obrigatório (mínimo 2 caracteres)'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export type DeliveryWithFiles = DeliveryRow & {
  delivery_files: DeliveryFileRow[];
};

interface DeliveryFormProps {
  taskId: string;
  onSuccess: (delivery: DeliveryWithFiles) => void;
  onCancel: () => void;
}

export function DeliveryForm({ taskId, onSuccess, onCancel }: DeliveryFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await createDeliveryAction({
        task_id: taskId,
        title: values.title,
        description: values.description,
      });

      if ('error' in result && result.error) {
        setError('root', { message: result.error });
        return;
      }

      const newDelivery: DeliveryWithFiles = {
        id: result.id ?? crypto.randomUUID(),
        task_id: taskId,
        title: values.title,
        description: values.description ?? null,
        status: 'pending',
        client_feedback: null,
        reviewed_by: null,
        reviewed_at: null,
        created_by: '',
        created_at: new Date().toISOString(),
        delivery_files: [],
      };

      reset();
      onSuccess(newDelivery);
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="dform-root"
      noValidate
      id="delivery-create-form"
    >
      {errors.root?.message && (
        <div className="dform-error" role="alert">
          {errors.root.message}
        </div>
      )}

      <Input
        id="delivery-title-input"
        label="Título da entrega"
        required
        placeholder="Ex: Posts semana 32 — Versão final"
        error={errors.title?.message}
        {...register('title')}
      />

      <Textarea
        id="delivery-description-input"
        label="Descrição"
        placeholder="Descreva o que está sendo entregue, versão, observações..."
        rows={3}
        {...register('description')}
      />

      <div className="dform-actions">
        <button
          type="button"
          className="dform-cancel"
          onClick={() => { reset(); onCancel(); }}
          disabled={isPending}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="dform-submit"
          disabled={isPending}
          id="delivery-submit-btn"
        >
          {isPending
            ? <><Loader2 size={14} className="dform-spin" /> Criando...</>
            : <><Plus size={14} /> Criar entrega</>
          }
        </button>
      </div>

      <style jsx>{`
        .dform-root {
          display: flex; flex-direction: column; gap: 14px;
          padding: 20px; background: hsl(var(--bg-elevated));
          border: 1px solid hsl(var(--brand-primary) / 0.25);
          border-radius: var(--radius-lg);
          animation: slideDown 0.18s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .dform-error {
          padding: 9px 14px;
          background: hsl(var(--error) / 0.1);
          border: 1px solid hsl(var(--error) / 0.3);
          border-radius: var(--radius-sm);
          color: hsl(var(--error)); font-size: 13px;
        }

        .dform-actions {
          display: flex; gap: 8px; justify-content: flex-end;
          margin-top: 4px;
        }

        .dform-cancel {
          padding: 8px 16px; border-radius: var(--radius-md);
          background: transparent;
          border: 1px solid hsl(var(--border-default));
          color: hsl(var(--text-secondary));
          font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.18s;
        }
        .dform-cancel:hover { background: hsl(var(--bg-hover)); color: hsl(var(--text-primary)); }
        .dform-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

        .dform-submit {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 18px; border-radius: var(--radius-md);
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          border: none; color: white;
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.18s;
        }
        .dform-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .dform-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        :global(.dform-spin) { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </form>
  );
}
