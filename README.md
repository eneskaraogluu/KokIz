# KÖKİZ · Etkileşimli Türk Yazı Duvarı

KÖKİZ, Türk Devletleri Teşkilatı'nın 29–30 Ekim 2026 Ankara etkinliği için hazırlanan; kamera, el takibi, temassız yazı girişi ve kişiye özel hatıra kartını gerçek e-posta ile teslim etme özelliklerini bir araya getiren dijital kültür deneyimidir.

## Ana deneyim

1. Ziyaretçi Türkiye, Azerbaycan, Kazakistan, Kırgızistan, Özbekistan, Türkmenistan, Macaristan veya KKTC arasından kök coğrafyasını seçer.
2. **Kamerayı Başlat** düğmesiyle kamerayı açar.
3. MediaPipe HandLandmarker işaret parmağını sanal imleç olarak takip eder.
4. Başparmak ve işaret parmağı birleştirilerek ekrandaki Türkçe klavyeden harf seçilir.
5. Latin metin, yaklaşık Kök Türk görsel eşlemesi ve dijital kitabe eşzamanlı oluşur.
6. Ziyaretçi e-posta adresini girer ve kişisel hatıra kartını açar.
7. **E-postama Gönder** düğmesi kartı PNG üretir; backend görseli Resend üzerinden e-posta gövdesinde tam kart ve indirilebilir PNG olarak gönderir.
8. Kart ayrıca cihaza indirilebilir veya Web Share destekleyen cihazlarda paylaşılabilir.
9. Kartın sol kolonunda, isimden deterministik seçilen kültürel bir söz altın
   çerçeveli bir panelde görünür; aynı yazım her zaman aynı sözü verir.
10. İsimden deterministik bir kişisel tamga üretilir; anonim iz, seçilen ülkenin renk ve desen kümesi içinde büyüyen **Ortak Hafıza Göğü**ne eklenir.

Seçilen kök coğrafya hatıra kartında küçük bir mühür olarak görünür. Gökyüzünde sekiz ülke kendi ışık rengine ve yörünge desenine sahiptir; aktif ülke kümelerinin temsilci yıldızları ortak hafızayı simgeleyen altın bağlarla birleşir.

Ortak Hafıza Göğü'ndeki her ülke çemberinin merkezinde, ülkenin özgün bayrağını gösteren ışıklı ve dairesel bir mühür bulunur. Bayrak görüntüsü çember içine oranı korunarak kırpılır; yıldızlar ve bağlantı çizgileri mührün üzerinde görünmeye devam eder.

Ülke seçimi yapıldığında o ülkenin rengi, kısa mührü, kendine özgü geometrik deseni ve dalgalanan özgün bayrağıyla tam ekran bir karşılama seremonisi oynar. Bayrak dosyaları proje içinde yerel tutulur; internet bağlantısına ihtiyaç duymaz. Taş işleme töreninin sonunda kişisel yıldız merkezde doğar, ışık kuyruğuyla seçilen ülkenin temsilci kümesine uçar ve diğer aktif kümelerle ortak gökyüzüne bağlanır. Hareket azaltma tercihi açık cihazlarda bu iki animasyon atlanır.

Hatıra kartı açılmadan önce ziyaretçinin harfleri ışık ve parçacıklarla dijital taşa tek tek mühürlenir. Ses Web Audio API ile cihazda üretilir; harici ses dosyası kullanılmaz ve üst menüden kapatılabilir. Tarayıcının ses kilidi ilk kullanıcı tıklamasında açılır; ses yeniden açıldığında üç notalı bir test melodisi çalar. Kamera açıkken sanal imleç turkuaz, pinch sırasında altın bir enerji izi bırakır.

Kart dışa aktarılırken ekran boyutundan bağımsız, sabit `3:2` oranında ve yüksek çözünürlükte hazırlanır. Uzun isimler hem Latin/Kök Türk alanlarında hem de taşın üzerindeki kelime satırlarında otomatik ölçeklenir.
Sanal klavye 320–760 px mobil ekranlarda on iki tuşlu en geniş satırı ekrana sığdıracak şekilde akışkan ölçülenir ve yatay sayfa taşması oluşturmaz.

QR kod, e-posta tesliminin yerine geçmez. QR bölümü etkinlik/deneyim bağlantısı için yardımcı kanal olarak kalır; kartın doğrudan e-posta ile gönderilmesi backend üzerinden gerçekleşir.

## Proje mimarisi

```text
KokIz/
├── assets/
│   ├── flags/
│   │   ├── tr.svg
│   │   ├── az.svg
│   │   ├── kz.svg
│   │   ├── kg.svg
│   │   ├── uz.svg
│   │   ├── tm.svg
│   │   ├── hu.svg
│   │   ├── kktc.svg
│   │   └── README.md
│   └── tdt-logo.png
├── vendor/
│   ├── mediapipe/
│   │   ├── vision_bundle.mjs
│   │   └── wasm/
│   ├── models/
│   │   └── hand_landmarker.task
│   ├── fonts/
│   ├── html2canvas.min.js
│   ├── qrcode-generator.js
│   ├── qrcode-generator-utf8.js
│   └── README.md
├── index.html
├── styles.css
├── app.js
├── server.js
├── package.json
├── .env.example
├── .gitattributes
├── .gitignore
├── PROJECT_PROMPT.md
├── README.md
├── VERSION.txt
├── baslat.bat
└── baslat.ps1
```

`ortak-hafiza.ndjson` uygulama çalışırken ilk anonim iz kaydında otomatik oluşur. Git'e eklenmez, web üzerinden sunulmaz ve yalnızca mevcut kiosk oturumu boyunca kullanılır. Sayfa kapatıldığında/yenilendiğinde veya sunucu normal biçimde durdurulduğunda içeriği sıfırlanır. Windows terminali ya da süreç zorla kapatılmış olsa bile sonraki sunucu başlangıcı dosyayı yeniden boşaltır ve temiz bir oturum açar.

- `index.html`: ülke/bölge seçimi, kiosk sahnesi, kamera HUD'u, sanal klavye, dijital kitabe ve hatıra kartı.
- `styles.css`: petrol/zürrüt/turkuaz/altın sanat yönü, ülke renkleri, responsive kiosk düzeni ve e-posta durum bileşeni.
- `app.js`: Türk dünyası kümeleri, Türkçe klavye, Kök Türk görsel eşlemesi, MediaPipe el takibi, QR, PNG, paylaşım ve backend istemcisi.
- `server.js`: statik web sunucusu, sağlık kontrolü, anonim ortak hafıza koleksiyonu ve Resend tabanlı güvenli e-posta API'si.
- `package.json`: Node.js sürüm şartı ve başlatma/kontrol komutları. Harici npm paketi gerekmez.
- `.env.example`: gizli anahtar içermeyen yapılandırma şablonu.
- `vendor/`: sürüme sabitlenmiş üçüncü taraf kütüphaneler ve el takip modeli; kaynak, lisans ve
  SHA-256 kayıtları `vendor/README.md` içinde.
- `assets/flags/`: ülke seçim seremonisinde kullanılan, kaynak bilgileri belgelenmiş özgün bayrak dosyaları.

## Gereksinimler

- Node.js 18 veya daha yeni sürüm
- Kamera destekli Chrome ya da Edge
- İnternet bağlantısı **gerekmez**: MediaPipe, el takip modeli, qrcode-generator, html2canvas ve
  yazı tipleri `vendor/`
  içinde sürüme sabitlenmiş olarak bulunur (bkz. `vendor/README.md`)
- Gerçek e-posta gönderimi için Resend hesabı, API anahtarı ve doğrulanmış gönderen alan adı/adresi

Python'un basit HTTP sunucusu backend API'sini çalıştıramaz; bu sürüm mutlaka Node.js ile başlatılmalıdır.

## E-posta backend kurulumu

1. Resend hesabınızda gönderen alan adını doğrulayın.
2. Bir API anahtarı oluşturun.
3. Proje klasöründeki `.env.example` dosyasını kopyalayıp adını `.env` yapın.
4. `.env` içindeki değerleri doldurun:

```dotenv
HOST=127.0.0.1
PORT=5500
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
KOKIZ_FROM_EMAIL=hatira@alanadiniz.com
KOKIZ_FROM_NAME=KÖKİZ
KOKIZ_MOCK_EMAIL=false
```

`.env` dosyasını paylaşmayın veya Git'e eklemeyin. `.gitignore` bu dosyayı dışarıda tutar.

Alan adı henüz hazır değilken gönderim akışını gerçek e-posta göndermeden sınamak için yalnızca yerel geliştirmede `KOKIZ_MOCK_EMAIL=true` kullanabilirsiniz. Arayüz bu durumu açıkça **test modu** olarak gösterir.

## Çalıştırma

En kolay yöntem `baslat.bat` dosyasına çift tıklamaktır. Başlatıcı:

- Node.js sürümünü kontrol eder,
- 5500 portunda doğru KÖKİZ backend'inin çalışıp çalışmadığını denetler,
- sunucuyu başlatır,
- `http://localhost:5500` adresini tarayıcıda açar.

PowerShell veya terminal üzerinden:

```powershell
cd "<proje-klasorunuzun-yolu>\KokIz"
npm start
```

Kod sözdizimini kontrol etmek için:

```powershell
npm run check
```

`vendor/` içindeki kütüphanelerin bozulmadığını doğrulamak için:

```powershell
npm run vendor:check
```

Çıktının `vendor/README.md` içinde kayıtlı özetlerle birebir aynı olması gerekir.

## API

### `GET /api/saglik`

Backend durumunu, sürümü, e-posta yapılandırmasının hazır olup olmadığını ve test modunu döndürür. Gizli anahtarları hiçbir zaman döndürmez.

### `POST /api/hatira-gonder`

Tarayıcıda üretilen PNG kartı, seçilen ülke kodunu ve sınırlı kart bilgisini alır, doğrular ve e-posta eki olarak gönderir. Kabul edilen kodlar `TUR`, `AZE`, `KAZ`, `KGZ`, `UZB`, `TKM`, `HUN` ve `KKTC` değerleridir. Koruma katmanları:

- aynı kaynak kontrolü,
- e-posta ve iz numarası doğrulaması,
- PNG imzası ve 12 MB ham görsel sınırı,
- 18 MB istek gövdesi sınırı,
- IP başına dakikada 20 gönderim sınırı (kiosk'ta bütün ziyaretçiler aynı yerel adresten gelir),
- yinelenen gönderimleri azaltan idempotency anahtarı,
- `.env`, sunucu kodu, yapılandırma dosyaları ve `PROJECT_PROMPT.md` iç belgesinin web üzerinden engellenmesi;
  denetim çözümlenmiş dosya yolu üzerinden yapılır, böylece kodlanmış ayraçla kurulan yol kaçışları da kapanır.

### `GET /api/ortak-hafiza`

Toplam anonim iz sayısını ve gökyüzünde çizilecek son 600 anonim izi döndürür.

### `POST /api/ortak-hafiza`

Yalnızca rastgele kayıt kimliği, `KIZ-0000` biçimindeki iz numarası, sekiz haneli tamga kodu, doğrulanmış ülke/bölge kodu ve sunucu zamanını saklar. İsim, e-posta, kamera görüntüsü, IP adresi veya hatıra kartı görseli bu koleksiyona yazılmaz. Aynı kayıt kimliği tekrar gönderildiğinde çoğaltılmaz ve IP başına dakikada 30 ekleme sınırı uygulanır.

### `POST /api/ortak-hafiza/sifirla`

Aynı kaynaktan gelen oturum kapanış isteğinde yalnızca anonim `ortak-hafiza.ndjson` içeriğini boşaltır ve sıfır kayıtlı koleksiyon döndürür. Tarayıcı `pagehide` sırasında `sendBeacon` kullanır; desteklenmediğinde kısa `keepalive` isteğine geçer. Sunucu `SIGINT` veya `SIGTERM` ile normal kapatıldığında aynı işlem sunucu tarafında uygulanır. Önceki kapanış beklenmedik biçimde gerçekleşmişse yeni sunucu başlangıcı kalan içeriği sıfırlar.

## Gizlilik yaklaşımı

E-posta adresi ile PNG yalnızca isteği doğrulamak ve e-posta sağlayıcısına aktarmak için bellekte tutulur; proje tarafından diske yazılmaz. Sunucu günlükleri e-posta adresini veya kart görselini kaydetmez.

Ortak Hafıza Göğü için oturumluk ayrı bir yerel koleksiyon tutulur. Bu koleksiyonda isim ve e-posta bulunmaz; yalnızca kişiye geri bağlanamayan rastgele kayıt kimliği, iz numarası, tamga kodu, ülke/bölge kodu ve zaman saklanır. Ülke kodu yalnızca anonim ışığı doğru kümeye yerleştirmek için kullanılır. Dosya `ortak-hafiza.ndjson` adını taşır, `.gitignore` kapsamındadır, statik sunucu tarafından erişime kapatılmıştır ve oturum kapanışında boşaltılır.

## Kontroller

- Ülke/bölge düğmeleri: fare, dokunma veya kamera imleci ve pinch hareketiyle kök coğrafyayı seç.
- Kamera: işaret parmağıyla hedefle, başparmak + işaret parmağı pinch hareketiyle seç.
- Fiziksel klavye: Türkçe/Latin harfler yazı ekler.
- `Backspace`: son karakteri siler.
- `Space`: boşluk ekler.
- `Delete`: metni temizler.
- `Escape`: açık hatıra kartını kapatır.
- `Escape`: taş işleme töreni açıksa töreni tamamlayıp karta geçer.
- Ülke karşılama seremonisi: yaklaşık iki saniye sürer, odağı değiştirmez ve kullanıcı etkileşimini engellemez.
- `Ortak Hafıza`: ülkelere göre renklenen anonim iz kümelerinden oluşan canlı gökyüzünü açar; bir ışığın üzerinde durmak kişisel tamgayı ve ülke/bölgeyi gösterir.
- `Escape`: Ortak Hafıza Göğü açıksa gökyüzünü kapatır.
- `Ses Açık/Kapalı`: seçim ve mühürleme seslerini yönetir. `Ses Açık` konumuna geçerken duyulur bir test melodisi çalar.
- Kamera cihaz tarafından kesilirse arayüz canlı durumunu otomatik kapatır ve yeniden başlatma mesajı gösterir.
- Sayfa kapatılır veya yenilenirse yalnızca Ortak Hafıza Göğü sıfırlanır; `.env`, e-posta yapılandırması ve bayrak dosyaları korunur.

E-posta alanı odaktayken fiziksel klavye KÖKİZ metnini değiştirmez.

## Teknik notlar

- MediaPipe Tasks Vision `0.10.35`, el takip modeli (HandLandmarker float16/1),
  qrcode-generator `2.0.4` ve html2canvas `1.4.1` `vendor/` klasöründen yerel olarak sunulur;
  kiosk çevrimdışı çalışır. Bütün bağımlılıklar MIT, Apache-2.0 veya OFL-1.1 lisanslıdır.
- QR kodu `qrcode-generator` yalnızca modül matrisi ürettiği için Canvas 2D ile çizilir;
  renkler, boyut ve en az 14 px'lik sessiz alan korunur. UTF-8 eklentisi yüklenir, böylece
  Türkçe karakter içeren e-posta adresleri QR içinde bozulmadan kodlanır.
  Kaynak adresleri, lisanslar ve SHA-256 özetleri `vendor/README.md` içinde kayıtlıdır.
- `vendor/` altındaki dosyalar sürüme sabitlendiği için uzun süreli önbelleğe alınır
  (`immutable`); uygulama dosyaları her açılışta yeniden okunur (`no-cache`).
- Pinch mesafesi el ölçeğine göre normalize edilir; hysteresis, hedef kararlılığı ve cooldown yanlış/çift seçimi azaltır.
- Kamera kapatıldığında bütün video track'leri durdurulur.
- Hareket azaltma tercihi etkin cihazlarda taş işleme töreni atlanır ve kart doğrudan açılır.
- Latin → Kök Türk gösterimi yalnızca Unicode'un Orhon karakterlerini kullanır; kalın/ince ünlü bağlamına göre ünsüz biçimini seçer ve tarihî birleşik işaretleri destekler. Modern kişi adları Eski Türkçe metinler olmadığı için sonuç tarihî çeviri değil, kaynaklandırılmış fonetik uyarlamadır.
- Ana kiosk düzeni 1920×1080, 1600×900 ve 1366×768 yatay ekranlara göre hazırlanmıştır.
- Kişisel tamga, ismin FNV-1a karmasından Canvas 2D ile deterministik üretilir; aynı yazım aynı tamgayı verir.
- Taş işleme töreninde her rune kendi ekran konumunda darbe ışığı ve Canvas kıvılcımı üretir; işleme ilerledikçe taş çatlakları üç kademede açılır ve final mührü tüm sahneye enerji dalgası yayar.
- Tören parçacıkları yalnızca sahne açıkken çalışır; sahne kapandığında animasyon karesi iptal edilir ve parçacık belleği temizlenir.

## Kök Türk yazısı kaynaklandırması

- Karakter repertuvarı Unicode Standardı'nın `U+10C00–U+10C4F Old Turkic` bloğundaki Orhon biçimlerine dayanır: <https://www.unicode.org/charts/PDF/U10C00.pdf>
- Yazı yapısı, ünlü sınıfları ve yön bilgisi Unicode Standardı Bölüm 14.8'e dayanır: <https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-14/>
- Yatay çıktı sağdan sola gösterilir. Taş üzerindeki dikey uyarlamada karakterler yukarıdan aşağı, sütunlar sağdan sola sıralanır.
- Ünsüzlerin kalın/ince biçimi, modern addaki en yakın ünlünün sınıfına göre seçilir. `LT`, `NT`, `NÇ`, `NY` ve `NG` dizileri mevcut Orhon birleşik işaretleriyle gösterilir.
- Modern Türkçedeki `C`, `F`, `H`, `J`, `V` ve yabancı kökenli adlar tarihî Eski Türkçe ses sistemiyle birebir örtüşmez. Bu nedenle çıktı “doğru tarihî çeviri” diye sunulmaz; Unicode tabanlı, görsel-fonetik ad uyarlaması olarak etiketlenir.

## Hızlı kabul testi

1. `.env` dosyasında önce `KOKIZ_MOCK_EMAIL=true` ayarlayın.
2. `baslat.bat` ile projeyi açın ve `/api/saglik` yanıtında `epostaHazir: true`, `testModu: true` değerlerini doğrulayın.
3. Sekiz ülke/bölge düğmesinin her birini seçip ülkeye özel rengin, mührün, geometrik desenin, özgün dalgalanan bayrağın ve karşılama metninin güncellendiğini doğrulayın.
4. `ENES`, `TÜRKİYE` veya başka bir metin girin; kitabe ve Kök Türk alanının güncellendiğini kontrol edin.
5. Geçerli bir e-posta yazın ve hatıra kartını açın; runelerin ayrı ayrı kazındığını, kıvılcım ve çatlakların kademeli ilerlediğini, final enerji darbesinden sonra kişisel yıldızın seçilen ülke kümesine uçtuğunu doğrulayın ve **E-postama Gönder** düğmesine basın.
6. Arayüzde test gönderiminin tamamlandığını doğrulayın.
7. **Ortak Hafıza** görünümünde her ülke çemberinin merkezindeki özgün bayrak mührünü, izlerin renkli kümelere ayrıldığını ve aktif kümelerin bağlandığını kontrol edin.
8. Ardından gerçek Resend değerlerini girip `KOKIZ_MOCK_EMAIL=false` yaparak yalnızca kendi e-posta adresinizle gerçek gönderimi sınayın.
