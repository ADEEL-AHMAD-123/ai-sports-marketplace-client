import EdgeMark from '@/components/ui/EdgeMark';
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/slices/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import styles from './AdminLayout.module.scss';

const NAV = [
  { to: '/admin',           label: 'Dashboard', icon: '⊞',  end: true },
  { to: '/admin/users',     label: 'Users',     icon: '👥' },
  { to: '/admin/outcomes',  label: 'Outcomes',  icon: '📊' },
  { to: '/admin/jobs',      label: 'Jobs',      icon: '⚙️' },
];

const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="4" y1="6"  x2="20" y2="6"/>
    <line x1="4" y1="12" x2="20" y2="12"/>
    <line x1="4" y1="18" x2="20" y2="18"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <line x1="6" y1="6"  x2="18" y2="18"/>
    <line x1="18" y1="6" x2="6"  y2="18"/>
  </svg>
);

export default function AdminLayout() {
  const user = useSelector(selectUser);
  const { logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auto-close on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // ESC closes the drawer
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  // Body scroll-lock while the drawer is open (mobile)
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  // Active nav for the mobile top-bar label
  const activeNav = NAV.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)) || NAV[0];

  return (
    <div className={styles.shell}>

      {/* ── Mobile top bar — full-width row above the body ─────────── */}
      <header className={styles.mobileBar}>
        <button
          className={styles.hamburger}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open admin menu"
          aria-expanded={drawerOpen}
        >
          <HamburgerIcon />
        </button>
        <div className={styles.mobileTitleWrap}>
          <span className={styles.mobileIcon} aria-hidden="true">{activeNav.icon}</span>
          <span className={styles.mobileTitle}>{activeNav.label}</span>
        </div>
        <button
          className={styles.mobileThemeBtn}
          onClick={toggle}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          title="Toggle theme"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </header>

      {/* ── Drawer backdrop (mobile only) ──────────────────────────── */}
      {drawerOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Main layout row: sidebar + content ─────────────────────── */}
      <div className={styles.body}>

        <aside
          className={`${styles.sidebar} ${drawerOpen ? styles.sidebarOpen : ''}`}
          aria-label="Admin navigation"
        >
          <div className={styles.sideTop}>
            <div className={styles.sideTopRow}>
              <button className={styles.logoBtn} onClick={() => navigate('/')}>
                <EdgeMark size={16} color="var(--color-accent)" />
                <span className={styles.logoText}>Edge<span className={styles.accent}>AI</span></span>
              </button>
              <button
                className={styles.drawerCloseBtn}
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>
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
                <span className={styles.navIcon} aria-hidden="true">{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className={styles.sideBottom}>
            <div className={styles.userRow}>
              <span className={styles.userAvatar} aria-hidden="true">{user?.name?.[0]?.toUpperCase()}</span>
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
    </div>
  );
}
