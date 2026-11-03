
/* ══════════════════════════════════════════════════════════════
   25. SAYFA PANELİ — kitapta neredeyim?
   PDF'li kitaplarda gerçek sayfa + okunan satır vurgusu,
   diğerlerinde ~280 kelimelik sanal sayfa + okunan kelime.
══════════════════════════════════════════════════════════════ */
const VPP=280;
const peek={bookId:undefined,doc:null,lines:null,starts:null,sizes:null,page:0,shownPage:0,rendering:false,pending:0,scale:null,vpage:-1,va:0,vspans:[],lastCur:-1,token:0};
let peekRaf=0;
function setPeek(on){settings.peek=!!on;saveSettings();updatePeek();if(on)peekForceRender();}
function updatePeek(){if(peekRaf)return;peekRaf=requestAnimationFrame(()=>{peekRaf=0;peekRender();});}
function peekForceRender(){peek.page=0;peek.shownPage=0;peek.vpage=-1;updatePeek();}
function curWordIdx(){
  let c=idx;
  if(running&&(mode==='rsvp'||mode==='bionic')) c=idx-1;
  return clamp(c,0,Math.max(0,words.length-1));
}
async function peekLoadBook(){
  const tok=++peek.token;
  if(peek.doc){try{peek.doc.destroy();}catch(e){}}
  Object.assign(peek,{bookId:curBook?curBook.id:null,doc:null,lines:null,starts:null,sizes:null,page:0,shownPage:0,scale:null,vpage:-1,lastCur:-1});
  const b=curBook;
  if(b&&b.hasPdf&&typeof pdfjsLib!=='undefined'){
    const rec=await Store.getPdf(b.id);
    if(tok!==peek.token) return;
    if(rec&&rec.data&&rec.lines&&rec.lines.length){
      try{
        const doc=await pdfjsLib.getDocument({data:rec.data.slice(0)}).promise;
        if(tok!==peek.token){try{doc.destroy();}catch(e){}return;}
        peek.doc=doc;peek.lines=rec.lines;peek.starts=rec.lines.map(l=>l[1]);peek.sizes=rec.sizes||[];
      }catch(e){console.warn('PDF sayfa paneli açılamadı',e);}
    }
  }
  updatePeek();
}
function peekRender(){
  const box=$('page-peek');
  const show=settings.peek!==false&&words.length>0;
  box.classList.toggle('visible',show);
  document.body.classList.toggle('peek-on',show);
  $('peek-btn').style.display=words.length?'':'none';
  $('peek-btn').classList.toggle('active',show);
  if(!show) return;
  const bid=curBook?curBook.id:null;
  if(bid!==peek.bookId){peekLoadBook();}
  const cur=curWordIdx();
  const s=sections[sectionIndexOf(cur)];
  $('pk-sec').textContent=s&&sections.length>1?s.title:(curBook?splitTitle(curBook.title).title:'Metin');
  const pct=words.length?Math.round(cur/words.length*100):0;
  $('pk-pct').textContent='%'+pct+' okundu';
  $('pk-bar').style.width=pct+'%';
  const usePdf=!!(peek.doc&&peek.lines);
  $('pk-pdf').style.display=usePdf?'block':'none';
  $('pk-virtual').style.display=usePdf?'none':'block';
  $('pk-attach').style.display=!usePdf&&curBook&&!curBook.hasPdf?'block':'none';
  $('pk-attach-txt').textContent=curBook&&curBook.source==='pdf'
    ?'Bu kitabın gerçek PDF sayfalarını görmek için PDF dosyasını tekrar seç.'
    :'Bu kitabın basılı/PDF hâli varsa bağla — gerçek sayfa ve satırı görürsün.';
  if(usePdf) peekPdf(cur); else peekVirtual(cur);
}
/* ── Gerçek PDF sayfası ── */
function peekPdf(cur){
  const li=bsearch(peek.starts,cur),L=peek.lines[li];
  const pg=L[0];
  if(pg!==peek.page) peekRenderPage(pg);
  const tot=peek.sizes.length||(curBook&&curBook.pages)||'?';
  $('pk-page-lbl').textContent='Sayfa '+pg+' / '+tot;
  const hl=$('pk-hl');
  if(peek.rendering||!peek.scale||peek.shownPage!==pg){hl.style.display='none';return;}
  const k=peek.scale;
  hl.style.display='block';
  hl.style.left=Math.max(0,L[2]*k-4)+'px';
  hl.style.top=Math.max(0,L[3]*k-2)+'px';
  hl.style.width=Math.max(12,(L[4]-L[2])*k+8)+'px';
  hl.style.height=Math.max(6,L[5]*k+4)+'px';
  /* okunan kısım: satırın üstü hafif soluk */
  $('pk-read').style.height=Math.max(0,L[3]*k-2)+'px';
  const wrap=$('page-peek'),top=$('pk-pdf').offsetTop+L[3]*k;
  if(top<wrap.scrollTop+40||top>wrap.scrollTop+wrap.clientHeight-60) wrap.scrollTop=top-wrap.clientHeight/2;
}
async function peekRenderPage(n){
  peek.page=n;
  if(peek.rendering){peek.pending=n;return;}
  peek.rendering=true;
  try{
    const page=await peek.doc.getPage(n);
    const W=Math.max(120,$('page-peek').clientWidth-34);
    const vp1=page.getViewport({scale:1});
    const scale=W/vp1.width,dpr=Math.min(2.5,window.devicePixelRatio||1);
    const vp=page.getViewport({scale:scale*dpr});
    const c=$('pk-canvas');
    c.width=Math.round(vp.width);c.height=Math.round(vp.height);
    c.style.width=W+'px';c.style.height=Math.round(vp1.height*scale)+'px';
    await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
    peek.scale=scale;peek.shownPage=n;
  }catch(e){}
  peek.rendering=false;
  if(peek.pending&&peek.pending!==n){const p=peek.pending;peek.pending=0;peekRenderPage(p);return;}
  peek.pending=0;
  updatePeek();
}
$('pk-pdf').addEventListener('click',e=>{
  if(!peek.lines||!peek.scale) return;
  const r=$('pk-canvas').getBoundingClientRect();
  const x=(e.clientX-r.left)/peek.scale,y=(e.clientY-r.top)/peek.scale;
  let best=null,bd=1e9;
  for(const l of peek.lines){
    if(l[0]!==peek.shownPage) continue;
    const dy=y<l[3]?l[3]-y:y>l[3]+l[5]?y-(l[3]+l[5]):0;
    const dx=x<l[2]?l[2]-x:x>l[4]?x-l[4]:0;
    const d=dy*3+dx;
    if(d<bd){bd=d;best=l;}
  }
  if(best) peekGoto(best[1]);
});
/* ── Sanal sayfa ── */
function peekVirtual(cur){
  const box=$('pk-virtual');
  const vp=Math.floor(cur/VPP);
  if(vp!==peek.vpage){
    peek.vpage=vp;
    const a=vp*VPP,b=Math.min(words.length,a+VPP);
    let h='<p>';
    for(let i=a;i<b;i++){h+='<span data-i="'+i+'">'+esc(words[i])+'</span> ';if(paraEnds.has(i)&&i<b-1)h+='</p><p>';}
    box.innerHTML=h+'</p>';
    peek.vspans=[...box.querySelectorAll('span')];peek.va=a;peek.lastCur=-1;
  }
  const last=peek.vspans.length-1+peek.va;
  if(cur!==peek.lastCur){
    const lo=Math.max(peek.va,peek.lastCur<0?peek.va:Math.min(cur,peek.lastCur));
    const hi=Math.min(last,peek.lastCur<0?last:Math.max(cur,peek.lastCur));
    for(let i=lo;i<=hi;i++){const sp=peek.vspans[i-peek.va];const c=i<cur?'rd':i===cur?'cur':'';if(sp.className!==c)sp.className=c;}
    peek.lastCur=cur;
    const el=peek.vspans[cur-peek.va];
    if(el&&(el.offsetTop<box.scrollTop+16||el.offsetTop>box.scrollTop+box.clientHeight-40)) box.scrollTop=el.offsetTop-box.clientHeight/3;
  }
  $('pk-page-lbl').textContent='~Sayfa '+(vp+1)+' / '+Math.max(1,Math.ceil(words.length/VPP));
}
$('pk-virtual').addEventListener('click',e=>{const sp=e.target.closest('span[data-i]');if(sp)peekGoto(+sp.dataset.i);});
function peekGoto(i){
  if(running){jumpTo(i);return;}
  idx=clamp(i,0,words.length-1);
  setProgressUI();updateIdle();updateCurBookCard();saveProgress(true);
  toast('📍 Okuma yeri buraya alındı — başlamak için Space');
}
window.addEventListener('resize',()=>{if(peek.doc){peek.page=0;peek.shownPage=0;}updatePeek();});

/* ── Mevcut kitaba PDF bağla ── */
let attachTarget=null;
function pickPdfFor(id){attachTarget=id||(curBook&&curBook.id);if(!attachTarget)return;$('pk-attach-file').click();}
async function attachPdfToBook(input){
  const f=input.files&&input.files[0];input.value='';if(!f) return;
  const b=library.find(x=>x.id===attachTarget);if(!b) return;
  if(typeof pdfjsLib==='undefined'){toast('PDF kütüphanesi yüklenemedi — internet bağlantısını kontrol et.',4500);return;}
  if(!DB.db){toast('⚠ Bu tarayıcıda PDF saklanamıyor (IndexedDB yok).');return;}
  toast('📄 PDF inceleniyor...',60000);
  try{
    const buf=await f.arrayBuffer(),keep=buf.slice(0);
    const A=await analyzePdf(buf,(p,n)=>toast('📄 PDF inceleniyor: '+p+' / '+n,60000));
    A.fileName=f.name;
    const B=buildFromPdf(A,optsFromReport(A,b.cleanReport));
    if(B.words<20){toast('⚠ Bu PDF\'ten metin çıkarılamadı (taranmış olabilir).',5000);return;}
    let lines=B.lineMap.lines;
    const diff=Math.abs(B.words-b.wordCount)/Math.max(1,b.wordCount);
    if(diff>0.02&&!confirm('Bu PDF kitaptaki metinle birebir eşleşmiyor ('+nf(B.words)+' / '+nf(b.wordCount)+' kelime) — farklı bir baskı olabilir.\n\nYine de bağlansın mı? Sayfa konumu yaklaşık olur.')){toast('Bağlanmadı.');return;}
    if(B.words!==b.wordCount){const k=b.wordCount/Math.max(1,B.words);lines=lines.map(l=>[l[0],Math.round(l[1]*k),l[2],l[3],l[4],l[5]]);}
    await Store.savePdf(b.id,{id:b.id,data:keep,lines,sizes:B.lineMap.sizes});
    b.hasPdf=true;if(!b.pages)b.pages=A.N;saveMetaSoon(b,true);
    toast('✓ PDF bağlandı — sağdaki panelde gerçek sayfayı göreceksin.',4000);
    if(curBook&&curBook.id===b.id){peek.bookId=undefined;updatePeek();}
    if(detailBookId===b.id) showBookDetail(b.id);
  }catch(e){toast('⚠ PDF okunamadı: '+(e&&e.message||e),5000);}
}
