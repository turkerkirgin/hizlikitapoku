# -*- coding: utf-8 -*-
"""
HızlıKitapOku — telifsiz kitap kataloğu oluşturucu.
Kaynaklar: Türkçe Vikikaynak (kamu malı / özgür lisanslı metinler) ve Project Gutenberg.
Çıktı: public/katalog/<id>.json + public/katalog/index.json
Bölüm başlıkları metinde "§§ " ile işaretlenir; uygulama bunları bölüm olarak okur.
Kullanım:  python araclar/katalog_olustur.py [--yenile]
"""
import json, os, re, sys, time, urllib.parse, urllib.request, hashlib
from bs4 import BeautifulSoup

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIKTI = os.path.join(KOK, 'public', 'katalog')
ONBELLEK = os.path.join(KOK, '.onbellek')
os.makedirs(CIKTI, exist_ok=True); os.makedirs(ONBELLEK, exist_ok=True)
UA = {'User-Agent': 'HizliKitapOku/1.0 (acik kaynak okuma uygulamasi; turkerkirgin123@gmail.com)'}
YENILE = '--yenile' in sys.argv
YENIDEN = '--yeniden' in sys.argv   # ağdan çekmeden, önbellekten JSON'ları yeniden üret

def indir(url, ham=False):
    anahtar = hashlib.sha1(url.encode()).hexdigest()
    yol = os.path.join(ONBELLEK, anahtar)
    if os.path.exists(yol) and not YENILE:
        veri = open(yol, 'rb').read()
    else:
        for deneme in range(4):
            try:
                veri = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()
                break
            except Exception as e:
                if deneme == 3: raise
                time.sleep(3 * (deneme + 1))
        open(yol, 'wb').write(veri)
        time.sleep(0.25)
    return veri if ham else json.loads(veri)

def ws(**p):
    p.update(format='json', formatversion=2, origin='*')
    return indir('https://tr.wikisource.org/w/api.php?' + urllib.parse.urlencode(p))

def ws_kaynak(baslik):
    r = ws(action='query', prop='revisions', rvprop='content', rvslots='main', titles=baslik, redirects=1)
    p = r['query']['pages'][0]
    if 'revisions' not in p: return None
    return p['revisions'][0]['slots']['main']['content']

def ws_html(baslik):
    r = ws(action='parse', page=baslik, prop='text', redirects=1, disableeditsection=1)
    return r['parse']['text'] if 'parse' in r else ''

SIL = ['script', 'style', 'sup.reference', 'ol.references', '.mw-references-wrap', '.reference',
       '#headertemplate', '.ws-header', '.ws-noexport', '.noprint', 'span.pagenum', '.pagenum', '.ws-pagenum',
       '.mw-editsection', '.licenseContainer', '.ambox', '.metadata', '.navbox', '.mw-empty-elt',
       'table.wikitable', '.wst-header', 'div.header', '.ws-summary', '.dablink', '.hatnote', 'img', 'figure',
       '.mw-cite-backlink', '.toc', '#toc', 'span.mw-reflink-text', '.error']
BLOK = ['p', 'div', 'li', 'dd', 'dt', 'blockquote', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'center', 'pre']

def html_metin(html, baslik_at=None):
    s = BeautifulSoup(html, 'lxml')
    for sec in SIL:
        for e in s.select(sec): e.decompose()
    # tablolar çoğunlukla içindekiler/gezinme: bağlantı ağırlıklıysa at
    for t in s.find_all('table'):
        txt = t.get_text(' ', strip=True); links = ' '.join(a.get_text(' ', strip=True) for a in t.find_all('a'))
        if len(txt) < 40 or len(links) > len(txt) * 0.5: t.decompose()
    for br in s.find_all('br'): br.replace_with('\n')
    for h in s.find_all(['h1', 'h2', 'h3', 'h4']):
        t = h.get_text(' ', strip=True)
        if baslik_at and norm(t) == norm(baslik_at): h.decompose(); continue
        h.replace_with(s.new_string('\n\n§§ ' + t + '\n\n'))
    for b in s.find_all(BLOK): b.insert_before('\n\n'); b.insert_after('\n\n')
    metin = s.get_text()
    return temizle(metin)

def norm(t): return re.sub(r'\W+', ' ', t.lower()).strip()

def temizle(m):
    m = m.replace('\r', '').replace(' ', ' ').replace('­', '')
    m = re.sub(r'\[\d{1,4}\]', '', m)                      # [12] sayfa/dipnot işaretleri
    m = re.sub(r'[ \t]+', ' ', m)
    m = re.sub(r' *\n *', '\n', m)
    paras = []
    for p in re.split(r'\n{2,}', m):
        satirlar = [x.strip() for x in p.split('\n') if x.strip()]
        if not satirlar: continue
        if satirlar[0].startswith('§§ '):
            paras.append(' '.join(satirlar)); continue
        # şiir gibi kısa satırları " · " ile değil boşlukla birleştir; satır sonu tireleri birleştir
        t = ''
        for x in satirlar:
            if t.endswith('-') and re.match(r'[a-zçğıöşüâîû]', x): t = t[:-1] + x
            else: t = (t + ' ' + x) if t else x
        paras.append(t)
    # gezinme kalıntıları
    paras = [p for p in paras if not re.fullmatch(r'(←|→|\||\s|önceki|sonraki|İÇİNDEKİLER|İçindekiler)+', p, re.I)]
    # Vikikaynak telif/kaynak kutuları (metne ait değil)
    out, atla = [], False
    BAS = re.compile(r"^(Kaynak: |Telif durumu|Bu eser, kültürel öneminden|Vikikaynak'ta yalnızca telif|Bu eser kamu malıdır|Bu çalışma)")
    for p in paras:
        if BAS.match(p): atla = True; continue
        if atla:
            if p.startswith('§§ '): atla = False
            else:
                if re.search(r'false\s*$|Public domain', p): atla = False
                continue
        if re.match(r'§§ (Dipnotlar|Kaynakça|Kaynaklar|Notlar|Referanslar|Açıklamalar|Dış bağlantılar)\s*$', p):
            atla = True; continue
        if re.search(r'Public domain.*false|^Koruma süresi|^İlk eser sahibi tüzelkişi|^Sahibinin ölümünden sonra alenileşen|^12\. maddenin birinci fıkrasındaki', p): continue
        out.append(p)
    paras = out
    return '\n\n'.join(paras).strip()

def kelime(m): return len([t for t in re.split(r'\s+', m.replace('§§', '')) if re.search(r'[0-9A-Za-zÀ-ɏ]', t)])

ALT_LINK = re.compile(r'\[\[\s*(/[^\]|]+|[^\]|]+/[^\]|]+)\s*(?:\|([^\]]*))?\]\]')
def ws_alt_sayfalar(ana):
    k = ws_kaynak(ana) or ''
    out = []
    for m in ALT_LINK.finditer(k):
        hedef, ad = m.group(1).strip(), (m.group(2) or '').strip()
        tam = ana + hedef if hedef.startswith('/') else hedef
        if not tam.startswith(ana + '/'): continue
        tam = tam.rstrip('/')
        if tam not in [o[0] for o in out]: out.append((tam, ad or tam.split('/')[-1]))
    return out

def ws_kitap(e):
    parcalar = []
    if e.get('parcalar'):                       # elle verilen sayfa listesi (derlemeler)
        for t in e['parcalar']:
            ad = t if isinstance(t, str) else t[1]; sayfa = t if isinstance(t, str) else t[0]
            parcalar.append((sayfa, ad))
    elif e.get('kategori'):
        r = ws(action='query', list='categorymembers', cmtitle='Kategori:' + e['kategori'], cmlimit=500, cmnamespace=0)
        parcalar = [(m['title'], m['title']) for m in r['query']['categorymembers']]
        parcalar.sort(key=lambda x: x[0])
    else:
        alt = ws_alt_sayfalar(e['sayfa']) if e.get('alt', True) else []
        parcalar = alt if len(alt) >= 2 else []
    bolumler = []
    if parcalar:
        for sayfa, ad in parcalar:
            try:
                h = ws_html(sayfa)
                m = html_metin(h, baslik_at=ad)
                # alt sayfanın kendi alt sayfaları (ör. Nutuk bölümleri)
                if kelime(m) < 40 and e.get('derin'):
                    for s2, a2 in ws_alt_sayfalar(sayfa):
                        m2 = html_metin(ws_html(s2), baslik_at=a2)
                        if kelime(m2) > 10: bolumler.append((a2, m2))
                    continue
                if kelime(m) > 10: bolumler.append((ad, m))
            except Exception as ex:
                print('   ! parça alınamadı', sayfa, ex)
    else:
        m = html_metin(ws_html(e['sayfa']), baslik_at=e['baslik'])
        bolumler.append((None, m))
    parca = []
    for ad, m in bolumler:
        if ad and e.get('bolum_basligi', True): parca.append('§§ ' + temiz_ad(ad))
        parca.append(m)
    return '\n\n'.join(parca), 'https://tr.wikisource.org/wiki/' + urllib.parse.quote((e.get('sayfa') or e.get('kategori') or e['baslik']).replace(' ', '_'))

def temiz_ad(a):
    a = re.sub(r'\s*\((hikâye|Ömer Seyfettin|Ahmet Haşim|Sabahattin Ali)\)', '', a)
    return a.split('/')[-1].strip()

def gb_kitap(e):
    i = e['gb']
    ham = indir(f'https://www.gutenberg.org/cache/epub/{i}/pg{i}.txt', ham=True).decode('utf-8', 'replace')
    bas = re.search(r'\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG[^\n]*\n', ham)
    son = re.search(r'\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG', ham)
    baslik = re.search(r'^Title:\s*(.+)$', ham, re.M)
    if e.get('kontrol') and (not baslik or e['kontrol'].lower() not in baslik.group(1).lower()):
        raise Exception('Başlık uyuşmadı: %s' % (baslik.group(1) if baslik else '?'))
    m = ham[bas.end() if bas else 0: son.start() if son else len(ham)]
    m = m.replace('\r', '')
    m = re.sub(r'_([^_\n]+)_', r'\1', m)
    paras = []
    for p in re.split(r'\n\s*\n', m):
        p = re.sub(r'\s*\n\s*', ' ', p).strip()
        if not p: continue
        if re.match(r'^(Produced by|E-text prepared|Transcriber|\[Illustration)', p, re.I): continue
        if re.match(r'^(CHAPTER|Chapter|BOOK|Book|PART|Part|STAVE|LETTER|Letter|ACT|SCENE)\b[ .:]*([IVXLC\d]+|[A-Z]+)?[.:]?(\s.{0,80})?$', p) and len(p) < 100:
            p = '§§ ' + p
        elif re.fullmatch(r'[IVXLC]+(\s+[IVXLC]+){2,}\.?', p):
            pass  # içindekiler satırı: "I II III ..."
        elif re.match(r'^[IVXLC]+\.?\s*$', p) or (p.isupper() and 3 < len(p) < 70 and re.search('[A-Z]{3}', p)):
            p = '§§ ' + p
        paras.append(p)
    # İçindekiler listesindeki başlıklar ardışık §§ olur: tek başına art arda gelenleri sadeleştir
    out = []
    for p in paras:
        if p.startswith('§§ ') and out and out[-1].startswith('§§ ') and len(out) < 400:
            out[-1] = p if False else out[-1]; out.append(p); continue
        out.append(p)
    metin = '\n\n'.join(out)
    # baştaki içindekiler bloğu (çok sayıda ardışık başlık) → düz metne çevir
    metin = re.sub(r'(?:§§ [^\n]+\n\n){6,}', lambda mm: mm.group(0).replace('§§ ', ''), metin)
    return metin, f'https://www.gutenberg.org/ebooks/{i}'

from katalog_liste import KITAPLAR

def main():
    index = []
    sec = [a for a in sys.argv[1:] if not a.startswith('--')]
    for e in KITAPLAR:
        if sec and e['id'] not in sec: continue
        yol = os.path.join(CIKTI, e['id'] + '.json')
        try:
            if os.path.exists(yol) and not YENILE and not YENIDEN and not sec:
                d = json.load(open(yol, encoding='utf-8'))
            else:
                metin, kaynak = (gb_kitap(e) if 'gb' in e else ws_kitap(e))
                if e.get('bas') and e['bas'] in metin:
                    i = metin.index(e['bas']); j = metin.rfind('\n\n', 0, i)
                    metin = metin[j + 2 if j >= 0 else i:]
                for a, b in e.get('duzelt', []): metin = metin.replace(a, b)
                d = {'id': e['id'], 'baslik': e['baslik'], 'yazar': e['yazar'], 'tur': e['tur'], 'dil': e.get('dil', 'tr'),
                     'yil': e.get('yil'), 'aciklama': e['aciklama'], 'kaynak': kaynak,
                     'kaynakAdi': 'Project Gutenberg' if 'gb' in e else 'Vikikaynak',
                     'lisans': e.get('lisans', 'Kamu malı'), 'metin': metin}
                json.dump(d, open(yol, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
            n = kelime(d['metin']); bol = d['metin'].count('§§ ')
            if n < 300 and e['tur'] not in ('Öykü', 'Şiir'):
                print('!! KISA', e['id'], n)
            print(f"{e['id']:<34} {n:>8} kelime  {bol:>4} bölüm")
            index.append({k: d[k] for k in ('id', 'baslik', 'yazar', 'tur', 'dil', 'yil', 'aciklama', 'kaynak', 'kaynakAdi', 'lisans')} | {'kelime': n, 'bolum': bol, 'boyut': os.path.getsize(yol)})
        except Exception as ex:
            print('XX', e['id'], ex)
    if not sec:
        json.dump(index, open(os.path.join(CIKTI, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
        print('TOPLAM', len(index), 'kitap')

if __name__ == '__main__':
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    main()
