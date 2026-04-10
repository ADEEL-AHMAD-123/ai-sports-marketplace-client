import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { selectActiveFilter, setActiveFilter } from '@/store/slices/uiSlice';
import { oddsAPI } from '@/services/api';
import PropCard from '@/components/insight/PropCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import styles from './MatchPage.module.scss';

const BackIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const RefreshIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const AllIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const TrendIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const BoltIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;

const FILTERS = [
  { key:'all',            label:'All Props',       desc:'',                  Icon:AllIcon },
  { key:'highConfidence', label:'High Confidence', desc:'8/10+ historical hit rate', Icon:TrendIcon },
  { key:'bestValue',      label:'Best Value',      desc:'15%+ edge on line', Icon:BoltIcon },
];

const stagger = { hidden:{}, show:{ transition:{ staggerChildren:0.05 } } };
const item = { hidden:{opacity:0,y:14}, show:{opacity:1,y:0,transition:{duration:0.28}} };

export default function MatchPage() {
  const { sport, eventId } = useParams();
  const dispatch = useDispatch();
  const activeFilter = useSelector(selectActiveFilter);

  const { data:props=[], isLoading, error, refetch } = useQuery(
    ['props', sport, eventId, activeFilter],
    () => oddsAPI.getProps(sport, eventId, activeFilter).then(r => r.data.data),
    { staleTime: 5*60*1000 }
  );

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/" className={styles.back}><BackIcon />Back to Games</Link>

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Player Props</h1>
            <p className={styles.sub}>Unlock AI insights for data-backed OVER/UNDER recommendations</p>
          </div>
          <button className={styles.refreshBtn} onClick={() => refetch()}><RefreshIcon />Refresh</button>
        </div>

        <div className={styles.filterBar}>
          {FILTERS.map(({ key, label, desc, Icon }) => (
            <button key={key}
              className={`${styles.filter} ${activeFilter===key?styles.filterOn:''}`}
              onClick={() => dispatch(setActiveFilter(key))}
            >
              <Icon />
              <span>{label}</span>
              {desc && <span className={styles.filterHint}>{desc}</span>}
            </button>
          ))}
        </div>

        <div className={styles.notice}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>1 credit per insight · 3 free credits on signup · Auto-refund if AI fails</div>

        {isLoading && <div className={styles.grid}>{[...Array(6)].map((_,i)=><SkeletonCard key={i}/>)}</div>}
        {error && <div className={styles.empty}><p className={styles.emptyTitle}>Could not load props</p><p className={styles.emptySub}>Backend must be running. <button onClick={()=>refetch()}>Retry</button></p></div>}
        {!isLoading && !error && props.length===0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>{activeFilter!=='all'?'No props match this filter':'No props yet'}</p>
            <p className={styles.emptySub}>{activeFilter!=='all'?'Try switching to "All Props"':'Props are fetched every 30 minutes.'}</p>
          </div>
        )}
        {!isLoading && !error && props.length>0 && (
          <AnimatePresence mode="wait">
            <motion.div key={activeFilter} className={styles.grid} variants={stagger} initial="hidden" animate="show">
              {props.map(p => <motion.div key={`${p.playerName}-${p.statType}`} variants={item}><PropCard prop={p} sport={sport}/></motion.div>)}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}