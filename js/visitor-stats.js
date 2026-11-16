/* Plant IDEA Lab - visitor statistics loader (2026-11-16)
 * Purpose: load ONE Busuanzi-compatible counting provider at a time, keep
 * the existing Hugo markup / ID names, and reveal a diagnostic when blocked.
 *
 * The default provider below is the alternative service because the former
 * cdn.busuanzi.cc-based counter did not update on the user's live site.
 * IMPORTANT: providers maintain independent data; counts cannot be merged.
 */
(() => {
  'use strict';

  // To prioritize the original counter (and its history), swap the order.
  const providers = [
    { name: 'TSSL backup', src: 'https://api.tssl.cc/busuanzi/3.6.9/busuanzi.min.js' },
    { name: 'Busuanzi original', src: 'https://cdn.busuanzi.cc/busuanzi/3.6.9/busuanzi.min.js' }
  ];

  // Avoid artificially incrementing the production site's counters on
  // localhost, file:// pages, and preview branches.
  const validHosts = new Set(['plant-idea.cc', 'www.plant-idea.cc']);
  const ids = ['busuanzi_site_uv', 'busuanzi_site_pv', 'busuanzi_page_pv'];
  const nodes = ids.map(id => document.getElementById(id)).filter(Boolean);
  if (!nodes.length) return;
  if (window.__plantIdeaStatsStarted) return;
  window.__plantIdeaStatsStarted = true;

  const setStatus = (status, provider, details) => {
    document.documentElement.dataset.visitorStatsStatus = status;
    if (provider) document.documentElement.dataset.visitorStatsProvider = provider;
    for (const node of nodes) {
      if (status === 'unavailable') {
        node.title = 'Visitor statistics currently unavailable; check network/ad blocker or counter service.';
      } else if (status === 'local') {
        node.title = 'The counter only runs on plant-idea.cc, not in a local preview.';
      } else {
        node.removeAttribute('title');
      }
    }
    if (details && status === 'unavailable') {
      console.warn('[Plant IDEA Lab stats]', details);
    }
  };

  if (!validHosts.has(location.hostname.toLowerCase())) {
    setStatus('local');
    return;
  }

  const numeric = node => /^\d[\d,\.]*$/.test((node.textContent || '').trim());
  const finished = () => nodes.every(numeric);
  const checkInterval = 250;
  const responseTimeoutMs = 9000;
  let currentProvider = -1;
  let resolved = false;
  let timer = null;
  let pendingScript = null;

  function clearAttempt() {
    if (timer) clearInterval(timer);
    timer = null;
    if (pendingScript) {
      pendingScript.onerror = null;
      pendingScript.onload = null;
    }
  }

  function tryProvider(index) {
    clearAttempt();
    currentProvider = index;
    if (index >= providers.length) {
      setStatus('unavailable', null, 'All configured counting providers failed or did not return numeric counters.');
      return;
    }
    const source = providers[index];
    setStatus('loading', source.name);
    let timeStarted = Date.now();
    let movedOn = false;
    const fallback = (reason) => {
      if (resolved || movedOn) return;
      movedOn = true;
      console.warn('[Plant IDEA Lab stats]', source.name, reason);
      tryProvider(index + 1);
    };
    const script = document.createElement('script');
    pendingScript = script;
    script.src = source.src;
    script.async = true;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    script.onerror = () => fallback('script request failed');
    // Some services load JS but cannot contact their own counting API.
    // A bounded polling period detects that situation as well.
    script.onload = () => { timeStarted = Date.now(); };
    document.head.appendChild(script);
    timer = setInterval(() => {
      if (movedOn || resolved) return;
      if (finished()) {
        resolved = true;
        clearAttempt();
        setStatus('ready', source.name);
      } else if (Date.now() - timeStarted > responseTimeoutMs) {
        fallback('counter API did not update the page within the timeout');
      }
    }, checkInterval);
  }

  tryProvider(0);
})();
