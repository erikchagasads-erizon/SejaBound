'use client';

import { useTheme } from 'next-themes';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Sun, Moon, Globe, Bell } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  title?: string;
}

export function Navbar({ title }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [langOpen, setLangOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}/`, `/${newLocale}/`);
    router.push(newPath);
    setLangOpen(false);
  };

  return (
    <header className="navbar">
      {title && (
        <h1 className="navbar-title">{title}</h1>
      )}

      <div className="navbar-actions">
        {/* Language switcher */}
        <div className="lang-switcher">
          <button
            className="icon-btn"
            onClick={() => setLangOpen(!langOpen)}
            aria-label="Switch language"
          >
            <Globe size={18} />
            <span className="lang-label">{locale.toUpperCase()}</span>
          </button>
          {langOpen && (
            <div className="lang-dropdown glass">
              <button
                className={`lang-option ${locale === 'pt' ? 'active' : ''}`}
                onClick={() => switchLocale('pt')}
              >
                🇧🇷 Português
              </button>
              <button
                className={`lang-option ${locale === 'en' ? 'active' : ''}`}
                onClick={() => switchLocale('en')}
              >
                🇺🇸 English
              </button>
            </div>
          )}
        </div>

        {/* Notification bell (placeholder for module 5) */}
        <button className="icon-btn" aria-label="Notifications" id="navbar-notifications">
          <Bell size={18} />
        </button>

        {/* Theme toggle */}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          id="navbar-theme-toggle"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          right: 0;
          left: 240px;
          height: 64px;
          background: hsl(var(--bg-surface) / 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid hsl(var(--border-subtle));
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 40;
          transition: left 0.25s ease;
        }

        .navbar-title {
          font-size: 18px;
          font-weight: 700;
          color: hsl(var(--text-primary));
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: auto;
        }

        .icon-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 10px;
          border-radius: var(--radius-md);
          background: transparent;
          border: none;
          color: hsl(var(--text-secondary));
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
          font-weight: 500;
        }

        .icon-btn:hover {
          background: hsl(var(--bg-elevated));
          color: hsl(var(--text-primary));
        }

        .lang-label {
          font-size: 12px;
          font-weight: 600;
        }

        .lang-switcher {
          position: relative;
        }

        .lang-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 160px;
          border-radius: var(--radius-md);
          padding: 4px;
          z-index: 100;
          box-shadow: var(--shadow-lg);
        }

        .lang-option {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 9px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: hsl(var(--text-secondary));
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .lang-option:hover,
        .lang-option.active {
          background: hsl(var(--brand-primary) / 0.12);
          color: hsl(var(--brand-primary));
        }
      `}</style>
    </header>
  );
}
