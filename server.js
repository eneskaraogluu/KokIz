"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const KOK_DIZIN = __dirname;
const ENV_DOSYASI = path.join(KOK_DIZIN, ".env");
const HAFIZA_DOSYASI = path.join(KOK_DIZIN, "ortak-hafiza.ndjson");
const MAKSIMUM_ISTEK = 18 * 1024 * 1024;
const MAKSIMUM_HAFIZA_ISTEGI = 8 * 1024;
const MAKSIMUM_GORSEL = 12 * 1024 * 1024;
const ISTEK_PENCERESI = 60_000;
const ISTEK_SINIRI = 5;
const HAFIZA_ISTEK_SINIRI = 30;
const HAFIZA_LISTE_SINIRI = 600;
const ULKE_ADLARI = Object.freeze({
  TUR:"Türkiye", AZE:"Azerbaycan", KAZ:"Kazakistan", KGZ:"Kırgızistan",
  UZB:"Özbekistan", TKM:"Türkmenistan", HUN:"Macaristan", KKTC:"Kuzey Kıbrıs Türk Cumhuriyeti",
});

function ortamDegiskenleriniYukle() {
  if (!fs.existsSync(ENV_DOSYASI)) return;

  const satirlar = fs.readFileSync(ENV_DOSYASI, "utf8").split(/\r?\n/);
  for (const satir of satirlar) {
    const temiz = satir.trim();
    if (!temiz || temiz.startsWith("#")) continue;

    const ayirac = temiz.indexOf("=");
    if (ayirac < 1) continue;

    const anahtar = temiz.slice(0, ayirac).trim();
    let deger = temiz.slice(ayirac + 1).trim();
    if ((deger.startsWith('"') && deger.endsWith('"')) || (deger.startsWith("'") && deger.endsWith("'"))) {
      deger = deger.slice(1, -1);
    }

    if (!(anahtar in process.env)) process.env[anahtar] = deger;
  }
}

ortamDegiskenleriniYukle();

const PORT = Number.parseInt(process.env.PORT || "5500", 10);
const HOST = process.env.HOST || "127.0.0.1";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const GONDEREN_EPOSTA = process.env.KOKIZ_FROM_EMAIL || "";
const GONDEREN_ADI = process.env.KOKIZ_FROM_NAME || "KÖKİZ";
const TEST_MODU = /^(1|true|yes|evet)$/i.test(process.env.KOKIZ_MOCK_EMAIL || "");
const EPOSTA_HAZIR = TEST_MODU || Boolean(RESEND_API_KEY && GONDEREN_EPOSTA);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT değeri 1-65535 arasında olmalıdır.");
}

const mimeTurleri = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const yasakliDosyalar = new Set([
  ".env",
  ".env.example",
  ".gitignore",
  "package.json",
  "server.js",
  "ortak-hafiza.ndjson",
  "baslat.ps1",
  "baslat.bat",
]);

const istekKayitlari = new Map();
const hafizaIstekKayitlari = new Map();

function jsonYanit(res, durum, veri) {
  const govde = JSON.stringify(veri);
  res.writeHead(durum, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(govde),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(govde);
}

function hata(mesaj, durum = 400) {
  const sonuc = new Error(mesaj);
  sonuc.durum = durum;
  return sonuc;
}

function istemciAdresi(req) {
  return req.socket.remoteAddress || "bilinmeyen";
}

function hizSiniriniKontrolEt(req, kayitlar = istekKayitlari, sinir = ISTEK_SINIRI) {
  const simdi = Date.now();
  const adres = istemciAdresi(req);
  const onceki = kayitlar.get(adres) || [];
  const guncel = onceki.filter((zaman) => simdi - zaman < ISTEK_PENCERESI);

  if (guncel.length >= sinir) {
    throw hata("Çok kısa sürede fazla gönderim yapıldı. Lütfen bir dakika bekleyin.", 429);
  }

  guncel.push(simdi);
  kayitlar.set(adres, guncel);
}

function ayniKaynagiDogrula(req) {
  const origin = req.headers.origin;
  if (!origin) return;

  try {
    const originAdresi = new URL(origin);
    if (originAdresi.host !== req.headers.host) throw hata("Geçersiz istek kaynağı.", 403);
  } catch (error) {
    if (error.durum) throw error;
    throw hata("Geçersiz istek kaynağı.", 403);
  }
}

function jsonGovdeyiOku(req, maksimumBoyut = MAKSIMUM_ISTEK) {
  return new Promise((resolve, reject) => {
    const parcalar = [];
    let uzunluk = 0;

    req.on("data", (parca) => {
      uzunluk += parca.length;
      if (uzunluk > maksimumBoyut) {
        reject(hata("İstek veri sınırını aşıyor.", 413));
        req.destroy();
        return;
      }
      parcalar.push(parca);
    });

    req.on("end", () => {
      try {
        const metin = Buffer.concat(parcalar).toString("utf8");
        resolve(JSON.parse(metin || "{}"));
      } catch {
        reject(hata("Geçersiz JSON verisi."));
      }
    });

    req.on("error", reject);
  });
}

function ortakHafizaKayitlariniOku() {
  if (!fs.existsSync(HAFIZA_DOSYASI)) return [];
  try {
    const kayitlar = [];
    for (const satir of fs.readFileSync(HAFIZA_DOSYASI, "utf8").split(/\r?\n/).filter(Boolean)) {
      try {
        const kayit = JSON.parse(satir);
        if (kayit && typeof kayit.kayitId === "string") kayitlar.push(kayit);
      } catch {
        // Yarım kalmış tek satır bütün anonim koleksiyonun okunmasını engellemez.
      }
    }
    return kayitlar;
  } catch (error) {
    console.error("[KÖKİZ] Ortak hafıza kaydı okunamadı:", error.message);
    return [];
  }
}

function ortakHafizaYanitiniOlustur(kayitlar = ortakHafizaKayitlariniOku()) {
  return {
    ok: true,
    toplam: kayitlar.length,
    izler: kayitlar.slice(-HAFIZA_LISTE_SINIRI),
  };
}

function ortakHafizaDosyasiniSifirla() {
  if (!fs.existsSync(HAFIZA_DOSYASI)) return;
  fs.writeFileSync(HAFIZA_DOSYASI, "", { encoding: "utf8", mode: 0o600 });
}

// Önceki süreç zorla kapatılmış olsa bile her yeni kiosk oturumu temiz başlar.
ortakHafizaDosyasiniSifirla();

async function ortakHafizayiSifirla(req, res) {
  ayniKaynagiDogrula(req);
  await jsonGovdeyiOku(req, MAKSIMUM_HAFIZA_ISTEGI);
  ortakHafizaDosyasiniSifirla();
  jsonYanit(res, 200, ortakHafizaYanitiniOlustur([]));
}

async function ortakHafizayaKaydet(req, res) {
  ayniKaynagiDogrula(req);
  hizSiniriniKontrolEt(req, hafizaIstekKayitlari, HAFIZA_ISTEK_SINIRI);
  const veri = await jsonGovdeyiOku(req, MAKSIMUM_HAFIZA_ISTEGI);
  const kayitId = metniSinirla(veri.kayitId, 64).toLowerCase();
  const izNo = metniSinirla(veri.izNo, 16).toUpperCase();
  const tamga = metniSinirla(veri.tamga, 8).toUpperCase();
  const ulke = metniSinirla(veri.ulke, 4).toUpperCase();

  if (!/^[0-9a-f-]{16,64}$/.test(kayitId)) throw hata("Ortak hafıza kayıt kimliği geçersiz.");
  if (!/^KIZ-[0-9]{4}$/.test(izNo)) throw hata("Ortak hafıza iz numarası geçersiz.");
  if (!/^[0-9A-F]{8}$/.test(tamga)) throw hata("Tamga kodu geçersiz.");
  if (!ULKE_ADLARI[ulke]) throw hata("Ülke veya bölge kodu geçersiz.");

  const kayitlar = ortakHafizaKayitlariniOku();
  if (!kayitlar.some(kayit => kayit.kayitId === kayitId)) {
    const kayit = { kayitId, izNo, tamga, ulke, zaman: new Date().toISOString() };
    fs.appendFileSync(HAFIZA_DOSYASI, `${JSON.stringify(kayit)}\n`, { encoding: "utf8", mode: 0o600 });
    kayitlar.push(kayit);
  }
  jsonYanit(res, 200, ortakHafizaYanitiniOlustur(kayitlar));
}

function epostaGecerliMi(eposta) {
  return typeof eposta === "string" && eposta.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta);
}

function metniSinirla(deger, uzunluk) {
  return typeof deger === "string" ? deger.trim().slice(0, uzunluk) : "";
}

function htmlKacis(deger) {
  return String(deger).replace(/[&<>"']/g, (karakter) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[karakter]);
}

function dosyaAdiniTemizle(deger, izNo) {
  const temel = metniSinirla(deger, 100) || `KOKIZ-${izNo}.png`;
  const temiz = temel
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return temiz.toLowerCase().endsWith(".png") ? temiz : `${temiz || `KOKIZ-${izNo}`}.png`;
}

function pngGorseliniCoz(gorsel) {
  if (typeof gorsel !== "string") throw hata("Hatıra kartı görseli eksik.");
  const eslesme = gorsel.match(/^data:image\/png;base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!eslesme) throw hata("Hatıra kartı PNG biçiminde olmalıdır.");

  const tampon = Buffer.from(eslesme[1].replace(/\s/g, ""), "base64");
  if (!tampon.length || tampon.length > MAKSIMUM_GORSEL) {
    throw hata("Hatıra kartı görsel boyutu geçersiz.", tampon.length > MAKSIMUM_GORSEL ? 413 : 400);
  }

  const pngImzasi = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (tampon.length < 8 || !tampon.subarray(0, 8).equals(pngImzasi)) {
    throw hata("Gönderilen dosya geçerli bir PNG değil.");
  }

  return { tampon, base64: tampon.toString("base64") };
}

async function resendIleGonder({ eposta, latinMetin, kokTurkMetin, izNo, ulke, dosyaAdi, gorsel }) {
  const konu = `KÖKİZ Hatıra Kartın · ${izNo}`;
  const guvenliLatin = htmlKacis(latinMetin || "—");
  const guvenliKokTurk = htmlKacis(kokTurkMetin || "—");
  const guvenliIz = htmlKacis(izNo);
  const guvenliUlke = htmlKacis(ULKE_ADLARI[ulke] || ULKE_ADLARI.TUR);
  const kimlik = crypto
    .createHash("sha256")
    .update(`inline-v1|${eposta}|${izNo}|`)
    .update(gorsel.tampon)
    .digest("hex");

  if (TEST_MODU) {
    await new Promise((resolve) => setTimeout(resolve, 180));
    return { id: `test-${kimlik.slice(0, 16)}`, testModu: true };
  }

  const cevap = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `kokiz-${kimlik}`,
    },
    body: JSON.stringify({
      from: `${GONDEREN_ADI} <${GONDEREN_EPOSTA}>`,
      to: [eposta],
      subject: konu,
      text: `KÖKİZ hatıra kartın hazır.\n\nLatin: ${latinMetin || "—"}\nKök Türk: ${kokTurkMetin || "—"}\nKök coğrafya: ${ULKE_ADLARI[ulke] || ULKE_ADLARI.TUR}\nİz: ${izNo}\n\nHatıra kartın bu e-postada tam görsel olarak gösterilmiş ve PNG dosyası olarak eklenmiştir.`,
      html: `<!doctype html><html lang="tr"><body style="margin:0;padding:0;background:#031716;color:#f4e7c3;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#031716"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:1240px"><tr><td style="padding:0 4px 18px"><p style="margin:0 0 8px;color:#45d4cc;font-size:13px;letter-spacing:.15em">KÖKİZ · ETKİLEŞİMLİ TÜRK YAZI DUVARI</p><h1 style="margin:0;color:#efc66e;font-family:Georgia,serif;font-size:28px">Hatıra kartın hazır</h1><p style="margin:12px 0 0;color:#dce7df;font-size:15px;line-height:1.55">Etkinlikte bıraktığın dijital iz aşağıda tam haliyle yer alıyor.</p></td></tr><tr><td style="padding:0;border:1px solid #b8913f;background:#052421"><img src="cid:kokiz-hatira-karti" width="1200" alt="KÖKİZ kişisel hatıra kartı · ${guvenliIz}" style="display:block;width:100%;max-width:1200px;height:auto;margin:0;border:0;outline:none"></td></tr><tr><td style="padding:18px 4px 0;color:#aab9b2;font-size:13px;line-height:1.6"><strong style="color:#efc66e">Latin:</strong> ${guvenliLatin}&nbsp;&nbsp;·&nbsp;&nbsp;<strong style="color:#efc66e">Kök Türk:</strong> ${guvenliKokTurk}&nbsp;&nbsp;·&nbsp;&nbsp;<strong style="color:#efc66e">Kök coğrafya:</strong> ${guvenliUlke}&nbsp;&nbsp;·&nbsp;&nbsp;<strong style="color:#efc66e">İz:</strong> ${guvenliIz}<br>29–30 Ekim 2026 · Ankara</td></tr></table></td></tr></table></body></html>`,
      attachments: [{
        filename: dosyaAdi,
        content: gorsel.base64,
        content_id: "kokiz-hatira-karti",
      }],
    }),
  });

  let sonuc = {};
  try {
    sonuc = await cevap.json();
  } catch {
    // Sağlayıcının JSON olmayan hata yanıtı kullanıcıya ayrıntı sızdırmadan ele alınır.
  }

  if (!cevap.ok) {
    console.error(`[KÖKİZ] Resend hatası: HTTP ${cevap.status}`);
    throw hata("E-posta sağlayıcısı gönderimi kabul etmedi. Yapılandırmayı kontrol edin.", 502);
  }

  return { id: sonuc.id || kimlik.slice(0, 16), testModu: false };
}

async function hatiraKartiniGonder(req, res) {
  if (!EPOSTA_HAZIR) {
    throw hata("E-posta servisi henüz yapılandırılmadı.", 503);
  }

  ayniKaynagiDogrula(req);
  hizSiniriniKontrolEt(req);

  const veri = await jsonGovdeyiOku(req);
  const eposta = metniSinirla(veri.eposta, 254).toLowerCase();
  const latinMetin = metniSinirla(veri.latinMetin, 80);
  const kokTurkMetin = metniSinirla(veri.kokTurkMetin, 160);
  const izNo = metniSinirla(veri.izNo, 32);
  const ulke = metniSinirla(veri.ulke, 4).toUpperCase();

  if (!epostaGecerliMi(eposta)) throw hata("Geçerli bir e-posta adresi girin.");
  if (!izNo || !/^KIZ-[A-Z0-9-]+$/i.test(izNo)) throw hata("Hatıra kartı iz numarası geçersiz.");
  if (!ULKE_ADLARI[ulke]) throw hata("Ülke veya bölge kodu geçersiz.");

  const gorsel = pngGorseliniCoz(veri.gorsel);
  const dosyaAdi = dosyaAdiniTemizle(veri.dosyaAdi, izNo);
  const sonuc = await resendIleGonder({ eposta, latinMetin, kokTurkMetin, izNo, ulke, dosyaAdi, gorsel });

  jsonYanit(res, 200, {
    ok: true,
    mesaj: TEST_MODU ? "Test gönderimi başarıyla tamamlandı." : "Hatıra kartı e-posta adresine gönderildi.",
    gonderimId: sonuc.id,
    testModu: sonuc.testModu,
  });
}

function statikDosyaSun(req, res, url) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    jsonYanit(res, 405, { ok: false, mesaj: "Bu yöntem desteklenmiyor." });
    return;
  }

  let yol;
  try {
    yol = decodeURIComponent(url.pathname);
  } catch {
    jsonYanit(res, 400, { ok: false, mesaj: "Geçersiz adres." });
    return;
  }

  const goreli = yol === "/" ? "index.html" : yol.replace(/^\/+/, "");
  const ilkParca = goreli.split(/[\\/]/)[0].toLowerCase();
  if (yasakliDosyalar.has(ilkParca) || ilkParca.startsWith(".")) {
    jsonYanit(res, 404, { ok: false, mesaj: "Bulunamadı." });
    return;
  }

  let dosya = path.resolve(KOK_DIZIN, goreli);
  if (dosya !== KOK_DIZIN && !dosya.startsWith(`${KOK_DIZIN}${path.sep}`)) {
    jsonYanit(res, 403, { ok: false, mesaj: "Erişim reddedildi." });
    return;
  }

  if (!fs.existsSync(dosya)) {
    jsonYanit(res, 404, { ok: false, mesaj: "Bulunamadı." });
    return;
  }

  const bilgi = fs.statSync(dosya);
  if (bilgi.isDirectory()) dosya = path.join(dosya, "index.html");
  if (!fs.existsSync(dosya) || !fs.statSync(dosya).isFile()) {
    jsonYanit(res, 404, { ok: false, mesaj: "Bulunamadı." });
    return;
  }

  const tur = mimeTurleri[path.extname(dosya).toLowerCase()] || "application/octet-stream";
  const boyut = fs.statSync(dosya).size;
  res.writeHead(200, {
    "Content-Type": tur,
    "Content-Length": boyut,
    "Cache-Control": "no-cache",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
  });

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  fs.createReadStream(dosya).pipe(res);
}

const sunucu = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/api/saglik") {
      if (req.method !== "GET") throw hata("Bu yöntem desteklenmiyor.", 405);
      jsonYanit(res, 200, {
        ok: true,
        servis: "kokiz-backend",
        surum: "5.5.0",
        epostaHazir: EPOSTA_HAZIR,
        testModu: TEST_MODU,
        ortakHafizaHazir: true,
      });
      return;
    }

    if (url.pathname === "/api/ortak-hafiza") {
      if (req.method === "GET") {
        jsonYanit(res, 200, ortakHafizaYanitiniOlustur());
        return;
      }
      if (req.method === "POST") {
        await ortakHafizayaKaydet(req, res);
        return;
      }
      throw hata("Bu yöntem desteklenmiyor.", 405);
    }

    if (url.pathname === "/api/ortak-hafiza/sifirla") {
      if (req.method !== "POST") throw hata("Bu yöntem desteklenmiyor.", 405);
      await ortakHafizayiSifirla(req, res);
      return;
    }

    if (url.pathname === "/api/hatira-gonder") {
      if (req.method !== "POST") throw hata("Bu yöntem desteklenmiyor.", 405);
      await hatiraKartiniGonder(req, res);
      return;
    }

    statikDosyaSun(req, res, url);
  } catch (error) {
    if (!res.headersSent) {
      const durum = Number.isInteger(error.durum) ? error.durum : 500;
      const mesaj = durum >= 500 && !error.durum ? "Sunucuda beklenmeyen bir hata oluştu." : error.message;
      if (durum >= 500) console.error("[KÖKİZ] Sunucu hatası:", error.message);
      jsonYanit(res, durum, { ok: false, mesaj });
    }
  }
});

sunucu.requestTimeout = 30_000;
sunucu.headersTimeout = 35_000;

sunucu.listen(PORT, HOST, () => {
  console.log(`KÖKİZ backend: http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  console.log(EPOSTA_HAZIR ? (TEST_MODU ? "E-posta: TEST MODU" : "E-posta: Resend hazır") : "E-posta: yapılandırma bekleniyor (.env)");
});

function guvenliKapat() {
  try {
    ortakHafizaDosyasiniSifirla();
  } catch (error) {
    console.error("[KÖKİZ] Ortak hafıza kapanışta sıfırlanamadı:", error.message);
  }
  sunucu.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on("SIGINT", guvenliKapat);
process.on("SIGTERM", guvenliKapat);
