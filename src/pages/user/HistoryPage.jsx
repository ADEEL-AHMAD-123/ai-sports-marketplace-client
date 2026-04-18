// src/pages/user/HistoryPage.jsx
// User's personal prediction history — all unlocked insights

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/slices/authSlice';
import styles from './HistoryPage.module.scss';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const API = (path) => `${API_BASE}${path}`;

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function StatBadge({ label, value, dim }) {
  return (
    <span className={`${styles.statBadge} ${dim ? styles.dim : ''}`}>
      <span className={styles.badgeLabel}>{label}</span>
      <span className={styles.badgeVal}>{value}</span>
    </span>
  );
}

function InsightCard({ insight }) {
  const [expanded, setExpanded] = useState(false);
  const isOver = insight.recommendation === 'over';
  const edge = parseFloat(insight.edgePercentage || 0);
  const edgeStr = edge >= 0 ? `+${edge.toFixed(1)}%` : `${edge.toFixed(1)}%`;

  return (
    <div className={`${styles.card} ${expanded ? styles.cardExpanded : ''}`}>
      <div className={styles.cardMain} onClick={() => setExpanded(!expanded)}>
        <div className={styles.cardLeft}>
          <div className={styles.playerInfo}>
            <span className={styles.playerName}>{insight.playerName}</span>
            <div className={styles.statRow}>
              <span className={styles.statType}>{insight.statType}</span>
              <span className={styles.line}>Line: {insight.bettingLine}</span>
            </div>
          </div>
        </div>

        <div className={styles.cardMid}>
          <span className={`${styles.rec} ${isOver ? styles.over : styles.under}`}>
            {isOver ? '▲' : '▼'} {insight.recommendation?.toUpperCase()} {insight.bettingLine}
          </span>
        </div>

        <div className={styles.cardRight}>
          <div className={styles.metrics}>
            <StatBadge label="Edge" value={edgeStr} />
            <StatBadge label="Conf" value={`${insight.confidenceScore ?? '—'}%`} />
            {insight.isHighConfidence && <span className={styles.tagHC}>HC</span>}
            {insight.isBestValue && <span className={styles.tagBV}>BV</span>}
          </div>
          <span className={styles.time}>{timeAgo(insight.createdAt)}</span>
        </div>

        <button className={styles.expandBtn}>{expanded ? '▲' : '▼'}</button>
      </div>

      {expanded && (
        <div className={styles.cardDetail}>
          {insight.insightSummary && (
            <p className={styles.summary}>{insight.insightSummary}</p>
          )}

          <div className={styles.detailWindows}>
            {insight.baselineStatAvg != null && (
              <div className={styles.window}>
                <span className={styles.windowTitle}>Season Baseline</span>
                <div className={styles.windowRow}>
                  <span>Season avg</span><strong>{insight.baselineStatAvg}</strong>
                </div>
                {insight.baselineMinutes && (
                  <div className={styles.windowRow}>
                    <span>Minutes</span><strong>{insight.baselineMinutes}</strong>
                  </div>
                )}
                {insight.trueShootingPct && (
                  <div className={styles.windowRow}>
                    <span>TS%</span><strong>{insight.trueShootingPct}%</strong>
                  </div>
                )}
              </div>
            )}
            {insight.focusStatAvg != null && (
              <div className={styles.window}>
                <span className={styles.windowTitle}>10-Game Avg</span>
                <div className={styles.windowRow}>
                  <span>Avg</span><strong>{insight.focusStatAvg}</strong>
                </div>
                <div className={styles.windowRow}>
                  <span>vs Line</span>
                  <strong className={edge < 0 ? styles.under : styles.over}>{edgeStr}</strong>
                </div>
              </div>
            )}
            {insight.formPoints != null || insight.formAssists != null ? (
              <div className={styles.window}>
                <span className={styles.windowTitle}>Last 5 Games</span>
                <div className={styles.windowRow}>
                  <span>Form avg</span>
                  <strong>{
                    insight.statType === 'points' ? insight.formPoints :
                    insight.statType === 'assists' ? insight.formAssists :
                    insight.statType === 'rebounds' ? insight.formRebounds :
                    insight.formThrees ?? '—'
                  }</strong>
                </div>
                {insight.formMinutes && (
                  <div className={styles.windowRow}>
                    <span>Minutes</span><strong>{insight.formMinutes}</strong>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {insight.insightFactors?.length > 0 && (
            <div className={styles.factors}>
              <p className={styles.factorsTitle}>Supporting Factors</p>
              <ul>
                {insight.insightFactors.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {insight.insightRisks?.length > 0 && (
            <div className={styles.risks}>
              <p className={styles.risksTitle}>Risk Factors</p>
              <ul>
                {insight.insightRisks.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const token = useSelector(selectToken);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');
  const LIMIT = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filter !== 'all') params.set('filter', filter);

      const res = await fetch(API(`/insights/my-history?${params}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setInsights(data.data || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filter, token]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Predictions</h1>
          <p className={styles.sub}>{total} insight{total !== 1 ? 's' : ''} unlocked</p>
        </div>
        <div className={styles.filters}>
          {['all', 'highConfidence', 'bestValue'].map(f => (
            <button key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => { setFilter(f); setPage(1); }}>
              {f === 'all' ? 'All' : f === 'highConfidence' ? 'High Confidence' : 'Best Value'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading your predictions...</div>
      ) : insights.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyIcon}>📊</p>
          <p className={styles.emptyTitle}>No predictions yet</p>
          <p className={styles.emptySub}>Unlock insights from the home screen to see them here</p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {insights.map(insight => (
              <InsightCard key={insight._id} insight={insight} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              <button className={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}