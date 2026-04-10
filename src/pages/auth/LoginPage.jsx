import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMsg } from '@/services/api';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './AuthPage.module.scss';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}>⚡</span>
          <span className={styles.logoText}>Edge<span className={styles.logoAccent}>IQ</span></span>
        </Link>

        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Log in to access your insights</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
          />
          <div>
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              required
              autoComplete="current-password"
            />
            <div className={styles.forgotLink}>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </div>
          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            Log in
          </Button>
        </form>

        <p className={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register">Sign up free</Link>
        </p>
      </motion.div>
    </div>
  );
}