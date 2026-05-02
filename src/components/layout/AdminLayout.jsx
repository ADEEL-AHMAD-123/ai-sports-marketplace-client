import EdgeMark from '@/components/ui/EdgeMark';
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/slices/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import styles from './AdminLayout.module.scss';

const NAV = [
  { to: '/admin',           label: 'Dashboard', icon: '⊞',  end: true },
  { to: '/admin/users',     label: 'Users',     icon: '👥' },
  { to: '/admin/outcomes',  label: 'Outcomes',  icon: '📊' },
  { to: '/admin/players',   label: 'Players',   icon: '🆔' },
  { to: '/admin/jobs',      label: 'Jobs',      icon: '⚙️' },
  { to: '/admin/ai-logs',   label: 'AI Logs',   icon: '📋' },
];

export default function AdminLayout() {
  const user = useSelector(selectUser);
  const { logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sideTop}>
          <button className={styles.logoBtn} onClick={() => navigate('/')}>
            <EdgeMark size={16} color="var(--color-accent)" />
            <span className={styles.logoText}>Edge<span className={styles.accent}>AI</span></span>
          </button>
          <div className={styles.adminBadge}>Admin Panel</div>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sideBottom}>
          <div className={styles.userRow}>
            <span className={styles.userAvatar}>{user?.name?.[0]?.toUpperCase()}</span>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.name}</p>
              <p className={styles.userRole}>Administrator</p>
            </div>
          </div>
          <div className={styles.sideActions}>
            <button className={styles.actionBtn} onClick={toggle} title="Toggle theme">
              {isDark ? '☀️' : '🌙'}
            </button>
            <button className={styles.actionBtn} onClick={() => navigate('/')}>← Site</button>
            <button className={styles.actionBtn} onClick={logout}>↪ Out</button>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}