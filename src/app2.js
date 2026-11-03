
/* ══════════════════════════════════════════════════════════════
   6. KÜTÜPHANE VERİSİ
══════════════════════════════════════════════════════════════ */
let library=[];
const NUTUK_ID=1000000001;
const DELETED_KEY='turkerokuma_deleted_builtin';
let libraryReady=false;

function newId(){let id=Date.now();while(library.some(b=>b.id===id))id++;return id;}
function buildMeta(title,text,extra){
  const prep=prepareText(text);
  const meta=Object.assign({
    id:newId(),title:String(title||'Adsız').trim(),wordCount:prep.words.length,progress:0,
    chapters:null,savedAt:new Date().toLocaleDateString('tr-TR'),addedAt:Date.now(),
    wishlist:false,favorite:false,finished:false,lastReadAt:0,split:'chapters'
  },extra||{});
  if(!meta.chapters) meta.chapters=detectChaptersAuto(prep);
  meta.wordCount=prep.words.length;
  return meta;
}
async function initLibrary(){
  await Store.init();
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}
  library=await Store.allMeta();
  /* Eski sürümden (localStorage) taşı */
  const old=LS.get('turkerokuma_lib',null);
  if(Array.isArray(old)&&old.length){
    for(const b of old){
      if(!b||!b.text||library.some(x=>x.id===b.id)) continue;
      let text=b.text;
      if(b.id===NUTUK_ID) text=text.replace(/^1 NUTUK Mustafa Kemal ATATÜRK /,'');
      const meta=buildMeta(b.title,text,{
        id:b.id,savedAt:b.savedAt||'',addedAt:b.id<1e12?0:b.id,
        wishlist:!!b.wishlist,favorite:!!b.favorite,coverUrl:b.coverUrl||undefined,builtin:b.id===NUTUK_ID
      });
      meta.progress=clamp(b.progress||0,0,meta.wordCount);
      if(meta.progress>0) meta.lastReadAt=1;
      library.push(meta);
      await Store.saveText(meta.id,text);
      await Store.saveMeta(meta);
    }
    if(DB.db) LS.del('turkerokuma_lib');
  }
  /* Hazır kitap: Nutuk (silindiyse geri gelmez) */
  const deleted=LS.get(DELETED_KEY,[]);
  if(!window.NO_BUILTIN&&!library.some(b=>b.id===NUTUK_ID)&&!deleted.includes(NUTUK_ID)){
    try{
      const el=$('builtin-nutuk');
      const d=el?JSON.parse(el.textContent):await (await fetch('nutuk.json')).json();
      const text=d.text.replace(/^1 NUTUK Mustafa Kemal ATATÜRK /,'');
      const meta=buildMeta(d.title,text,{id:NUTUK_ID,savedAt:d.savedAt,addedAt:0,builtin:true});
      library.push(meta);
      await Store.saveText(meta.id,text);
      await Store.saveMeta(meta);
    }catch(e){console.warn('Nutuk yüklenemedi',e);}
  }
  /* anlık ilerleme yedeğini uygula */
  const pm=LS.get('turkerokuma_prog',{});
  for(const b of library){
    const r=pm[b.id];
    if(r&&r[1]>(b.lastReadAt||0)){b.progress=clamp(r[0],0,b.wordCount);b.lastReadAt=r[1];b.lastMode=r[2]||b.lastMode;if(r[3])b.finished=true;Store.saveMeta(b);}
  }
  libraryReady=true;
}
function sortedLibrary(){
  return [...library].sort((a,b)=>(b.lastReadAt||0)-(a.lastReadAt||0)||(b.addedAt||0)-(a.addedAt||0));
}
async function addBookFromText(title,text,extra){
  title=String(title||'').trim()||'Adsız Metin';
  text=cleanIncomingText(text);
  const same=library.find(b=>b.title===title);
  if(same&&!confirm('"'+title+'" adında bir kitap zaten var. Üzerine yazılsın mı? (İlerleme sıfırlanır)')){
    title=title+' ('+new Date().toLocaleDateString('tr-TR')+')';
  }else if(same){
    await removeBook(same.id,true);
  }
  const meta=buildMeta(title,text,extra);
  if(meta.wordCount<1){toast('Metinde okunacak kelime bulunamadı.');return null;}
  library.unshift(meta);
  await Store.saveText(meta.id,text);
  await Store.saveMeta(meta);
  renderAllLibraries();
  autoFetchCover(meta.id,title);
  return meta;
}
async function removeBook(id,silent){
  const b=library.find(x=>x.id===id);
  if(!b) return;
  if(b.builtin){const d=LS.get(DELETED_KEY,[]);if(!d.includes(id)){d.push(id);LS.set(DELETED_KEY,d);}}
  library=library.filter(x=>x.id!==id);
  await Store.remove(id);
  if(curBook&&curBook.id===id){closeCurrentBook();}
  if(!silent) renderAllLibraries();
}

/* ══════════════════════════════════════════════════════════════
   7. BÖLÜMLER / GÜNLÜK PARÇALAR
══════════════════════════════════════════════════════════════ */
function partSize(){return Math.max(300,Math.round(getWpm()*settings.goalMin));}
function sectionsFor(n,chapters,split){
  const ch=(chapters||[]).filter(c=>c.w>=0&&c.w<n).sort((a,b)=>a.w-b.w);
  let secs=[];
  if(split==='parts'||!ch.length){
    const per=partSize();
    for(let s=0,k=1;s<n;s+=per,k++) secs.push({start:s,title:k+'. parça',len:0,part:true});
  }else{
    if(ch[0].w>0) secs.push({start:0,title:'Başlangıç',len:0});
    for(const c of ch){
      if(secs.length&&secs[secs.length-1].start===c.w) continue;
      secs.push({start:c.w,title:c.title,len:c.len||0,chapter:true});
    }
  }
  for(let i=0;i<secs.length;i++) secs[i].end=i+1<secs.length?secs[i+1].start:n;
  return secs.filter(s=>s.end>s.start);
}
function bookSections(book){return sectionsFor(book.wordCount||0,book.chapters,book.split);}
/* Okurken: parça sınırlarını cümle sonuna hizala */
function alignParts(secs){
  for(let i=1;i<secs.length;i++){
    if(!secs[i].part) continue;
    const s=secs[i].start;
    for(let j=s-1;j<Math.min(words.length-1,s+250);j++){
      if(paraEnds.has(j)||SENT_END.test(words[j])){secs[i].start=j+1;break;}
    }
  }
  for(let i=0;i<secs.length;i++) secs[i].end=i+1<secs.length?secs[i+1].start:words.length;
  return secs.filter(s=>s.end>s.start);
}

/* ══════════════════════════════════════════════════════════════
   8. GÜNLÜK KAYIT · SERİ · ZAMANLAYICI
══════════════════════════════════════════════════════════════ */
const LOG_KEY='turkerokuma_log';
let dayLog=LS.get(LOG_KEY,{});
let logDirty=false,logSaveCount=0;
function todayLog(){const k=dayKey();if(!dayLog[k])dayLog[k]={sec:0,words:0};return dayLog[k];}
function saveLog(){LS.set(LOG_KEY,dayLog);logDirty=false;}
function goalSec(){return Math.max(60,settings.goalMin*60);}
function dayMet(k){const d=dayLog[k];return !!d&&(d.goalHit||d.sec>=goalSec());}
function keyToDate(k){const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d);}
function streakInfo(){
  let cur=0;const dt=new Date();
  if(!dayMet(dayKey(dt))) dt.setDate(dt.getDate()-1);
  while(dayMet(dayKey(dt))){cur++;dt.setDate(dt.getDate()-1);}
  const keys=Object.keys(dayLog).filter(dayMet).sort();
  let best=0,run=0,prev=null;
  for(const k of keys){
    const d=keyToDate(k);
    run=(prev&&Math.round((d-prev)/864e5)===1)?run+1:1;
    best=Math.max(best,run);prev=d;
  }
  return {cur,best:Math.max(best,cur)};
}

/* Zamanlayıcı: 'goal' = bugünkü hedefe kalan · 'custom' = N dk · 'off' = kronometre */
let timerMode='goal',customSec=0,customStart=0,customHit=false;
let sessionSec=0,sessionWords=0,lastLogIdx=0;
let goalPending=false,goalPendingSince=0,goalKind='goal';
let lastActivity=Date.now();
['mousemove','mousedown','keydown','wheel','touchstart','scroll'].forEach(ev=>
  window.addEventListener(ev,()=>{lastActivity=Date.now();},{passive:true,capture:true}));

function isActiveReading(){
  if(!running||paused||document.hidden) return false;
  if($('goal-overlay').classList.contains('visible')) return false;
  const recent=Date.now()-lastActivity<90000;
  if(mode==='normal'||waitingCard||twWaiting) return recent;
  return true;
}
function tick(){
  if(isActiveReading()){
    const d=todayLog();
    d.sec++;sessionSec++;logDirty=true;
    if(curBook){d.books=d.books||{};d.books[curBook.id]=(d.books[curBook.id]||0)+1;}
    checkTimers();
  }
  if(running){
    const delta=idx-lastLogIdx;
    if(delta>0&&delta<5000){todayLog().words+=delta;sessionWords+=delta;logDirty=true;}
    lastLogIdx=idx;
  }
  updateTimerUI();
  updateSessionStats();
  if(logDirty&&(++logSaveCount%5===0)) saveLog();
}
setInterval(tick,1000);

function checkTimers(){
  const d=todayLog();
  if(!d.goalHit&&d.sec>=goalSec()){d.goalHit=true;saveLog();onTimerReached('goal');}
  if(timerMode==='custom'&&!customHit&&sessionSec-customStart>=customSec){customHit=true;onTimerReached('custom');}
}
function onTimerReached(kind){
  goalKind=kind;
  if(settings.chime) chime();
  flashTitle(kind==='goal'?'✓ Hedef tamam!':'⏰ Süre doldu');
  if(!settings.stopAtGoal){
    toast(kind==='goal'?'🎉 Bugünkü '+settings.goalMin+' dakikalık hedef tamam!':'⏰ Zamanlayıcı bitti.',4500);
    if(kind==='custom') timerMode='off';
    return;
  }
  if(mode==='normal'||!running){showGoalOverlay();return;}
  goalPending=true;goalPendingSince=Date.now();
}
/* Okuma motoru her kelime/satır sonunda çağırır: cümle bitince dur */
function checkGoalStop(w){
  if(!goalPending) return false;
  if(!w||SENT_END.test(w)||Date.now()-goalPendingSince>25000){
    goalPending=false;
    setPaused(true);
    showGoalOverlay();
    return true;
  }
  return false;
}
function showGoalOverlay(){
  const d=todayLog(),st=streakInfo();
  const wpm=sessionSec>20?Math.round(sessionWords/(sessionSec/60)):0;
  if(goalKind==='goal'){
    $('goal-emoji').textContent='🎉';
    $('goal-title').textContent='Bugünkü hedef tamam!';
    $('goal-sub').innerHTML='Bugün <b>'+fmtMin(d.sec)+'</b> okudun.'+(st.cur>1?' Serin <b>'+st.cur+' gün</b> oldu 🔥':' Yarın da gel, seri başlasın 🔥');
  }else{
    $('goal-emoji').textContent='⏰';
    $('goal-title').textContent='Süre doldu';
    $('goal-sub').innerHTML='<b>'+Math.round(customSec/60)+' dakikalık</b> oturum tamamlandı.';
  }
  $('goal-stats').innerHTML=
    '<div class="goal-stat"><b>'+fmtMin(d.sec)+'</b><span>bugün</span></div>'+
    '<div class="goal-stat"><b>'+nf(d.words)+'</b><span>bugün kelime</span></div>'+
    (wpm?'<div class="goal-stat"><b>'+wpm+'</b><span>k/dk</span></div>':'')+
    '<div class="goal-stat"><b>'+st.cur+'</b><span>gün seri</span></div>';
  $('goal-overlay').classList.add('visible');
  saveProgress(true);
}
function goalContinue(){
  $('goal-overlay').classList.remove('visible');
  if(goalKind==='custom') timerMode='off';
  if(running&&paused&&mode!=='normal') setPaused(false);
}
function goalFinish(){
  $('goal-overlay').classList.remove('visible');
  if(goalKind==='custom') timerMode='goal';
  saveProgress(true);
  showLanding();
}
let titleT=null;
function flashTitle(msg){
  clearInterval(titleT);let n=0;
  titleT=setInterval(()=>{document.title=(n%2?'HızlıKitapOku':msg);if(++n>9){clearInterval(titleT);document.title='HızlıKitapOku';}},900);
}
function chime(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    const ac=new AC(),t=ac.currentTime;
    [523.25,659.25,783.99,1046.5].forEach((f,i)=>{
      const o=ac.createOscillator(),g=ac.createGain(),s=t+i*.16;
      o.type='sine';o.frequency.value=f;
      g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(.16,s+.02);g.gain.exponentialRampToValueAtTime(.001,s+1.3);
      o.connect(g);g.connect(ac.destination);o.start(s);o.stop(s+1.4);
    });
    setTimeout(()=>ac.close(),2800);
  }catch(e){}
}
function setRing(el,frac,len){if(el)el.style.strokeDashoffset=String(len*(1-clamp(frac,0,1)));}
function updateTimerUI(){
  const d=todayLog(),g=goalSec();
  let txt,lbl,frac=0,done=false;
  if(timerMode==='custom'){
    const el=sessionSec-customStart,rem=customSec-el;frac=el/customSec;
    if(rem>0){txt=fmtClock(rem);lbl='kaldı';}else{txt='+'+fmtClock(-rem);lbl='ek süre';done=true;}
  }else if(timerMode==='off'){
    txt=fmtClock(sessionSec);lbl='oturum';frac=0;
  }else{
    const rem=g-d.sec;frac=d.sec/g;
    if(rem>0){txt=fmtClock(rem);lbl='hedefe';}else{txt='+'+fmtClock(-rem);lbl='bugün ekstra';done=true;}
  }
  $('timer-txt').textContent=txt;$('timer-lbl').textContent=lbl;
  $('timer-pill').classList.toggle('done',done);
  setRing($('timer-ring'),frac,59.69);
  /* kenar çubuğu */
  const st=streakInfo();
  $('sb-today').textContent=Math.floor(d.sec/60)+' / '+settings.goalMin+' dk';
  $('sb-streak').textContent='🔥 '+st.cur+' gün seri';
  setRing($('sb-ring'),d.sec/g,59.69);
  if($('timer-pop').classList.contains('visible')) renderTimerPopToday();
}
function updateSessionStats(){
  if(!sessionSec&&!sessionWords){return;}
  $('st-time').textContent=fmtClock(sessionSec);
  $('st-words').textContent=nf(sessionWords);
  $('st-wpm').textContent=sessionSec>15?Math.round(sessionWords/(sessionSec/60)):'—';
}
function toggleTimerPop(e){
  if(e) e.stopPropagation();
  const p=$('timer-pop');
  if(p.classList.contains('visible')){p.classList.remove('visible');return;}
  const r=$('timer-pill').getBoundingClientRect();
  p.style.top=(r.bottom+8)+'px';
  p.style.left=clamp(r.right-290,8,window.innerWidth-298)+'px';
  const presets=[['goal','Hedefe kalan'],[5,'5 dk'],[10,'10 dk'],[15,'15 dk'],[20,'20 dk'],[30,'30 dk'],[45,'45 dk'],[60,'60 dk'],['off','Kronometre']];
  const curMin=timerMode==='custom'?Math.round(customSec/60):null;
  $('tpop-chips').innerHTML=presets.map(([v,l])=>{
    const act=(v==='goal'&&timerMode==='goal')||(v==='off'&&timerMode==='off')||(typeof v==='number'&&timerMode==='custom'&&curMin===v);
    return '<button class="chip'+(act?' active':'')+'" onclick="setTimerPreset(\''+v+'\')">'+l+'</button>';
  }).join('');
  renderTimerPopToday();
  p.classList.add('visible');
}
function renderTimerPopToday(){
  const d=todayLog(),st=streakInfo();
  $('tpop-today').innerHTML='Okunan: <b>'+fmtMin(d.sec)+'</b> / '+settings.goalMin+' dk · '+nf(d.words)+' kelime<br>Seri: <b>'+st.cur+' gün</b> 🔥 (en uzun '+st.best+')';
}
function setTimerPreset(v){
  if(v==='goal'){timerMode='goal';}
  else if(v==='off'){timerMode='off';}
  else setTimerCustom(v);
  $('timer-pop').classList.remove('visible');
  updateTimerUI();
}
function setTimerCustom(min){
  min=parseInt(min,10);
  if(!min||min<1){toast('Geçerli bir dakika gir.');return;}
  timerMode='custom';customSec=min*60;customStart=sessionSec;customHit=false;
  $('timer-pop').classList.remove('visible');
  updateTimerUI();
  toast('⏱ '+min+' dakikalık zamanlayıcı başladı');
}
function setGoalMin(v){
  v=clamp(parseInt(v,10)||15,1,600);
  settings.goalMin=v;saveSettings();
  const d=todayLog();
  if(d.sec<goalSec()) d.goalHit=false;
  saveLog();
  if($('set-goal')) $('set-goal').value=v;
  if(words.length) rebuildStructure();
  updateTimerUI();
  if(!$('landing').classList.contains('hidden')) renderToday();
}
