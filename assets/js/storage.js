(function(){
  const USER_KEY = 'lineupLab.userLineups.v1';
  const FAV_KEY = 'lineupLab.favorites.v1';
  const PREF_KEY = 'lineupLab.preferences.v1';

  function read(key, fallback){
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { console.warn('storage read failed', key, e); return fallback; }
  }
  function write(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { console.warn('storage write failed', key, e); return false; }
  }

  function clone(value){
    try { return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
    catch { return value; }
  }

  async function readSharedLineups(){
    try {
      const response = await fetch(`data/lineups.json?v=${Date.now()}`, { cache: 'no-store' });
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      const parsed = await response.json();
      const items = Array.isArray(parsed) ? parsed : parsed?.lineups;
      return Array.isArray(items) ? items : [];
    } catch (e) {
      console.warn('shared lineups read failed', e);
      return [];
    }
  }

  function normalizeShared(item){
    const next = clone(item) || {};
    next.source = next.source === 'demo' ? 'demo' : 'shared';
    return next;
  }

  function mergeSharedAndLocal(sharedItems, localItems){
    const merged = new Map();
    sharedItems.filter(Boolean).forEach(item => {
      const key = item.id || `shared-${merged.size}`;
      merged.set(key, normalizeShared(item));
    });
    localItems.filter(Boolean).forEach(item => {
      const key = item.id || `local-${Date.now()}-${merged.size}`;
      merged.set(key, normalizeShared(item));
    });
    return Array.from(merged.values());
  }

  function downloadJson(items){
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lineups.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  window.LineupStorage = {
    getUserLineups(){ return read(USER_KEY, []); },
    saveUserLineups(items){ return write(USER_KEY, items); },
    getFavorites(){ return new Set(read(FAV_KEY, [])); },
    saveFavorites(set){ return write(FAV_KEY, Array.from(set)); },
    getPreferences(){ return read(PREF_KEY, {}); },
    savePreferences(prefs){ return write(PREF_KEY, prefs); },
    clearUserLineups(){ localStorage.removeItem(USER_KEY); },
    keys:{USER_KEY,FAV_KEY,PREF_KEY}
  };

  function setupSharedExport(){
    const button = document.getElementById('exportDataBtn');
    if(!button || button.dataset.sharedExportReady === '1') return;
    button.dataset.sharedExportReady = '1';

    const title = button.querySelector('strong');
    const description = button.querySelector('small');
    if(title) title.textContent = '共有用JSONを書き出す';
    if(description) description.textContent = 'GitHubの data/lineups.json にそのまま置き換え';

    const note = document.querySelector('#dataModal .modal-note');
    if(note){
      note.textContent = '共有用JSONには、現在GitHubにある定点とこのブラウザのマイ定点をまとめます。GitHubへ反映後、同じ定点が二重表示される場合は反映を確認してからマイ定点を削除してください。';
    }

    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const previousDisabled = button.disabled;
      button.disabled = true;
      const previousTitle = title?.textContent || '';
      if(title) title.textContent = '共有データを作成中…';

      const sharedItems = await readSharedLineups();
      const localItems = window.LineupStorage.getUserLineups();
      const merged = mergeSharedAndLocal(sharedItems, localItems);
      downloadJson(merged);

      if(title) title.textContent = `${merged.length}件の lineups.json を保存しました`;
      setTimeout(() => {
        if(title) title.textContent = previousTitle;
        button.disabled = previousDisabled;
      }, 1800);
    }, true);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupSharedExport);
  else setupSharedExport();
})();
