// src/components/layout/Navbar.jsx
//
// Two navigation modes based on viewport:
//
//  DESKTOP (≥ 641px): the original inline layout — logo left, theme +
//    credits + avatar dropdown (logged in) or auth links (logged out) on
//    the right. Untouched from the previous design.
//
//  MOBILE (≤ 640px): logo + theme + hamburger only. Tapping the
//    hamburger reveals a full-width slide-down panel with the same
//    navigation surfaces (pricing, wallet, history, admin, log in / sign
//    up) at proper 44px tap targets, plus a user block that shows
//    balance for signed-in users.
//
// Everything shares one Redux/Auth backing so both modes stay in sync.

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn, selectUser, selectCredits } from '@/store/slices/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import EdgeMark from '@/components/ui/EdgeMark';
import styles from './Navbar.module.scss';

// ── Icons ────────────────────────────────────────────────────────
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const StarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const HamburgerIcon = ({ open }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {open ? (
      <>
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6"  y1="6" x2="18" y2="18"/>
      </>
    ) : (
      <>
        <line x1="3" y1="7"  x2="21" y2="7"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="17" x2="21" y2="17"/>
      </>
    )}
  </svg>
);

export default function Navbar() {
  const { logout }         = useAuth();
  const { isDark, toggle } = useTheme();
  const isLoggedIn         = useSelector(selectIsLoggedIn);
  const user               = useSelector(selectUser);
  const credits            = useSelector(selectCredits);
  const location           = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  // Close both menus whenever the route changes.
  useEffect(() => {
    setDropdownOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll while mobile menu is open — feels like a proper
  // full-screen menu instead of a scrolling banner.
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileOpen]);

  // Close on Escape when either menu is open.
  useEffect(() => {
    if (!dropdownOpen && !mobileOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dropdownOpen, mobileOpen]);

  const initials = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>

        {/* ── Logo ───────────────────────────────── */}
        <Link to="/" className={styles.logo} aria-label="EdgeAI home">
          <span className={styles.mark}><EdgeMark size={17} color="var(--color-accent)" /></span>
          <span className={styles.logoText}>Edge<span className={styles.accent}>AI</span></span>
        </Link>

        {/* ── Desktop right side ─────────────────── */}
        <div className={styles.desktopRight}>
          <button className={styles.themeBtn} onClick={toggle} aria-label="Toggle theme" title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {isLoggedIn ? (
            <>
              <Link to="/wallet" className={styles.credits}>
                <StarIcon />
                <span className={styles.creditsNum}>{credits}</span>
                <span className={styles.creditsLbl}>credits</span>
              </Link>

              <div className={styles.avatarWrap}>
                <button
                  className={styles.avatarBtn}
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-label="Account menu"
                  aria-expanded={dropdownOpen}
                >
                  {initials}
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      className={styles.dropdown}
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0,  scale: 1 }}
                      exit={{    opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className={styles.dropHead}>
                        <p className={styles.dropName}>{user?.name}</p>
                        <p className={styles.dropEmail}>{user?.email}</p>
                      </div>
                      <div className={styles.divider} />
                      <Link to="/history" className={styles.dropItem}>My Predictions</Link>
                      <Link to="/wallet"  className={styles.dropItem}>Wallet</Link>
                      <Link to="/pricing" className={styles.dropItem}>Pricing</Link>
                      {user?.role === 'admin' && (
                        <Link to="/admin" className={styles.dropItem}>Admin Panel</Link>
                      )}
                      <div className={styles.divider} />
                      <button className={`${styles.dropItem} ${styles.logout}`} onClick={logout}>Log out</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className={styles.authRow}>
              <Link to="/pricing" className={styles.loginLink}>Pricing</Link>
              <Link to="/login"   className={styles.loginLink}>Log in</Link>
              <Link to="/register" className={styles.registerBtn}>Get Started</Link>
            </div>
          )}
        </div>

        {/* ── Mobile right side ──────────────────── */}
        <div className={styles.mobileRight}>
          <button className={styles.themeBtnMobile} onClick={toggle} aria-label="Toggle theme">
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            className={styles.hamburger}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <HamburgerIcon open={mobileOpen} />
          </button>
        </div>
      </div>

      {/* ── Mobile menu overlay ─────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className={styles.mobileBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{    opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              className={styles.mobileMenu}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0   }}
              exit={{    opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-label="Navigation menu"
            >
              {/* User block — only for logged-in users, doubles as a
                  quick balance display + shortcut to the wallet. */}
              {isLoggedIn && (
                <Link to="/wallet" className={styles.mobileUserBlock}>
                  <div className={styles.mobileUserAvatar}>{initials}</div>
                  <div className={styles.mobileUserInfo}>
                    <div className={styles.mobileUserName}>{user?.name}</div>
                    <div className={styles.mobileUserEmail}>{user?.email}</div>
                  </div>
                  <div className={styles.mobileUserCredits}>
                    <StarIcon />
                    <span>{credits}</span>
                  </div>
                </Link>
              )}

              {/* Nav items */}
              <div className={styles.mobileItems}>
                <Link to="/" className={styles.mobileItem}>
                  <span>Home</span>
                  <span className={styles.mobileItemArrow}>→</span>
                </Link>
                <Link to="/pricing" className={styles.mobileItem}>
                  <span>Pricing</span>
                  <span className={styles.mobileItemArrow}>→</span>
                </Link>
                {isLoggedIn && (
                  <>
                    <Link to="/history" className={styles.mobileItem}>
                      <span>My predictions</span>
                      <span className={styles.mobileItemArrow}>→</span>
                    </Link>
                    <Link to="/wallet" className={styles.mobileItem}>
                      <span>Wallet</span>
                      <span className={styles.mobileItemArrow}>→</span>
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" className={styles.mobileItem}>
                        <span>Admin panel</span>
                        <span className={styles.mobileItemArrow}>→</span>
                      </Link>
                    )}
                  </>
                )}
              </div>

              {/* Auth footer — logs out or offers auth CTAs */}
              <div className={styles.mobileFooter}>
                {isLoggedIn ? (
                  <button className={styles.mobileLogout} onClick={() => { logout(); setMobileOpen(false); }}>
                    Log out
                  </button>
                ) : (
                  <>
                    <Link to="/login"   className={styles.mobileLoginBtn}>Log in</Link>
                    <Link to="/register" className={styles.mobileSignupBtn}>Sign up free</Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop dropdown click-away curtain */}
      {dropdownOpen && <div className={styles.curtain} onClick={() => setDropdownOpen(false)} />}
    </nav>
  );
}
