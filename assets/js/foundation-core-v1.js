import './premium-ui-v2.js';

const VERSION = 'v1.0.0';
const PREF_THUMBS = 'foundationThumbs';
const PREF_COMPACT = 'foundationCompact';
const MAX_LOCAL_JSON_BYTES = 4 * 1024 * 1024;
let sharedCache = null;
let mineObserver = null;

const cssUrl = new URL('../css/foundation-v1.css?v=1.0.0', import.meta.url).href;
if (!document.querySelector('link[data-lineuplab-foundation]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssUrl;
  link.dataset.lineuplabFoundation = '1';
  document.head.appendChild(link);
}

document.documentElement.dataset.lineupLabVersion = VERSION;

function storage(){ return window.LineupStorage || null; }
function localItems(){
  try { return storage()?.getUserLineups?.() || []; }
  catch { return []; }
}
function preferences(){
  try { return storage()?.getPreferences?.() || {}; }
  catch { return {}; }
}
function savePreferences(next){
  try { return storage()?.savePreferences?.({ ...preferences(), ...next }); }
  catch { return false; }
}
function bytesOf(value){
  try { return new Blob([JSON.stringify(value)]).size; }
  catch { return 0; }
}
function formatBytes(bytes){
  if (!Number.isFinite(bytes)) return '—';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function isMp4Url(value){
  if (!value) return false;
  try { return /\.mp4$/i.test(new URL(value, location.href).pathname); }
  catch { return false; }
}
function esc(value=''){
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function readShared(force=false){
  if (sharedCache && !force) return sharedCache;
  try {
    const response = await fetch(`data/lineups.json?v=${Date.now()}`, { cache:'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = await response.json();
    sharedCache = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.lineups) ? parsed.lineups : [];
  } catch (error) {
    console.warn('shared data read failed', error);
    sharedCache = [];
  }
  return sharedCache;
}

function installVersion(){
  document.querySelectorAll('.product-version-chip,.product-version-watermark').forEach(node => node.remove());
  const actions = document.querySelector('.top-actions');
  if (!actions || actions.querySelector('.foundation-version')) return;
  const chip = document.createElement('span');
  chip.className = 'foundation-version';
  chip.textContent = `Lineup Lab ${VERSION}`;
  actions.prepend(chip);
}

function installStorageGuards(){
  const api = storage();
  if (!api || api.__foundationGuarded) return;
  const originalSave = api.saveUserLineups?.bind(api);
  const originalClear = api.clearUserLineups?.bind(api);
  if (!originalSave || !originalClear) return;

  api.saveUserLineups = function(items){
    const before = api.getUserLineups?.() || [];
    const estimated = bytesOf(items);
    if (estimated > MAX_LOCAL_JSON_BYTES) {
      console.warn(`Lineup Lab: local lineup JSON too large (${formatBytes(estimated)})`);
      return false;
    }
    const ok = originalSave(items);
    if (ok) cleanupRemovedVideos(before, items);
    return ok;
  };

  api.clearUserLineups = function(){
    const before = api.getUserLineups?.() || [];
    originalClear();
    cleanupRemovedVideos(before, []);
  };
  api.__foundationGuarded = true;
}

function cleanupRemovedVideos(before, after){
  const keep = new Set((after || []).map(item => item?.videoUrl).filter(isMp4Url));
  const removed = new Set((before || []).map(item => item?.videoUrl).filter(url => isMp4Url(url) && !keep.has(url)));
  removed.forEach(url => {
    Promise.resolve(storage()?.deleteLocalVideo?.(url)).catch(error => console.warn('orphan mp4 cleanup failed', url, error));
  });
}

function installSettings(){
  const modalBody = document.querySelector('#dataModal .modal-body');
  if (!modalBody || modalBody.querySelector('.foundation-settings')) return;
  const section = document.createElement('section');
  section.className = 'foundation-settings';
  section.innerHTML = `
    <div class="foundation-settings-head"><div><strong>表示・保存状態</strong><span>このブラウザだけに保存されます</span></div><b data-storage-size>—</b></div>
    <label class="foundation-setting-row"><div><strong>サムネイルを表示</strong><span>参考画像を定点カードに表示</span></div><input type="checkbox" data-foundation-pref="thumbs"></label>
    <label class="foundation-setting-row"><div><strong>コンパクト表示</strong><span>定点カードを少し小さく表示</span></div><input type="checkbox" data-foundation-pref="compact"></label>
    <div class="foundation-storage-note">画像は現在localStorage互換方式です。容量が大きくなりすぎる前に共有JSON/バックアップを作成してください。</div>`;
  const firstAction = modalBody.querySelector('.data-action');
  if (firstAction) firstAction.insertAdjacentElement('beforebegin', section);
  else modalBody.appendChild(section);

  section.querySelector('[data-foundation-pref="thumbs"]').addEventListener('change', event => {
    applyPreference('thumbs', event.currentTarget.checked);
  });
  section.querySelector('[data-foundation-pref="compact"]').addEventListener('change', event => {
    applyPreference('compact', event.currentTarget.checked);
  });
  syncPreferences();
  updateStorageMeter();
  document.getElementById('openDataModal')?.addEventListener('click', () => {
    syncPreferences();
    updateStorageMeter();
  });
}

function syncPreferences(){
  const prefs = preferences();
  const thumbs = prefs[PREF_THUMBS] !== false;
  const compact = prefs[PREF_COMPACT] === true;
  document.documentElement.dataset.lineupThumbs = thumbs ? '1' : '0';
  document.documentElement.dataset.lineupCompact = compact ? '1' : '0';
  const thumbsInput = document.querySelector('[data-foundation-pref="thumbs"]');
  const compactInput = document.querySelector('[data-foundation-pref="compact"]');
  if (thumbsInput) thumbsInput.checked = thumbs;
  if (compactInput) compactInput.checked = compact;
}
function applyPreference(type, enabled){
  if (type === 'thumbs') {
    document.documentElement.dataset.lineupThumbs = enabled ? '1' : '0';
    savePreferences({ [PREF_THUMBS]: enabled });
  } else {
    document.documentElement.dataset.lineupCompact = enabled ? '1' : '0';
    savePreferences({ [PREF_COMPACT]: enabled });
  }
}
async function updateStorageMeter(){
  const node = document.querySelector('[data-storage-size]');
  if (!node) return;
  const localBytes = bytesOf(localItems());
  let quotaText = '';
  try {
    const estimate = await navigator.storage?.estimate?.();
    if (estimate?.usage && estimate?.quota) quotaText = ` / ブラウザ使用 ${(estimate.usage / estimate.quota * 100).toFixed(0)}%`;
  } catch {}
  node.textContent = `${formatBytes(localBytes)}${quotaText}`;
  node.classList.toggle('warn', localBytes > 3 * 1024 * 1024);
}

function installKeyboardShortcuts(){
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeNavDrawer();
      closeFilterDrawer();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.matches('input,textarea,select,[contenteditable="true"]') || target.isContentEditable)) return;
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

function installDrawers(){
  const topbar = document.querySelector('.topbar');
  const title = topbar?.querySelector('.title-stack');
  if (topbar && title && !topbar.querySelector('.mobile-nav-toggle')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mobile-nav-toggle';
    button.setAttribute('aria-label','メニューを開く');
    button.innerHTML = '☰';
    topbar.insertBefore(button, title);
    button.addEventListener('click', () => document.body.classList.toggle('nav-drawer-open'));
  }
  if (!document.querySelector('.mobile-nav-backdrop')) {
    const backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'mobile-nav-backdrop';
    backdrop.setAttribute('aria-label','メニューを閉じる');
    backdrop.addEventListener('click', closeNavDrawer);
    document.body.appendChild(backdrop);
  }

  const mapToolbar = document.querySelector('.map-toolbar');
  if (mapToolbar && !mapToolbar.querySelector('.foundation-filter-toggle')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn ghost foundation-filter-toggle';
    button.textContent = 'フィルター';
    button.addEventListener('click', () => document.body.classList.toggle('filter-drawer-open'));
    mapToolbar.appendChild(button);
  }
  const filter = document.querySelector('.filter-panel');
  if (filter && !filter.querySelector('.foundation-filter-close')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'foundation-filter-close';
    button.textContent = '×';
    button.setAttribute('aria-label','フィルターを閉じる');
    button.addEventListener('click', closeFilterDrawer);
    filter.prepend(button);
  }
  if (!document.querySelector('.foundation-filter-backdrop')) {
    const backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'foundation-filter-backdrop';
    backdrop.setAttribute('aria-label','フィルターを閉じる');
    backdrop.addEventListener('click', closeFilterDrawer);
    document.body.appendChild(backdrop);
  }
  document.querySelectorAll('.rail [data-tab-target], #openDataModal').forEach(button => button.addEventListener('click', () => {
    if (window.matchMedia('(max-width:1180px)').matches) closeNavDrawer();
  }));
  const wide = window.matchMedia('(min-width:1181px)');
  const sync = () => { if (wide.matches) { closeNavDrawer(); closeFilterDrawer(); } };
  wide.addEventListener?.('change', sync);
}
function closeNavDrawer(){ document.body.classList.remove('nav-drawer-open'); }
function closeFilterDrawer(){ document.body.classList.remove('filter-drawer-open'); }

function installAccurateLabels(){
  const option = document.querySelector('#sortFilter option[value="recommended"]');
  if (option) option.textContent = '標準順';
}

function validCoord(point){
  return point && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y)) && Number(point.x) >= 0 && Number(point.x) <= 100 && Number(point.y) >= 0 && Number(point.y) <= 100;
}
function validateLineup(item, index=0){
  const errors = [];
  const label = `#${index + 1}`;
  if (!item || typeof item !== 'object') return [`${label}: オブジェクトではありません`];
  if (typeof item.title !== 'string' || !item.title.trim()) errors.push(`${label}: title がありません`);
  if (typeof item.map !== 'string' || !item.map.trim()) errors.push(`${label}: map がありません`);
  if (typeof item.agent !== 'string' || !item.agent.trim()) errors.push(`${label}: agent がありません`);
  if (!validCoord(item.start)) errors.push(`${label}: start 座標が不正です`);
  if (!validCoord(item.end)) errors.push(`${label}: end 座標が不正です`);
  if (item.bounces != null && (!Array.isArray(item.bounces) || item.bounces.some(point => !validCoord(point)))) errors.push(`${label}: bounces が不正です`);
  if (item.videoUrl && !/^https?:\/\//i.test(String(item.videoUrl))) errors.push(`${label}: videoUrl は http(s) URL にしてください`);
  return errors;
}

function installImportValidation(){
  document.addEventListener('change', async event => {
    const input = event.target.closest?.('#importDataInput');
    if (!input) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const incoming = Array.isArray(parsed) ? parsed : parsed?.lineups;
      if (!Array.isArray(incoming)) throw new Error('トップレベル配列または lineups 配列が必要です');
      const errors = incoming.flatMap((item,index) => validateLineup(item,index));
      if (errors.length) throw new Error(errors.slice(0,6).join('\n'));
      const current = localItems();
      const ids = new Set(current.map(item => item.id));
      const now = new Date().toISOString();
      const normalized = incoming.map(item => {
        let id = item.id || crypto.randomUUID?.() || `ll-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        if (ids.has(id)) id = crypto.randomUUID?.() || `${id}-${Date.now()}`;
        ids.add(id);
        return { ...item, id, source:'user', publish:false, createdAt:item.createdAt || now, updatedAt:now };
      });
      const next = [...normalized, ...current];
      if (!storage()?.saveUserLineups?.(next)) throw new Error('保存容量が足りません');
      alert(`${normalized.length}件を検証して読み込みました。ページを更新します。`);
      location.reload();
    } catch (error) {
      alert(`JSONを読み込めませんでした。\n\n${error.message || error}`);
    }
  }, true);
}

async function installPublishToggles(){
  const grid = document.getElementById('mineGrid');
  if (!grid) return;
  const shared = await readShared();
  const sharedIds = new Set(shared.map(item => String(item?.id || '')));
  const decorate = () => {
    const items = localItems();
    const byId = new Map(items.map(item => [String(item.id), item]));
    grid.querySelectorAll('.mine-card').forEach(card => {
      if (card.querySelector('.foundation-publish-toggle')) return;
      const id = card.querySelector('[data-mine-edit]')?.dataset.mineEdit || card.querySelector('[data-mine-view]')?.dataset.mineView;
      if (!id) return;
      const item = byId.get(String(id));
      if (!item) return;
      const actions = card.querySelector('.mine-card-actions') || card.querySelector('.mine-card-body');
      if (!actions) return;
      const label = document.createElement('label');
      label.className = 'foundation-publish-toggle';
      const checked = item.publish === true || (item.publish == null && sharedIds.has(String(id)));
      label.innerHTML = `<input type="checkbox" ${checked ? 'checked' : ''}><span>GitHub共有</span>`;
      label.querySelector('input').addEventListener('change', event => {
        const next = localItems().map(lineup => String(lineup.id) === String(id) ? { ...lineup, publish:event.currentTarget.checked, updatedAt:new Date().toISOString() } : lineup);
        if (!storage()?.saveUserLineups?.(next)) {
          event.currentTarget.checked = !event.currentTarget.checked;
          alert('共有設定を保存できませんでした。');
        }
      });
      actions.appendChild(label);
    });
  };
  decorate();
  mineObserver?.disconnect();
  mineObserver = new MutationObserver(decorate);
  mineObserver.observe(grid,{childList:true,subtree:true});
}

function downloadJson(items){
  const blob = new Blob([JSON.stringify(items,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lineups.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url),0);
}

async function safeSharedExport(){
  const shared = await readShared(true);
  const local = localItems();
  const sharedMap = new Map(shared.filter(Boolean).map(item => [String(item.id || `shared-${Math.random()}`), {...item}]));
  const sharedIdsBefore = new Set(sharedMap.keys());
  let published = 0;
  let unpublished = 0;
  local.forEach(item => {
    const id = String(item.id || '');
    const wasShared = sharedIdsBefore.has(id);
    const shouldShare = item.publish === true || (item.publish == null && wasShared);
    if (item.publish === false && wasShared) {
      sharedMap.delete(id);
      unpublished += 1;
      return;
    }
    if (!shouldShare) return;
    const next = structuredClone ? structuredClone(item) : JSON.parse(JSON.stringify(item));
    next.source = 'shared';
    delete next.publish;
    sharedMap.set(id, next);
    published += 1;
  });
  const output = [...sharedMap.values()];
  const skipped = local.length - published - unpublished;
  const ok = confirm(`共有用JSONを作成します。\n\n出力: ${output.length}件\n共有するマイ定点: ${published}件\n共有しないマイ定点: ${Math.max(0, skipped)}件\n共有解除: ${unpublished}件\n\n続けますか？`);
  if (!ok) return;
  downloadJson(output);
}

function installSafeExport(){
  document.addEventListener('click', event => {
    const button = event.target.closest?.('#exportDataBtn');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    safeSharedExport().catch(error => {
      console.error(error);
      alert('共有用JSONの作成に失敗しました。');
    });
  }, true);
  const button = document.getElementById('exportDataBtn');
  if (button) {
    button.querySelector('strong')?.replaceChildren('共有用JSONを書き出す');
    button.querySelector('small')?.replaceChildren('「GitHub共有」がONのマイ定点だけ反映');
  }
}

function boot(){
  installStorageGuards();
  installVersion();
  installSettings();
  installDrawers();
  installKeyboardShortcuts();
  installAccurateLabels();
  installImportValidation();
  installSafeExport();
  installPublishToggles();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
else boot();