(() => {
  'use strict';

  if (document.getElementById('lineupPremiumUI')) return;
  document.documentElement.classList.add('lineuplab-premium');

  const style = document.createElement('style');
  style.id = 'lineupPremiumUI';
  style.textContent = String.raw`
:root{
  --bg:#05080c!important;
  --bg2:#090e14!important;
  --panel:#0d141b!important;
  --panel2:#111b24!important;
  --panel3:#16222c!important;
  --line:#26343e!important;
  --text:#f2f5f6!important;
  --muted:#9aa8af!important;
  --faint:#63737c!important;
  --red:#ff4655!important;
  --red2:#d93847!important;
  --cyan:#65d7da!important;
  --green:#78d4a5!important;
  --gold:#e5bd73!important;
  --shadow:0 30px 90px rgba(0,0,0,.42)!important;
  --radius:14px!important;
  --radius2:10px!important;
  --premium-hairline:rgba(255,255,255,.065);
  --premium-soft:rgba(255,255,255,.035);
  --premium-red-soft:rgba(255,70,85,.13);
}
html{background:#05080c;color-scheme:dark;scrollbar-color:#33424b #080c11}
body{
  min-width:0!important;
  background:
    radial-gradient(1100px 520px at 54% -12%,rgba(84,112,128,.15),transparent 62%),
    radial-gradient(720px 420px at 96% 32%,rgba(255,70,85,.045),transparent 68%),
    linear-gradient(180deg,#070b10 0%,#05080c 55%,#070a0e 100%)!important;
  color:#f1f4f5!important;
  font-family:Inter,"Segoe UI Variable","Segoe UI","Yu Gothic UI",system-ui,sans-serif!important;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
body::before{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:-1;opacity:.34;
  background-image:linear-gradient(rgba(255,255,255,.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.014) 1px,transparent 1px);
  background-size:48px 48px;
  mask-image:linear-gradient(to bottom,rgba(0,0,0,.7),transparent 78%);
}
::selection{background:rgba(255,70,85,.34);color:#fff}
*{scrollbar-width:thin;scrollbar-color:#34434d transparent}
*::-webkit-scrollbar{width:8px;height:8px}*::-webkit-scrollbar-thumb{background:#34434d;border-radius:99px;border:2px solid transparent;background-clip:padding-box}
button,input,select,textarea{letter-spacing:.005em}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[tabindex]:focus-visible{outline:2px solid rgba(255,70,85,.72)!important;outline-offset:2px}

.app-shell{grid-template-columns:76px minmax(0,1fr)!important;min-height:100dvh!important}
.rail{
  width:76px!important;padding:18px 0 16px!important;
  background:linear-gradient(180deg,rgba(8,12,17,.985),rgba(5,8,12,.985))!important;
  border-right:1px solid rgba(255,255,255,.065)!important;
  box-shadow:18px 0 55px rgba(0,0,0,.16)!important;
}
.rail::after{content:"";position:absolute;right:-1px;top:0;width:1px;height:145px;background:linear-gradient(var(--red),transparent);opacity:.5}
.brand-mark{
  width:46px!important;height:46px!important;
  background:linear-gradient(145deg,#ff5563,#e83746)!important;
  box-shadow:0 12px 30px rgba(255,70,85,.22),inset 0 1px rgba(255,255,255,.22)!important;
  font-size:13px!important;letter-spacing:-.04em!important;
}
.rail-nav{margin-top:34px!important;gap:12px!important}
.rail-btn{
  width:46px!important;height:46px!important;border-radius:11px!important;
  border:1px solid transparent!important;
  transition:background .18s ease,border-color .18s ease,transform .18s ease,box-shadow .18s ease!important;
}
.rail-btn svg{width:19px!important;height:19px!important;fill:#66747c!important;transition:fill .18s ease!important}
.rail-btn:hover{transform:translateY(-1px)!important;background:rgba(255,255,255,.05)!important;border-color:rgba(255,255,255,.07)!important}
.rail-btn.active{
  background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.035))!important;
  border-color:rgba(255,255,255,.09)!important;
  box-shadow:inset 2px 0 0 var(--red),0 8px 22px rgba(0,0,0,.18)!important;
}
.rail-btn.active svg,.rail-btn:hover svg{fill:#f4f6f7!important}

.topbar{
  height:86px!important;padding:0 32px!important;
  background:linear-gradient(180deg,rgba(7,11,16,.94),rgba(7,11,16,.84))!important;
  border-bottom:1px solid rgba(255,255,255,.065)!important;
  box-shadow:0 14px 45px rgba(0,0,0,.16)!important;
  backdrop-filter:blur(24px) saturate(1.12)!important;
}
.title-stack{gap:5px!important}.eyebrow,.section-kicker{font-size:10px!important;font-weight:800!important;letter-spacing:.18em!important;color:#70818a!important}
.title-stack h1{font-size:23px!important;font-weight:760!important;letter-spacing:-.035em!important;line-height:1.05!important}
.top-tabs{
  gap:2px!important;padding:4px!important;border-radius:11px!important;
  background:rgba(255,255,255,.025)!important;border:1px solid rgba(255,255,255,.075)!important;
  box-shadow:inset 0 1px rgba(255,255,255,.02)!important;
}
.top-tab{padding:9px 14px!important;border-radius:8px!important;font-size:11px!important;font-weight:720!important;color:#77868e!important;transition:.18s ease!important}
.top-tab:hover{color:#dce2e5!important;background:rgba(255,255,255,.04)!important}
.top-tab.active{
  color:#fff!important;background:linear-gradient(180deg,#1a242c,#121b22)!important;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.07),0 6px 16px rgba(0,0,0,.18)!important;
  position:relative!important;
}
.top-tab.active::after{content:"";position:absolute;left:22%;right:22%;bottom:-5px;height:2px;background:var(--red);box-shadow:0 0 12px rgba(255,70,85,.55)}
.top-actions{gap:12px!important}
.connection-pill{
  min-height:36px!important;padding:8px 12px!important;border-radius:9px!important;
  background:rgba(255,255,255,.025)!important;border:1px solid rgba(255,255,255,.075)!important;
  color:#92a1a8!important;font-size:10.5px!important;
}
.status-dot{width:6px!important;height:6px!important;box-shadow:0 0 10px currentColor!important}

.btn{
  min-height:38px;border-radius:8px!important;padding:9px 14px!important;
  border:1px solid rgba(255,255,255,.09)!important;
  background:linear-gradient(180deg,#172129,#111920)!important;
  color:#eef2f4!important;font-size:11px!important;font-weight:760!important;
  box-shadow:inset 0 1px rgba(255,255,255,.03),0 6px 16px rgba(0,0,0,.11)!important;
  transition:transform .16s ease,border-color .16s ease,background .16s ease,box-shadow .16s ease!important;
}
.btn:hover{transform:translateY(-1px)!important;border-color:rgba(255,255,255,.18)!important;background:linear-gradient(180deg,#1d2932,#151f27)!important;box-shadow:0 9px 22px rgba(0,0,0,.2)!important}
.btn:active{transform:translateY(0)!important}
.btn.primary{
  background:linear-gradient(180deg,#ff5260,#e83b49)!important;border-color:#ff5d69!important;
  box-shadow:0 12px 26px rgba(255,70,85,.19),inset 0 1px rgba(255,255,255,.22)!important;
  text-shadow:0 1px 0 rgba(0,0,0,.15)!important;
}
.btn.primary:hover{background:linear-gradient(180deg,#ff6470,#ef4654)!important;box-shadow:0 14px 30px rgba(255,70,85,.26)!important}
.btn.ghost{background:rgba(255,255,255,.025)!important}
.btn.small{min-height:32px!important;padding:6px 10px!important;font-size:10px!important}
.btn.compact{min-height:36px!important;font-size:11px!important}

.tab-panel{padding:24px 26px 38px!important}
.panel-card{
  position:relative!important;
  background:linear-gradient(180deg,rgba(16,23,30,.985),rgba(10,16,22,.985))!important;
  border:1px solid rgba(255,255,255,.07)!important;
  border-radius:14px!important;
  box-shadow:0 22px 58px rgba(0,0,0,.20),inset 0 1px rgba(255,255,255,.024)!important;
}
.panel-card::before{content:"";position:absolute;left:18px;right:18px;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.10),transparent);pointer-events:none}
.panel-heading{margin-bottom:18px!important}.panel-heading h2,.lineup-list-head h2{font-size:18px!important;font-weight:740!important;letter-spacing:-.025em!important}
.text-btn,.mini-link{color:#71818a!important;font-size:10px!important;font-weight:700!important}.text-btn:hover,.mini-link:hover{color:#f3f5f6!important}

.library-layout{grid-template-columns:282px minmax(610px,1fr) 372px!important;gap:18px!important}
.filter-panel{top:108px!important;padding:20px!important;max-height:calc(100dvh - 126px)!important}
.filter-block{padding:18px 0!important;border-bottom:1px solid rgba(255,255,255,.055)!important}
.filter-label-row{font-size:11px!important;color:#d3dadd!important;margin-bottom:11px!important}.muted-mini{color:#687881!important;font-size:9.5px!important}
.search-field{
  height:44px!important;border-radius:9px!important;padding:0 12px!important;
  border:1px solid rgba(255,255,255,.075)!important;background:#090f15!important;
  box-shadow:inset 0 1px 4px rgba(0,0,0,.2)!important;
}
.search-field:focus-within{border-color:rgba(255,255,255,.20)!important;box-shadow:0 0 0 3px rgba(255,255,255,.035),inset 0 1px 4px rgba(0,0,0,.22)!important}
.search-field svg{fill:#687982!important}.search-field input{font-size:11.5px!important}.search-field input::placeholder{color:#4e5d65!important}

.map-strip{gap:7px!important}.map-option{
  height:62px!important;border-radius:9px!important;border:1px solid rgba(255,255,255,.075)!important;background:#080d12!important;
  box-shadow:0 5px 14px rgba(0,0,0,.12)!important;transition:.18s ease!important;
}
.map-option img{opacity:.58!important;filter:saturate(.58) contrast(1.08)!important;transition:.18s ease!important}.map-option::after{background:linear-gradient(180deg,rgba(4,7,10,.03),rgba(4,7,10,.93))!important}
.map-option span{font-size:9px!important;font-weight:800!important;letter-spacing:.055em!important;bottom:7px!important;left:7px!important}
.map-option:hover{transform:translateY(-1px)!important;border-color:rgba(255,255,255,.16)!important}.map-option:hover img{opacity:.76!important}
.map-option.active{border-color:rgba(255,70,85,.78)!important;box-shadow:inset 0 -2px 0 var(--red),0 8px 20px rgba(0,0,0,.18)!important}.map-option.active img{opacity:.9!important;filter:saturate(.85) contrast(1.06)!important}
.agent-grid{gap:7px!important}.agent-option{border-radius:9px!important;border-color:rgba(255,255,255,.07)!important;background:#090f15!important;transition:.18s ease!important}.agent-option img{opacity:.68!important;filter:saturate(.64) contrast(1.03)!important;transition:.18s ease!important}.agent-option:hover{transform:translateY(-1px)!important;border-color:rgba(255,255,255,.16)!important}.agent-option:hover img{opacity:.88!important;filter:saturate(.9)!important}.agent-option.active{border-color:rgba(255,70,85,.72)!important;background:#171d22!important;box-shadow:inset 0 -2px 0 var(--red),0 6px 14px rgba(0,0,0,.16)!important}.agent-option.active img{opacity:1!important;filter:none!important}
.ability-row{gap:7px!important}.ability-filter-btn{height:45px!important;border-radius:9px!important;border-color:rgba(255,255,255,.07)!important;background:#090f15!important;transition:.16s ease!important}.ability-filter-btn:hover{border-color:rgba(255,255,255,.15)!important;background:#101820!important}.ability-filter-btn.active{border-color:rgba(255,70,85,.62)!important;background:rgba(255,70,85,.085)!important;box-shadow:inset 0 -2px 0 rgba(255,70,85,.75)!important}.ability-filter-btn span{font-size:8.5px!important}
.filter-caption{font-size:9px!important;color:#677780!important}.segmented{border-color:rgba(255,255,255,.075)!important;border-radius:9px!important;background:#090f15!important}.segmented button{min-height:34px!important;background:transparent!important;border-color:rgba(255,255,255,.055)!important;color:#71818a!important;font-size:10px!important;font-weight:700!important}.segmented button:hover{background:rgba(255,255,255,.035)!important;color:#d8dfe2!important}.segmented button.active{background:linear-gradient(180deg,#1c272f,#141d24)!important;color:#fff!important;box-shadow:inset 0 -2px 0 var(--red)!important}
.select-control{
  min-height:40px!important;border-radius:9px!important;border:1px solid rgba(255,255,255,.08)!important;
  background:#090f15!important;color:#e1e6e8!important;font-size:10.5px!important;padding:8px 11px!important;
}
.select-control:focus{border-color:rgba(255,255,255,.20)!important;box-shadow:0 0 0 3px rgba(255,255,255,.03)!important}.select-control.full{height:42px!important}
.check-row{font-size:10.5px!important;color:#9aa8ae!important}.custom-check{width:17px!important;height:17px!important;border-color:#3a4850!important;border-radius:4px!important;background:#080e13!important}

.slim-card{padding:11px 13px!important;border-radius:11px!important}.map-toolbar{margin-bottom:11px!important}.map-chip{
  padding:7px 10px!important;background:linear-gradient(180deg,#ff5361,#e33a48)!important;
  font-size:9px!important;letter-spacing:.12em!important;box-shadow:0 8px 18px rgba(255,70,85,.16)!important;
}
.map-title-wrap strong{font-size:13.5px!important;font-weight:760!important}.map-title-wrap div span{font-size:9.5px!important;color:#71818a!important}
.icon-action{width:36px!important;height:36px!important;border-radius:8px!important;border-color:rgba(255,255,255,.075)!important;background:#090f15!important;transition:.16s ease!important}.icon-action:hover{border-color:rgba(255,255,255,.16)!important;background:#121a21!important}.icon-action.active{border-color:rgba(255,255,255,.14)!important;background:#17222a!important;box-shadow:inset 0 -2px 0 rgba(255,70,85,.65)!important}
.map-stage{
  min-height:530px!important;
  background:linear-gradient(180deg,#090e13,#070b0f)!important;
  border-color:rgba(255,255,255,.08)!important;
  box-shadow:0 28px 70px rgba(0,0,0,.28),inset 0 0 80px rgba(0,0,0,.16)!important;
}
.map-stage::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 46%,transparent 30%,rgba(3,5,8,.15) 62%,rgba(3,5,8,.5) 100%);z-index:0}
.map-backdrop{z-index:0!important;background:radial-gradient(circle at 50% 48%,rgba(76,100,113,.14),transparent 48%),linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px)!important;background-size:auto,32px 32px,32px 32px!important}
.map-image{z-index:1!important;opacity:.70!important;filter:grayscale(.18) saturate(.72) contrast(1.15) brightness(.86)!important}.route-layer,.pin-layer{z-index:2!important}.map-legend,.map-empty{z-index:4!important}
.route-path{stroke:rgba(218,226,230,.34)!important;stroke-width:3.5!important;stroke-dasharray:5 8!important;filter:drop-shadow(0 1px 4px rgba(0,0,0,.65))!important}.route-path.selected{stroke:#ff5361!important;stroke-width:4.5!important;stroke-dasharray:none!important;filter:drop-shadow(0 0 8px rgba(255,70,85,.28))!important}
.pin.start{width:27px!important;height:27px!important;background:#f2f5f6!important;border:4px solid #0b1116!important;box-shadow:0 0 0 1px rgba(255,255,255,.22),0 8px 22px rgba(0,0,0,.42)!important}.pin.end{width:32px!important;height:32px!important;border-radius:7px!important;background:linear-gradient(145deg,#ff5966,#e33b49)!important;border:3px solid #090d11!important;box-shadow:0 0 0 1px rgba(255,255,255,.08),0 9px 24px rgba(255,70,85,.19)!important}.pin.selected{box-shadow:0 0 0 4px rgba(255,70,85,.14),0 9px 28px rgba(0,0,0,.48)!important}
.map-legend{left:16px!important;bottom:14px!important;padding:8px 10px!important;border-radius:8px!important;background:rgba(6,10,14,.82)!important;border-color:rgba(255,255,255,.075)!important;color:#819098!important;font-size:9px!important;box-shadow:0 8px 20px rgba(0,0,0,.16)!important}

.lineup-list-head{padding:24px 2px 11px!important}.lineup-card-grid{gap:11px!important}
.lineup-card{
  min-height:82px!important;padding:13px!important;grid-template-columns:58px 1fr auto!important;gap:12px!important;
  background:linear-gradient(145deg,rgba(16,23,30,.96),rgba(9,15,20,.98))!important;
  border:1px solid rgba(255,255,255,.065)!important;border-radius:11px!important;
  box-shadow:0 9px 24px rgba(0,0,0,.12)!important;transition:.18s ease!important;
}
.lineup-card:hover{transform:translateY(-2px)!important;border-color:rgba(255,255,255,.14)!important;box-shadow:0 16px 30px rgba(0,0,0,.20)!important}.lineup-card.active{border-color:rgba(255,70,85,.28)!important;box-shadow:inset 2px 0 0 var(--red),0 14px 32px rgba(0,0,0,.19)!important;background:linear-gradient(145deg,rgba(24,28,34,.98),rgba(12,17,22,.98))!important}
.agent-avatar{width:58px!important;height:58px!important;border-radius:9px!important;border:1px solid rgba(255,255,255,.10)!important;background:linear-gradient(145deg,#27333c,#111920)!important;box-shadow:0 8px 18px rgba(0,0,0,.16)!important}.agent-avatar img{filter:saturate(.9) contrast(1.03)!important}
.lineup-card h3{font-size:13px!important;font-weight:740!important;letter-spacing:-.01em!important;margin-bottom:7px!important}.lineup-meta{gap:6px!important}
.tag-pill{font-size:9px!important;font-weight:700!important;letter-spacing:.02em!important;color:#87969d!important;border:1px solid rgba(255,255,255,.075)!important;background:rgba(255,255,255,.025)!important;border-radius:5px!important;padding:4px 6px!important}.tag-pill.attack{color:#f3a6ad!important;border-color:rgba(255,93,108,.24)!important;background:rgba(255,70,85,.055)!important}.tag-pill.defense{color:#8bd4d6!important;border-color:rgba(101,215,218,.21)!important;background:rgba(101,215,218,.045)!important}.fav-btn{color:#46545c!important;transition:.16s ease!important}.fav-btn:hover{color:#b5c0c5!important;transform:scale(1.05)!important}.fav-btn.on{color:#e8bf6f!important;text-shadow:0 0 13px rgba(232,191,111,.2)!important}

.detail-panel{top:108px!important;max-height:calc(100dvh - 126px)!important;overflow:auto!important;border-radius:14px!important}.detail-content{min-height:650px!important}
.detail-empty{color:#718087!important}.detail-empty .scope{border-color:#2c3941!important;box-shadow:inset 0 0 30px rgba(255,255,255,.02)!important}.detail-empty strong{font-size:13px!important;color:#b4bec2!important}.detail-empty span{font-size:10px!important;color:#66757d!important}
.detail-hero{height:205px!important;border-radius:13px 13px 0 0!important;background:radial-gradient(circle at 69% 34%,#394650 0,#1a232a 44%,#0a1015 78%)!important;border-bottom:1px solid rgba(255,255,255,.06)!important}.detail-agent-full{right:-4%!important;bottom:-18%!important;width:74%!important;max-height:245px!important;filter:drop-shadow(0 22px 26px rgba(0,0,0,.42)) saturate(.86)!important}.detail-gradient{background:linear-gradient(90deg,rgba(8,13,17,.98) 0%,rgba(8,13,17,.76) 40%,rgba(8,13,17,.13) 78%,transparent)!important}.detail-hero-text{left:20px!important;bottom:20px!important;max-width:72%!important}.detail-agent-name{font-size:9px!important;color:#98a6ad!important;letter-spacing:.18em!important}.detail-hero h2{font-size:19px!important;font-weight:770!important;line-height:1.16!important;margin:6px 0 0!important;letter-spacing:-.025em!important}.detail-body{padding:18px 19px 20px!important}.detail-badges{gap:6px!important;margin-bottom:16px!important}.detail-section{padding:17px 0!important;border-top:1px solid rgba(255,255,255,.055)!important}.detail-section-title{font-size:9px!important;letter-spacing:.17em!important;color:#6d7c84!important;margin-bottom:10px!important}.route-summary{gap:10px!important}.route-place{padding:11px!important;background:#080e13!important;border:1px solid rgba(255,255,255,.07)!important;border-radius:8px!important;box-shadow:inset 0 1px rgba(255,255,255,.02)!important}.route-place small{font-size:8px!important;letter-spacing:.1em!important;color:#62717a!important}.route-place strong{font-size:10.5px!important;color:#e5eaec!important}.route-arrow{font-size:9px!important;color:#56656d!important}.detail-note{font-size:11.5px!important;line-height:1.75!important;color:#adb8bd!important}.media-thumbs{gap:7px!important}.media-thumb{border-radius:8px!important;border-color:rgba(255,255,255,.07)!important;background:#080d12!important;color:#65757d!important;font-size:8.5px!important;box-shadow:0 6px 16px rgba(0,0,0,.10)!important}.media-thumb img{transition:transform .22s ease,filter .22s ease!important;filter:saturate(.84)!important}.media-thumb:hover img{transform:scale(1.025)!important;filter:saturate(1)!important}.video-link{min-height:38px!important;margin-top:9px!important;border-radius:8px!important;border-color:rgba(255,255,255,.09)!important;background:linear-gradient(180deg,#151f26,#10171d)!important;font-size:10px!important;font-weight:720!important}.video-embed,.detail-mp4{border-radius:9px!important;border-color:rgba(255,255,255,.08)!important;box-shadow:0 12px 32px rgba(0,0,0,.22)!important}.detail-actions{gap:9px!important}.detail-demo-note{font-size:9px!important;border-radius:7px!important}

.create-grid{grid-template-columns:420px minmax(620px,1fr)!important;gap:18px!important}.creator-panel{padding:21px!important}.creator-heading{margin-bottom:6px!important}.draft-badge{font-size:9px!important;font-weight:760!important;border-radius:6px!important;padding:5px 8px!important;color:#dabf8b!important;border-color:rgba(229,189,115,.24)!important;background:rgba(229,189,115,.06)!important}
.form-section{padding:19px 0!important;border-top:1px solid rgba(255,255,255,.055)!important}.form-section-title{gap:9px!important;margin-bottom:14px!important}.form-section-title span{width:24px!important;height:24px!important;border-radius:6px!important;border-color:rgba(255,255,255,.11)!important;background:rgba(255,255,255,.025)!important;color:#84939a!important;font-size:8px!important}.form-section-title strong{font-size:11px!important;color:#e2e7e9!important}.field-label{font-size:9.5px!important;color:#819097!important;margin-bottom:11px!important}.field-label input,.field-label textarea{margin-top:7px!important;border-radius:8px!important;border:1px solid rgba(255,255,255,.08)!important;background:#080e13!important;color:#edf1f2!important;padding:11px 12px!important;font-size:11px!important;box-shadow:inset 0 1px 4px rgba(0,0,0,.20)!important}.field-label input:focus,.field-label textarea:focus{border-color:rgba(255,255,255,.20)!important;box-shadow:0 0 0 3px rgba(255,255,255,.03),inset 0 1px 4px rgba(0,0,0,.20)!important}.form-two{gap:9px!important}.form-help{font-size:9.5px!important;color:#6e7d85!important;line-height:1.6!important}.route-mode-grid{gap:7px!important}.route-mode{min-height:66px!important;padding:9px 8px!important;border-radius:8px!important;border-color:rgba(255,255,255,.075)!important;background:#080e13!important;transition:.16s ease!important}.route-mode:hover{border-color:rgba(255,255,255,.15)!important;background:#10171d!important}.route-mode.active{border-color:rgba(255,70,85,.28)!important;background:rgba(255,70,85,.055)!important;box-shadow:inset 0 -2px 0 var(--red)!important}.route-mode span{font-size:9.5px!important}.route-mode small{font-size:8px!important;color:#65747c!important}.inline-actions{gap:7px!important;margin-top:9px!important}
.upload-grid{gap:8px!important;margin-bottom:12px!important}.upload-box{border-radius:9px!important;border:1px dashed rgba(255,255,255,.13)!important;background:linear-gradient(180deg,#0a1015,#070c10)!important;transition:.17s ease!important}.upload-box:hover{border-color:rgba(255,255,255,.27)!important;background:#0d141a!important}.upload-box.paste-target{border-color:rgba(255,70,85,.56)!important;box-shadow:inset 0 0 0 1px rgba(255,70,85,.12),0 0 0 3px rgba(255,70,85,.035)!important}.upload-box strong{font-size:9px!important}.upload-box small{font-size:8px!important;color:#697880!important}.upload-plus{width:25px!important;height:25px!important;border-color:rgba(255,255,255,.14)!important;color:#8a989e!important}.upload-box.has-image::after{font-size:8px!important;padding:4px 6px!important;background:rgba(5,8,11,.88)!important;border:1px solid rgba(255,255,255,.08)!important}.creator-footer{padding-top:17px!important;border-top-color:rgba(255,255,255,.055)!important;gap:9px!important}.creator-map-panel{top:108px!important}.creator-top{margin-bottom:11px!important}.creator-agent-preview{gap:11px!important}.agent-avatar.xl{width:50px!important;height:50px!important}.creator-agent-preview strong{font-size:13px!important}.creator-agent-preview small{font-size:9.5px!important;color:#74838a!important}.creator-progress span{font-size:9px!important}.creator-progress>div{height:5px!important;background:#151f26!important}.creator-progress i{background:linear-gradient(90deg,#e83b49,#ff5966)!important}.creator-map{min-height:590px!important}.creator-map .map-image{opacity:.73!important}.creator-pin{width:30px!important;height:30px!important;border-color:#090e12!important;box-shadow:0 8px 22px rgba(0,0,0,.40)!important}.creator-pin.end{background:linear-gradient(145deg,#ff5966,#e43a48)!important}.creator-map-tip{top:16px!important;padding:9px 14px!important;border-radius:8px!important;background:rgba(5,9,13,.82)!important;border-color:rgba(255,255,255,.09)!important;box-shadow:0 10px 24px rgba(0,0,0,.18)!important}.creator-map-tip strong{font-size:9.5px!important}.creator-map-tip span{font-size:8px!important}.creator-help{margin-top:11px!important;padding:13px!important}.creator-help strong{font-size:10.5px!important}.creator-help p{font-size:9.5px!important;color:#728188!important}

.mp4-box{border-radius:9px!important;border:1px solid rgba(255,255,255,.075)!important;background:#080e13!important;padding:12px!important;box-shadow:inset 0 1px rgba(255,255,255,.018)!important}.mp4-head strong{font-size:10.5px!important}.mp4-head small,.mp4-share-note{font-size:8.5px!important}.mp4-meta{font-size:9.5px!important}.mp4-preview{border-radius:8px!important;border-color:rgba(255,255,255,.08)!important}.compress-card{border-top-color:rgba(255,255,255,.06)!important;padding-top:12px!important}.compress-badge{border-radius:4px!important;box-shadow:0 5px 13px rgba(255,70,85,.15)!important}.compress-progress{height:5px!important;border-color:rgba(255,255,255,.06)!important;background:#10171d!important}.compress-status,.compress-result{font-size:9px!important}.compress-result{border-radius:7px!important}

.mine-wrap{max-width:1320px!important}.mine-hero{padding:30px!important;border-radius:14px!important;background:linear-gradient(118deg,#151e25 0%,#0c1319 58%,rgba(255,70,85,.075) 100%)!important;overflow:hidden!important}.mine-hero::after{content:"";position:absolute;right:-70px;top:-120px;width:280px;height:280px;border:1px solid rgba(255,255,255,.035);transform:rotate(35deg);pointer-events:none}.mine-hero h2{font-size:27px!important;font-weight:760!important;letter-spacing:-.035em!important}.mine-hero p{font-size:11px!important;color:#8a989f!important;line-height:1.6!important}.mine-toolbar{margin:18px 0 11px!important}.mine-count{font-size:10px!important;color:#77868d!important}.mine-grid{gap:14px!important}.mine-card{border-radius:12px!important;border:1px solid rgba(255,255,255,.065)!important;background:linear-gradient(180deg,#10171d,#090f14)!important;box-shadow:0 16px 38px rgba(0,0,0,.15)!important;transition:.18s ease!important}.mine-card:hover{transform:translateY(-2px)!important;border-color:rgba(255,255,255,.13)!important;box-shadow:0 22px 42px rgba(0,0,0,.22)!important}.mine-card-visual{height:165px!important;background:radial-gradient(circle at 50% 52%,#151f26,#080d12 68%)!important;border-bottom:1px solid rgba(255,255,255,.055)!important}.mine-card-visual img.map-bg{opacity:.54!important;filter:grayscale(.18) contrast(1.05)!important}.mine-card-agent{width:130px!important;height:160px!important;right:2px!important;bottom:-12px!important;filter:drop-shadow(0 16px 18px rgba(0,0,0,.46)) saturate(.9)!important}.mine-card-body{padding:15px!important}.mine-card-body h3{font-size:13px!important;font-weight:740!important;margin:9px 0 10px!important}.mine-card-actions{gap:7px!important;margin-top:14px!important}.danger-btn{border-color:rgba(255,88,104,.20)!important;color:#dc8189!important;background:rgba(255,70,85,.045)!important}

.modal-backdrop{background:rgba(2,4,7,.78)!important;backdrop-filter:blur(12px)!important}.modal-card{width:450px!important;border-radius:14px!important;background:linear-gradient(180deg,#111820,#0a1015)!important;border:1px solid rgba(255,255,255,.09)!important;box-shadow:0 35px 100px rgba(0,0,0,.55)!important}.modal-head{padding:20px!important;border-bottom-color:rgba(255,255,255,.06)!important}.modal-head h2{font-size:19px!important}.modal-close{border-radius:8px!important;border-color:rgba(255,255,255,.08)!important;background:#080e13!important;color:#87959b!important}.modal-body{padding:16px!important}.data-stat{padding:15px!important;border-radius:9px!important;border-color:rgba(255,255,255,.07)!important;background:#080e13!important}.data-stat span{font-size:10px!important}.data-stat strong{font-size:30px!important;font-weight:720!important}.data-action{padding:13px!important;border-radius:9px!important;border-color:rgba(255,255,255,.075)!important;background:#0d151b!important;transition:.16s ease!important}.data-action:hover{border-color:rgba(255,255,255,.16)!important;background:#121b22!important}.data-icon{border-radius:7px!important;border-color:rgba(255,255,255,.11)!important}.data-action strong{font-size:11px!important}.data-action small{font-size:9px!important;color:#718088!important}.modal-note{font-size:9px!important;color:#66757d!important;padding:0 20px 20px!important}
.toast-stack{right:20px!important;bottom:20px!important}.toast{min-width:280px!important;padding:12px 14px!important;border-radius:9px!important;background:rgba(15,23,29,.96)!important;border:1px solid rgba(255,255,255,.10)!important;box-shadow:0 20px 48px rgba(0,0,0,.38)!important;font-size:10.5px!important;backdrop-filter:blur(12px)!important}.toast.success{border-color:rgba(120,212,165,.22)!important;background:rgba(13,31,24,.96)!important}.toast.error{border-color:rgba(255,92,106,.23)!important;background:rgba(36,15,20,.96)!important}
.empty-grid-state{border-radius:11px!important;border-color:rgba(255,255,255,.10)!important;background:rgba(255,255,255,.012)!important;padding:46px!important}.empty-grid-state strong{font-size:13px!important;color:#aab5ba!important}.empty-grid-state span{font-size:9.5px!important;color:#687780!important}

@media(max-width:1550px){
  .library-layout{grid-template-columns:258px minmax(560px,1fr) 338px!important;gap:15px!important}
  .create-grid{grid-template-columns:390px minmax(560px,1fr)!important}
  .detail-hero{height:185px!important}
}
@media(max-width:1280px){
  .app-shell{grid-template-columns:68px minmax(0,1fr)!important}.rail{width:68px!important}
  .topbar{padding:0 22px!important}.tab-panel{padding:20px!important}
  .library-layout{grid-template-columns:246px minmax(500px,1fr)!important}.detail-panel{grid-column:2!important;position:relative!important;top:auto!important;max-height:none!important}.filter-panel{grid-row:1/3!important}
  .create-grid{grid-template-columns:360px minmax(520px,1fr)!important}.lineup-card-grid{grid-template-columns:1fr!important}
}
@media(max-width:1020px){
  .app-shell{grid-template-columns:60px minmax(0,1fr)!important}.rail{width:60px!important}.brand-mark{width:42px!important;height:42px!important}.rail-btn{width:42px!important;height:42px!important}
  .topbar{height:78px!important;padding:0 18px!important}.title-stack h1{font-size:20px!important}.top-tabs{display:none!important}.tab-panel{padding:16px!important}
  .library-layout{grid-template-columns:1fr!important}.filter-panel{position:relative!important;top:auto!important;max-height:none!important;grid-row:auto!important}.detail-panel{grid-column:auto!important}.map-strip{grid-template-columns:repeat(5,1fr)!important}.agent-grid{grid-template-columns:repeat(8,1fr)!important}
  .create-grid{grid-template-columns:1fr!important}.creator-map-panel{position:relative!important;top:auto!important;order:1}.creator-panel{order:2}.creator-map{min-height:510px!important}.mine-grid{grid-template-columns:repeat(2,1fr)!important}
}
@media(max-width:720px){
  .app-shell{display:block!important}.rail{width:100%!important;height:58px!important;position:sticky!important;top:0!important;flex-direction:row!important;justify-content:space-between!important;padding:7px 12px!important;border-right:0!important;border-bottom:1px solid rgba(255,255,255,.065)!important}.rail-nav{margin:0!important;display:flex!important;gap:6px!important}.rail-bottom{margin:0!important}.topbar{top:58px!important}.top-actions .btn{display:none!important}.connection-pill{display:none!important}.title-stack h1{font-size:18px!important}
  .map-strip{grid-template-columns:repeat(3,1fr)!important}.agent-grid{grid-template-columns:repeat(6,1fr)!important}.lineup-card-grid,.mine-grid{grid-template-columns:1fr!important}.form-two{grid-template-columns:1fr!important}.creator-map{min-height:420px!important}.mine-hero{padding:22px!important;align-items:flex-start!important;gap:16px!important}.mine-hero h2{font-size:22px!important}.upload-grid{gap:6px!important}.detail-hero{height:180px!important}
}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
`;
  document.head.appendChild(style);
})();
