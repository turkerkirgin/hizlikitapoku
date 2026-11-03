# -*- coding: utf-8 -*-
"""
HızlıKitapOku derleme betiği.
  python build.py            → public/ (web + PWA, Netlify'a giden) ve dist/hizlikitapoku.html (tek dosya, masaüstü)
  python build.py --masaustu → ayrıca tek dosyalı sürümü Masaüstü'ne kopyalar (yerleşik Nutuk dahil, kişisel)
"""
import hashlib, html, json, os, shutil, sys, datetime

KOK = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(KOK, 'src')
PUB = os.path.join(KOK, 'public')
DIST = os.path.join(KOK, 'dist')
SITE = 'https://hizlikitapoku.netlify.app/'
REPO = 'https://github.com/turkerkirgin/hizlikitapoku'
JS_SIRA = ['app1.js', 'app2.js', 'app3.js', 'app4.js', 'app5.js', 'app7.js', 'app8.js', 'app9.js', 'app6.js']

def oku(ad): return open(os.path.join(SRC, ad), encoding='utf-8').read()

ACIKLAMA = ('HızlıKitapOku: ücretsiz hızlı okuma uygulaması. RSVP, Bionic, Harf Harf ve kaydırmalı okuma modları, '
            'günlük okuma hedefi ve zamanlayıcı, akıllı PDF okuyucu ve 100\'e yakın telifsiz kitap. Hesap yok, reklam yok.')

def sayfa(hedef):
    t = oku('template.html')
    js = '\n'.join(oku(f) for f in JS_SIRA)
    if hedef == 'web':
        head = f'''<meta name="description" content="{html.escape(ACIKLAMA)}">
<meta name="keywords" content="hızlı kitap oku, hızlı okuma, hızlı okuma uygulaması, RSVP okuma, bionic okuma, ücretsiz kitap oku, PDF kitap oku, telifsiz kitaplar, kitap okuma alışkanlığı">
<link rel="canonical" href="{SITE}">
<meta name="theme-color" content="#0f0f0f">
<meta name="application-name" content="HızlıKitapOku">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="HızlıKitapOku">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icons/favicon.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="HızlıKitapOku">
<meta property="og:title" content="HızlıKitapOku — Ücretsiz Hızlı Kitap Okuma Uygulaması">
<meta property="og:description" content="{html.escape(ACIKLAMA)}">
<meta property="og:url" content="{SITE}">
<meta property="og:image" content="{SITE}icons/icon-512.png">
<meta property="og:locale" content="tr_TR">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">{json.dumps({
    "@context": "https://schema.org", "@type": "WebApplication", "name": "HızlıKitapOku",
    "alternateName": ["Hızlı Kitap Oku", "HizliKitapOku"], "url": SITE, "applicationCategory": "EducationalApplication",
    "operatingSystem": "Android, iOS, Windows, macOS, Linux (tarayıcı)", "inLanguage": "tr",
    "description": ACIKLAMA, "isAccessibleForFree": True,
    "offers": {"@type": "Offer", "price": "0", "priceCurrency": "TRY"},
    "sameAs": [REPO]}, ensure_ascii=False)}</script>
<script>window.NO_BUILTIN=true;window.PDFJS_WORKER='vendor/pdf.worker.min.js';</script>'''
        pdfjs = '<script src="vendor/pdf.min.js"></script>'
        nutuk = ''
        sw = '''<script>
if('serviceWorker' in navigator&&/^https?:/.test(location.protocol)&&location.hostname!=='127.0.0.1'){
  navigator.serviceWorker.register('sw.js').then(reg=>{
    reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;
      w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)toast('✨ Yeni sürüm indirildi — uygulamayı kapatıp açınca geçerli olur.',6000);});});
  }).catch(()=>{});
}
</script>'''
    else:  # masaüstü tek dosya: CDN'den pdf.js, katalog web sitesinden
        head = f'''<link rel="icon" type="image/png" href="{SITE}icons/favicon.png">
<script>window.KATALOG_URL='{SITE}katalog/';</script>'''
        pdfjs = '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>'
        nutuk = ('<script type="application/json" id="builtin-nutuk">' + oku('nutuk.json') + '</script>') if os.path.exists(os.path.join(SRC, 'nutuk.json')) else '<script>window.NO_BUILTIN=true;</script>'
        sw = ''
    for k, v in [('%%CSS%%', oku('base.css')), ('%%EXTRACSS%%', oku('extra.css')), ('%%ATATURK%%', oku('ataturk.txt').strip()),
                 ('%%APPJS%%', js), ('%%HEAD_EXTRA%%', head), ('%%PDFJS_TAG%%', pdfjs), ('%%NUTUK_TAG%%', nutuk), ('%%SW%%', sw)]:
        assert t.count(k) == 1, k
        t = t.replace(k, v)
    return t, js

def yaz(yol, icerik):
    os.makedirs(os.path.dirname(yol), exist_ok=True)
    open(yol, 'w', encoding='utf-8', newline='\n').write(icerik)

def kitaplar_sayfasi():
    yol = os.path.join(PUB, 'katalog', 'index.json')
    if not os.path.exists(yol): return 0
    idx = json.load(open(yol, encoding='utf-8'))
    turler = {}
    for k in idx: turler.setdefault(k['tur'], []).append(k)
    bolum = []
    for tur in ['Roman', 'Öykü', 'Şiir', 'Tarih', 'Psikoloji', 'Felsefe', 'Destan', 'Klasik', 'Tiyatro']:
        if tur not in turler: continue
        li = ''.join(f'<li><a href="./?kitap={html.escape(k["id"])}"><b>{html.escape(k["baslik"])}</b></a> — {html.escape(k["yazar"])}'
                     f'{" (İngilizce)" if k["dil"]=="en" else ""}<br><small>{html.escape(k["aciklama"])} · {k["kelime"]:,} kelime</small></li>'.replace(',', '.')
                     for k in sorted(turler[tur], key=lambda x: (x['dil'] != 'tr', x['baslik'])))
        bolum.append(f'<h2>{tur}</h2><ul>{li}</ul>')
    sayfa_html = f'''<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ücretsiz Kitap Oku — {len(idx)} Telifsiz Kitap | HızlıKitapOku</title>
<meta name="description" content="Kürk Mantolu Madonna, Kuyucaklı Yusuf, Ömer Seyfettin hikâyeleri, Nutuk, Dede Korkut ve daha fazlası: {len(idx)} telifsiz kitabı HızlıKitapOku ile ücretsiz ve hızlı oku.">
<link rel="canonical" href="{SITE}kitaplar.html"><link rel="icon" href="icons/favicon.png">
<style>body{{font-family:'Segoe UI',system-ui,sans-serif;background:#0f0f0f;color:#eee;max-width:860px;margin:0 auto;padding:24px 16px 60px;line-height:1.6}}a{{color:#1D9E75}}h1{{font-size:28px}}h2{{margin-top:36px;border-bottom:1px solid #2a2a2a;padding-bottom:6px}}li{{margin:10px 0}}small{{color:#999}}.btn{{display:inline-block;background:#1D9E75;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700}}</style></head>
<body><h1>📚 HızlıKitapOku — Ücretsiz Kitaplar</h1>
<p>Aşağıdaki {len(idx)} kitabın tamamı <b>telifi düşmüş (kamu malı)</b> eserlerdir; metinler Vikikaynak ve Project Gutenberg kaynaklıdır. Bir kitaba tıkla, HızlıKitapOku'da aç ve hızlı okuma modlarıyla oku.</p>
<p><a class="btn" href="./">▶ Uygulamayı aç</a></p>{''.join(bolum)}
<p style="margin-top:40px"><a href="./">Ana sayfa</a> · <a href="gizlilik.html">Gizlilik</a> · <a href="{REPO}">Açık kaynak kod (GitHub)</a></p></body></html>'''
    yaz(os.path.join(PUB, 'kitaplar.html'), sayfa_html)
    return len(idx)

def sw_yaz(surum):
    sw = '''/* HızlıKitapOku service worker — sürüm: %s */
const CACHE='hko-%s';
const CORE=['./','index.html','manifest.webmanifest','vendor/pdf.min.js','vendor/pdf.worker.min.js','katalog/index.json',
  'icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','icons/favicon.png','gizlilik.html'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!=='hko-fonts').map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    const sayfa=r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('.html')||u.pathname.endsWith('index.json');
    if(sayfa){ /* önce ağ (güncel kalsın), olmazsa önbellek */
      e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c));return res;})
        .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('index.html'))));
      return;
    }
    if(u.pathname.includes('/katalog/')) return; /* kitaplar cihaza (IndexedDB) kaydedilir, önbelleğe gerek yok */
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c));}return res;})));
    return;
  }
  if(/fonts\\.(googleapis|gstatic)\\.com$/.test(u.hostname)){
    e.respondWith(caches.open('hko-fonts').then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{c.put(r,res.clone());return res;}))));
  }
});
''' % (surum, surum)
    yaz(os.path.join(PUB, 'sw.js'), sw)

def statikler():
    yaz(os.path.join(PUB, 'manifest.webmanifest'), json.dumps({
        "id": "./", "name": "HızlıKitapOku", "short_name": "HızlıKitapOku",
        "description": "Her gün biraz oku: hızlı okuma modları, günlük hedef, akıllı PDF ve telifsiz kitaplar.",
        "lang": "tr", "dir": "ltr", "start_url": "./?kaynak=uygulama", "scope": "./", "display": "standalone",
        "orientation": "any", "background_color": "#0f0f0f", "theme_color": "#0f0f0f",
        "categories": ["books", "education", "productivity"],
        "icons": [{"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
                  {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
                  {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]
    }, ensure_ascii=False, indent=1))
    yaz(os.path.join(PUB, '_headers'), '''/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/sw.js
  Cache-Control: no-cache
/index.html
  Cache-Control: no-cache
/manifest.webmanifest
  Content-Type: application/manifest+json
/katalog/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=86400
''')
    yaz(os.path.join(PUB, 'robots.txt'), f'User-agent: *\nAllow: /\nSitemap: {SITE}sitemap.xml\n')
    bugun = datetime.date.today().isoformat()
    yaz(os.path.join(PUB, 'sitemap.xml'), f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>{SITE}</loc><lastmod>{bugun}</lastmod><priority>1.0</priority></url>
<url><loc>{SITE}kitaplar.html</loc><lastmod>{bugun}</lastmod><priority>0.8</priority></url>
<url><loc>{SITE}gizlilik.html</loc><lastmod>{bugun}</lastmod><priority>0.3</priority></url>
</urlset>
''')
    shutil.copy(os.path.join(SRC, 'gizlilik.html'), os.path.join(PUB, 'gizlilik.html'))

def main():
    web, js = sayfa('web')
    yaz(os.path.join(PUB, 'index.html'), web)
    yaz(os.path.join(DIST, 'app.js'), js)
    statikler()
    n = kitaplar_sayfasi()
    surum = hashlib.sha1((web + str(n)).encode()).hexdigest()[:10]
    sw_yaz(surum)
    masa, _ = sayfa('masaustu')
    yaz(os.path.join(DIST, 'hizlikitapoku.html'), masa)
    print(f'web: public/index.html ({len(web)//1024} KB), katalog: {n} kitap, sw sürüm {surum}')
    print(f'masaüstü: dist/hizlikitapoku.html ({len(masa)//1024} KB)')
    if '--masaustu' in sys.argv:
        hedef = os.path.join(os.path.expanduser('~'), 'Desktop', 'turkerokuma.html')
        shutil.copy(os.path.join(DIST, 'hizlikitapoku.html'), hedef)
        print('Masaüstüne kopyalandı:', hedef)

if __name__ == '__main__':
    main()
