// src/pages/user/HomePage.jsx
import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import LeagueGrid  from '@/components/home/LeagueGrid';
import LiveSlate   from '@/components/home/LiveSlate';
import ScoutClosings from '@/components/home/ScoutClosings';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import useSEO from '@/hooks/useSEO';
import styles from './HomePage.module.scss';

// Sport-specific SEO copy for /sports/nba, /sports/mlb, etc.
// The root ("/") uses the fallback tags shipped in index.html so we don't
// clobber them with a client-side override at first paint.
const SPORT_SEO = {
  nba: {
    title: 'NBA Player Props — AI Scouting Reports | EdgeAI',
    description: 'AI-powered scouting reports for NBA player props: points, rebounds, assists, threes, PRA, minutes. Every pick is backed by 15+ games of stats, matchup context, and sportsbook line comparison.',
    canonical: 'https://edgeai.bet/sports/nba',
    subject: 'NBA player props (points, rebounds, assists, threes)',
  },
  mlb: {
    title: 'MLB Player Props — AI Scouting Reports | EdgeAI',
    description: 'AI-powered scouting reports for MLB player props: hits, total bases, RBIs, home runs, pitcher strikeouts. Includes opposing pitcher analysis, platoon splits, and ballpark factors.',
    canonical: 'https://edgeai.bet/sports/mlb',
    subject: 'MLB player props (hits, total bases, strikeouts)',
  },
  nhl: {
    title: 'NHL Player Props — AI Scouting Reports | EdgeAI',
    description: 'AI-powered scouting reports for NHL player props: shots on goal, goals, assists, points, time-on-ice, goalie saves. Backed by 15+ games and matchup analysis.',
    canonical: 'https://edgeai.bet/sports/nhl',
    subject: 'NHL player props (shots on goal, points, goalie saves)',
  },
  nfl: {
    title: 'NFL Player Props — AI Scouting Reports | EdgeAI',
    description: 'AI-powered scouting reports for NFL player props: passing yards, rushing yards, receiving yards, touchdowns, receptions. Weekly matchup analysis with usage and defensive-context signals.',
    canonical: 'https://edgeai.bet/sports/nfl',
    subject: 'NFL player props (passing, rushing, receiving yards, touchdowns)',
  },
  soccer: {
    title: 'Soccer Player Props — AI Scouting Reports | EdgeAI',
    description: 'AI-powered scouting reports for soccer player props: goals, assists, shots on target. Covers major leagues with recent-form and matchup context.',
    canonical: 'https://edgeai.bet/sports/soccer',
    subject: 'soccer player props (goals, assists, shots on target)',
  },
};

export default function HomePage({ sportRoute }) {
  const seo = sportRoute ? SPORT_SEO[sportRoute] : null;

  // When mounted from /sports/:sport, override the fallback index.html tags
  // with sport-specific copy AND emit a WebPage + BreadcrumbList graph so
  // search results show a proper breadcrumb trail.
  useSEO(seo ? {
    title:       seo.title,
    description: seo.description,
    canonical:   seo.canonical,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'EdgeAI', item: 'https://edgeai.bet/' },
            { '@type': 'ListItem', position: 2, name: seo.title.split('—')[0].trim(), item: seo.canonical },
          ],
        },
        {
          '@type': 'WebPage',
          name: seo.title,
          url: seo.canonical,
          description: seo.description,
          isPartOf: { '@id': 'https://edgeai.bet/#website' },
          about: { '@type': 'Thing', name: seo.subject },
        },
      ],
    },
  } : {});

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
