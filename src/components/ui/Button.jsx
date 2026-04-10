// components/ui/Button.jsx
import React from 'react';
import { motion } from 'framer-motion';
import styles from './Button.module.scss';

/**
 * Reusable Button component.
 *
 * @prop variant  'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
 * @prop size     'sm' | 'md' | 'lg'
 * @prop loading  boolean — shows spinner, disables interaction
 * @prop fullWidth boolean
 * @prop leftIcon  ReactNode
 * @prop rightIcon ReactNode
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) {
  const classes = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    loading   ? styles.loading   : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      className={classes}
      disabled={disabled || loading}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      {...props}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {!loading && leftIcon && <span className={styles.icon}>{leftIcon}</span>}
      <span className={styles.label}>{children}</span>
      {!loading && rightIcon && <span className={styles.icon}>{rightIcon}</span>}
    </motion.button>
  );
}