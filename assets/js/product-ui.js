import './premium-ui-v2.js';

const VERSION = 'v0.9.0';
const VERSION_KEY = '0.9.0';
let sharedItems = [];
let statsQueued = false;

const cssUrl = new URL(`../css/product-ui.css?v=${VERSION_KEY}`, import.meta.url).href;
if (!document.querySelector('link[data-lineuplab-product-ui]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssUrl;
  link.dataset.lineuplabProductUi = VERSION_KEY;
  document.head.appendChild(link);
}

document.documentElement.dataset.lineupLabVersion = VERSION;

function safeArray(value){ return Array.isArray(value) ? value : []; }
function localItems(){
  try { return safeArray(window.LineupStorage?.getUserLineups?.()); }
  catch { return []; }
}
function favorites(){
  try { return window.LineupStorage?.getFavorites?.() || new Set(); }
  catch { return new Set(); }
}
function preferences(){
  try { return window.LineupStorage?.getPreferences?.() || {}; }
  catch { return {}; }
}
function savePreferences(next){
  try {
    const current = preferences();
    return window.LineupStorage?.savePreferences?.({ ...current, ...next });
  } catch { return false; }
}

function installPreferenceMerge(){
  const storage = window.LineupStorage;
  if (!storage || storage.__productPreferenceMerge) return;
  const original = storage.savePreferences?.bind(storage);
  if (!original) return;
  storage.savePreferences = function(next){
    let current = {};
    try { current = storage.getPreferences?.() || {}; } catch {}
    return original({ ...current, ...(next || {}) });
  };
  storage.__productPreferenceMerge = true;
}

async function loadSharedItems(){
  try {
    const response = await fetch(`data/lineups.json?v=${Date.now()}`, { cache:'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = await response.json();
    sharedItems = Array.isArray(parsed) ? parsed : safeArray(parsed?.lineups);
  } catch (error) {
    console.warn('product ui shared data read failed', error);
    sharedItems = [];
  }
}

function addVersionUi(){
  if (!document.querySelector('.product-version-chip')) {
    const topActions = document.querySelector('.top-actions');
    if (topActions) {
      const chip = document.createElement('span');
      chip.className = 'product-version-chip';
      chip.textContent = `Lineup Lab ${VERSION}`;
      topActions.prepend(chip);
    }
  }
  if (!document.querySelector('.product-version-watermark')) {
    const mark = document.createElement('div');
    mark.className = 'product-version-watermark';
    mark.textContent = `Lineup Lab ${VERSION}`;
    document.body.appendChild(mark);
  }
}

function addLibraryOverview(){
  const panel = document.querySelector('.tab-panel[data-tab="library"]');
  const layout = panel?.querySelector('.library-layout');
  if (!panel || !layout || panel.querySelector('.library-overview')) return;
  const overview = document.createElement('div');
  overview.className = 'library-overview';
  overview.innerHTML = `
    <div class="library-overview-card primary">
      <span class="library-overview-label">CURRENT MAP</span>
      <strong class="library-overview-value" data-product-stat="map">—</strong>
      <span class="library-overview-note" data-product-stat="matching-note">表示中の定点を集計</span>
    </div>
    <div class="library-overview-card">
      <span class="library-overview-label">MATCHING</span>
      <strong class="library-overview-value" data-product-stat="matching">0</strong>
      <span class="library-overview-note">現在の条件</span>
    </div>
    <div class="library-overview-card">
      <span class="library-overview-label">SHARED</span>
      <strong class="library-overview-value" data-product-stat="shared">0</strong>
      <span class="library-overview-note">GitHub共通</span>
    </div>
    <div class="library-overview-card">
      <span class="library-overview-label">MY LINEUPS</span>
      <strong class="library-overview-value" data-product-stat="local">0</strong>
      <span class="library-overview-note" data-product-stat="favorites-note">お気に入り 0</span>
    </div>
    <div class="library-overview-shortcuts" aria-label="キーボードショートカット">
      <kbd>/</kbd><span>検索</span><kbd>N</kbd><span>新規</span>
    </div>`;
  panel.insertBefore(overview, layout);
}

function addDataPanel(){
  const modalBody = document.querySelector('#dataModal .modal-body');
  if (!modalBody || modalBody.querySelector('.product-data-panel')) return;
  const legacyStat = modalBody.querySelector('.data-stat');
  const panel = document.createElement('div');
  panel.className = 'product-data-panel';
  panel.innerHTML = `
    <div class="product-data-stats">
      <div class="product-data-stat"><span>SHARED</span><strong data-product-data="shared">0</strong></div>
      <div class="product-data-stat"><span>MY LINEUPS</span><strong data-product-data="local">0</strong></div>
      <div class="product-data-stat"><span>FAVORITES</span><strong data-product-data="favorites">0</strong></div>
    </div>
    <div class="product-settings">
      <div class="product-settings-head"><strong>表示設定</strong><span>このブラウザに保存</span></div>
      <div class="product-setting-row">
        <div class="product-setting-copy"><strong>サムネイルを表示</strong><span>定点カードで参考画像を大きく表示します。</span></div>
        <label class="product-toggle"><input type="checkbox" data-product-pref="thumbs"><span class="product-toggle-track"></span></label>
      </div>
      <div class="product-setting-row">
        <div class="product-setting-copy"><strong>コンパクト表示</strong><span>一度に多くの定点カードを表示します。</span></div>
        <label class="product-toggle"><input type="checkbox" data-product-pref="compact"><span class="product-toggle-track"></span></label>
      </div>
      <div class="product-shortcuts">
        <div class="product-shortcut-row"><span>定点検索へ移動</span><kbd>/</kbd></div>
        <div class="product-shortcut-row"><span>新しい定点を作成</span><kbd>N</kbd></div>
      </div>
    </div>`;
  if (legacyStat) legacyStat.insertAdjacentElement('afterend', panel);
  else modalBody.prepend(panel);

  panel.querySelector('[data-product-pref="thumbs"]')?.addEventListener('change', event => {
    applyDisplayPreference('thumbs', event.currentTarget.checked);
  });
  panel.querySelector('[data-product-pref="compact"]')?.addEventListener('change', event => {
    applyDisplayPreference('compact', event.currentTarget.checked);
  });
}

function applyDisplayPreferences(){
  const prefs = preferences();
  const thumbs = prefs.productThumbs !== false;
  const compact = prefs.productCompact === true;
  document.documentElement.dataset.lineupThumbs = thumbs ? '1' : '0';
  document.documentElement.dataset.lineupCompact = compact ? '1' : '0';
  const thumbsInput = document.querySelector('[data-product-pref="thumbs"]');
  const compactInput = document.querySelector('[data-product-pref="compact"]');
  if (thumbsInput) thumbsInput.checked = thumbs;
  if (compactInput) compactInput.checked = compact;
}

function applyDisplayPreference(type, enabled){
  if (type === 'thumbs') {
    document.documentElement.dataset.lineupThumbs = enabled ? '1' : '0';
    savePreferences({ productThumbs: enabled });
  }
  if (type === 'compact') {
    document.documentElement.dataset.lineupCompact = enabled ? '1' : '0';
    savePreferences({ productCompact: enabled });
  }
}

function addMobileDrawer(){
  const topbar = document.querySelector('.topbar');
  const title = topbar?.querySelector('.title-stack');
  if (topbar && title && !topbar.querySelector('.mobile-nav-toggle')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mobile-nav-toggle';
    button.setAttribute('aria-label', 'メニューを開く');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '☰';
    topbar.insertBefore(button, title);
    button.addEventListener('click', () => toggleDrawer());
  }
  if (!document.querySelector('.mobile-nav-backdrop')) {
    const backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'mobile-nav-backdrop';
    backdrop.setAttribute('aria-label', 'メニューを閉じる');
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', closeDrawer);
  }
  document.querySelectorAll('.rail [data-tab-target], #openDataModal').forEach(button => {
    if (button.dataset.productDrawerClose === '1') return;
    button.dataset.productDrawerClose = '1';
    button.addEventListener('click', () => {
      if (window.matchMedia('(max-width:900px)').matches) closeDrawer();
    });
  });
}

function toggleDrawer(){
  const open = !document.body.classList.contains('nav-drawer-open');
  document.body.classList.toggle('nav-drawer-open', open);
  document.querySelector('.mobile-nav-toggle')?.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function closeDrawer(){
  document.body.classList.remove('nav-drawer-open');
  document.querySelector('.mobile-nav-toggle')?.setAttribute('aria-expanded', 'false');
}

function parseCount(text){
  const match = String(text || '').match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function updateStats(){
  statsQueued = false;
  const mapName = document.getElementById('mapTitle')?.textContent?.trim() || '—';
  const matching = parseCount(document.getElementById('resultCount')?.textContent);
  const local = localItems();
  const fav = favorites();
  const sharedCount = sharedItems.length;

  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (node && node.textContent !== String(value)) node.textContent = String(value);
  };
  setText('[data-product-stat="map"]', mapName);
  setText('[data-product-stat="matching"]', matching);
  setText('[data-product-stat="shared"]', sharedCount);
  setText('[data-product-stat="local"]', local.length);
  setText('[data-product-stat="matching-note"]', `${matching}件をマップ上に表示`);
  setText('[data-product-stat="favorites-note"]', `お気に入り ${fav.size}`);
  setText('[data-product-data="shared"]', sharedCount);
  setText('[data-product-data="local"]', local.length);
  setText('[data-product-data="favorites"]', fav.size);
}

function queueStats(){
  if (statsQueued) return;
  statsQueued = true;
  requestAnimationFrame(updateStats);
}

function installStatsObservers(){
  const observer = new MutationObserver(queueStats);
  ['resultCount','mapTitle','lineupCards','mineCount','dataCount'].map(id => document.getElementById(id)).filter(Boolean).forEach(node => {
    observer.observe(node, { childList:true, subtree:true, characterData:true });
  });
  document.addEventListener('click', event => {
    if (event.target.closest('.fav-btn,[data-detail-fav],[data-mine-delete],[data-detail-copy],#clearUserDataBtn,#importDataInput,.map-option,.agent-option,.ability-filter-btn,#resetFilters')) {
      setTimeout(queueStats, 30);
    }
  }, true);
  document.getElementById('openDataModal')?.addEventListener('click', () => setTimeout(() => {
    applyDisplayPreferences();
    queueStats();
  }, 10));
}

function installKeyboardShortcuts(){
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeDrawer();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    const editable = target instanceof HTMLElement && (target.matches('input,textarea,select,[contenteditable="true"]') || target.isContentEditable);
    if (editable) return;
    if (event.key === '/') {
      event.preventDefault();
      document.querySelector('[data-tab-target="library"]')?.click();
      requestAnimationFrame(() => document.getElementById('searchInput')?.focus());
    }
    if (event.key.toLowerCase() === 'n') {
      event.preventDefault();
      document.getElementById('quickCreateBtn')?.click();
    }
  });
}

function installResizeGuard(){
  const media = window.matchMedia('(min-width:901px)');
  const sync = () => { if (media.matches) closeDrawer(); };
  if (media.addEventListener) media.addEventListener('change', sync);
  else media.addListener?.(sync);
}

async function boot(){
  installPreferenceMerge();
  await loadSharedItems();
  addVersionUi();
  addLibraryOverview();
  addDataPanel();
  addMobileDrawer();
  applyDisplayPreferences();
  installStatsObservers();
  installKeyboardShortcuts();
  installResizeGuard();
  updateStats();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
else boot();
