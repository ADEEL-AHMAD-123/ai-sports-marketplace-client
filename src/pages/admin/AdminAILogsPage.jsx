import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { adminAPI } from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import styles from './AdminAILogsPage.module.scss';

export default function AdminAILogsPage() {
  const [page, setPage]   = useState(1);
  const [viewing, setViewing] = useState(null); // insight to view full log

  const { data, isLoading } = useQuery(
    ['adminAILogs', page],
    () => adminAPI.getAILogs({ page, limit: 10 }).then(r => r.data),
    { keepPreviousData: true }
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>AI Logs</h1>
          <p className={styles.sub}>Full prompt/response logs — auto-deleted after {import.meta.env.VITE_AI_LOG_DAYS || 30} days</p>
        </div>
        {data && <span className={styles.total}>{data.pagination?.total ?? 0} logs</span>}
      </div>

      {isLoading ? (
        <div className={styles.skeletons}>{[...Array(6)].map((_, i) => <Skeleton key={i} height={100} />)}</div>
      ) : (
        <div className={styles.logList}>
          {(data?.data || []).length === 0 && (
            <div className={styles.empty}>No AI logs available. Logs appear after insights are generated and are deleted after retention period.</div>
          )}
          {(data?.data || []).map((ins) => (
            <div key={ins._id} className={styles.logCard}>
              <div className={styles.logHeader}>
                <div className={styles.logMeta}>
                  <span className={styles.logPlayer}>{ins.playerName}</span>
                  <span className={styles.logStat}>{ins.statType} — {ins.bettingLine}</span>
                  <span className={styles.logSport}>{ins.sport?.toUpperCase()}</span>
                </div>
                <div className={styles.logRight}>
                  {ins.recommendation && (
                    <Badge variant={ins.recommendation === 'over' ? 'over' : 'under'}>
                      {ins.recommendation === 'over' ? '▲ OVER' : '▼ UNDER'}
                    </Badge>
                  )}
                  <span className={styles.logDate}>{new Date(ins.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {ins.aiLog && (
                <div className={styles.logStats}>
                  {ins.aiLog.model && <span className={styles.logChip}>{ins.aiLog.model}</span>}
                  {ins.aiLog.latencyMs && <span className={styles.logChip}>{ins.aiLog.latencyMs}ms</span>}
                  {ins.aiLog.tokensUsed?.total && <span className={styles.logChip}>{ins.aiLog.tokensUsed.total} tokens</span>}
                </div>
              )}

              <div className={styles.logPreview}>
                <p className={styles.previewLabel}>Response preview</p>
                <p className={styles.previewText}>{ins.insightText?.slice(0, 200)}{ins.insightText?.length > 200 ? '...' : ''}</p>
              </div>

              {ins.aiLog?.prompt && (
                <Button variant="ghost" size="sm" onClick={() => setViewing(ins)}>
                  View full prompt & response →
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {data?.pagination?.pages > 1 && (
        <div className={styles.pagination}>
          <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
          <span>{page} / {data.pagination.pages}</span>
          <Button variant="ghost" size="sm" disabled={page === data.pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </div>
      )}

      {/* Full log modal */}
      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title="Full AI Log" size="lg">
        {viewing && (
          <div className={styles.logModalContent}>
            <div className={styles.logSection}>
              <p className={styles.logSectionLabel}>📝 Prompt sent to OpenAI</p>
              <pre className={styles.logPre}>{viewing.aiLog?.prompt}</pre>
            </div>
            <div className={styles.logSection}>
              <p className={styles.logSectionLabel}>🤖 AI Response</p>
              <pre className={styles.logPre}>{viewing.insightText}</pre>
            </div>
            {viewing.aiLog?.processedStats && (
              <div className={styles.logSection}>
                <p className={styles.logSectionLabel}>📐 Processed Stats</p>
                <pre className={styles.logPre}>{JSON.stringify(viewing.aiLog.processedStats, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}