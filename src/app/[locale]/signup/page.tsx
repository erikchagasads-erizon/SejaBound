'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, ArrowRight, Loader2, User } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const locale = useLocale();
  const t = useTranslations('auth');
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          // Self-signup só cria CLIENTES. Roles 'admin' e 'collaborator'
          // são atribuídas via convite (ver actions/collaborators.ts) ou
          // manualmente no Supabase (UPDATE profiles SET role = 'admin').
          role: 'client',
          avatar_url: '',
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (authError) {
      setError(`${t('signupError')}: ${authError.message}`);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      setSuccess(true);
    }

    setIsLoading(false);
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
        <div className="login-grid" />
      </div>

      {/* Login Card */}
      <div className="login-container">
        <div className="login-card glass-strong animate-fade-in">
          {/* Logo — wordmark "bnd" estilo @sejabound */}
          <div className="login-logo">
            <div className="logo-wordmark">bnd</div>
          </div>

          {/* Header */}
          <div className="login-header">
            <h1 className="login-title">
              {t('createAccount')}
            </h1>
            <p className="login-subtitle">
              {t('signupSubtitle')}
            </p>
          </div>

          {success ? (
            <div className="magic-success">
              <div className="magic-success-icon">✨</div>
              <p className="magic-success-title">
                {t('accountCreated')}
              </p>
              <p className="magic-success-desc">
                {t('accountCreatedDesc')}
              </p>
              <Link href={`/${locale}/login`} className="btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
                {t('goToLogin')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="login-form">
              {/* Name field */}
              <div className="form-group">
                <label className="form-label">
                  {t('fullName')}
                </label>
                <div className="input-wrapper">
                  <User size={16} className="input-icon" />
                  <input
                    id="signup-name"
                    type="text"
                    className="form-input"
                    placeholder={t('yourName')}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email field */}
              <div className="form-group">
                <label className="form-label">
                  {t('email')}
                </label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input
                    id="signup-email"
                    type="email"
                    className="form-input"
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="form-group">
                <label className="form-label">
                  {t('password')}
                </label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="signup-password"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={6}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="form-error animate-fade-in">
                  <span>⚠️ {error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                id="signup-submit"
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <>
                    <span>
                      {t('create')}
                    </span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="login-link-container">
                <p className="login-subtitle" style={{ fontSize: '13px', textAlign: 'center', marginTop: '12px' }}>
                  {t('noAccount')}{' '}
                  <Link href={`/${locale}/login`} className="auth-link">
                    {t('login')}
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* Language toggle */}
          <div className="login-lang">
            <a href={`/pt/signup`} className={locale === 'pt' ? 'lang-active' : 'lang-inactive'}>PT</a>
            <span className="lang-divider">|</span>
            <a href={`/en/signup`} className={locale === 'en' ? 'lang-active' : 'lang-inactive'}>EN</a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: hsl(var(--bg-base));
        }

        /* Background orbs */
        .login-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.22;
        }

        .login-orb-1 {
          width: 600px;
          height: 600px;
          background: hsl(var(--brand-primary));
          top: -200px;
          right: -100px;
          animation: float1 8s ease-in-out infinite;
        }

        .login-orb-2 {
          width: 400px;
          height: 400px;
          background: hsl(var(--brand-accent));
          bottom: -100px;
          left: -100px;
          animation: float2 10s ease-in-out infinite;
        }

        .login-orb-3 {
          width: 300px;
          height: 300px;
          background: hsl(var(--brand-secondary));
          top: 50%;
          left: 30%;
          animation: float3 7s ease-in-out infinite;
          opacity: 0.2;
        }

        .login-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(hsl(var(--border-subtle) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border-subtle) / 0.3) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-30px, 30px) scale(1.05); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(20px, -20px) scale(1.03); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(-15px, 15px); }
        }

        /* Card */
        .login-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 24px;
        }

        .login-card {
          padding: 40px;
          border-radius: var(--radius-xl);
        }

        /* Logo */
        .login-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
        }

        /* Logo — wordmark "bnd" estilo @sejabound */
        .logo-wordmark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--brand-primary));
          font-family: var(--font-display);
          font-style: italic;
          font-size: 26px;
          font-weight: 700;
          font-size: 42px;
          letter-spacing: -0.04em;
          line-height: 1;
        }

        /* Header */
        .login-header {
          margin-bottom: 28px;
        }

        .login-title {
          font-family: var(--font-display);
          font-size: 30px;
          font-weight: 700;
          font-style: italic;
          color: hsl(var(--text-primary));
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          font-size: 14px;
          color: hsl(var(--text-secondary));
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 13px;
          font-weight: 500;
          color: hsl(var(--text-secondary));
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: hsl(var(--text-muted));
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          background: hsl(var(--bg-elevated));
          border: 1px solid hsl(var(--border-default));
          border-radius: var(--radius-md);
          color: hsl(var(--text-primary));
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: hsl(var(--brand-primary));
          box-shadow: 0 0 0 3px hsl(var(--brand-primary) / 0.15);
        }

        .form-input::placeholder {
          color: hsl(var(--text-muted));
        }

        .form-error {
          padding: 10px 14px;
          background: hsl(var(--error) / 0.1);
          border: 1px solid hsl(var(--error) / 0.3);
          border-radius: var(--radius-md);
          font-size: 13px;
          color: hsl(var(--error));
        }

        /* Buttons */
        .btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 20px;
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: var(--shadow-glow-primary);
          margin-top: 4px;
        }

        .btn-primary:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px hsl(var(--brand-primary) / 0.45);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .auth-link {
          color: hsl(var(--brand-primary));
          text-decoration: none;
          font-weight: 600;
          transition: opacity 0.2s;
        }
        
        .auth-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        /* Success */
        .magic-success {
          text-align: center;
          padding: 20px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .magic-success-icon {
          font-size: 40px;
          margin-bottom: 4px;
        }

        .magic-success-title {
          font-size: 18px;
          font-weight: 700;
          color: hsl(var(--text-primary));
        }

        .magic-success-desc {
          font-size: 13px;
          color: hsl(var(--text-secondary));
          max-width: 280px;
          line-height: 1.5;
          margin-bottom: 8px;
        }

        /* Language toggle */
        .login-lang {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
        }

        .lang-active {
          font-size: 12px;
          font-weight: 700;
          color: hsl(var(--brand-primary));
        }

        .lang-inactive {
          font-size: 12px;
          color: hsl(var(--text-muted));
          transition: color 0.2s;
        }

        .lang-inactive:hover {
          color: hsl(var(--text-secondary));
        }

        .lang-divider {
          color: hsl(var(--border-default));
          font-size: 12px;
        }

        /* Spinner */
        .spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
