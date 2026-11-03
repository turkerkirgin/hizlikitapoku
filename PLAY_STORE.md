# Google Play'e Yükleme Rehberi

HızlıKitapOku bir PWA (yüklenebilir web uygulaması). Google Play, PWA'ları **TWA (Trusted Web Activity)** paketiyle kabul eder: uygulama, `https://hizlikitapoku.netlify.app` adresini adres çubuğu olmadan tam ekran açan küçük bir Android paketi olur. Siteyi güncellediğimizde Play'deki uygulama da kendiliğinden güncellenir; yeni sürüm yüklemen gerekmez (ikon/ad değişmedikçe).

## 1. Paketi oluştur (PWABuilder — ücretsiz, 5 dakika)
1. https://www.pwabuilder.com adresine git, `https://hizlikitapoku.netlify.app` yaz → **Start**.
2. Puan kartında manifest / service worker / güvenlik yeşil olmalı (hazır).
3. **Package For Stores → Android → Generate Package**.
   - Package ID: `app.netlify.hizlikitapoku` (bir kere seçilir, sonradan değişmez)
   - App name: `HızlıKitapOku`, Launcher name: `HızlıKitapOku`
   - Signing key: **"Create new"** → indirilen zipteki `signing.keystore` ve `signing-key-info.txt` dosyalarını **kaybetme** (güncellemelerde aynı anahtar gerekir). Bir USB'ye/buluta yedekle.
4. İndirilen zipte: `app-release-signed.aab` (Play'e yüklenecek), `assetlinks.json`.

## 2. assetlinks.json'ı siteye koy
Zipten çıkan `assetlinks.json` dosyasını bana ver (veya `public/.well-known/assetlinks.json` olarak kaydet) → siteyi yeniden yayınlarız. Bu dosya olmadan uygulamanın üstünde adres çubuğu görünür.
Kontrol: `https://hizlikitapoku.netlify.app/.well-known/assetlinks.json` açılmalı.

> Play Console "Uygulama imzalama"yı açınca Google kendi anahtarıyla yeniden imzalar. O zaman Play Console → Kurulum → Uygulama imzalama sayfasındaki **SHA-256 parmak izini** de assetlinks.json'a eklemek gerekir (bana yollaman yeterli).

## 3. Play Console
1. https://play.google.com/console → geliştirici hesabı (tek seferlik 25 $). Kişisel hesaplarda yayından önce **12 test kullanıcısıyla 14 gün kapalı test** şartı var.
2. **Uygulama oluştur** → ad: HızlıKitapOku, dil: Türkçe, Uygulama, Ücretsiz.
3. Mağaza girişi için hazır olanlar:
   - Kısa açıklama (80 karakter): `Her gün biraz oku: hızlı okuma modları, günlük hedef, PDF ve ücretsiz kitaplar.`
   - Uzun açıklama: README'deki "Özellikler" bölümü
   - İkon 512×512: `public/icons/icon-512.png`
   - Öne çıkan görsel 1024×500 ve en az 2 telefon ekran görüntüsü (istersen hazırlarım)
   - Gizlilik politikası URL: `https://hizlikitapoku.netlify.app/gizlilik.html`
   - Kategori: Kitaplar ve Kaynaklar · İçerik derecelendirmesi anketi: şiddet/kumar yok → "Herkes"
   - Veri güvenliği formu: **Veri toplanmıyor, veri paylaşılmıyor** (her şey cihazda)
4. **Test → Kapalı test** sürümüne `app-release-signed.aab` yükle, testçileri ekle; 14 gün sonra **Üretim**'e gönder.

## Notlar
- Katalogdaki tüm kitaplar kamu malı; inceleme sırasında sorulursa kaynaklar `public/katalog/index.json` içinde yazıyor.
- Uygulama adı veya ikonu değişirse PWABuilder'dan aynı anahtarla yeni paket alıp sürüm numarasını artırarak yüklenir.
