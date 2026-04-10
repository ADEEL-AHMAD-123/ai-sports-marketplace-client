import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI, getErrorMsg } from '@/services/api';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './AuthPage.module.scss';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
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

        <h1 className={styles.title}>Reset password</h1>
        <p className={styles.subtitle}>We'll send a reset link to your email</p>

        {sent ? (
          <div className={styles.successBox}>
            ✅ If an account with that email exists, a reset link has been sent. Check your inbox.
          </div>
        ) : (
          <>
            {error && <div className={styles.errorBox}>{error}</div>}
            <form className={styles.form} onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                Send reset link
              </Button>
            </form>
          </>
        )}

        <p className={styles.footer}>
          <Link to="/login">← Back to login</Link>
        </p>
      </motion.div>
    </div>
  );
}