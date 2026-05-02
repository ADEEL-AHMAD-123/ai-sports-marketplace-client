import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {motion,AnimatePresence} from 'framer-motion';
import {useSelector} from 'react-redux';
import {selectIsLoggedIn,selectUser,selectCredits} from '@/store/slices/authSlice';
import {useAuth} from '@/hooks/useAuth';
import {useTheme} from '@/hooks/useTheme';
import EdgeMark from '@/components/ui/EdgeMark';
import styles from './Navbar.module.scss';
const SunIcon=()=>(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>);
const MoonIcon=()=>(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>);
const StarIcon=()=>(<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
export default function Navbar(){
  const {logout}=useAuth();const {isDark,toggle}=useTheme();
  const isLoggedIn=useSelector(selectIsLoggedIn);const user=useSelector(selectUser);const credits=useSelector(selectCredits);
  const [open,setOpen]=useState(false);
  return(
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <span className={styles.mark}><EdgeMark size={17} color="var(--color-accent)" /></span>
          <span className={styles.logoText}>Edge<span className={styles.accent}>AI</span></span>
        </Link>
        <div className={styles.right}>
          <button className={styles.themeBtn} onClick={toggle} title={isDark?'Light':'Dark'}>{isDark?<SunIcon/>:<MoonIcon/>}</button>
          {isLoggedIn?(
            <>
              <Link to="/wallet" className={styles.credits}><StarIcon/><span className={styles.creditsNum}>{credits}</span><span className={styles.creditsLbl}>credits</span></Link>
              <div className={styles.avatarWrap}>
                <button className={styles.avatarBtn} onClick={()=>setOpen(v=>!v)}>{user?.name?.[0]?.toUpperCase()||'?'}</button>
                <AnimatePresence>
                  {open&&(
                    <motion.div className={styles.dropdown} initial={{opacity:0,y:-8,scale:0.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:0.96}} transition={{duration:0.15}}>
                      <div className={styles.dropHead}><p className={styles.dropName}>{user?.name}</p><p className={styles.dropEmail}>{user?.email}</p></div>
                      <div className={styles.divider}/>
                      <Link to="/wallet" className={styles.dropItem} onClick={()=>setOpen(false)}>Wallet</Link>
                      {user?.role==='admin'&&<Link to="/admin" className={styles.dropItem} onClick={()=>setOpen(false)}>Admin Panel</Link>}
                      <div className={styles.divider}/>
                      <button className={`${styles.dropItem} ${styles.logout}`} onClick={()=>{logout();setOpen(false);}}>Log out</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ):(
            <div className={styles.authRow}>
              <Link to="/login" className={styles.loginLink}>Log in</Link>
              <Link to="/register" className={styles.registerBtn}>Get Started</Link>
            </div>
          )}
        </div>
      </div>
      {open&&<div className={styles.curtain} onClick={()=>setOpen(false)}/>}
    </nav>
  );
}