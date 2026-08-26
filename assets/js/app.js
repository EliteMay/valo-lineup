(() => {
  'use strict';

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `ll-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const fallbackAssets = {
    maps: ['Ascent','Bind','Haven','Split','Icebox','Breeze','Lotus','Sunset','Abyss','Pearl','Fracture','Corrode','Summit'].map(displayName => ({displayName, displayIcon:'', splash:''})),
    agents: [
      ['Sova',['Shock Bolt','Recon Bolt','Owl Drone','Hunter’s Fury']],
      ['Viper',['Snake Bite','Poison Cloud','Toxic Screen','Viper’s Pit']],
      ['Brimstone',['Incendiary','Sky Smoke','Stim Beacon','Orbital Strike']],
      ['KAY/O',['FRAG/ment','FLASH/drive','ZERO/POINT','NULL/cmd']],
      ['Fade',['Seize','Haunt','Prowler','Nightfall']],
      ['Gekko',['Wingman','Dizzy','Mosh Pit','Thrash']],
      ['Raze',['Blast Pack','Paint Shells','Boom Bot','Showstopper']],
      ['Killjoy',['Nanoswarm','Alarmbot','Turret','Lockdown']],
      ['Cypher',['Cyber Cage','Spycam','Trapwire','Neural Theft']],
      ['Omen',['Paranoia','Dark Cover','Shrouded Step','From the Shadows']],
      ['Astra',['Nova Pulse','Nebula','Gravity Well','Cosmic Divide']],
      ['Harbor',['Cove','High Tide','Cascade','Reckoning']],
      ['Phoenix',['Curveball','Hot Hands','Blaze','Run it Back']],
      ['Jett',['Cloudburst','Updraft','Tailwind','Blade Storm']],
      ['Sage',['Slow Orb','Healing Orb','Barrier Orb','Resurrection']],
      ['Skye',['Guiding Light','Trailblazer','Regrowth','Seekers']],
      ['Yoru',['Blindside','Gatecrash','Fakeout','Dimensional Drift']],
      ['Breach',['Flashpoint','Fault Line','Aftershock','Rolling Thunder']],
      ['Chamber',['Headhunter','Rendezvous','Trademark','Tour De Force']],
      ['Neon',['Relay Bolt','High Gear','Fast Lane','Overdrive']],
      ['Deadlock',['Sonic Sensor','GravNet','Barrier Mesh','Annihilation']],
      ['Iso',['Undercut','Double Tap','Contingency','Kill Contract']],
      ['Clove',['Meddle','Ruse','Pick-Me-Up','Not Dead Yet']],
      ['Vyse',['Shear','Arc Rose','Razorvine','Steel Garden']],
      ['Tejo',['Special Delivery','Stealth Drone','Guided Salvo','Armageddon']],
      ['Waylay',['Saturate','Lightspeed','Refract','Convergent Paths']]
    ].map(([displayName,abilities]) => ({displayName,displayIcon:'',fullPortrait:'',abilities:abilities.map((displayName,i)=>({displayName,displayIcon:'',slot:`A${i}`}))}))
  };

  const fallbackDemo = [
    {id:'demo-ascent-sova-a',source:'demo',title:'A Main → A Default Recon（UIデモ）',map:'Ascent',agent:'Sova',ability:'Recon Bolt',side:'attack',site:'A',difficulty:'easy',start:{x:31,y:74},bounces:[{x:40,y:55}],end:{x:57,y:31},notes:'操作確認用のデモ定点です。実戦での正確な照準位置・チャージ量は自分の定点として登録してください。',tags:['demo','recon'],createdAt:'2026-08-26T00:00:00+09:00'},
    {id:'demo-ascent-kayo-b',source:'demo',title:'B Main → B Site Knife（UIデモ）',map:'Ascent',agent:'KAY/O',ability:'ZERO/POINT',side:'attack',site:'B',difficulty:'medium',start:{x:71,y:72},bounces:[],end:{x:67,y:31},notes:'操作確認用のデモ定点です。',tags:['demo','info'],createdAt:'2026-08-26T00:00:00+09:00'}
  ];

  const state = {
    assets: structuredClone(fallbackAssets),
    demos: [],
    users: LineupStorage.getUserLineups(),
    favorites: LineupStorage.getFavorites(),
    filters: { map:'Ascent', agent:null, ability:null, side:'all', difficulty:'all', search:'', favoritesOnly:false, sort:'recommended' },
    selectedId:null,
    showPaths:true,
    creator:{ editId:null, mode:'start', dragging:false, route:{start:null,bounces:[],end:null}, images:{standing:'',aim:'',result:''} }
  };

  const el = {};

  document.addEventListener('DOMContentLoaded', init);

  async function init(){
    cacheEls();
    bindUI();
    setupMapSizing();
    await loadDemoData();
    applyStoredPreferences();
    renderAll();
    refreshAssets();
  }

  function cacheEls(){
    [
      'pageTitle','apiStatus','mapStrip','mapCountLabel','agentGrid','abilityFilter','searchInput','difficultyFilter','favoritesOnly','sortFilter',
      'selectedMapChip','mapTitle','resultCount','libraryMapImage','libraryRouteSvg','libraryPins','mapEmptyState','lineupCards','detailContent',
      'creatorForm','creatorHeading','creatorTitle','creatorMap','creatorAgent','creatorAbility','creatorSite','creatorSide','creatorDifficulty','creatorVideo','creatorNotes','creatorTags',
      'creatorMapImage','creatorRouteSvg','creatorPins','creatorMapStage','creatorMapTip','creatorPreviewTitle','creatorPreviewMeta','creatorAgentImg','creatorAgentFallback',
      'creatorProgressText','creatorProgressBar','startCoordLabel','bounceCoordLabel','endCoordLabel','draftBadge','cancelEditBtn','mineSearch','mineCount','mineGrid',
      'dataModal','dataCount','importDataInput','toastStack'
    ].forEach(id => el[id] = document.getElementById(id));
  }

  function bindUI(){
    $$('[data-tab-target]').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tabTarget)));
    $('#quickCreateBtn').addEventListener('click', () => switchTab('create'));
    $('#resetFilters').addEventListener('click', resetFilters);
    $('#clearAgent').addEventListener('click', () => { state.filters.agent=null; state.filters.ability=null; renderLibrary(); });
    el.searchInput.addEventListener('input', e => { state.filters.search=e.target.value.trim().toLowerCase(); renderLibraryContent(); });
    el.difficultyFilter.addEventListener('change', e => { state.filters.difficulty=e.target.value; renderLibraryContent(); });
    el.favoritesOnly.addEventListener('change', e => { state.filters.favoritesOnly=e.target.checked; renderLibraryContent(); });
    el.sortFilter.addEventListener('change', e => { state.filters.sort=e.target.value; renderLibraryContent(); });
    $$('#sideFilter button').forEach(btn => btn.addEventListener('click', () => {
      $$('#sideFilter button').forEach(b=>b.classList.toggle('active',b===btn));
      state.filters.side=btn.dataset.value; renderLibraryContent();
    }));
    $('#togglePaths').addEventListener('click', e => { state.showPaths=!state.showPaths; e.currentTarget.classList.toggle('active',state.showPaths); renderMapRoutes(); });
    $('#fitMap').addEventListener('click', () => { fitMapCanvases(); el.libraryMapImage.animate([{transform:'translate(-50%,-50%) scale(.96)',opacity:.35},{transform:'translate(-50%,-50%) scale(1)',opacity:.55}],{duration:300,easing:'ease-out'}); });

    el.creatorAgent.addEventListener('change', () => { populateCreatorAbilities(); updateCreatorPreview(); });
    el.creatorMap.addEventListener('change', () => { updateCreatorMap(); updateCreatorPreview(); });
    [el.creatorTitle,el.creatorSite,el.creatorSide,el.creatorDifficulty,el.creatorAbility].forEach(node => node.addEventListener('input', updateCreatorPreview));
    $$('#routeModeButtons .route-mode').forEach(btn => btn.addEventListener('click', () => setRouteMode(btn.dataset.mode)));
    el.creatorMapStage.addEventListener('click', onCreatorMapClick);
    $('#undoRoutePoint').addEventListener('click', undoRoutePoint);
    $('#clearRoute').addEventListener('click', () => { state.creator.route={start:null,bounces:[],end:null}; renderCreatorRoute(); });
    $$('input[data-image-key]').forEach(input => input.addEventListener('change', onImageInput));
    $$('[data-image-slot]').forEach(box => {
      box.addEventListener('click', e => { if(!e.target.closest('button')) setImagePasteTarget(box.dataset.imageSlot); });
      box.addEventListener('keydown', e => { if(e.key==='Enter' || e.key===' '){ e.preventDefault(); setImagePasteTarget(box.dataset.imageSlot); } });
    });
    $$('[data-paste-image]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); pasteImageFromClipboard(btn.dataset.pasteImage); }));
    $$('[data-pick-image]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); setImagePasteTarget(btn.dataset.pickImage); $(`input[data-image-key="${btn.dataset.pickImage}"]`).click(); }));
    $$('[data-remove-image]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); removeCreatorImage(btn.dataset.removeImage); }));
    document.addEventListener('paste', onImagePaste);
    el.creatorForm.addEventListener('submit', saveCreatorLineup);
    el.cancelEditBtn.addEventListener('click', resetCreator);

    el.mineSearch.addEventListener('input', renderMine);

    $('#openDataModal').addEventListener('click', openDataModal);
    $('#closeDataModal').addEventListener('click', closeDataModal);
    el.dataModal.addEventListener('click', e => { if(e.target===el.dataModal) closeDataModal(); });
    $('#exportDataBtn').addEventListener('click', exportData);
    el.importDataInput.addEventListener('change', importData);
    $('#clearUserDataBtn').addEventListener('click', clearAllUserData);
    document.addEventListener('keydown', e => { if(e.key==='Escape') closeDataModal(); });
  }


  function setupMapSizing(){
    const stages=[document.getElementById('libraryMapStage'),document.getElementById('creatorMapStage')].filter(Boolean);
    const resize=()=>fitMapCanvases();
    if('ResizeObserver' in window){ const ro=new ResizeObserver(resize); stages.forEach(s=>ro.observe(s)); }
    window.addEventListener('resize',resize,{passive:true});
    requestAnimationFrame(resize);
  }
  function fitMapCanvases(){
    [document.getElementById('libraryMapStage'),document.getElementById('creatorMapStage')].filter(Boolean).forEach(stage=>{
      const r=stage.getBoundingClientRect(); if(!r.width||!r.height)return; stage.style.setProperty('--map-size',`${Math.min(r.width,r.height)*.9}px`);
    });
  }

  async function loadDemoData(){
    try{
      const r=await fetch('data/lineups.json',{cache:'no-store'});
      if(!r.ok) throw new Error('demo data');
      state.demos=await r.json();
    }catch{ state.demos=fallbackDemo; }
  }

  async function refreshAssets(){
    setApiStatus('loading','最新データ取得中');
    try{
      const ctrl=new AbortController();
      const timer=setTimeout(()=>ctrl.abort(),7000);
      const [agentsRes,mapsRes]=await Promise.all([
        fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true',{signal:ctrl.signal}),
        fetch('https://valorant-api.com/v1/maps',{signal:ctrl.signal})
      ]);
      clearTimeout(timer);
      if(!agentsRes.ok || !mapsRes.ok) throw new Error('API response error');
      const [agentsJson,mapsJson]=await Promise.all([agentsRes.json(),mapsRes.json()]);
      const agents=(agentsJson.data||[]).filter(a=>a.isPlayableCharacter).map(a=>({
        displayName:a.displayName,displayIcon:a.displayIcon||'',fullPortrait:a.fullPortraitV2||a.fullPortrait||'',role:a.role?.displayName||'',
        abilities:(a.abilities||[]).filter(ab=>ab.displayName).map(ab=>({displayName:ab.displayName,displayIcon:ab.displayIcon||'',slot:ab.slot||''}))
      })).sort((a,b)=>a.displayName.localeCompare(b.displayName));
      const maps=(mapsJson.data||[]).filter(m=>m.displayName && m.tacticalDescription && !/Range|Basic Training/i.test(m.displayName)).map(m=>({
        displayName:m.displayName,displayIcon:m.displayIcon||m.listViewIcon||'',splash:m.splash||m.stylizedBackgroundImage||''
      }));
      if(agents.length) state.assets.agents=agents;
      if(maps.length) state.assets.maps=uniqueBy(maps,'displayName');
      if(!getMap(state.filters.map) && state.assets.maps[0]) state.filters.map=state.assets.maps[0].displayName;
      setApiStatus('ok',`最新データ ${state.assets.agents.length} Agents`);
      renderAll();
    }catch(err){
      console.warn('Valorant API unavailable, fallback used',err);
      setApiStatus('warn','オフライン用データ');
      renderAll();
    }
  }

  function uniqueBy(arr,key){ const seen=new Set(); return arr.filter(v=>!seen.has(v[key]) && seen.add(v[key])); }
  function setApiStatus(type,text){ el.apiStatus.className=`connection-pill ${type==='ok'?'ok':type==='warn'?'warn':''}`; el.apiStatus.lastElementChild.textContent=text; }

  function applyStoredPreferences(){
    const p=LineupStorage.getPreferences();
    if(p.map) state.filters.map=p.map;
  }
  function persistPrefs(){ LineupStorage.savePreferences({map:state.filters.map}); }

  function renderAll(){
    populateCreatorSelects();
    renderLibrary();
    renderCreatorRoute();
    renderMine();
    updateDataCount();
  }

  function switchTab(tab){
    $$('.tab-panel').forEach(p=>p.classList.toggle('active',p.dataset.tab===tab));
    $$('.rail-btn[data-tab-target], .top-tab[data-tab-target]').forEach(b=>b.classList.toggle('active',b.dataset.tabTarget===tab));
    const titles={library:'定点ライブラリ',create:state.creator.editId?'定点を編集':'自分の定点を作る',mine:'マイ定点'};
    el.pageTitle.textContent=titles[tab]||'Lineup Lab';
    if(tab==='create') updateCreatorMap();
    if(tab==='mine') renderMine();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function resetFilters(){
    state.filters={...state.filters,agent:null,ability:null,side:'all',difficulty:'all',search:'',favoritesOnly:false,sort:'recommended'};
    el.searchInput.value='';el.difficultyFilter.value='all';el.favoritesOnly.checked=false;el.sortFilter.value='recommended';
    $$('#sideFilter button').forEach(b=>b.classList.toggle('active',b.dataset.value==='all'));
    renderLibrary();
  }

  function renderLibrary(){
    renderMapFilters();
    renderAgentFilters();
    renderAbilityFilters();
    renderLibraryContent();
  }

  function renderMapFilters(){
    el.mapCountLabel.textContent=`${state.assets.maps.length} maps`;
    el.mapStrip.innerHTML=state.assets.maps.map(m=>{
      const active=m.displayName===state.filters.map;
      return `<button class="map-option ${active?'active':''}" data-map="${esc(m.displayName)}" title="${esc(m.displayName)}">${m.splash?`<img src="${esc(m.splash)}" alt="" loading="lazy" onerror="this.style.display='none'">`:''}<span>${esc(m.displayName)}</span></button>`;
    }).join('');
    $$('.map-option',el.mapStrip).forEach(btn=>btn.addEventListener('click',()=>{
      state.filters.map=btn.dataset.map; state.selectedId=null; persistPrefs(); renderLibrary();
    }));
  }

  function renderAgentFilters(){
    el.agentGrid.innerHTML=state.assets.agents.map(a=>{
      const active=a.displayName===state.filters.agent;
      const initial=a.displayName.slice(0,2).toUpperCase();
      return `<button class="agent-option ${active?'active':''}" data-agent="${esc(a.displayName)}" title="${esc(a.displayName)}">${a.displayIcon?`<img src="${esc(a.displayIcon)}" alt="${esc(a.displayName)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">`:''}<span style="${a.displayIcon?'display:none':''}">${esc(initial)}</span></button>`;
    }).join('');
    $$('.agent-option',el.agentGrid).forEach(btn=>btn.addEventListener('click',()=>{
      state.filters.agent=state.filters.agent===btn.dataset.agent?null:btn.dataset.agent; state.filters.ability=null; state.selectedId=null; renderLibrary();
    }));
  }

  function renderAbilityFilters(){
    const agent=getAgent(state.filters.agent);
    if(!agent){
      el.abilityFilter.innerHTML='<button class="ability-filter-btn active"><span>AGENT<br>SELECT</span></button>';
      return;
    }
    el.abilityFilter.innerHTML=agent.abilities.map(ab=>{
      const active=ab.displayName===state.filters.ability;
      return `<button class="ability-filter-btn ${active?'active':''}" data-ability="${esc(ab.displayName)}" title="${esc(ab.displayName)}">${ab.displayIcon?`<img src="${esc(ab.displayIcon)}" alt="">`:`<span>${esc(ab.displayName)}</span>`}</button>`;
    }).join('');
    $$('.ability-filter-btn',el.abilityFilter).forEach(btn=>btn.addEventListener('click',()=>{
      state.filters.ability=state.filters.ability===btn.dataset.ability?null:btn.dataset.ability;state.selectedId=null;renderLibraryContent();renderAbilityFilters();
    }));
  }

  function allLineups(){ return [...state.demos,...state.users]; }
  function filteredLineups(){
    const f=state.filters;
    let items=allLineups().filter(x=>x.map===f.map);
    if(f.agent) items=items.filter(x=>x.agent===f.agent);
    if(f.ability) items=items.filter(x=>x.ability===f.ability);
    if(f.side!=='all') items=items.filter(x=>x.side===f.side || x.side==='both');
    if(f.difficulty!=='all') items=items.filter(x=>x.difficulty===f.difficulty);
    if(f.favoritesOnly) items=items.filter(x=>state.favorites.has(x.id));
    if(f.search) items=items.filter(x=>`${x.title} ${x.site||''} ${x.notes||''} ${(x.tags||[]).join(' ')}`.toLowerCase().includes(f.search));
    const dif={easy:1,medium:2,hard:3};
    if(f.sort==='name') items.sort((a,b)=>a.title.localeCompare(b.title,'ja'));
    else if(f.sort==='difficulty') items.sort((a,b)=>(dif[a.difficulty]||9)-(dif[b.difficulty]||9));
    else items.sort((a,b)=>Number(b.source==='user')-Number(a.source==='user'));
    return items;
  }

  function renderLibraryContent(){
    const map=getMap(state.filters.map);
    el.selectedMapChip.textContent=(state.filters.map||'MAP').toUpperCase();
    el.mapTitle.textContent=state.filters.map||'Map';
    setMapImage(el.libraryMapImage,map);
    const items=filteredLineups();
    el.resultCount.textContent=`${items.length} 定点`;
    if(state.selectedId && !items.some(x=>x.id===state.selectedId)) state.selectedId=null;
    if(!state.selectedId && items.length) state.selectedId=items[0].id;
    renderMapRoutes(items);
    renderLineupCards(items);
    renderDetail(items.find(x=>x.id===state.selectedId)||null);
  }

  function renderMapRoutes(items=filteredLineups()){
    el.libraryRouteSvg.innerHTML='';el.libraryPins.innerHTML='';
    el.mapEmptyState.classList.toggle('show',items.length===0);
    if(!items.length) return;
    const selected=items.find(x=>x.id===state.selectedId);
    if(state.showPaths){
      items.forEach(item=>{
        if(!item.start||!item.end) return;
        const pts=[item.start,...(item.bounces||[]),item.end].map(p=>`${p.x*10},${p.y*10}`).join(' ');
        const pl=svgEl('polyline',{points:pts,class:`route-path ${item.id===state.selectedId?'selected':''}`});
        el.libraryRouteSvg.appendChild(pl);
      });
    }
    const groups=[];
    items.forEach(item=>{
      if(!item.end)return;
      let g=groups.find(g=>distance(g.x,g.y,item.end.x,item.end.y)<4.2);
      if(!g){g={x:item.end.x,y:item.end.y,items:[]};groups.push(g);} g.items.push(item);
    });
    groups.forEach(g=>{
      const selectedIn=g.items.some(x=>x.id===state.selectedId);
      const pin=document.createElement('button');
      pin.className=`pin end ${g.items.length>1?'grouped':''} ${selectedIn?'selected':''}`;
      pin.style.left=`${g.x}%`;pin.style.top=`${g.y}%`;pin.dataset.count=g.items.length;
      pin.title=g.items.map(x=>x.title).join('\n');pin.textContent=g.items.length>1?'':(g.items[0].site||'•');
      pin.addEventListener('click',()=>{ state.selectedId=g.items[0].id; renderLibraryContent(); });
      el.libraryPins.appendChild(pin);
    });
    if(selected?.start){
      const p=document.createElement('button');p.className='pin start selected';p.style.left=`${selected.start.x}%`;p.style.top=`${selected.start.y}%`;p.title='立ち位置';p.textContent='';
      el.libraryPins.appendChild(p);
    }
  }

  function renderLineupCards(items){
    if(!items.length){el.lineupCards.innerHTML='<div class="empty-grid-state"><strong>表示できる定点がありません</strong><span>左の条件を変えるか「自分の定点」から追加できます。</span></div>';return;}
    el.lineupCards.innerHTML=items.map(item=>{
      const agent=getAgent(item.agent), fav=state.favorites.has(item.id);
      return `<article class="lineup-card ${item.id===state.selectedId?'active':''}" data-id="${esc(item.id)}">
        ${agentAvatar(agent,item.agent)}
        <div><h3>${esc(item.title)}</h3><div class="lineup-meta"><span class="tag-pill ${esc(item.side)}">${sideLabel(item.side)}</span><span class="tag-pill">${esc(item.site||'—')} SITE</span><span class="tag-pill">${difficultyLabel(item.difficulty)}</span>${item.source==='user'?'<span class="tag-pill">MY</span>':''}</div></div>
        <button class="fav-btn ${fav?'on':''}" data-fav="${esc(item.id)}" title="お気に入り">★</button>
      </article>`;
    }).join('');
    $$('.lineup-card',el.lineupCards).forEach(card=>card.addEventListener('click',e=>{if(e.target.closest('[data-fav]'))return;state.selectedId=card.dataset.id;renderLibraryContent();}));
    $$('[data-fav]',el.lineupCards).forEach(btn=>btn.addEventListener('click',()=>toggleFavorite(btn.dataset.fav)));
  }

  function renderDetail(item){
    if(!item){
      el.detailContent.innerHTML='<div class="detail-empty"><div><div class="scope"></div><strong>定点を選択</strong><span>マップ上の着弾点か、下のカードを選ぶと<br>詳細・画像・動画を確認できます。</span></div></div>';
      return;
    }
    const agent=getAgent(item.agent), full=agent?.fullPortrait||agent?.displayIcon||'';
    const media=item.images||{}; const mediaKeys=[['standing','立ち位置'],['aim','合わせ場所'],['result','着弾結果']];
    const video=safeHttpUrl(item.videoUrl||''); const yt=video?youtubeEmbed(video):'';
    const fav=state.favorites.has(item.id);
    el.detailContent.innerHTML=`
      <div class="detail-hero">${full?`<img class="detail-agent-full" src="${esc(full)}" alt="${esc(item.agent)}" onerror="this.style.display='none'">`:''}<div class="detail-gradient"></div><div class="detail-hero-text"><span class="detail-agent-name">${esc(item.agent)} · ${esc(item.ability||'ABILITY')}</span><h2>${esc(item.title)}</h2></div></div>
      <div class="detail-body">
        ${item.source==='demo'?'<div class="detail-demo-note">これはUI操作確認用のデモです。実戦精度は保証していません。</div>':''}
        <div class="detail-badges"><span class="tag-pill ${esc(item.side)}">${sideLabel(item.side)}</span><span class="tag-pill">${esc(item.site||'—')} SITE</span><span class="tag-pill">${difficultyLabel(item.difficulty)}</span>${(item.tags||[]).slice(0,3).map(t=>`<span class="tag-pill">#${esc(t)}</span>`).join('')}</div>
        <div class="detail-section"><div class="detail-section-title">ROUTE</div><div class="route-summary"><div class="route-place"><small>START</small><strong>${coordLabel(item.start)}</strong></div><span class="route-arrow">→ ${(item.bounces||[]).length?`${item.bounces.length} bounce →`:''}</span><div class="route-place"><small>LAND</small><strong>${coordLabel(item.end)}</strong></div></div></div>
        <div class="detail-section"><div class="detail-section-title">NOTES</div><p class="detail-note">${esc(item.notes||'メモはありません。')}</p></div>
        <div class="detail-section"><div class="detail-section-title">REFERENCE</div><div class="media-thumbs">${mediaKeys.map(([key,label])=>media[key]?`<div class="media-thumb"><img src="${esc(media[key])}" alt="${label}"></div>`:`<div class="media-thumb">${label}<br>なし</div>`).join('')}</div>${yt?`<div class="video-embed"><iframe src="${esc(yt)}" title="Lineup video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`:video?`<a class="video-link" href="${esc(video)}" target="_blank" rel="noopener">▶ 動画を開く</a>`:''}</div>
        <div class="detail-section"><div class="detail-actions">${item.source==='user'?`<button class="btn primary" data-detail-edit="${esc(item.id)}">編集</button>`:`<button class="btn primary" data-detail-copy="${esc(item.id)}">自分用に複製</button>`}<button class="btn ghost" data-detail-fav="${esc(item.id)}">${fav?'★ お気に入り済み':'☆ お気に入り'}</button></div></div>
      </div>`;
    const edit=$('[data-detail-edit]',el.detailContent); if(edit) edit.addEventListener('click',()=>editUserLineup(item.id));
    const copy=$('[data-detail-copy]',el.detailContent); if(copy) copy.addEventListener('click',()=>copyToUser(item));
    $('[data-detail-fav]',el.detailContent)?.addEventListener('click',()=>toggleFavorite(item.id));
  }

  function toggleFavorite(id){
    if(state.favorites.has(id)) state.favorites.delete(id); else state.favorites.add(id);
    LineupStorage.saveFavorites(state.favorites);renderLibraryContent();renderMine();
  }

  function populateCreatorSelects(){
    const currentMap=el.creatorMap.value || state.filters.map;
    const currentAgent=el.creatorAgent.value || 'Sova';
    el.creatorMap.innerHTML=state.assets.maps.map(m=>`<option value="${esc(m.displayName)}">${esc(m.displayName)}</option>`).join('');
    el.creatorAgent.innerHTML=state.assets.agents.map(a=>`<option value="${esc(a.displayName)}">${esc(a.displayName)}</option>`).join('');
    if(state.assets.maps.some(m=>m.displayName===currentMap)) el.creatorMap.value=currentMap;
    if(state.assets.agents.some(a=>a.displayName===currentAgent)) el.creatorAgent.value=currentAgent;
    populateCreatorAbilities(); updateCreatorMap(); updateCreatorPreview();
  }

  function populateCreatorAbilities(selectedValue){
    const agent=getAgent(el.creatorAgent.value);const abilities=agent?.abilities||[];
    const old=selectedValue||el.creatorAbility.value;
    el.creatorAbility.innerHTML=abilities.map(a=>`<option value="${esc(a.displayName)}">${esc(a.displayName)}</option>`).join('');
    if(abilities.some(a=>a.displayName===old)) el.creatorAbility.value=old;
  }

  function updateCreatorMap(){ setMapImage(el.creatorMapImage,getMap(el.creatorMap.value)); }
  function updateCreatorPreview(){
    const title=el.creatorTitle.value.trim()||'新しい定点';
    const agent=getAgent(el.creatorAgent.value); const map=el.creatorMap.value||'Map';
    el.creatorPreviewTitle.textContent=title;el.creatorPreviewMeta.textContent=`${map} · ${el.creatorAgent.value||'Agent'} · ${el.creatorAbility.value||'Ability'}`;
    if(agent?.displayIcon){el.creatorAgentImg.src=agent.displayIcon;el.creatorAgentImg.style.display='block';el.creatorAgentFallback.style.display='none';}else{el.creatorAgentImg.removeAttribute('src');el.creatorAgentImg.style.display='none';el.creatorAgentFallback.style.display='grid';el.creatorAgentFallback.textContent=(el.creatorAgent.value||'?').slice(0,2).toUpperCase();}
  }

  function setRouteMode(mode){
    state.creator.mode=mode;
    $$('#routeModeButtons .route-mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    const tips={start:['立ち位置を指定','マップ上をクリック'],bounce:['中継点を追加','反射・バウンド位置をクリック'],end:['着弾点を指定','最終到達地点をクリック']};
    const t=tips[mode];el.creatorMapTip.innerHTML=`<strong>${t[0]}</strong><span>${t[1]}</span>`;
  }

  function onCreatorMapClick(e){
    if(e.target.closest('button') || state.creator.dragging) return;
    const rect=el.creatorMapStage.getBoundingClientRect();
    const size=Math.min(rect.width,rect.height)*.9;
    const insetX=(rect.width-size)/2,insetY=(rect.height-size)/2;
    const x=clamp(((e.clientX-rect.left-insetX)/size)*100,0,100);
    const y=clamp(((e.clientY-rect.top-insetY)/size)*100,0,100);
    const p={x:+x.toFixed(1),y:+y.toFixed(1)};
    if(state.creator.mode==='start'){state.creator.route.start=p; setRouteMode(state.creator.route.end?'bounce':'end');}
    else if(state.creator.mode==='end'){state.creator.route.end=p;}
    else state.creator.route.bounces.push(p);
    renderCreatorRoute();
  }

  function renderCreatorRoute(){
    const r=state.creator.route;el.creatorRouteSvg.innerHTML='';el.creatorPins.innerHTML='';
    const pts=[r.start,...r.bounces,r.end].filter(Boolean);
    if(pts.length>=2){el.creatorRouteSvg.appendChild(svgEl('polyline',{points:pts.map(p=>`${p.x*10},${p.y*10}`).join(' '),class:'route-path selected'}));}
    if(r.start) addCreatorPin(r.start,'start','S',0);
    r.bounces.forEach((p,i)=>addCreatorPin(p,'bounce',String(i+1),i));
    if(r.end) addCreatorPin(r.end,'end','E',0);
    el.startCoordLabel.textContent=r.start?coordLabel(r.start):'未設定';el.bounceCoordLabel.textContent=`${r.bounces.length}点`;el.endCoordLabel.textContent=r.end?coordLabel(r.end):'未設定';
    const done=Number(!!r.start)+Number(!!r.end);el.creatorProgressText.textContent=`${done} / 2 必須地点`;el.creatorProgressBar.style.width=`${done*50}%`;
  }
  function addCreatorPin(p,type,label,index){const d=document.createElement('div');d.className=`creator-pin ${type}`;d.style.left=`${p.x}%`;d.style.top=`${p.y}%`;d.textContent=label;d.title='ドラッグで微調整';d.addEventListener('pointerdown',ev=>beginCreatorDrag(ev,type,index));el.creatorPins.appendChild(d);}

  function beginCreatorDrag(e,type,index){
    e.preventDefault();e.stopPropagation();state.creator.dragging=true;
    const move=ev=>{const p=creatorPointFromClient(ev.clientX,ev.clientY);if(type==='start')state.creator.route.start=p;else if(type==='end')state.creator.route.end=p;else state.creator.route.bounces[index]=p;renderCreatorRoute();};
    const up=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);setTimeout(()=>{state.creator.dragging=false;},0);};
    document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});
  }
  function creatorPointFromClient(clientX,clientY){
    const rect=el.creatorMapStage.getBoundingClientRect();const size=Math.min(rect.width,rect.height)*.9;const insetX=(rect.width-size)/2,insetY=(rect.height-size)/2;
    return {x:+clamp(((clientX-rect.left-insetX)/size)*100,0,100).toFixed(1),y:+clamp(((clientY-rect.top-insetY)/size)*100,0,100).toFixed(1)};
  }

  function undoRoutePoint(){
    const r=state.creator.route;
    if(state.creator.mode==='bounce' && r.bounces.length) r.bounces.pop();
    else if(r.end) r.end=null;
    else if(r.bounces.length) r.bounces.pop();
    else r.start=null;
    renderCreatorRoute();
  }

  function setImagePasteTarget(key){
    $$('[data-image-slot]').forEach(box=>box.classList.toggle('paste-target',box.dataset.imageSlot===key));
  }

  async function saveCreatorImage(key,file,source='画像'){
    if(!file || !file.type?.startsWith('image/')){toast('画像を取得できませんでした','error');return;}
    try{
      const data=await compressImage(file,1280,720,.76);
      if(data.length>800000) toast('画像が大きめです。保存容量に注意してください。');
      state.creator.images[key]=data;
      const box=$(`[data-image-slot="${key}"]`),img=$(`img[data-preview="${key}"]`);
      img.src=data;box.classList.add('has-image');box.querySelector('.slot-status').textContent='登録済み';setImagePasteTarget(key);
      toast(`${source}を登録しました`,'success');
    }catch{toast('画像の読み込みに失敗しました','error');}
  }

  async function onImageInput(e){
    const input=e.currentTarget,key=input.dataset.imageKey,file=input.files?.[0];if(!file)return;
    setImagePasteTarget(key);
    await saveCreatorImage(key,file,'画像');
    input.value='';
  }

  async function onImagePaste(e){
    if(!document.getElementById('tab-create')?.classList.contains('active')) return;
    const item=[...(e.clipboardData?.items||[])].find(x=>x.type?.startsWith('image/'));
    if(!item)return;
    e.preventDefault();
    const key=$('[data-image-slot].paste-target')?.dataset.imageSlot||'standing';
    await saveCreatorImage(key,item.getAsFile(),'スクショ');
  }

  async function pasteImageFromClipboard(key){
    setImagePasteTarget(key);
    if(!navigator.clipboard?.read){ toast('この環境ではボタン貼り付けが使えません。Win + Shift + S のあと Ctrl + V で貼り付けてください。');return; }
    try{
      const items=await navigator.clipboard.read();
      for(const item of items){
        const type=item.types.find(t=>t.startsWith('image/'));
        if(type){ const blob=await item.getType(type); await saveCreatorImage(key,blob,'クリップボード画像'); return; }
      }
      toast('クリップボードに画像がありません。Win + Shift + S で切り取ってください。','error');
    }catch{ toast('クリップボードを直接読めませんでした。Ctrl + V なら貼り付けできます。'); }
  }

  function removeCreatorImage(key){
    state.creator.images[key]='';
    const box=$(`[data-image-slot="${key}"]`),img=$(`img[data-preview="${key}"]`);
    box.classList.remove('has-image');box.querySelector('.slot-status').textContent='ここにスクショ';img.removeAttribute('src');setImagePasteTarget(key);
    toast('画像を削除しました');
  }

  function compressImage(file,maxW,maxH,quality){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{
        const img=new Image();img.onerror=reject;img.onload=()=>{
          let w=img.width,h=img.height;const ratio=Math.min(1,maxW/w,maxH/h);w=Math.max(1,Math.round(w*ratio));h=Math.max(1,Math.round(h*ratio));
          const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
          resolve(canvas.toDataURL('image/webp',quality));
        };img.src=reader.result;
      };reader.readAsDataURL(file);
    });
  }

  function saveCreatorLineup(e){
    e.preventDefault();
    if(!state.creator.route.start || !state.creator.route.end){toast('立ち位置と着弾点の2か所は必須です','error');return;}
    const old=state.creator.editId?state.users.find(x=>x.id===state.creator.editId):null;
    const item={
      id:old?.id||uid(),source:'user',title:el.creatorTitle.value.trim(),map:el.creatorMap.value,agent:el.creatorAgent.value,ability:el.creatorAbility.value,
      side:el.creatorSide.value,site:el.creatorSite.value.trim()||'—',difficulty:el.creatorDifficulty.value,
      start:{...state.creator.route.start},bounces:state.creator.route.bounces.map(x=>({...x})),end:{...state.creator.route.end},
      notes:el.creatorNotes.value.trim(),tags:el.creatorTags.value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,12),videoUrl:safeHttpUrl(el.creatorVideo.value.trim())||'',images:{...state.creator.images},
      createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()
    };
    let next;
    if(old) next=state.users.map(x=>x.id===old.id?item:x); else next=[item,...state.users];
    if(!LineupStorage.saveUserLineups(next)){toast('保存容量が足りません。画像を減らすかJSONへバックアップしてください。','error');return;}
    state.users=next;state.selectedId=item.id;state.filters.map=item.map;toast(old?'定点を更新しました':'定点を保存しました','success');resetCreator();renderAll();switchTab('mine');
  }

  function resetCreator(){
    state.creator={editId:null,mode:'start',dragging:false,route:{start:null,bounces:[],end:null},images:{standing:'',aim:'',result:''}};
    el.creatorForm.reset();
    if(state.assets.maps.some(m=>m.displayName===state.filters.map)) el.creatorMap.value=state.filters.map;
    if(state.assets.agents.some(a=>a.displayName==='Sova')) el.creatorAgent.value='Sova';
    populateCreatorAbilities();
    $$('input[data-image-key]').forEach(i=>i.value='');$$('.upload-box').forEach(b=>{b.classList.remove('has-image','paste-target');const st=b.querySelector('.slot-status');if(st)st.textContent='ここにスクショ';});$$('[data-preview]').forEach(img=>img.removeAttribute('src'));setImagePasteTarget('standing');
    el.creatorHeading.textContent='新しい定点';el.draftBadge.textContent='下書き';el.cancelEditBtn.textContent='クリア';setRouteMode('start');updateCreatorMap();updateCreatorPreview();renderCreatorRoute();el.pageTitle.textContent='自分の定点を作る';
  }

  function editUserLineup(id){
    const item=state.users.find(x=>x.id===id);if(!item)return;
    state.creator.editId=id;state.creator.mode='start';state.creator.dragging=false;state.creator.route={start:{...item.start},bounces:(item.bounces||[]).map(x=>({...x})),end:{...item.end}};state.creator.images={standing:item.images?.standing||'',aim:item.images?.aim||'',result:item.images?.result||''};
    populateCreatorSelects();
    el.creatorTitle.value=item.title;el.creatorMap.value=item.map;el.creatorAgent.value=item.agent;populateCreatorAbilities(item.ability);el.creatorAbility.value=item.ability;el.creatorSite.value=item.site||'';el.creatorSide.value=item.side||'attack';el.creatorDifficulty.value=item.difficulty||'medium';el.creatorVideo.value=item.videoUrl||'';el.creatorNotes.value=item.notes||'';el.creatorTags.value=(item.tags||[]).join(', ');
    Object.entries(state.creator.images).forEach(([key,data])=>{const box=$(`[data-image-slot="${key}"]`),img=$(`img[data-preview="${key}"]`);if(data){img.src=data;box.classList.add('has-image');box.querySelector('.slot-status').textContent='登録済み';}else{box.classList.remove('has-image');box.querySelector('.slot-status').textContent='ここにスクショ';}});setImagePasteTarget('standing');
    el.creatorHeading.textContent='定点を編集';el.draftBadge.textContent='編集モード';el.cancelEditBtn.textContent='編集をやめる';updateCreatorMap();updateCreatorPreview();renderCreatorRoute();switchTab('create');
  }

  function copyToUser(item){
    const copy={...structuredClone(item),id:uid(),source:'user',title:item.title.replace('（UIデモ）','').trim()+'（コピー）',images:item.images||{},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    const next=[copy,...state.users];if(!LineupStorage.saveUserLineups(next)){toast('保存できませんでした','error');return;}state.users=next;toast('マイ定点へ複製しました','success');renderAll();
  }

  function renderMine(){
    const q=(el.mineSearch.value||'').trim().toLowerCase();
    const items=state.users.filter(x=>!q||`${x.title} ${x.map} ${x.agent} ${x.notes||''}`.toLowerCase().includes(q));
    el.mineCount.textContent=`${items.length} 件`;
    if(!items.length){el.mineGrid.innerHTML='<div class="empty-grid-state"><strong>まだ自分の定点がありません</strong><span>「＋ 新しい定点」から、最初の1件を作成できます。</span></div>';return;}
    el.mineGrid.innerHTML=items.map(item=>{
      const map=getMap(item.map),agent=getAgent(item.agent),fav=state.favorites.has(item.id);
      return `<article class="mine-card"><div class="mine-card-visual">${map?.displayIcon?`<img class="map-bg" src="${esc(map.displayIcon)}" alt="${esc(item.map)}">`:''}${agent?.fullPortrait?`<img class="mine-card-agent" src="${esc(agent.fullPortrait)}" alt="${esc(item.agent)}">`:agent?.displayIcon?`<img class="mine-card-agent" src="${esc(agent.displayIcon)}" alt="${esc(item.agent)}">`:''}</div><div class="mine-card-body"><div class="lineup-meta"><span class="tag-pill">${esc(item.map)}</span><span class="tag-pill">${esc(item.agent)}</span><span class="tag-pill ${esc(item.side)}">${sideLabel(item.side)}</span></div><h3>${esc(item.title)}</h3><div class="lineup-meta"><span class="tag-pill">${esc(item.ability)}</span><span class="tag-pill">${difficultyLabel(item.difficulty)}</span>${fav?'<span class="tag-pill">★ FAVORITE</span>':''}</div><div class="mine-card-actions"><button class="btn small" data-mine-view="${esc(item.id)}">見る</button><button class="btn small" data-mine-edit="${esc(item.id)}">編集</button><button class="btn small danger-btn" data-mine-delete="${esc(item.id)}">×</button></div></div></article>`;
    }).join('');
    $$('[data-mine-view]',el.mineGrid).forEach(b=>b.addEventListener('click',()=>{const item=state.users.find(x=>x.id===b.dataset.mineView);state.filters.map=item.map;state.selectedId=item.id;renderLibrary();switchTab('library');}));
    $$('[data-mine-edit]',el.mineGrid).forEach(b=>b.addEventListener('click',()=>editUserLineup(b.dataset.mineEdit)));
    $$('[data-mine-delete]',el.mineGrid).forEach(b=>b.addEventListener('click',()=>deleteUserLineup(b.dataset.mineDelete)));
  }

  function deleteUserLineup(id){
    const item=state.users.find(x=>x.id===id);if(!item)return;
    if(!confirm(`「${item.title}」を削除しますか？`))return;
    state.users=state.users.filter(x=>x.id!==id);state.favorites.delete(id);LineupStorage.saveUserLineups(state.users);LineupStorage.saveFavorites(state.favorites);if(state.selectedId===id)state.selectedId=null;renderAll();toast('定点を削除しました');
  }

  function openDataModal(){updateDataCount();el.dataModal.classList.add('show');el.dataModal.setAttribute('aria-hidden','false');}
  function closeDataModal(){el.dataModal.classList.remove('show');el.dataModal.setAttribute('aria-hidden','true');}
  function updateDataCount(){el.dataCount.textContent=state.users.length;}

  function exportData(){
    const payload={schema:'lineup-lab/v1',exportedAt:new Date().toISOString(),lineups:state.users};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`lineup_lab_${new Date().toISOString().slice(0,10).replaceAll('-','')}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast('JSONを書き出しました','success');
  }

  async function importData(e){
    const file=e.target.files?.[0];if(!file)return;
    try{
      const parsed=JSON.parse(await file.text());const incoming=Array.isArray(parsed)?parsed:parsed.lineups;
      if(!Array.isArray(incoming))throw new Error();
      const normalized=incoming.filter(x=>x&&x.title&&x.map&&x.agent&&x.start&&x.end).map(x=>({...x,id:state.users.some(u=>u.id===x.id)?uid():(x.id||uid()),source:'user',createdAt:x.createdAt||new Date().toISOString()}));
      const next=[...normalized,...state.users];if(!LineupStorage.saveUserLineups(next))throw new Error('storage');state.users=next;renderAll();toast(`${normalized.length}件を読み込みました`,'success');closeDataModal();
    }catch{toast('JSONを読み込めませんでした。形式を確認してください。','error');}
    finally{e.target.value='';}
  }

  function clearAllUserData(){
    if(!state.users.length){toast('削除するマイ定点がありません');return;}
    if(!confirm(`保存中のマイ定点 ${state.users.length} 件をすべて削除します。よろしいですか？`))return;
    const ids=new Set(state.users.map(x=>x.id));state.users=[];state.favorites=new Set([...state.favorites].filter(id=>!ids.has(id)));LineupStorage.clearUserLineups();LineupStorage.saveFavorites(state.favorites);renderAll();closeDataModal();toast('マイ定点をすべて削除しました');
  }

  function getAgent(name){return state.assets.agents.find(a=>a.displayName===name)||null;}
  function getMap(name){return state.assets.maps.find(m=>m.displayName===name)||null;}
  function setMapImage(img,map){
    const url=map?.displayIcon||'';
    if(url){img.src=url;img.style.display='block';img.onerror=()=>{img.style.display='none';};}else{img.removeAttribute('src');img.style.display='none';}
  }
  function agentAvatar(agent,name){
    const initial=(name||'?').slice(0,2).toUpperCase();return `<div class="agent-avatar">${agent?.displayIcon?`<img src="${esc(agent.displayIcon)}" alt="${esc(name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">`:''}<span style="${agent?.displayIcon?'display:none':''}">${esc(initial)}</span></div>`;
  }
  function sideLabel(v){return v==='attack'?'攻め':v==='defense'?'守り':v==='both'?'両方':'すべて';}
  function difficultyLabel(v){return v==='easy'?'簡単':v==='hard'?'難しい':'普通';}
  function coordLabel(p){return p?`${Number(p.x).toFixed(0)}, ${Number(p.y).toFixed(0)}`:'未設定';}
  function distance(x1,y1,x2,y2){return Math.hypot(x1-x2,y1-y2);}
  function svgEl(tag,attrs){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;}

  function safeHttpUrl(raw){
    if(!raw || !/^https?:\/\//i.test(raw))return'';try{const u=new URL(raw);if(u.protocol==='http:'||u.protocol==='https:')return u.href;}catch{}return'';
  }
  function youtubeEmbed(url){
    try{const u=new URL(url);let id='';if(u.hostname.includes('youtu.be'))id=u.pathname.slice(1).split('/')[0];else if(u.hostname.includes('youtube.com')){if(u.pathname==='/watch')id=u.searchParams.get('v')||'';else if(u.pathname.startsWith('/shorts/'))id=u.pathname.split('/')[2]||'';else if(u.pathname.startsWith('/embed/'))id=u.pathname.split('/')[2]||'';}if(/^[A-Za-z0-9_-]{6,20}$/.test(id))return `https://www.youtube-nocookie.com/embed/${id}`;}catch{}return'';
  }

  function toast(message,type=''){
    const d=document.createElement('div');d.className=`toast ${type}`;d.textContent=message;el.toastStack.appendChild(d);setTimeout(()=>{d.style.opacity='0';d.style.transform='translateY(5px)';setTimeout(()=>d.remove(),220);},3000);
  }
})();
