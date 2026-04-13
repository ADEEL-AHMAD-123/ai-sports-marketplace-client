// src/pages/auth/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import styles from './AuthPage.module.scss';

export default function RegisterPage() {
  const { register, isLoggedIn, isLoading, clearError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]   = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoggedIn) navigate('/', { replace: true });
    return () => clearError();
  }, [isLoggedIn]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    const result = await register(form.name, form.email, form.password);
    if (!result.success) setError(result.error || 'Registration failed.');
  };

  return (
    <div className={styles.page}>
      <motion.div className={styles.card}
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}>⚡</span>
          <span className={styles.logoText}>Edge<span className={styles.logoAccent}>IQ</span></span>
        </Link>

        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Get 3 free AI scouting reports to start</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input label="Full name" type="text" placeholder="John Smith"
            value={form.name} onChange={set('name')} required autoComplete="name" />
          <Input label="Email" type="email" placeholder="you@example.com"
            value={form.email} onChange={set('email')} required autoComplete="email" />
          <Input label="Password" type="password" placeholder="Min 8 characters"
            value={form.password} onChange={set('password')} required
            autoComplete="new-password" hint="Must contain uppercase, lowercase, and a number" />
          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? <span className={styles.spinner} /> : 'Create account — it\'s free'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}