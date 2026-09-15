'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DeliveryForm, type DeliveryWithFiles } from '@/components/collaborator/delivery-form';
import { DeliveryCard } from '@/components/collaborator/delivery-card';

interface DeliveryPanelProps {
  taskId: string;
  initialDeliveries: DeliveryWithFiles[];
}

export function DeliveryPanel({ taskId, initialDeliveries }: DeliveryPanelProps) {
  const [deliveries, setDeliveries] = useState<DeliveryWithFiles[]>(initialDeliveries);
  const [showForm, setShowForm] = useState(false);

  const handleCreated = (delivery: DeliveryWithFiles) => {
    setDeliveries(prev => [delivery, ...prev]);
    setShowForm(false);
  };

  const handleDeleted = (id: string) => {
    setDeliveries(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="dp-root">
      {/* Header */}
      <div className="dp-header">
        <h3 className="dp-title">Entregas</h3>
        {!showForm && (
          <button
            className="dp-add-btn"
            onClick={() => setShowForm(true)}
            id="btn-add-delivery"
          >
            <Plus size={14} />
            Nova entrega
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <DeliveryForm
          taskId={taskId}
          onSuccess={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* List */}
      {deliveries.length === 0 && !showForm ? (
        <div className="dp-empty">
          <span className="dp-empty-icon">📦</span>
          <p className="dp-empty-text">Nenhuma entrega criada ainda.</p>
          <button className="dp-empty-cta" onClick={() => setShowForm(true)}>
            <Plus size={14} />
            Criar primeira entrega
          </button>
        </div>
      ) : (
        <div className="dp-list">
          {deliveries.map((delivery, i) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              taskId={taskId}
              defaultExpanded={i === 0}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .dp-root { display: flex; flex-direction: column; gap: 16px; }

        .dp-header {
          display: flex; align-items: center;
          justify-content: space-between;
        }

        .dp-title {
          font-size: 16px; font-weight: 700;
          color: hsl(var(--text-primary));
        }

        .dp-add-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 16px; border-radius: var(--radius-md);
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          border: none; color: white;
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.18s;
        }
        .dp-add-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        .dp-empty {
          display: flex; flex-direction: column;
          align-items: center; gap: 12px;
          padding: 44px 24px; text-align: center;
          border: 2px dashed hsl(var(--border-default));
          border-radius: var(--radius-lg);
          color: hsl(var(--text-muted));
          transition: border-color 0.2s;
        }
        .dp-empty:hover { border-color: hsl(var(--brand-primary) / 0.4); }

        .dp-empty-icon { font-size: 36px; }
        .dp-empty-text { font-size: 14px; }

        .dp-empty-cta {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 20px; border-radius: var(--radius-md);
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          border: none; color: white;
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.18s;
          margin-top: 4px;
        }
        .dp-empty-cta:hover { opacity: 0.9; transform: translateY(-1px); }

        .dp-list { display: flex; flex-direction: column; gap: 10px; }
      `}</style>
    </div>
  );
}
