import './media-store.js?v=1.1.0';
import './foundation-core-v1.js?v=1.1.0';

document.documentElement.dataset.lineupLabVersion = 'v1.1.0';

function applyVersion(){
  document.documentElement.dataset.lineupLabVersion = 'v1.1.0';
  const chip = document.querySelector('.foundation-version');
  if (chip) chip.textContent = 'Lineup Lab v1.1.0';
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyVersion, {once:true});
else applyVersion();