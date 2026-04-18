// src/pages/user/HomePage.jsx
import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import LeagueGrid  from '@/components/home/LeagueGrid';
import LiveSlate   from '@/components/home/LiveSlate';
import ScoutClosings from '@/components/home/ScoutClosings';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import styles from './HomePage.module.scss';

export default function HomePage() {
  return (
    <div className={styles.page}>
      <ErrorBoundary label="Hero section failed to load">
        <HeroSection />
      </ErrorBoundary>
      <ErrorBoundary label="League grid failed to load">
        <LeagueGrid />
      </ErrorBoundary>
      <ErrorBoundary label="Live slate failed to load">
        <LiveSlate />
      </ErrorBoundary>
      <ErrorBoundary label="Scout closings failed to load">
        <ScoutClosings />
      </ErrorBoundary>
    </div>
  );
}