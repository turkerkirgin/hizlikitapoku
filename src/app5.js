
/* ══════════════════════════════════════════════════════════════
   19. AKILLI PDF ANALİZİ
   Her sayfa satır satır okunur → üst/alt bilgi, sayfa numarası, dipnot,
   başlık (yazı boyutundan), heceleme tiresi ve paragraf yapısı çıkarılır.
══════════════════════════════════════════════════════════════ */
const PDF_STATE={A:null,o:null,built:null};
const PAGE_NUM_RE=/^[\s\-–—.·•|\[\(]*((sayfa|page|s\.)\s*)?(\d{1,4}|[ivxlcdm]{1,7})(\s*(\/|of|\/)\s*\d{1,4})?[\s\-–—.·•|\]\)]*$/i;
const LETTERS_RE=/[A-Za-zÀ-ɏ]/;

function setPaProg(frac,lbl){$('pa-prog-bar').style.width=Math.round(frac*100)+'%';$('pa-prog-lbl').textContent=lbl;}
function openPdfImport(file){analyzePdfFile(file);}
async function analyzePdfFile(file){
  openAddBookModal('pdf');
  if(typeof pdfjsLib==='undefined'){toast('PDF kütüphanesi yüklenemedi — internet bağlantısını kontrol et.',4500);return;}
  $('pa-report').classList.remove('visible');$('pa-report').innerHTML='';
  $('pa-start').style.display='';
  $('pa-progress').classList.add('visible');setPaProg(0,'"'+file.name+'" açılıyor...');
  try{
    const buf=await file.arrayBuffer();
    PDF_STATE.buf=buf.slice(0);
    const A=await analyzePdf(buf,(p,n)=>setPaProg(p/n,'Sayfa '+p+' / '+n+' inceleniyor...'));
    A.fileName=file.name;
    PDF_STATE.A=A;PDF_STATE.o=defaultPdfOpts(A);
    $('pa-progress').classList.remove('visible');
    $('pa-start').style.display='none';
    renderPdfReport(true);
  }catch(e){
    $('pa-progress').classList.remove('visible');
    toast(e&&e.name==='PasswordException'?'⚠ Bu PDF şifreli, açılamıyor.':'⚠ PDF okunamadı: '+(e&&e.message||e),5000);
  }
}
async function analyzePdf(data,onProg){
  const pdf=await pdfjsLib.getDocument({data,disableFontFace:true}).promise;
  const N=pdf.numPages;
  let info={};try{const md=await pdf.getMetadata();info=(md&&md.info)||{};}catch(e){}
  const pages=[];
  for(let p=1;p<=N;p++){
    const page=await pdf.getPage(p);
    const vp=page.getViewport({scale:1});
    let lines=[];
    try{const tc=await page.getTextContent();lines=groupLines(tc.items,vp);}catch(e){}
    pages.push({n:p,w:vp.width,h:vp.height,lines});
    page.cleanup();
    if(p%3===0||p===N){onProg&&onProg(p,N);await sleep0();}
  }
  let outline=[];try{outline=await readOutline(pdf,pages);}catch(e){}
  try{pdf.destroy();}catch(e){}
  const A={N,info,pages,outline};
  classifyPdf(A);
  return A;
}
function groupLines(items,vp){
  const lines=[];let cur=null;
  for(const it of items){
    if(!it||typeof it.str!=='string') continue;
    const t=it.transform,size=Math.hypot(t[2],t[3])||it.height||10;
    const pt=vp.convertToViewportPoint(t[4],t[5]);const x=pt[0],y=pt[1];
    const s=it.str;
    if(!s.trim()){if(cur){cur.space=true;if(it.hasEOL)cur.eol=true;}continue;}
    const w=Math.abs(it.width||0)*(vp.scale||1);
    if(cur&&!cur.eol&&Math.abs(y-cur.y)<=Math.max(2,size*0.6)&&x>=cur.x2-size*1.5&&x-cur.x2<size*3){
      if(cur.space||x-cur.x2>size*0.18) cur.text+=' ';
      cur.text+=s;cur.x2=Math.max(cur.x2,x+w);cur.chars+=s.length;cur.ss+=size*s.length;cur.space=false;
    }else{
      cur={text:s,x,y,x2:x+w,chars:s.length,ss:size*s.length,space:false,eol:false};
      lines.push(cur);
    }
    if(it.hasEOL) cur.eol=true;
  }
  return lines.map((l,i)=>({
    text:fixLigatures(l.text).replace(/\s+/g,' ').trim(),
    x:l.x,y:l.y,x2:l.x2,size:l.ss/Math.max(1,l.chars),chars:l.chars,i
  })).filter(l=>l.text);
}
async function readOutline(pdf,pages){
  const ol=await pdf.getOutline();if(!ol||!ol.length) return [];
  const out=[];
  async function walk(items,level){
    for(const it of items){
      if(it.title&&level<=2){
        let page=null,yv=null;
        try{
          let dest=it.dest;if(typeof dest==='string')dest=await pdf.getDestination(dest);
          if(Array.isArray(dest)&&dest[0]!=null){
            const ref=dest[0];
            page=typeof ref==='object'?(await pdf.getPageIndex(ref))+1:(Number.isInteger(ref)?ref+1:null);
            if(page&&dest[1]&&dest[1].name==='XYZ'&&typeof dest[3]==='number'&&pages[page-1]) yv=pages[page-1].h-dest[3];
          }
        }catch(e){}
        if(page) out.push({title:String(it.title).replace(/\s+/g,' ').trim(),page,level,yv});
      }
      if(it.items&&it.items.length&&level<2) await walk(it.items,level+1);
    }
  }
  await walk(ol,1);
  out.sort((a,b)=>a.page-b.page||(a.yv||0)-(b.yv||0));
  return out.filter((e,i)=>e.title&&!(i&&out[i-1].page===e.page&&out[i-1].title===e.title));
}
function median(a){if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];}
function classifyPdf(A){
  const all=[];A.pages.forEach(p=>p.lines.forEach(l=>{l.page=p.n;all.push(l);}));
  /* Türkçe kodlama bozukluğu */
  let bad=0,good=0;
  for(const l of all){bad+=(l.text.match(/[ýþðÝÞÐ]/g)||[]).length;good+=(l.text.match(/[ışğİŞĞ]/g)||[]).length;}
  A.mojibake=bad>20&&bad>good*1.5?bad:0;
  if(A.mojibake) for(const l of all) l.text=l.text.replace(/[ýþðÝÞÐ]/g,c=>MOJI[c]);
  /* Gövde yazı boyutu */
  const hist=new Map();
  for(const l of all){const k=Math.round(l.size*2)/2;hist.set(k,(hist.get(k)||0)+l.chars);}
  let body=10,bc=-1;for(const [k,c] of hist)if(c>bc){bc=c;body=k;}
  A.body=body;
  A.totalChars=all.reduce((s,l)=>s+l.chars,0);
  A.textPages=A.pages.filter(p=>p.lines.reduce((s,l)=>s+l.chars,0)>40).length;
  A.badChars=all.reduce((s,l)=>s+(l.text.match(/[�-]/g)||[]).length,0);
  /* Üst / alt bilgi ve sayfa numarası */
  const keyOf=t=>trLower(t).replace(/\d+/g,'#').replace(/[^a-zçğıöşüâîû#]+/g,' ').trim();
  const reps=new Map();
  for(const p of A.pages){
    const ys=[...p.lines].sort((a,b)=>a.y-b.y);
    const cand=new Set([...ys.slice(0,2),...ys.slice(-2)]);
    for(const l of cand){
      if(l.y>p.h*0.16&&l.y<p.h*0.86) continue;
      l.edge=true;
      if(PAGE_NUM_RE.test(l.text)){l.kind='pagenum';continue;}
      const k=keyOf(l.text);if(!k||k.replace(/[#\s]/g,'').length<2) continue;
      l.key=k;
      if(!reps.has(k)) reps.set(k,new Set());
      reps.get(k).add(p.n);
    }
  }
  if(A.textPages>=6){
    for(const l of all) if(l.edge&&l.key&&reps.get(l.key).size>=3&&l.text.length<120) l.kind='header';
  }
  /* Sayfa ölçüleri + dipnotlar */
  for(const p of A.pages){
    const bodyL=p.lines.filter(l=>!l.kind&&Math.abs(l.size-body)<=body*0.15);
    const xs=bodyL.map(l=>Math.round(l.x));
    const cnt=new Map();xs.forEach(x=>cnt.set(x,(cnt.get(x)||0)+1));
    let left=xs.length?Math.min(...xs):0,lc=0;
    for(const [x,c] of cnt) if(c>lc||(c===lc&&x<left)){lc=c;left=x;}
    p.left=left;
    const rs=bodyL.map(l=>l.x2).sort((a,b)=>a-b);
    p.right=rs.length?rs[Math.floor(rs.length*0.9)]:p.w;
    const gaps=[];
    for(let i=1;i<p.lines.length;i++){const g=p.lines[i].y-p.lines[i-1].y;if(g>0&&g<body*3)gaps.push(g);}
    p.gap=median(gaps)||body*1.35;
    /* dipnot: sayfanın altındaki küçük puntolu blok */
    const ys=p.lines.filter(l=>!l.kind).sort((a,b)=>b.y-a.y);
    for(const l of ys){
      if(l.y<p.h*0.55) break;
      if(l.size<=body*0.86&&l.size>2) l.kind='foot'; else break;
    }
  }
  /* Başlıklar: yazı boyutu büyük olan kısa satırlar */
  const cands=all.filter(l=>!l.kind&&l.size>=body*1.18&&l.text.length<=120&&LETTERS_RE.test(l.text));
  const sizes=[...new Set(cands.map(l=>Math.round(l.size)))].sort((a,b)=>b-a);
  const allowed=Math.max(40,A.N*0.7);let acc=0;const okSizes=new Set();
  for(const s of sizes){const c=cands.filter(l=>Math.round(l.size)===s).length;if(acc+c>allowed)break;acc+=c;okSizes.add(s);}
  A.headFont=0;
  for(const l of cands) if(okSizes.has(Math.round(l.size))){l.head='font';A.headFont++;}
  /* Yedek: gövde boyutunda BÜYÜK HARFLİ tek başına satırlar */
  A.headCaps=0;
  for(const p of A.pages){
    p.lines.forEach((l,i)=>{
      if(l.kind||l.head) return;
      const t=l.text,letters=t.replace(/[^A-Za-zÀ-ɏ]/g,'');
      if(t.length>90||letters.length<4||t.split(' ').length>12) return;
      if(isAllCaps(t)||/^(BÖLÜM|Bölüm|KISIM|Kısım)\s+\S+$/.test(t)){l.head='caps';A.headCaps++;}
    });
  }
  /* Çok satırlı başlıkları birleştir */
  for(const p of A.pages){
    for(let i=1;i<p.lines.length;i++){
      const a=p.lines[i-1],b=p.lines[i];
      if(a.head&&b.head&&a.head===b.head&&Math.abs(a.size-b.size)<0.6&&b.y-a.y>0&&b.y-a.y<a.size*2.2) b.headCont=true;
    }
  }
  /* İçindekiler / dizin sayfası tahmini */
  A.tocPages=[];A.backPages=[];
  for(const p of A.pages){
    if(p.lines.length<5) continue;
    const ending=p.lines.filter(l=>/(\.{2,}|…|\s)\s*\d{1,4}$/.test(l.text)).length;
    const first=p.lines.slice(0,4).map(l=>trLower(l.text)).join(' ');
    const isToc=ending/p.lines.length>=0.4||/^(içindekiler|contents|i̇çindekiler)/.test(first);
    if(isToc&&p.n<=Math.max(12,A.N*0.2)) A.tocPages.push(p.n);
    if(p.n>=A.N*0.85&&/^(dizin|kaynakça|kaynaklar|index|bibliyografya|notlar)\b/.test(first)) A.backPages.push(p.n);
  }
}
function defaultPdfOpts(A){
  let from=1;
  const firstText=A.pages.find(p=>p.lines.reduce((s,l)=>s+l.chars,0)>40);
  if(firstText) from=firstText.n;
  if(A.tocPages.length){
    let last=A.tocPages[0];
    for(const n of A.tocPages){if(n===last||n===last+1)last=n;}
    if(last<A.N) from=Math.max(from,last+1);
  }
  const src=A.outline.length>=2?'outline':A.headFont>=2?'font':A.headCaps>=2?'caps':'none';
  return {from,to:A.N,rmHeader:true,rmPage:true,rmFoot:false,dehyph:true,src,off:new Set()};
}
function similarTitle(a,b){
  const n=s=>trLower(s).replace(/[^a-zçğıöşüâîû0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  a=n(a);b=n(b);if(!a||!b)return false;
  if(a.includes(b)||b.includes(a)) return true;
  const A=new Set(a.split(' ')),B=b.split(' ');
  return B.filter(w=>A.has(w)).length/Math.max(A.size,B.length)>=0.6;
}
function buildFromPdf(A,o){
  const st={header:0,pagenum:0,foot:0,hyph:0,pages:0};
  const paras=[];let cur=null,pending=null;
  const ol=o.src==='outline'?A.outline.map((e,i)=>({...e,key:'o'+i})).filter(e=>e.page>=o.from&&e.page<=o.to):[];
  let oq=0;
  const flush=()=>{if(cur&&cur.text.trim())paras.push(cur);cur=null;};
  const newPara=(p,l,extra)=>{const pa=Object.assign({text:l.text,page:p.n,last:l,pr:p.right,lines:[[p.n,l]]},extra||{});if(pending){pa.ol=pending;pending=null;}return pa;};
  for(const p of A.pages){
    if(p.n<o.from||p.n>o.to) continue;
    st.pages++;
    for(const l of p.lines){
      if(l.kind==='header'){if(o.rmHeader){st.header++;continue;}}
      else if(l.kind==='pagenum'){if(o.rmPage){st.pagenum++;continue;}}
      else if(l.kind==='foot'){if(o.rmFoot){st.foot++;continue;}}
      while(oq<ol.length&&(ol[oq].page<p.n||(ol[oq].page===p.n&&(ol[oq].yv==null||l.y>=ol[oq].yv-4)))){
        if(!o.off.has(ol[oq].key)){flush();pending=ol[oq];}
        oq++;
      }
      if(l.head){
        const isCh=l.head===o.src&&!o.off.has('h'+p.n+'_'+l.i);
        const prev=paras[paras.length-1];
        if(l.headCont&&!cur&&prev&&prev.head&&prev.page===p.n){prev.text+=' '+l.text;prev.lines.push([p.n,l]);continue;}
        flush();
        paras.push(newPara(p,l,{head:true,hsrc:l.head,ch:isCh,key:'h'+p.n+'_'+l.i}));
        continue;
      }
      if(!cur){cur=newPara(p,l);continue;}
      const prev=cur.last;let brk=false;
      if(prev.page===p.n){
        const g=l.y-prev.y;
        if(g>p.gap*1.6) brk=true;
      }
      if(l.x>p.left+A.body*0.9&&l.x<p.left+A.body*6) brk=true;
      if(prev.x2<cur.pr-A.body*4&&/[.!?:…"”»]$/.test(prev.text)) brk=true;
      if(brk){flush();cur=newPara(p,l);continue;}
      if(o.dehyph&&/[A-Za-zÀ-ɏ]-$/.test(cur.text)&&/^[a-zçğıöşüâîû]/.test(l.text)){cur.text=cur.text.slice(0,-1)+l.text;st.hyph++;}
      else if(/[A-Za-zÀ-ɏ]-$/.test(cur.text)) cur.text+=l.text;
      else cur.text+=' '+l.text;
      cur.last=l;cur.pr=p.right;cur.lines.push([p.n,l]);
    }
  }
  flush();
  if(pending&&paras.length===0) pending=null;
  /* Metin + bölümler + sayfa haritası */
  const out=[],chapters=[],firstWordOfPage=new Map(),lm=[];
  let w=0;
  for(const pa of paras){
    const text=pa.text.replace(/\s+/g,' ').trim();
    const n=paraTokens(text).length;
    if(!n) continue;
    if(pa.ol){chapters.push({w,len:pa.head&&similarTitle(text,pa.ol.title)?n:0,title:prettyTitle(pa.ol.title),key:pa.ol.key,page:pa.ol.page});}
    else if(pa.head&&pa.ch){chapters.push({w,len:n,title:prettyTitle(text),key:pa.key,page:pa.page});}
    /* satır haritası: [sayfa, ilk kelime, x, üst, x2, yükseklik] — gerçek sayfa görünümü için */
    let acc=0;
    for(const [pn,l] of pa.lines){
      const s=w+Math.min(acc,n-1);
      lm.push([pn,s,Math.round(l.x),Math.round(l.y-l.size*0.95),Math.round(l.x2),Math.round(l.size*1.3)]);
      if(!firstWordOfPage.has(pn)) firstWordOfPage.set(pn,s);
      acc+=paraTokens(l.text).length;
      if(o.dehyph&&/[A-Za-zÀ-ɏ]-$/.test(l.text)) acc--;
    }
    out.push(text);
    w+=n;
  }
  const starts=[];let last=0;
  for(let pg=o.from;pg<=o.to;pg++){if(firstWordOfPage.has(pg))last=firstWordOfPage.get(pg);starts.push(last);}
  /* tüm aday bölümler (rapor listesi için, kapalı olanlar dahil) */
  let allCh=[];
  if(o.src==='outline') allCh=A.outline.map((e,i)=>({key:'o'+i,title:prettyTitle(e.title),page:e.page})).filter(e=>e.page>=o.from&&e.page<=o.to);
  else if(o.src==='font'||o.src==='caps') paras.filter(p=>p.head&&p.hsrc===o.src).forEach(p=>allCh.push({key:p.key,title:prettyTitle(p.text),page:p.page}));
  return {text:out.join('\n\n'),words:w,chapters:chapters.map(c=>({w:c.w,len:c.len,title:c.title})),chMeta:chapters,allCh,pageMap:{first:o.from,starts},st,lineMap:{lines:lm,sizes:A.pages.map(p=>[Math.round(p.w),Math.round(p.h)])}};
}
function pdfGuessTitle(A){
  let t=(A.info&&A.info.Title||'').trim(),a=(A.info&&A.info.Author||'').trim();
  if(!t||/^(microsoft|untitled|document|adsız|belge)|\.(docx?|pdf)$/i.test(t)) t=A.fileName.replace(/\.pdf$/i,'').replace(/[_]+/g,' ').replace(/\s+/g,' ').trim();
  if(a&&/^(user|admin|kullanıcı|owner|pc)$/i.test(a)) a='';
  return a&&!t.includes(a)?t+' — '+a:t;
}
let paRebuildT=null;
function renderPdfReport(first){
  const A=PDF_STATE.A,o=PDF_STATE.o;if(!A) return;
  const B=buildFromPdf(A,o);PDF_STATE.built=B;
  const wpm=getWpm(),per=partSize();
  const keepTitle=!first&&$('pa-title')?$('pa-title').value:pdfGuessTitle(A);
  const warn=[];
  if(A.totalChars/A.N<60) warn.push('Bu PDF büyük ihtimalle <b>taranmış (resim)</b>. İçinden metin çıkarılamıyor; metin katmanı olan (OCR yapılmış) bir sürüm bulman gerekir.');
  else if(A.textPages<A.N) warn.push('<b>'+(A.N-A.textPages)+' sayfada</b> metin yok (kapak, resim ya da boş sayfa).');
  if(A.badChars>A.totalChars*0.01) warn.push('Bazı karakterler bozuk görünüyor (PDF yazı tipi kodlaması). Önizlemeyi kontrol et.');
  const info=[];
  if(A.mojibake) info.push('Türkçe karakter düzeltmesi uygulandı (ý→ı, þ→ş, ð→ğ): '+nf(A.mojibake)+' karakter');
  const srcName={outline:'PDF içindekiler (yer imleri)',font:'büyük punto başlıklar',caps:'BÜYÜK HARFLİ başlıklar',none:'yok'};
  const srcOpts=[['outline',A.outline.length],['font',A.headFont],['caps',A.headCaps],['none',1]].filter(([k,c])=>c>=(k==='none'?0:2));
  const chList=B.allCh.map(c=>'<label class="pa-ch"><input type="checkbox" data-ch="'+c.key+'"'+(o.off.has(c.key)?'':' checked')+'><span>'+esc(c.title)+'</span><em>s. '+c.page+'</em></label>').join('');
  /* önizleme */
  const pv=B.text.slice(0,1400);
  const mid=B.text.length>6000?B.text.slice(Math.floor(B.text.length/2),Math.floor(B.text.length/2)+700):'';
  const chTitles=new Set(B.chapters.map(c=>c.title));
  const fmtPv=s=>s.split('\n\n').map(p=>chTitles.has(prettyTitle(p))?'<span class="pv-h">'+esc(p)+'</span>':esc(p)).join('\n\n');
  $('pa-report').innerHTML=
    warn.map(w=>'<div class="pa-warn">⚠ '+w+'</div>').join('')+
    '<div class="pa-cards">'+
      '<div class="pa-card"><b>'+A.N+'</b><span>sayfa</span></div>'+
      '<div class="pa-card"><b>'+nf(B.words)+'</b><span>kelime</span></div>'+
      '<div class="pa-card"><b>'+fmtWordsTime(B.words)+'</b><span>'+wpm+' k/dk ile</span></div>'+
      '<div class="pa-card"><b>'+Math.max(1,Math.ceil(B.words/per))+'</b><span>'+settings.goalMin+' dk\'lık gün</span></div>'+
      '<div class="pa-card"><b>'+B.chapters.length+'</b><span>bölüm</span></div>'+
    '</div>'+
    '<div class="pa-box"><div class="pa-box-t">Temizlik</div>'+
      '<label class="pa-check"><input type="checkbox" data-opt="rmHeader"'+(o.rmHeader?' checked':'')+'><span>Tekrarlayan üst/alt bilgileri sil <em>('+nf(B.st.header||countKind(A,o,'header'))+' satır)</em></span></label>'+
      '<label class="pa-check"><input type="checkbox" data-opt="rmPage"'+(o.rmPage?' checked':'')+'><span>Sayfa numaralarını sil <em>('+nf(B.st.pagenum||countKind(A,o,'pagenum'))+')</em></span></label>'+
      '<label class="pa-check"><input type="checkbox" data-opt="dehyph"'+(o.dehyph?' checked':'')+'><span>Satır sonu heceleme tirelerini birleştir <em>(“oku- ma” → “okuma”'+(o.dehyph?': '+nf(B.st.hyph):'')+')</em></span></label>'+
      '<label class="pa-check"><input type="checkbox" data-opt="rmFoot"'+(o.rmFoot?' checked':'')+'><span>Dipnotları çıkar <em>(sayfa altındaki küçük yazılar: '+nf(countKind(A,o,'foot'))+' satır)</em></span></label>'+
      info.map(t=>'<div class="pa-check" style="cursor:default">✓ <span>'+t+'</span></div>').join('')+
    '</div>'+
    '<div class="pa-box"><div class="pa-box-t">Sayfa aralığı</div>'+
      '<div class="pa-range"><input type="number" class="num-input" id="pa-from" min="1" max="'+A.N+'" value="'+o.from+'"> – <input type="number" class="num-input" id="pa-to" min="1" max="'+A.N+'" value="'+o.to+'"> / '+A.N+' sayfa</div>'+
      '<div style="font-size:11px;color:var(--text3);margin-top:8px;line-height:1.6">'+
        (A.tocPages.length?'İçindekiler sayfası bulundu (s. '+A.tocPages.join(', ')+')'+(o.from>A.tocPages[A.tocPages.length-1]?' — okumaya dahil edilmedi.':'.')+'<br>':'')+
        (A.backPages.length?'Sonda dizin/kaynakça var (s. '+A.backPages[0]+'–'+A.N+'). <button class="bd-link-btn" onclick="paSetTo('+(A.backPages[0]-1)+')">Bunları çıkar</button><br>':'')+
        'Kapak, önsöz, içindekiler gibi sayfaları dışarıda bırakabilirsin.</div>'+
    '</div>'+
    '<div class="pa-box"><div class="pa-box-t"><span>Bölümler · '+srcName[o.src]+'</span>'+
      (srcOpts.length>1?'<select id="pa-src" class="num-input" style="width:auto">'+srcOpts.map(([k,c])=>'<option value="'+k+'"'+(k===o.src?' selected':'')+'>'+srcName[k]+(k!=='none'?' ('+c+')':'')+'</option>').join('')+'</select>':'')+
    '</div>'+
      (chList?'<div style="display:flex;gap:10px;margin-bottom:6px"><button class="bd-link-btn" onclick="paAllCh(true)">Tümünü seç</button><button class="bd-link-btn" onclick="paAllCh(false)">Hiçbirini seçme</button></div><div class="pa-chlist">'+chList+'</div>'
        :'<div style="font-size:12px;color:var(--text3)">Belirgin bölüm başlığı bulunamadı — kitap '+settings.goalMin+' dk\'lık günlük parçalara bölünecek.</div>')+
    '</div>'+
    '<div class="pa-box"><div class="pa-box-t">Önizleme</div><div class="pa-preview">'+fmtPv(pv)+(mid?'\n\n<span style="color:var(--text3)">· · · kitabın ortasından · · ·</span>\n\n'+esc(mid):'')+'</div></div>'+
    '<div style="margin-bottom:12px"><div class="abm-field-label">Kitap Adı — Yazar</div><input class="txt-input" id="pa-title" value="'+esc(keepTitle)+'"></div>'+
    '<div class="pa-actions"><button class="btn-secondary" onclick="paReset()">↩ Başka PDF</button><button class="btn-secondary" onclick="paAdd(false)">+ Kütüphaneye Ekle</button><button class="btn-primary" onclick="paAdd(true)">▶ Ekle ve Oku</button></div>';
  $('pa-report').classList.add('visible');
}
function countKind(A,o,k){let c=0;for(const p of A.pages){if(p.n<o.from||p.n>o.to)continue;for(const l of p.lines)if(l.kind===k)c++;}return c;}
$('pa-report').addEventListener('change',e=>{
  const o=PDF_STATE.o;if(!o) return;
  const t=e.target;
  if(t.dataset.opt){o[t.dataset.opt]=t.checked;}
  else if(t.dataset.ch){if(t.checked)o.off.delete(t.dataset.ch);else o.off.add(t.dataset.ch);}
  else if(t.id==='pa-src'){o.src=t.value;o.off=new Set();}
  else if(t.id==='pa-from'||t.id==='pa-to'){
    const A=PDF_STATE.A;
    let f=clamp(parseInt($('pa-from').value,10)||1,1,A.N),to=clamp(parseInt($('pa-to').value,10)||A.N,1,A.N);
    if(f>to){const x=f;f=to;to=x;}
    o.from=f;o.to=to;
  }else return;
  const sc=$('pa-report').closest('.abm-body').scrollTop;
  clearTimeout(paRebuildT);
  paRebuildT=setTimeout(()=>{renderPdfReport(false);$('pa-report').closest('.abm-body').scrollTop=sc;},60);
});
function paSetTo(n){const o=PDF_STATE.o;o.to=clamp(n,o.from,PDF_STATE.A.N);renderPdfReport(false);}
function paAllCh(on){const o=PDF_STATE.o,B=PDF_STATE.built;if(!o||!B)return;if(on)o.off.clear();else B.allCh.forEach(c=>o.off.add(c.key));renderPdfReport(false);}
function paReset(){PDF_STATE.A=null;PDF_STATE.buf=null;$('pa-report').classList.remove('visible');$('pa-report').innerHTML='';$('pa-start').style.display='';}
async function paAdd(read){
  const A=PDF_STATE.A,B=PDF_STATE.built;if(!A||!B) return;
  if(B.words<20){toast('Bu PDF\'ten okunacak metin çıkarılamadı.');return;}
  const title=($('pa-title').value||'').trim()||A.fileName.replace(/\.pdf$/i,'');
  const meta=await addBookFromText(title,B.text,{
    chapters:B.chapters,source:'pdf',pages:A.N,pageMap:B.pageMap,
    split:B.chapters.length?'chapters':'parts',
    cleanReport:{header:B.st.header,pagenum:B.st.pagenum,foot:B.st.foot,hyph:B.st.hyph,mojibake:A.mojibake||0,range:[PDF_STATE.o.from,PDF_STATE.o.to],opts:optsToSave(PDF_STATE.o)}
  });
  if(!meta) return;
  if(PDF_STATE.buf){
    await Store.savePdf(meta.id,{id:meta.id,data:PDF_STATE.buf,lines:B.lineMap.lines,sizes:B.lineMap.sizes});
    meta.hasPdf=!!DB.db;saveMetaSoon(meta,true);
  }
  paReset();
  if(read){
    closeAddBookModal();toggleLibraryPanel(false);hideLanding();
    await openBook(meta.id,0);beginReading();
  }else{
    toast('✓ "'+splitTitle(title).title+'" kütüphaneye eklendi.');
    closeAddBookModal();
    if(!$('landing').classList.contains('hidden')) renderLndLibrary();
  }
}

/* ══════════════════════════════════════════════════════════════
   20. KİTAP EKLE PENCERESİ (Metin + Google Drive)
══════════════════════════════════════════════════════════════ */
function openAddBookModal(tab){
  $('add-book-modal').classList.add('visible');
  setAbmTab(tab||'pdf');
  const saved=LS.get('turkerokuma_gd',{});
  if(saved.apikey) $('gd-apikey').value=saved.apikey;
  if(saved.folder) $('gd-folder').value=saved.folder;
}
function closeAddBookModal(){$('add-book-modal').classList.remove('visible');}
function setAbmTab(tab){
  document.querySelectorAll('.abm-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  ['pdf','manual','gdrive'].forEach(t=>$('abm-'+t).classList.toggle('active',t===tab));
}
async function abmAddManual(read){
  const title=$('abm-title').value.trim(),text=$('abm-text').value.trim(),st=$('abm-status');
  if(!title){st.textContent='Kitap adı gerekli.';return;}
  if(!text){st.textContent='Metin boş.';return;}
  st.textContent='Ekleniyor...';
  const meta=await addBookFromText(title,text,{source:'text'});
  if(!meta){st.textContent='';return;}
  st.textContent='✓ Eklendi ('+nf(meta.wordCount)+' kelime, '+(meta.chapters||[]).length+' bölüm).';
  $('abm-text').value='';$('abm-title').value='';
  if(read){closeAddBookModal();toggleLibraryPanel(false);hideLanding();await openBook(meta.id,0);beginReading();}
}
async function readTextFile(f){
  const buf=await f.arrayBuffer();
  let t=new TextDecoder('utf-8').decode(buf);
  if((t.match(/�/g)||[]).length>5){try{t=new TextDecoder('windows-1254').decode(buf);}catch(e){}}
  return t;
}
async function loadTxtFile(f){
  const t=await readTextFile(f);
  openAddBookModal('manual');
  $('abm-text').value=t;
  if(!$('abm-title').value) $('abm-title').value=f.name.replace(/\.(txt|md)$/i,'');
  $('abm-status').textContent=nf(tokenize(t).length)+' kelime yüklendi. Adını kontrol edip ekle.';
}
$('abm-text').addEventListener('drop',async e=>{
  const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];
  if(f&&!/\.pdf$/i.test(f.name)){e.preventDefault();e.stopPropagation();await loadTxtFile(f);}
});
const pdfDrop=$('pdf-drop');
['dragenter','dragover'].forEach(ev=>pdfDrop.addEventListener(ev,e=>{e.preventDefault();pdfDrop.classList.add('drag');}));
['dragleave','drop'].forEach(ev=>pdfDrop.addEventListener(ev,()=>pdfDrop.classList.remove('drag')));

/* Google Drive */
async function gdListFiles(){
  const apiKey=$('gd-apikey').value.trim(),folderRaw=$('gd-folder').value.trim();
  const st=$('gd-status'),list=$('gd-file-list');
  if(!apiKey||!folderRaw){st.textContent='API Key ve klasör URL gerekli.';return;}
  const m=folderRaw.match(/folders\/([a-zA-Z0-9_-]+)/);
  const folderId=m?m[1]:folderRaw;
  LS.set('turkerokuma_gd',{apikey:apiKey,folder:folderRaw});
  st.textContent='Klasör yükleniyor...';list.innerHTML='';
  try{
    const q=encodeURIComponent("'"+folderId+"' in parents and (mimeType='text/plain' or mimeType='application/pdf') and trashed=false");
    const res=await fetch('https://www.googleapis.com/drive/v3/files?q='+q+'&key='+encodeURIComponent(apiKey)+'&fields=files(id,name,mimeType,size)&orderBy=name&pageSize=200');
    if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error((err.error&&err.error.message)||'HTTP '+res.status);}
    const files=(await res.json()).files||[];
    if(!files.length){st.textContent='Klasörde TXT veya PDF bulunamadı.';return;}
    st.textContent=files.length+' dosya bulundu — içe aktarmak istediklerini seç:';
    list.innerHTML=files.map(f=>'<div class="gd-file-item"><span class="gd-file-icon">'+(f.mimeType==='application/pdf'?'📄':'📝')+'</span>'+
      '<span class="gd-file-name" title="'+esc(f.name)+'">'+esc(f.name)+'</span><span class="gd-file-size">'+(f.size?Math.round(f.size/1024)+' KB':'')+'</span>'+
      '<button class="gd-import-btn" data-id="'+esc(f.id)+'" data-name="'+esc(f.name)+'" data-mime="'+esc(f.mimeType)+'">İçe Aktar</button></div>').join('');
  }catch(err){st.textContent='⚠ Hata: '+err.message+'. Klasörün herkese açık ve API Key\'in doğru olduğundan emin ol.';}
}
$('gd-file-list').addEventListener('click',e=>{
  const b=e.target.closest('.gd-import-btn');if(!b||b.disabled)return;
  gdImportFile(b,b.dataset.id,b.dataset.name,b.dataset.mime);
});
async function gdImportFile(btn,fileId,fileName,mime){
  const apiKey=$('gd-apikey').value.trim(),st=$('gd-status');
  const title=fileName.replace(/\.(txt|pdf)$/i,'');
  btn.disabled=true;btn.textContent='Yükleniyor...';
  st.textContent='"'+title+'" indiriliyor...';
  try{
    const res=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(fileId)+'?alt=media&key='+encodeURIComponent(apiKey));
    if(!res.ok) throw new Error('HTTP '+res.status);
    let meta;
    if(mime==='text/plain'){
      meta=await addBookFromText(title,await res.text(),{source:'gdrive'});
    }else{
      const gbuf=await res.arrayBuffer(),gkeep=gbuf.slice(0);
      const A=await analyzePdf(gbuf,(p,n)=>{st.textContent='"'+title+'" inceleniyor: '+p+'/'+n;});
      A.fileName=fileName;
      const B=buildFromPdf(A,defaultPdfOpts(A));
      meta=await addBookFromText(title,B.text,{chapters:B.chapters,source:'pdf',pages:A.N,pageMap:B.pageMap,split:B.chapters.length?'chapters':'parts'});
      if(meta){await Store.savePdf(meta.id,{id:meta.id,data:gkeep,lines:B.lineMap.lines,sizes:B.lineMap.sizes});meta.hasPdf=!!DB.db;saveMetaSoon(meta,true);}
    }
    if(!meta) throw new Error('Metin bulunamadı');
    btn.textContent='✓ Eklendi';btn.style.background='#2a6';
    st.textContent='✓ "'+title+'" eklendi ('+nf(meta.wordCount)+' kelime).';
  }catch(err){st.textContent='⚠ Hata: '+err.message;btn.disabled=false;btn.textContent='İçe Aktar';}
}

/* URL'den metin çekme — makale gövdesini paragraflarıyla al */
async function fetchUrlText(u){
  const r=await fetch('https://api.allorigins.win/get?url='+encodeURIComponent(u));
  const d=await r.json();
  const doc=new DOMParser().parseFromString(d.contents||'','text/html');
  doc.querySelectorAll('script,style,noscript,nav,header,footer,aside,form,iframe,svg,button,figure').forEach(e=>e.remove());
  const root=doc.querySelector('article')||doc.querySelector('main')||doc.body;
  if(!root) return {title:'',text:''};
  const SEL='h1,h2,h3,h4,p,li,blockquote';
  const blocks=[...root.querySelectorAll(SEL)].filter(e=>!(e.parentElement&&e.parentElement.closest(SEL)))
    .map(e=>e.textContent.replace(/\s+/g,' ').trim()).filter(t=>t.length>1);
  const text=blocks.length>=3?blocks.join('\n\n'):(root.textContent||'').replace(/[ \t]+/g,' ');
  return {title:(doc.title||'').trim(),text};
}
async function fetchUrl(){
  const u=$('url-input').value.trim();
  if(!/^https?:\/\//i.test(u)){toast('Geçerli bir URL gir (https://...)');return;}
  $('url-info').textContent='Çekiliyor...';
  try{
    const r=await fetchUrlText(u);urlText=r.text;
    $('url-info').textContent='✓ '+nf(tokenize(urlText).length)+' kelime çekildi.';
    if(r.title&&!$('lib-title-input').value) $('lib-title-input').value=r.title;
  }catch(e){$('url-info').textContent='URL çekilemedi. Metni kopyalayıp Metin sekmesine yapıştır.';}
}

function optsToSave(o){return {from:o.from,to:o.to,rmHeader:o.rmHeader,rmPage:o.rmPage,rmFoot:o.rmFoot,dehyph:o.dehyph,src:o.src,off:[...o.off]};}
function optsFromReport(A,r){
  const o=defaultPdfOpts(A);
  if(r&&r.opts) Object.assign(o,r.opts,{off:new Set(r.opts.off||[])});
  else if(r&&r.range){o.from=r.range[0];o.to=r.range[1];}
  return o;
}
