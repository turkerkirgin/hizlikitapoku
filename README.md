# 📚 HızlıKitapOku

**Ücretsiz ve açık kaynak hızlı okuma uygulaması.** Her gün biraz oku: RSVP, Bionic, Harf Harf, Scroll, Kartlar ve Normal modlar; günlük okuma hedefi, zamanlayıcı, akıllı PDF okuyucu ve 100'e yakın telifsiz kitap.

🌐 **Hemen kullan:** https://hizlikitapoku.netlify.app
📱 Telefon ve tablete "Ana Ekrana Ekle" ile uygulama olarak yüklenir, internetsiz çalışır.

*[English summary below](#english)*

---

## Özellikler

| | |
|---|---|
| **6 okuma modu** | RSVP (kelime kelime, odak harfi hizalı), Harf Harf, Bionic, Scroll, Kartlar, Normal |
| **Günlük hedef** | 15 dk (ayarlanabilir) hedef, 🔥 seri, haftalık grafik, 18 haftalık takvim |
| **Zamanlayıcı** | Hedefe kalan süre / 5–60 dk / kronometre; süre dolunca cümle sonunda durur |
| **Akıllı PDF** | Sayfa numarası, üst/alt bilgi, heceleme tiresi ve dipnot temizliği; paragrafları yeniden kurar; içindekilerden veya başlık puntosundan bölüm bulur; bozuk Türkçe karakterleri (ý→ı, þ→ş, ð→ğ) düzeltir |
| **Kitaptaki yerin** | Okurken yandaki panelde PDF'in gerçek sayfası ve okunan satır vurgusu |
| **Bölümler** | İçindekiler, bölüm atlama ya da kitabı 15 dakikalık günlük parçalara bölme |
| **Ücretsiz kitaplar** | Kürk Mantolu Madonna, Kuyucaklı Yusuf, Ömer Seyfettin, Nutuk (1927), Dede Korkut, Tevfik Fikret... ve İngilizce klasikler |
| **Gizlilik** | Hesap yok, reklam yok, takip yok. Kitaplar ve ilerleme yalnızca cihazında (IndexedDB) |
| **Diğer** | 9 tema, 5 yazı tipi, odak modu, yedek al/yükle, klavye kısayolları, ekran kararmasını engelleme |

## Telif hakkı

"Ücretsiz Kitaplar" bölümündeki eserlerin **tamamı kamu malıdır**:
- Türkçe eserler [Vikikaynak](https://tr.wikisource.org)'tan alınmıştır; yazarları 70 yıldan önce ölmüştür (FSEK md. 27).
- İngilizce eserler [Project Gutenberg](https://www.gutenberg.org)'den alınmıştır.

Her kitabın kaynağı ve lisansı uygulamada ve `public/katalog/index.json` dosyasında yazar. Kapaklar uygulama tarafından üretilir, yayınevi kapakları kullanılmaz. Kullanıcıların kendi eklediği PDF'ler yalnızca kendi cihazlarında kalır.

## Geliştirme

```bash
python build.py                       # public/ (web + PWA) ve dist/hizlikitapoku.html (tek dosya)
python araclar/katalog_olustur.py     # telifsiz kitap kataloğunu yeniden oluştur (public/katalog/)
python -m http.server 8000 -d public  # yerelde dene: http://localhost:8000
```

- `src/` — kaynak: `template.html`, `base.css` + `extra.css`, `app1…app9.js` (derlemede tek dosyada birleşir)
- `araclar/katalog_liste.py` — katalogdaki kitapların listesi (yeni kitap eklemek için buraya ekle)
- `public/` — yayınlanan site (Netlify)

Bağımlılık yok: saf HTML/CSS/JS; PDF için [pdf.js](https://mozilla.github.io/pdf.js/) (Apache 2.0, `public/vendor/`).

## Katkı

Hata bildirimi ve öneriler için [Issues](https://github.com/turkerkirgin/hizlikitapoku/issues). Kataloğa telifsiz kitap önerisi de yapabilirsin; lütfen kaynağını ve kamu malı olduğunu belirt.

## Lisans

Kod: [MIT](LICENSE). Katalog metinleri: kamu malı (kaynaklar yukarıda).

---

<a id="english"></a>
## English

**HızlıKitapOku** ("fast book read") is a free, open-source speed-reading web app (installable PWA) in Turkish: RSVP, Bionic, typewriter, scroll, cards and normal modes; daily reading goal with streaks and a session timer; a smart PDF importer that strips page numbers, running headers, hyphenation and footnotes and detects chapters; a live "where am I in the real book" page panel; and a catalog of ~100 public-domain books (Turkish Wikisource + Project Gutenberg). No accounts, no tracking — everything stays in the browser (IndexedDB). Code is MIT licensed.
