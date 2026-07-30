// src/hooks/useSEO.js
//
// Per-route SEO tag manager — dependency-free replacement for react-helmet.
//
// Why not react-helmet-async? It's a great library but adds a full context
// provider + a re-render layer. For a React SPA that just needs to update
// <title>, meta[description], canonical, og:*, twitter:*, and inject a
// single JSON-LD block per route, direct DOM mutation is simpler, has zero
// runtime overhead, and works identically for Googlebot (which fully
// executes JS). Bing and most AI crawlers primarily read the static tags
// in index.html and public/*.html, which we keep as sensible fallbacks.
//
// Usage:
//   useSEO({
//     title:       'Pricing — EdgeAI',
//     description: 'Credit packs for EdgeAI…',
//     canonical:   'https://edgeai.bet/pricing',
//     ogImage:     'https://edgeai.bet/og-image.png',
//     noIndex:     false,
//     jsonLd:      { '@context': 'https://schema.org', '@type': 'Product', … },
//   });
//
// On unmount the hook reverts every tag it changed to the value that was in
// the DOM when the component mounted, so navigating away from a page
// restores the fallback tags shipped in index.html.

import { useEffect } from 'react';

const HELMET_JSONLD_ID = 'seo-hook-jsonld';

/**
 * Set (or create) a <meta name="…"> tag and return an undo function.
 */
function setMetaByName(name, content) {
  if (content == null) return () => {};
  let el = document.querySelector(`meta[name="${name}"]`);
  const created = !el;
  const previous = el ? el.getAttribute('content') : null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return () => {
    if (created) el.remove();
    else if (previous != null) el.setAttribute('content', previous);
  };
}

/**
 * Set (or create) a <meta property="…"> tag (Open Graph) and return an undo.
 */
function setMetaByProperty(property, content) {
  if (content == null) return () => {};
  let el = document.querySelector(`meta[property="${property}"]`);
  const created = !el;
  const previous = el ? el.getAttribute('content') : null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return () => {
    if (created) el.remove();
    else if (previous != null) el.setAttribute('content', previous);
  };
}

/**
 * Set (or create) a <link rel="canonical"> and return an undo.
 */
function setCanonical(href) {
  if (!href) return () => {};
  let el = document.querySelector('link[rel="canonical"]');
  const created = !el;
  const previous = el ? el.getAttribute('href') : null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  return () => {
    if (created) el.remove();
    else if (previous != null) el.setAttribute('href', previous);
  };
}

/**
 * Replace the JSON-LD block emitted by this hook. There is only one
 * hook-managed JSON-LD tag on the page at a time (identified by ID) —
 * the fallback tag shipped in index.html is left untouched so crawlers
 * that don't run JS still see the static graph.
 */
function setJsonLd(jsonLd) {
  if (!jsonLd) return () => {};
  const previous = document.getElementById(HELMET_JSONLD_ID);
  const el = document.createElement('script');
  el.type = 'application/ld+json';
  el.id = HELMET_JSONLD_ID;
  el.textContent = JSON.stringify(jsonLd);
  document.head.appendChild(el);
  if (previous) previous.remove();
  return () => { if (el.parentNode) el.remove(); };
}

/**
 * useSEO — apply per-route SEO tags on mount, revert on unmount.
 *
 * @param {Object}   opts
 * @param {string}  [opts.title]        Document <title>. Also sets og:title and twitter:title.
 * @param {string}  [opts.description]  Meta description. Also sets og:description + twitter:description.
 * @param {string}  [opts.canonical]    Absolute canonical URL. Also sets og:url.
 * @param {string}  [opts.ogImage]      Absolute URL to an og:image (1200×630 recommended).
 * @param {boolean} [opts.noIndex]      If true, sets robots meta to noindex,nofollow.
 * @param {Object}  [opts.jsonLd]       A JSON-LD object OR { @graph: [...] } to inject.
 */
export function useSEO({ title, description, canonical, ogImage, noIndex, jsonLd } = {}) {
  useEffect(() => {
    const undos = [];

    if (title) {
      const previous = document.title;
      document.title = title;
      undos.push(() => { document.title = previous; });
      undos.push(setMetaByProperty('og:title',      title));
      undos.push(setMetaByName    ('twitter:title', title));
    }

    if (description) {
      undos.push(setMetaByName    ('description',         description));
      undos.push(setMetaByProperty('og:description',      description));
      undos.push(setMetaByName    ('twitter:description', description));
    }

    if (canonical) {
      undos.push(setCanonical(canonical));
      undos.push(setMetaByProperty('og:url', canonical));
    }

    if (ogImage) {
      undos.push(setMetaByProperty('og:image',      ogImage));
      undos.push(setMetaByName    ('twitter:image', ogImage));
    }

    if (noIndex) {
      undos.push(setMetaByName('robots', 'noindex, nofollow'));
    }

    if (jsonLd) {
      undos.push(setJsonLd(jsonLd));
    }

    return () => {
      // Revert in reverse order so tags that were created can be removed
      // before ones that were merely edited.
      for (let i = undos.length - 1; i >= 0; i -= 1) undos[i]();
    };
  }, [title, description, canonical, ogImage, noIndex, JSON.stringify(jsonLd)]); // eslint-disable-line
}

export default useSEO;
