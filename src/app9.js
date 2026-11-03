
/* ══════════════════════════════════════════════════════════════
   27. ÜCRETSİZ KİTAPLAR (telifsiz katalog)
   Kitaplar uygulamanın kendi sunucusundaki katalog/ klasöründen iner.
══════════════════════════════════════════════════════════════ */
const KATALOG_URL=window.KATALOG_URL||'katalog/';
const KAT_TURLER=['Tümü','Roman','Öykü','Şiir','Tarih','Psikoloji','Felsefe','Destan','Klasik','Tiyatro'];
let katalog=null,katTur='Tümü',katDil='tümü',katQ='',katDetailId=null;

async function loadKatalog(){
  if(katalog) return katalog;
  try{const r=await fetch(KATALOG_URL+'index.json');if(!r.ok)throw new Error(r.status);katalog=await r.json();}
  catch(e){katalog=null;return [];}
  return katalog;
}
function katBook(id){return library.find(b=>b.catalogId===id);}
function katCoverHTML(k,big){
  const owned=katBook(k.id);
  return '<div class="'+(big?'bd-cover':'lib-card-cover')+'" style="background:'+coverGradient(k.baslik+k.yazar)+'">'+
    '<div class="kat-badge">'+esc(k.tur)+(k.dil==='en'?' · EN':'')+'</div>'+
    (owned?'<div class="lib-card-badges"><div class="lib-card-badge done">✓ EKLİ</div></div>':'')+
    '<div class="lib-cover-inner"><div class="lib-cover-brand-line">hızlıkitapoku</div><div class="lib-cover-spacer"></div>'+
    '<div class="lib-cover-title-text">'+esc(k.baslik)+'</div><div class="lib-cover-divider"></div><div class="lib-cover-author-text">'+esc(k.yazar)+'</div></div></div>';
}
function katCard(k){
  return '<div class="lib-card kat-card" data-kat="'+esc(k.id)+'">'+katCoverHTML(k)+
    '<div class="lib-card-meta"><div class="lib-card-title">'+esc(k.baslik)+'</div>'+
    '<div class="lib-card-sub">'+esc(k.yazar)+'</div>'+
    '<div class="lib-card-sub">'+nf(k.kelime)+' kelime · ~'+fmtWordsTime(k.kelime)+'</div></div></div>';
}
function katFiltered(){
  const q=trLower(katQ.trim());
  return (katalog||[]).filter(k=>(katTur==='Tümü'||k.tur===katTur)&&(katDil==='tümü'||k.dil===katDil)&&
    (!q||trLower(k.baslik+' '+k.yazar+' '+k.aciklama).includes(q)));
}
async function openKatalog(tur){
  $('kat-overlay').classList.add('visible');
  if(tur) katTur=tur;
  $('kat-grid').innerHTML='<div class="lib-empty-state"><div class="icon">⏳</div><p>Katalog yükleniyor...</p></div>';
  await loadKatalog();
  if(!katalog){$('kat-grid').innerHTML='<div class="lib-empty-state"><div class="icon">📡</div><p>Katalog yüklenemedi — internet bağlantını kontrol et.</p></div>';return;}
  renderKatalog();
  setTimeout(()=>{if(window.innerWidth>860)$('kat-q').focus();},50);
}
function closeKatalog(){$('kat-overlay').classList.remove('visible');}
function renderKatalog(){
  if(!katalog) return;
  const sayac=t=>katalog.filter(k=>(t==='Tümü'||k.tur===t)&&(katDil==='tümü'||k.dil===katDil)).length;
  $('kat-tur-chips').innerHTML=KAT_TURLER.filter(t=>sayac(t)>0).map(t=>'<button class="chip'+(t===katTur?' active':'')+'" data-tur="'+t+'">'+t+' <small>'+sayac(t)+'</small></button>').join('');
  $('kat-dil-chips').innerHTML=[['tümü','Tüm diller'],['tr','🇹🇷 Türkçe'],['en','🇬🇧 İngilizce']].map(([v,l])=>'<button class="chip'+(v===katDil?' active':'')+'" data-dil="'+v+'">'+l+'</button>').join('');
  const list=katFiltered();
  $('kat-grid').innerHTML=list.length?list.map(katCard).join(''):'<div class="lib-empty-state"><div class="icon">🔎</div><p>Aramana uygun kitap yok.</p></div>';
  $('kat-count').textContent=list.length+' kitap';
}
$('kat-tur-chips').addEventListener('click',e=>{const b=e.target.closest('[data-tur]');if(!b)return;katTur=b.dataset.tur;renderKatalog();});
$('kat-dil-chips').addEventListener('click',e=>{const b=e.target.closest('[data-dil]');if(!b)return;katDil=b.dataset.dil;renderKatalog();});
$('kat-q').addEventListener('input',e=>{katQ=e.target.value;renderKatalog();});
document.addEventListener('click',e=>{const c=e.target.closest('.kat-card');if(c)showKatDetail(c.dataset.kat);});

async function showKatDetail(id){
  await loadKatalog();
  const k=(katalog||[]).find(x=>x.id===id);if(!k){toast('Kitap katalogda bulunamadı.');return;}
  katDetailId=id;
  const owned=katBook(id);
  $('kat-d-cover').innerHTML=katCoverHTML(k,true);
  $('kat-d-title').textContent=k.baslik;
  $('kat-d-author').textContent=k.yazar+(k.yil?' · '+(k.yil<0?'MÖ '+(-k.yil):k.yil):'');
  $('kat-d-desc').textContent=k.aciklama;
  $('kat-d-stats').innerHTML=
    '<div class="bd-stat"><div class="bd-stat-val">'+nf(k.kelime)+'</div><div class="bd-stat-lbl">kelime</div></div>'+
    '<div class="bd-stat"><div class="bd-stat-val">'+fmtWordsTime(k.kelime)+'</div><div class="bd-stat-lbl">'+getWpm()+' k/dk ile</div></div>'+
    '<div class="bd-stat"><div class="bd-stat-val">'+Math.max(1,Math.ceil(k.kelime/partSize()))+'</div><div class="bd-stat-lbl">'+settings.goalMin+' dk\'lık gün</div></div>'+
    (k.bolum?'<div class="bd-stat"><div class="bd-stat-val">'+k.bolum+'</div><div class="bd-stat-lbl">bölüm</div></div>':'');
  $('kat-d-src').innerHTML='Kaynak: <a href="'+esc(k.kaynak)+'" target="_blank" rel="noopener">'+esc(k.kaynakAdi)+'</a> · '+esc(k.lisans)+(k.dil==='en'?' · İngilizce metin':'');
  $('kat-d-add').textContent=owned?'✓ Kütüphanende — Aç':'+ Kütüphaneye Ekle';
  $('kat-d-read').textContent=owned?(owned.progress>0&&!owned.finished?'▶ Kaldığın Yerden Devam':'▶ Oku'):'▶ Ekle ve Oku';
  $('kat-modal').classList.add('visible');
}
function closeKatDetail(){$('kat-modal').classList.remove('visible');katDetailId=null;}
/* "§§ " ile işaretli paragraflar bölüm başlığıdır */
function extractMarkedChapters(t){
  const paras=String(t||'').replace(/\r\n?/g,'\n').split(/\n[ \t]*\n/);
  const out=[],ch=[];let w=0;
  for(let p of paras){
    let head=false;
    if(p.startsWith('§§ ')){p=p.slice(3);head=true;}
    const n=paraTokens(p).length;if(!n) continue;
    if(head){
      const prev=ch[ch.length-1];
      if(prev&&prev.w+prev.len===w&&prev.len<30){prev.len+=n;prev.title=prev.title+' · '+prettyTitle(p);}
      else ch.push({w,len:n,title:prettyTitle(p)});
    }
    out.push(p);w+=n;
  }
  return {text:out.join('\n\n'),chapters:ch.length>800?[]:ch};
}
async function katEkle(id,read){
  const owned=katBook(id);
  if(owned){
    closeKatDetail();
    if(read){closeKatalog();hideLanding();toggleLibraryPanel(false);if(await openBook(owned.id,null,owned.lastMode))beginReading();}
    else{closeKatalog();showBookDetail(owned.id);}
    return;
  }
  const k=(katalog||[]).find(x=>x.id===id);if(!k) return;
  const btns=[$('kat-d-add'),$('kat-d-read')];btns.forEach(b=>b.disabled=true);
  toast('📥 "'+k.baslik+'" indiriliyor...',20000);
  try{
    const r=await fetch(KATALOG_URL+encodeURIComponent(id)+'.json');
    if(!r.ok) throw new Error('HTTP '+r.status);
    const d=await r.json();
    const {text,chapters}=extractMarkedChapters(d.metin);
    const meta=await addBookFromText(d.baslik+' — '+d.yazar,text,{
      chapters,catalogId:id,source:'katalog',sourceUrl:d.kaynak,sourceName:d.kaynakAdi,license:d.lisans,
      genre:d.tur,lang:d.dil,split:chapters.length>=2?'chapters':'parts'
    });
    if(!meta) throw new Error('Metin eklenemedi');
    toast('✓ "'+k.baslik+'" kütüphaneye eklendi.');
    closeKatDetail();renderKatalog();renderLndKatalog();
    if(read){closeKatalog();hideLanding();toggleLibraryPanel(false);await openBook(meta.id,0);beginReading();}
  }catch(e){toast('⚠ İndirilemedi: '+e.message+' — internet bağlantını kontrol et.',5000);}
  btns.forEach(b=>b.disabled=false);
}
/* Ana ekrandaki vitrin */
const VITRIN=['kurk-mantolu-madonna','os-pembe-incili-kaftan','os-kasagi','nutuk-1927','dede-korkut','os-forsa','antigone','en-the-crowd','en-metamorphosis','en-sherlock-holmes','en-meditations','ataturk-soylevler'];
async function renderLndKatalog(){
  const grid=$('lnd-kat-grid');if(!grid) return;
  await loadKatalog();
  if(!katalog||!katalog.length){$('lnd-kat-sec').style.display='none';return;}
  $('lnd-kat-sec').style.display='';
  $('lnd-kat-count').textContent='('+katalog.length+')';
  const picks=VITRIN.map(id=>katalog.find(k=>k.id===id)).filter(Boolean);
  grid.innerHTML=picks.map(katCard).join('');
  $('lnd-kat-chips').innerHTML=KAT_TURLER.slice(1).filter(t=>katalog.some(k=>k.tur===t)).map(t=>'<button class="chip" onclick="openKatalog(\''+t+'\')">'+t+'</button>').join('');
}
/* ?kitap=<id> bağlantısıyla doğrudan kitabı aç (kitaplar.html sayfasından gelenler) */
async function handleKitapParam(){
  const id=new URLSearchParams(location.search).get('kitap');
  if(!id) return;
  await loadKatalog();
  if(katalog&&katalog.some(k=>k.id===id)) showKatDetail(id);
}
