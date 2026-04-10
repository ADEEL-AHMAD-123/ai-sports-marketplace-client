import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMsg } from '@/services/api';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './AuthPage.module.scss';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! You have 3 free credits to start.');
      navigate('/');
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

        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Get 3 free AI insights to start</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Full name"
            type="text"
            placeholder="John Smith"
            value={form.name}
            onChange={set('name')}
            required
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min 8 characters"
            value={form.password}
            onChange={set('password')}
            required
            autoComplete="new-password"
            hint="Must contain uppercase, lowercase, and a number"
          />
          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            Create account — it's free
          </Button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}