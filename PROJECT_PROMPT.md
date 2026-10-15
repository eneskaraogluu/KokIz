# KÖKİZ · Etkileşimli Türk Yazı Duvarı — Teknik Şartname

Bu belge projenin **mevcut** halini tanımlar. Sürüm 5.7.1 · 15 Ekim 2026.

KÖKİZ, Türk Devletleri Teşkilatı'nın 29–30 Ekim 2026 Ankara etkinliği için hazırlanmış
temassız bir dijital kültür deneyimidir. Sıradan bir web sayfası değil, sergi
enstalasyonu olarak çalışan bir kiosk uygulamasıdır.

Belge kodla çelişmeyecek biçimde tutulur: bir davranış değiştiğinde ilgili bölüm aynı
değişiklikte güncellenir, `VERSION.txt` ve 27. bölüme kayıt düşülür.

---

# 1. BAĞLAM VE DENEYİM AKIŞI

Etkinlik: Türk Devletleri Teşkilatı · 29–30 Ekim 2026 · Ankara
Proje: KÖKİZ · ETKİLEŞİMLİ TÜRK YAZI DUVARI

Ziyaretçinin yaşadığı akış:

1. Sekiz kök coğrafyadan birini seçer; tam ekran karşılama seremonisi oynar.
2. Kamerayı başlatır; eli gerçek zamanlı algılanır.
3. İşaret parmağı sanal imleç olur; başparmakla pinch yaparak harf seçer.
4. Latin metin, Kök Türk karşılığı ve dijital Orhun kitabesi eşzamanlı oluşur.
5. Hatıra kartı komutu taş işleme törenini başlatır; işaretler taşa tek tek kazınır.
6. Kişisel yıldız doğar ve seçilen ülkenin yıldız kümesine uçar.
7. Hatıra kartı açılır: Latin metin, Kök Türk yazısı, kişisel tamga, ülke mührü,
   İz No ve QR.
8. Kart e-posta ile PNG eki olarak gönderilir, cihaza indirilir veya paylaşılır.
9. Anonim iz Ortak Hafıza Göğü'ne eklenir.

Tasarım ve geliştirme kararlarında ölçüt şudur: *"Bu değişiklik KÖKİZ'i sıradan bir web
sayfasından çıkarıp etkinlikte insanları durdurup baktıracak bir dijital kültür
deneyimine dönüştürüyor mu?"* Cevap hayırsa çözüm sadeleştirmek değil, deneyimle daha
iyi bütünleştirmektir.

---

# 2. SANAT YÖNÜ

Sanat yönünün bağlayıcı tanımı `styles.css` ve aşağıdaki maddelerdir. Tasarım
HTML/CSS/Canvas katmanlarıyla üretilir; hazır bir görsel arka plana konup üzerine
arayüz yerleştirilmez, böylece kullanıcı verisi tasarımla bütünleşir.

Korunması gerekenler:

- Derin zümrüt, koyu petrol, turkuaz ve altın paleti. Siyah-boş arayüz görünümü olmaz.
- Antik Türk kültürü ile ileri teknoloji aynı dünyadaymış gibi görünür.
- Merkezde anıtsal Orhun taşı; çevresinde turkuaz ve altın ışık halkaları.
- Kozmik gökyüzü, yıldız parçacıkları, aurora hissi; bozkır ufku ve uzak taş sütunlar.
- Tamga ve geometrik motiflerden türetilmiş ince dekorasyonlar.
- Altın çizgili HUD panelleri, hafif holografik parlamalar, veri akışını çağrıştıran
  ince ışık çizgileri.
- Oyun arayüzü değil, kültür-sanat enstalasyonu hissi; fotoğraf çekilecek kadar güçlü.

Yapılmayacaklar:

- Arayüzü sade siyah kutulara veya dashboard görünümüne dönüştürmek.
- Çok sayıda düz gri kart kullanmak, kurumsal sunum estetiğine kaymak.
- Kamerayı başka bölüme taşıyıp kullanıcıyı sayfayı kaydırmaya zorlamak.
- Harf seçiminde dwell/bekleme sistemine dönmek.
- Kök Türk yazısını uzun metinde tek satıra ezmek.
- Taşı küçük dekoratif bir ikona indirmek.
- Neon cyberpunk'ı aşırıya kaçırıp Türk kültürünü görünmez yapmak.
- Rune eşlemesi için akademik doğruluk iddia etmek.
- QR'ın otomatik e-posta gönderdiğini iddia etmek.

Sanat yönü başlangıçta `assets/design-reference.png` görseliyle belirlenmişti. Dosya
v5.7.0'da kaldırıldı; kodda hiç kullanılmıyordu ve 2.8 MB yer tutuyordu. Git
geçmişinde duruyor:

```powershell
git show 333d95e:assets/design-reference.png > design-reference.png
```

---

# 3. TEKNOLOJİ YIĞINI

Paket kurulumu gerekmez; `npm install` çalıştırılmaz. Üçüncü taraf kütüphaneler
`vendor/` altında sürüme sabitlenmiş olarak tutulur.

- HTML5, CSS3, çerçevesiz (vanilla) JavaScript
- Node.js 18+ — yalnızca standart kütüphane (`server.js`)
- MediaPipe Tasks Vision 0.10.35 + HandLandmarker float16/1 — Apache-2.0
- qrcode-generator 2.0.4 ve UTF-8 eklentisi — MIT
- html2canvas 1.4.1 — MIT
- Cinzel ve Inter yazı tipleri, latin + latin-ext alt kümeleri — OFL-1.1
- Tarayıcı API'leri: getUserMedia, Canvas 2D, Web Audio, Web Share, Fullscreen,
  Clipboard, sendBeacon

Bütün bağımlılıklar MIT, Apache-2.0 veya OFL-1.1 lisanslıdır; dağıtımda kopyasol
yükümlülük yoktur. Kaynak adresleri, lisanslar ve SHA-256 özetleri `vendor/README.md`
içinde kayıtlıdır; `npm run vendor:check` bütünlüğü doğrular.

Çalışma anında hiçbir harici ağ isteği yapılmaz. Kiosk internet bağlantısı olmadan tam
işlevle çalışır; yalnızca gerçek e-posta gönderimi internet gerektirir.

Güçlü bir neden olmadan React/Vue/Next.js gibi çerçevelere geçilmez ve yeni harici
paket eklenmez.

Python uygulamanın çalışma mantığında kullanılmaz ve projeyi açmak için de
kullanılamaz: `py -m http.server` statik dosyaları sunar ama `/api/*` uçlarını
çalıştıramaz; e-posta teslimi ve Ortak Hafıza çalışmaz.

---

# 4. DOSYA YAPISI

```text
KokIz/
├── index.html              kiosk sahnesi, kart ve gökyüzü işaretlemesi
├── styles.css              bütün sanat yönü ve responsive düzen
├── app.js                  istemci mantığının tamamı
├── server.js               statik sunucu ve /api uçları
├── package.json            Node sürüm şartı; start, check, vendor:check
├── .env.example            gizli anahtar içermeyen yapılandırma şablonu
├── .gitattributes          satır sonu ve ikili dosya kuralları
├── .gitignore
├── README.md               kurulum ve kullanım belgesi
├── PROJECT_PROMPT.md       bu şartname
├── VERSION.txt             sürüm ve değişiklik notu
├── baslat.bat              Windows başlatıcı; baslat.ps1'i çağırır
├── baslat.ps1              Node denetimi, port denetimi, tarayıcı açma
├── assets/
│   ├── tdt-logo.png
│   └── flags/              sekiz özgün bayrak SVG'si ve kaynak belgesi
└── vendor/                 sürüme sabit üçüncü taraf dosyalar
    ├── mediapipe/
    │   ├── vision_bundle.mjs
    │   └── wasm/           SIMD ve nosimd ikilileri
    ├── models/
    │   └── hand_landmarker.task
    ├── fonts/              fonts.css ve dört woff2
    ├── qrcode-generator.js
    ├── qrcode-generator-utf8.js
    ├── html2canvas.min.js
    └── README.md           kaynak, lisans ve SHA-256 kayıtları
```

`ortak-hafiza.ndjson` çalışma anında oluşur, depoda tutulmaz ve web üzerinden sunulmaz.

---

# 5. ÇALIŞTIRMA VE YAPILANDIRMA

En kolay yol `baslat.bat` dosyasına çift tıklamaktır. Başlatıcı Node sürümünü denetler,
portu doğru KÖKİZ sunucusunun kullanıp kullanmadığını kontrol eder, sunucuyu başlatır
ve tarayıcıyı açar. Açılacak adres `.env` içindeki `PORT` değerinden okunur.

Terminalden:

```powershell
cd "PROJE_KLASORU"
npm start
```

Adres `http://localhost:5500`. Önbellek sorununda `Ctrl + Shift + R`.

Kamera yalnızca `localhost` veya güvenli bağlantıda çalışır.

`.env` değişkenleri (şablon: `.env.example`):

| Değişken | Açıklama |
| --- | --- |
| `HOST` | Bağlanılacak arayüz. Varsayılan `127.0.0.1`, yani yalnızca yerel. |
| `PORT` | Varsayılan `5500`. 1–65535 dışındaysa sunucu başlamaz. |
| `RESEND_API_KEY` | Resend API anahtarı. Yalnızca sunucuda tutulur. |
| `KOKIZ_FROM_EMAIL` | Doğrulanmış gönderen adresi. |
| `KOKIZ_FROM_NAME` | Gönderen adı. Varsayılan `KÖKİZ`. |
| `KOKIZ_MOCK_EMAIL` | `true` ise gerçek e-posta gönderilmez; yalnızca yerel sınama. |

`.env` depoya eklenmez. Anahtar ve gönderen adresi tanımsızsa ve test modu kapalıysa
gönderim düğmesi devre dışı kalır.

Denetim komutları:

```powershell
npm run check          # server.js ve app.js sözdizimi
npm run vendor:check   # vendor/ dosyalarının SHA-256 özetleri
```

---

# 6. ANA EKRAN MİMARİSİ

Uygulama tam ekranda, dikey kaydırma olmadan çalışacak biçimde tasarlanmıştır. Ekran üç
yatay katmandan oluşur.

## Katman A — Kurumsal üst sahne

TDT logosu, `TÜRK DEVLETLERİ TEŞKİLATI` başlığı, `29–30 EKİM 2026 · ANKARA`,
`KÖKİZ · ETKİLEŞİMLİ TÜRK YAZI DUVARI` alt başlığı ve sağda dört araç:

- genel QR — TDT resmî sayfası
- `✦ HAFIZA` — Ortak Hafıza Göğü
- `♫ SES AÇIK` / `♩ SES KAPALI`
- `⛶ TAM EKRAN` / `× TAM EKRANDAN ÇIK`

Logo köşeye sıradan biçimde yerleştirilmez; çevresinde konsantrik halkalar, ışıklı ince
çizgiler, küçük Kök Türk runeleri ve altın/turkuaz parlamalar bulunur.

## Katman B — Ana sahne, üç kolon

**Sol: canlı metin paneli.** `01 / CANLI İZ` kodu, kök coğrafya seçim ızgarası,
`LATİN ALFABESİ` çıktısı, `KÖK TÜRK YAZISI` çıktısı (sağdan sola), `0 / 24` sayacı ve
anlık İz No. Metin yazıldıkça anında güncellenir. Uzun metin taşmaz: yazı alanı 11 ve
18 karakter eşiklerinde `clamp()` ile küçülür.

**Orta: dijital Orhun kitabesi.** Karanlık taş dokulu, altın rune ışıklı, çevresinde
turkuaz hologram halkaları ve platform ışıkları olan anıt. Kök Türk yazısı taşın
üzerine dikey sütunlarla işlenir (13. bölüm).

**Sağ: kamera HUD paneli.** `02 / GÖRÜNTÜ İŞLEME` kodu, canlı vizör, el iskeleti, pinch
ölçeri ve sistem durumları (7. bölüm).

## Katman C — Kontrol konsolu

`03 / SANAL ALFABE` klavyesi ve komut paneli: `SİL`, `BOŞLUK`, `TEMİZLE`, `KOPYALA`,
hatıra kartı e-posta alanı, `HATIRA KARTINI OLUŞTUR` düğmesi ve durum mesajı satırı.

## Tam ekran katmanları

Ana ekranın üzerine gerektiğinde dört tam ekran katmanı açılır: kök coğrafya
karşılaması, taş işleme töreni, hatıra kartı modalı ve Ortak Hafıza Göğü.

---

# 7. KAMERA VE GÖRÜNTÜ İŞLEME

Kamera tasarımdan kopuk beyaz bir kutu değil, sahneye entegre bir HUD panelidir.

Panelde canlı görüntü, MediaPipe el iskeleti, kamera durum göstergesi, algılanan el
sayısı, mevcut hedef, pinch yüzdesi, model durumu, algılama durumu ve seçim durumu
görünür.

- Kamera `navigator.mediaDevices.getUserMedia()` ile açılır.
- Tercih `facingMode: "user"`, ideal çözünürlük `1280 × 720`, ses kapalı.
- Görüntü ve el canvas'ı aynalıdır: `transform: scaleX(-1)`.
- Kamera durdurulduğunda bütün video track'leri `stop()` ile kapatılır.
- Akış işletim sistemi veya cihaz tarafından sonlandırılırsa (`ended` olayı) arayüz
  yanlış "canlı" durumunda kalmaz; durumu kapatıp yeniden başlatma mesajı verir.

Hata mesajları Türkçe ve eyleme dönüktür:

| Hata | Mesaj |
| --- | --- |
| `NotAllowedError` | Kamera izni verilmedi. Tarayıcıdaki kamera iznini aç. |
| `NotReadableError` | Kamera başka bir uygulama tarafından kullanılıyor. |
| `NotFoundError` | Bu cihazda kullanılabilir kamera bulunamadı. |
| `OverconstrainedError` | İstenen kamera çözünürlüğü desteklenmiyor. |
| `SecurityError` | Kamera yalnızca localhost veya güvenli bağlantıda çalışır. |

---

# 8. MEDIAPIPE EL TAKİBİ

Paket `@mediapipe/tasks-vision@0.10.35`, proje içinden yüklenir:

- JavaScript: `/vendor/mediapipe/vision_bundle.mjs`
- WASM klasörü: `/vendor/mediapipe/wasm`
- Model: `/vendor/models/hand_landmarker.task`

`FilesetResolver.forVisionTasks()` SIMD desteğine göre `vision_wasm_internal.*` veya
`vision_wasm_nosimd_internal.*` ikililerini ister; dördü de `vendor/` içinde tutulur.

HandLandmarker ayarları:

- `runningMode: "VIDEO"`, `numHands: 1`
- `minHandDetectionConfidence`, `minHandPresenceConfidence` ve
  `minTrackingConfidence`: 0.62

Delege önce `GPU` denenir, başarısız olursa `CPU` ile yeniden açılır. Model yalnızca bir
kez yüklenir; yükleme sözü önbelleğe alınır, hata durumunda önbellek temizlenerek
tekrar denenebilir hale gelir.

Algılama `AYARLAR.algilamaAraligi` ile yaklaşık 40 ms'ye sınırlanır ve yalnızca video
karesi değiştiğinde çalışır.

---

# 9. SANAL İMLEÇ

Landmark 8 (işaret parmağı ucu) imleç konumunu belirler. Kamera aynalı olduğu için X
koordinatı ekrana çevrilirken terslenir.

İmleç ham koordinata bağlanmaz:

- Son 4 kare (`gecmisPencereBoyutu`) tutulur ve ortalama nokta hesaplanır.
- Ekranda lerp benzeri yumuşatma uygulanır: `imlecYumusatmaOrani = 0.34`.
- Kamera kenarlarında `kameraKenarPayi = 0.10` ölü alan bırakılır; kullanıcı elini
  kameranın en ucuna götürmeden ekranın tamamına ulaşır.

İmleç turkuaz bir enerji izi bırakır; pinch sırasında iz altına döner. İz son 28
noktayla sınırlıdır ve 560 ms içinde söner.

Hedef tespiti `document.elementFromPoint()` ile yapılır ve en yakın `.hedeflenebilir`
öğeye çıkılır. Bir öğenin kamera imleciyle seçilebilir olması için bu sınıfı taşıması
gerekir.

---

# 10. PINCH İLE SEÇİM

Dwell/bekleme sistemi kullanılmaz; kullanıcı harfin üzerinde beklemek zorunda değildir.

Seçim, başparmak ucu (landmark 4) ile işaret parmağı ucunun (landmark 8) birbirine
yaklaşmasıyla yapılır. El kameraya yaklaşıp uzaklaştığı için mesafe piksel olarak
ölçülmez, el ölçeğine normalize edilir:

```text
oran = mesafe(landmark 4, landmark 8) / mesafe(landmark 0, landmark 9)
```

landmark 0 el bileği, landmark 9 orta parmak MCP eklemidir.

| Parametre | Değer | Amaç |
| --- | --- | --- |
| `pinchBaslamaEsigi` | 0.27 | pinch başlar |
| `pinchBirakmaEsigi` | 0.40 | pinch biter |
| `pinchCooldownSuresi` | 250 ms | ardışık yanlış seçimi engeller |
| `hedefKararSuresi` | 100 ms | hedef kararlı sayılır |
| `pinchDogrulamaSuresi` | 70 ms | pinch teyit süresi |

İki ayrı eşik (hysteresis) yanlış çift seçimleri azaltır. Pinch oranı da 4 kare
üzerinden yumuşatılır.

Kritik kural: **pinch'in başladığı hedef ile seçimin gerçekleştiği hedef aynı
olmalıdır.** Pinch sırasında imleç başka tuşa kayarsa seçim iptal edilir. Bir pinch
hareketi yalnızca bir seçim üretir; parmaklar birleşik tutulduğunda harf tekrar
yazılmaz.

---

# 11. KLAVYE

Sanal Türkçe klavye üç satırdır:

```text
Q W E R T Y U I O P Ğ Ü
A S D F G H J K L Ş İ
Z X C V B N M Ö Ç
```

Her tuşta büyük Latin harf ve altında Kök Türk karşılığı gösterilir. Ünsüzün kalın ve
ince biçimi farklıysa tuş etiketi `𐰴/𐰚` biçiminde iki formu birlikte verir.

Komutlar: `SİL`, `BOŞLUK`, `TEMİZLE`, `KOPYALA` (Kök Türk yazısını panoya kopyalar),
e-posta alanı ve `HATIRA KARTINI OLUŞTUR`.

Fiziksel klavye de çalışır:

| Tuş | Davranış |
| --- | --- |
| Türkçe/Latin harf | metne ekler; yalnızca klavyede tanımlı harfler |
| `Backspace` | son karakteri siler |
| `Space` | boşluk ekler |
| `Delete` | metni temizler |
| `Escape` | sırayla Ortak Hafıza'yı, töreni, hatıra kartını kapatır |

Metin sınırı 24 karakterdir; aşıldığında bildirim gösterilir. E-posta alanı odakta iken
fiziksel klavye olayları KÖKİZ metnini değiştirmez.

---

# 12. KÖK COĞRAFYA SEÇİMİ

Ziyaretçi ismini yazmadan önce sekiz kök coğrafyadan birini seçer: Türkiye (TUR),
Azerbaycan (AZE), Kazakistan (KAZ), Kırgızistan (KGZ), Özbekistan (UZB), Türkmenistan
(TKM), Macaristan (HUN), Kuzey Kıbrıs Türk Cumhuriyeti (KKTC). Varsayılan Türkiye'dir.

Her ülkenin kendi ışık rengi, gökyüzü yörünge merkezi ve uçuş hedefi vardır. Seçim
fare, dokunma, klavye odağı ve kamera/pinch ile çalışır.

Seçim yaklaşık iki saniyelik tam ekran karşılama seremonisi başlatır: ülkenin renk
tonu, kısa mührü, adı, ülkeye göre parametrik değişen geometrik motifi ve dalgalanan
özgün bayrağı gösterilir. Katman odağı değiştirmez ve işaretçi olaylarını engellemez.

Bayraklar Wikimedia Commons'taki güncel özgün SVG dosyalarıdır, `assets/flags/`
altında yerel tutulur ve çizimleri değiştirilmez; kumaş hareketi, perspektif, kıvrım ve
ışık geçişi CSS ile uygulanır. Kaynak ve lisans sayfaları `assets/flags/README.md`
içinde belgelenir.

Seçilen ülke hatıra kartında kısa kod ve tam ad içeren bir mühür olarak görünür,
e-posta özetine ve QR metnine dahil edilir.

`prefers-reduced-motion` etkinse karşılama seremonisi atlanır.

---

# 13. KÖK TÜRK YAZI DÖNÜŞÜMÜ

Dönüşüm Unicode `U+10C00–U+10C4F Old Turkic` bloğundaki **Orhon** biçimlerini kullanır.
Modern kişi adlarının tarihî Eski Türkçe karşılığı kesin olarak üretilemediği için
kullanıcıya gösterilen ifade "Unicode Orhon işaretleriyle fonetik ad uyarlaması"dır.
Tarihî çeviri veya akademik transkripsiyon iddiası kullanılmaz; arayüzde bu not görünür.

## Ünlüler, tek biçim

```text
A 𐰀    E 𐰀    I 𐰃    İ 𐰃
O 𐰆    U 𐰆    Ö 𐰇    Ü 𐰇
```

## Bağlama göre değişen ünsüzler

Ünsüzün biçimi, aynı kelimedeki **en yakın ünlünün** sınıfına göre seçilir. Kalın
ünlüler A I O U, ince ünlüler E İ Ö Ü'dür. Eşit uzaklıkta soldaki ünlü kazanır;
kelimede ünlü yoksa kalın biçim kullanılır.

| Harf | Kalın | İnce |
| --- | --- | --- |
| B, V, W | 𐰉 | 𐰋 |
| C, Ç | 𐰱 | 𐰲 |
| D | 𐰑 | 𐰓 |
| G, Ğ | 𐰍 | 𐰏 |
| H, K | 𐰴 | 𐰚 |
| J, Y | 𐰖 | 𐰘 |
| L | 𐰞 | 𐰠 |
| N | 𐰣 | 𐰤 |
| R | 𐰺 | 𐰼 |
| S | 𐰽 | 𐰾 |
| Ş | 𐰿 | 𐱁 |
| T | 𐱃 | 𐱅 |

## Tek biçimli ünsüzler

```text
F 𐰯    M 𐰢    P 𐰯    Q 𐰴    X 𐰴    Z 𐰔
```

## Birleşik işaretler

Şu iki harflik diziler tek tarihî işaretle gösterilir ve harf eşlemesinden önce
denenir:

```text
LT 𐰡    NT 𐰦    NÇ 𐰨    NY 𐰪    NG 𐰭
```

## Diğer kurallar

- Kelime ayracı `⁚` işaretidir. Baştaki ve sondaki ayraçlar atılır, ardışık ayraç
  tekrarlanmaz.
- Eşlenemeyen karakter `□` ile gösterilir.
- Yatay çıktı sağdan sola gösterilir (`dir="rtl"`).
- Metin `NFC` ile normalize edilip `tr-TR` yerelinde büyük harfe çevrilir.

Modern Türkçedeki C, F, H, J, V ve yabancı kökenli adlar tarihî ses sistemiyle birebir
örtüşmez. Harita `app.js` içindeki `KOK_TURK_ORHON` ve `KOK_TURK_BIRLESIKLER`
sabitlerinde tutulur ve akademik doğrulama sonrası kolay değiştirilebilir kalır.

Kaynaklar:

- <https://www.unicode.org/charts/PDF/U10C00.pdf>
- <https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-14/>

---

# 14. DİJİTAL KİTABE

Kök Türk yazısı taşın üzerine dikey sütunlarla işlenir. Sütun sayısı **işaret** sayısına
göre belirlenir; Latin harf sayısına göre değil, çünkü birleşik işaretler iki harfi tek
işarete indirir ve kelime ayracı da bir giriş sayılır:

```text
sütun = min(4, ceil(işaret sayısı / 6))
```

1–6 işaret 1 sütun, 7–12 işaret 2 sütun, 13–18 işaret 3 sütun, 19 ve üzeri 4 sütundur.
Her sütun en çok 6 işaret taşır.

- İşaretler yukarıdan aşağı, sütunlar sağdan sola okunur.
- Amaç uzun kelimeyi tek satırda küçültmek değildir; yazı uzadıkça taş gerçek kitabe
  hissi verecek biçimde dolar.
- Hiçbir işaret taşın dışına çıkmaz.
- Durum satırı sütun sayısını bildirir: `3 SÜTUN · SAĞDAN SOLA İŞLENİYOR`.
- Metin boşken taşta `KOKIZ` işaretleri ve `İZİNİ TAŞA İŞLE` yer tutucusu görünür.

---

# 15. TAŞ İŞLEME TÖRENİ

`HATIRA KARTINI OLUŞTUR` kartı anında açmaz. Önce tam ekran bir tören çalışır: Orhon
işaretleri taşa sırayla vurulur, kişisel iz mühürlenir, kişisel yıldız doğup seçilen
ülkenin kümesine uçar ve kart ışık geçişiyle görünür.

Aşamalar sırayla `DİJİTAL İZ HAZIRLANIYOR`, `KİŞİSEL YILDIZ OLUŞTURULUYOR`,
`ORTAK HAFIZAYA YOLCULUK`, `KÜMELER BİRBİRİNE BAĞLANDI` olarak gösterilir; ilerleme
çubuğu buna göre dolar.

- Her işaret kendi taş koordinatında altın/turkuaz darbe ışığı, genişleyen halka ve
  konumsal Canvas kıvılcımı üretir.
- Işıklı çatlaklar ilerlemeye göre üç kademede dallanır.
- Arka planda düşük yoğunluklu taş tozu tören boyunca canlı kalır; parçacık sayısı 340
  ile sınırlıdır ve uzun metinlerde yoğunluk otomatik düşer.
- Final mührü taş parlaması, çatlak aydınlanması ve sahneye yayılan enerji dalgasıyla
  tamamlanır.
- İşaret başına adım süresi 62–115 ms arasında, işaret sayısına göre hesaplanır.
- Efektler yalnızca Canvas 2D, CSS ve Web Audio kullanır; yeni paket veya ses dosyası
  yoktur.
- `TÖRENİ ATLA` düğmesi ve `Escape` tuşu hızlı geçiş sağlar.
- `prefers-reduced-motion` etkinse tören tamamen atlanır ve kart doğrudan hazırlanır.
- Tören kapanırken bütün zamanlayıcılar temizlenir, animasyon karesi iptal edilir ve
  parçacık belleği boşaltılır.
- Tören PNG karta veya e-posta içeriğine dahil edilmez; tamamlandıktan sonra temizlenmiş
  statik kart üretilir.

---

# 16. HATIRA KARTI

Hatıra kartı projenin en önemli çıktısıdır. Ana sahnenin ekran görüntüsü gibi
görünmemeli, premium bir kültürel poster hissi taşımalıdır. Kart üç yatay katmandan
oluşur.

## Üst katman

TDT logosu, `TÜRK DEVLETLERİ TEŞKİLATI`, `29–30 EKİM 2026 · ANKARA`,
`KÖKİZ · ETKİLEŞİMLİ TÜRK YAZI DUVARI` ve sağda QR kodu. QR başlığı e-posta girilmişse
`KİŞİYE ÖZEL QR`, girilmemişse `GENEL QR` olur.

## Orta katman

- **Sol:** `LATİN ALFABESİ` başlığı altında kullanıcının metni, `KÖK TÜRK YAZISI`
  başlığı altında karşılığı ve kısa bir açıklama metni.
- **Merkez:** dijital Orhun taşı, kullanıcının işaretleri taş üzerinde, holografik
  halkalar ve bozkır/kozmik atmosfer.
- **Sağ:** dijital iz paneli — kişisel tamga canvas'ı, ülke mührü, İz No ve rune şeridi.

## Alt katman

Üç bilgi kartı:

1. `ETKİNLİK` — 29–30 Ekim 2026 · Ankara
2. `İZ NO` — `KIZ-xxxx`
3. `DİJİTAL TESLİM` — kullanıcı e-postası veya "E-posta bekleniyor"

## Ölçü ve ölçekleme

Kart ekranda `3:2` oranında ve genişliğe göre akışkandır. Dışa aktarılırken ekran
boyutundan bağımsız olarak sabit `1440 × 960` çalışma yüzeyine geçer, böylece her
cihazda aynı kart üretilir.

Uzun adlar dört ölçek kademesiyle düzenlenir (`kisa`, `orta`, `uzun`, `cok-uzun`;
eşikler 8, 12 ve 18 harf). Taşın alt yazısı kelimeleri ayrı satırlara dağıtır.

## İz No ve kişisel tamga

İz No kullanıcının metninden deterministik üretilir: FNV-1a karmasının 10000 modülü,
`KIZ-0000` biçiminde. Aynı yazım her zaman aynı izi verir.

Kişisel tamga da aynı metinden FNV-1a ile üretilen 8 haneli onaltılık koddan Canvas 2D
ile deterministik çizilir: dikey eksen, dört seviyede dallar ve bir taban üçgeni. Aynı
yazım aynı tamgayı verir. Tamga karta, PNG'ye ve Ortak Hafıza kaydına dahil edilir.

---

# 17. QR ÜRETİMİ

MIT lisanslı `qrcode-generator` 2.0.4 kullanılır. Kütüphane yalnızca modül matrisi
ürettiği için Canvas 2D çizimi `qrOlustur()` içinde yapılır.

- Hata düzeltme seviyesi `M`, sürüm otomatik seçilir.
- Renkler: zemin `#ffffff`, mürekkep `#001b18`.
- Hücre boyutu, en az 14 px sessiz alan kalacak biçimde hesaplanır ve kod ortalanır.
- `qrcode-generator-utf8.js` eklentisi **zorunludur**. Kütüphanenin varsayılan
  `stringToBytes` fonksiyonu her karakteri `c & 0xff` ile daraltır; bu durumda `ş`
  (U+015F) sessizce `_` (0x5F) olur ve Türkçe karakter içeren bir e-posta adresi QR
  içinde bozulur. Eklenti `stringToBytes`'ı UTF-8 sürümüyle değiştirir.
- Kütüphane yüklenemezse `QR çevrimdışı`, içerik en büyük sürüme sığmazsa
  `QR üretilemedi` yer tutucusu çizilir; kart QR alanı hiçbir durumda boş kalmaz.

İki QR vardır:

- **Genel QR** (üst sahne, 256 px): TDT resmî sayfası `https://www.turkicstates.org/tr`.
- **Kart QR'ı** (320 px): geçerli e-posta girilmişse `mailto:` taslağı; girilmemişse
  genel adres.

`mailto:` taslağı e-posta adresini, konuyu, Latin metni, Kök Türk karşılığını, kök
coğrafyayı, İz No'yu ve etkinlik bilgisini içerir.

QR gerçek e-posta gönderiminin yerine geçmez; ikincil bir kanaldır. QR okutulduğunda
yalnızca hazır bir mail taslağı açılır — "QR okutulunca otomatik mail gönderilir" gibi
bir davranış veya iddia oluşturulmaz.

---

# 18. PNG DIŞA AKTARMA VE PAYLAŞIM

Kart `html2canvas` ile DOM üzerinden PNG'ye dönüştürülür. Amaç ekrandaki kart ile
indirilen kartın mümkün olduğunca aynı görünmesidir.

Ayarlar:

```js
{ scale: 1.5, useCORS: true, backgroundColor: "#031b1b",
  logging: false, imageTimeout: 10000, windowWidth: 1600, windowHeight: 1100 }
```

`1440 × 960` çalışma yüzeyi ile birlikte sonuç yaklaşık `2160 × 1440` piksel, ~2 MB
PNG'dir.

Dönüştürme öncesinde `document.fonts.ready` beklenir ve karta
`kart-disari-aktariliyor` sınıfı eklenerek animasyonlar duraklatılır; iki
`requestAnimationFrame` sonrası yakalama yapılır.

> Not: Bu çift `requestAnimationFrame` beklemesi, sayfanın görünür olmasını gerektirir.
> Chrome arka plan sekmelerinde `requestAnimationFrame` çalışmadığı için sekme gizliyken
> kart üretimi bu adımda bekler. Kiosk'ta sayfa daima görünür olduğundan bu durum
> oluşmaz; otomatik testlerde sekmenin ön planda olması gerekir.

Dosya adı kullanıcının metninden türetilir: `ENES_KOKIZ_Hatira.png`.

Paylaşım Web Share API ile yapılır; destekleyen cihazlarda PNG bir `File` nesnesi
olarak paylaşılır. Desteklemeyen masaüstü tarayıcılarda uygulama çökmez, kullanıcıya
`PNG İNDİR` seçeneği önerilir. Kullanıcı paylaşımı iptal ederse (`AbortError`) hata
gösterilmez.

---

# 19. E-POSTA TESLİMİ

Projenin birincil teslim özelliği, hatıra kartının ziyaretçinin girdiği adrese gerçek
PNG eki olarak gönderilmesidir.

Akış: arayüz kartı PNG'ye çevirir, `POST /api/hatira-gonder` isteğiyle e-posta
adresini, kart metinlerini, iz numarasını, ülke kodunu ve PNG verisini backend'e
aktarır. Backend girdiyi doğrular, hız sınırı uygular ve Resend API üzerinden gönderir.

E-posta hem gövdesinde kartı tam görsel olarak (`cid` ile gömülü) hem de indirilebilir
PNG eki olarak taşır; ayrıca düz metin alternatifi içerir.

## API uçları

| Uç | Yöntem | İşlev |
| --- | --- | --- |
| `/api/saglik` | GET | servis adı, sürüm, e-posta hazır mı, test modu |
| `/api/hatira-gonder` | POST | kartı doğrular ve e-posta ile gönderir |
| `/api/ortak-hafiza` | GET | toplam iz sayısı ve son 600 anonim iz |
| `/api/ortak-hafiza` | POST | anonim iz ekler |
| `/api/ortak-hafiza/sifirla` | POST | anonim koleksiyonu boşaltır |

`/api/saglik` gizli anahtarları hiçbir zaman döndürmez.

## Doğrulama ve koruma katmanları

- Aynı kaynak denetimi: `Origin` başlığı varsa `Host` ile eşleşmelidir.
- E-posta biçimi ve 254 karakter sınırı; istemci ve sunucu aynı kuralı uygular.
- İz numarası, ülke/bölge kodu ve dosya adı doğrulaması.
- PNG imza denetimi (`89 50 4E 47 …`) ve 12 MB ham görsel sınırı.
- 18 MB istek gövdesi sınırı; Ortak Hafıza istekleri için 8 KB.
- IP başına dakikada 20 kart gönderimi, 30 Ortak Hafıza eklemesi. Kiosk'ta bütün
  ziyaretçiler aynı yerel adresten geldiği için bu sınır ortaktır.
- Yinelenen gönderimi azaltan idempotency anahtarı (e-posta, iz ve görselin SHA-256
  karması).
- İstek zaman aşımı 30 s, başlık zaman aşımı 35 s.

Sağlayıcı hatası kullanıcıya ayrıntı sızdırmadan bildirilir; sunucu günlüğüne yalnızca
HTTP durum kodu yazılır.

---

# 20. ORTAK HAFIZA GÖĞÜ

Ortak Hafıza Göğü kalıcı bir etkinlik arşivi değil, **açık kiosk oturumunun** canlı
görselidir.

Tam ekran gökyüzünde her anonim iz bir ışıktır. Sekiz ülkenin her birinin kendi rengi,
yörünge merkezi ve nokta deseni vardır; çemberlerin merkezinde ülkenin özgün bayrağı
dairesel bir ışık mührü olarak görünür. Aynı ülkeye ait yıldızlar kendi kümelerinde ince
çizgilerle bağlanır, aktif ülke kümeleri altın bir ortak hafıza hattıyla birleşir.

- Son eklenen iz nabızla vurgulanır.
- Ziyaretçi bir ışığın üzerine geldiğinde iz numarası, ülke ve kişisel tamga görünür.
- Ülke özeti her ülkenin iz sayısını listeler.
- Canvas bayrağın en-boy oranını korur, çemberi dolduracak biçimde merkezden kırpar.
  Bayrak yüklenene kadar kısa ülke kodu renkli bir yedek mühür olarak gösterilir.
- Yıldızlar ve bağlantılar bayrak mühürlerinden sonra çizilir; görsel hiyerarşi korunur.
- `prefers-reduced-motion` etkinse nabız animasyonu durur, sahne tek karede çizilir.

## Saklanan veri

Koleksiyonda yalnızca rastgele kayıt kimliği, iz numarası, tamga kodu, doğrulanmış
ülke/bölge kodu ve sunucu zamanı tutulur. **İsim, e-posta, kamera görüntüsü, IP adresi
ve kart görseli yazılmaz.** Ülke kodu yalnızca anonim ışığı doğru kümeye yerleştirmek
için kullanılır. Aynı kayıt kimliği tekrar gönderildiğinde çoğaltılmaz. Ülke kodu
içermeyen eski kayıtlar geriye uyumluluk için Türkiye kümesinde gösterilir.

## Oturum sıfırlama

- Tarayıcı `pagehide` olayında `POST /api/ortak-hafiza/sifirla` isteğini önce
  `navigator.sendBeacon` ile gönderir; desteklenmiyorsa `keepalive: true` kullanan kısa
  bir `fetch` denenir.
- Geri-ileri önbelleğine alınan sayfalarda (`event.persisted`) yanlış sıfırlama yapılmaz.
- Sunucu `SIGINT` ve `SIGTERM` kapanışlarında yalnızca `ortak-hafiza.ndjson` dosyasını
  boşaltır.
- Windows'ta süreç zorla kapatıldığında sinyal çalışmaz; bu duruma karşı sunucu **her
  başlangıçta** önceki koleksiyonu sıfırlar. Temiz oturum garantisi budur.
- `.env`, e-posta yapılandırması, bayraklar ve diğer proje dosyaları sıfırlama kapsamı
  dışındadır.

---

# 21. SES

Bütün sesler Web Audio API ile cihazda üretilir; harici ses dosyası yoktur.

- Harf seçimi, rune darbesi ve final mührü için ayrı ton desenleri vardır.
- Tarayıcının ses kilidi ilk kullanıcı etkileşiminde `resume()` tamamlanana kadar
  beklenerek açılır.
- Üst menüdeki `♫ SES AÇIK / ♩ SES KAPALI` düğmesi sesi yönetir; ses yeniden
  açıldığında üç notalı bir test melodisi çalar, böylece çalıştığı duyulabilir.
- Tarayıcı sesi başlatamazsa durum sessizce `SES KAPALI`ya döner ve kullanıcıya sekmenin
  sessize alınmış olabileceği bildirilir.
- Ana kazanç 0.78 ile sınırlıdır; tek tonlar 0.024–0.14 aralığındadır.

---

# 22. TAM EKRAN, RESPONSIVE VE ERİŞİLEBİLİRLİK

Etkinlikte kiosk deneyimi için tam ekran önemlidir; Fullscreen API kullanılır ve düğme
metni duruma göre güncellenir.

Hedef ekranlar `1920 × 1080`, `1600 × 900` ve `1366 × 768`. Özellikle 1366 × 768
laptop ekranında sayfa kaydırma istemeden çalışır. Yaklaşık katman payları: üst
kurumsal %23–25, orta deneyim %50, alt klavye %25–27.

CSS'te `clamp()`, `vw`, `vh`, `minmax()`, grid ve media query kullanılır. Küçük ekran
uyumu yapılırken büyük ekran tasarımının anıtsallığı bozulmaz. Sanal klavye 320–760 px
mobil ekranlarda on iki tuşlu en geniş satırı sığdıracak biçimde ölçeklenir ve yatay
taşma oluşturmaz.

Erişilebilirlik:

- Durum metinleri `role="status"` ve `aria-live="polite"` ile duyurulur.
- Klavye ve ülke seçimi `role="radiogroup"` / `role="radio"` ve `aria-checked` kullanır.
- Modallar `role="dialog"` ve `aria-modal` taşır; açılışta odak kapatma düğmesine
  taşınır, kapanışta önceki öğeye geri döner.
- `prefers-reduced-motion` etkinse ülke karşılaması ve taş işleme töreni atlanır,
  gökyüzü nabzı durur, bayrak dalgalanması kapanır.

---

# 23. PERFORMANS

Uygulama etkinlikte uzun süre açık kalır. Kaçınılması gerekenler:

- her animasyon karesinde gereksiz DOM oluşturmak,
- MediaPipe modelini tekrar yüklemek,
- birden çok `requestAnimationFrame` döngüsü başlatmak,
- durdurulmuş kameranın track'lerini açık bırakmak,
- her el karesinde ağır görsel render etmek.

Uygulanan sınırlar:

- MediaPipe analizi yaklaşık 40 ms aralıkla ve yalnızca yeni video karesinde çalışır.
- Canvas ölçekleri `devicePixelRatio` ile en çok 2 katına sınırlanır.
- Tören parçacıkları 340, imleç enerji izi 28 nokta ile sınırlıdır.
- Sahneler kapandığında animasyon kareleri iptal edilir ve parçacık/zamanlayıcı
  bellekleri boşaltılır.
- Hız sınırı kayıt tablosu 256 girdiyi aşınca budanır.
- Dekoratif CSS animasyonları transform/opacity ağırlıklıdır.
- `vendor/` dosyaları sürüme sabit olduğu için `immutable` önbelleğe alınır; 19 MB'lık
  wasm ve model her sayfa yenilemesinde yeniden okunmaz. Uygulama dosyaları `no-cache`
  kalır, böylece düzenlemeler anında görünür.

---

# 24. GÜVENLİK VE GİZLİLİK

- API anahtarı yalnızca sunucudaki `.env` dosyasında bulunur; tarayıcı JavaScript'ine
  hiçbir koşulda yazılmaz.
- E-posta adresi ve PNG yalnızca isteği doğrulamak ve sağlayıcıya aktarmak için bellekte
  tutulur; diske yazılmaz, veritabanına kaydedilmez ve günlüklere eklenmez.
- Statik sunucuda yasak dosya listesi, URL'in ilk parçası yerine `path.resolve` ile
  **çözümlenmiş yolun her parçası** üzerinden denetlenir. İlk parça denetimi
  `/assets/..%2f.env` gibi kodlanmış ayraçla atlatılabiliyordu ve `.env` dosyası
  gövdede dönüyordu; bu v5.6.0'da kapatıldı.
- Kök dizin dışına çıkan istekler 403, yasak veya gizli dosya istekleri 404 döner.
- Web üzerinden sunulmayanlar: `.env`, `.env.example`, `.gitignore`, `package.json`,
  `server.js`, `baslat.ps1`, `baslat.bat`, `ortak-hafiza.ndjson`, `PROJECT_PROMPT.md`
  ve nokta ile başlayan bütün girdiler.
- Yanıtlarda `X-Content-Type-Options: nosniff` ve `Referrer-Policy: same-origin`
  gönderilir; API yanıtları `no-store` ile işaretlenir.
- Varsayılan `HOST=127.0.0.1` yalnızca yerel bağlantıya izin verir. `0.0.0.0` yapılırsa
  kiosk aynı ağdaki her cihaza açılır; bu bilinçli bir karar olmalıdır.
- Ortak Hafıza koleksiyonu kişiye geri bağlanamaz (20. bölüm).

---

# 25. TEST SENARYOLARI

Her değişiklikten sonra çalıştırılır.

## Statik denetim

```powershell
npm run check
npm run vendor:check
```

`vendor:check` çıktısı `vendor/README.md` içindeki kayıtla birebir aynı olmalıdır.

## Temel yazma

1. Uygulamayı aç. 2. Fiziksel klavyeden `ENES` yaz. 3. Latin alanında `ENES` görünmeli.
4. Kök Türk alanı güncellenmeli. 5. Taşta rune sütunu görünmeli.

## Uzun kelime

`ENES`, `TÜRKİYE`, `AZERBAYCAN`, `TÜRKDEVLETLERİ`, `TÜRKDEVLETLERİTEŞKİLATI` yazılır.
Taşta 1 → 2 → 3 → 4 sütun geçişleri doğru yapılmalı, hiçbir işaret taşın dışına
çıkmamalıdır.

## Kamera

1. `KAMERAYI BAŞLAT`. 2. Görüntü görünmeli. 3. Model `Model hazır` durumuna geçmeli.
4. El gösterildiğinde landmark iskeleti çizilmeli. 5. İmleç işaret parmağını takip
etmeli.

## Pinch

1. Harfin üzerine gel, pinch yapma — harf yazılmamalı. 2. Parmakları birleştir — harf
bir kez yazılmalı. 3. Birleşik tut — aynı harf tekrar yazılmamalı. 4. Ayır ve tekrar
pinch yap — yeni seçim olmalı.

## Yanlış tuş testi

1. Bir tuş üzerinde pinch başlat. 2. Pinch kapanmadan elini yan tuşa kaydır.
3. Yanlış harf basılmamalıdır.

## Ülke seremonisi

Sekiz düğmenin her biri seçilir; ülkeye özel renk, mühür, geometrik motif, dalgalanan
bayrak ve karşılama metni güncellenmelidir.

## Hatıra kartı

1. Metin yaz. 2. E-posta gir. 3. Kartı aç — tören oynamalı, runeler tek tek kazınmalı,
çatlaklar kademeli ilerlemeli, yıldız seçilen ülke kümesine uçmalı. 4. Latin ve Kök Türk
metni doğru olmalı. 5. Taş sütunları doğru olmalı. 6. İz No ve tamga görünmeli.
7. QR oluşmalı. 8. PNG indirilebilmeli ve ekrandaki kartla tutarlı olmalı.

## QR doğrulaması

Üretilen QR bağımsız bir çözücüyle okunup giriş metniyle karşılaştırılır. Türkçe
karakter içeren bir e-posta adresi (`ömer@şirket.com` gibi) ile de denenir; `ş` ve `ö`
bozulmadan çözülmelidir.

## Çevrimdışı doğrulaması

Ağ bağlantısı kesilip sayfa yenilenir. Yazı tipleri, QR, kamera/el takibi ve kart PNG
üretimi çalışmaya devam etmelidir; yalnızca gerçek e-posta gönderimi başarısız olur.
Tarayıcı konsolunda `localhost` dışına giden istek görünmemelidir.

## E-posta akışı

`.env` içinde `KOKIZ_MOCK_EMAIL=true` ile `/api/saglik` yanıtında `epostaHazir: true` ve
`testModu: true` doğrulanır, arayüzde test gönderiminin tamamlandığı görülür. Ardından
gerçek Resend değerleriyle `KOKIZ_MOCK_EMAIL=false` yapılıp yalnızca kendi adresinize
gerçek gönderim denenir.

## Ortak Hafıza

Gökyüzü açılır; her ülke çemberinin bayrak mührü, izlerin renkli kümelere ayrılması ve
aktif kümelerin bağlanması kontrol edilir. Sayfa yenilendiğinde gökyüzü sıfırlanmalı,
`.env` ve diğer dosyalar etkilenmemelidir.

---

# 26. DEĞİŞİKLİK YAPARKEN KURALLAR

Mevcut çalışan özellikler silinmez. Şunlar regresyona uğramamalıdır:

kamera · MediaPipe · el landmark çizimi · işaret parmağı imleci · pinch · sanal klavye ·
fiziksel klavye · 24 karakter sınırı · Kök Türk dönüşümü · dinamik kitabe sütunları ·
ülke seçimi ve seremonisi · taş işleme töreni · hatıra kartı · kişisel tamga · QR ·
PNG indirme · Web Share · e-posta teslimi · Ortak Hafıza Göğü · ses · tam ekran

Kod düzeni:

- Türkçe fonksiyon ve değişken adlandırma düzeni korunur.
- Tasarım düzenlemelerinde mevcut DOM ID'leri korunmaya çalışılır. ID değiştirmek
  gerekiyorsa `app.js` tarafı aynı değişiklikte güncellenir.
- Yeni harici paket veya görsel bağımlılığı eklenmez; efektler mevcut
  HTML/CSS/Canvas/Web Audio altyapısında kalır.
- `vendor/` içeriği elle düzenlenmez. Sürüm yükseltmesi yapılırsa dosya yeniden
  indirilir, SHA-256 özeti `vendor/README.md` içinde güncellenir ve
  `npm run vendor:check` ile doğrulanır.
- Kod değişikliği istendiğinde yarım parça verilmez; değişen dosyaların tam ve çalışır
  hali sağlanır.

Etkinlikte demo edileceği için öncelik sırası: 1) çalışması, 2) kamera/pinch
güvenilirliği, 3) ekrana sığması, 4) tasarım etkisi, 5) hatıra kartının kalitesi,
6) kod temizliği.

---

# 27. SÜRÜM GEÇMİŞİ

| Sürüm | Değişiklik |
| --- | --- |
| v3.0.0 | Node.js backend'i ve Resend ile gerçek e-posta teslimi. |
| v3.1.0 | Unicode Orhon repertuvarı; kalın/ince ünlü uyumu ve birleşik işaretler. |
| v4.0.1 | Sinematik taş işleme töreni; Canvas 2D ve Web Audio katmanı. |
| v4.1.0 | Sabit `1440 × 960` kart yüzeyi, dört ölçek kademesi, kamera kesilme algısı. |
| v4.1.1 | Mobil klavyenin 320–760 px aralığında akışkan ölçeklenmesi. |
| v4.1.2 | Mobil önizleme ile dışa aktarılan kartın aynı `3:2` oranını koruması. |
| v5.0.0 | Ortak Hafıza Göğü ve deterministik kişisel tamga. |
| v5.1.0 | Sekiz kök coğrafya; ülke kümeleri ve kart mührü. |
| v5.2.0 | Kök coğrafya karşılama seremonisi ve kişisel yıldız uçuşu. |
| v5.3.0 | Özgün bayrakların proje içine alınması ve CSS ile dalgalandırılması. |
| v5.3.1 | Gökyüzü ülke çemberlerinde dairesel bayrak mühürleri. |
| v5.4.0 | Oturumluk Ortak Hafıza; `pagehide`, sinyal ve açılış sıfırlaması. |
| v5.5.0 | Güçlendirilmiş taş işleme: konumsal kıvılcım, kademeli çatlak, enerji dalgası. |
| v5.6.0 | Çevrimdışı kiosk: bütün bağımlılıklar `vendor/` altına alındı. Yol denetimi açığı kapatıldı, iç belge web'den engellendi, gönderim sınırı 20'ye çıktı. |
| v5.7.0 | GPL-3.0 lisanslı QRious yerine MIT lisanslı `qrcode-generator`. Kullanılmayan `design-reference.png` kaldırıldı. |
| v5.7.1 | Bu belge geliştirme promptundan teknik şartnameye çevrildi. |

---

# 28. BİLİNEN BOŞLUKLAR

Şartnamenin erken sürümlerinde tanımlanan ama uygulanmayan tek öğe, ana sahnenin sağ
kolonunda planlanan **"Söz" panelidir** (bir metin havuzundan seçilen kültürel
aforizmaları gösteren altın çerçeveli HUD paneli). O alan kamera HUD paneline
ayrılmıştır ve kamera deneyimin merkezinde olduğu için orada kalması gerekir.

Söz paneli ileride istenirse hatıra kartının orta katmanına veya üst sahneye
eklenebilir; mevcut düzende ana sahnede yeri yoktur.
