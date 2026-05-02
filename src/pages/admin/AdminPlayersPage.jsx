// pages/admin/AdminPlayersPage.jsx — Player ID cache health
import React, { useState } from 'react';
import { useAdminPlayers } from '@/hooks/useAdmin';
import styles from '@/styles/AdminShared.module.scss';

export default function AdminPlayersPage() {
  const [sport, setSport] = useState('nba');
  const { players, isLoading, clearing, load, clearCache } = useAdminPlayers(sport);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filtered = players
    .filter(p =>
      !search ||
      p.oddsApiName.toLowerCase().includes(search.toLowerCase()) ||
      String(p.apiSportsId || '').includes(search) ||
      (p.resolvedName || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'props') return (b.activePropCount || 0) - (a.activePropCount || 0);
      if (sortBy === 'id')    return (a.apiSportsId || 0) - (b.apiSportsId || 0);
      return a.oddsApiName.localeCompare(b.oddsApiName);
    });

  const overrides    = players.filter(p => p.isOverride).length;
  const withProps    = players.filter(p => p.activePropCount > 0).length;
  const withoutId    = players.filter(p => !p.apiSportsId).length;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Player ID Cache</h1>
          <p className={styles.pageHint}>
            Resolved API-Sports numeric IDs cached permanently. Clear an entry to force re-resolution on the next Prop Watcher run.
          </p>
        </div>
        <div className={styles.searchRow}>
          <select className={styles.searchInput} value={sport} onChange={e => { setSport(e.target.value); setSearch(''); }} style={{ minWidth: 'unset', width: 100 }}>
            <option value="nba">NBA</option>
            <option value="mlb">MLB</option>
            <option value="nhl">NHL</option>
          </select>
          <input
            className={styles.searchInput}
            placeholder="Search name or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className={styles.searchInput} value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ minWidth: 'unset', width: 150 }}>
            <option value="name">Sort: Name</option>
            <option value="props">Sort: Active Props</option>
            <option value="id">Sort: ID</option>
          </select>
          <button className={styles.refreshBtn} onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {/* Summary row */}
      <div className={styles.summaryRow}>
        <span className={styles.summaryChip}><strong>{players.length}</strong> cached</span>
        <span className={styles.summaryChip}><strong>{withProps}</strong> with active props</span>
        <span className={styles.summaryChip}><strong>{overrides}</strong> manual overrides</span>
        {withoutId > 0 && <span className={styles.summaryChip} style={{ color: 'var(--color-danger)', borderColor: 'rgba(255,61,90,0.3)' }}><strong>{withoutId}</strong> missing ID</span>}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Odds API Name</th>
              <th>Resolved Name</th>
              <th>{sport.toUpperCase()} Stats ID</th>
              <th>Team</th>
              <th>Active Props</th>
              <th>Type</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className={styles.loading}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className={styles.loading}>
                {search ? `No results for "${search}"` : `No ${sport.toUpperCase()} players cached yet — run Prop Watcher first`}
              </td></tr>
            ) : filtered.map(p => (
              <tr key={p.oddsApiName} className={`${styles.tableRow} ${p.activePropCount > 0 ? styles.rowHighlight : ''}`}>
                <td className={styles.tdBold}>{p.oddsApiName}</td>
                <td className={styles.tdMuted}>{p.resolvedName || p.apiSportsName?.replace('override:', '') || '—'}</td>
                <td className={styles.tdMono}>{p.apiSportsId || <span style={{ color: 'var(--color-danger)' }}>missing</span>}</td>
                <td className={styles.tdMuted}>{p.teamName || '—'}</td>
                <td>
                  {p.activePropCount > 0
                    ? <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{p.activePropCount}</span>
                    : <span className={styles.tdMuted}>0</span>}
                </td>
                <td>
                  {p.isOverride
                    ? <span className={styles.tagPurple} title="Set via PLAYER_ID_OVERRIDES_JSON in .env">manual</span>
                    : <span className={styles.tagGray}   title="Resolved by name matching">auto</span>}
                </td>
                <td>
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnRed}`}
                    onClick={() => clearCache(p.oddsApiName)}
                    disabled={clearing === p.oddsApiName || p.isOverride}
                    title={p.isOverride ? 'Edit .env to change manual overrides' : 'Clear cached ID — re-resolves on next Prop Watcher run'}
                  >
                    {clearing === p.oddsApiName ? '…' : 'Clear'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}