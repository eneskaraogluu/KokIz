# Yerel kütüphane kaynakları

Kiosk internet bağlantısı olmadan da çalışsın diye bütün üçüncü taraf bağımlılıklar
15 Ekim 2026 tarihinde sürüme sabitlenmiş biçimde indirilmiştir. Dosyalar
değiştirilmemiştir ve her biri yayıncının bildirdiği SHA-256 özetiyle doğrulanmıştır.

| Dosya | Sürüm | Lisans | Kaynak |
| --- | --- | --- | --- |
| `qrcode-generator.js` | qrcode-generator 2.0.4 | MIT | <https://cdn.jsdelivr.net/npm/qrcode-generator@2.0.4/dist/qrcode.js> |
| `qrcode-generator-utf8.js` | qrcode-generator 2.0.4 (UTF-8 eklentisi) | MIT | <https://cdn.jsdelivr.net/npm/qrcode-generator@2.0.4/dist/qrcode_UTF8.js> |
| `html2canvas.min.js` | html2canvas 1.4.1 | MIT | <https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js> |
| `mediapipe/vision_bundle.mjs` | @mediapipe/tasks-vision 0.10.35 | Apache-2.0 | <https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/vision_bundle.mjs> |
| `mediapipe/wasm/*` | @mediapipe/tasks-vision 0.10.35 | Apache-2.0 | <https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm/> |
| `models/hand_landmarker.task` | HandLandmarker float16 / 1 | Apache-2.0 | <https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task> |
| `fonts/*.woff2` | Cinzel, Inter (latin + latin-ext) | OFL-1.1 | <https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap> |

`mediapipe/wasm/` içinde yalnızca `FilesetResolver.forVisionTasks()` çağrısının
istediği dört dosya tutulur: SIMD destekli `vision_wasm_internal.{js,wasm}` ve SIMD
desteği yoksa kullanılan `vision_wasm_nosimd_internal.{js,wasm}`. Paketteki
`vision_wasm_module_internal.*` çifti yalnızca `forVisionTasks(yol, true)` çağrısında
kullanılır; bu proje tek argümanla çağırdığı için o 22 MB indirilmemiştir.

## Yazı tipleri

`styles.css` eskiden Google Fonts'tan `@import` ile Cinzel ve Inter çekiyordu; artık
`vendor/fonts/fonts.css` kullanılır. Google'ın ürettiği `@font-face` kuralları birebir
korunmuştur (ağırlık, `font-display: swap` ve `unicode-range` değerleri dahil), yalnızca
`src` adresleri yerel dosyalara çevrilmiştir.

Türkçe yalnızca latin ve latin-ext alt kümelerine ihtiyaç duyduğu için kiril, yunan ve
vietnam alt kümeleri (25 dosya) indirilmemiştir. Cinzel ve Inter variable font olduğundan
Google her ağırlık isteğinde aynı dosyayı döndürür; 16 indirmenin içinden 4 tekil dosya
kaldı (769 KB → 174 KB).

Yazı tipi yüklenemezse arayüz `Georgia, serif` ve `Segoe UI, sans-serif` yedeklerine
düşer; düzen bozulmaz ama sanat yönü belirgin biçimde değişir.

## Bütünlük doğrulaması

```powershell
npm run vendor:check
```

Beklenen çıktı:

```text
j8Jgb4rmxWn0ROE426BS2abj8GV/kDF5ZQO7uU7O1gA=  fonts/cinzel-latin-ext.woff2
CZQfscFpw4/UFFNrN2kAV/wBsxF6XGPdZXEYZUDI83A=  fonts/cinzel-latin.woff2
C0da8PPxF7iedxE2fS+8v9+HKOig9PO2nBJsuXPFSkU=  fonts/fonts.css
NLnFBMq3pz43t0Y0OkSRMuVs97VIGvLLgdx03P8lyVY=  fonts/inter-latin-ext.woff2
MQDndehhbNJhG+7PojpCY9cDdYZ4m0PwNSNqLm+9TGI=  fonts/inter-latin.woff2
6H5VB5QyLldKH9oMFUmjxw2uWpPZETQXpCkBaDjquMs=  html2canvas.min.js
VderYk+7cNzFrcSubX6pz8tWkTnT2/vysd6vy5ZrwP4=  mediapipe/vision_bundle.mjs
5/2YWOjo8iHZuW7dwR+OB38mPgt7vXnTy+iCsTQnT4w=  mediapipe/wasm/vision_wasm_internal.js
alxkWEwqthx2O24gSvvbx84cr39SFhhzIryo35T2Rrw=  mediapipe/wasm/vision_wasm_internal.wasm
Q40f6P9/TZRgJbwhHCkVQ8A32KN4XtTu5g8fUhsjYpY=  mediapipe/wasm/vision_wasm_nosimd_internal.js
ijCS00x50/V+a6hZIQXoqQ9rB8J4kf/s0UzKQov9PjE=  mediapipe/wasm/vision_wasm_nosimd_internal.wasm
+8KjAIDDxVcJO13fwzRpgTLrNBBEzO4yLM+LzzYHzeE=  models/hand_landmarker.task
5SLWQAOzMuKScf3OSZPtOuKTTIlH9BZUvTJN3Pot4wE=  qrcode-generator-utf8.js
eeyG+ChWAFsciHkFz8z8++w4Icphx/1alS+qX3ePeRw=  qrcode-generator.js
```

Bu satırlardan altısı (MediaPipe bundle'ı, iki wasm ikilisi, qrcode-generator'ın iki
dosyası, html2canvas)
jsDelivr'in yayımladığı özetlerle birebir aynıdır; font dosyaları Google'ın
`fonts.gstatic.com` üzerinden sunduğu woff2 kopyalarının özetleridir. `models/hand_landmarker.task` için Google bir
özet yayımlamaz; yukarıdaki değer indirilen kopyanın kaydıdır ve dosya iki TFLite
modeli içeren geçerli bir arşiv olarak doğrulanmıştır (`hand_detector.tflite`,
`hand_landmarks_detector.tflite`).

## Not: QR kütüphanesi

Proje önceden QRious 4.0.2 kullanıyordu; o kütüphane **GPL-3.0** ile dağıtıldığı için
MIT lisanslı `qrcode-generator` ile değiştirilmiştir. Böylece bütün bağımlılıklar
MIT, Apache-2.0 veya OFL-1.1 kapsamına girer ve projenin dağıtımında kopyasol
yükümlülük kalmaz.

`qrcode-generator` yalnızca modül matrisini üretir; Canvas 2D çizimi `app.js` içindeki
`qrOlustur()` fonksiyonunda yapılır. Renkler, boyut ve en az 14 px'lik sessiz alan
QRious sürümüyle aynı tutulmuştur.

`qrcode-generator-utf8.js` eklentisi zorunludur. Kütüphanenin varsayılan
`stringToBytes` fonksiyonu her karakteri `c & 0xff` ile daraltır; bu durumda `ş`
(U+015F) sessizce `_` (0x5F) olur ve Türkçe karakter içeren bir e-posta adresi QR
içinde bozulurdu. Eklenti `stringToBytes`'ı UTF-8 sürümüyle değiştirerek bunu önler.
