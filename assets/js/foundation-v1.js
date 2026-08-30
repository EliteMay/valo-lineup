import './media-store.js?v=1.1.0';
import './foundation-core-v1.js?v=1.1.0';

document.documentElement.dataset.lineupLabVersion = 'v1.1.0';

function installFallbackStorageGuard(){
  const api = window.LineupStorage;
  if (!api || api.__fallbackImageGuard) return;
  const original = api.saveUserLineups?.bind(api);
  if (!original) return;
  api.saveUserLineups = function(items){
    if (!window.LineupMediaStore?.isEnabled?.()) {
      let bytes = 0;
      try { bytes = new Blob([JSON.stringify(items)]).size; } catch {}
      if (bytes > 4 * 1024 * 1024) {
        console.warn('Lineup Lab: fallback localStorage limit reached');
        return false;
      }
    }
    return original(items);
  };
  api.__fallbackImageGuard = true;
}

function applyVersion(){
  document.documentElement.dataset.lineupLabVersion = 'v1.1.0';
  const chip = document.querySelector('.foundation-version');
  if (chip) chip.textContent = 'Lineup Lab v1.1.0';
}

installFallbackStorageGuard();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyVersion, {once:true});
else applyVersion();