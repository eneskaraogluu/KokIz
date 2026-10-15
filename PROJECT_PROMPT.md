# KÖKİZ PROJESİ İÇİN DETAYLI GELİŞTİRME PROMPTU

Sen kıdemli bir frontend geliştiricisi, yaratıcı etkileşim tasarımcısı ve gerçek zamanlı bilgisayarlı görü entegrasyon mühendisisin. Elindeki proje **KÖKİZ · Etkileşimli Türk Yazı Duvarı** adlı, fiziksel bir etkinlikte büyük ekranda/stand ekranında kullanılacak interaktif bir web deneyimidir.

Bu projeyi geliştirirken sıradan bir web sitesi gibi davranma. Bu bir **sergi enstalasyonu / dijital kültür deneyimi / temassız etkileşimli kiosk** olarak tasarlanıyor.

## 1. PROJENİN BAĞLAMI

Etkinlik:
- Türk Devletleri Teşkilatı
- Tarih: 29-30 Ekim 2026
- Yer: Ankara

Proje adı:
- KÖKİZ
- Alt başlık: ETKİLEŞİMLİ TÜRK YAZI DUVARI

Ana fikir:
Katılımcı kameranın karşısına geçer. Sistem elini gerçek zamanlı olarak algılar. İşaret parmağı ekranda bir sanal imleç gibi hareket eder. Kullanıcı sanal Türkçe klavyedeki bir harfin üzerine gelir ve harfi seçmek için **başparmak ile işaret parmağını birbirine yaklaştırıp pinch hareketi yapar**.

Seçilen Latin harfleri ekranda bir isim/kelime oluşturur. Aynı anda bu metnin yaklaşık Kök Türk/Eski Türk harf karşılığı gösterilir ve merkezdeki dijital Orhun kitabesinin üzerine ışıklı rune/harfler halinde işlenir.

Deneyimin sonunda kullanıcı kendisine özel bir **dijital hatıra kartı** oluşturabilir. Hatıra kartı:
- kullanıcının Latin metnini,
- Kök Türk karşılığını,
- dijital Orhun taşını,
- etkinlik bilgilerini,
- kişiye özel İz No bilgisini,
- QR kodunu,
- kültürel ve sürreal tasarım öğelerini

bir araya getirir.

Kart PNG olarak indirilebilir ve destekleyen cihazlarda Web Share API ile paylaşılabilir.

---

# Ortak Hafıza Göğü ve kişisel tamga · v5.0.0

- Her ad için harf dizisinden deterministik, geometrik ve Canvas tabanlı kişisel tamga üret.
- Tamgayı hatıra kartındaki dijital iz paneline dahil et; PNG ve e-posta gövdesindeki kartta aynen görünmesini sağla.
- Üst menüde ve kart modalında `ORTAK HAFIZA` erişimi sun.
- Tam ekran gökyüzünde anonim izleri turkuaz/altın ışıklar, yakın izleri ise ince bağlantı çizgileriyle göster.
- Son iz nabızla vurgulansın; ziyaretçi ışığın üzerinde durduğunda iz numarası ve tamga görünür olsun.
- Backend yalnızca rastgele kayıt kimliği, iz numarası, tamga kodu ve sunucu zamanını kalıcı tutar. İsim, e-posta, kamera görüntüsü ve kart PNG'si koleksiyona yazılmaz.
- Kayıt dosyası Git dışında ve statik web erişimine kapalı olmalıdır. Aynı kayıt kimliğini çoğaltma ve aşırı istekler engellenmelidir.
- Efektler mevcut HTML/CSS/Canvas mimarisinde kalmalı; yeni harici paket veya görsel bağımlılığı eklenmemelidir.

---

# 2. EN ÖNEMLİ TASARIM REFERANSI

Projenin ana sanat yönü `assets/design-reference.png` görseliyle belirlenmişti.

Bu dosya v5.7.0'da çalışma ağacından kaldırıldı; kodda hiç kullanılmıyordu ve 2.8 MB
yer tutuyordu. Görsel git geçmişinde duruyor, gerektiğinde geri alınabilir:

```powershell
git show 333d95e:assets/design-reference.png > design-reference.png
```

Sanat yönünün bağlayıcı tanımı artık `styles.css` ile aşağıdaki maddelerdir.

Tasarım dili şu özellikleri korumalı:

- Derin zümrüt yeşili, koyu petrol, turkuaz ve altın renk paleti.
- Siyah ve boş bir arayüz görünümü kesinlikle olmamalı.
- Antik Türk kültürü ile ileri teknoloji aynı dünyadaymış gibi görünmeli.
- Merkezde anıtsal bir Orhun taşı / monolit.
- Monolitin çevresinde ışıklı turkuaz ve altın halkalar.
- Kozmik gökyüzü, yıldız parçacıkları ve aurora hissi.
- Bozkır ufku ve uzak taş sütunlar.
- Türk/tamga/geometrik motiflerinden türetilmiş ince dekorasyonlar.
- Altın çizgili HUD panelleri.
- Lüks sergi/enstalasyon hissi.
- Hafif holografik parlamalar.
- Veri akışlarını çağrıştıran ince ışık çizgileri.
- Dijital ama oyun arayüzü gibi değil; kültür-sanat enstalasyonu gibi.
- Tasarım canlı, katmanlı, etkileyici ve fotoğraf çekilecek kadar güçlü olmalı.

ÖNEMLİ:
Referans görseli yalnızca arka plan resmi olarak kullanıp üstüne HTML koyma. Tasarımı mümkün olduğunca HTML/CSS katmanlarıyla üret. Böylece dinamik kullanıcı verileri tasarımla doğal biçimde bütünleşsin.

---

# 3. TEKNOLOJİ YIĞINI

Uygulama v3.0.0'dan beri Node.js backend'i ile çalışır (`server.js`).

Kullanılan yapı:
- HTML5
- CSS3
- Vanilla JavaScript
- MediaPipe Tasks Vision 0.10.35
- HandLandmarker
- qrcode-generator 2.0.4 (MIT)
- html2canvas 1.4.1
- Web Share API
- Fullscreen API
- Clipboard API
- getUserMedia

Python uygulamanın çalışma mantığında kullanılmıyor ve projeyi açmak için de
kullanılamaz: `py -m http.server` statik dosyaları sunar ama `/api/*` uçlarını
çalıştıramaz, dolayısıyla e-posta teslimi ve Ortak Hafıza çalışmaz.

Uygulama Node.js ile başlatılır:

`npm start`

Uygulama:
`http://localhost:5500`

adresinden çalıştırılır.

Kamera erişimi localhost üzerinde çalışır.

---

# 4. DOSYA YAPISI

Ana yapıyı mümkün olduğunca basit tut:

KokIz/
- index.html
- styles.css
- app.js
- server.js
- package.json
- .env.example
- README.md
- PROJECT_PROMPT.md
- VERSION.txt
- baslat.bat
- baslat.ps1
- assets/
  - tdt-logo.png
  - flags/
- vendor/
  - mediapipe/
  - models/
  - fonts/
  - qrcode-generator.js
  - qrcode-generator-utf8.js
  - html2canvas.min.js

Yeni bir framework eklemek için güçlü bir neden yoksa React/Vue/Next.js gibi frameworklere geçme.

---

# 5. ANA EKRANIN MİMARİSİ

Uygulama tam ekranda çalışacak şekilde tasarlanmalıdır.

Ana ekran üç yatay katmana ayrılır.

## Katman A: Kurumsal üst sahne

Burada:
- Türk Devletleri Teşkilatı logosu
- TÜRK DEVLETLERİ TEŞKİLATI başlığı
- 29-30 EKİM 2026
- KÖKİZ · ETKİLEŞİMLİ TÜRK YAZI DUVARI
- ana QR
- tam ekran düğmesi

yer alır.

Logo sıradan biçimde köşeye yerleştirilmemeli.
Logonun çevresinde:
- konsantrik halkalar,
- ışıklı ince çizgiler,
- küçük Kök Türk runeleri,
- altın/turkuaz parlamalar

bulunmalıdır.

---

## Katman B: Ana sürreal sahne

Bu ekran deneyimin kalbidir.

### Sol bölüm
Kullanıcının canlı metni bulunur.

Göster:
- LATİN ALFABESİ
- kullanıcının yazdığı isim/kelime
- KÖK TÜRK YAZISI
- yaklaşık dönüşüm
- 0/24 karakter sayacı

Kullanıcı yazdıkça metin anında güncellenmelidir.

Uzun metin taşmamalıdır. Gerekirse `clamp()`, dinamik font küçültme veya satır yönetimi uygulanmalıdır.

### Orta bölüm
Merkezde dev bir dijital Orhun kitabesi bulunur.

Bu monolit:
- karanlık taş dokulu,
- altın rune ışıklı,
- çevresinde turkuaz hologram halkaları bulunan,
- altındaki platform halkalarında hafif ışık olan,
- antik ve bilimkurgu estetiğini birleştiren

bir yapıda olmalıdır.

Kullanıcının Kök Türk yazısı taşın üzerine dikey sütunlarla yazılır.

Sütun sistemi:
- 1-6 karakter: 1 sütun
- 7-12 karakter: 2 sütun
- 13-18 karakter: 3 sütun
- 19-24 karakter: 4 sütun

Amaç uzun kelimeleri tek satırda küçücük yapmak değildir. Uzun yazı geldikçe taş gerçek kitabe hissi verecek biçimde dolmalıdır.

Sütunlar sağdan sola görsel akış göstermelidir.

### Sağ bölüm
Referans görselindeki gibi estetik bir "Söz" paneli bulunur.

Metin havuzundan seçilen sözlerden biri gösterilir:

- Bir isim değişir, kök aynı kalır.
- Yazı değişir, hafıza kalır.
- Geçmişin izi, bugünün sözü olur.
- Bir harf, bin yıllık bir yankıdır.

Panel:
- altın çerçeveli,
- kültürel mühür/tamga detaylı,
- cam/HUD hissi taşıyan,
- ancak okunabilir

olmalıdır.

---

# 6. KAMERA VE GÖRÜNTÜ İŞLEME

Kamera tasarımdan kopuk, büyük beyaz bir kutu gibi görünmemelidir.

Ana sürreal sahneye entegre küçük fakat net bir HUD paneli olmalıdır.

Kamera panelinde:
- canlı webcam görüntüsü,
- MediaPipe el iskeleti,
- kamera durum göstergesi,
- algılanan el sayısı,
- mevcut hedef,
- pinch yüzdesi,
- model durumu,
- el algılama durumu

görülmelidir.

Kamera görüntüsü aynalıdır:
`transform: scaleX(-1)`

Canvas da aynı şekilde aynalanmalıdır.

Kamera:
`navigator.mediaDevices.getUserMedia()`

ile açılmalıdır.

Tercih edilen kamera:
`facingMode: "user"`

İdeal çözünürlük:
1280x720.

Hata durumları kullanıcıya anlaşılır Türkçe mesajla verilmelidir:
- NotAllowedError → Kamera izni verilmedi
- NotReadableError → Kamera başka uygulama tarafından kullanılıyor
- NotFoundError → Kamera bulunamadı

Kamera durdurulduğunda video trackleri mutlaka `stop()` ile kapatılmalıdır.

---

# 7. MEDIAPIPE

Kullanılan paket:

`@mediapipe/tasks-vision@0.10.35`

Paket v5.6.0'dan beri CDN'den değil proje içinden yüklenir (bkz. `vendor/README.md`):

JavaScript:
`/vendor/mediapipe/vision_bundle.mjs`

WASM:
`/vendor/mediapipe/wasm`

Model:
`/vendor/models/hand_landmarker.task`

HandLandmarker ayarları yaklaşık:
- runningMode: VIDEO
- numHands: 1
- minHandDetectionConfidence: 0.62
- minHandPresenceConfidence: 0.62
- minTrackingConfidence: 0.62

Model tekrar tekrar yüklenmemeli. Promise/cache mantığı korunmalıdır.

---

# 8. SANAL İMLEÇ

MediaPipe landmark 8:
- işaret parmağı ucu

Sanal imlecin konumunu belirler.

Kamera aynalı olduğu için X koordinatı ekran koordinatına çevrilirken terslenir.

İmleç doğrudan ham koordinata bağlanmamalı.
Titremeyi azaltmak için smoothing uygulanmalıdır.

Mevcut yaklaşım:
- birkaç karelik geçmiş tutulur
- ortalama nokta hesaplanır
- ekranda lerp benzeri yumuşatma yapılır

`imlecYumusatmaOrani` yaklaşık 0.34.

Kamera kenarlarında ölü alan bırak:
`kameraKenarPayi ≈ 0.10`

Böylece kullanıcının elini kameranın en uç noktalarına götürmeden ekranın tamamına ulaşması sağlanır.

---

# 9. PINCH İLE HARF SEÇİMİ

Eski hover/dwell sistemi kullanılmamalıdır.

Kullanıcı bir harfe gitmek için beklemek zorunda değildir.

Seçim hareketi:

başparmak ucu landmark 4
+
işaret parmağı ucu landmark 8

birbirine yaklaştığında yapılır.

Pinch mesafesi doğrudan piksel olarak ölçülmemelidir çünkü el kameraya yaklaşıp uzaklaşır.

Normalize et:

`distance(thumbTip, indexTip) / distance(wrist, middleMCP)`

Yaklaşık eşikler:
- pinch başlama: 0.27
- bırakma: 0.40

İki farklı eşik kullanılmasının amacı hysteresis oluşturarak yanlış çift tıklamaları azaltmaktır.

Ayrıca:
- pinch mesafesini birkaç kare üzerinden yumuşat
- cooldown yaklaşık 250 ms
- hedef yaklaşık 100 ms kararlı olmalı
- pinch başladığı hedef ile seçimin gerçekleştiği hedef aynı olmalı

Bu son kural çok önemlidir.
Pinch sırasında imleç başka harfe kayarsa yanlış tuş basılmamalıdır.

Bir pinch hareketi yalnızca bir kez seçim üretmelidir.

---

# 10. TEMASSIZ KLAVYE

Türkçe sanal klavye:

1. satır:
Q W E R T Y U I O P Ğ Ü

2. satır:
A S D F G H J K L Ş İ

3. satır:
Z X C V B N M Ö Ç

Her tuşta:
- büyük Latin harf
- altında küçük Kök Türk karşılığı

gösterilir.

Ayrıca:
- Sil
- Boşluk
- Temizle
- Kök Türk yazısını kopyala
- E-posta alanı
- Hatıra Kartını Oluştur

kontrolleri bulunur.

Fiziksel klavye de çalışmalıdır.

Fiziksel klavye:
- Backspace → sil
- Space → boşluk
- Delete → temizle
- Türkçe/Latin harf → metne ekle
- Escape → açık hatıra kartını kapat

E-posta inputu focus halindeyken fiziksel klavye eventleri KÖKİZ metnine harf eklememelidir.

---

# 11. KÖK TÜRK DÖNÜŞÜMÜ

Mevcut dönüşüm tarihsel olarak tam dilbilimsel transliterasyon iddiasında değildir.

Bu bir görsel/etkileşimli prototip eşlemesidir.

Mevcut harita korunmalıdır:

A 𐰀
B 𐰉
C/Ç 𐰲
D 𐰑
E 𐰅
F 𐰯
G 𐰏
Ğ 𐰍
H 𐰴
I/İ 𐰃
J/Y 𐰖
K 𐰚
L 𐰠
M 𐰢
N 𐰤
O/U 𐰆
Ö 𐰇
Ü 𐰈
P 𐰯
Q/X 𐰴
R 𐰼
S 𐰾
Ş 𐱁
T 𐱅
V/W 𐰉
Z 𐰔
Space ·

Kodda bunu "historically exact" olarak tanıtma.

Daha sonra akademik doğrulama yapılabilecek şekilde harita kolay değiştirilebilir kalmalıdır.

---

# 12. HATIRA KARTI

Hatıra kartı projenin en önemli "wow" çıktılarından biridir.

Ana sitenin sıradan ekran görüntüsü gibi görünmemeli.

Referans görseldeki premium kültürel poster hissini taşımalıdır.

Kart 3 yatay katmandan oluşur.

## Üst katman
- TDT logosu
- TÜRK DEVLETLERİ TEŞKİLATI
- 29-30 EKİM 2026
- KÖKİZ · ETKİLEŞİMLİ TÜRK YAZI DUVARI
- kişiye özel QR
- Kök Türk rune detayları
- altın/turkuaz ışık çizgileri

## Orta katman
- sol: Latin isim
- altında Kök Türk yazısı
- merkez: büyük dijital Orhun monoliti
- kullanıcının runeleri taş üzerinde
- holografik halkalar
- bozkır/kozmik atmosfer
- sağ: Söz paneli

## Alt katman
Üç premium bilgi kartı:
1. ETKİNLİK
   - 29-30 Ekim 2026 · Ankara

2. İZ NO
   - KIZ-xxxx

3. MAIL QR
   - kullanıcı e-postası veya Genel QR

İz numarası kullanıcının metninden deterministik üretilebilir.

Kartın tasarım oranı:
1536 x 1024 hissinde 3:2'ye yakın yatay poster.

---

# 13. QR MANTIĞI

MIT lisanslı `qrcode-generator` 2.0.4 kullanılır. Kütüphane yalnızca modül matrisi
ürettiği için Canvas 2D çizimi `qrOlustur()` içinde yapılır.

Mevcut frontend sürümünde QR doğrudan sunucudan mail göndermez.

QR içeriği `mailto:` bağlantısıdır.

QR okutulduğunda:
- ilgili e-posta adresi,
- konu,
- KÖKİZ metni,
- Kök Türk karşılığı,
- etkinlik bilgisi,
- İz No

hazır mail taslağı olarak açılır.

E-posta girilmemişse genel `mailto:` taslağı açılır.

ÖNEMLİ:
"QR okutulunca otomatik olarak mail gönderilir" gibi yanlış bir davranış/iddia oluşturma.

Gerçek otomatik mail sistemi istenirse bunun backend gerektirdiğini belirt.

---

# 14. PNG İNDİRME

Hatıra kartı `html2canvas` ile DOM üzerinden PNG'ye dönüştürülür.

Amaç:
ekrandaki kart ve indirilen kart mümkün olduğunca aynı görünsün.

Kullan:
- scale: 2
- useCORS: true
- backgroundColor uygun koyu renk
- logging: false

PNG dosya adı örneği:
`ENES_KOKIZ_Hatira.png`

---

# 15. PAYLAŞIM

Web Share API kullanılabilir.

Destekleyen cihazlarda PNG File nesnesi paylaşılmalıdır.

Desteklemeyen masaüstü tarayıcılarda uygulama çökmemeli.
Kullanıcıya kısa mesaj verilmelidir.

---

# 16. FULLSCREEN

Etkinlikte kiosk/sergi deneyimi için tam ekran önemlidir.

Fullscreen API kullanılmalıdır.

Buton metni duruma göre:
- ⛶ TAM EKRAN
- × TAM EKRANDAN ÇIK

olarak güncellensin.

---

# 17. RESPONSIVE / EKRANA SIĞMA

Ana hedef ekranlar:
- 1920x1080
- 1600x900
- 1366x768

Özellikle 1366x768 laptop ekranında sayfa mümkün olduğunca scroll istemeden çalışmalıdır.

Ana ekran için yaklaşık:
- üst kurumsal: %23-25
- orta deneyim: %50
- alt klavye: %25-27

kullanılabilir.

CSS'te:
- `clamp()`
- `vw`
- `vh`
- `minmax()`
- grid
- media query

kullan.

Ama küçük ekran uyumu yaparken büyük ekran tasarımının anıtsallığını bozma.

---

# 18. PERFORMANS

Etkinlikte uzun süre açık kalacak.

Bu yüzden:
- her animasyon frame'inde gereksiz DOM oluşturma
- MediaPipe modelini tekrar yükleme
- birden çok RAF loop başlatma
- stop edilmiş kameranın tracklerini açık bırakma
- her el karesinde ağır görsel render etme

gibi hatalardan kaçın.

MediaPipe analizi yaklaşık 40 ms aralıkla sınırlandırılabilir.

Dekoratif CSS animasyonları mümkün olduğunca transform/opacity ağırlıklı olmalıdır.

---

# 19. TASARIMDA YAPILMAMASI GEREKENLER

- Arayüzü sade siyah kutulara dönüştürme.
- Bootstrap dashboard gibi tasarlama.
- Çok sayıda düz gri kart kullanma.
- Tasarımı kurumsal PowerPoint görünümüne sokma.
- Kamerayı sayfanın başka bölümüne taşıyıp kullanıcıyı scroll ettirme.
- Harf seçiminde dwell/bekleme sistemine geri dönme.
- Pinch sırasında hedef değişmişse yanlış tuşa basma.
- Kök Türk yazısını uzun metinde tek satıra ezme.
- Monoliti küçük dekoratif ikon haline getirme.
- Referans görseldeki sürreal atmosferi kaybetme.
- Neon cyberpunk tasarımı aşırıya kaçırıp Türk kültürünü görünmez hale getirme.
- Tarihsel olarak doğrulanmamış harita için akademik doğruluk iddia etme.
- QR'ın otomatik mail gönderdiğini iddia etme.

---

# 20. TEST SENARYOLARI

Her değişiklikten sonra şu testleri yap:

## Temel yazma
1. Uygulamayı aç.
2. Fiziksel klavyeden ENES yaz.
3. Latin alanında ENES görünmeli.
4. Kök Türk alanı güncellenmeli.
5. Orhun taşı üzerinde rune sütunu görünmeli.

## Uzun kelime
Şunları test et:
- ENES
- TÜRKİYE
- AZERBAYCAN
- TÜRKDEVLETLERİ
- TÜRKDEVLETLERİTEŞKİLATI

Taşta:
- 1
- 2
- 3
- 4

sütun geçişleri doğru yapılmalı.

Hiçbir rune taşın dışına çıkmamalı.

## Kamera
1. Kamera Başlat.
2. Webcam görüntüsü görünmeli.
3. Model hazır durumuna geçmeli.
4. El gösterildiğinde landmark iskeleti çizilmeli.
5. İmleç işaret parmağını takip etmeli.

## Pinch
1. Harfin üzerine gel.
2. Pinch yapma.
3. Harf yazılmamalı.
4. Baş ve işaret parmağını birleştir.
5. Harf bir kez yazılmalı.
6. Parmaklar birleşik tutulduğunda aynı harf sürekli yazılmamalı.
7. Parmakları ayır ve tekrar pinch yap.
8. Yeni seçim yapılmalı.

## Yanlış tuş testi
1. Bir tuş üzerinde pinch başlat.
2. Pinch kapanmadan elini yan tuşa kaydır.
3. Yanlış yeni harf basılmamalı.

## Hatıra kartı
1. Metin yaz.
2. E-posta gir.
3. Hatıra kartını aç.
4. Latin metni doğru olmalı.
5. Kök Türk metni doğru olmalı.
6. Taş sütunları doğru olmalı.
7. İz No görünmeli.
8. QR oluşmalı.
9. PNG indirilebilmeli.
10. PNG tasarımı ekrandaki kartla tutarlı olmalı.

---

# 21. ÇALIŞTIRMA

Windows PowerShell:

```powershell
cd "PROJE_KLASORU"
npm start
```

Chrome:

`http://localhost:5500`

Cache sorunu olursa:

`Ctrl + Shift + R`

Alternatif olarak:
- `baslat.bat`
- `baslat.ps1`

kullanılabilir.

---

# 22. GELİŞTİRME HEDEFİ

Bu projeyi geliştirirken asıl amaç sadece çalışan bir form üretmek değildir.

Ziyaretçinin yaşayacağı akış şu hissi vermeli:

1. Kameranın karşısına geçer.
2. Eli sistem tarafından tanınır.
3. İşaret parmağıyla dijital dünyaya dokunuyormuş gibi hareket eder.
4. Pinch ile kendi adını yazar.
5. Adının bin yıllık başka bir yazı sistemindeki karşılığını görür.
6. Merkezdeki anıtsal taş, harfleri ışıkla üzerine işler.
7. Dijital bozkır ve holografik halkalar deneyime tepki verir.
8. Kullanıcı sonunda kendi kişisel "izini" bir hatıra kartına dönüştürür.
9. Kartı telefonuna taşır veya paylaşır.

Bu yüzden her tasarım/geliştirme kararında şu soruyu sor:

**"Bu değişiklik KÖKİZ'i sıradan bir web sayfasından çıkarıp fiziksel etkinlikte insanları durdurup baktıracak bir dijital kültür deneyimine dönüştürüyor mu?"**

Cevap hayırsa tasarımı sadeleştirmek yerine deneyimle daha iyi bütünleştir.

---

# 23. MEVCUT KODU DEĞİŞTİRİRKEN KURAL

Mevcut çalışan özellikleri silme.

Özellikle şunlar regresyona uğramamalı:
- kamera
- MediaPipe
- el landmark çizimi
- işaret parmağı imleci
- pinch
- sanal klavye
- fiziksel klavye
- 24 karakter sınırı
- Kök Türk dönüşümü
- dinamik kitabe sütunları
- QR
- hatıra modalı
- PNG indirme
- Web Share
- tam ekran

Bir tasarım düzenlemesi yapıyorsan önce mevcut JavaScript DOM ID'lerini korumaya çalış.

ID değiştirmek zorundaysan app.js tarafını aynı değişiklikte güncelle.

---

# 24. ÇIKTI BEKLENTİSİ

Kod değişikliği istendiğinde:
- yarım snippet verme,
- "şu satırın altına ekle" mantığıyla bırakma,
- değişen dosyaların tam ve çalışır halini sağla.

Kod okunabilir ve Türkçe fonksiyon/ID adlandırma sistemini mümkün olduğunca korusun.

Proje etkinlikte demo edileceği için öncelik sırası:

1. Çalışması
2. Kamera/pinch güvenilirliği
3. Ekrana sığması
4. Tasarım etkisi
5. Hatıra kartının kalitesi
6. Kod temizliği

Bu bağlamı kaybetmeden projeyi geliştir.
# Backend entegrasyonu · v3.0.0

Bu sürümde projenin birincil teslim özelliği, ziyaretçinin oluşturduğu hatıra kartının girdiği e-posta adresine gerçek PNG eki olarak gönderilmesidir.

- Arayüz `html2canvas` ile hatıra kartını yüksek çözünürlüklü PNG'ye dönüştürür.
- `POST /api/hatira-gonder` isteği e-posta adresini, kart metnini, iz numarasını ve PNG verisini Node.js backend'ine aktarır.
- Backend girdiyi doğrular, hız sınırı uygular ve Resend API üzerinden gönderir.
- API anahtarı yalnızca `.env` içinde sunucuda bulunur; tarayıcı JavaScript'ine yazılmaz.
- E-posta adresi ve PNG kalıcı depolamaya alınmaz, veritabanına yazılmaz ve uygulama günlüklerine eklenmez.
- `.env` hazırlanana kadar gönderim düğmesi devre dışı kalır; `KOKIZ_MOCK_EMAIL=true` yalnızca yerel kabul testi içindir.
- QR, gerçek e-posta gönderiminin yerine geçmez; ikincil etkinlik bağlantısı/cihaz etkileşimi olarak değerlendirilir.

---

# Unicode tabanlı Orhon yazısı · v3.1.0

Kök Türk alanı artık Orhon ve Yenisey karakterlerini karıştıran birebir Latin harf tablosunu kullanmaz. Unicode `U+10C00–U+10C4F` Orhon repertuvarı temel alınır; kalın/ince ünlü sınıfı ünsüz biçimini belirler ve tarihî birleşik işaretler desteklenir. Yatay metin sağdan sola; taş düzeni yukarıdan aşağı ve sütunlar sağdan sola okunur.

Modern kişi adlarının tarihî Eski Türkçe karşılığı kesin olarak üretilemeyeceği için kullanıcıya gösterilen ifade “Unicode Orhon işaretleriyle fonetik ad uyarlaması”dır. Tarihî çeviri veya akademik transkripsiyon iddiası kullanılmaz.

Kaynaklar:

- Unicode Old Turkic karakter çizelgesi: https://www.unicode.org/charts/PDF/U10C00.pdf
- Unicode Standardı 14.8 Old Turkic: https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-14/

---

# Sinematik deneyim katmanı · v4.0.1

Hatıra kartı komutu artık kartı anında açmaz. Önce tam ekran dijital taş işleme töreni çalışır: Orhon işaretleri taşa sırayla vurulur, altın/turkuaz parçacıklar yayılır, kişisel iz numarası mühürlenir ve kart perspektifli ışık geçişiyle görünür.

- Efektler yalnızca Canvas 2D, CSS ve Web Audio API kullanır; yeni harici paket veya ses dosyası yoktur.
- Web Audio bağlamı ilk doğrudan kullanıcı etkileşiminde `resume()` tamamlanana kadar beklenerek açılır; ses düğmesi yeniden açıldığında işitsel test melodisi verir.

# Etkinlik dayanıklılığı · v4.1.0

- PNG ve e-posta kartı her cihazda aynı `1440 × 960` çalışma yüzeyinden, `3:2` oranında üretilir.
- Uzun adlar dört ölçek kademesiyle düzenlenir; taşın alt yazısı kelimeleri ayrı satırlara dağıtır.
- Kamera akışı işletim sistemi veya cihaz tarafından sonlandırılırsa arayüz bunu algılar, yanlış “canlı” durumunda kalmaz ve yeniden başlatma yönlendirmesi sunar.
- Mobil klavyenin on iki tuşlu en geniş satırı 320–760 px aralığında ekran genişliğine göre hesaplanır; yatay sayfa taşması engellenir (v4.1.1).
- Mobil kart önizlemesi ile dışa aktarılan kart aynı `3:2` oranını korur (v4.1.2).
- Ses kullanıcı tarafından üst menüden kapatılabilir.
- `TÖRENİ ATLA` ve `Escape` erişilebilir hızlı geçiş sağlar.
- `prefers-reduced-motion` etkinse tören otomatik atlanır.
- Kamera imleci turkuaz enerji izi bırakır; pinch sırasında iz altına dönüşür.
- Tören, PNG kart üretimi veya e-posta içeriğine dahil edilmez; tamamlandıktan sonra temizlenmiş statik hatıra kartı üretilir.

---

# Türk dünyası katmanı · v5.1.0

Ziyaretçi ismini yazmadan önce Türkiye, Azerbaycan, Kazakistan, Kırgızistan, Özbekistan, Türkmenistan, Macaristan veya KKTC arasından kök coğrafyasını seçer.

- Seçim fare, dokunma, klavye odağı ve kamera/pinch etkileşimiyle çalışır.
- Seçilen ülke veya bölge hatıra kartında iki harfli/kısa kod ve tam ad içeren küçük bir mühür olarak görünür.
- Ortak Hafıza Göğü'nde her ülkenin ayrı ışık rengi, yörünge merkezi ve nokta deseni vardır.
- Aynı ülkeye ait yıldızlar kendi kümelerinde bağlanır; aktif ülke kümeleri altın bir ortak hafıza hattıyla birbirine ulaşır.
- Anonim koleksiyon ülke/bölgeyi yalnızca doğrulanmış kısa kod olarak saklar. İsim ve e-posta Ortak Hafıza kaydına eklenmez.
- Eski ve ülke kodu içermeyen kayıtlar geriye uyumluluk için Türkiye kümesinde gösterilir.
- E-posta özeti ve QR metni seçilen kök coğrafyayı içerir; PNG kartın üzerindeki mühür dışa aktarıma dahildir.

---

# Kök coğrafya seremonisi · v5.2.0

Ülke/bölge seçimi, kullanıcıyı yaklaşık iki saniyelik sinematik bir karşılama katmanına geçirir. Katman seçilen ülkenin renk tonunu, kısa mührünü, adını ve diğer ülkelerden ayrılan parametrik geometrik motifini gösterir. Kamera/pinch ile yapılan seçimler de aynı seremoniyi tetikler.

Taş işleme töreni tamamlanırken kişisel yıldız merkezde doğar, ülkenin rengine dönüşür ve ışık kuyruğuyla seçilen ülkenin temsilci kümesine uçar. Varış anı ses, küme parlaması ve “ortak gökyüzüne bağlandı” mesajıyla tamamlanır; ardından hatıra kartı açılır.

- Efektler CSS, Canvas 2D ve mevcut Web Audio altyapısıyla üretilir; yeni paket veya görsel dosya eklenmez.
- Karşılama katmanı odağı değiştirmez ve işaretçi olaylarını engellemez.
- `prefers-reduced-motion` açıkken karşılama ve uçuş atlanarak hatıra kartı doğrudan hazırlanır.
- Kart PNG'si ve e-posta görseli animasyondan etkilenmez.

---

# Özgün bayrak katmanı · v5.3.0

Kök coğrafya seçildiğinde ülkenin özgün bayrağı karşılama sahnesinde dalgalanır.

- Türkiye, Azerbaycan, Kazakistan, Kırgızistan, Özbekistan, Türkmenistan, Macaristan ve KKTC bayrakları Wikimedia Commons'taki güncel özgün SVG dosyaları olarak proje içine alınır.
- Dosyalar `assets/flags/` altında yerel tutulur; etkinlik sırasında internet bağlantısı gerekmez.
- Bayrak görselinin çizimi değiştirilmez. Kumaş hareketi, perspektif, kıvrım ve ışık geçişi CSS animasyonuyla uygulanır.
- Bayrak alanının erişilebilir etiketi seçilen ülkeye göre güncellenir.
- `prefers-reduced-motion` etkin cihazlarda dalgalanma animasyonu kapatılır.
- Kaynak ve lisans sayfaları `assets/flags/README.md` içinde belgelenir.

---

# Gökyüzü bayrak mühürleri · v5.3.1

Ortak Hafıza Göğü'ndeki sekiz ülke/bölge çemberinin merkezinde ilgili özgün bayrak dairesel bir ışık mührü olarak gösterilir.

- Bayraklar mevcut `assets/flags/` dosyalarından yüklenir; yeni ağ isteği gerekmez.
- Canvas bayrağın en-boy oranını korur, çemberi dolduracak biçimde merkezden kırpar.
- Ülke rengi dış ışık halkasında, krem tonlu ince çizgi iç çerçevede kullanılır.
- Bayrak yüklenene kadar kısa ülke kodu renkli bir yedek mühür olarak gösterilir.
- Yıldızlar ve bağlantılar bayrak mühürlerinden sonra çizilerek görsel hiyerarşi korunur.

---

# Oturumluk Ortak Hafıza · v5.4.0

Ortak Hafıza Göğü kalıcı etkinlik arşivi değil, açık kiosk oturumunun canlı görselidir. Sayfa kapatıldığında veya yenilendiğinde anonim harita sıfırlanır. Sunucu normal biçimde durdurulduğunda da aynı sıfırlama uygulanır.

- Tarayıcı `pagehide` olayında `POST /api/ortak-hafiza/sifirla` isteğini öncelikle `navigator.sendBeacon` ile gönderir.
- Beacon desteklenmiyorsa `keepalive: true` kullanan kısa bir `fetch` isteği denenir.
- Geri-ileri önbelleğine alınan (`event.persisted`) sayfalarda yanlış sıfırlama yapılmaz.
- Sunucu `SIGINT` ve `SIGTERM` kapanışlarında yalnızca `ortak-hafiza.ndjson` dosyasını güvenli biçimde boşaltır.
- Windows terminalinin zorla kapanması gibi sinyalin çalışamadığı durumlara karşı sunucu her başlangıçta önceki anonim koleksiyonu sıfırlar.
- `.env`, e-posta yapılandırması, bayraklar, kartlar ve diğer proje dosyaları sıfırlama kapsamı dışındadır.
- Kapanış isteği veya sinyal çalışmasa bile sonraki sunucu başlangıcı temiz bir gökyüzüyle başlar.

---

# Güçlendirilmiş taş işleme · v5.5.0

Taşa işleme töreni, her Kök Türk işaretinin fiziksel bir darbe hissiyle ayrı ayrı kazındığı sinematik bir sahneye dönüştürülür.

- Her rune kendi taş koordinatında altın/turkuaz darbe ışığı, genişleyen halka ve konumsal Canvas kıvılcımı üretir.
- Taş, her darbede kısa ve kontrollü bir titreşim verir; uzun metinlerde parçacık yoğunluğu otomatik düşürülür.
- Işıklı çatlaklar işleme ilerlemesine göre üç kademede dallanır.
- Arka plandaki düşük yoğunluklu taş tozu tören boyunca canlı kalır.
- Final mührü taş parlaması, çatlak aydınlanması ve tüm sahneye yayılan enerji dalgasıyla tamamlanır.
- Efektler harici görsel veya yeni paket kullanmaz; CSS ve mevcut Canvas 2D/Web Audio altyapısıyla çalışır.
- `prefers-reduced-motion` etkin olduğunda tören mevcut güvenli davranışla atlanır.

---

# Çevrimdışı kiosk ve sunucu sertleştirmesi · v5.6.0

Etkinlik salonunda internet olmayabileceği için bütün üçüncü taraf bağımlılıklar proje içine alınır. Çalışma anında hiçbir harici istek yapılmaz.

- MediaPipe Tasks Vision, el takip modeli, html2canvas ve Cinzel/Inter yazı tipleri `vendor/` altında sürüme sabitlenir; kaynak, lisans ve SHA-256 kayıtları `vendor/README.md` içindedir.
- `styles.css` içindeki Google Fonts `@import`'u `vendor/fonts/fonts.css` ile değiştirilir. Yazı tipleri latin ve latin-ext alt kümeleriyle sınırlanır; Cinzel ve Inter variable font olduğu için 16 indirme 4 tekil dosyaya iner.
- `npm run vendor:check` bütün `vendor/` dosyalarının SHA-256 özetini yazar; çıktı `vendor/README.md` içindeki kayıtla birebir aynı olmalıdır.
- `vendor/` içeriği sürüme sabit olduğu için `immutable` önbelleğe alınır; uygulama dosyaları `no-cache` kalır.
- Statik sunucuda yasak dosya listesi, URL'in ilk parçası yerine `path.resolve` ile çözümlenmiş yolun her parçası üzerinden denetlenir. Önceki davranışta `/assets/..%2f.env` isteği `.env` dosyasını gövdede döndürüyordu.
- `PROJECT_PROMPT.md` iç belgesi web üzerinden sunulmaz.
- Hatıra kartı gönderim sınırı dakikada 5 yerine 20'dir; kiosk'ta bütün ziyaretçiler aynı yerel adresten geldiği için sınır ortaktır.
- Hız sınırı kayıt tablosu budanır, sürüm bilgisi tek kaynaktan (`package.json`) okunur, `baslat.ps1` sabit port yerine `.env` içindeki `PORT` değerini kullanır.
- `.env.example` depoya dahildir; `ortak-hafiza.ndjson` çalışma anında üretildiği için depoda tutulmaz.

---

# MIT lisanslı QR üretimi · v5.7.0

QR kütüphanesi lisans nedeniyle değiştirilir. Projedeki bütün bağımlılıklar MIT, Apache-2.0 veya OFL-1.1 kapsamına girer; dağıtımda kopyasol yükümlülük kalmaz.

- GPL-3.0 lisanslı QRious 4.0.2 yerine MIT lisanslı `qrcode-generator` 2.0.4 kullanılır.
- Kütüphane yalnızca modül matrisi ürettiği için Canvas 2D çizimi `qrOlustur()` içinde yapılır. Renkler (`#001b18` / `#ffffff`), boyut ve en az 14 px sessiz alan önceki görünümle aynıdır.
- `qrcode-generator-utf8.js` eklentisi zorunludur. Kütüphanenin varsayılan `stringToBytes` fonksiyonu her karakteri `c & 0xff` ile daraltır; bu durumda `ş` (U+015F) sessizce `_` (0x5F) olur ve Türkçe karakter içeren bir e-posta adresi QR içinde bozulur. Eklenti `stringToBytes`'ı UTF-8 sürümüyle değiştirir.
- İçerik en büyük QR sürümüne de sığmazsa kart boş canvas yerine "QR üretilemedi" yer tutucusu gösterir.
- Üretilen QR'lar bağımsız bir çözücüyle doğrulanmıştır: genel QR (sürüm 3) ve 302 karakterlik kişisel `mailto` QR'i (sürüm 13) giriş metniyle birebir eşit çözülür.
- Kodda kullanılmayan `assets/design-reference.png` çalışma ağacından kaldırılır. Dosya git geçmişinde kaldığı için klonlama boyutu değişmez.

---
