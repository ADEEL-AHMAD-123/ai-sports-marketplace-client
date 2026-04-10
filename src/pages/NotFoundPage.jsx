import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './NotFoundPage.module.scss';

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.code}>404</div>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.sub}>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className={styles.homeBtn}>← Back to Home</Link>
      </motion.div>
    </div>
  );
}