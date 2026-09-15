import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        color: 'hsl(var(--text-muted))',
      }}
    >
      <Loader2
        size={36}
        style={{
          animation: 'spin 0.8s linear infinite',
          color: 'hsl(var(--brand-primary))',
        }}
      />
      <p style={{ fontSize: 14, fontWeight: 500 }}>Carregando…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
