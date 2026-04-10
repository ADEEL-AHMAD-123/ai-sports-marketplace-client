// components/ui/Spinner.jsx
import React from 'react';
import styles from './Spinner.module.scss';

export function Spinner({ size = 'md', className = '' }) {
  return <span className={`${styles.spinner} ${styles[size]} ${className}`} aria-label="Loading" />;
}