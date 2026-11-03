
/* ══════════════════════════════════════════════════════════════
   21. GÖRÜNÜM: TEMALAR, FONTLAR, ODAK, AMBİYANS (artık kalıcı)
══════════════════════════════════════════════════════════════ */
const THEMES={
  karanlık:{dark:true,name:'Karanlık',accent:'#1D9E75',bg:'#0f0f0f',surface:'#1a1a1a',surface2:'#232323',border:'#2a2a2a',text:'#f0f0f0',text2:'#888888',text3:'#5a5a5a',accent2:'#0F6E56',blobs:['#1D9E75','#0a6e50','#1a4a8a','#5a1a7a']},
  kızıl:{dark:true,name:'Kızıl',accent:'#c0392b',bg:'#0d0505',surface:'#1a0808',surface2:'#221010',border:'#2e1515',text:'#f5e0e0',text2:'#a07070',text3:'#6a3a3a',accent2:'#922b21',blobs:['#c0392b','#8b1a1a','#d4602a','#7a1a1a']},
  okyanus:{dark:true,name:'Okyanus',accent:'#2980b9',bg:'#060d18',surface:'#0d1b2a',surface2:'#142234',border:'#1c2f46',text:'#d6eaf8',text2:'#6fa8c8',text3:'#41708e',accent2:'#1a5276',blobs:['#1a6aaa','#2d7dd2','#0a9090','#1a4a8a']},
  sepia:{dark:true,name:'Sepia',accent:'#c8961a',bg:'#12100a',surface:'#1e1a12',surface2:'#28221a',border:'#38301e',text:'#e8d5a3',text2:'#a08858',text3:'#6a5632',accent2:'#9a7010',blobs:['#8b4513','#c47020','#a08030','#6a4010']},
  orman:{dark:true,name:'Orman',accent:'#27ae60',bg:'#060e06',surface:'#0a1a0a',surface2:'#12201a',border:'#1a2e1a',text:'#d5f0d5',text2:'#70a870',text3:'#467a46',accent2:'#1e8449',blobs:['#2d9e50','#1D9E75','#52c07a','#0a6e30']},
  alacakaranlık:{dark:true,name:'Alacakaranlık',accent:'#8e44ad',bg:'#0a060e',surface:'#160a1a',surface2:'#1e1028',border:'#2a1838',text:'#e8d8f5',text2:'#9a78c0',text3:'#664488',accent2:'#6c3483',blobs:['#7b2d9e','#9d4edd','#4a1a8a','#b050c0']},
  gün:{dark:false,name:'Gün',accent:'#0a8a5a',bg:'#f2f2f2',surface:'#ffffff',surface2:'#e6e6e6',border:'#cccccc',text:'#1a1a1a',text2:'#555555',text3:'#8a8a8a',accent2:'#077048',blobs:['#0a8a5a','#2980b9','#8e44ad','#c0392b']},
  okuma:{dark:false,name:'Okuma',accent:'#8b5e10',bg:'#f5eed8',surface:'#fdf7e4',surface2:'#ede4cc',border:'#cfc09a',text:'#2a1e0c',text2:'#6b4e28',text3:'#9a7a4a',accent2:'#6a460c',blobs:['#8b5e10','#c8961a','#9a3010','#5a7a10']},
  gökyüzü:{dark:false,name:'Gökyüzü',accent:'#1a6eb8',bg:'#eaf2fc',surface:'#f8fcff',surface2:'#dcedf8',border:'#b8d2ea',text:'#0c1e38',text2:'#3a5898',text3:'#6a8cb8',accent2:'#13508a',blobs:['#1a6eb8','#2d9de0','#0a8a8a','#1a3ea0']}
};
let activeThemeKey=THEMES[settings.theme]?settings.theme:'karanlık';
function setCssVars(v){const r=document.documentElement.style;for(const k in v)r.setProperty('--'+k,v[k]);}
function buildThemeGrid(){
  const g=$('theme-grid');g.innerHTML='';
  Object.entries(THEMES).forEach(([key,t])=>{
    const c=document.createElement('div');
    c.className='theme-card'+(key===activeThemeKey?' active':'');c.dataset.theme=key;
    c.innerHTML='<div class="theme-preview" style="background:'+t.bg+'"><div class="theme-accent-bar" style="background:'+t.accent+'"></div><span class="theme-text-prev" style="color:'+t.text+'">Aa</span></div><div class="theme-name" style="background:'+t.surface2+';color:'+t.text2+'">'+t.name+'</div>';
    c.onclick=()=>applyTheme(key);g.appendChild(c);
  });
}
function applyTheme(key){
  const t=THEMES[key];if(!t) return;
  activeThemeKey=key;settings.theme=key;settings.custom=null;saveSettings();
  setCssVars({bg:t.bg,surface:t.surface,surface2:t.surface2,border:t.border,text:t.text,text2:t.text2,text3:t.text3,accent:t.accent,accent2:t.accent2});
  document.documentElement.style.colorScheme=t.dark?'dark':'light';
  document.querySelectorAll('.theme-card,.lnd-tc').forEach(c=>c.classList.toggle('active',c.dataset.theme===key));
  if(ambientOn) setAmbientBlobs(t.blobs);
}
function toggleCustomColors(){
  const open=$('custom-colors').style.display==='none';
  $('custom-colors').style.display=open?'block':'none';
  $('custom-arrow').classList.toggle('open',open);
}
function applyCustomTheme(bg,tx){
  bg=bg||$('custom-bg-input').value;tx=tx||$('custom-text-input').value;
  activeThemeKey='custom';settings.theme='custom';settings.custom={bg,tx};saveSettings();
  document.querySelectorAll('.theme-card,.lnd-tc').forEach(c=>c.classList.remove('active'));
  const light=luminance(bg)>0.5;
  const shift=light?-1:1;
  setCssVars({bg,surface:lighten(bg,13*shift),surface2:lighten(bg,21*shift),border:lighten(bg,30*shift),text:tx,text2:hexAlpha(tx,.62),text3:hexAlpha(tx,.42)});
  document.documentElement.style.colorScheme=light?'light':'dark';
  if(ambientOn) setAmbientBlobs([bg,lighten(bg,30*shift),tx,lighten(bg,15*shift)]);
}
const FONTS=[
  {key:'georgia',name:'Georgia',label:'Klasik',css:"Georgia,'Times New Roman',serif"},
  {key:'merriweather',name:'Merriweather',label:'Modern',css:"'Merriweather',Georgia,serif"},
  {key:'playfair',name:'Playfair Display',label:'Zarif',css:"'Playfair Display',Georgia,serif"},
  {key:'lora',name:'Lora',label:'Dengeli',css:"'Lora',Georgia,serif"},
  {key:'garamond',name:'EB Garamond',label:'Kitabi',css:"'EB Garamond',Georgia,serif"}
];
let activeFontKey=FONTS.some(f=>f.key===settings.font)?settings.font:'georgia';
function buildFontList(){
  const list=$('font-list');list.innerHTML='';
  FONTS.forEach(f=>{
    const el=document.createElement('div');
    el.className='font-option'+(f.key===activeFontKey?' active':'');el.dataset.font=f.key;
    el.innerHTML='<span class="font-option-label">'+f.label+'</span><span class="font-option-preview" style="font-family:'+f.css+'">'+f.name+'</span>';
    el.onclick=()=>applyFont(f.key);list.appendChild(el);
  });
}
function applyFont(key){
  const f=FONTS.find(x=>x.key===key);if(!f) return;
  activeFontKey=key;settings.font=key;saveSettings();
  document.documentElement.style.setProperty('--serif',f.css);
  document.querySelectorAll('.font-option').forEach(el=>el.classList.toggle('active',el.dataset.font===key));
}
function toggleSettings(){
  const p=$('settings-panel');
  const open=!p.classList.contains('visible');
  p.classList.toggle('visible',open);
  if(open){buildThemeGrid();buildFontList();$('set-goal').value=settings.goalMin;$('set-stop').checked=settings.stopAtGoal;$('set-chime').checked=settings.chime;$('ambient-toggle').checked=ambientOn;}
}
document.addEventListener('click',e=>{
  const p=$('settings-panel');
  if(p.classList.contains('visible')&&!p.contains(e.target)&&!e.target.closest('[onclick*="toggleSettings"]')) p.classList.remove('visible');
  const tp=$('timer-pop');
  if(tp.classList.contains('visible')&&!tp.contains(e.target)&&!e.target.closest('#timer-pill')) tp.classList.remove('visible');
  const td=$('toc-drawer');
  if(td.classList.contains('visible')&&!td.contains(e.target)&&!e.target.closest('[onclick*="toggleToc"]')) td.classList.remove('visible');
});
let focusMode=false;
function toggleFocusMode(force){
  focusMode=force===undefined?!focusMode:!!force;
  document.body.classList.toggle('focus-mode',focusMode);
  try{
    if(focusMode&&!document.fullscreenElement&&document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>{});
    if(!focusMode&&document.fullscreenElement) document.exitFullscreen().catch(()=>{});
  }catch(e){}
  if(running&&mode==='scroll') setTimeout(()=>renderScroll(),60);
}
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&focusMode)toggleFocusMode(false);});
let ambientOn=false;
function toggleAmbient(on){
  ambientOn=!!on;settings.ambient=ambientOn;saveSettings();
  $('ambient-bg').classList.toggle('active',ambientOn);
  if(ambientOn){const t=THEMES[activeThemeKey];setAmbientBlobs(t?t.blobs:THEMES.karanlık.blobs);}
}
function setAmbientBlobs(c){['amb1','amb2','amb3','amb4'].forEach((id,i)=>{$(id).style.background=c[i]||c[0];});}
function hexToRgb(h){return {r:parseInt(h.slice(1,3),16),g:parseInt(h.slice(3,5),16),b:parseInt(h.slice(5,7),16)};}
function lighten(h,amt){try{const {r,g,b}=hexToRgb(h);return '#'+[r,g,b].map(v=>clamp(v+amt,0,255).toString(16).padStart(2,'0')).join('');}catch(e){return h;}}
function hexAlpha(h,a){try{const {r,g,b}=hexToRgb(h);return 'rgba('+r+','+g+','+b+','+a+')';}catch(e){return h;}}
function luminance(h){const {r,g,b}=hexToRgb(h);return (0.299*r+0.587*g+0.114*b)/255;}

/* Hız / yazı boyutu */
function onWpmChange(v){
  v=clamp(parseInt(v,10)||300,50,1000);
  $('wpm-sl').value=v;$('wpm-lbl').textContent=v;settings.wpm=v;saveSettings();
  if(sections.some(s=>s.part)) {rebuildStructure();setProgressUI();}
}
function onFsChange(v){
  $('fs-lbl').textContent=v+'px';settings.fs=+v;saveSettings();
  if(!running) return;
  if(mode==='rsvp') $('rsvp-word').style.fontSize=v+'px';
  if(mode==='typewriter') $('tw-text').style.fontSize=v+'px';
  if(mode==='bionic') $('bio-text').style.fontSize=v+'px';
  if(mode==='normal') $('normal-text').style.fontSize=v+'px';
  if(mode==='scroll') renderScroll(true);
  if(mode==='tiktok') cd.els.forEach(el=>fitCard(el,+v));
}

/* ══════════════════════════════════════════════════════════════
   22. ANA EKRAN
══════════════════════════════════════════════════════════════ */
let lndSrc='text',lndUrlText='';
function showLanding(){
  if(running) resetReading();
  closeBookDetail();toggleLibraryPanel(false);toggleToc(false);
  $('landing').classList.remove('hidden');document.body.classList.add('landing-open');
  updateModeUI();renderToday();renderLndLibrary();renderContinue();renderLndKatalog();
  if($('lnd-sec-theme').style.display!=='none') buildLndThemeStrip();
}
function hideLanding(){$('landing').classList.add('hidden');document.body.classList.remove('landing-open');}
function lndSetSrc(s){
  lndSrc=s;
  ['text','url','pdf'].forEach(x=>{$('lnd-panel-'+x).style.display=x===s?'':'none';});
  document.querySelectorAll('.lnd-src-tab').forEach((b,i)=>b.classList.toggle('active',['text','url','pdf'][i]===s));
}
async function lndFetchUrl(){
  const u=$('lnd-url').value.trim();
  if(!/^https?:\/\//i.test(u)){toast('Geçerli bir URL gir (https://...)');return;}
  $('lnd-url-info').textContent='Çekiliyor...';
  try{const r=await fetchUrlText(u);lndUrlText=r.text;$('lnd-url-info').textContent='✓ '+nf(tokenize(lndUrlText).length)+' kelime çekildi'+(r.title?': '+r.title:'');if(r.title)$('lib-title-input').value=r.title;}
  catch(e){$('lnd-url-info').textContent='URL çekilemedi. Metni kopyalayıp Metin sekmesine yapıştır.';}
}
function toggleLndSec(id){
  const body=$('lnd-sec-'+id),caret=$('lnd-caret-'+id);
  const show=body.style.display==='none';
  body.style.display=show?'block':'none';caret.classList.toggle('open',show);
  if(show&&id==='theme') buildLndThemeStrip();
}
function submitSuggestion(){
  const txt=$('lnd-suggest-txt').value.trim();
  if(!txt){toast('Öneri boş bırakılamaz.');return;}
  const list=LS.get('turkerokuma_suggestions',[]);list.push({text:txt,date:new Date().toISOString()});LS.set('turkerokuma_suggestions',list);
  $('lnd-suggest-txt').value='';
  const t=$('lnd-suggest-thanks');t.style.display='inline';setTimeout(()=>{t.style.display='none';},3500);
}
function lndSetMode(m){mode=m;settings.mode=m;saveSettings();updateModeUI();}
function landingStart(){
  if(lndSrc==='text'){
    const t=$('lnd-text').value.trim();
    if(!t){toast('Önce bir metin yapıştır — ya da aşağıdan kütüphaneden bir kitap seç.');return;}
    $('text-input').value=t;setSrc('text');
  }else if(lndSrc==='url'){
    if(!lndUrlText){toast("Önce URL'den metin çek.");return;}
    urlText=lndUrlText;setSrc('url');
  }else{
    toast('PDF yükle — incelenip kütüphaneye eklenecek.');return;
  }
  if(curBook) closeCurrentBook();
  hideLanding();startReading();
}
function buildLndThemeStrip(){
  const strip=$('lnd-theme-strip');strip.innerHTML='';
  const group=(label,entries)=>{
    const g=document.createElement('div');
    g.innerHTML='<div class="lnd-theme-group-label">'+label+'</div>';
    const row=document.createElement('div');row.className='lnd-tc-row';
    entries.forEach(([key,t])=>{
      const c=document.createElement('div');c.className='lnd-tc'+(activeThemeKey===key?' active':'');c.dataset.theme=key;
      c.innerHTML='<div class="lnd-tc-preview" style="background:'+t.bg+'"><span class="lnd-tc-aa" style="color:'+t.accent+'">Aa</span><div class="lnd-tc-bar" style="background:'+t.accent+'"></div></div><div class="lnd-tc-name" style="background:'+t.surface+';color:'+t.text2+'">'+t.name+'</div>';
      c.onclick=()=>applyTheme(key);row.appendChild(c);
    });
    g.appendChild(row);strip.appendChild(g);
  };
  group('Koyu Temalar',Object.entries(THEMES).filter(([,t])=>t.dark));
  group('Açık Temalar',Object.entries(THEMES).filter(([,t])=>!t.dark));
}
function renderLndLibrary(){
  const grid=$('lnd-lib-grid');
  if(!libraryReady){grid.innerHTML='<div class="lnd-lib-empty">Kütüphane yükleniyor...</div>';return;}
  if(!library.length){grid.innerHTML='<div class="lnd-lib-empty">Kütüphane boş. “+ Kitap Ekle” ile PDF ya da metin ekleyebilirsin.</div>';return;}
  grid.innerHTML='';
  sortedLibrary().slice(0,12).forEach(book=>{
    const pct=bookPct(book),{title,author}=splitTitle(book.title);
    const c=document.createElement('div');c.className='lnd-lib-card';
    c.innerHTML='<div class="lnd-lib-cover" style="'+coverStyle(book)+'"><div class="lnd-lib-cover-inner"'+(book.coverUrl?' style="background:linear-gradient(to top,rgba(0,0,0,.75),transparent 60%)"':'')+'>'+
      (book.coverUrl?'':'<div class="lnd-lib-cover-brand">hızlıkitapoku</div>')+
      '<div class="lnd-lib-cover-spacer"></div><div class="lnd-lib-cover-title">'+esc(title)+'</div><div class="lnd-lib-cover-divider"></div><div class="lnd-lib-cover-author">'+(esc(author)||'&nbsp;')+'</div></div>'+
      '<div class="lnd-lib-prog-wrap"><div class="lnd-lib-prog-fill" style="width:'+pct+'%"></div></div></div>'+
      '<div class="lnd-lib-title">'+esc(title)+'</div><div class="lnd-lib-sub">'+(book.finished?'✓ Bitti':pct>0?'%'+pct+' okundu':nf(book.wordCount)+' kelime')+'</div>';
    c.onclick=()=>{showBookDetail(book.id);};
    grid.appendChild(c);
  });
}
function renderContinue(){
  const box=$('lnd-continue');if(!box) return;
  const b=library.filter(x=>!x.finished&&x.lastReadAt).sort((a,c)=>c.lastReadAt-a.lastReadAt)[0];
  if(!b){box.innerHTML='';return;}
  const {title}=splitTitle(b.title),pct=bookPct(b);
  const secs=bookSections(b);
  const si=secs.length?bsearch(secs.map(s=>s.start),b.progress||0):0;
  const s=secs[si];
  const rem=Math.max(0,goalSec()-todayLog().sec);
  box.innerHTML='<button class="continue-btn" onclick="continueLast('+b.id+')">'+
    '<div class="cb-cover" style="'+coverStyle(b)+'"></div>'+
    '<div class="cb-main"><div class="cb-k">Kaldığın yerden devam</div><div class="cb-t">'+esc(title)+'</div>'+
    '<div class="cb-s">%'+pct+(s&&secs.length>1?' · '+esc(s.title):'')+' · '+(MODE_NAMES[b.lastMode]||'')+(rem>0?' · bugün '+Math.ceil(rem/60)+' dk kaldı':' · bugünkü hedef tamam ✓')+'</div></div>'+
    '<div class="cb-go">▶</div></button>';
}
async function continueLast(id){
  const b=library.find(x=>x.id===id);if(!b) return;
  if(await openBook(id,null,b.lastMode)){hideLanding();beginReading();}
}
function renderToday(){
  const d=todayLog(),g=goalSec(),st=streakInfo();
  $('lnd-today-min').textContent=Math.floor(d.sec/60);
  $('lnd-today-goal').textContent='/ '+settings.goalMin+' dk';
  setRing($('lnd-ring'),d.sec/g,314.16);
  $('lnd-streak').textContent=st.cur+' gün';
  $('lnd-best').textContent=st.best+' gün';
  $('lnd-today-words').textContent=nf(d.words);
  /* son 7 gün */
  const names=['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
  let wk=0,h='';const max=Math.max(g,...Array.from({length:7},(_,i)=>{const x=new Date();x.setDate(x.getDate()-i);const l=dayLog[dayKey(x)];return l?l.sec:0;}));
  for(let i=6;i>=0;i--){
    const x=new Date();x.setDate(x.getDate()-i);const k=dayKey(x),l=dayLog[k],sec=l?l.sec:0;wk+=sec;
    h+='<div class="wb'+(i===0?' today':'')+'" title="'+x.toLocaleDateString('tr-TR')+': '+fmtMin(sec)+'"><i class="'+(dayMet(k)?'met':'')+'" style="height:'+Math.max(3,Math.round(sec/max*46))+'px"></i><span>'+names[x.getDay()]+'</span></div>';
  }
  $('lnd-week').innerHTML=h;
  $('lnd-week-min').textContent=fmtMin(wk);
  /* 18 haftalık ısı haritası (Pzt üstte) */
  const weeks=18,end=new Date();
  const start=new Date(end);start.setDate(start.getDate()-((end.getDay()+6)%7)-(weeks-1)*7);
  let hm='';
  for(let i=0;i<weeks*7;i++){
    const x=new Date(start);x.setDate(start.getDate()+i);
    if(x>end){hm+='<i class="fut"></i>';continue;}
    const l=dayLog[dayKey(x)],sec=l?l.sec:0;
    const lv=sec<=0?'':sec>=g?'l3':sec>=g/2?'l2':'l1';
    hm+='<i class="'+lv+'" title="'+x.toLocaleDateString('tr-TR')+': '+fmtMin(sec)+'"></i>';
  }
  $('lnd-heat').innerHTML=hm;
  $('lnd-goal-chips').innerHTML=[5,10,15,20,30,45,60].map(m=>'<button class="chip'+(m===settings.goalMin?' active':'')+'" onclick="setGoalMin('+m+')">'+m+' dk</button>').join('');
}

/* ══════════════════════════════════════════════════════════════
   23. KLAVYE · SÜRÜKLE-BIRAK · SEKME DEĞİŞİMİ
══════════════════════════════════════════════════════════════ */
function anyOverlayOpen(){
  return !$('landing').classList.contains('hidden')||$('lib-overlay').classList.contains('visible')||$('kat-overlay').classList.contains('visible')||$('kat-modal').classList.contains('visible')||
    $('book-detail').classList.contains('visible')||$('add-book-modal').classList.contains('visible');
}
function closeTopOverlay(){
  if($('timer-pop').classList.contains('visible')){$('timer-pop').classList.remove('visible');return;}
  if($('goal-overlay').classList.contains('visible')){goalContinue();return;}
  if($('toc-drawer').classList.contains('visible')){toggleToc(false);return;}
  if($('settings-panel').classList.contains('visible')){$('settings-panel').classList.remove('visible');return;}
  if($('kat-modal').classList.contains('visible')){closeKatDetail();return;}
  if($('add-book-modal').classList.contains('visible')){closeAddBookModal();return;}
  if($('book-detail').classList.contains('visible')){closeBookDetail();return;}
  if($('kat-overlay').classList.contains('visible')){closeKatalog();return;}
  if($('lib-overlay').classList.contains('visible')){toggleLibraryPanel(false);return;}
  if(document.body.classList.contains('sb-open')){document.body.classList.remove('sb-open');return;}
  if(focusMode){toggleFocusMode(false);return;}
}
document.addEventListener('keydown',e=>{
  const t=e.target;
  if(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable){if(e.key==='Escape')t.blur();return;}
  if(e.ctrlKey||e.metaKey||e.altKey) return;
  if(e.key==='Escape'){closeTopOverlay();return;}
  if(anyOverlayOpen()) return;
  if($('goal-overlay').classList.contains('visible')){if(e.code==='Space'||e.code==='Enter'){e.preventDefault();goalContinue();}return;}
  if(waitingCard&&(e.code==='Space'||e.code==='Enter'||e.code==='ArrowRight')){e.preventDefault();dismissChapterCard();return;}
  const k=e.key;
  if(e.code==='Space'){if(mode==='normal'&&running)return;e.preventDefault();togglePause();return;}
  if(k==='+'||k==='='){onWpmChange(getWpm()+25);toast('Hız: '+getWpm()+' k/dk',1200);return;}
  if(k==='-'||k==='_'){onWpmChange(getWpm()-25);toast('Hız: '+getWpm()+' k/dk',1200);return;}
  if(k==='b'||k==='B'){toggleToc();return;}
  if(k==='f'||k==='F'){toggleFocusMode();return;}
  if(k==='t'||k==='T'){toggleTimerPop();return;}
  if(k===']'){skipSection(1);return;}
  if(k==='['){skipSection(-1);return;}
  if(!running||mode==='normal') return;
  if(e.code==='ArrowRight'){e.preventDefault();skipWords(10);}
  if(e.code==='ArrowLeft'){e.preventDefault();skipWords(-10);}
  if((mode==='scroll'||mode==='tiktok')&&e.code==='ArrowDown'){e.preventDefault();skipWords(1);}
  if((mode==='scroll'||mode==='tiktok')&&e.code==='ArrowUp'){e.preventDefault();skipWords(-1);}
});
let dragDepth=0;
const hasFiles=e=>e.dataTransfer&&[...(e.dataTransfer.types||[])].includes('Files');
window.addEventListener('dragenter',e=>{if(hasFiles(e)){dragDepth++;$('drop-hint').classList.add('visible');}});
window.addEventListener('dragleave',e=>{if(hasFiles(e)){dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)$('drop-hint').classList.remove('visible');}});
window.addEventListener('dragover',e=>{if(hasFiles(e))e.preventDefault();});
window.addEventListener('drop',e=>{
  if(!hasFiles(e)) return;
  e.preventDefault();dragDepth=0;$('drop-hint').classList.remove('visible');
  const f=e.dataTransfer.files[0];if(!f) return;
  if(/\.pdf$/i.test(f.name)||f.type==='application/pdf') openPdfImport(f);
  else if(/\.(txt|md)$/i.test(f.name)||(f.type||'').startsWith('text/')) loadTxtFile(f);
  else toast('Sadece PDF veya TXT dosyası desteklenir.');
});
let hiddenPaused=false;
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    if(running&&!paused&&mode!=='normal'){setPaused(true);hiddenPaused=true;}
    saveProgress(true);saveLog();
  }else if(hiddenPaused){
    hiddenPaused=false;toast('Sekme değiştiği için duraklatıldı — devam için Space',3500);
  }
});
window.addEventListener('pagehide',()=>{saveProgress(true);saveLog();});
window.addEventListener('resize',()=>{if(running&&mode==='scroll')renderScroll();});

/* ══════════════════════════════════════════════════════════════
   24. BAŞLAT
══════════════════════════════════════════════════════════════ */
(async function init(){
  $('wpm-sl').value=settings.wpm;$('wpm-lbl').textContent=settings.wpm;
  $('fs-sl').value=settings.fs;$('fs-lbl').textContent=settings.fs+'px';
  if(settings.theme==='custom'&&settings.custom){$('custom-bg-input').value=settings.custom.bg;$('custom-text-input').value=settings.custom.tx;applyCustomTheme(settings.custom.bg,settings.custom.tx);}
  else applyTheme(activeThemeKey);
  applyFont(activeFontKey);
  if(settings.ambient) toggleAmbient(true);
  updateModeUI();setSrc('text');
  hideAll();showEl('idle','block');updateIdle();
  updateTimerUI();
  showLanding();
  await initLibrary();
  renderAllLibraries();renderToday();renderLndKatalog();handleKitapParam();
})();
