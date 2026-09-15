'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log para serviços de observabilidade
    console.error('[Bound App Error]', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '0 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: 'hsl(var(--error) / 0.1)',
          color: 'hsl(var(--error))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertTriangle size={26} />
      </div>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          Algo deu errado
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'hsl(var(--text-muted))',
            margin: '8px 0 0',
            maxWidth: 420,
          }}
        >
          Encontramos um problema ao carregar esta página. Tente novamente.
        </p>
      </div>
      <button
        onClick={reset}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          borderRadius: 10,
          background: 'hsl(var(--brand-primary))',
          color: 'white',
          border: 'none',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <RefreshCcw size={16} />
        Tentar novamente
      </button>
    </div>
  );
}
