import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '70vh',
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
          width: 64,
          height: 64,
          borderRadius: 16,
          background:
            'linear-gradient(135deg, hsl(var(--brand-primary) / 0.2), hsl(var(--brand-accent) / 0.2))',
          color: 'hsl(var(--brand-primary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FileQuestion size={30} />
      </div>

      <div>
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            margin: 0,
            background:
              'linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: -2,
          }}
        >
          404
        </h1>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 6px' }}>
          Página não encontrada
        </h2>
        <p
          style={{
            fontSize: 14,
            color: 'hsl(var(--text-muted))',
            margin: 0,
            maxWidth: 420,
          }}
        >
          A página que você procura não existe ou foi movida.
        </p>
      </div>

      <Link
        href="/pt/login"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          borderRadius: 10,
          background: 'hsl(var(--brand-primary))',
          color: 'white',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <ArrowLeft size={16} />
        Voltar ao início
      </Link>
    </div>
  );
}
