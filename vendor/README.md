# Yerel kütüphane kaynakları

Kiosk internet bağlantısı olmadan da çalışsın diye bütün üçüncü taraf bağımlılıklar
15 Ekim 2026 tarihinde sürüme sabitlenmiş biçimde indirilmiştir. Dosyalar
değiştirilmemiştir ve her biri yayıncının bildirdiği SHA-256 özetiyle doğrulanmıştır.

| Dosya | Sürüm | Lisans | Kaynak |
| --- | --- | --- | --- |
| `qrious.min.js` | QRious 4.0.2 | **GPL-3.0** | <https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js> |
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
25ncr0CpJhgbzkUiR3wu/Fkk9sSykRG2qX+upHfJUos=  qrious.min.js
```

Bu satırlardan beşi (MediaPipe bundle'ı, iki wasm ikilisi, qrious, html2canvas)
jsDelivr'in yayımladığı özetlerle birebir aynıdır; font dosyaları Google'ın
`fonts.gstatic.com` üzerinden sunduğu woff2 kopyalarının özetleridir. `models/hand_landmarker.task` için Google bir
özet yayımlamaz; yukarıdaki değer indirilen kopyanın kaydıdır ve dosya iki TFLite
modeli içeren geçerli bir arşiv olarak doğrulanmıştır (`hand_detector.tflite`,
`hand_landmarks_detector.tflite`).

## Not: QRious lisansı

QRious **GPL-3.0** ile dağıtılır. Proje `package.json` içinde `private: true` olarak
işaretlidir ve dosya yalnızca kiosk içinde çalıştırılmak üzere tutulmaktadır. Projenin
kapalı kaynak biçimde üçüncü taraflara dağıtılması gündeme gelirse bu bağımlılığın MIT
lisanslı bir QR üreticisiyle değiştirilmesi gerekir.
