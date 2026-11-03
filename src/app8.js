
/* ══════════════════════════════════════════════════════════════
   26. TELEFON / TABLET
══════════════════════════════════════════════════════════════ */
const isTouch=()=>window.matchMedia('(pointer:coarse)').matches;

/* Okurken ekran kararmasın */
let wakeLock=null,wakeWanted=false;
async function keepAwake(on){
  wakeWanted=!!on;
  try{
    if(on&&!wakeLock&&'wakeLock' in navigator&&!document.hidden){
      wakeLock=await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release',()=>{wakeLock=null;});
    }else if(!on&&wakeLock){const w=wakeLock;wakeLock=null;await w.release();}
  }catch(e){wakeLock=null;}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&wakeWanted)keepAwake(true);});

/* Okuma alanına dokun: duraklat / devam · sayfa bittiyse sonraki sayfa */
$('reader-area').addEventListener('click',e=>{
  if(!running) return;
  if(e.target.closest('button,.pp-btn,.skip-btn,#chapter-card,#done-overlay,input,a,#tt-slide-wrap,#scroll')) return;
  if(mode==='typewriter'&&twWaiting){twNextPage();return;}
  if(isTouch()&&(mode==='rsvp'||mode==='bionic'||mode==='typewriter')) togglePause();
});
/* Yana kaydır: ±10 kelime */
(function(){
  let sx=0,sy=0,st=0;
  const ra=$('reader-area');
  ra.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now();},{passive:true});
  ra.addEventListener('touchend',e=>{
    if(!running||!['rsvp','typewriter','bionic'].includes(mode)) return;
    const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
    if(Math.abs(dx)>60&&Math.abs(dy)<45&&Date.now()-st<700){skipWords(dx<0?10:-10);toast(dx<0?'⏩ +10 kelime':'⏪ −10 kelime',900);}
  },{passive:true});
})();

/* Panel dışına dokununca kenar çubuğu / sayfa sayfası kapansın */
document.addEventListener('click',e=>{
  if(document.body.classList.contains('sb-open')&&!e.target.closest('#sidebar,[data-sb]')) document.body.classList.remove('sb-open');
  if(document.body.classList.contains('peek-sheet')&&!e.target.closest('#page-peek,[data-peek]')) document.body.classList.remove('peek-sheet');
});
function togglePeekSheet(){
  if(window.innerWidth<700){
    if(settings.peek===false){settings.peek=true;saveSettings();}
    document.body.classList.toggle('peek-sheet');
    peekForceRender();
  }else setPeek(!$('page-peek').classList.contains('visible'));
}

/* Ana ekrana yükle */
let installEvt=null;
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function showInstallCard(txt,withBtn){
  if(isStandalone()||LS.get('turkerokuma_install_hide',false)||!/^https?:/.test(location.protocol)) return;
  $('install-txt').textContent=txt;
  $('install-btn').style.display=withBtn?'':'none';
  $('install-card').style.display='flex';
}
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();installEvt=e;
  showInstallCard('Ana ekrana ekle — tam ekran açılsın, internetsiz de çalışsın.',true);
});
window.addEventListener('appinstalled',()=>{$('install-card').style.display='none';toast('📲 Uygulama yüklendi!');});
async function doInstall(){
  if(!installEvt) return;
  installEvt.prompt();
  try{await installEvt.userChoice;}catch(e){}
  installEvt=null;$('install-card').style.display='none';
}
function dismissInstall(){LS.set('turkerokuma_install_hide',true);$('install-card').style.display='none';}
if(/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)){
  setTimeout(()=>showInstallCard('Safari’de alttaki Paylaş ⬆️ düğmesine bas → “Ana Ekrana Ekle”.',false),1500);
}
