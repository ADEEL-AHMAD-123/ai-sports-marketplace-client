// components/ui/Input.jsx
import React, { forwardRef } from 'react';
import styles from './Input.module.scss';

const Input = forwardRef(({
  label, error, hint, leftIcon, rightIcon, className = '', ...props
}, ref) => (
  <div className={`${styles.wrapper} ${className}`}>
    {label && <label className={styles.label}>{label}</label>}
    <div className={`${styles.inputWrap} ${error ? styles.hasError : ''}`}>
      {leftIcon  && <span className={styles.leftIcon}>{leftIcon}</span>}
      <input ref={ref} className={`${styles.input} ${leftIcon ? styles.hasLeft : ''} ${rightIcon ? styles.hasRight : ''}`} {...props} />
      {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
    </div>
    {error && <p className={styles.error}>{error}</p>}
    {hint  && !error && <p className={styles.hint}>{hint}</p>}
  </div>
));
Input.displayName = 'Input';
export { Input };