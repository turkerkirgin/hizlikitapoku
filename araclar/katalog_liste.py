# -*- coding: utf-8 -*-
"""
Telifsiz kitap listesi. Yalnızca kamu malı eserler:
 - Türkçe: yazarı 70 yıldan önce ölmüş eserler (FSEK md. 27) — kaynak Türkçe Vikikaynak.
 - İngilizce: Project Gutenberg'deki kamu malı eserler (yazar ve çevirmen çoktan ölmüş, 1930 öncesi yayın).
Alanlar: id, baslik, yazar, tur, dil, yil, aciklama, + kaynak (sayfa / parcalar / kategori / gb)
"""
import re
def slug(t):
    t = t.replace('İ', 'i').replace('I', 'ı').lower()
    t = t.translate(str.maketrans('çğıöşüâîû', 'cgiosuaiu'))
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')

OS = 'Ömer Seyfettin'
OS_LIS = 'Kamu malı (yazar 1920\'de öldü)'

def os_hikaye(sayfa, baslik, aciklama, yil=None):
    return {'id': 'os-' + slug(baslik),
            'baslik': baslik, 'yazar': OS, 'tur': 'Öykü', 'yil': yil, 'sayfa': sayfa, 'alt': False,
            'aciklama': aciklama, 'lisans': OS_LIS}

OS_HIKAYELER = [
    ('Kaşağı', 'Kaşağı', 'Çocukluğunda kardeşine attığı bir iftiranın vicdan azabını anlatan en bilinen hikâyesi.'),
    ('Forsa', 'Forsa', 'Yıllarca esir kalan Türk denizcisi Kemal Reis\'in özgürlük mücadelesi.'),
    ('Pembe İncili Kaftan', 'Pembe İncili Kaftan', 'Onurlu Kuloğlu\'nun padişahın armağanı kaftana karşı tavrı.'),
    ('Diyet', 'Diyet', 'Usta demirci Ahmet Usta ve onur meselesine dönen bir diyet hikâyesi.'),
    ('Bomba', 'Bomba', 'Balkanlarda bir komitacının bomba hazırlığı; ihanet ve vatan sevgisi.'),
    ('Kesik Bıyık', 'Kesik Bıyık', 'Modaya uyup bıyığını kestiren bir gencin başına gelenler; mizah.'),
    ('Topuz', 'Topuz', 'Bir topuzun kuşaktan kuşağa geçen tarihi ve kahramanlık geleneği.'),
    ('Falaka', 'Falaka', 'Mahalle mektebinde falaka korkusu üzerine bir çocukluk anısı.'),
    ('Başını Vermeyen Şehit', 'Başını Vermeyen Şehit', 'Fetih yıllarından efsanevi bir kahramanlık öyküsü.'),
    ('Kurbağa Duası', 'Kurbağa Duası', 'Batıl inançları hicveden ince bir mizah hikâyesi.'),
    ('Perili Köşk', 'Perili Köşk', 'Perili olduğu söylenen köşkün ardındaki gerçek; mizahi bir çocukluk hikâyesi.'),
    ('Yüksek Ökçeler', 'Yüksek Ökçeler', 'Yüksek topuklu ayakkabılar üzerinden bir aile ve gurur hikâyesi.'),
    ('Pireler', 'Pireler', 'Pire istilası ve insan zaafları üzerine güldüren bir öykü.'),
    ('Tuğra', 'Tuğra', 'Bir tuğranın ve onu koruyanların tarihî hikâyesi.'),
    ('Ferman', 'Ferman', 'Bir fermanın getirdiği beklenmedik sonuçlar.'),
    ('Kütük', 'Kütük', 'Balkan köyünde milliyet ve kimlik çatışmasına dair dramatik bir hikâye.'),
    ('Üç Nasihat', 'Üç Nasihat', 'Halk anlatısı tadında, hayat dersi veren bir masal-hikâye.'),
    ('Elma', 'Elma', 'Bir elmanın çocuk kalbinde açtığı dünya.'),
    ('Keramet', 'Keramet', 'Keramet sahibi sanılan bir şeyhin iç yüzü; hiciv.'),
    ('Rüşvet', 'Rüşvet', 'Rüşvetin insanı nasıl değiştirdiğine dair kısa bir hikâye.'),
    ('Yüzakı', 'Yüzakı', 'Bir köylü kadının onur ve namus mücadelesi.'),
    ('İlk Namaz', 'İlk Namaz', 'Bir çocuğun ilk namaz deneyiminin tatlı-acı anlatımı.'),
    ('Kıskançlık', 'Kıskançlık', 'Kıskançlığın bir insanı nereye sürükleyebileceği.'),
    ('Teselli', 'Teselli', 'Acıyı hafifletmeye çalışan sözlerin hikâyesi.'),
    ('Hürriyet Bayrakları', 'Hürriyet Bayrakları', 'Meşrutiyet coşkusunu ironik bir dille anlatan hikâye.'),
    ('Mehdi', 'Mehdi', 'Kendini kurtarıcı sanan biri üzerinden toplum eleştirisi.'),
    ('Kurumuş Ağaçlar', 'Kurumuş Ağaçlar', 'Kuruyan ağaçlar üzerinden yitirilen umutların hikâyesi.'),
]

KITAPLAR = [
    # ─────────── TÜRKÇE ROMAN / TİYATRO ───────────
    {'id': 'kurk-mantolu-madonna', 'baslik': 'Kürk Mantolu Madonna', 'yazar': 'Sabahattin Ali', 'tur': 'Roman', 'yil': 1943,
     'sayfa': 'Kürk Mantolu Madonna', 'alt': False,
     'bas': 'Simdiye kadar tesadüf', 'duzelt': [('Simdiye kadar tesadüf', 'Şimdiye kadar tesadüf')], 'lisans': 'Kamu malı (yazar 1948\'de öldü)',
     'aciklama': 'Raif Efendi\'nin defterinden, Berlin\'de bir ressamla yaşanan imkânsız aşk. Türk edebiyatının en çok okunan romanı.'},
    {'id': 'birdenbire-sonen-kandil', 'baslik': 'Birdenbire Sönen Kandilin Hikâyesi', 'yazar': 'Sabahattin Ali', 'tur': 'Öykü',
     'sayfa': 'Birdenbire Sönen Kandilin Hikâyesi', 'alt': False, 'lisans': 'Kamu malı (yazar 1948\'de öldü)',
     'aciklama': 'Sabahattin Ali\'nin kısa ve etkileyici bir öyküsü.'},
    {'id': 'antigone', 'baslik': 'Antigone', 'yazar': 'Sophokles (çev. Sabahattin Ali)', 'tur': 'Tiyatro', 'yil': -441,
     'sayfa': 'Antigone', 'alt': False, 'lisans': 'Kamu malı (eser antik, çevirmen 1948\'de öldü)',
     'aciklama': 'Devletin yasası ile vicdanın yasası arasında kalan Antigone\'nin trajedisi.'},

    # ─────────── ÖMER SEYFETTİN ───────────
    *[os_hikaye(*h) for h in OS_HIKAYELER],
    {'id': 'omer-seyfettin-butun-hikayeler', 'baslik': 'Bütün Hikâyeleri (Seçme Derleme)', 'yazar': OS, 'tur': 'Öykü',
     'kategori': 'Ömer Seyfettin hikayeleri', 'lisans': OS_LIS,
     'aciklama': 'Vikikaynak\'taki Ömer Seyfettin hikâyelerinin tamamı tek kitapta; her hikâye ayrı bölüm.'},

    # ─────────── DESTAN / KLASİK ───────────
    {'id': 'dede-korkut', 'baslik': 'Kitâb-ı Dedem Korkut', 'yazar': 'Anonim', 'tur': 'Destan', 'yil': 1500,
     'sayfa': 'Kitâb-ı Dedem Korkut Alâ Lisan-ı Tâife-i Oğuzân', 'lisans': 'Kamu malı (anonim, 15-16. yy)',
     'aciklama': 'Oğuz Türklerinin on iki destansı boyu: Deli Dumrul, Bamsı Beyrek, Tepegöz... (orijinal dil).'},
    {'id': 'leyla-vu-mecnun', 'baslik': 'Leylâ vü Mecnûn', 'yazar': 'Fuzûlî', 'tur': 'Klasik', 'yil': 1535,
     'sayfa': 'Leylâ vü Mecnûn', 'lisans': 'Kamu malı (16. yy)',
     'aciklama': 'Fuzûlî\'nin 3098 beyitlik ölümsüz aşk mesnevisi (orijinal dil).'},
    {'id': 'mesnevi-konuk', 'baslik': 'Mesnevî-i Şerîf', 'yazar': 'Mevlânâ (çev. Ahmed Avni Konuk)', 'tur': 'Klasik', 'yil': 1273,
     'sayfa': 'Mesnevi (Konuk)', 'lisans': 'Kamu malı (çevirmen 1938\'de öldü)',
     'aciklama': 'Mevlânâ\'nın Mesnevî\'si, Ahmed Avni Konuk tercümesiyle.'},
    {'id': 'marifetname', 'baslik': 'Marifetname', 'yazar': 'Erzurumlu İbrahim Hakkı', 'tur': 'Klasik', 'yil': 1757,
     'sayfa': 'Marifetname', 'lisans': 'Kamu malı (18. yy)',
     'aciklama': 'Gökbilimden insan ruhuna uzanan 18. yüzyıl ansiklopedik eseri.'},

    # ─────────── TARİH ───────────
    {'id': 'nutuk-1927', 'baslik': 'Nutuk (1927 Orijinal Metin)', 'yazar': 'Gazi Mustafa Kemal', 'tur': 'Tarih', 'yil': 1927,
     'sayfa': 'Nutuk', 'derin': True, 'lisans': 'Kamu malı (yazar 1938\'de öldü)',
     'aciklama': 'Mustafa Kemal\'in 1919-1927 dönemini anlattığı büyük söylev; 1927 baskısının orijinal dili.'},
    {'id': 'ataturk-soylevler', 'baslik': 'Atatürk\'ün Söylevleri (Seçme)', 'yazar': 'Mustafa Kemal Atatürk', 'tur': 'Tarih',
     'parcalar': ['Onuncu Yıl Nutku', 'Bursa Nutku', 'Atatürk\'ün İzmir İktisad Kongresi Konuşması', 'Atatürk\'ün Kastamonu Nutku',
                  'Atatürk\'ün İnebolu Nutku', 'Atatürk\'ün İstanbul Nutku', 'Balıkesir Hutbesi', 'Mustafa Kemal Atatürk\'ün ilk meclis konuşması',
                  'Mustafa Kemal Atatürk\'ün TBMM açılış konuşmaları', 'Atatürk\'ün CHP 4. Kurultayı açılış konuşması',
                  'Atatürk\'ün cumhuriyet savcılarına 9 Ekim 1925 tarihinde yaptığı konuşma', 'Mustafa Kemal Atatürk\'ün vasiyeti'],
     'lisans': 'Kamu malı (yazar 1938\'de öldü)', 'aciklama': 'Onuncu Yıl Nutku, Bursa Nutku, İzmir İktisat Kongresi ve diğer önemli konuşmalar.'},
    {'id': 'milli-mucadele-belgeleri', 'baslik': 'Millî Mücadele Belgeleri', 'yazar': 'Derleme', 'tur': 'Tarih',
     'parcalar': ['Havza Genelgesi', 'Amasya Genelgesi', 'Sivas Kongresi Beyannâmesi', 'Anadolu ve Rumeli Müdafaa-i Hukuk Cemiyeti temsilciler heyetinin ulusa bildirisi',
                  'TBMM\'nin Memlekete Beyannamesi', 'Pozantı Beyannamesi', 'Büyük Millet Meclisi\'nin Bütün İslam Alemine Beyannamesi',
                  'TBMM\'nin 21 Ekim 1920 tarihli beyannamesi', 'Mondros Mütarekenâmesi', 'Teşkîlât-ı Esâsîye Kanunu'],
     'lisans': 'Kamu malı (resmî belgeler)', 'aciklama': 'Havza ve Amasya genelgelerinden Teşkilât-ı Esasiye\'ye Kurtuluş Savaşı\'nın temel belgeleri.'},
    {'id': 'karlsbad-gunlugu', 'baslik': 'Karlsbad Günlüğü', 'yazar': 'Mustafa Kemal', 'tur': 'Tarih', 'yil': 1918,
     'sayfa': 'Mustafa Kemal\'in Karlsbad günlüğü', 'lisans': 'Kamu malı (yazar 1938\'de öldü)',
     'aciklama': 'Mustafa Kemal\'in 1918\'de Karlsbad\'da tuttuğu günlük; düşünceleri ve okumaları.'},
    {'id': 'talim-terbiye-askeriyye', 'baslik': 'Ta\'lîm ve Terbiye-i Askeriyye Hakkında Nokta-i Nazarlar', 'yazar': 'Mustafa Kemal', 'tur': 'Tarih', 'yil': 1918,
     'sayfa': 'Ta\'lîm ve Terbiye-i Askeriyye Hakkında Nokta-i Nazarlar', 'lisans': 'Kamu malı (yazar 1938\'de öldü)',
     'aciklama': 'Mustafa Kemal\'in askerî eğitim üzerine kaleme aldığı eser.'},
    {'id': 'siper-gavgasi', 'baslik': 'Yirmi Beş Sene Siper Gavgası', 'yazar': 'Ahmet Refik Altınay', 'tur': 'Tarih',
     'sayfa': 'Yirmi Beş Sene Siper Gavgası', 'lisans': 'Kamu malı (yazar 1937\'de öldü)',
     'aciklama': 'Girit kuşatmasını anlatan, tarihçi Ahmet Refik\'in sürükleyici anlatısı.'},

    # ─────────── ŞİİR ───────────
    {'id': 'rubab-i-sikeste', 'baslik': 'Rübâb-ı Şikeste', 'yazar': 'Tevfik Fikret', 'tur': 'Şiir', 'yil': 1900,
     'sayfa': 'Rübâb-ı Şikeste', 'lisans': 'Kamu malı (yazar 1915\'te öldü)', 'aciklama': 'Servet-i Fünun\'un büyük şairinin "Kırık Saz"ı.'},
    {'id': 'ahmet-hasim-siirleri', 'baslik': 'Şiirler', 'yazar': 'Ahmet Haşim', 'tur': 'Şiir', 'kategori': 'Ahmet Haşim şiirleri',
     'lisans': 'Kamu malı (yazar 1933\'te öldü)', 'aciklama': 'Merdiven, O Belde, Bir Günün Sonunda Arzu... Sembolist şiirin ustası.'},
    {'id': 'cenab-sahabeddin-siirleri', 'baslik': 'Şiirler', 'yazar': 'Cenab Şahabeddin', 'tur': 'Şiir', 'kategori': 'Cenab Şahabeddin şiirleri',
     'lisans': 'Kamu malı (yazar 1934\'te öldü)', 'aciklama': 'Servet-i Fünun şairi Cenab Şahabeddin\'in şiirleri.'},
    {'id': 'karacaoglan', 'baslik': 'Türküler ve Koşmalar', 'yazar': 'Karacaoğlan', 'tur': 'Şiir', 'kategori': 'Karacaoğlan türküleri',
     'lisans': 'Kamu malı (17. yy halk şairi)', 'aciklama': 'Halk şiirinin büyük ozanından aşk ve doğa türküleri.'},
    {'id': 'ahmed-yesevi-hikmetler', 'baslik': 'Divan-ı Hikmet', 'yazar': 'Ahmed Yesevî', 'tur': 'Şiir', 'kategori': 'Ahmed Yesevi hikmetleri',
     'lisans': 'Kamu malı (12. yy)', 'aciklama': 'Türk tasavvuf şiirinin kurucusundan hikmetler.'},
    {'id': 'baki-gazelleri', 'baslik': 'Gazeller', 'yazar': 'Bâkî', 'tur': 'Şiir', 'kategori': 'Bâkî gazelleri',
     'lisans': 'Kamu malı (16. yy)', 'aciklama': 'Sultanü\'ş-şuarâ Bâkî\'nin seçme gazelleri.'},
    {'id': 'kul-himmet', 'baslik': 'Deyişler', 'yazar': 'Kul Himmet', 'tur': 'Şiir', 'kategori': 'Kul Himmet\'in deyişleri',
     'lisans': 'Kamu malı (16. yy)', 'aciklama': 'Alevi-Bektaşi halk şiirinden deyişler.'},
    {'id': 'namik-kemal-siirleri', 'baslik': 'Şiirler', 'yazar': 'Namık Kemal', 'tur': 'Şiir',
     'parcalar': ['Hürriyet Kasidesi', 'Vatan Şarkısı', 'Vaveyla', 'Murabba (Namık Kemal)', 'Beyitler', 'Kıt\'alar', 'Hırrenâme'],
     'lisans': 'Kamu malı (yazar 1888\'de öldü)', 'aciklama': 'Vatan şairinin Hürriyet Kasidesi ve diğer şiirleri.'},
    {'id': 'ziya-gokalp-siirleri', 'baslik': 'Şiirler', 'yazar': 'Ziya Gökalp', 'tur': 'Şiir',
     'parcalar': ['Turan', 'Vatan', 'Lisân', 'Asker Duası', 'Medeniyyet', 'Ergenekon (Ziya Gökalp)'],
     'lisans': 'Kamu malı (yazar 1924\'te öldü)', 'aciklama': 'Ziya Gökalp\'in milli şiirleri.'},
    # ─────────── İNGİLİZCE: ROMAN ───────────
    *[{'id': 'en-' + i, 'baslik': b, 'yazar': y, 'tur': t, 'dil': 'en', 'yil': yl, 'gb': g, 'kontrol': k,
       'lisans': 'Kamu malı (Project Gutenberg)', 'aciklama': a} for (i, b, y, t, yl, g, k, a) in [
        ('pride-and-prejudice', 'Pride and Prejudice', 'Jane Austen', 'Roman', 1813, 1342, 'Pride and Prejudice', 'Elizabeth Bennet ve Mr. Darcy: önyargı ve gurur üzerine klasik aşk romanı.'),
        ('frankenstein', 'Frankenstein', 'Mary Shelley', 'Roman', 1818, 84, 'Frankenstein', 'Yarattığı varlıkla yüzleşen bilim insanının hikâyesi; bilimkurgunun atası.'),
        ('dracula', 'Dracula', 'Bram Stoker', 'Roman', 1897, 345, 'Dracula', 'Mektuplar ve günlüklerle anlatılan gotik korku klasiği.'),
        ('moby-dick', 'Moby-Dick', 'Herman Melville', 'Roman', 1851, 2701, 'Moby', 'Kaptan Ahab\'ın beyaz balinaya saplantılı avı.'),
        ('dorian-gray', 'The Picture of Dorian Gray', 'Oscar Wilde', 'Roman', 1890, 174, 'Dorian Gray', 'Yaşlanmayan genç ve portresindeki karanlık sır.'),
        ('crime-and-punishment', 'Crime and Punishment', 'Fyodor Dostoyevski (çev. C. Garnett)', 'Roman', 1866, 2554, 'Crime and Punishment', 'Raskolnikov\'un işlediği cinayet ve vicdanıyla hesaplaşması.'),
        ('notes-from-underground', 'Notes from the Underground', 'Fyodor Dostoyevski', 'Roman', 1864, 600, 'Notes from the Underground', 'Yeraltı adamının itirafları; varoluşçu edebiyatın öncüsü.'),
        ('brothers-karamazov', 'The Brothers Karamazov', 'Fyodor Dostoyevski (çev. C. Garnett)', 'Roman', 1880, 28054, 'Brothers Karamazov', 'İnanç, şüphe ve baba katli etrafında üç kardeş.'),
        ('anna-karenina', 'Anna Karenina', 'Lev Tolstoy', 'Roman', 1877, 1399, 'Anna Karenina', 'Rus aristokrasisinde yasak bir aşkın trajedisi.'),
        ('the-great-gatsby', 'The Great Gatsby', 'F. Scott Fitzgerald', 'Roman', 1925, 64317, 'Gatsby', 'Caz Çağı\'nda Jay Gatsby\'nin Amerikan rüyası.'),
        ('jane-eyre', 'Jane Eyre', 'Charlotte Brontë', 'Roman', 1847, 1260, 'Jane Eyre', 'Yetim bir kızın bağımsızlık ve aşk arayışı.'),
        ('wuthering-heights', 'Wuthering Heights', 'Emily Brontë', 'Roman', 1847, 768, 'Wuthering Heights', 'Heathcliff ile Catherine\'in fırtınalı tutkusu.'),
        ('monte-cristo', 'The Count of Monte Cristo', 'Alexandre Dumas', 'Roman', 1844, 1184, 'Monte Cristo', 'Haksızca hapsedilen Edmond Dantès\'in intikamı.'),
        ('alice', 'Alice\'s Adventures in Wonderland', 'Lewis Carroll', 'Roman', 1865, 11, 'Alice', 'Tavşan deliğinden düşen Alice\'in harikalar diyarı.'),
        ('treasure-island', 'Treasure Island', 'Robert Louis Stevenson', 'Roman', 1883, 120, 'Treasure Island', 'Korsanlar, hazine haritası ve Long John Silver.'),
        ('time-machine', 'The Time Machine', 'H. G. Wells', 'Roman', 1895, 35, 'Time Machine', 'Zaman Yolcusu\'nun 802.701 yılına yolculuğu.'),
        ('jekyll-hyde', 'The Strange Case of Dr Jekyll and Mr Hyde', 'Robert Louis Stevenson', 'Roman', 1886, 43, 'Jekyll', 'İnsanın iyi ve kötü yüzü üzerine kısa klasik.'),
        ('metamorphosis', 'Metamorphosis', 'Franz Kafka (çev. D. Wyllie)', 'Roman', 1915, 5200, 'Metamorphosis', 'Bir sabah böceğe dönüşerek uyanan Gregor Samsa.'),
        ('don-quixote', 'Don Quixote', 'Miguel de Cervantes', 'Roman', 1605, 996, 'Don Quixote', 'Şövalye romanlarıyla aklını yitiren Don Kişot ve Sancho Panza.'),
        ('war-and-peace', 'War and Peace', 'Lev Tolstoy', 'Roman', 1869, 2600, 'War and Peace', 'Napolyon savaşları sırasında Rus toplumu; dev bir başyapıt.'),
        ('little-women', 'Little Women', 'Louisa May Alcott', 'Roman', 1868, 514, 'Little Women', 'March kardeşlerin büyüme hikâyesi.'),
        ('odyssey', 'The Odyssey', 'Homeros (çev. S. Butler)', 'Destan', -700, 1727, 'Odyssey', 'Odysseus\'un Truva\'dan evine on yıllık dönüş yolculuğu.'),
        ('iliad', 'The Iliad', 'Homeros (çev. S. Butler)', 'Destan', -750, 2199, 'Iliad', 'Truva Savaşı ve Akhilleus\'un öfkesi.'),
        # ÖYKÜ
        ('sherlock-holmes', 'The Adventures of Sherlock Holmes', 'Arthur Conan Doyle', 'Öykü', 1892, 1661, 'Sherlock Holmes', 'Baker Sokağı\'nın dâhi dedektifinden on iki macera.'),
        ('dubliners', 'Dubliners', 'James Joyce', 'Öykü', 1914, 2814, 'Dubliners', 'Dublin\'de sıradan hayatlardan on beş öykü.'),
        ('poe-tales', 'The Works of Edgar Allan Poe — Volume 2', 'Edgar Allan Poe', 'Öykü', 1845, 2148, 'Poe', 'Kuyu ve Sarkaç, Usher Evi\'nin Çöküşü... Gerilimin ustası.'),
        ('grimm', 'Grimm\'s Fairy Tales', 'Jacob & Wilhelm Grimm', 'Öykü', 1812, 2591, 'Grimm', 'Kül Kedisi, Hansel ve Gretel, Pamuk Prenses... Klasik masallar.'),
        ('andersen', 'Andersen\'s Fairy Tales', 'Hans Christian Andersen', 'Öykü', 1835, 1597, 'Andersen', 'Çirkin Ördek Yavrusu, Kar Kraliçesi ve diğer masallar.'),
        ('aesop', 'Aesop\'s Fables', 'Ezop', 'Öykü', -550, 21, 'Aesop', 'Hayvanlarla anlatılan kısa ve öğretici fabllar.'),
        ('four-million', 'The Four Million', 'O. Henry', 'Öykü', 1906, 2776, 'Four Million', 'Sürpriz sonlarıyla ünlü öyküler; "Sihirli Armağan" dahil.'),
        # PSİKOLOJİ
        ('the-crowd', 'The Crowd: A Study of the Popular Mind', 'Gustave Le Bon', 'Psikoloji', 1895, 445, 'Crowd', 'Kitle psikolojisinin klasik incelemesi: kalabalıklar nasıl düşünür?'),
        ('dream-psychology', 'Dream Psychology', 'Sigmund Freud', 'Psikoloji', 1920, 15489, 'Dream Psychology', 'Freud\'un rüya kuramına kısa ve anlaşılır giriş.'),
        ('principles-of-psychology', 'The Principles of Psychology, Vol. 1', 'William James', 'Psikoloji', 1890, 57628, 'Principles of Psychology', 'Modern psikolojinin kurucu metinlerinden; bilinç, alışkanlık, dikkat.'),
        ('talks-to-teachers', 'Talks to Teachers on Psychology', 'William James', 'Psikoloji', 1899, 16287, 'Talks to Teachers', 'Öğrenme, alışkanlık ve dikkat üzerine pratik psikoloji.'),
        ('varieties-religious', 'The Varieties of Religious Experience', 'William James', 'Psikoloji', 1902, 621, 'Varieties of Religious Experience', 'İnanç deneyiminin psikolojik incelemesi.'),
        # TARİH
        ('herodotus-1', 'The History of Herodotus, Vol. 1', 'Herodotos (çev. G. C. Macaulay)', 'Tarih', -430, 2707, 'Herodotus', 'Tarihin babasından Pers savaşları ve antik dünya.'),
        ('thucydides', 'The History of the Peloponnesian War', 'Thukydides (çev. R. Crawley)', 'Tarih', -400, 7142, 'Peloponnesian', 'Atina ile Sparta arasındaki büyük savaşın tanığı.'),
        ('gibbon-1', 'The History of the Decline and Fall of the Roman Empire, Vol. 1', 'Edward Gibbon', 'Tarih', 1776, 731, 'Decline and Fall', 'Roma İmparatorluğu\'nun çöküşünün ünlü anlatımı.'),
        ('plutarch', 'Plutarch\'s Lives', 'Plutarkhos', 'Tarih', 100, 674, 'Plutarch', 'Antik Yunan ve Roma\'nın büyük insanlarının hayatları.'),
        ('gallic-war', 'The Gallic Wars', 'Julius Caesar', 'Tarih', -50, 10657, 'Gallic', 'Sezar\'ın Galya seferlerini kendi kaleminden anlatışı.'),
        ('short-history-world', 'A Short History of the World', 'H. G. Wells', 'Tarih', 1922, 35461, 'Short History of the World', 'Evrenin oluşumundan Birinci Dünya Savaşı\'na dünya tarihi.'),
        # FELSEFE / KİŞİSEL GELİŞİM
        ('meditations', 'Meditations', 'Marcus Aurelius', 'Felsefe', 180, 2680, 'Meditations', 'Stoacı imparatorun kendine notları.'),
        ('the-prince', 'The Prince', 'Niccolò Machiavelli', 'Felsefe', 1532, 1232, 'Prince', 'Güç ve yönetim üzerine en tartışmalı klasik.'),
        ('art-of-war', 'The Art of War', 'Sun Tzu (çev. L. Giles)', 'Felsefe', -500, 132, 'Art of War', 'Strateji üzerine 2500 yıllık rehber.'),
        ('the-republic', 'The Republic', 'Platon (çev. B. Jowett)', 'Felsefe', -375, 1497, 'Republic', 'Adalet ve ideal devlet üzerine diyaloglar.'),
        ('as-a-man-thinketh', 'As a Man Thinketh', 'James Allen', 'Felsefe', 1903, 4507, 'Thinketh', 'Düşüncenin karakteri ve hayatı nasıl biçimlendirdiğine dair kısa klasik.'),
        ('walden', 'Walden', 'Henry David Thoreau', 'Felsefe', 1854, 205, 'Walden', 'Ormanda sade bir yaşamın düşünceleri.'),
    ]],
]
