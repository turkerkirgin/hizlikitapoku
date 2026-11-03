
/* ══════════════════════════════════════════════════════════════
   17. BÖLÜMLER ÇEKMECESİ / İÇİNDEKİLER
══════════════════════════════════════════════════════════════ */
function tocHTML(secs,progress,deletable){
  const wpm=getWpm();
  return secs.map((s,i)=>{
    const len=s.end-s.start;
    const done=progress>=s.end;
    const cur=!done&&progress>=s.start;
    const pct=cur?Math.round((progress-s.start)/len*100):0;
    const mins=Math.max(1,Math.round(len/wpm));
    return '<div class="toc-item'+(done?' done':'')+(cur?' current':'')+'" data-start="'+s.start+'">'+
      '<span class="toc-num">'+(i+1)+'</span>'+
      '<div class="toc-main"><div class="toc-title">'+esc(s.title)+'</div>'+
      '<div class="toc-meta">'+nf(len)+' kelime · ~'+mins+' dk'+(cur?' · %'+pct:'')+'</div>'+
      (cur?'<div class="toc-bar"><i style="width:'+pct+'%"></i></div>':'')+'</div>'+
      '<span class="toc-state">'+(done?'✓':cur?'▶':'')+'</span>'+
      (deletable&&s.chapter?'<button class="toc-del" data-del="'+s.start+'" title="Bu başlığı bölüm listesinden çıkar">✕</button>':'')+
      '</div>';
  }).join('');
}
function renderTocDrawer(){
  const list=$('toc-list');
  if(!words.length){list.innerHTML='<div class="toc-sub">Önce bir kitap aç.</div>';return;}
  const split=curSplit();
  $('toc-sub').textContent=split==='parts'||!sections.some(s=>s.chapter)
    ?'Günlük parçalar: her biri '+settings.goalMin+' dk × '+getWpm()+' k/dk ≈ '+nf(partSize())+' kelime.'
    :sections.filter(s=>s.chapter).length+' bölüm. Tıkla → o bölüme atla.';
  document.querySelectorAll('#toc-seg button').forEach(b=>b.classList.toggle('active',b.dataset.split===(sections.some(s=>s.chapter)?'chapters':'parts')));
  list.innerHTML=tocHTML(sections,idx,true);
  const cur=list.querySelector('.current');if(cur)cur.scrollIntoView({block:'center'});
}
function toggleToc(force){
  const d=$('toc-drawer');
  const open=force===undefined?!d.classList.contains('visible'):force;
  d.classList.toggle('visible',open);
  if(open) renderTocDrawer();
}
$('toc-list').addEventListener('click',e=>{
  const del=e.target.closest('[data-del]');
  if(del){e.stopPropagation();deleteChapterAt(+del.dataset.del,curBook);return;}
  const it=e.target.closest('.toc-item');if(!it) return;
  jumpTo(+it.dataset.start);
  if(window.innerWidth<860) toggleToc(false);
});
async function deleteChapterAt(w,book){
  if(book){book.chapters=(book.chapters||[]).filter(c=>c.w!==w);saveMetaSoon(book,true);}
  if(curBook&&book&&curBook.id===book.id||!book){curChapters=(curChapters||[]).filter(c=>c.w!==w);if(curBook)curChapters=curBook.chapters;rebuildStructure();setProgressUI();}
  if($('toc-drawer').classList.contains('visible')) renderTocDrawer();
  if(detailBookId&&book&&book.id===detailBookId) renderDetailToc(book);
}
function setSplit(kind,fromDetail){
  if(fromDetail){
    const b=library.find(x=>x.id===detailBookId);if(!b) return;
    b.split=kind;saveMetaSoon(b,true);
    if(curBook&&curBook.id===b.id){rebuildStructure();setProgressUI();}
    showBookDetail(b.id);
    return;
  }
  if(curBook){curBook.split=kind;saveMetaSoon(curBook,true);}else adhocSplit=kind;
  if(kind==='chapters'&&!(curChapters&&curChapters.length)) toast('Bu metinde bölüm başlığı bulunamadı — günlük parçalar kullanılıyor.');
  rebuildStructure();
  if(running&&mode==='normal') renderNormalSection(sectionIndexOf(idx),idx);
  setProgressUI();renderTocDrawer();
}

/* ══════════════════════════════════════════════════════════════
   18. KÜTÜPHANE ARAYÜZÜ
══════════════════════════════════════════════════════════════ */
let libFilter='all',detailBookId=null,detailMode=mode;
function coverGradient(title){
  let h=0;for(let i=0;i<title.length;i++)h=(h*31+title.charCodeAt(i))>>>0;
  const P=[['#0d1b2a','#1b263b','#415a77'],['#1a0a2e','#2d1b69','#5e60ce'],['#0a1628','#0d2137','#1D9E75'],['#1a0808','#2d1010','#9b2226'],['#0a1a0a','#122616','#2d6a4f'],['#1a1200','#2d2000','#b5830f'],['#160a1a','#26103a','#7b2d8b'],['#001a1a','#003333','#0a7a7a'],['#1a0d06','#2e1a0a','#8b4513'],['#0a0a1a','#12122d','#3a3a8c']];
  const p=P[h%P.length];
  return 'linear-gradient(150deg,'+p[0]+' 0%,'+p[1]+' 55%,'+p[2]+' 100%)';
}
function splitTitle(t){const p=String(t).split('—').map(s=>s.trim());return {title:p[0],author:p.slice(1).join(' — ')};}
function bookPct(b){return b.wordCount>0?Math.round(clamp((b.progress||0)/b.wordCount,0,1)*100):0;}
function coverStyle(b){return b.coverUrl?'background:url(\''+String(b.coverUrl).replace(/'/g,'%27')+'\') center/cover no-repeat':'background:'+coverGradient(b.title);}
function setLibFilter(f){
  libFilter=f;
  document.querySelectorAll('.lib-filter-tab').forEach(b=>b.classList.toggle('active',b.dataset.f===f));
  renderLibrary();
}
function renderLibrary(){
  const grid=$('lib-grid');if(!grid) return;
  if(!libraryReady){grid.innerHTML='<div class="lib-empty-state"><div class="icon">⏳</div><p>Kütüphane yükleniyor...</p></div>';return;}
  let books=sortedLibrary();
  if(libFilter==='wishlist') books=books.filter(b=>b.wishlist);
  if(libFilter==='favorite') books=books.filter(b=>b.favorite);
  if(libFilter==='finished') books=books.filter(b=>b.finished);
  if(libFilter==='reading') books=books.filter(b=>!b.finished&&(b.progress||0)>0);
  if(!books.length){
    const msgs={wishlist:'İstek listesi boş.',favorite:'Favori kitap yok.',finished:'Henüz bitirilen kitap yok.',reading:'Okunmaya başlanmış kitap yok.',all:'Henüz kitap eklenmemiş.'};
    grid.innerHTML='<div class="lib-empty-state"><div class="icon">📚</div><p>'+(msgs[libFilter]||'Boş.')+'</p></div>';
    return;
  }
  grid.innerHTML=books.map(b=>{
    const pct=bookPct(b),{title,author}=splitTitle(b.title);
    const badges=(b.finished?'<div class="lib-card-badge done">✓ BİTTİ</div>':'')+(b.wishlist?'<div class="lib-card-badge">♥</div>':'')+(b.favorite?'<div class="lib-card-badge">★</div>':'');
    const inner=b.coverUrl
      ?'<div class="lib-cover-inner" style="background:linear-gradient(to top,rgba(0,0,0,.75) 0%,transparent 55%)"><div class="lib-cover-spacer"></div><div class="lib-cover-title-text">'+esc(title)+'</div><div class="lib-cover-divider"></div><div class="lib-cover-author-text">'+(esc(author)||'&nbsp;')+'</div></div>'
      :'<div class="lib-cover-inner"><div class="lib-cover-brand-line">hızlıkitapoku</div><div class="lib-cover-spacer"></div><div class="lib-cover-title-text">'+esc(title)+'</div><div class="lib-cover-divider"></div><div class="lib-cover-author-text">'+(esc(author)||'&nbsp;')+'</div></div>';
    return '<div class="lib-card" onclick="showBookDetail('+b.id+')">'+
      '<div class="lib-card-cover" style="'+coverStyle(b)+'">'+(badges?'<div class="lib-card-badges">'+badges+'</div>':'')+inner+'</div>'+
      '<div class="lib-card-meta"><div class="lib-card-title">'+esc(title)+'</div>'+
      '<div class="lib-card-sub">'+(pct>0?'%'+pct+' okundu':nf(b.wordCount)+' kelime')+' · ~'+fmtWordsTime(b.wordCount)+'</div>'+
      '<div class="lib-card-prog"><div class="lib-card-prog-fill" style="width:'+pct+'%"></div></div></div></div>';
  }).join('');
  updateStorageNote();
}
async function updateStorageNote(){
  const el=$('lib-storage-note');
  let t='Kitaplığım · '+library.length+' kitap';
  try{if(navigator.storage&&navigator.storage.estimate){const e=await navigator.storage.estimate();if(e&&e.usage)t+=' · '+(e.usage/1048576).toFixed(1)+' MB kullanılıyor';}}catch(e){}
  if(!DB.db) t+=' · ⚠ IndexedDB yok, depolama sınırlı';
  el.textContent=t;
}
function renderAllLibraries(){renderLibrary();renderLndLibrary();renderContinue();}
function toggleLibraryPanel(force){
  const o=$('lib-overlay');
  const open=force===undefined?!o.classList.contains('visible'):force;
  o.classList.toggle('visible',open);
  $('lib-toggle-btn').classList.toggle('active',open);
  if(open) renderLibrary();
}
function showBookDetail(id){
  const book=library.find(b=>b.id===id);if(!book) return;
  detailBookId=id;
  const {title,author}=splitTitle(book.title);
  const cv=$('bd-cover');
  cv.setAttribute('style',coverStyle(book));
  cv.innerHTML=book.coverUrl
    ?'<div class="bd-cover-inner" style="background:linear-gradient(to top,rgba(0,0,0,.75) 0%,transparent 55%)"><div class="bd-cover-spacer"></div><div class="bd-cover-title">'+esc(title)+'</div><div class="bd-cover-div"></div><div class="bd-cover-author">'+esc(author)+'</div></div>'
    :'<div class="bd-cover-inner"><div class="bd-cover-brand">hızlıkitapoku</div><div class="bd-cover-spacer"></div><div class="bd-cover-title">'+esc(title)+'</div><div class="bd-cover-div"></div><div class="bd-cover-author">'+esc(author)+'</div></div>';
  $('bd-cover-remove-btn').style.display=book.coverUrl?'block':'none';
  $('bd-title').innerHTML=esc(title)+(book.finished?'<span class="bd-badge-done">✓ BİTTİ</span>':'');
  $('bd-author').textContent=author||' ';
  $('bd-source').innerHTML=book.sourceUrl?'Kaynak: <a href="'+esc(book.sourceUrl)+'" target="_blank" rel="noopener">'+esc(book.sourceName||'bağlantı')+'</a>'+(book.license?' · '+esc(book.license):''):'';
  const n=book.wordCount||0,wpm=getWpm();
  $('bd-words').textContent=nf(n);
  $('bd-time').textContent=fmtWordsTime(n);
  if(book.pages){$('bd-pages').textContent=book.pages;$('bd-pages-lbl').textContent='PDF sayfa';}
  else{$('bd-pages').textContent=Math.max(1,Math.round(n/280));$('bd-pages-lbl').textContent='~sayfa';}
  const per=partSize();
  $('bd-sessions').textContent=Math.max(1,Math.ceil(n/per));
  $('bd-sessions-lbl').textContent=settings.goalMin+' dk\'lık oturum';
  const secs=bookSections(book);
  $('bd-chcount').textContent=(book.chapters||[]).length||'—';
  const pct=bookPct(book);
  $('bd-pct').textContent='%'+pct;
  $('bd-progress-fill').style.width=pct+'%';
  const si=secs.length?bsearch(secs.map(s=>s.start),book.progress||0):0;
  $('bd-progress-txt').textContent=(book.progress>0&&secs[si]&&secs.length>1)?'Şu an: '+secs[si].title:'Okuma İlerlemesi';
  /* plan */
  const left=Math.max(0,n-(book.progress||0));
  const days=Math.ceil(left/per);
  const end=new Date();end.setDate(end.getDate()+Math.max(0,days-1));
  $('bd-plan').innerHTML=book.finished
    ?'✓ Bu kitabı bitirdin'+(book.finishedAt?' ('+new Date(book.finishedAt).toLocaleDateString('tr-TR')+')':'')+'. İstersen baştan okuyabilirsin.'
    :'📅 Günde <b>'+settings.goalMin+' dk</b>, <b>'+wpm+' k/dk</b> hızla ≈ günde <b>'+nf(per)+' kelime</b>. Kalan <b>'+nf(left)+'</b> kelime → <b>'+days+' gün</b>'+(days>0?', tahmini bitiş <b>'+end.toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})+'</b>':'')+'.';
  $('bd-start-btn').textContent=book.finished?'▶ Baştan Oku':(pct>0?'▶ Kaldığım Yerden Devam Et':'▶ Okumaya Başla');
  $('bd-restart-btn').style.display=pct>0&&!book.finished?'':'none';
  $('bd-wishlist-btn').textContent=book.wishlist?'♥ İstek Listesinden Çıkar':'♡ İstek Listesine Ekle';
  $('bd-fav-btn').textContent=book.favorite?'★ Favorilerden Çıkar':'☆ Favorilere Ekle';
  $('bd-attach-btn').style.display=book.hasPdf?'none':'';
  $('bd-finish-btn').textContent=book.finished?'↺ Bitmedi Olarak İşaretle':'✓ Bitti Olarak İşaretle';
  detailMode=book.lastMode&&MODE_NAMES[book.lastMode]?book.lastMode:mode;
  document.querySelectorAll('.bd-mode-tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===detailMode));
  renderDetailToc(book);
  $('book-detail').classList.add('visible');
}
function renderDetailToc(book){
  const secs=bookSections(book);
  const hasCh=(book.chapters||[]).length>0;
  const eff=book.split==='parts'||!hasCh?'parts':'chapters';
  document.querySelectorAll('#bd-seg button').forEach(b=>b.classList.toggle('active',b.dataset.split===eff));
  $('bd-toc-list').innerHTML=secs.length?tocHTML(secs,book.progress||0,eff==='chapters'):'<div class="toc-sub">Bölüm yok.</div>';
  const cur=$('bd-toc-list').querySelector('.current');
  if(cur) $('bd-toc-list').scrollTop=cur.offsetTop-120;
}
$('bd-toc-list').addEventListener('click',e=>{
  const book=library.find(b=>b.id===detailBookId);if(!book) return;
  const del=e.target.closest('[data-del]');
  if(del){e.stopPropagation();deleteChapterAt(+del.dataset.del,book);return;}
  const it=e.target.closest('.toc-item');if(!it) return;
  startBookFromDetail(+it.dataset.start);
});
function closeBookDetail(){$('book-detail').classList.remove('visible');detailBookId=null;}
function setBdMode(m){detailMode=m;document.querySelectorAll('.bd-mode-tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));}
async function openBook(id,startAt,modeOverride){
  const book=library.find(b=>b.id===id);if(!book) return false;
  if(curBook&&curBook.id!==id) saveProgress(true);
  const text=await Store.getText(id);
  if(text==null){toast('⚠ Kitabın metni bulunamadı.');return false;}
  stopEngine();running=false;paused=false;
  curBook=book;loadWords(text);
  if(book.wordCount!==words.length){book.wordCount=words.length;saveMetaSoon(book);}
  curChapters=book.chapters||[];
  rebuildStructure();
  if(startAt!=null) idx=clamp(startAt,0,words.length-1);
  else if(book.finished||(book.progress||0)>=words.length-1) idx=0;
  else idx=resumePoint(book.progress||0);
  if(modeOverride&&MODE_NAMES[modeOverride]){mode=modeOverride;settings.mode=mode;saveSettings();}
  updateModeUI();updateCurBookCard();setProgressUI();updateIdle();
  return true;
}
async function startBookFromDetail(startAt){
  if(!detailBookId) return;
  const id=detailBookId;
  const ok=await openBook(id,startAt,detailMode);
  if(!ok) return;
  closeBookDetail();toggleLibraryPanel(false);hideLanding();
  beginReading();
}
function toggleWishlistFromDetail(){const b=library.find(x=>x.id===detailBookId);if(!b)return;b.wishlist=!b.wishlist;saveMetaSoon(b,true);showBookDetail(b.id);renderAllLibraries();}
function toggleFavFromDetail(){const b=library.find(x=>x.id===detailBookId);if(!b)return;b.favorite=!b.favorite;saveMetaSoon(b,true);showBookDetail(b.id);renderAllLibraries();}
function toggleFinishedFromDetail(){
  const b=library.find(x=>x.id===detailBookId);if(!b)return;
  b.finished=!b.finished;
  if(b.finished){b.progress=b.wordCount;b.finishedAt=Date.now();}
  saveMetaSoon(b,true);showBookDetail(b.id);renderAllLibraries();
}
function renameBookFromDetail(){
  const b=library.find(x=>x.id===detailBookId);if(!b)return;
  const t=prompt('Yeni ad (Kitap Adı — Yazar):',b.title);
  if(t&&t.trim()){b.title=t.trim();saveMetaSoon(b,true);showBookDetail(b.id);renderAllLibraries();updateCurBookCard();}
}
async function deleteBookFromDetail(){
  if(!confirm('Bu kitabı silmek istediğine emin misin?')) return;
  const id=detailBookId;closeBookDetail();
  await removeBook(id);
  toast('Kitap silindi.');
}
async function redetectChapters(){
  const b=library.find(x=>x.id===detailBookId);if(!b)return;
  const text=await Store.getText(b.id);if(text==null)return;
  const ch=detectChaptersAuto(prepareText(text));
  if(ch.length<2){toast('Metinde belirgin bölüm başlığı bulunamadı. "Günlük parçalar" kullanabilirsin.',4000);return;}
  if(b.chapters&&b.chapters.length&&!confirm(ch.length+' bölüm bulundu. Mevcut '+b.chapters.length+' bölümün yerine geçsin mi?')) return;
  b.chapters=ch;b.split='chapters';saveMetaSoon(b,true);
  if(curBook&&curBook.id===b.id){curChapters=ch;rebuildStructure();setProgressUI();}
  showBookDetail(b.id);toast(ch.length+' bölüm algılandı.');
}
function setCoverFromFile(input){
  const f=input.files&&input.files[0];input.value='';
  if(!f) return;
  const img=new Image(),url=URL.createObjectURL(f);
  img.onload=()=>{
    const s=Math.min(1,480/Math.max(img.width,img.height));
    const c=document.createElement('canvas');c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    URL.revokeObjectURL(url);
    const b=library.find(x=>x.id===detailBookId);if(!b)return;
    b.coverUrl=c.toDataURL('image/jpeg',0.85);saveMetaSoon(b,true);
    showBookDetail(b.id);renderAllLibraries();
  };
  img.onerror=()=>{URL.revokeObjectURL(url);toast('Resim okunamadı.');};
  img.src=url;
}
function removeCoverFromDetail(){const b=library.find(x=>x.id===detailBookId);if(!b)return;delete b.coverUrl;saveMetaSoon(b,true);showBookDetail(b.id);renderAllLibraries();}
async function refetchCover(){
  const b=library.find(x=>x.id===detailBookId);if(!b)return;
  toast('🔎 Open Library\'de aranıyor...');
  const ok=await autoFetchCover(b.id,b.title,true);
  if(!ok) toast('Kapak bulunamadı. Kendi fotoğrafını ekleyebilirsin.');
}
async function autoFetchCover(bookId,title,force){
  try{
    const {title:t,author}=splitTitle(title);
    let q='title='+encodeURIComponent(t);if(author)q+='&author='+encodeURIComponent(author);
    const res=await fetch('https://openlibrary.org/search.json?'+q+'&limit=5&fields=cover_i,title');
    if(!res.ok) return false;
    const data=await res.json();
    const doc=(data.docs||[]).find(d=>d.cover_i);
    const book=library.find(b=>b.id===bookId);
    if(doc&&book&&(force||!book.coverUrl)){
      book.coverUrl='https://covers.openlibrary.org/b/id/'+doc.cover_i+'-L.jpg';
      saveMetaSoon(book,true);renderAllLibraries();
      if(detailBookId===bookId) showBookDetail(bookId);
      return true;
    }
  }catch(e){}
  return false;
}
/* Yedekleme */
async function exportBackup(){
  toast('Yedek hazırlanıyor...');
  const books=[];
  for(const b of library){const text=await Store.getText(b.id);books.push({meta:b,text});}
  const data={app:'hizlikitapoku',version:3,date:new Date().toISOString(),books,log:dayLog,settings};
  const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='hizlikitapoku-yedek-'+dayKey()+'.json';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  toast('⤓ Yedek indirildi ('+(blob.size/1048576).toFixed(1)+' MB)');
}
async function importBackup(input){
  const f=input.files&&input.files[0];input.value='';if(!f)return;
  try{
    const data=JSON.parse(await f.text());
    if(!data||!['turkerokuma','hizlikitapoku'].includes(data.app)||!Array.isArray(data.books)) throw new Error('Bu bir HızlıKitapOku yedeği değil.');
    let added=0,updated=0;
    for(const {meta,text} of data.books){
      if(!meta||text==null) continue;
      const ex=library.find(b=>b.id===meta.id);
      if(ex){
        if((meta.lastReadAt||0)>(ex.lastReadAt||0)){Object.assign(ex,meta);await Store.saveMeta(ex);updated++;}
        continue;
      }
      library.push(meta);await Store.saveText(meta.id,text);await Store.saveMeta(meta);added++;
    }
    if(data.log){for(const k in data.log){const a=dayLog[k],b=data.log[k];if(!a||(b.sec||0)>(a.sec||0))dayLog[k]=b;}saveLog();}
    renderAllLibraries();
    toast('⤒ Yedek yüklendi: '+added+' yeni, '+updated+' güncellenen kitap.',4000);
  }catch(e){toast('⚠ Yedek okunamadı: '+e.message,4500);}
}
function saveToLibrary(){
  const title=$('lib-title-input').value.trim();
  const text=getSourceText();
  if(!text){toast('Önce bir metin gir ya da URL\'den çek.');return;}
  if(!title){toast('Bir isim gir: "Kitap Adı — Yazar"');$('lib-title-input').focus();return;}
  addBookFromText(title,text,{source:src}).then(async m=>{
    if(!m) return;
    $('lib-title-input').value='';
    toast('💾 "'+title+'" kütüphaneye eklendi.');
    if(running&&!curBook){const keep=idx;await openBook(m.id,keep);beginReading();}
  });
}
