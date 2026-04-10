import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authAPI, getErrorMsg } from '@/services/api';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './AuthPage.module.scss';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, newPassword: password });
      toast.success('Password reset! Please log in with your new password.');
      navigate('/login');
    } catch (err) {
      setError(getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.errorBox}>Invalid or missing reset token. Please request a new password reset link.</div>
          <p className={styles.footer}><Link to="/forgot-password">Request new link →</Link></p>
        </div>
      </div>
    );
  }

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

        <h1 className={styles.title}>New password</h1>
        <p className={styles.subtitle}>Choose a strong password for your account</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="New password"
            type="password"
            placeholder="Min 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            hint="Must contain uppercase, lowercase, and a number"
          />
          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            Reset password
          </Button>
        </form>
      </motion.div>
    </div>
  );
}