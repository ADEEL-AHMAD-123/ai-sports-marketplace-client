/**
 * AdminAILogsPage.jsx
 * GET /api/admin/logs/ai?page=1&limit=10
 * Shows AI prompt + raw response for debugging prompt quality.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import styles from './AdminShared.module.scss';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function apiFetch(path, token) {
  const res  = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

function LogEntry({ log }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.logEntry}>
      <div className={styles.logHeader} onClick={() => setExpanded(e => !e)}>
        <div className={styles.logMeta}>
          <span className={styles.sportTag}>{log.sport?.toUpperCase()}</span>
          <span className={styles.tdBold}>{log.playerName}</span>
          <span className={styles.tdMuted}>{log.statType}</span>
          <span className={styles.tdMono} style={{ color: log.recommendation === 'over' ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
            {log.recommendation === 'over' ? '▲ OVER' : '▼ UNDER'}
          </span>
          {log.aiLog?.latencyMs && (
            <span className={styles.tdMuted}>{log.aiLog.latencyMs}ms</span>
          )}
          {log.aiLog?.tokensUsed?.total_tokens && (
            <span className={styles.tdMuted}>{log.aiLog.tokensUsed.total_tokens} tokens</span>
          )}
        </div>
        <span className={styles.expandBtn}>{expanded ? '▲' : '▼'}</span>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.logBody}>
              {log.aiLog?.prompt && (
                <div className={styles.logSection}>
                  <p className={styles.logSectionLabel}>PROMPT</p>
                  <pre className={styles.logPre}>{log.aiLog.prompt}</pre>
                </div>
              )}
              {log.aiLog?.rawResponse && (
                <div className={styles.logSection}>
                  <p className={styles.logSectionLabel}>AI RESPONSE</p>
                  <pre className={styles.logPre}>{
                    (() => {
                      try { return JSON.stringify(JSON.parse(log.aiLog.rawResponse), null, 2); }
                      catch { return log.aiLog.rawResponse; }
                    })()
                  }</pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminAILogsPage() {
  const token = useSelector(s => s.auth.token);
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/admin/logs/ai?page=${page}&limit=10`, token);
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
        <h2 className={styles.pageTitle}>AI Prompt Logs</h2>
        <div className={styles.searchRow}>
          <p className={styles.pageHint}>
            Logs expire after {import.meta.env.VITE_AI_LOG_RETENTION_DAYS || 30} days.
            Click any row to expand prompt + response.
          </p>
          <button className={styles.refreshBtn} onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No AI logs found.</p>
          <p className={styles.tdMuted}>Logs are cleared after {import.meta.env.VITE_AI_LOG_RETENTION_DAYS || 30} days or sooner via the 3AM cleanup job.</p>
        </div>
      ) : (
        <div className={styles.logList}>
          {logs.map((log, i) => (
            <motion.div key={log._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}>
              <LogEntry log={log} />
            </motion.div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>← Prev</button>
          <span className={styles.pageInfo}>{page} / {pagination.pages}</span>
          <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>Next →</button>
        </div>
      )}
    </div>
  );
}