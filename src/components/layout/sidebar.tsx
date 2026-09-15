'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/contexts/auth-context';
import {
  LayoutDashboard, Users, UserCircle, KanbanSquare,
  FileText, BarChart3, CheckSquare, Download,
  ClipboardList, Settings, LogOut,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

// Ordem lógica: começa com o que se abre todo dia (Dashboard → trabalho do dia),
// depois recursos específicos do role, e por último configurações.
const NAV_ITEMS_PT: NavItem[] = [
  // Essencial (todos os roles)
  { label: 'Dashboard',     href: 'dashboard',     icon: LayoutDashboard, roles: ['admin', 'collaborator', 'client'] },
  // Trabalho do dia
  { label: 'Kanban',        href: 'kanban',        icon: KanbanSquare,    roles: ['admin', 'collaborator'] },
  { label: 'Tarefas',       href: 'tasks',         icon: FileText,        roles: ['admin', 'collaborator'] },
  { label: 'Briefings',     href: 'briefings',     icon: ClipboardList,   roles: ['admin', 'collaborator', 'client'] },
  // Cliente
  { label: 'Aprovações',    href: 'approvals',     icon: CheckSquare,     roles: ['client'] },
  { label: 'Downloads',     href: 'downloads',     icon: Download,        roles: ['client'] },
  // Admin — gestão da operação
  { label: 'Clientes',      href: 'clients',       icon: Users,           roles: ['admin'] },
  { label: 'Colaboradores', href: 'collaborators', icon: UserCircle,      roles: ['admin'] },
  { label: 'Relatórios',    href: 'reports',       icon: BarChart3,       roles: ['admin'] },
  // Admin — configuração
  { label: 'Configurações', href: 'settings',      icon: Settings,        roles: ['admin'] },
];

const NAV_ITEMS_EN: NavItem[] = [
  // Essential (all roles)
  { label: 'Dashboard',     href: 'dashboard',     icon: LayoutDashboard, roles: ['admin', 'collaborator', 'client'] },
  // Daily work
  { label: 'Kanban',        href: 'kanban',        icon: KanbanSquare,    roles: ['admin', 'collaborator'] },
  { label: 'Tasks',         href: 'tasks',         icon: FileText,        roles: ['admin', 'collaborator'] },
  { label: 'Briefings',     href: 'briefings',     icon: ClipboardList,   roles: ['admin', 'collaborator', 'client'] },
  // Client
  { label: 'Approvals',     href: 'approvals',     icon: CheckSquare,     roles: ['client'] },
  { label: 'Downloads',     href: 'downloads',     icon: Download,        roles: ['client'] },
  // Admin — operations
  { label: 'Clients',       href: 'clients',       icon: Users,           roles: ['admin'] },
  { label: 'Collaborators', href: 'collaborators', icon: UserCircle,      roles: ['admin'] },
  { label: 'Reports',       href: 'reports',       icon: BarChart3,       roles: ['admin'] },
  // Admin — config
  { label: 'Settings',      href: 'settings',      icon: Settings,        roles: ['admin'] },
];

interface SidebarProps {
  role: string;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const { profile, signOut } = useAuth();

  const navItems = locale === 'en' ? NAV_ITEMS_EN : NAV_ITEMS_PT;
  const roleBase = role === 'admin' ? 'admin' : role === 'collaborator' ? 'collaborator' : 'client';

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  const isActive = (href: string) => {
    // Compara o segmento exato após /{locale}/{roleBase}/
    // Evita falsos positivos: 'clients' não pode casar dentro de 'clients-archive'
    const expected = `/${locale}/${roleBase}/${href}`;
    if (pathname === expected) return true;
    // Sub-rotas (ex: /clients/abc) também contam como ativas
    return pathname.startsWith(`${expected}/`);
  };

  const t = (pt: string, en: string) => (locale === 'pt' ? pt : en);

  // Cliente vê "Pedidos"/"Requests" em vez de "Briefings" (jargão de agência).
  // Admin/collaborator mantêm "Briefings" (termo técnico da equipe).
  const labelFor = (item: NavItem): string => {
    if (item.href === 'briefings' && role === 'client') {
      return locale === 'en' ? 'Requests' : 'Pedidos';
    }
    return item.label;
  };

  return (
    <aside className="sidebar">
      {/* Logo — wordmark "bnd" estilo @sejabound */}
      <div className="sidebar-logo">
        <div className="logo-wordmark-sm">bnd</div>
        <span className="logo-text-sm">Bound Marketing</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const href = `/${locale}/${roleBase}/${item.href}`;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={href}
              className={`sidebar-link ${active ? 'active' : ''}`}
            >
              {active && <div className="active-indicator" />}
              <Icon size={14} strokeWidth={1.5} className="sidebar-link-icon" />
              <span className="sidebar-link-label">{labelFor(item)}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">
            {profile?.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={profile.avatar_url} alt="avatar" />
            ) : (
              <span>{profile?.full_name?.[0] ?? '?'}</span>
            )}
          </div>
          <div className="user-info">
            <span className="user-name">{profile?.full_name ?? 'Usuário'}</span>
            <span className="user-role">{role}</span>
          </div>
        </div>
        <div className="sidebar-divider" aria-hidden="true" />
        <button
          className="sidebar-logout"
          onClick={signOut}
        >
          <LogOut size={14} strokeWidth={1.75} className="sidebar-link-icon" />
          <span className="sidebar-link-label">{t('Sair', 'Logout')}</span>
        </button>
      </div>

      <style jsx>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 240px;
          background: hsl(var(--bg-surface));
          border-right: 1px solid hsl(var(--border-subtle));
          display: flex;
          flex-direction: column;
          z-index: 50;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 20px 18px;
          border-bottom: 1px solid hsl(var(--border-subtle));
          min-height: 72px;
        }

        .logo-wordmark-sm {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--brand-primary));
          font-family: var(--font-display);
          font-style: italic;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 1;
        }

        .logo-text-sm {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 16px;
          font-weight: 600;
          color: hsl(var(--text-primary));
          white-space: nowrap;
        }

        .sidebar-nav {
          flex: 1;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          flex-direction: row;
          gap: 10px;
          width: 100%;
          padding: 11px 16px;
          border-radius: var(--radius-md);
          color: hsl(var(--text-secondary));
          font-size: 14px;
          font-weight: 500;
          line-height: 1;
          transition: all 0.18s;
          white-space: nowrap;
          position: relative;
          cursor: pointer;
          text-decoration: none;
        }

        .sidebar-link:hover {
          background: hsl(var(--bg-elevated));
          color: hsl(var(--text-primary));
        }

        .sidebar-link:hover .sidebar-link-icon {
          opacity: 1;
        }

        .sidebar-link.active {
          background: hsl(var(--brand-primary) / 0.12);
          color: hsl(var(--brand-primary));
          font-weight: 600;
        }

        .sidebar-link.active .sidebar-link-icon {
          opacity: 1;
        }

        .sidebar-link-icon {
          flex: 0 0 auto;
          display: inline-block;
          vertical-align: middle;
          opacity: 0.55;
          transition: opacity 0.18s;
        }

        .sidebar-link-label {
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          display: inline-block;
          vertical-align: middle;
          line-height: 1;
        }

        .active-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 22px;
          background: hsl(var(--brand-primary));
          border-radius: 0 2px 2px 0;
        }

        .sidebar-footer {
          padding: 12px 10px;
          border-top: 1px solid hsl(var(--border-subtle));
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .user-avatar {
          width: 34px;
          height: 34px;
          min-width: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: white;
          overflow: hidden;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }

        .user-name {
          font-size: 13.5px;
          font-weight: 600;
          color: hsl(var(--text-primary));
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          display: block;
          min-width: 0;
        }

        .user-role {
          font-size: 11.5px;
          color: hsl(var(--text-muted));
          text-transform: capitalize;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        .sidebar-divider {
          height: 1px;
          background: hsl(var(--border-subtle));
          margin: 4px 8px;
        }

        .sidebar-logout {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 16px;
          border-radius: var(--radius-md);
          background: transparent;
          border: none;
          color: hsl(var(--text-muted));
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
          width: 100%;
          text-align: left;
        }

        .sidebar-logout:hover {
          background: hsl(var(--error) / 0.1);
          color: hsl(var(--error));
        }

        .sidebar-logout:hover .sidebar-link-icon {
          opacity: 1;
        }
      `}</style>
    </aside>
  );
}
