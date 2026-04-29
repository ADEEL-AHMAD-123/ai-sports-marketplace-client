// src/pages/admin/AdminAILogsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { selectToken } from '@/store/slices/authSlice';
import styles from './AdminAILogsPage.module.scss';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function apiFetch(path, token) {
  return fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function formatJSON(text) {
  try { return JSON.stringify(JSON.parse(text), null, 2); }
  catch { return text; }
}

function LogEntry({ log }) {
  const [open, setOpen] = useState(false);
  const isOver = log.recommendation === 'over';

  return (
    <div className={styles.entry}>
      <button className={`${styles.entryHeader} ${open ? styles.entryHeaderOpen : ''}`} onClick={() => setOpen(o => !o)}>
        <span className={`${styles.sportTag}`}>{log.sport?.toUpperCase()}</span>
        <span className={styles.entryName}>{log.playerName}</span>
        <span className={styles.entryStat}>{log.statType} · {log.bettingLine}</span>
        <span className={`${styles.entryRec} ${isOver ? styles.recOver : styles.recUnder}`}>
          {isOver ? '▲ OVER' : '▼ UNDER'}
        </span>
        {log.aiLog?.latencyMs    && <span className={styles.entryMeta}>{log.aiLog.latencyMs}ms</span>}
        {log.aiLog?.tokensUsed?.total_tokens && (
          <span className={styles.entryMeta}>{log.aiLog.tokensUsed.total_tokens} tokens</span>
        )}
        <span className={styles.entryTime}>{timeAgo(log.createdAt)}</span>
        <span className={styles.expandIcon}>{open ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.entryBody}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            {log.aiLog?.prompt && (
              <div className={styles.logSection}>
                <p className={styles.logSectionLabel}>Prompt sent to OpenAI</p>
                <pre className={styles.logPre}>{log.aiLog.prompt}</pre>
              </div>
            )}
            {log.aiLog?.rawResponse && (
              <div className={styles.logSection}>
                <p className={styles.logSectionLabel}>Raw AI response</p>
                <pre className={styles.logPre}>{formatJSON(log.aiLog.rawResponse)}</pre>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminAILogsPage() {
  const token = useSelector(selectToken);
  const [logs,       setLogs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await apiFetch(`/admin/logs/ai?page=${page}&limit=10`, token);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      setLogs(data.data || []);
      setPagination(data.pagination || {});
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className={styles.page}>

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>AI Prompt Logs</h1>
          <p className={styles.pageSub}>
            Full prompt + response for each insight. Logs expire after {import.meta.env.VITE_AI_LOG_RETENTION_DAYS || 30} days.
            Click any row to expand.
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={load} title="Refresh">↻ Refresh</button>
      </div>

      {loading ? (
        <div className={styles.stateMsg}>Loading logs…</div>
      ) : logs.length === 0 ? (
        <div className={styles.stateMsg}>
          No AI logs. They are cleared after {import.meta.env.VITE_AI_LOG_RETENTION_DAYS || 30} days by the nightly cleanup job.
        </div>
      ) : (
        <div className={styles.logList}>
          {logs.map(log => <LogEntry key={log._id} log={log} />)}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className={styles.pageInfo}>{page} / {pagination.pages}</span>
          <button className={styles.pageBtn} disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}