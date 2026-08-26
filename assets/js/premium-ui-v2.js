(() => {
  'use strict';

  if (window.__lineupLabPremiumV2) return;
  window.__lineupLabPremiumV2 = true;
  document.documentElement.classList.add('lineuplab-v2');

  const cssHref = new URL('../css/premium-v2.css', import.meta.url).href;
  if (!document.querySelector('link[data-lineuplab-premium-v2]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssHref;
    link.dataset.lineuplabPremiumV2 = '1';
    document.head.appendChild(link);
  }

  let sharedItems = [];
  let sharedLoaded = false;
  let decorateQueued = false;

  const esc = (value='') => String(value).replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));

  async function loadSharedItems(){
    if (sharedLoaded) return sharedItems;
    sharedLoaded = true;
    try {
      const response = await fetch(`data/lineups.json?v=${Date.now()}`, { cache:'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      sharedItems = Array.isArray(json) ? json : Array.isArray(json?.lineups) ? json.lineups : [];
    } catch (error) {
      console.warn('premium v2 shared lineup read failed', error);
      sharedItems = [];
    }
    return sharedItems;
  }

  function lineupMap(){
    const map = new Map();
    sharedItems.forEach(item => item?.id && map.set(String(item.id), item));
    try {
      const local = window.LineupStorage?.getUserLineups?.() || [];
      local.forEach(item => item?.id && map.set(String(item.id), item));
    } catch {}
    return map;
  }

  function activeMapImage(){
    const active = document.querySelector('.map-option.active img');
    return active?.currentSrc || active?.src || '';
  }

  function cardAgentImage(card){
    const img = card.querySelector(':scope > .agent-avatar img');
    return img?.currentSrc || img?.src || '';
  }

  function preferredThumb(item){
    const images = item?.images || {};
    return images.result || images.aim || images.standing || '';
  }

  function decorateLineupCards(){
    const root = document.getElementById('lineupCards');
    if (!root) return;
    const items = lineupMap();
    const mapImage = activeMapImage();

    root.querySelectorAll('.lineup-card').forEach(card => {
      const id = String(card.dataset.id || '');
      const item = items.get(id);
      let visual = card.querySelector(':scope > .lineup-card-visual-v2');
      if (!visual) {
        visual = document.createElement('div');
        visual.className = 'lineup-card-visual-v2';
        card.insertBefore(visual, card.firstChild);
      }

      const thumb = preferredThumb(item);
      const background = thumb || mapImage;
      const agentSrc = cardAgentImage(card);
      visual.classList.toggle('is-map', !thumb);
      visual.dataset.lineupId = id;
      visual.innerHTML = `${background ? `<img class="lineup-thumb-v2" src="${esc(background)}" alt="" loading="lazy">` : ''}${agentSrc ? `<img class="lineup-card-agent-v2" src="${esc(agentSrc)}" alt="" loading="lazy">` : ''}<span class="lineup-card-ability-v2">${esc(item?.ability || 'LINEUP')}</span>`;
    });
  }

  function installAgentSearch(){
    const grid = document.getElementById('agentGrid');
    if (!grid) return;
    let holder = document.querySelector('.agent-search-v2');
    if (!holder) {
      holder = document.createElement('label');
      holder.className = 'agent-search-v2';
      holder.innerHTML = '<input type="search" autocomplete="off" spellcheck="false" placeholder="エージェントを検索">';
      grid.parentNode.insertBefore(holder, grid);
      holder.querySelector('input').addEventListener('input', applyAgentSearch);
    }
    applyAgentSearch();
  }

  function applyAgentSearch(){
    const grid = document.getElementById('agentGrid');
    const input = document.querySelector('.agent-search-v2 input');
    if (!grid || !input) return;
    const query = input.value.trim().toLowerCase();
    grid.querySelectorAll('.agent-option').forEach(button => {
      const name = (button.dataset.agent || button.title || '').toLowerCase();
      button.hidden = !!query && !name.includes(query);
    });
  }

  function decorateDetail(){
    const detail = document.getElementById('detailContent');
    if (!detail) return;
    const hero = detail.querySelector('.detail-hero');
    if (!hero || hero.querySelector('.detail-corner-v2')) return;
    const corner = document.createElement('span');
    corner.className = 'detail-corner-v2';
    corner.textContent = 'LINEUP DATA';
    hero.appendChild(corner);
  }

  function decorateMap(){
    const stage = document.getElementById('libraryMapStage');
    if (!stage || stage.querySelector('.map-watermark-v2')) return;
    const mark = document.createElement('div');
    mark.className = 'map-watermark-v2';
    mark.innerHTML = '<span>TACTICAL MAP</span><small>START → LAND</small>';
    stage.appendChild(mark);
  }

  function decorate(){
    decorateQueued = false;
    installAgentSearch();
    decorateLineupCards();
    decorateDetail();
    decorateMap();
  }

  function queueDecorate(){
    if (decorateQueued) return;
    decorateQueued = true;
    requestAnimationFrame(decorate);
  }

  async function boot(){
    await loadSharedItems();
    queueDecorate();

    const lineupCards = document.getElementById('lineupCards');
    const agentGrid = document.getElementById('agentGrid');
    const detail = document.getElementById('detailContent');
    const mapStrip = document.getElementById('mapStrip');

    const observer = new MutationObserver(queueDecorate);
    [lineupCards, agentGrid, detail, mapStrip].filter(Boolean).forEach(node => observer.observe(node, { childList:true, subtree:true }));

    document.addEventListener('click', event => {
      if (event.target.closest('[data-tab-target], .map-option, .agent-option, .ability-filter-btn, .lineup-card, [data-mine-view]')) {
        setTimeout(queueDecorate, 20);
      }
    }, true);

    document.addEventListener('change', event => {
      if (event.target.closest('#difficultyFilter,#favoritesOnly,#sortFilter,#creatorForm')) setTimeout(queueDecorate, 20);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
