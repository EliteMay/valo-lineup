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
})();
