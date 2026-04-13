// src/components/ui/ErrorBoundary.jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (fallback) return fallback;
      return (
        <div style={{
          padding: '40px 24px', textAlign: 'center',
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-bg-border)',
          borderRadius: '12px', margin: '16px',
        }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            Something went wrong
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>
            {this.props.label || 'This section failed to load.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 20px', background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
              border: 'none', borderRadius: '999px', fontFamily: 'var(--font-body)',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}