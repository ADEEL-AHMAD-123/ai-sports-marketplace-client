// src/pages/auth/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import styles from './AuthPage.module.scss';

export default function LoginPage() {
  const { login, isLoggedIn, isLoading, clearError } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation(); 
  const from      = location.state?.from?.pathname || '/';

  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoggedIn) navigate(from, { replace: true });
    return () => clearError();
  }, [isLoggedIn]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(form.email, form.password);
    if (!result.success) setError(result.error || 'Login failed.');
  };

  return (
    <div className={styles.page}>
      <motion.div className={styles.card}
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}>⚡</span>
          <span className={styles.logoText}>Edge<span className={styles.logoAccent}>IQ</span></span>
        </Link>

        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Log in to access your scouting reports</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input label="Email" type="email" placeholder="you@example.com"
            value={form.email} onChange={set('email')} required autoComplete="email" />
          <div>
            <Input label="Password" type="password" placeholder="••••••••"
              value={form.password} onChange={set('password')} required autoComplete="current-password" />
            <div className={styles.forgotLink}>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </div>
          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? <span className={styles.spinner} /> : 'Log in'}
          </button>
        </form>

        <p className={styles.footer}>
          Don't have an account? <Link to="/register">Sign up free</Link>
        </p>
      </motion.div>
    </div>
  );
}