// components/admin/PlayerHealthPanel.jsx
import React, { useState } from 'react';
import { useAdminPlayers } from '@/hooks/useAdmin';
import styles from '../../pages/admin/AdminDashboard.module.scss';

export default function PlayerHealthPanel({ sport = 'nba' }) {
  const { players, isLoading, clearing, load, clearCache } = useAdminPlayers(sport);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filtered = players
    .filter(p =>
      !search ||
      p.oddsApiName.includes(search.toLowerCase()) ||
      String(p.apiSportsId || '').includes(search) ||
      (p.resolvedName || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'props') return (b.activePropCount || 0) - (a.activePropCount || 0);
      if (sortBy === 'id')    return (a.apiSportsId || 0) - (b.apiSportsId || 0);
      return a.oddsApiName.localeCompare(b.oddsApiName);
    });

  const overrideCount = players.filter(p => p.isOverride).length;
  const activeCount   = players.filter(p => p.activePropCount > 0).length;

  return (
    <div className={styles.panelSection}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleGroup}>
          <h2 className={styles.panelTitle}>Player ID Cache</h2>
          <p className={styles.panelDesc}>
            When a prop is fetched, SignalDraft looks up the player's API-Sports numeric ID and caches it permanently.
            If a player shows 0 stats or wrong data, clear their cache to force a fresh ID lookup on the next Prop Watcher run.
          </p>
          <div className={styles.panelStats}>
            <span className={styles.panelStat}><strong>{players.length}</strong> cached</span>
            <span className={styles.panelStat}><strong>{activeCount}</strong> with active props</span>
            <span className={styles.panelStat}><strong>{overrideCount}</strong> manual overrides</span>
          </div>
        </div>
        <div className={styles.panelControls}>
          <input
            className={styles.searchInput}
            placeholder="Search name or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className={styles.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="name">Sort: Name</option>
            <option value="props">Sort: Active Props</option>
            <option value="id">Sort: ID</option>
          </select>
          <button className={styles.refreshBtn} onClick={load} title="Refresh">↻</button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableHead}>
          <span>Odds API Name</span>
          <span>Resolved Name</span>
          <span>API Sports ID</span>
          <span>Team</span>
          <span>Props</span>
          <span>Type</span>
          <span>Action</span>
        </div>

        {isLoading ? (
          <div className={styles.tableMsg}>Loading player cache…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.tableMsg}>
            {search ? `No results for "${search}"` : 'No players cached yet — run Prop Watcher first'}
          </div>
        ) : filtered.map(p => (
          <div
            key={p.oddsApiName}
            className={`${styles.tableRow} ${p.activePropCount > 0 ? styles.rowActive : ''}`}
          >
            <span className={styles.cellName}>{p.oddsApiName}</span>
            <span className={styles.cellResolved}>
              {p.resolvedName || p.apiSportsName?.replace('override:', '') || '—'}
            </span>
            <span className={styles.cellId}>{p.apiSportsId}</span>
            <span className={styles.cellTeam}>{p.teamName || '—'}</span>
            <span className={styles.cellProps}>
              {p.activePropCount > 0
                ? <span className={styles.propsActive}>{p.activePropCount}</span>
                : <span className={styles.propsNone}>0</span>}
            </span>
            <span className={styles.cellType}>
              {p.isOverride
                ? <span className={styles.tagOverride} title="Set via PLAYER_ID_OVERRIDES_JSON in .env">manual</span>
                : <span className={styles.tagAuto}    title="Resolved automatically by name matching">auto</span>}
            </span>
            <button
              className={styles.clearBtn}
              onClick={() => clearCache(p.oddsApiName)}
              disabled={clearing === p.oddsApiName || p.isOverride}
              title={p.isOverride ? 'Edit .env to change manual overrides' : 'Clear cached ID'}
            >
              {clearing === p.oddsApiName ? '…' : 'Clear'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}