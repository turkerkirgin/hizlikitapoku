'use strict';
if(typeof pdfjsLib!=='undefined') pdfjsLib.GlobalWorkerOptions.workerSrc=window.PDFJS_WORKER||'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/* ══════════════════════════════════════════════════════════════
   1. YARDIMCILAR
══════════════════════════════════════════════════════════════ */
const $=id=>document.getElementById(id);
const LS={
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}},
  del(k){try{localStorage.removeItem(k);}catch(e){}}
};
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function nf(n){return Math.round(n||0).toLocaleString('tr-TR');}
function pad2(n){return String(n).padStart(2,'0');}
function dayKey(d){d=d||new Date();return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());}
function fmtClock(sec){sec=Math.max(0,Math.round(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return (h?h+':'+pad2(m):m)+':'+pad2(s);}
function fmtMin(sec){if(sec>0&&sec<30)return '<1 dk';const m=Math.round(sec/60);if(m<60)return m+' dk';const h=Math.floor(m/60),r=m%60;return h+' sa'+(r?' '+r+' dk':'');}
function fmtWordsTime(n){return fmtMin(n/getWpm()*60);}
function trLower(s){return String(s).toLocaleLowerCase('tr-TR');}
function trUpper(s){return String(s).toLocaleUpperCase('tr-TR');}
/* arr sıralı; arr[i]<=v olan son i (yoksa 0) */
function bsearch(arr,v){let lo=0,hi=arr.length-1,r=0;while(lo<=hi){const m=(lo+hi)>>1;if(arr[m]<=v){r=m;lo=m+1;}else hi=m-1;}return r;}
let toastT=null;
function toast(msg,ms){const t=$('toast');t.textContent=msg;t.classList.add('visible');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('visible'),ms||2800);}
const sleep0=()=>new Promise(r=>setTimeout(r,0));
const MODE_NAMES={rsvp:'RSVP Modu',typewriter:'Harf Harf Modu',bionic:'Bionic Reading',scroll:'Scroll Modu',tiktok:'Kart Modu',normal:'Normal Okuma'};
const SENT_END=/[.!?…]["'»”’)\]]*$/;

/* ══════════════════════════════════════════════════════════════
   2. AYARLAR (kalıcı)
══════════════════════════════════════════════════════════════ */
const SETTINGS_KEY='turkerokuma_settings';
const settings=Object.assign({
  theme:'karanlık',font:'georgia',wpm:300,fs:(window.innerWidth<600?26:32),ambient:false,
  goalMin:15,stopAtGoal:true,chime:true,mode:'rsvp',custom:null,peek:true
},LS.get(SETTINGS_KEY,{}));
function saveSettings(){LS.set(SETTINGS_KEY,settings);}

/* ══════════════════════════════════════════════════════════════
   3. DEPOLAMA — IndexedDB (localStorage ~5 MB sınırına takılmamak için)
   meta: kitap bilgisi + ilerleme (küçük) · texts: kitap metni (büyük)
══════════════════════════════════════════════════════════════ */
const DB={
  db:null,
  open(){
    return new Promise(res=>{
      try{
        if(!window.indexedDB) return res(null);
        const r=indexedDB.open('turkerokuma',2);
        r.onupgradeneeded=()=>{
          const d=r.result;
          if(!d.objectStoreNames.contains('meta')) d.createObjectStore('meta',{keyPath:'id'});
          if(!d.objectStoreNames.contains('texts')) d.createObjectStore('texts',{keyPath:'id'});
          if(!d.objectStoreNames.contains('pdfs')) d.createObjectStore('pdfs',{keyPath:'id'});
        };
        r.onsuccess=()=>{DB.db=r.result;res(DB.db);};
        r.onerror=()=>res(null);
        r.onblocked=()=>res(null);
      }catch(e){res(null);}
    });
  },
  tx(store,mode,fn){
    return new Promise((res,rej)=>{
      if(!DB.db) return rej(new Error('Veritabanı yok'));
      let out;
      const t=DB.db.transaction(store,mode);
      const r=fn(t.objectStore(store));
      if(r) r.onsuccess=()=>{out=r.result;};
      t.oncomplete=()=>res(out);
      t.onerror=()=>rej(t.error);
      t.onabort=()=>rej(t.error||new Error('İşlem iptal'));
    });
  },
  all(s){return DB.tx(s,'readonly',st=>st.getAll());},
  get(s,id){return DB.tx(s,'readonly',st=>st.get(id));},
  put(s,o){return DB.tx(s,'readwrite',st=>st.put(o));},
  del(s,id){return DB.tx(s,'readwrite',st=>st.delete(id));}
};

const Store={
  texts:new Map(),
  async init(){await DB.open();return !!DB.db;},
  async allMeta(){
    if(DB.db){try{return (await DB.all('meta'))||[];}catch(e){return [];}}
    return LS.get('turkerokuma_meta_fb',[]);
  },
  async saveMeta(m){
    if(DB.db){try{await DB.put('meta',m);}catch(e){toast('⚠ Kayıt hatası: '+e.message);}return;}
    if(!LS.set('turkerokuma_meta_fb',library)) toast('⚠ Tarayıcı depolaması dolu.');
  },
  cache(id,text){
    this.texts.set(id,text);
    if(this.texts.size>3){const k=this.texts.keys().next().value;if(k!==id&&(!curBook||k!==curBook.id))this.texts.delete(k);}
  },
  async getText(id){
    if(this.texts.has(id)) return this.texts.get(id);
    let t=null;
    if(DB.db){try{const r=await DB.get('texts',id);if(r)t=r.text;}catch(e){}}
    else t=LS.get('turkerokuma_text_'+id,null);
    if(t!=null) this.cache(id,t);
    return t;
  },
  async saveText(id,text){
    this.cache(id,text);
    if(DB.db){try{await DB.put('texts',{id,text});}catch(e){toast('⚠ Metin kaydedilemedi: '+e.message,5000);}return;}
    if(!LS.set('turkerokuma_text_'+id,text)) toast('⚠ Tarayıcı depolaması dolu — bu kitap sadece bu oturumda kalır.',5000);
  },
  async savePdf(id,rec){
    if(!DB.db){toast('⚠ PDF dosyası saklanamadı (IndexedDB yok).');return;}
    try{await DB.put('pdfs',rec);}catch(e){toast('⚠ PDF dosyası kaydedilemedi: '+e.message,5000);}
  },
  async getPdf(id){if(!DB.db)return null;try{return await DB.get('pdfs',id);}catch(e){return null;}},
  async remove(id){
    this.texts.delete(id);
    if(DB.db){try{await DB.del('meta',id);await DB.del('texts',id);await DB.del('pdfs',id);}catch(e){}}
    else{LS.del('turkerokuma_text_'+id);LS.set('turkerokuma_meta_fb',library);}
  }
};
const metaTimers=new Map();
function saveMetaSoon(book,now){
  if(!book) return;
  clearTimeout(metaTimers.get(book.id));
  if(now){metaTimers.delete(book.id);Store.saveMeta(book);return;}
  metaTimers.set(book.id,setTimeout(()=>{metaTimers.delete(book.id);Store.saveMeta(book);},1200));
}

/* ══════════════════════════════════════════════════════════════
   4. METİN İŞLEME — kelimelere ayırma, Türkçe düzeltmeler
══════════════════════════════════════════════════════════════ */
const LT='A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u024F';
const RE_WORDCH=new RegExp('[0-9'+LT+'\\u0370-\\u03FF\\u0400-\\u04FF]');
const RE_LOWER=/[a-zß-öø-ÿğışçöüâîûœ]/;
/* "İstanbul' da" → "İstanbul'da" ,  "Samsun 'a" → "Samsun'a" */
const RE_APOS_A=new RegExp('(['+LT+'])([\\u0027\\u2019])[ \\t]+([a-zçğıöşüâîû]{1,6})(?=[\\s.,;:!?)\\]»”"]|$)','g');
const RE_APOS_B=new RegExp('(['+LT+'])[ \\t]+([\\u0027\\u2019])([a-zçğıöşüâîû]{1,6})(?=[\\s.,;:!?)\\]»”"]|$)','g');
const APOS_STOP=new Set(['ve','ile','bir','bu','şu','o','ki','ama','ne','mi','gibi','için','çok','en','her','hiç']);
function fixApostrophes(s){
  if(s.indexOf("'")<0&&s.indexOf('’')<0) return s;
  return s.replace(RE_APOS_A,(m,a,q,x)=>APOS_STOP.has(x)?m:a+q+x).replace(RE_APOS_B,(m,a,q,x)=>APOS_STOP.has(x)?m:a+q+x);
}
const MOJI={'ý':'ı','þ':'ş','ð':'ğ','Ý':'İ','Þ':'Ş','Ð':'Ğ'};
/* Türkçe PDF'lerde sık görülen bozuk kodlama: ý→ı, þ→ş, ð→ğ */
function fixMojibake(s){
  const bad=(s.match(/[ýþðÝÞÐ]/g)||[]).length;
  if(bad<20) return {text:s,fixed:0};
  const good=(s.match(/[ışğİŞĞ]/g)||[]).length;
  if(good*1.5>bad) return {text:s,fixed:0};
  return {text:s.replace(/[ýþðÝÞÐ]/g,c=>MOJI[c]),fixed:bad};
}
function fixLigatures(s){
  return s.replace(/ﬀ/g,'ff').replace(/ﬁ/g,'fi').replace(/ﬂ/g,'fl').replace(/ﬃ/g,'ffi').replace(/ﬄ/g,'ffl').replace(/­/g,'').replace(/[​-‍﻿]/g,'');
}
function cleanIncomingText(t){
  t=fixLigatures(String(t||''));
  return fixMojibake(t).text;
}
/* Bir paragrafın kelimeleri — prepareText ile birebir aynı kural */
function paraTokens(p){
  const s=fixApostrophes(p.replace(/[\s ]+/g,' ').trim());
  if(!s) return [];
  const out=[];
  for(const t of s.split(' ')) if(t&&RE_WORDCH.test(t)) out.push(t);
  return out;
}
function prepareText(text){
  let t=String(text||'').replace(/\r\n?/g,'\n');
  /* Boş satır yoksa ama satırlar uzunsa: her satır bir paragraftır */
  if(!/\n[ \t]*\n/.test(t)){
    const n=(t.match(/\n/g)||[]).length;
    if(n>3&&t.length/(n+1)>110) t=t.replace(/\n/g,'\n\n');
  }
  const words=[],paraEnds=new Set();
  for(const p of t.split(/\n[ \t]*\n/)){
    const toks=paraTokens(p);
    if(!toks.length) continue;
    for(const w of toks) words.push(w);
    paraEnds.add(words.length-1);
  }
  return {words,paraEnds};
}
function tokenize(t){return prepareText(t).words;}

/* ── Başlık biçimlendirme (Türkçe İ/ı doğru) ── */
const TITLE_LOWERS=new Set(['ve','ile','bir','bu','şu','o','da','de','ki','mi','mı','mu','mü','ya','ne','en','için','gibi','ama','fakat','lakin','veya','yahut','ile']);
function titleCaseTR(str){
  return str.split(' ').map((w,i)=>{
    if(/^[IVXLC]+[.)]?$/.test(w)) return w;
    const lw=trLower(w);
    if(i>0&&TITLE_LOWERS.has(lw)) return lw;
    const k=lw.search(RE_LOWER);
    if(k<0) return lw;
    return lw.slice(0,k)+trUpper(lw[k])+lw.slice(k+1);
  }).join(' ');
}
function isAllCaps(t){
  const l=t.replace(/[^A-Za-zÀ-ɏ]/g,'');
  return l.length>=2&&!RE_LOWER.test(l);
}
function prettyTitle(t){
  t=String(t||'').replace(/\s+/g,' ').trim();
  if(t.length>140) t=t.slice(0,137)+'…';
  return isAllCaps(t)?titleCaseTR(t):t;
}
function dedupeTitle(t){
  const w=t.split(' ');
  if(w.length>=2&&w.length%2===0){const h=w.length/2;if(w.slice(0,h).join(' ')===w.slice(h).join(' '))return w.slice(0,h).join(' ');}
  return t;
}

/* ══════════════════════════════════════════════════════════════
   5. BÖLÜM ALGILAMA
══════════════════════════════════════════════════════════════ */
function isUpperWord(w){
  const l=w.replace(/[^A-Za-zÀ-ɏ]/g,'');
  return l.length>=2&&!RE_LOWER.test(l);
}
/* Düz metin (paragrafsız): ardışık BÜYÜK HARFLİ kelime öbekleri başlıktır */
function detectChaptersFlat(words){
  const res=[];let i=0;
  while(i<words.length){
    if(isUpperWord(words[i])){
      let j=i;
      while(j<words.length&&j-i<14&&isUpperWord(words[j])) j++;
      const hw=words.slice(i,j);
      const hasLong=hw.some(w=>w.replace(/[^A-Za-zÀ-ɏ]/g,'').length>=4);
      const title=hw.join(' ');
      if(hw.length>=2&&hasLong&&title.length<110){
        res.push({w:i,len:hw.length,raw:dedupeTitle(title)});
        i=j;continue;
      }
    }
    i++;
  }
  return finalizeChapters(res);
}
/* Paragraflı metin: kısa, noktasız, BÜYÜK HARFLİ ya da "Bölüm 3" kalıplı paragraflar */
const HEAD_PAT=/^(bölüm|kısım|kitap|chapter|part|önsöz|giriş|sunuş|başlarken|sonuç|sonsöz|son söz|ekler?|epilog|prolog)\b/i;
function detectChaptersParas(words,paraEnds){
  const ends=[...paraEnds].sort((a,b)=>a-b);
  const res=[];let s=0;
  for(const e of ends){
    const n=e-s+1;
    if(n<=14){
      const ws=words.slice(s,e+1),t=ws.join(' ');
      const last=ws[ws.length-1];
      if(t.length<=110&&!/[,;]$/.test(last)&&(isAllCaps(t)&&t.replace(/[^A-Za-zÀ-ɏ]/g,'').length>=4||HEAD_PAT.test(t)&&!/[.!?]$/.test(last))){
        res.push({w:s,len:n,raw:t});
      }
    }
    s=e+1;
  }
  return finalizeChapters(res);
}
function finalizeChapters(res){
  /* Çok tekrar eden (sayfa üst bilgisi gibi) başlıkları at */
  const cnt=new Map();
  res.forEach(c=>cnt.set(c.raw,(cnt.get(c.raw)||0)+1));
  let out=res.filter(c=>cnt.get(c.raw)<=3);
  /* Birbirine çok yakın başlıkları birleştir */
  const merged=[];
  for(const c of out){
    const p=merged[merged.length-1];
    if(p&&c.w-(p.w+p.len)<=0){p.len=c.w+c.len-p.w;p.raw=p.raw+' '+c.raw;continue;}
    merged.push({...c});
  }
  return merged.map(c=>({w:c.w,len:c.len,title:prettyTitle(c.raw)}));
}
function detectChaptersAuto(prep){
  const {words,paraEnds}=prep;
  let ch=[];
  if(paraEnds.size>5) ch=detectChaptersParas(words,paraEnds);
  if(ch.length<2) ch=detectChaptersFlat(words);
  /* Çok fazlaysa (her 120 kelimede bir) güvenilmez say */
  if(ch.length>words.length/120) ch=[];
  return ch;
}
