// KOKIZ pinch secim testi.
//
// Kamera olmadan calisir: app.js icindeki GERCEK fonksiyonlari cikarip sahte bir
// klavye DOM'u ve sentetik el landmark'lari uzerinde kosturur. Pinch secim mantigi
// (imlec kilidi, yapiskan hedefleme, iptal kurali, gecikme) boylece kamera
// gerektirmeden dogrulanir.
//
//   npm run test:pinch               mevcut app.js
//   node test/pinch-testi.js <yol>   baska bir app.js surumu (karsilastirma)
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const yol = process.argv[2] || path.join(__dirname, "..", "app.js");
const kaynak = fs.readFileSync(yol, "utf8");
console.log("kaynak: " + yol);

function fonksiyonCikar(ad) {
  const bas = kaynak.indexOf(`function ${ad}(`);
  if (bas < 0) throw new Error("bulunamadi: " + ad);
  let i = kaynak.indexOf("{", bas), derinlik = 0;
  for (let j = i; j < kaynak.length; j++) {
    if (kaynak[j] === "{") derinlik++;
    else if (kaynak[j] === "}") { derinlik--; if (derinlik === 0) return kaynak.slice(bas, j + 1); }
  }
  throw new Error("kapanmadi: " + ad);
}
function sabitCikar(ad) {
  const m = kaynak.match(new RegExp("const " + ad + " = (Object\\.freeze\\()?\\{[\\s\\S]*?\\n\\}\\)?;"));
  if (!m) throw new Error("sabit bulunamadi: " + ad);
  return m[0];
}

// ---------- sahte DOM ----------
const TUS_G = 60, BOSLUK = 4, TUS_Y = 800, TUS_H = 48, EKRAN_G = 1920, EKRAN_Y = 1080;
const HARFLER = ["Q","W","E","R","T","Y","U","I","O","P","Ğ","Ü"];
const SATIR_BASI = (EKRAN_G - (12 * TUS_G + 11 * BOSLUK)) / 2;
const tiklamalar = [];
const tuslar = HARFLER.map((harf, i) => {
  const sol = SATIR_BASI + i * (TUS_G + BOSLUK);
  const siniflar = new Set();
  const t = {
    harf, sol, sag: sol + TUS_G, dataset: { harf }, textContent: harf, disabled: false,
    classList: { add: c => siniflar.add(c), remove: c => siniflar.delete(c), contains: c => siniflar.has(c) },
    click: () => tiklamalar.push(harf)
  };
  t.closest = () => t;
  return t;
});

const sandbox = {
  console,
  setTimeout,
  performance,
  innerWidth: EKRAN_G,
  innerHeight: EKRAN_Y,
  document: {
    elementFromPoint(x, y) {
      if (y < TUS_Y || y > TUS_Y + TUS_H) return null;
      for (const t of tuslar) if (x >= t.sol && x <= t.sag) return t;
      return null;                                  // tuslar arasi bosluk
    }
  },
  arayuz: {
    sanalImlec: { style: {}, classList: { add(){}, remove(){} } },
    hedefTusDurumu: { textContent: "" },
    parmakDurumu: { textContent: "" },
    secimYuzdesi: { textContent: "" },
    secimCubuguDolgu: { style: {} },
    algilananElSayisi: { textContent: "" },
    elCanvas: { width: 640, height: 480 },
    elDurumu: {}, elDurumNoktasi: {}, imlecDurumu: {}, imlecDurumNoktasi: {}
  },
  elCanvasContext: { clearRect(){} },
  enerjiIziniCiz(){},
  durumGuncelle(){},
  enerjiIziniTemizle(){},
  tuslar, tiklamalar, TUS_G, BOSLUK, TUS_Y, TUS_H, SATIR_BASI
};

// ---------- tek bir kaynak olarak kur ----------
const parcalar = [
  sabitCikar("AYARLAR"),
  sabitCikar("durum"),
  `durum.cizimAraci = { drawConnectors(){}, drawLandmarks(){} };
   durum.elIsaretleyiciSinifi = { HAND_CONNECTIONS: [] };
   function hedefiEtkinlestir(hedef) { if (!hedef || hedef.disabled) return; hedef.click(); }`
];
for (const ad of ["sayiyiSinirla","noktaMesafesi","ortalamaNokta","gecmiseNoktaEkle","gecmiseOranEkle",
                  "kameraDegeriniEkranaYay","pinchDurumunuHesapla","pinchHedefiniSec",
                  "hedefiNoktadanBul","imlecHedefiniBul","hedefiTemizle","secimIlerlemesiniGuncelle",
                  "sanalImleciGuncelle","elSonucunuCiz"]) {
  try { parcalar.push(fonksiyonCikar(ad)); } catch (e) { console.log("  (yok, atlandi: " + ad + ")"); }
}

// ---------- test surucusu ----------
parcalar.push(`
const normX = ex => (1 - ex / innerWidth) * (1 - 2*AYARLAR.kameraKenarPayi) + AYARLAR.kameraKenarPayi;
const normY = ey => (ey / innerHeight) * (1 - 2*AYARLAR.kameraKenarPayi) + AYARLAR.kameraKenarPayi;

function el(ex, ey, oran) {
  const n = Array.from({length:21}, () => ({x:.5, y:.5, z:0}));
  n[0] = {x:.5, y:.9, z:0};
  n[9] = {x:.5, y:.6, z:0};                 // el olcegi = 0.3
  n[8] = {x:normX(ex), y:normY(ey), z:0};
  n[4] = {x:n[8].x + oran * 0.3, y:n[8].y, z:0};
  return n;
}
const bekle = ms => new Promise(r => setTimeout(r, ms));
async function kare(ex, ey, oran) {
  elSonucunuCiz({ landmarks: [el(ex, ey, oran)] });
  await bekle(AYARLAR.algilamaAraligi);
}
function sifirla() {
  tiklamalar.length = 0;
  durum.pinchAktif = false; durum.pinchSecimiYapildi = false; durum.pinchBaslangicHedefi = null;
  durum.isaretParmagiGecmisi = []; durum.basParmakGecmisi = []; durum.pinchOranGecmisi = [];
  durum.sonHedefEleman = null; durum.sonSecimZamani = -Infinity; durum.pinchIptalEdildi = false;
  durum.sanalImlecX = innerWidth/2; durum.sanalImlecY = innerHeight/2;
  durum.enerjiIzi = [];
}
const merkez = h => { const t = tuslar.find(x => x.harf === h); return [(t.sol+t.sag)/2, TUS_Y + TUS_H/2]; };
const aralik = h => { const t = tuslar.find(x => x.harf === h); return [t.sag + BOSLUK/2, TUS_Y + TUS_H/2]; };

const ACIK = 0.75, KAPALI = 0.15;
const sonuclar = [];
const kayit = (ad, gecti, ayrinti) => sonuclar.push({ad, gecti, ayrinti});

globalThis.__kos = (async () => {
  // Yardimci: pinch etkinlesene kadar kare besle, sonra N kare daha
  async function pinchYap(x, y, ekKare = 6) {
    for (let i = 0; i < 12 && !durum.pinchAktif; i++) await kare(x, y, KAPALI);
    for (let i = 0; i < ekKare; i++) await kare(x, y, KAPALI);
  }
  async function birak(x, y) {
    for (let i = 0; i < 12 && durum.pinchAktif; i++) await kare(x, y, ACIK);
    for (let i = 0; i < 4; i++) await kare(x, y, ACIK);
  }
  async function otur(x, y) { for (let i = 0; i < 16; i++) await kare(x, y, ACIK); }

  // 1) Normal secim
  { sifirla(); const [x,y] = merkez("E");
    await otur(x,y); await pinchYap(x,y);
    kayit("Normal secim (otur + pinch)", tiklamalar.join("")==="E", "tiklama: ["+tiklamalar.join(",")+"]"); }

  // 2) Komsu tusa gec ve HEMEN pinch (eskiden 100 ms kararlilik sarti bosa harcardi)
  { sifirla(); const [qx,qy] = merkez("Q"); await otur(qx,qy);
    const [x,y] = merkez("W");
    for (let i=0;i<3;i++) await kare(x,y,ACIK);     // imlec yeni tusa varir
    await pinchYap(x,y);
    kayit("Komsu tusa gecip hemen pinch", tiklamalar.join("")==="W", "tiklama: ["+tiklamalar.join(",")+"]"); }

  // 3) GERCEKCI parmak kaymasi: pinch kapanirken isaret ucu basparmaga dogru
  //    gider; ekranda ~125 px sapmaya denk gelir (2 tus genisligi).
  { sifirla(); const [x,y] = merkez("T"); await otur(x,y);
    let kaymaKare = 0;
    for (let i=0;i<20 && tiklamalar.length===0;i++) {
      const oran = Math.max(KAPALI, ACIK - 0.15*i);        // parmaklar kademeli kapanir
      const kayma = Math.min(125, 25*i);                    // ucu ayni anda kayar
      await kare(x + kayma, y, oran);
      kaymaKare = kayma;
    }
    const sapma = Math.round(durum.sanalImlecX - x);
    kayit("Gercekci parmak kaymasinda dogru tus", tiklamalar.join("")==="T",
          "tiklama: ["+tiklamalar.join(",")+"] | girdi kaymasi="+kaymaKare+"px, secim aninda imlec sapmasi="+sapma+"px (T yarisi=30px)"); }

  // 4) Tuslar arasi bosluktan secim (yapiskan hedefleme)
  { sifirla(); const [x,y] = aralik("R"); await otur(x,y);
    const hedefHarf = durum.sonHedefEleman ? durum.sonHedefEleman.harf : "-";
    await pinchYap(x,y);
    kayit("Tuslar arasi bosluktan secim", tiklamalar.length===1,
          "bosluk hedefi="+hedefHarf+" tiklama: ["+tiklamalar.join(",")+"]"); }

  // 5) GUVENLIK: pinch ETKINKEN hedef degisirse secim olmamali
  { sifirla(); const [x,y] = merkez("Y"); await otur(x,y);
    for (let i=0;i<12 && !durum.pinchAktif;i++) await kare(x,y,KAPALI);   // pinch etkin
    durum.sonHedefEleman = tuslar.find(t=>t.harf==="U");                   // hedefi zorla degistir
    for (let i=0;i<8;i++) await kare(x,y,KAPALI);
    kayit("GUVENLIK: pinch icinde hedef degisirse secim yok", tiklamalar.length===0,
          "tiklama: ["+tiklamalar.join(",")+"] (bos bekleniyor)"); }

  // 6) Basili tutmak tek secim uretir
  { sifirla(); const [x,y] = merkez("I"); await otur(x,y);
    await pinchYap(x,y,40);
    kayit("Basili tutmak tek secim uretir", tiklamalar.length===1, "tiklama: ["+tiklamalar.join(",")+"]"); }

  // 7) Ayir + tekrar pinch = 2 secim
  { sifirla(); const [x,y] = merkez("O"); await otur(x,y);
    await pinchYap(x,y); await birak(x,y);
    for (let i=0;i<6;i++) await kare(x,y,ACIK);     // cooldown gecsin
    await pinchYap(x,y);
    kayit("Ayir + tekrar pinch = 2 secim", tiklamalar.length===2, "tiklama: ["+tiklamalar.join(",")+"]"); }

  // 8) Bos alanda pinch secim uretmez
  { sifirla(); await otur(960, 300); await pinchYap(960, 300);
    kayit("Bos alanda pinch secim uretmez", tiklamalar.length===0,
          "tiklama: ["+tiklamalar.join(",")+"] durum: "+arayuz.parmakDurumu.textContent); }

  // 9) GECIKME: ilk kapali kareden secime kadar
  { sifirla(); const [x,y] = merkez("P"); await otur(x,y);
    const t0 = performance.now();
    let gecikme = -1;
    for (let i=0;i<20;i++) { await kare(x,y,KAPALI);
      if (tiklamalar.length===1) { gecikme = Math.round(performance.now()-t0); break; } }
    kayit("Secim gecikmesi 300 ms altinda", gecikme >= 0 && gecikme < 300,
          "ilk kapali kareden secime: ~"+gecikme+" ms (kare basi "+AYARLAR.algilamaAraligi+" ms)"); }

  let gecen = 0;
  console.log("");
  console.log("==== SONUCLAR ====");
  for (const r of sonuclar) {
    console.log((r.gecti ? "  GECTI  " : "  KALDI  ") + r.ad);
    console.log("          " + r.ayrinti);
    if (r.gecti) gecen++;
  }
  console.log("");
  console.log("  " + gecen + "/" + sonuclar.length + " senaryo gecti");
  return gecen === sonuclar.length;
})();
`);

vm.createContext(sandbox);
vm.runInContext(parcalar.join("\n\n"), sandbox);
sandbox.__kos.then(ok => process.exit(ok ? 0 : 1)).catch(e => { console.error(e); process.exit(2); });
