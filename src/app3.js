
/* ══════════════════════════════════════════════════════════════
   9. OKUMA MOTORU — durum
══════════════════════════════════════════════════════════════ */
let mode=MODE_NAMES[settings.mode]?settings.mode:'rsvp', src='text';
let words=[], paraEnds=new Set(), flatText=false;
let idx=0, timer=null, paused=false, running=false, finished=false;
let curBook=null, curChapters=[], adhocSplit='chapters';
let sections=[], sectionStarts=[0], chapterAt=new Map(), chapterTotal=0, cardStarts=[];
let waitingCard=false, lastCardAt=-1;
let urlText='';
let scrollAC=null, cardAC=null, normalAC=null;

function getWpm(){return parseInt($('wpm-sl').value,10)||300;}
function getFs(){return parseInt($('fs-sl').value,10)||32;}
function msPerWord(){return 60000/getWpm();}
function showEl(id,d){$(id).style.display=d||'flex';}
function hideAll(){
  ['idle','rsvp','typewriter','bionic','scroll-outer','tiktok','normal'].forEach(id=>{const el=$(id);if(el)el.style.display='none';});
  $('done-overlay').classList.remove('visible');
  hideChapterCard();
}
function loadWords(text){
  const p=prepareText(text);
  words=p.words;paraEnds=p.paraEnds;
  flatText=paraEnds.size<words.length/400;
}
function curSplit(){return curBook?(curBook.split||'chapters'):adhocSplit;}
function rebuildStructure(){
  sections=sectionsFor(words.length,curChapters,curSplit());
  if(sections.some(s=>s.part)) sections=alignParts(sections);
  if(!sections.length) sections=[{start:0,end:words.length,title:'Metin',len:0}];
  sectionStarts=sections.map(s=>s.start);
  chapterAt=new Map();chapterTotal=0;
  sections.forEach(s=>{if(s.chapter){chapterTotal++;chapterAt.set(s.start,{w:s.start,len:s.len,title:s.title,n:chapterTotal});}});
  cardStarts=buildCardStarts();
  lastSecShown=-1;
  $('toc-btn').style.display=sections.length>1?'':'none';
}
function sectionIndexOf(i){return bsearch(sectionStarts,i);}
function nextSectionStart(from){const k=sectionIndexOf(from);return k+1<sections.length?sections[k+1].start:words.length;}
/* Kart sınırları: 10–22 kelime, cümle/paragraf sonunda kes; bölüm başında yeni kart */
function buildCardStarts(){
  const s=[0];let c=0;const secSet=new Set(sectionStarts);
  for(let i=0;i<words.length-1;i++){
    c++;
    const end=paraEnds.has(i)||SENT_END.test(words[i]);
    if(secSet.has(i+1)||(c>=10&&end)||c>=22||(paraEnds.has(i)&&c>=5)){s.push(i+1);c=0;}
  }
  return s;
}
/* Sayfa sonu: boyut kadar, bölüm başında kes, mümkünse cümle sonunda bitir */
function pageEnd(from,size){
  let e=Math.min(words.length,from+size);
  const ns=nextSectionStart(from);
  if(ns>from&&ns<=e) return ns;
  if(e<words.length){
    for(let i=e-1;i>from+size*0.6;i--){if(paraEnds.has(i)||SENT_END.test(words[i])){e=i+1;break;}}
  }
  return e;
}
/* Kaldığı yerden devam: cümle başına geri sar */
function resumePoint(p){
  p=clamp(p||0,0,Math.max(0,words.length-1));
  for(let i=p-1;i>=Math.max(0,p-40);i--){if(paraEnds.has(i)||SENT_END.test(words[i]))return i+1;}
  return Math.max(0,p-8);
}

/* ── İlerleme göstergeleri ── */
let lastSecShown=-1,lastPageTxt='';
function setProgressUI(){
  const n=words.length;
  $('progress-bar').style.width=(n?clamp(idx/n*100,0,100):0)+'%';
  updatePageBadge();
  updatePeek();
  const si=sectionIndexOf(idx);
  if(si!==lastSecShown){
    lastSecShown=si;
    const s=sections[si];
    $('sec-name').textContent=s&&sections.length>1?'§ '+s.title+' ('+(si+1)+'/'+sections.length+')':'';
    $('sec-name').title=s?s.title:'';
    updateCurBookCard();
    if($('toc-drawer').classList.contains('visible')) renderTocDrawer();
  }
}
function updatePageBadge(){
  if(!words.length){$('page-badge').style.display='none';return;}
  let cur,tot,unit='sayfa';
  const pm=curBook&&curBook.pageMap;
  if(pm&&pm.starts&&pm.starts.length){
    cur=pm.first+bsearch(pm.starts,idx);tot=curBook.pages||pm.first+pm.starts.length-1;
  }else{
    const wpp=280;tot=Math.max(1,Math.ceil(words.length/wpp));cur=clamp(Math.ceil((idx+1)/wpp),1,tot);unit='~sayfa';
  }
  const t=cur+'|'+tot;
  if(t!==lastPageTxt){lastPageTxt=t;$('pb-cur').textContent=cur;$('pb-tot').textContent=tot;$('pb-unit').textContent=unit;}
  $('page-badge').style.display='flex';
}
function updateCurBookCard(){
  const box=$('cur-book');
  if(!curBook){box.classList.remove('visible');$('source-panel').style.display='';return;}
  box.classList.add('visible');$('source-panel').style.display='none';
  $('cbk-title').textContent=curBook.title.split('—')[0].trim();
  const pct=words.length?Math.round(idx/words.length*100):0;
  const si=sectionIndexOf(idx),s=sections[si];
  $('cbk-sub').textContent='%'+pct+(s&&sections.length>1?' · '+(si+1)+'/'+sections.length+' '+(s.part?'parça':'bölüm'):'');
}
function updateModeUI(){
  document.querySelectorAll('.mode-tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  document.querySelectorAll('.lnd-mode-pill').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  $('mode-name').textContent=MODE_NAMES[mode]||mode;
}
function updatePauseUI(){
  const ic=paused||!running?'▶':'⏸';
  ['pp-btn','tw-pp-btn','bio-pp-btn','tt-pp-btn','scroll-pp-btn'].forEach(id=>{const el=$(id);if(el)el.textContent=ic;});
  const fp=$('float-pause');fp.textContent=ic;$('mb-play').textContent=ic;keepAwake(running&&!paused);fp.classList.toggle('paused',paused);
  fp.style.display=running&&mode!=='normal'?'flex':'none';
  const spb=$('sidebar-pause-btn');
  spb.style.display=running&&mode!=='normal'?'':'none';
  spb.textContent=paused?'▶  Devam Et':'⏸  Duraklat';
  $('start-btn').textContent=running?(paused?'▶  Devam Et':'● Okunuyor'):(curBook&&curBook.progress>0&&!curBook.finished?'▶  Kaldığım Yerden Devam':'▶  Okumaya Başla');
}
function updateIdle(){
  const p=$('idle').querySelector('p');
  if(curBook){
    const pct=words.length?Math.round(idx/words.length*100):0;
    p.innerHTML='<b>'+esc(curBook.title.split('—')[0].trim())+'</b><br>%'+pct+' okundu. Devam etmek için <span class="kbd">Space</span> ya da ▶ Okumaya Başla.';
  }else p.textContent='Metin yapıştır, URL gir, PDF yükle ya da kütüphaneden bir kitap seç — ardından okumaya başla.';
}

/* ── Başlat / durdur ── */
function canAdvance(){return running&&!paused&&!waitingCard&&!$('goal-overlay').classList.contains('visible');}
function stopEngine(){
  clearTimeout(timer);timer=null;twWaiting=false;
  [scrollAC,cardAC,normalAC].forEach(a=>{if(a)a.abort();});
  scrollAC=cardAC=normalAC=null;
  hideChapterCard();
}
function setMode(m){
  if(!MODE_NAMES[m]) return;
  const was=running;
  if(was){saveProgress();stopEngine();}
  mode=m;settings.mode=m;saveSettings();updateModeUI();
  if(was){startMode();updatePauseUI();}
}
function setSrc(s){
  src=s;
  document.querySelectorAll('#source-panel .src-tab').forEach((b,i)=>b.classList.toggle('active',['text','url','pdf'][i]===s));
  document.querySelectorAll('#source-panel .src-panel').forEach(p=>p.classList.remove('active'));
  $('src-'+s).classList.add('active');
  $('sb-save-row').style.display=s==='pdf'?'none':'';
}
function getSourceText(){
  if(src==='text') return $('text-input').value.trim();
  if(src==='url') return urlText;
  return '';
}
function startReading(){
  if(running){if(paused)setPaused(false);return;}
  if(curBook&&words.length){
    if(finished||idx>=words.length-1){idx=0;}
    beginReading();return;
  }
  const t=getSourceText();
  if(!t){toast(src==='pdf'?'PDF yükle — kütüphaneye eklenip açılacak.':'Önce bir metin gir ya da kütüphaneden bir kitap seç.');return;}
  curBook=null;
  loadWords(cleanIncomingText(t));
  if(!words.length){toast('Metinde okunacak kelime bulunamadı.');return;}
  curChapters=detectChaptersAuto({words,paraEnds});
  rebuildStructure();idx=0;
  beginReading();
}
function beginReading(){
  stopEngine();hideAll();
  document.body.classList.remove('sb-open');
  running=true;paused=false;finished=false;goalPending=false;lastCardAt=-1;
  sessionSec=0;sessionWords=0;lastLogIdx=idx;
  if(timerMode==='custom'){customStart=0;customHit=false;}
  if(curBook){curBook.lastReadAt=Date.now();curBook.lastMode=mode;saveMetaSoon(curBook);}
  updateModeUI();updateCurBookCard();
  startMode();updatePauseUI();
}
function startMode(){
  hideAll();
  idx=clamp(idx,0,Math.max(0,words.length-1));
  lastSecShown=-1;
  ({rsvp:startRSVP,typewriter:startTW,bionic:startBionic,scroll:startScroll,tiktok:startCards,normal:startNormal})[mode]();
  setProgressUI();updatePauseUI();
}
function resumeTick(){
  ({rsvp:stepRSVP,typewriter:stepTW,bionic:stepBionic,scroll:scrollTick,tiktok:cardTick,normal:()=>{}})[mode]();
}
function setPaused(p){
  if(!running) return;
  paused=!!p;
  clearTimeout(timer);
  updatePauseUI();
  if(paused) saveProgress(true);
  else{lastActivity=Date.now();resumeTick();}
}
function togglePause(){
  if(!running){startReading();return;}
  if(mode==='normal') return;
  if(waitingCard){dismissChapterCard();return;}
  if($('goal-overlay').classList.contains('visible')){goalContinue();return;}
  if(twWaiting&&mode==='typewriter'){if(paused){paused=false;updatePauseUI();}twNextPage();return;}
  setPaused(!paused);
}
function resetReading(){
  saveProgress(true);
  stopEngine();
  running=false;paused=false;waitingCard=false;goalPending=false;
  hideAll();showEl('idle','block');
  $('page-badge').style.display='none';
  if(!curBook){$('progress-bar').style.width='0%';$('sec-name').textContent='';}
  updatePauseUI();updateIdle();updateCurBookCard();
}
function closeCurrentBook(){
  saveProgress(true);
  stopEngine();running=false;paused=false;
  curBook=null;words=[];paraEnds=new Set();curChapters=[];sections=[];sectionStarts=[0];chapterAt=new Map();idx=0;
  $('toc-btn').style.display='none';$('sec-name').textContent='';
  hideAll();showEl('idle','block');$('progress-bar').style.width='0%';$('page-badge').style.display='none';updatePeek();
  updatePauseUI();updateIdle();updateCurBookCard();
}
function restartFromBeginning(){
  if(!words.length){showLanding();return;}
  idx=0;finished=false;beginReading();
}
function finishReading(){
  if(finished) return;
  finished=true;clearTimeout(timer);
  idx=words.length;setProgressUI();
  if(curBook){
    curBook.progress=words.length;curBook.finished=true;curBook.finishedAt=Date.now();
    saveMetaSoon(curBook,true);
  }
  tick();
  running=false;paused=false;updatePauseUI();
  $('done-title').textContent=curBook?'🎉 Kitap bitti!':'Tamamlandı!';
  const wpm=sessionSec>15?Math.round(sessionWords/(sessionSec/60)):0;
  $('done-stats').textContent='Bu oturum: '+nf(sessionWords)+' kelime · '+fmtMin(sessionSec)+(wpm?' · '+wpm+' k/dk':'');
  $('done-overlay').classList.add('visible');
}
function saveProgress(now){
  if(!curBook||!words.length) return;
  const p=finished?words.length:clamp(idx,0,words.length);
  if(curBook.progress!==p||now){
    curBook.progress=p;curBook.lastReadAt=Date.now();curBook.lastMode=mode;
    saveMetaSoon(curBook,now);
    /* anında yazılan yedek: sayfa kapanırken veritabanı yazması yetişmezse */
    const pm=LS.get('turkerokuma_prog',{});pm[curBook.id]=[p,curBook.lastReadAt,mode,!!curBook.finished];LS.set('turkerokuma_prog',pm);
  }
}
setInterval(()=>{if(running)saveProgress();},5000);

/* ── Atlama ── */
function jumpTo(i){
  if(!words.length) return;
  i=clamp(i,0,words.length-1);
  lastCardAt=-1;
  if(!running){idx=i;beginReading();return;}
  clearTimeout(timer);hideChapterCard();
  idx=i;finished=false;lastSecShown=-1;lastLogIdx=i;
  saveProgress(true);
  if(mode==='scroll'){sc.si=Math.floor(i/SC);renderScroll(true);if(canAdvance())scrollTick();}
  else if(mode==='normal'){renderNormalSection(sectionIndexOf(i),i);lastLogIdx=idx;}
  else if(mode==='tiktok'){cd.ti=bsearch(cardStarts,i);cd.els.forEach(el=>el.remove());cd.els.clear();renderCards();if(canAdvance())cardTick();}

  else startMode();
  setProgressUI();
}
function skipWords(n){
  if(!running) return;
  if(mode==='scroll') return scrollMove(n>0?Math.max(1,Math.round(n/10)):Math.min(-1,Math.round(n/10)));
  if(mode==='tiktok') return cardMove(n>0?Math.max(1,Math.round(n/10)):Math.min(-1,Math.round(n/10)));
  if(mode==='normal') return;
  jumpTo(idx+n);
}
function skipSection(d){
  if(!words.length) return;
  const si=sectionIndexOf(idx);
  if(d<0&&idx-sections[si].start>30) return jumpTo(sections[si].start);
  const t=clamp(si+d,0,sections.length-1);
  jumpTo(sections[t].start);
  toast('§ '+sections[t].title);
}

/* ══════════════════════════════════════════════════════════════
   10. BÖLÜM KARTI
══════════════════════════════════════════════════════════════ */
function showChapterCard(ch){
  waitingCard=true;lastCardAt=ch.w;clearTimeout(timer);
  const s=sections[sectionIndexOf(ch.w)];
  $('ch-label').textContent='Bölüm '+ch.n+' / '+chapterTotal;
  $('ch-title-text').textContent=ch.title;
  const pct=words.length?Math.round(ch.w/words.length*100):0;
  $('ch-word-pos').textContent='Kitabın %'+pct+"'i · bu bölüm "+nf(s.end-s.start)+' kelime, ~'+fmtWordsTime(s.end-s.start);
  const card=$('chapter-card');card.classList.add('visible');card.onclick=dismissChapterCard;
  setProgressUI();
}
function hideChapterCard(){
  waitingCard=false;
  const c=$('chapter-card');c.classList.remove('visible');c.onclick=null;
}
function dismissChapterCard(){
  if(!waitingCard) return;
  const ch=chapterAt.get(lastCardAt);
  hideChapterCard();
  if(ch&&ch.len) idx=ch.w+ch.len;
  if(canAdvance()) resumeTick();
}

/* ══════════════════════════════════════════════════════════════
   11. RSVP — odak harfi hizalı
══════════════════════════════════════════════════════════════ */
function orpIndex(w){
  const lead=(w.match(/^[^0-9A-Za-zÀ-ɏ]*/)||[''])[0].length;
  const trail=(w.match(/[^0-9A-Za-zÀ-ɏ]*$/)||[''])[0].length;
  const L=Math.max(1,w.length-lead-trail);
  const o=L<=1?0:L<=5?1:L<=9?2:L<=13?3:4;
  return clamp(lead+o,0,w.length-1);
}
function renderRsvpWord(w){
  const o=orpIndex(w);
  $('rsvp-word').innerHTML='<span class="rw-l">'+esc(w.slice(0,o))+'</span><span class="focus-letter">'+esc(w[o]||'')+'</span><span class="rw-r">'+esc(w.slice(o+1))+'</span>';
}
function wordDelay(w,i){
  let d=msPerWord();
  if(w.length>8) d*=1.25;
  if(w.length>13) d*=1.15;
  if(SENT_END.test(w)) d*=1.9;
  else if(/[,;:]["'»”)]*$/.test(w)) d*=1.35;
  if(paraEnds.has(i)) d*=1.35;
  return Math.round(d);
}
function startRSVP(){
  showEl('rsvp');
  $('rsvp-word').style.fontSize=getFs()+'px';
  if(!canAdvance()){renderRsvpWord(words[idx]||'');rsvpCtx(idx);return;}
  stepRSVP();
}
function rsvpCtx(i){
  const before=words.slice(Math.max(0,i-4),i).join(' ');
  const after=words.slice(i+1,i+5).join(' ');
  $('rsvp-ctx').textContent=(before?'…'+before+' ':'')+' ___ '+(after?' '+after+'…':'');
  $('rsvp-count').textContent=nf(i+1)+' / '+nf(words.length);
}
function stepRSVP(){
  clearTimeout(timer);
  if(!canAdvance()) return;
  if(idx>=words.length){finishReading();return;}
  const ch=chapterAt.get(idx);
  if(ch&&lastCardAt!==idx){showChapterCard(ch);return;}
  const w=words[idx];
  renderRsvpWord(w);rsvpCtx(idx);
  const d=wordDelay(w,idx);
  idx++;setProgressUI();
  if(checkGoalStop(w)) return;
  timer=setTimeout(stepRSVP,d);
}

/* ══════════════════════════════════════════════════════════════
   12. HARF HARF — sayfa sayfa
══════════════════════════════════════════════════════════════ */
const TW_PAGE=110;
const tw={start:0,end:0,text:'',starts:[],pos:0,k:0};
function startTW(){
  showEl('typewriter','block');
  $('tw-text').style.fontSize=getFs()+'px';
  twLoadPage(idx);
  stepTW();
}
let twWaiting=false;
/* Sayfa bitti: kullanıcı Space'e basana kadar bekle */
function twWaitPage(){
  twWaiting=true;clearTimeout(timer);
  const n=$('tw-note');n.textContent='✓ Sayfa bitti — devam etmek için Space’e bas ya da tıkla';n.classList.add('wait');
}
function twNextPage(){
  if(!twWaiting) return;
  twWaiting=false;lastActivity=Date.now();
  twLoadPage(idx);
  if(canAdvance()) stepTW();
}
function twLoadPage(from){
  twWaiting=false;$('tw-note').classList.remove('wait');
  tw.start=from;tw.end=pageEnd(from,TW_PAGE);
  let s='';const st=[];
  for(let i=from;i<tw.end;i++){st.push(s.length);s+=words[i];if(i<tw.end-1)s+=paraEnds.has(i)?'\n\n':' ';}
  tw.text=s;tw.starts=st;tw.pos=0;tw.k=0;
  $('tw-text').innerHTML='<span id="tw-typed"></span><span class="cursor"></span>';
  $('typewriter').scrollTop=0;
  $('tw-note').textContent=pageNote(from,tw.end);
}
function pageNote(a,b){
  const s=sections[sectionIndexOf(a)];
  return (s&&sections.length>1?s.title+' · ':'')+nf(a+1)+'–'+nf(b)+' / '+nf(words.length)+' kelime';
}
function stepTW(){
  clearTimeout(timer);
  if(!canAdvance()) return;
  if(tw.pos>=tw.text.length){
    idx=tw.end;setProgressUI();
    if(idx>=words.length){finishReading();return;}
    if(checkGoalStop(null)) return;
    twWaitPage();
    return;
  }
  tw.pos++;
  $('tw-typed').textContent=tw.text.slice(0,tw.pos);
  while(tw.k+1<tw.starts.length&&tw.starts[tw.k+1]<=tw.pos) tw.k++;
  idx=tw.start+tw.k;setProgressUI();
  const box=$('typewriter');box.scrollTop=box.scrollHeight;
  const ch=tw.text[tw.pos-1];
  if(/[.!?…]/.test(ch)&&checkGoalStop(ch)) return;
  if(goalPending&&checkGoalStop('x')) return;
  const cpw=tw.text.length/Math.max(1,tw.end-tw.start);
  let d=Math.max(6,msPerWord()/cpw);
  if(/[.!?…]/.test(ch)) d*=4;else if(/[,;:]/.test(ch)) d*=2;else if(ch==='\n') d*=3;
  timer=setTimeout(stepTW,Math.round(d));
}

/* ══════════════════════════════════════════════════════════════
   13. BIONIC — sayfa sayfa
══════════════════════════════════════════════════════════════ */
const BIO_PAGE=140;
const bio={start:0,end:0,i:0,p:null};
function startBionic(){
  showEl('bionic','block');
  $('bio-text').style.fontSize=getFs()+'px';
  bioLoadPage(idx);
  if(!canAdvance()){bioRenderStatic();return;}
  stepBionic();
}
function bioLoadPage(from){
  bio.start=from;bio.end=pageEnd(from,BIO_PAGE);bio.i=from;
  $('bio-text').innerHTML='<p></p>';bio.p=$('bio-text').firstChild;
  $('bionic').scrollTop=0;
  $('bio-note').textContent=pageNote(from,bio.end);
}
function bioRenderStatic(){
  let h='<p>';
  for(let i=bio.start;i<bio.end;i++){h+=bionicWord(words[i])+' ';if(paraEnds.has(i)&&i<bio.end-1)h+='</p><p>';}
  $('bio-text').innerHTML=h+'</p>';
  const ps=$('bio-text').querySelectorAll('p');bio.p=ps[ps.length-1];bio.i=bio.end;
}
function bionicWord(w){
  const m=w.match(/^([^0-9A-Za-zÀ-ɏ]*)([\s\S]*)$/);
  const lead=m[1],core=m[2];
  const L=core.replace(/[^0-9A-Za-zÀ-ɏ]/g,'').length;
  const n=L<=3?1:L===4?2:Math.ceil(L*0.45);
  return esc(lead)+'<b>'+esc(core.slice(0,n))+'</b>'+esc(core.slice(n));
}
function stepBionic(){
  clearTimeout(timer);
  if(!canAdvance()) return;
  if(bio.i>=bio.end){
    idx=bio.end;setProgressUI();
    if(idx>=words.length){finishReading();return;}
    if(checkGoalStop(null)) return;
    timer=setTimeout(()=>{if(!canAdvance())return;bioLoadPage(idx);stepBionic();},1000);
    return;
  }
  const w=words[bio.i];
  bio.p.insertAdjacentHTML('beforeend',bionicWord(w)+' ');
  if(paraEnds.has(bio.i)&&bio.i<bio.end-1){const p=document.createElement('p');$('bio-text').appendChild(p);bio.p=p;}
  const box=$('bionic');box.scrollTop=box.scrollHeight;
  const d=wordDelay(w,bio.i);
  bio.i++;idx=bio.i;setProgressUI();
  if(checkGoalStop(w)) return;
  timer=setTimeout(stepBionic,d);
}

/* ══════════════════════════════════════════════════════════════
   14. SCROLL — sadece görünen satırlar çizilir (büyük kitapta donmaz)
══════════════════════════════════════════════════════════════ */
const SC=7;
const sc={si:0,total:0,w0:0,w1:0};
function startScroll(){
  showEl('scroll-outer','flex');
  sc.total=Math.max(1,Math.ceil(words.length/SC));
  sc.si=clamp(Math.floor(idx/SC),0,sc.total-1);
  $('scroll-inner').innerHTML='';
  renderScroll(true);
  initScrollEvents();
  scrollTick();
}
function renderScroll(force){
  const inner=$('scroll-inner'),fs=getFs();
  let rebuilt=false;
  if(force||!inner.children.length||sc.si<sc.w0+5||sc.si>=sc.w1-6){
    sc.w0=Math.max(0,sc.si-20);sc.w1=Math.min(sc.total,sc.si+40);
    let h='';
    for(let i=sc.w0;i<sc.w1;i++) h+='<div class="scroll-line">'+esc(words.slice(i*SC,i*SC+SC).join(' '))+'</div>';
    inner.style.transition='none';inner.innerHTML=h;rebuilt=true;
  }
  const lines=inner.children;
  for(let k=0;k<lines.length;k++){
    const d=Math.abs(sc.w0+k-sc.si);
    const cls='scroll-line'+(d===0?' active':d===1?' near':'');
    if(lines[k].className!==cls) lines[k].className=cls;
    const f=(d===0?fs:Math.max(12,fs-6))+'px';
    if(lines[k].style.fontSize!==f) lines[k].style.fontSize=f;
  }
  const act=lines[sc.si-sc.w0];
  if(act){
    const H=$('scroll').clientHeight||380;
    inner.style.transform='translateY('+(H/2-(act.offsetTop+act.offsetHeight/2))+'px)';
  }
  if(rebuilt){void inner.offsetHeight;inner.style.transition='';}
  idx=Math.min(sc.si*SC,words.length-1);
  $('scroll-count').textContent=nf(sc.si+1)+' / '+nf(sc.total);
  setProgressUI();
}
function scrollTick(){
  clearTimeout(timer);
  if(!canAdvance()) return;
  const a=sc.si*SC,n=Math.min(SC,words.length-a),lw=words[a+n-1]||'';
  let ms=msPerWord()*n;if(SENT_END.test(lw))ms*=1.15;
  timer=setTimeout(()=>{
    if(!canAdvance()) return;
    if(sc.si>=sc.total-1){idx=words.length;finishReading();return;}
    if(checkGoalStop(lw)) return;
    sc.si++;renderScroll();scrollTick();
  },Math.round(ms));
}
function scrollMove(d){
  sc.si=clamp(sc.si+d,0,sc.total-1);
  renderScroll();
  if(canAdvance()) scrollTick();
}
function initScrollEvents(){
  if(scrollAC) scrollAC.abort();
  scrollAC=new AbortController();const sig=scrollAC.signal;
  const el=$('scroll');let touchY=0,lastWheel=0,mouseY=0,drag=false;
  el.addEventListener('touchstart',e=>{touchY=e.touches[0].clientY;},{passive:true,signal:sig});
  el.addEventListener('touchmove',e=>{e.preventDefault();},{passive:false,signal:sig});
  el.addEventListener('touchend',e=>{const dy=touchY-e.changedTouches[0].clientY;if(Math.abs(dy)>=25)scrollMove(dy>0?1:-1);},{passive:true,signal:sig});
  el.addEventListener('wheel',e=>{e.preventDefault();const now=Date.now();if(now-lastWheel<200)return;lastWheel=now;scrollMove(e.deltaY>0?1:-1);},{passive:false,signal:sig});
  el.addEventListener('mousedown',e=>{mouseY=e.clientY;drag=true;},{signal:sig});
  window.addEventListener('mouseup',e=>{if(!drag)return;drag=false;const dy=mouseY-e.clientY;if(Math.abs(dy)>=20)scrollMove(dy>0?1:-1);},{signal:sig});
}

/* ══════════════════════════════════════════════════════════════
   15. KARTLAR — cümle sonunda bölünür, sadece 3 kart çizilir
══════════════════════════════════════════════════════════════ */
const cd={ti:0,els:new Map()};
function startCards(){
  showEl('tiktok');
  if(!cardStarts.length) cardStarts=buildCardStarts();
  cd.ti=bsearch(cardStarts,idx);
  $('tt-slide-wrap').innerHTML='';cd.els=new Map();
  renderCards();
  initCardSwipeEvents();
  cardTick();
}
function cardRange(k){return [cardStarts[k],k+1<cardStarts.length?cardStarts[k+1]:words.length];}
function fitCard(el,fs){
  const p=el.querySelector('p');let f=fs;p.style.fontSize=f+'px';
  const maxH=el.clientHeight-70;
  while(p.scrollHeight>maxH&&f>14){f-=2;p.style.fontSize=f+'px';}
}
function renderCards(){
  const wrap=$('tt-slide-wrap'),fs=getFs();
  for(const [k,el] of cd.els){if(Math.abs(k-cd.ti)>1){el.remove();cd.els.delete(k);}}
  for(let k=cd.ti-1;k<=cd.ti+1;k++){
    if(k<0||k>=cardStarts.length) continue;
    let el=cd.els.get(k);
    if(!el){
      el=document.createElement('div');el.className='tt-slide';el.style.transition='none';
      const [a,b]=cardRange(k);
      const sec=sections[sectionIndexOf(a)];
      const head=sec&&sec.start===a&&sections.length>1?'<div style="position:absolute;top:14px;left:0;right:0;text-align:center;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--accent);font-weight:700">'+esc(sec.title)+'</div>':'';
      el.innerHTML=head+'<p>'+esc(words.slice(a,b).join(' '))+'</p>';
      el.style.transform='translateY('+((k-cd.ti)*100)+'%)';
      wrap.appendChild(el);void el.offsetHeight;el.style.transition='';
      cd.els.set(k,el);fitCard(el,fs);
    }
    el.style.transform='translateY('+((k-cd.ti)*100)+'%)';
  }
  const dots=$('tt-dots');
  if(dots.children.length!==12){dots.innerHTML='';for(let i=0;i<12;i++){const d=document.createElement('div');d.className='tt-dot';dots.appendChild(d);}}
  [...dots.children].forEach((d,i)=>d.className='tt-dot'+(i===cd.ti%12?' active':''));
  $('tt-count').textContent=nf(cd.ti+1)+' / '+nf(cardStarts.length);
  idx=cardStarts[cd.ti]||0;setProgressUI();
}
function cardTick(){
  clearTimeout(timer);
  if(!canAdvance()) return;
  const [a,b]=cardRange(cd.ti),lw=words[b-1]||'';
  const ms=msPerWord()*(b-a)*1.08+250;
  timer=setTimeout(()=>{
    if(!canAdvance()) return;
    if(cd.ti>=cardStarts.length-1){idx=words.length;finishReading();return;}
    if(checkGoalStop(lw)) return;
    cd.ti++;renderCards();cardTick();
  },Math.round(ms));
}
function cardMove(d){
  cd.ti=clamp(cd.ti+d,0,cardStarts.length-1);
  if(Math.abs(d)>1){cd.els.forEach(el=>el.remove());cd.els.clear();}
  renderCards();
  if(canAdvance()) cardTick();
}
function initCardSwipeEvents(){
  if(cardAC) cardAC.abort();
  cardAC=new AbortController();const sig=cardAC.signal;
  const wrap=$('tt-slide-wrap');let startY=0,mouseY=0,down=false,lastWheel=0;
  wrap.addEventListener('touchstart',e=>{startY=e.touches[0].clientY;},{passive:true,signal:sig});
  wrap.addEventListener('touchmove',e=>{e.preventDefault();},{passive:false,signal:sig});
  wrap.addEventListener('touchend',e=>{const dy=startY-e.changedTouches[0].clientY;if(Math.abs(dy)>=35)cardMove(dy>0?1:-1);},{passive:true,signal:sig});
  wrap.addEventListener('wheel',e=>{e.preventDefault();const now=Date.now();if(now-lastWheel<350)return;lastWheel=now;cardMove(e.deltaY>0?1:-1);},{passive:false,signal:sig});
  wrap.addEventListener('mousedown',e=>{mouseY=e.clientY;down=true;},{signal:sig});
  window.addEventListener('mouseup',e=>{if(!down)return;down=false;const dy=mouseY-e.clientY;if(Math.abs(dy)>=25)cardMove(dy>0?1:-1);},{signal:sig});
}

/* ══════════════════════════════════════════════════════════════
   16. NORMAL OKUMA — bölüm bölüm
══════════════════════════════════════════════════════════════ */
const nm={si:0,paras:[]};
function startNormal(){
  showEl('normal','block');
  $('normal-text').style.fontSize=getFs()+'px';
  renderNormalSection(sectionIndexOf(idx),idx);
  if(normalAC) normalAC.abort();
  normalAC=new AbortController();
  let raf=0;
  $('normal').addEventListener('scroll',()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;normalTrack();});},{passive:true,signal:normalAC.signal});
}
function renderNormalSection(si,target){
  si=clamp(si,0,sections.length-1);nm.si=si;
  const s=sections[si];
  let h='';
  if(si>0) h+='<div class="nm-nav"><button onclick="normalGo(-1)">← '+esc(sections[si-1].title)+'</button><span></span></div>';
  let from=s.start;
  if(sections.length>1&&s.title){
    h+='<h2>'+esc(s.title)+'</h2>';
    if(s.len>0) from=s.start+s.len;
  }
  let buf=[],pStart=from,cnt=0;
  for(let i=from;i<s.end;i++){
    buf.push(words[i]);cnt++;
    const endP=paraEnds.has(i)||(flatText&&cnt>=70&&SENT_END.test(words[i]))||cnt>=450||i===s.end-1;
    if(endP){h+='<p data-w="'+pStart+'">'+esc(buf.join(' '))+'</p>';buf=[];cnt=0;pStart=i+1;}
  }
  h+='<div class="nm-nav" style="margin-top:28px"><span></span>'+(si+1<sections.length
    ?'<button class="primary" onclick="normalGo(1)">'+esc(sections[si+1].title)+' →</button>'
    :'<button class="primary" onclick="finishReading()">✓ Kitabı Bitir</button>')+'</div>';
  $('normal-text').innerHTML=h;
  $('normal-wc').textContent=(sections.length>1?(si+1)+'/'+sections.length+' · ':'')+nf(s.end-s.start)+' kelime';
  $('normal-rt').textContent='~'+fmtWordsTime(s.end-s.start)+' okuma süresi';
  nm.paras=[...$('normal-text').querySelectorAll('p[data-w]')];
  const box=$('normal');
  let top=0;
  if(target>from+3){for(const p of nm.paras){if(+p.dataset.w<=target)top=p.offsetTop-24;else break;}}
  box.scrollTop=Math.max(0,top);
  idx=Math.max(s.start,Math.min(target,s.end-1));
  setProgressUI();
}
function normalTrack(){
  const box=$('normal'),s=sections[nm.si];if(!s) return;
  const top=box.scrollTop+60;let w=s.start;
  for(const p of nm.paras){if(p.offsetTop<=top)w=+p.dataset.w;else break;}
  if(box.scrollTop+box.clientHeight>=box.scrollHeight-6) w=s.end;
  idx=clamp(w,0,words.length);setProgressUI();
}
function normalGo(d){
  const t=clamp(nm.si+d,0,sections.length-1);
  if(d>0) idx=Math.max(idx,sections[nm.si].end);
  renderNormalSection(t,sections[t].start);
}
