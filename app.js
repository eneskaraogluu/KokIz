"use strict";

const AYARLAR = Object.freeze({
  maksimumKarakter: 24,
  algilamaAraligi: 40,
  imlecYumusatmaOrani: 0.34,
  kameraKenarPayi: 0.10,
  pinchBaslamaEsigi: 0.27,
  pinchBirakmaEsigi: 0.40,
  pinchCooldownSuresi: 250,
  hedefKararSuresi: 100,
  pinchDogrulamaSuresi: 70,
  gecmisPencereBoyutu: 4
});

// MediaPipe paketi, wasm ikilileri ve el modeli proje icinde tutulur; kiosk
// internet baglantisi olmadan da calisir. Surumler vendor/README.md icinde.
const MEDIAPIPE_PAKET = "/vendor/mediapipe/vision_bundle.mjs";
const MEDIAPIPE_WASM = "/vendor/mediapipe/wasm";
const EL_MODELI = "/vendor/models/hand_landmarker.task";
const GENEL_QR_ADRESI = "https://www.turkicstates.org/tr";

const KLAVYE_SATIRLARI = [
  ["Q","W","E","R","T","Y","U","I","O","P","Ğ","Ü"],
  ["A","S","D","F","G","H","J","K","L","Ş","İ"],
  ["Z","X","C","V","B","N","M","Ö","Ç"]
];

const ULKELER = Object.freeze([
  {kod:"TUR", muhur:"TR", kisa:"Türkiye", ad:"Türkiye", kaynak:"Türkiye’den", bayrak:"tr.svg", renk:"#18D7D2", x:.50, y:.47, ucusX:.22, ucusY:.34},
  {kod:"AZE", muhur:"AZ", kisa:"Azerb.", ad:"Azerbaycan", kaynak:"Azerbaycan’dan", bayrak:"az.svg", renk:"#4EB6FF", x:.64, y:.39, ucusX:.78, ucusY:.32},
  {kod:"KAZ", muhur:"KZ", kisa:"Kazak.", ad:"Kazakistan", kaynak:"Kazakistan’dan", bayrak:"kz.svg", renk:"#F2C14E", x:.76, y:.30, ucusX:.82, ucusY:.48},
  {kod:"KGZ", muhur:"KG", kisa:"Kırgız.", ad:"Kırgızistan", kaynak:"Kırgızistan’dan", bayrak:"kg.svg", renk:"#E76870", x:.70, y:.65, ucusX:.72, ucusY:.72},
  {kod:"UZB", muhur:"UZ", kisa:"Özbek.", ad:"Özbekistan", kaynak:"Özbekistan’dan", bayrak:"uz.svg", renk:"#62D58D", x:.53, y:.70, ucusX:.50, ucusY:.78},
  {kod:"TKM", muhur:"TM", kisa:"Türkmen.", ad:"Türkmenistan", kaynak:"Türkmenistan’dan", bayrak:"tm.svg", renk:"#54C6A5", x:.36, y:.65, ucusX:.28, ucusY:.71},
  {kod:"HUN", muhur:"HU", kisa:"Macar.", ad:"Macaristan", kaynak:"Macaristan’dan", bayrak:"hu.svg", renk:"#C883E5", x:.25, y:.38, ucusX:.17, ucusY:.50},
  {kod:"KKTC", muhur:"KKTC", kisa:"KKTC", ad:"Kuzey Kıbrıs Türk Cumhuriyeti", kaynak:"KKTC’den", bayrak:"kktc.svg", renk:"#F08A5D", x:.39, y:.31, ucusX:.38, ucusY:.25}
]);
const ULKE_HARITASI = Object.freeze(Object.fromEntries(ULKELER.map(ulke => [ulke.kod, ulke])));
const BAYRAK_GORSELLERI = new Map();

// Unicode Old Turkic bloğundaki Orhon biçimleri kullanılır. Modern kişi adları
// tarihî Eski Türkçe sözcükler olmadığı için sonuç, çeviri değil fonetik uyarlamadır.
const KOK_TURK_ORHON = Object.freeze({
  A:"𐰀", E:"𐰀", I:"𐰃", İ:"𐰃", O:"𐰆", U:"𐰆", Ö:"𐰇", Ü:"𐰇",
  B:{kalin:"𐰉",ince:"𐰋"}, C:{kalin:"𐰱",ince:"𐰲"}, Ç:{kalin:"𐰱",ince:"𐰲"},
  D:{kalin:"𐰑",ince:"𐰓"}, G:{kalin:"𐰍",ince:"𐰏"}, Ğ:{kalin:"𐰍",ince:"𐰏"},
  H:{kalin:"𐰴",ince:"𐰚"}, J:{kalin:"𐰖",ince:"𐰘"}, K:{kalin:"𐰴",ince:"𐰚"},
  L:{kalin:"𐰞",ince:"𐰠"}, N:{kalin:"𐰣",ince:"𐰤"}, R:{kalin:"𐰺",ince:"𐰼"},
  S:{kalin:"𐰽",ince:"𐰾"}, Ş:{kalin:"𐰿",ince:"𐱁"}, T:{kalin:"𐱃",ince:"𐱅"},
  V:{kalin:"𐰉",ince:"𐰋"}, W:{kalin:"𐰉",ince:"𐰋"}, Y:{kalin:"𐰖",ince:"𐰘"},
  F:"𐰯", M:"𐰢", P:"𐰯", Q:"𐰴", X:"𐰴", Z:"𐰔"
});
const KOK_TURK_BIRLESIKLER = Object.freeze({LT:"𐰡",NT:"𐰦",NÇ:"𐰨",NY:"𐰪",NG:"𐰭"});
const INCE_UNLULER = new Set(["E","İ","Ö","Ü"]);
const KALIN_UNLULER = new Set(["A","I","O","U"]);

function yakinUnluSinifi(karakterler, konum) {
  let bas = konum;
  let son = konum;
  while (bas > 0 && !/\s/.test(karakterler[bas - 1])) bas--;
  while (son < karakterler.length - 1 && !/\s/.test(karakterler[son + 1])) son++;

  let enYakin = null;
  for (let i = bas; i <= son; i++) {
    if (!INCE_UNLULER.has(karakterler[i]) && !KALIN_UNLULER.has(karakterler[i])) continue;
    const uzaklik = Math.abs(i - konum);
    if (!enYakin || uzaklik < enYakin.uzaklik || (uzaklik === enYakin.uzaklik && i < konum)) {
      enYakin = {uzaklik, sinif:INCE_UNLULER.has(karakterler[i]) ? "ince" : "kalin"};
    }
  }
  return enYakin?.sinif || "kalin";
}

function kokTurkIsaretlerineCevir(metin) {
  const karakterler = [...String(metin).normalize("NFC").toLocaleUpperCase("tr-TR")];
  const isaretler = [];
  for (let i = 0; i < karakterler.length; i++) {
    const harf = karakterler[i];
    if (/\s/.test(harf)) {
      if (isaretler.length && isaretler.at(-1) !== "⁚") isaretler.push("⁚");
      continue;
    }

    const birlesik = KOK_TURK_BIRLESIKLER[harf + (karakterler[i + 1] || "")];
    if (birlesik) {
      isaretler.push(birlesik);
      i++;
      continue;
    }

    const karsilik = KOK_TURK_ORHON[harf];
    if (!karsilik) {
      isaretler.push("□");
    } else if (typeof karsilik === "string") {
      isaretler.push(karsilik);
    } else {
      isaretler.push(karsilik[yakinUnluSinifi(karakterler, i)]);
    }
  }
  while (isaretler.at(-1) === "⁚") isaretler.pop();
  return isaretler;
}

function kokTurkKlavyeEtiketi(harf) {
  const karsilik = KOK_TURK_ORHON[harf];
  if (!karsilik) return "□";
  if (typeof karsilik === "string") return karsilik;
  return karsilik.kalin === karsilik.ince ? karsilik.kalin : `${karsilik.kalin}/${karsilik.ince}`;
}

const GECERLI_HARFLER = KLAVYE_SATIRLARI.flat();
const $ = secici => document.querySelector(secici);

const arayuz = {
  klavye: $("#klavye"), yaziAlani: $("#yaziAlani"), kokTurkAlani: $("#kokTurkAlani"),
  ulkeSecimi: $("#ulkeSecimi"), secilenUlkeAdi: $("#secilenUlkeAdi"),
  karakterSayaci: $("#karakterSayaci"), anlikIzNo: $("#anlikIzNo"), tasAnit: $("#tasAnit"),
  anitsalLatinMetin: $("#anitsalLatinMetin"), anitsalKokTurkMetin: $("#anitsalKokTurkMetin"),
  anitDurumu: $("#anitDurumu"), durumMesaji: $("#durumMesaji"), epostaAlani: $("#epostaAlani"),
  silButonu: $("#silButonu"), boslukButonu: $("#boslukButonu"), temizleButonu: $("#temizleButonu"),
  kopyalaButonu: $("#kopyalaButonu"), hatiraButonu: $("#hatiraButonu"), sesButonu: $("#sesButonu"), tamEkranButonu: $("#tamEkranButonu"),
  hafizaButonu: $("#hafizaButonu"), kartHafizaButonu: $("#kartHafizaButonu"),
  hatiraModal: $("#hatiraModal"), hatiraKapatButonu: $("#hatiraKapatButonu"), indirButonu: $("#indirButonu"),
  epostaGonderButonu: $("#epostaGonderButonu"), epostaGonderimDurumu: $("#epostaGonderimDurumu"),
  paylasButonu: $("#paylasButonu"), hatiraKarti: $("#hatiraKarti"), kartLatinMetin: $("#kartLatinMetin"),
  kartKokTurkMetin: $("#kartKokTurkMetin"), kartTasRuneleri: $("#kartTasRuneleri"), kartTasLatin: $("#kartTasLatin"), kartIzNo: $("#kartIzNo"),
  kartIzNoOrta: $("#kartIzNoOrta"), kartMailBilgisi: $("#kartMailBilgisi"), qrOnizleme: $("#qrOnizleme"),
  kartTamga: $("#kartTamga"), kartUlkeMuhru: $("#kartUlkeMuhru"),
  kartQrBasligi: $("#kartQrBasligi"), kartQrAciklamasi: $("#kartQrAciklamasi"),
  genelQr: $("#genelQr"), bildirim: $("#bildirim"), sanalImlec: $("#sanalImlec"), enerjiIziCanvas: $("#enerjiIziCanvas"),
  ulkeKarsilamaSahnesi: $("#ulkeKarsilamaSahnesi"), ulkeKarsilamaMotifi: $("#ulkeKarsilamaMotifi"),
  ulkeKarsilamaKodu: $("#ulkeKarsilamaKodu"), ulkeKarsilamaAdi: $("#ulkeKarsilamaAdi"), ulkeKarsilamaMetni: $("#ulkeKarsilamaMetni"),
  ulkeKarsilamaBayragi: $("#ulkeKarsilamaBayragi"), ulkeKarsilamaBayrakGorseli: $("#ulkeKarsilamaBayrakGorseli"),
  tasIslemeSahnesi: $("#tasIslemeSahnesi"), islemeParcacikCanvas: $("#islemeParcacikCanvas"),
  islemeTas: $("#islemeTas"), islemeCatlaklari: $("#islemeCatlaklari"),
  islemeRuneleri: $("#islemeRuneleri"), islemeLatinMetin: $("#islemeLatinMetin"), islemeAsama: $("#islemeAsama"),
  islemeBaslik: $("#islemeBaslik"), islemeIlerlemeDolgu: $("#islemeIlerlemeDolgu"), islemeIzNo: $("#islemeIzNo"),
  islemeAtlaButonu: $("#islemeAtlaButonu"), islemeUlkeKumesi: $("#islemeUlkeKumesi"),
  islemeUlkeKodu: $("#islemeUlkeKodu"), islemeUlkeAdi: $("#islemeUlkeAdi"), islemeYildizi: $("#islemeYildizi"),
  ortakHafizaSahnesi: $("#ortakHafizaSahnesi"), ortakHafizaCanvas: $("#ortakHafizaCanvas"),
  hafizaKapatButonu: $("#hafizaKapatButonu"), hafizaToplam: $("#hafizaToplam"), hafizaSonIz: $("#hafizaSonIz"),
  hafizaSeciliIzNo: $("#hafizaSeciliIzNo"), hafizaSeciliUlke: $("#hafizaSeciliUlke"), hafizaTamga: $("#hafizaTamga"),
  hafizaDurumu: $("#hafizaDurumu"), hafizaUlkeOzeti: $("#hafizaUlkeOzeti"),
  kameraBaslatButonu: $("#kameraBaslatButonu"), kameraDurdurButonu: $("#kameraDurdurButonu"),
  kameraGoruntusu: $("#kameraGoruntusu"), elCanvas: $("#elCanvas"), kameraYerTutucu: $("#kameraYerTutucu"),
  kameraDurumu: $("#kameraDurumu"), kameraDurumNoktasi: $("#kameraDurumNoktasi"),
  modelDurumu: $("#modelDurumu"), modelDurumNoktasi: $("#modelDurumNoktasi"),
  elDurumu: $("#elDurumu"), elDurumNoktasi: $("#elDurumNoktasi"),
  imlecDurumu: $("#imlecDurumu"), imlecDurumNoktasi: $("#imlecDurumNoktasi"),
  algilananElSayisi: $("#algilananElSayisi"), parmakDurumu: $("#parmakDurumu"),
  hedefTusDurumu: $("#hedefTusDurumu"), secimYuzdesi: $("#secimYuzdesi"),
  secimCubuguDolgu: $("#secimCubuguDolgu")
};

const durum = {
  yazilanMetin: "",
  seciliUlkeKodu: "TUR",
  kameraAkisi: null,
  elIsaretleyici: null,
  elIsaretleyiciSinifi: null,
  cizimAraci: null,
  modelYuklemeSozu: null,
  algilamaAnimasyonu: null,
  sonVideoZamani: -1,
  sonAlgilamaZamani: 0,
  sanalImlecX: innerWidth / 2,
  sanalImlecY: innerHeight / 2,
  sonHedefEleman: null,
  hedefeGirisZamani: 0,
  pinchAktif: false,
  pinchSecimiYapildi: false,
  pinchBaslangicHedefi: null,
  pinchBaslangicZamani: 0,
  sonSecimZamani: -Infinity,
  isaretParmagiGecmisi: [],
  basParmakGecmisi: [],
  pinchOranGecmisi: [],
  modalOncesiOdak: null,
  backendYapilandirildi: false,
  backendTestModu: false,
  sesAcik: true,
  sesBaglami: null,
  sesAnaKazanci: null,
  sesHazir: false,
  islemeAktif: false,
  islemeZamanlayicilari: [],
  islemeAnimasyonu: null,
  islemeParcaciklari: [],
  islemeParcacikRengi: "#17d5d0",
  islemeKareSayisi: 0,
  ulkeKarsilamaZamanlayicilari: [],
  enerjiIzi: [],
  ortakHafizaHazir: false,
  ortakHafizaIzleri: [],
  ortakHafizaNoktalari: [],
  hafizaAnimasyonu: null,
  hafizaSeciliIndex: -1,
  hafizaOncesiOdak: null,
  ortakHafizaKayitMetni: "",
  ortakHafizaKayitId: "",
  hafizaSifirlamaGonderildi: false
};

const elCanvasContext = arayuz.elCanvas.getContext("2d");
const enerjiIziContext = arayuz.enerjiIziCanvas.getContext("2d");
const islemeParcacikContext = arayuz.islemeParcacikCanvas.getContext("2d");
const ortakHafizaContext = arayuz.ortakHafizaCanvas.getContext("2d");

function sayiyiSinirla(deger, min, max) { return Math.min(Math.max(deger, min), max); }
function noktaMesafesi(a, b) {
  const x = a.x - b.x, y = a.y - b.y, z = (a.z || 0) - (b.z || 0);
  return Math.hypot(x, y, z);
}
function ortalamaNokta(noktalar) {
  if (!noktalar.length) return null;
  const toplam = noktalar.reduce((t, n) => ({x:t.x+n.x, y:t.y+n.y, z:t.z+(n.z||0)}), {x:0,y:0,z:0});
  return {x:toplam.x/noktalar.length, y:toplam.y/noktalar.length, z:toplam.z/noktalar.length};
}
function gecmiseNoktaEkle(liste, nokta) {
  liste.push({x:nokta.x, y:nokta.y, z:nokta.z || 0});
  if (liste.length > AYARLAR.gecmisPencereBoyutu) liste.shift();
  return ortalamaNokta(liste);
}
function gecmiseOranEkle(deger) {
  durum.pinchOranGecmisi.push(deger);
  if (durum.pinchOranGecmisi.length > AYARLAR.gecmisPencereBoyutu) durum.pinchOranGecmisi.shift();
  return durum.pinchOranGecmisi.reduce((a,b) => a+b, 0) / durum.pinchOranGecmisi.length;
}
function durumGuncelle(metin, nokta, sinif, yazi) {
  metin.textContent = yazi;
  nokta.className = "durum-noktasi " + sinif;
}
function bildirimGoster(mesaj) {
  arayuz.bildirim.textContent = mesaj;
  arayuz.bildirim.classList.add("goster");
  clearTimeout(bildirimGoster.zamanlayici);
  bildirimGoster.zamanlayici = setTimeout(() => arayuz.bildirim.classList.remove("goster"), 2300);
}

async function sesBaglaminiHazirla() {
  if (!durum.sesAcik) return null;
  if (!durum.sesBaglami) {
    const AudioContextSinifi = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextSinifi) return null;
    durum.sesBaglami = new AudioContextSinifi();
    durum.sesAnaKazanci = durum.sesBaglami.createGain();
    durum.sesAnaKazanci.gain.value = .78;
    durum.sesAnaKazanci.connect(durum.sesBaglami.destination);
  }
  if (durum.sesBaglami.state !== "running") {
    try { await durum.sesBaglami.resume(); } catch (_) { return null; }
  }
  durum.sesHazir = durum.sesBaglami.state === "running";
  return durum.sesHazir ? durum.sesBaglami : null;
}

function tonCal(frekans, sure = .12, sesSeviyesi = .035, gecikme = 0, tur = "sine") {
  const baglam = durum.sesBaglami;
  if (!durum.sesAcik || !baglam || baglam.state !== "running") return false;
  const baslangic = baglam.currentTime + gecikme;
  const osilator = baglam.createOscillator();
  const kazanc = baglam.createGain();
  osilator.type = tur;
  osilator.frequency.setValueAtTime(frekans, baslangic);
  osilator.frequency.exponentialRampToValueAtTime(Math.max(45, frekans * .72), baslangic + sure);
  kazanc.gain.setValueAtTime(.0001, baslangic);
  kazanc.gain.exponentialRampToValueAtTime(sesSeviyesi, baslangic + .012);
  kazanc.gain.exponentialRampToValueAtTime(.0001, baslangic + sure);
  osilator.connect(kazanc).connect(durum.sesAnaKazanci || baglam.destination);
  osilator.start(baslangic);
  osilator.stop(baslangic + sure + .02);
  return true;
}

function secimSesiCal() { tonCal(480, .09, .038, 0, "triangle"); tonCal(760, .08, .024, .025, "sine"); }
function runeVurusSesiCal(sira) { tonCal(150 + (sira % 4) * 18, .24, .11, 0, "triangle"); tonCal(620 + (sira % 5) * 62, .18, .045, .018, "sine"); }
function muhurSesiCal() { tonCal(130, .76, .14, 0, "sine"); tonCal(260, .68, .075, .06, "triangle"); tonCal(520, .58, .045, .12, "sine"); }

async function sesDurumunuDegistir() {
  durum.sesAcik = !durum.sesAcik;
  arayuz.sesButonu.setAttribute("aria-pressed", String(durum.sesAcik));
  arayuz.sesButonu.setAttribute("aria-label", durum.sesAcik ? "Sesi kapat" : "Sesi aç");
  arayuz.sesButonu.innerHTML = durum.sesAcik ? '♫ <span>SES AÇIK</span>' : '♩ <span>SES KAPALI</span>';
  if (!durum.sesAcik) {
    durum.sesHazir = false;
    if (durum.sesBaglami?.state === "running") await durum.sesBaglami.suspend().catch(() => {});
    bildirimGoster("Ses kapatıldı.");
    return;
  }

  const baglam = await sesBaglaminiHazirla();
  if (!baglam) {
    durum.sesAcik = false;
    arayuz.sesButonu.setAttribute("aria-pressed", "false");
    arayuz.sesButonu.setAttribute("aria-label", "Sesi aç");
    arayuz.sesButonu.innerHTML = '♩ <span>SES KAPALI</span>';
    bildirimGoster("Tarayıcı sesi başlatamadı. Sekmenin sessiz olmadığını kontrol et.");
    return;
  }
  tonCal(440, .16, .07, 0, "triangle");
  tonCal(660, .16, .06, .12, "triangle");
  tonCal(880, .22, .055, .24, "sine");
  bildirimGoster("Ses açıldı · test melodisi çalıyor.");
}

function canvasBoyutlandir(canvas, context) {
  const oran = Math.min(window.devicePixelRatio || 1, 2);
  const genislik = Math.max(1, Math.round(innerWidth * oran));
  const yukseklik = Math.max(1, Math.round(innerHeight * oran));
  if (canvas.width !== genislik || canvas.height !== yukseklik) {
    canvas.width = genislik;
    canvas.height = yukseklik;
    context.setTransform(oran, 0, 0, oran, 0, 0);
  }
}

function enerjiIziniCiz() {
  canvasBoyutlandir(arayuz.enerjiIziCanvas, enerjiIziContext);
  enerjiIziContext.clearRect(0, 0, innerWidth, innerHeight);
  const simdi = performance.now();
  durum.enerjiIzi = durum.enerjiIzi.filter(nokta => simdi - nokta.zaman < 560);
  if (durum.enerjiIzi.length < 2) return;

  enerjiIziContext.lineCap = "round";
  for (let i = 1; i < durum.enerjiIzi.length; i++) {
    const onceki = durum.enerjiIzi[i - 1];
    const nokta = durum.enerjiIzi[i];
    const yas = sayiyiSinirla(1 - (simdi - nokta.zaman) / 560, 0, 1);
    enerjiIziContext.beginPath();
    enerjiIziContext.moveTo(onceki.x, onceki.y);
    enerjiIziContext.lineTo(nokta.x, nokta.y);
    enerjiIziContext.strokeStyle = nokta.pinch ? `rgba(255,213,112,${yas * .85})` : `rgba(23,226,216,${yas * .68})`;
    enerjiIziContext.lineWidth = 1 + yas * (nokta.pinch ? 8 : 5);
    enerjiIziContext.shadowBlur = 12 + yas * 14;
    enerjiIziContext.shadowColor = nokta.pinch ? "#ffd570" : "#17e2d8";
    enerjiIziContext.stroke();
  }
  enerjiIziContext.shadowBlur = 0;
}

function enerjiIziniTemizle() {
  durum.enerjiIzi = [];
  enerjiIziContext.clearRect(0, 0, arayuz.enerjiIziCanvas.width, arayuz.enerjiIziCanvas.height);
}

function islemeParcaciklariniBaslat() {
  if (durum.islemeAnimasyonu) cancelAnimationFrame(durum.islemeAnimasyonu);
  canvasBoyutlandir(arayuz.islemeParcacikCanvas, islemeParcacikContext);
  durum.islemeParcacikRengi = (ULKE_HARITASI[durum.seciliUlkeKodu] || ULKE_HARITASI.TUR).renk;
  durum.islemeParcaciklari = [];
  durum.islemeKareSayisi = 0;
  const merkezX = innerWidth / 2;
  const merkezY = innerHeight * .52;
  for (let i = 0; i < 150; i++) {
    const aci = Math.random() * Math.PI * 2;
    const hiz = 1.1 + Math.random() * 4.2;
    durum.islemeParcaciklari.push({x:merkezX,y:merkezY,oncekiX:merkezX,oncekiY:merkezY,vx:Math.cos(aci)*hiz,vy:Math.sin(aci)*hiz-.6,omur:55+Math.random()*85,yas:Math.random()*26,boyut:1+Math.random()*2.8,altin:i%3===0,cizgi:i%4===0});
  }

  function ciz() {
    durum.islemeKareSayisi++;
    if (durum.islemeAktif && durum.islemeKareSayisi % 4 === 0 && durum.islemeParcaciklari.length < 340) {
      const tasKutusu = arayuz.islemeTas.getBoundingClientRect();
      const x = tasKutusu.left + Math.random() * tasKutusu.width;
      const y = tasKutusu.top + tasKutusu.height * (.12 + Math.random() * .76);
      durum.islemeParcaciklari.push({x,y,oncekiX:x,oncekiY:y,vx:(Math.random()-.5)*.28,vy:-.18-Math.random()*.42,omur:45+Math.random()*55,yas:0,boyut:.45+Math.random()*1.15,altin:Math.random()>.42,cizgi:false,toz:true});
    }
    islemeParcacikContext.clearRect(0, 0, innerWidth, innerHeight);
    durum.islemeParcaciklari = durum.islemeParcaciklari.filter(p => p.yas < p.omur);
    for (const p of durum.islemeParcaciklari) {
      if (p.yas >= p.omur) continue;
      p.yas++;
      p.oncekiX = p.x;
      p.oncekiY = p.y;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.toz ? .996 : .982;
      p.vy = p.vy * (p.toz ? .996 : .986) + (p.toz ? -.001 : .026);
      const alfa = Math.sin(Math.PI * p.yas / p.omur) * (p.toz ? .38 : .94);
      islemeParcacikContext.beginPath();
      if (p.cizgi) {
        islemeParcacikContext.moveTo(p.oncekiX,p.oncekiY);
        islemeParcacikContext.lineTo(p.x-p.vx*1.8,p.y-p.vy*1.8);
      } else {
        islemeParcacikContext.arc(p.x,p.y,p.boyut,0,Math.PI*2);
      }
      islemeParcacikContext.globalAlpha = alfa;
      islemeParcacikContext.fillStyle = p.altin ? "#FFD267" : durum.islemeParcacikRengi;
      islemeParcacikContext.strokeStyle = p.altin ? "#FFD267" : durum.islemeParcacikRengi;
      islemeParcacikContext.lineWidth = Math.max(.6,p.boyut*.72);
      islemeParcacikContext.shadowBlur = p.toz ? 7 : 16;
      islemeParcacikContext.shadowColor = p.altin ? "#efbd55" : durum.islemeParcacikRengi;
      if (p.cizgi) islemeParcacikContext.stroke(); else islemeParcacikContext.fill();
    }
    islemeParcacikContext.globalAlpha = 1;
    islemeParcacikContext.shadowBlur = 0;
    if (durum.islemeAktif) durum.islemeAnimasyonu = requestAnimationFrame(ciz);
  }
  durum.islemeAnimasyonu = requestAnimationFrame(ciz);
}

function islemeKivilcimPatlat(eleman, guc = 1) {
  if (!durum.islemeAktif || !eleman) return;
  const kutu = eleman.getBoundingClientRect();
  const x = kutu.left + kutu.width / 2;
  const y = kutu.top + kutu.height / 2;
  const adet = Math.round(18 + guc * 14);
  for (let i = 0; i < adet; i++) {
    const aci = Math.random() * Math.PI * 2;
    const hiz = (.8 + Math.random() * 3.8) * guc;
    durum.islemeParcaciklari.push({x,y,oncekiX:x,oncekiY:y,vx:Math.cos(aci)*hiz,vy:Math.sin(aci)*hiz-.35,omur:24+Math.random()*32,yas:0,boyut:.7+Math.random()*1.9,altin:i%4!==0,cizgi:i%3===0});
  }
}

function tasDarbeEfekti(simge, sira, toplam) {
  const tasKutusu = arayuz.islemeTas.getBoundingClientRect();
  const simgeKutusu = simge.getBoundingClientRect();
  const x = ((simgeKutusu.left + simgeKutusu.width/2 - tasKutusu.left) / tasKutusu.width) * 100;
  const y = ((simgeKutusu.top + simgeKutusu.height/2 - tasKutusu.top) / tasKutusu.height) * 100;
  arayuz.islemeTas.style.setProperty("--darbe-x", `${sayiyiSinirla(x,8,92)}%`);
  arayuz.islemeTas.style.setProperty("--darbe-y", `${sayiyiSinirla(y,8,88)}%`);
  arayuz.islemeTas.classList.remove("darbe");
  void arayuz.islemeTas.offsetWidth;
  arayuz.islemeTas.classList.add("darbe");
  islemeKivilcimPatlat(simge, toplam < 9 ? 1.18 : .82);
  const oran = (sira + 1) / Math.max(1, toplam);
  if (oran >= .28) arayuz.islemeCatlaklari.classList.add("kademe-1");
  if (oran >= .58) arayuz.islemeCatlaklari.classList.add("kademe-2");
  if (oran >= .86) arayuz.islemeCatlaklari.classList.add("kademe-3");
}

function islemeZamanla(islem, sure) {
  const kimlik = setTimeout(islem, sure);
  durum.islemeZamanlayicilari.push(kimlik);
}

function islemeToreniniBitir() {
  if (!durum.islemeAktif) return;
  durum.islemeAktif = false;
  durum.islemeZamanlayicilari.forEach(clearTimeout);
  durum.islemeZamanlayicilari = [];
  if (durum.islemeAnimasyonu) cancelAnimationFrame(durum.islemeAnimasyonu);
  durum.islemeAnimasyonu = null;
  durum.islemeParcaciklari = [];
  islemeParcacikContext.clearRect(0,0,arayuz.islemeParcacikCanvas.width,arayuz.islemeParcacikCanvas.height);
  arayuz.tasIslemeSahnesi.classList.add("gizli");
  arayuz.tasIslemeSahnesi.setAttribute("aria-hidden", "true");
  const oncekiOdak = durum.modalOncesiOdak;
  hatiraKartiniHazirla();
  durum.modalOncesiOdak = oncekiOdak;
  arayuz.hatiraModal.classList.add("sinematik-acilis");
  setTimeout(() => arayuz.hatiraModal.classList.remove("sinematik-acilis"), 1300);
}

async function tasIslemeToreniniBaslat() {
  if (!durum.yazilanMetin.trim()) {
    bildirimGoster("Hatıra kartı için önce ismini veya bir kelimeyi yaz.");
    return;
  }
  if (durum.islemeAktif) return;
  durum.ulkeKarsilamaZamanlayicilari.forEach(clearTimeout);
  durum.ulkeKarsilamaZamanlayicilari = [];
  arayuz.ulkeKarsilamaSahnesi.classList.add("gizli");
  arayuz.ulkeKarsilamaSahnesi.classList.remove("aktif", "cikis");
  arayuz.ulkeKarsilamaSahnesi.setAttribute("aria-hidden", "true");
  durum.modalOncesiOdak = document.activeElement;
  durum.islemeAktif = true;
  const sesHazir = await sesBaglaminiHazirla();
  if (durum.sesAcik && !sesHazir) {
    bildirimGoster("Ses açılamadı; deneyim sessiz devam ediyor. Ses düğmesini kapatıp yeniden açabilirsin.");
  }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    durum.islemeAktif = false;
    hatiraKartiniHazirla();
    return;
  }

  durum.islemeZamanlayicilari.forEach(clearTimeout);
  durum.islemeZamanlayicilari = [];
  const ulke = ULKE_HARITASI[durum.seciliUlkeKodu] || ULKE_HARITASI.TUR;
  const ucusX = (ulke.ucusX - .5) * 100;
  const ucusY = (ulke.ucusY - .46) * 100;
  const kuyrukAcisi = Math.atan2(ucusY * innerHeight, ucusX * innerWidth) * 180 / Math.PI;
  arayuz.tasIslemeSahnesi.style.setProperty("--ulke-rengi", ulke.renk);
  arayuz.islemeUlkeKumesi.style.left = `${ulke.ucusX * 100}%`;
  arayuz.islemeUlkeKumesi.style.top = `${ulke.ucusY * 100}%`;
  arayuz.islemeUlkeKodu.textContent = ulke.muhur;
  arayuz.islemeUlkeAdi.textContent = ulke.ad.toLocaleUpperCase("tr-TR");
  arayuz.islemeUlkeKumesi.classList.remove("hazir", "parliyor");
  arayuz.islemeYildizi.classList.remove("hazir", "ucuyor", "baglandi");
  arayuz.tasIslemeSahnesi.classList.remove("son-darbe");
  arayuz.islemeTas.classList.remove("darbe", "muhurlendi");
  arayuz.islemeCatlaklari.classList.remove("kademe-1", "kademe-2", "kademe-3");
  arayuz.islemeYildizi.style.setProperty("--ucus-x", `${ucusX}vw`);
  arayuz.islemeYildizi.style.setProperty("--ucus-y", `${ucusY}vh`);
  arayuz.islemeYildizi.style.setProperty("--kuyruk-acisi", `${kuyrukAcisi}deg`);
  const isaretler = kokTurkIsaretlerineCevir(durum.yazilanMetin);
  arayuz.islemeRuneleri.dataset.columns = String(Math.max(1, Math.min(4, Math.ceil(isaretler.length / 6))));
  const parca = document.createDocumentFragment();
  isaretler.forEach(isaret => {
    const simge = document.createElement("span");
    simge.textContent = isaret;
    parca.appendChild(simge);
  });
  arayuz.islemeRuneleri.replaceChildren(parca);
  arayuz.islemeLatinMetin.textContent = durum.yazilanMetin;
  arayuz.islemeIzNo.textContent = izNumarasiOlustur(durum.yazilanMetin);
  arayuz.islemeAsama.textContent = "DİJİTAL İZ HAZIRLANIYOR";
  arayuz.islemeBaslik.textContent = "İzin taşa işleniyor";
  arayuz.islemeIlerlemeDolgu.style.width = "4%";
  arayuz.tasIslemeSahnesi.classList.remove("gizli");
  arayuz.tasIslemeSahnesi.setAttribute("aria-hidden", "false");
  arayuz.islemeAtlaButonu.focus();
  tonCal(150,.7,.09,0,"sine");
  islemeParcaciklariniBaslat();

  const baslangic = 680;
  const adim = Math.max(62, Math.min(115, 1750 / Math.max(isaretler.length,1)));
  [...arayuz.islemeRuneleri.children].forEach((simge, i) => {
    islemeZamanla(() => {
      simge.classList.add("islendi");
      tasDarbeEfekti(simge, i, isaretler.length);
      if (i % 2 === 0 || isaretler.length < 9) runeVurusSesiCal(i);
      arayuz.islemeIlerlemeDolgu.style.width = `${12 + Math.round((i + 1) / isaretler.length * 67)}%`;
    }, baslangic + i * adim);
  });
  const islemeSonu = baslangic + isaretler.length * adim;
  islemeZamanla(() => {
    arayuz.islemeAsama.textContent = "KİŞİSEL YILDIZ OLUŞTURULUYOR";
    arayuz.islemeBaslik.textContent = `${ulke.ad} kümesi bulundu`;
    arayuz.islemeIlerlemeDolgu.style.width = "86%";
    arayuz.islemeUlkeKumesi.classList.add("hazir");
    arayuz.islemeYildizi.classList.add("hazir");
  }, islemeSonu + 280);
  islemeZamanla(() => {
    arayuz.islemeAsama.textContent = "ORTAK HAFIZAYA YOLCULUK";
    arayuz.islemeBaslik.textContent = `Yıldızın ${ulke.ad} kümesine ilerliyor`;
    arayuz.islemeIlerlemeDolgu.style.width = "94%";
    arayuz.islemeYildizi.classList.add("ucuyor");
    arayuz.islemeUlkeKumesi.classList.add("parliyor");
    tonCal(260,.8,.035,0,"sine");
    tonCal(520,.95,.025,.28,"triangle");
  }, islemeSonu + 780);
  islemeZamanla(() => {
    arayuz.islemeYildizi.classList.add("baglandi");
    arayuz.islemeTas.classList.add("muhurlendi");
    arayuz.tasIslemeSahnesi.classList.add("son-darbe");
    islemeKivilcimPatlat(arayuz.islemeTas, 2.15);
    arayuz.islemeAsama.textContent = "KÜMELER BİRBİRİNE BAĞLANDI";
    arayuz.islemeBaslik.textContent = `${ulke.ad} ortak gökyüzünde`;
    arayuz.islemeIlerlemeDolgu.style.width = "100%";
    muhurSesiCal();
  }, islemeSonu + 2300);
  islemeZamanla(islemeToreniniBitir, islemeSonu + 3050);
}

function epostaDurumuGoster(mesaj, tur = "") {
  arayuz.epostaGonderimDurumu.className = `eposta-gonderim-durumu ${tur}`.trim();
  arayuz.epostaGonderimDurumu.querySelector("span").textContent = mesaj;
}

function epostaGonderButonunuGuncelle() {
  arayuz.epostaGonderButonu.disabled = !durum.backendYapilandirildi || !epostaGecerliMi(arayuz.epostaAlani.value.trim());
}
function kokTurkceyeCevir(metin) { return kokTurkIsaretlerineCevir(metin).join(" "); }
function epostaGecerliMi(eposta) {
  return typeof eposta === "string" && eposta.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta);
}

function izNumarasiOlustur(metin) {
  const temiz = metin.replaceAll(" ", "") || "KOKIZ";
  let karma = 2166136261;
  for (const harf of temiz) {
    karma ^= harf.codePointAt(0);
    karma = Math.imul(karma, 16777619);
  }
  return "KIZ-" + String(Math.abs(karma) % 10000).padStart(4, "0");
}

function tamgaKodunuOlustur(metin) {
  let karma = 2166136261;
  const temiz = (metin || "KOKIZ").normalize("NFC").toLocaleUpperCase("tr-TR").replaceAll(" ", "");
  for (const harf of temiz) {
    karma ^= harf.codePointAt(0);
    karma = Math.imul(karma, 16777619);
  }
  return (karma >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

function tamgaCiz(canvas, kod, parlak = false) {
  const boyut = 240;
  canvas.width = boyut;
  canvas.height = boyut;
  const context = canvas.getContext("2d");
  const sayilar = [...kod].map(hane => Number.parseInt(hane, 16));
  context.clearRect(0, 0, boyut, boyut);
  context.save();
  context.translate(boyut / 2, boyut / 2);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = parlak ? "#FFE7A1" : "#82EFDF";
  context.lineWidth = parlak ? 8 : 7;
  context.shadowBlur = parlak ? 22 : 14;
  context.shadowColor = parlak ? "#E7BD61" : "#17D5D0";

  context.beginPath();
  context.moveTo(0, -82);
  context.lineTo(0, 82);
  context.stroke();

  for (let i = 0; i < 4; i++) {
    const seviye = -62 + i * 39;
    const uzunluk = 30 + (sayilar[i] % 4) * 9;
    const yukselme = ((sayilar[i + 4] % 5) - 2) * 8;
    const yon = sayilar[i] % 2 ? 1 : -1;
    context.beginPath();
    context.moveTo(0, seviye);
    context.lineTo(yon * uzunluk, seviye + yukselme);
    if (sayilar[i + 4] & 1) context.lineTo(yon * (uzunluk + 15), seviye + yukselme - 20);
    context.stroke();
    if (sayilar[i] & 4) {
      context.beginPath();
      context.moveTo(0, seviye + 8);
      context.lineTo(-yon * (uzunluk * .72), seviye - yukselme * .65);
      context.stroke();
    }
  }

  const altGenislik = 28 + (sayilar[7] % 4) * 8;
  context.beginPath();
  context.moveTo(-altGenislik, 82);
  context.lineTo(0, 62);
  context.lineTo(altGenislik, 82);
  context.stroke();
  context.restore();
}

function anonimKayitKimligiOlustur() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return Array.from({length:32}, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function ortakHafizaNoktalariniHazirla() {
  durum.ortakHafizaNoktalari = durum.ortakHafizaIzleri.map((iz, index) => {
    const karma = Number.parseInt(iz.tamga, 16) >>> 0;
    const ikinci = Number.parseInt(tamgaKodunuOlustur(iz.kayitId), 16) >>> 0;
    const ulke = ULKE_HARITASI[iz.ulke] || ULKE_HARITASI.TUR;
    return {
      iz,
      ulke,
      x:sayiyiSinirla(ulke.x + ((karma % 1000) / 999 - .5) * .18, .1, .9),
      y:sayiyiSinirla(ulke.y + ((ikinci % 1000) / 999 - .5) * .16, .22, .86),
      boyut:2.4 + ((karma >>> 12) % 36) / 10,
      faz:(ikinci % 628) / 100,
      index
    };
  });
}

function bayrakGorselleriniYukle() {
  ULKELER.forEach(ulke => {
    if (BAYRAK_GORSELLERI.has(ulke.kod)) return;
    const gorsel = new Image();
    gorsel.decoding = "async";
    gorsel.onload = () => {
      if (!arayuz.ortakHafizaSahnesi.classList.contains("gizli") && matchMedia("(prefers-reduced-motion: reduce)").matches) {
        ortakHafizaGogunuCiz(performance.now());
      }
    };
    gorsel.src = `assets/flags/${ulke.bayrak}`;
    BAYRAK_GORSELLERI.set(ulke.kod, gorsel);
  });
}

function ulkeBayrakMuhrunuCiz(ulke, x, y, yaricap) {
  const gorsel = BAYRAK_GORSELLERI.get(ulke.kod);
  const icYaricap = yaricap * .78;
  ortakHafizaContext.save();
  ortakHafizaContext.beginPath();
  ortakHafizaContext.arc(x,y,yaricap,0,Math.PI*2);
  ortakHafizaContext.fillStyle = "rgba(0,16,17,.9)";
  ortakHafizaContext.shadowBlur = 22;
  ortakHafizaContext.shadowColor = ulke.renk;
  ortakHafizaContext.fill();
  ortakHafizaContext.shadowBlur = 0;

  if (gorsel?.complete && gorsel.naturalWidth > 0) {
    ortakHafizaContext.beginPath();
    ortakHafizaContext.arc(x,y,icYaricap,0,Math.PI*2);
    ortakHafizaContext.clip();
    const hedefBoyut = icYaricap * 2;
    const oran = gorsel.naturalWidth / gorsel.naturalHeight;
    const genislik = oran >= 1 ? hedefBoyut * oran : hedefBoyut;
    const yukseklik = oran >= 1 ? hedefBoyut : hedefBoyut / oran;
    ortakHafizaContext.imageSmoothingEnabled = true;
    ortakHafizaContext.imageSmoothingQuality = "high";
    ortakHafizaContext.drawImage(gorsel,x-genislik/2,y-yukseklik/2,genislik,yukseklik);
    const parlama = ortakHafizaContext.createLinearGradient(x-yaricap,y-yaricap,x+yaricap,y+yaricap);
    parlama.addColorStop(0,"rgba(255,255,255,.34)");
    parlama.addColorStop(.43,"rgba(255,255,255,0)");
    parlama.addColorStop(1,"rgba(0,0,0,.2)");
    ortakHafizaContext.fillStyle = parlama;
    ortakHafizaContext.fillRect(x-yaricap,y-yaricap,yaricap*2,yaricap*2);
  } else {
    ortakHafizaContext.fillStyle = ulke.renk;
    ortakHafizaContext.font = `800 ${Math.round(yaricap*.72)}px Cinzel, serif`;
    ortakHafizaContext.textAlign = "center";
    ortakHafizaContext.textBaseline = "middle";
    ortakHafizaContext.fillText(ulke.muhur,x,y+1);
  }
  ortakHafizaContext.restore();

  ortakHafizaContext.save();
  ortakHafizaContext.beginPath();
  ortakHafizaContext.arc(x,y,yaricap,0,Math.PI*2);
  ortakHafizaContext.strokeStyle = ulke.renk;
  ortakHafizaContext.lineWidth = 1.5;
  ortakHafizaContext.shadowBlur = 12;
  ortakHafizaContext.shadowColor = ulke.renk;
  ortakHafizaContext.stroke();
  ortakHafizaContext.beginPath();
  ortakHafizaContext.arc(x,y,icYaricap,0,Math.PI*2);
  ortakHafizaContext.strokeStyle = "rgba(255,244,205,.72)";
  ortakHafizaContext.lineWidth = .7;
  ortakHafizaContext.stroke();
  ortakHafizaContext.restore();
}

function hafizaCanvasBoyutlandir() {
  const oran = Math.min(window.devicePixelRatio || 1, 2);
  const genislik = Math.max(1, arayuz.ortakHafizaSahnesi.clientWidth);
  const yukseklik = Math.max(1, arayuz.ortakHafizaSahnesi.clientHeight);
  const pikselGenislik = Math.round(genislik * oran);
  const pikselYukseklik = Math.round(yukseklik * oran);
  if (arayuz.ortakHafizaCanvas.width !== pikselGenislik || arayuz.ortakHafizaCanvas.height !== pikselYukseklik) {
    arayuz.ortakHafizaCanvas.width = pikselGenislik;
    arayuz.ortakHafizaCanvas.height = pikselYukseklik;
    ortakHafizaContext.setTransform(oran, 0, 0, oran, 0, 0);
  }
  return {genislik, yukseklik};
}

function ortakHafizaGogunuCiz(zaman = 0) {
  if (arayuz.ortakHafizaSahnesi.classList.contains("gizli")) return;
  const {genislik, yukseklik} = hafizaCanvasBoyutlandir();
  ortakHafizaContext.clearRect(0, 0, genislik, yukseklik);
  const hareketAz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const merkezX = genislik * .54;
  const merkezY = yukseklik * .54;

  ortakHafizaContext.save();
  for (let halka = 1; halka <= 4; halka++) {
    ortakHafizaContext.beginPath();
    ortakHafizaContext.arc(merkezX, merkezY, Math.min(genislik,yukseklik) * (.1 + halka * .095), 0, Math.PI * 2);
    ortakHafizaContext.strokeStyle = halka % 2 ? "rgba(23,213,208,.09)" : "rgba(231,189,97,.08)";
    ortakHafizaContext.lineWidth = 1;
    ortakHafizaContext.stroke();
  }

  ULKELER.forEach((ulke, ulkeIndex) => {
    const x = ulke.x * genislik;
    const y = ulke.y * yukseklik;
    const desenYaricapi = Math.min(genislik,yukseklik) * .085;
    ortakHafizaContext.beginPath();
    ortakHafizaContext.setLineDash([3,7]);
    ortakHafizaContext.arc(x,y,desenYaricapi,0,Math.PI*2);
    ortakHafizaContext.strokeStyle = `${ulke.renk}38`;
    ortakHafizaContext.stroke();
    ortakHafizaContext.setLineDash([]);

    const desenSayisi = 4 + (ulkeIndex % 4) * 2;
    for (let desenIndex = 0; desenIndex < desenSayisi; desenIndex++) {
      const aci = (Math.PI * 2 * desenIndex) / desenSayisi + ulkeIndex * .19;
      const ic = desenYaricapi * (.68 + (desenIndex % 2) * .09);
      const dis = desenYaricapi * (1 + (ulkeIndex % 3) * .05);
      ortakHafizaContext.beginPath();
      ortakHafizaContext.moveTo(x + Math.cos(aci) * ic, y + Math.sin(aci) * ic);
      ortakHafizaContext.lineTo(x + Math.cos(aci) * dis, y + Math.sin(aci) * dis);
      ortakHafizaContext.strokeStyle = `${ulke.renk}62`;
      ortakHafizaContext.lineWidth = ulkeIndex % 2 ? 1.2 : .8;
      ortakHafizaContext.stroke();
    }

    const bayrakYaricapi = Math.min(30,Math.max(17,Math.min(genislik,yukseklik)*.026));
    ulkeBayrakMuhrunuCiz(ulke,x,y,bayrakYaricapi);

    ortakHafizaContext.fillStyle = `${ulke.renk}88`;
    ortakHafizaContext.font = "700 9px Inter, sans-serif";
    ortakHafizaContext.textAlign = "center";
    ortakHafizaContext.fillText(ulke.ad.toLocaleUpperCase("tr-TR"), x, y - Math.min(genislik,yukseklik)*.092);
  });

  const noktalar = durum.ortakHafizaNoktalari;
  ortakHafizaContext.lineWidth = .65;
  const sonUlkeNoktasi = new Map();
  for (const nokta of noktalar) {
    const onceki = sonUlkeNoktasi.get(nokta.ulke.kod);
    sonUlkeNoktasi.set(nokta.ulke.kod, nokta);
    if (!onceki) continue;
    const x1 = onceki.x * genislik, y1 = onceki.y * yukseklik;
    const x2 = nokta.x * genislik, y2 = nokta.y * yukseklik;
    ortakHafizaContext.beginPath();
    ortakHafizaContext.moveTo(x1,y1);
    ortakHafizaContext.lineTo(x2,y2);
    ortakHafizaContext.strokeStyle = `${nokta.ulke.renk}42`;
    ortakHafizaContext.stroke();
  }

  const temsilciler = ULKELER.map(ulke => sonUlkeNoktasi.get(ulke.kod)).filter(Boolean);
  if (temsilciler.length > 1) {
    ortakHafizaContext.beginPath();
    temsilciler.forEach((nokta,index) => {
      const x=nokta.x*genislik, y=nokta.y*yukseklik;
      if (!index) ortakHafizaContext.moveTo(x,y); else ortakHafizaContext.lineTo(x,y);
    });
    ortakHafizaContext.strokeStyle = "rgba(255,220,137,.22)";
    ortakHafizaContext.lineWidth = 1.1;
    ortakHafizaContext.stroke();
  }

  noktalar.forEach((nokta, index) => {
    const x = nokta.x * genislik;
    const y = nokta.y * yukseklik;
    const secili = index === durum.hafizaSeciliIndex;
    const son = index === noktalar.length - 1;
    const nabiz = hareketAz ? 1 : .76 + Math.sin(zaman / 620 + nokta.faz) * .24;
    const yaricap = nokta.boyut * (secili ? 2.1 : son ? 1.55 : 1) * nabiz;
    const renk = nokta.ulke.renk;
    ortakHafizaContext.beginPath();
    ortakHafizaContext.arc(x,y,Math.max(1.5,yaricap),0,Math.PI*2);
    ortakHafizaContext.fillStyle = secili ? "#FFF4C4" : renk;
    ortakHafizaContext.shadowBlur = secili ? 32 : son ? 24 : 13;
    ortakHafizaContext.shadowColor = renk;
    ortakHafizaContext.fill();
    if (secili || son) {
      ortakHafizaContext.beginPath();
      ortakHafizaContext.arc(x,y,Math.max(10,yaricap*3.2),0,Math.PI*2);
      ortakHafizaContext.strokeStyle = secili ? "rgba(255,231,161,.7)" : "rgba(23,213,208,.34)";
      ortakHafizaContext.stroke();
    }
  });
  ortakHafizaContext.restore();
  if (!hareketAz) durum.hafizaAnimasyonu = requestAnimationFrame(ortakHafizaGogunuCiz);
}

function hafizaSeciminiGuncelle(index) {
  durum.hafizaSeciliIndex = index;
  const nokta = durum.ortakHafizaNoktalari[index];
  if (!nokta) {
    arayuz.hafizaSeciliIzNo.textContent = "Gökyüzünü keşfet";
    arayuz.hafizaSeciliUlke.textContent = "DİJİTAL İZ";
    arayuz.hafizaSeciliUlke.style.color = "";
    tamgaCiz(arayuz.hafizaTamga, "00000000");
    return;
  }
  arayuz.hafizaSeciliIzNo.textContent = nokta.iz.izNo;
  arayuz.hafizaSeciliUlke.textContent = nokta.ulke.ad.toLocaleUpperCase("tr-TR");
  arayuz.hafizaSeciliUlke.style.color = nokta.ulke.renk;
  tamgaCiz(arayuz.hafizaTamga, nokta.iz.tamga, true);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) ortakHafizaGogunuCiz();
}

function hafizaIsaretcisiniGuncelle(olay) {
  const dikdortgen = arayuz.ortakHafizaCanvas.getBoundingClientRect();
  const x = olay.clientX - dikdortgen.left;
  const y = olay.clientY - dikdortgen.top;
  let enYakin = -1;
  let uzaklik = 26;
  durum.ortakHafizaNoktalari.forEach((nokta, index) => {
    const yeniUzaklik = Math.hypot(x - nokta.x * dikdortgen.width, y - nokta.y * dikdortgen.height);
    if (yeniUzaklik < uzaklik) { uzaklik = yeniUzaklik; enYakin = index; }
  });
  if (enYakin !== durum.hafizaSeciliIndex) hafizaSeciminiGuncelle(enYakin);
}

function ortakHafizaVerisiniUygula(veri) {
  durum.ortakHafizaIzleri = Array.isArray(veri.izler) ? veri.izler : [];
  ortakHafizaNoktalariniHazirla();
  arayuz.hafizaToplam.textContent = String(Number(veri.toplam) || durum.ortakHafizaIzleri.length);
  arayuz.hafizaSonIz.textContent = durum.ortakHafizaIzleri.at(-1)?.izNo || "İLK İZİ BEKLİYOR";
  const sayilar = Object.fromEntries(ULKELER.map(ulke => [ulke.kod,0]));
  durum.ortakHafizaIzleri.forEach(iz => { sayilar[ULKE_HARITASI[iz.ulke] ? iz.ulke : "TUR"]++; });
  const ulkeOzeti = document.createDocumentFragment();
  ULKELER.forEach(ulke => {
    const satir = document.createElement("div");
    satir.style.setProperty("--ulke-rengi", ulke.renk);
    satir.innerHTML = `<i></i><span>${ulke.ad}</span><strong>${sayilar[ulke.kod]}</strong>`;
    ulkeOzeti.appendChild(satir);
  });
  arayuz.hafizaUlkeOzeti.replaceChildren(ulkeOzeti);
  arayuz.hafizaDurumu.textContent = durum.ortakHafizaIzleri.length ? "Bir ışığa dokunarak kişisel tamgayı keşfet." : "Gökyüzü ilk anonim izi bekliyor.";
  hafizaSeciminiGuncelle(durum.ortakHafizaIzleri.length ? durum.ortakHafizaIzleri.length - 1 : -1);
}

async function ortakHafizayiYukle() {
  try {
    const yanit = await fetch("/api/ortak-hafiza", {headers:{"Accept":"application/json"}, cache:"no-store"});
    if (!yanit.ok) throw new Error("Ortak hafıza servisi yanıt vermedi.");
    ortakHafizaVerisiniUygula(await yanit.json());
  } catch {
    ortakHafizaVerisiniUygula({toplam:0,izler:[]});
    arayuz.hafizaDurumu.textContent = "Ortak hafıza için güncel sunucuyu yeniden başlat.";
  }
}

async function iziOrtakHafizayaKaydet() {
  if (!durum.yazilanMetin.trim()) return;
  const kayitAnahtari = `${durum.seciliUlkeKodu}|${durum.yazilanMetin}`;
  if (durum.ortakHafizaKayitMetni !== kayitAnahtari) {
    durum.ortakHafizaKayitMetni = kayitAnahtari;
    durum.ortakHafizaKayitId = anonimKayitKimligiOlustur();
  }
  try {
    const yanit = await fetch("/api/ortak-hafiza", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        kayitId:durum.ortakHafizaKayitId,
        izNo:izNumarasiOlustur(durum.yazilanMetin),
        tamga:tamgaKodunuOlustur(durum.yazilanMetin),
        ulke:durum.seciliUlkeKodu
      })
    });
    if (!yanit.ok) throw new Error("Kayıt eklenemedi.");
    ortakHafizaVerisiniUygula(await yanit.json());
  } catch {
    bildirimGoster("Hatıra kartın hazır; ortak hafıza kaydı daha sonra yeniden denenebilir.");
  }
}

async function ortakHafizayiAc() {
  durum.hafizaOncesiOdak = document.activeElement;
  arayuz.ortakHafizaSahnesi.classList.remove("gizli");
  document.body.style.overflow = "hidden";
  arayuz.hafizaKapatButonu.focus();
  await ortakHafizayiYukle();
  if (durum.hafizaAnimasyonu) cancelAnimationFrame(durum.hafizaAnimasyonu);
  ortakHafizaGogunuCiz(performance.now());
}

function ortakHafizayiKapat() {
  arayuz.ortakHafizaSahnesi.classList.add("gizli");
  if (durum.hafizaAnimasyonu) cancelAnimationFrame(durum.hafizaAnimasyonu);
  durum.hafizaAnimasyonu = null;
  document.body.style.overflow = "";
  durum.hafizaOncesiOdak?.focus?.();
}

function ulkeKarsilamasiniGoster(ulke) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  durum.ulkeKarsilamaZamanlayicilari.forEach(clearTimeout);
  durum.ulkeKarsilamaZamanlayicilari = [];
  const ulkeIndex = Math.max(0, ULKELER.findIndex(kayit => kayit.kod === ulke.kod));
  const sahne = arayuz.ulkeKarsilamaSahnesi;
  sahne.style.setProperty("--ulke-rengi", ulke.renk);
  sahne.style.setProperty("--desen-acisi", `${18 + ulkeIndex * 3}deg`);
  sahne.style.setProperty("--desen-donus", `${ulkeIndex * 11}deg`);
  sahne.style.setProperty("--kol-donus", `${ulkeIndex * 5.5}deg`);
  sahne.style.setProperty("--kol-uzunluk", `${35 + (ulkeIndex % 4) * 4}%`);
  sahne.style.setProperty("--motif-kenar", ulkeIndex % 3 === 1 ? "20%" : ulkeIndex % 3 === 2 ? "36%" : "50%");
  sahne.dataset.ulke = ulke.kod;
  arayuz.ulkeKarsilamaKodu.textContent = ulke.muhur;
  arayuz.ulkeKarsilamaAdi.textContent = ulke.ad.toLocaleUpperCase("tr-TR");
  arayuz.ulkeKarsilamaMetni.textContent = `${ulke.kaynak} ortak hafızaya bir iz`;
  arayuz.ulkeKarsilamaBayrakGorseli.src = `assets/flags/${ulke.bayrak}`;
  arayuz.ulkeKarsilamaBayragi.setAttribute("aria-label", `${ulke.ad} bayrağı dalgalanıyor`);
  sahne.classList.remove("gizli", "aktif", "cikis");
  sahne.setAttribute("aria-hidden", "false");
  void sahne.offsetWidth;
  sahne.classList.add("aktif");
  void sesBaglaminiHazirla().then(baglam => {
    if (!baglam || !durum.sesAcik) return;
    tonCal(220 + ulkeIndex * 18,.32,.035,0,"sine");
    tonCal(330 + ulkeIndex * 22,.42,.026,.09,"triangle");
  });
  durum.ulkeKarsilamaZamanlayicilari.push(setTimeout(() => sahne.classList.add("cikis"), 1700));
  durum.ulkeKarsilamaZamanlayicilari.push(setTimeout(() => {
    sahne.classList.add("gizli");
    sahne.classList.remove("aktif", "cikis");
    sahne.setAttribute("aria-hidden", "true");
  }, 2140));
}

function kartUlkeMuhrunuGuncelle() {
  const ulke = ULKE_HARITASI[durum.seciliUlkeKodu] || ULKE_HARITASI.TUR;
  arayuz.kartUlkeMuhru.style.setProperty("--ulke-rengi", ulke.renk);
  arayuz.kartUlkeMuhru.querySelector("span").textContent = ulke.muhur;
  arayuz.kartUlkeMuhru.querySelector("strong").textContent = ulke.ad.toLocaleUpperCase("tr-TR");
}

function ulkeSec(kod, bildirim = true) {
  const ulke = ULKE_HARITASI[kod];
  if (!ulke) return;
  durum.seciliUlkeKodu = ulke.kod;
  durum.ortakHafizaKayitMetni = "";
  durum.ortakHafizaKayitId = "";
  arayuz.secilenUlkeAdi.textContent = ulke.ad.toLocaleUpperCase("tr-TR");
  arayuz.secilenUlkeAdi.style.color = ulke.renk;
  [...arayuz.ulkeSecimi.children].forEach(tus => {
    const secili = tus.dataset.ulke === ulke.kod;
    tus.classList.toggle("secili", secili);
    tus.setAttribute("aria-checked", String(secili));
  });
  kartUlkeMuhrunuGuncelle();
  if (bildirim) {
    ulkeKarsilamasiniGoster(ulke);
    bildirimGoster(`${ulke.ad} kök coğrafyası seçildi.`);
  }
}

function ulkeSeciminiOlustur() {
  const parca = document.createDocumentFragment();
  ULKELER.forEach(ulke => {
    const bayrakOnYukleme = new Image();
    bayrakOnYukleme.src = `assets/flags/${ulke.bayrak}`;
    const tus = document.createElement("button");
    tus.type = "button";
    tus.className = "ulke-tusu hedeflenebilir";
    tus.dataset.ulke = ulke.kod;
    tus.style.setProperty("--ulke-rengi", ulke.renk);
    tus.setAttribute("role", "radio");
    tus.setAttribute("aria-label", ulke.ad);
    tus.setAttribute("aria-checked", "false");
    tus.textContent = ulke.kisa;
    tus.addEventListener("click", () => ulkeSec(ulke.kod));
    parca.appendChild(tus);
  });
  arayuz.ulkeSecimi.replaceChildren(parca);
  ulkeSec("TUR", false);
}

function klavyeyiOlustur() {
  const parca = document.createDocumentFragment();
  KLAVYE_SATIRLARI.forEach(satirHarfleri => {
    const satir = document.createElement("div");
    satir.className = "klavye-satiri";
    satirHarfleri.forEach(harf => {
      const tus = document.createElement("button");
      tus.type = "button";
      tus.className = "harf-tusu hedeflenebilir";
      tus.dataset.harf = harf;
      tus.setAttribute("aria-label", harf + " harfi");
      tus.innerHTML = `<span class="latin-harf">${harf}</span><span class="kokturk-harf">${kokTurkKlavyeEtiketi(harf)}</span>`;
      tus.addEventListener("click", () => harfEkle(harf));
      satir.appendChild(tus);
    });
    parca.appendChild(satir);
  });
  arayuz.klavye.replaceChildren(parca);
}

function runeSutunlariniOlustur(metin, hedef) {
  const karakterler = kokTurkIsaretlerineCevir(metin);
  const sutunSayisi = Math.max(1, Math.min(4, Math.ceil(karakterler.length / 6)));
  const parca = document.createDocumentFragment();
  for (let sutunIndex = 0; sutunIndex < sutunSayisi; sutunIndex++) {
    const sutun = document.createElement("div");
    sutun.className = "rune-sutunu";
    karakterler.slice(sutunIndex * 6, (sutunIndex + 1) * 6).forEach((rune, i) => {
      const simge = document.createElement("span");
      simge.textContent = rune;
      simge.style.animationDelay = `${(sutunIndex * 6 + i) * 35}ms`;
      sutun.appendChild(simge);
    });
    parca.appendChild(sutun);
  }
  hedef.replaceChildren(parca);
  return sutunSayisi;
}

function kartMetniOlcegi(metin) {
  const harfSayisi = [...metin.replaceAll(" ", "")].length;
  if (harfSayisi > 18) return "cok-uzun";
  if (harfSayisi > 12) return "uzun";
  if (harfSayisi > 8) return "orta";
  return "kisa";
}

function tasLatinMetniniOlustur(metin) {
  const parca = document.createDocumentFragment();
  metin.trim().split(/\s+/).forEach(kelime => {
    const satir = document.createElement("span");
    satir.textContent = kelime;
    parca.appendChild(satir);
  });
  arayuz.kartTasLatin.replaceChildren(parca);
}

function harfEkle(harf) {
  if (durum.yazilanMetin.length >= AYARLAR.maksimumKarakter) {
    bildirimGoster("En fazla 24 karakter yazabilirsin.");
    return;
  }
  if (!durum.yazilanMetin && durum.ortakHafizaKayitMetni) {
    durum.ortakHafizaKayitMetni = "";
    durum.ortakHafizaKayitId = "";
  }
  durum.yazilanMetin += harf;
  secimSesiCal();
  arayuz.durumMesaji.textContent = `${harf} harfi dijital kitabeye işlendi.`;
  ekraniGuncelle();
}
function boslukEkle() {
  if (!durum.yazilanMetin.length || durum.yazilanMetin.endsWith(" ")) return;
  if (durum.yazilanMetin.length < AYARLAR.maksimumKarakter) {
    durum.yazilanMetin += " ";
    ekraniGuncelle();
  }
}
function sonHarfiSil() {
  durum.yazilanMetin = durum.yazilanMetin.slice(0, -1);
  if (!durum.yazilanMetin) {
    durum.ortakHafizaKayitMetni = "";
    durum.ortakHafizaKayitId = "";
  }
  arayuz.durumMesaji.textContent = durum.yazilanMetin ? "Son karakter silindi." : "Kitabe yeni bir iz bekliyor.";
  ekraniGuncelle();
}
function metniTemizle() {
  durum.yazilanMetin = "";
  durum.ortakHafizaKayitMetni = "";
  durum.ortakHafizaKayitId = "";
  arayuz.durumMesaji.textContent = "Yazı alanı ve kitabe temizlendi.";
  ekraniGuncelle();
}

function ekraniGuncelle() {
  const metin = durum.yazilanMetin;
  if (!metin) {
    arayuz.yaziAlani.innerHTML = '<span class="yer-tutucu">İSMİNİ YAZ</span>';
    arayuz.kokTurkAlani.innerHTML = '<span class="yer-tutucu">𐰚 𐰇 𐰚 𐰃 𐰔</span>';
    arayuz.anitsalLatinMetin.textContent = "İZİNİ TAŞA İŞLE";
    runeSutunlariniOlustur("KOKIZ", arayuz.anitsalKokTurkMetin);
    arayuz.tasAnit.dataset.columns = "1";
    arayuz.anitDurumu.textContent = "KİTABE YENİ BİR İZ BEKLİYOR";
  } else {
    arayuz.yaziAlani.textContent = metin;
    arayuz.kokTurkAlani.textContent = kokTurkceyeCevir(metin);
    arayuz.anitsalLatinMetin.textContent = metin;
    const sutunSayisi = runeSutunlariniOlustur(metin, arayuz.anitsalKokTurkMetin);
    arayuz.tasAnit.dataset.columns = String(sutunSayisi);
    arayuz.anitDurumu.textContent = `${sutunSayisi} SÜTUN · SAĞDAN SOLA İŞLENİYOR`;
  }
  arayuz.yaziAlani.style.fontSize = metin.length > 18 ? "clamp(21px,2.15vw,42px)" : metin.length > 11 ? "clamp(24px,2.7vw,52px)" : "";
  arayuz.kokTurkAlani.style.fontSize = metin.length > 18 ? "clamp(18px,1.75vw,34px)" : metin.length > 11 ? "clamp(21px,2.1vw,41px)" : "";
  arayuz.karakterSayaci.textContent = `${metin.length} / ${AYARLAR.maksimumKarakter}`;
  arayuz.anlikIzNo.textContent = izNumarasiOlustur(metin);
}

function mailQrIcerigiOlustur() {
  const eposta = arayuz.epostaAlani.value.trim();
  if (!epostaGecerliMi(eposta)) return GENEL_QR_ADRESI;
  const izNo = izNumarasiOlustur(durum.yazilanMetin);
  const ulke = ULKE_HARITASI[durum.seciliUlkeKodu] || ULKE_HARITASI.TUR;
  const latin = durum.yazilanMetin || "—";
  const kokTurk = durum.yazilanMetin ? kokTurkceyeCevir(durum.yazilanMetin).replaceAll(" ", "") : "—";
  const konu = encodeURIComponent(`KÖKİZ ${izNo}`);
  const govde = encodeURIComponent([
    "KÖKİZ",
    `Latin: ${latin}`,
    `Kök Türk: ${kokTurk}`,
    `Kök coğrafya: ${ulke.ad}`,
    `İz: ${izNo}`,
    "29-30 Ekim 2026 · Ankara"
  ].join("\r\n"));
  return `mailto:${eposta}?subject=${konu}&body=${govde}`;
}

// QR, MIT lisanslı qrcode-generator ile üretilir. Kütüphane yalnızca modül
// matrisini verdiği için çizim burada yapılır; renkler, boyut ve en az 14 px'lik
// sessiz alan önceki görünümle aynı kalır.
const QR_EN_AZ_DOLGU = 14;

function qrYerTutucuCiz(ctx, boyut, mesaj) {
  ctx.fillStyle = "#f5efd9";
  ctx.fillRect(0, 0, boyut, boyut);
  ctx.fillStyle = "#03201d";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(mesaj, boyut / 2, boyut / 2);
}

function qrOlustur(canvas, icerik, boyut) {
  canvas.width = boyut;
  canvas.height = boyut;
  const ctx = canvas.getContext("2d");

  if (typeof qrcode === "undefined") {
    qrYerTutucuCiz(ctx, boyut, "QR çevrimdışı");
    return;
  }

  let kod;
  try {
    kod = qrcode(0, "M");
    kod.addData(icerik);
    kod.make();
  } catch (hata) {
    // İçerik en büyük sürüme de sığmazsa kart QR alanı boş kalmaz.
    console.error("QR üretilemedi.", hata);
    qrYerTutucuCiz(ctx, boyut, "QR üretilemedi");
    return;
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, boyut, boyut);

  const modulSayisi = kod.getModuleCount();
  const hucre = Math.max(1, Math.floor((boyut - QR_EN_AZ_DOLGU * 2) / modulSayisi));
  const kenar = Math.round((boyut - hucre * modulSayisi) / 2);
  ctx.fillStyle = "#001b18";
  for (let satir = 0; satir < modulSayisi; satir++) {
    for (let sutun = 0; sutun < modulSayisi; sutun++) {
      if (kod.isDark(satir, sutun)) {
        ctx.fillRect(kenar + sutun * hucre, kenar + satir * hucre, hucre, hucre);
      }
    }
  }
}
function genelQrOlustur() {
  qrOlustur(arayuz.genelQr, GENEL_QR_ADRESI, 256);
}
function qrOnizlemeyiGuncelle() { qrOlustur(arayuz.qrOnizleme, mailQrIcerigiOlustur(), 320); }

function hatiraKartiniHazirla() {
  if (!durum.yazilanMetin.trim()) {
    bildirimGoster("Hatıra kartı için önce ismini veya bir kelimeyi yaz.");
    return;
  }
  const izNo = izNumarasiOlustur(durum.yazilanMetin);
  const eposta = arayuz.epostaAlani.value.trim();
  arayuz.hatiraKarti.dataset.metinOlcegi = kartMetniOlcegi(durum.yazilanMetin);
  arayuz.kartLatinMetin.textContent = durum.yazilanMetin;
  arayuz.kartKokTurkMetin.textContent = kokTurkceyeCevir(durum.yazilanMetin);
  arayuz.kartIzNo.textContent = izNo;
  arayuz.kartIzNoOrta.textContent = izNo;
  tamgaCiz(arayuz.kartTamga, tamgaKodunuOlustur(durum.yazilanMetin), true);
  kartUlkeMuhrunuGuncelle();
  arayuz.kartMailBilgisi.textContent = epostaGecerliMi(eposta) ? eposta : "Genel QR";
  arayuz.kartQrBasligi.textContent = epostaGecerliMi(eposta) ? "KİŞİYE ÖZEL QR" : "GENEL QR";
  arayuz.kartQrAciklamasi.textContent = epostaGecerliMi(eposta) ? "Mail taslağını açar" : "TDT resmî sayfasını açar";
  tasLatinMetniniOlustur(durum.yazilanMetin);
  arayuz.kartTasRuneleri.dataset.columns = String(runeSutunlariniOlustur(durum.yazilanMetin, arayuz.kartTasRuneleri));
  qrOnizlemeyiGuncelle();
  if (!epostaGecerliMi(eposta)) epostaDurumuGoster("Kartı göndermek için geçerli bir e-posta adresi girin.", "hata");
  else if (durum.backendYapilandirildi) epostaDurumuGoster(durum.backendTestModu ? "Test modu hazır; gerçek e-posta gönderilmez." : "Kart PNG ekiyle gönderilmeye hazır.", "hazir");
  else epostaDurumuGoster("E-posta backend'i henüz yapılandırılmadı.", "hata");
  epostaGonderButonunuGuncelle();
  durum.modalOncesiOdak = document.activeElement;
  arayuz.hatiraModal.classList.remove("gizli");
  arayuz.hatiraKapatButonu.focus();
  void iziOrtakHafizayaKaydet();
}
function hatiraModaliniKapat() {
  arayuz.hatiraModal.classList.add("gizli");
  if (durum.modalOncesiOdak?.focus) durum.modalOncesiOdak.focus();
}

async function hatiraGorseliOlustur() {
  if (typeof html2canvas === "undefined") throw new Error("Görsel oluşturma bileşeni yüklenemedi.");
  await document.fonts?.ready;
  arayuz.hatiraKarti.classList.add("kart-disari-aktariliyor");
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  try {
    return await html2canvas(arayuz.hatiraKarti, {
      scale:1.5,
      useCORS:true,
      backgroundColor:"#031b1b",
      logging:false,
      imageTimeout:10000,
      windowWidth:1600,
      windowHeight:1100
    });
  } finally {
    arayuz.hatiraKarti.classList.remove("kart-disari-aktariliyor");
  }
}
function guvenliDosyaAdi(metin) {
  return (metin.trim() || "KOKIZ").toLocaleUpperCase("tr-TR").replace(/\s+/g,"_").replace(/[^A-ZÇĞİÖŞÜ0-9_-]/g,"");
}
async function kartiIndir() {
  try {
    arayuz.indirButonu.disabled = true;
    arayuz.indirButonu.textContent = "HAZIRLANIYOR…";
    const canvas = await hatiraGorseliOlustur();
    const baglanti = document.createElement("a");
    baglanti.download = `${guvenliDosyaAdi(durum.yazilanMetin)}_KOKIZ_Hatira.png`;
    baglanti.href = canvas.toDataURL("image/png");
    baglanti.click();
    bildirimGoster("Hatıra kartı PNG olarak hazırlandı.");
  } catch (hata) {
    console.error(hata);
    bildirimGoster("Hatıra kartı indirilemedi. İnternet bağlantısını kontrol et.");
  } finally {
    arayuz.indirButonu.disabled = false;
    arayuz.indirButonu.textContent = "PNG İNDİR";
  }
}
async function kartiPaylas() {
  try {
    arayuz.paylasButonu.disabled = true;
    const canvas = await hatiraGorseliOlustur();
    const blob = await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("PNG üretilemedi")), "image/png"));
    const dosya = new File([blob], `${guvenliDosyaAdi(durum.yazilanMetin)}_KOKIZ_Hatira.png`, {type:"image/png"});
    if (!navigator.share || !navigator.canShare?.({files:[dosya]})) {
      bildirimGoster("Bu tarayıcı dosya paylaşımını desteklemiyor; PNG İndir'i kullanabilirsin.");
      return;
    }
    await navigator.share({title:"KÖKİZ Hatıra Kartım", text:"KÖKİZ dijital izim", files:[dosya]});
  } catch (hata) {
    if (hata.name !== "AbortError") { console.error(hata); bildirimGoster("Paylaşım tamamlanamadı."); }
  } finally { arayuz.paylasButonu.disabled = false; }
}

async function kartiEpostala() {
  const eposta = arayuz.epostaAlani.value.trim();
  if (!epostaGecerliMi(eposta)) {
    epostaDurumuGoster("Geçerli bir e-posta adresi girin.", "hata");
    bildirimGoster("E-posta adresini kontrol edin.");
    return;
  }
  if (!durum.backendYapilandirildi) {
    epostaDurumuGoster("E-posta servisi yapılandırılmamış. .env ayarlarını tamamlayın.", "hata");
    return;
  }

  try {
    arayuz.epostaGonderButonu.disabled = true;
    arayuz.epostaGonderButonu.textContent = "KART HAZIRLANIYOR…";
    epostaDurumuGoster("Hatıra kartı yüksek çözünürlüklü PNG'ye dönüştürülüyor…", "hazir");
    const canvas = await hatiraGorseliOlustur();
    const gorsel = canvas.toDataURL("image/png");
    arayuz.epostaGonderButonu.textContent = "GÖNDERİLİYOR…";
    epostaDurumuGoster("Kart güvenli e-posta servisine aktarılıyor…", "hazir");

    const yanit = await fetch("/api/hatira-gonder", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        eposta,
        latinMetin:durum.yazilanMetin,
        kokTurkMetin:kokTurkceyeCevir(durum.yazilanMetin),
        izNo:izNumarasiOlustur(durum.yazilanMetin),
        ulke:durum.seciliUlkeKodu,
        dosyaAdi:`${guvenliDosyaAdi(durum.yazilanMetin)}_KOKIZ_Hatira.png`,
        gorsel
      })
    });
    const sonuc = await yanit.json().catch(() => ({mesaj:"Sunucudan geçersiz yanıt alındı."}));
    if (!yanit.ok) throw new Error(sonuc.mesaj || "E-posta gönderilemedi.");
    epostaDurumuGoster(sonuc.mesaj || "Hatıra kartı e-posta adresinize gönderildi.", "basarili");
    bildirimGoster(durum.backendTestModu ? "Test gönderimi başarıyla tamamlandı." : "Hatıra kartı e-posta ile gönderildi.");
  } catch (hata) {
    console.error("E-posta gönderim hatası", hata);
    epostaDurumuGoster(hata.message || "E-posta gönderilemedi. Tekrar deneyin.", "hata");
    bildirimGoster("E-posta gönderimi tamamlanamadı.");
  } finally {
    arayuz.epostaGonderButonu.textContent = "E-POSTAMA GÖNDER";
    epostaGonderButonunuGuncelle();
  }
}

async function backendDurumunuKontrolEt() {
  try {
    const yanit = await fetch("/api/saglik", {headers:{"Accept":"application/json"}, cache:"no-store"});
    if (!yanit.ok) throw new Error("Backend yanıt vermedi");
    const bilgi = await yanit.json();
    durum.backendYapilandirildi = Boolean(bilgi.epostaHazir);
    durum.backendTestModu = Boolean(bilgi.testModu);
    durum.ortakHafizaHazir = Boolean(bilgi.ortakHafizaHazir);
    if (durum.backendYapilandirildi) {
      epostaDurumuGoster(durum.backendTestModu ? "Backend test modunda hazır." : "Güvenli e-posta backend'i hazır.", "hazir");
    } else {
      epostaDurumuGoster("Backend çalışıyor; Resend ayarları bekleniyor.", "hata");
    }
  } catch {
    durum.backendYapilandirildi = false;
    durum.ortakHafizaHazir = false;
    durum.backendTestModu = false;
    epostaDurumuGoster("Backend bağlantısı bulunamadı. Projeyi baslat.bat ile açın.", "hata");
  }
  epostaGonderButonunuGuncelle();
}

async function metniPanoyaKopyala() {
  if (!durum.yazilanMetin) { bildirimGoster("Kopyalamak için önce bir metin yaz."); return; }
  const metin = kokTurkceyeCevir(durum.yazilanMetin);
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(metin);
    else {
      const alan = document.createElement("textarea"); alan.value = metin; alan.style.position = "fixed"; alan.style.opacity = "0";
      document.body.appendChild(alan); alan.select(); document.execCommand("copy"); alan.remove();
    }
    bildirimGoster("Kök Türk yazısı panoya kopyalandı.");
  } catch { bildirimGoster("Panoya kopyalama tarayıcı tarafından engellendi."); }
}

async function elModeliniHazirla() {
  if (durum.elIsaretleyici) return durum.elIsaretleyici;
  if (durum.modelYuklemeSozu) return durum.modelYuklemeSozu;
  durumGuncelle(arayuz.modelDurumu, arayuz.modelDurumNoktasi, "bekliyor", "Yükleniyor");
  durum.modelYuklemeSozu = (async () => {
    const {FilesetResolver, HandLandmarker, DrawingUtils} = await import(MEDIAPIPE_PAKET);
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
    const ortakAyarlar = {
      baseOptions:{modelAssetPath:EL_MODELI, delegate:"GPU"}, runningMode:"VIDEO", numHands:1,
      minHandDetectionConfidence:.62, minHandPresenceConfidence:.62, minTrackingConfidence:.62
    };
    try { durum.elIsaretleyici = await HandLandmarker.createFromOptions(vision, ortakAyarlar); }
    catch (gpuHatasi) {
      console.warn("GPU modeli açılamadı, CPU ile deneniyor.", gpuHatasi);
      ortakAyarlar.baseOptions.delegate = "CPU";
      durum.elIsaretleyici = await HandLandmarker.createFromOptions(vision, ortakAyarlar);
    }
    durum.elIsaretleyiciSinifi = HandLandmarker;
    durum.cizimAraci = new DrawingUtils(elCanvasContext);
    durumGuncelle(arayuz.modelDurumu, arayuz.modelDurumNoktasi, "acik", "Model hazır");
    return durum.elIsaretleyici;
  })().catch(hata => {
    durum.modelYuklemeSozu = null;
    durumGuncelle(arayuz.modelDurumu, arayuz.modelDurumNoktasi, "hata", "Yüklenemedi");
    throw hata;
  });
  return durum.modelYuklemeSozu;
}

function kameraHataMesaji(hata) {
  const mesajlar = {
    NotAllowedError:"Kamera izni verilmedi. Tarayıcıdaki kamera iznini aç.",
    NotReadableError:"Kamera başka bir uygulama tarafından kullanılıyor.",
    NotFoundError:"Bu cihazda kullanılabilir kamera bulunamadı.",
    OverconstrainedError:"İstenen kamera çözünürlüğü desteklenmiyor.",
    SecurityError:"Kamera yalnızca localhost veya güvenli bağlantıda çalışır."
  };
  return mesajlar[hata.name] || "Kamera başlatılamadı. Bağlantıyı ve tarayıcı izinlerini kontrol et.";
}
async function kamerayiBaslat() {
  if (durum.kameraAkisi) return;
  if (!navigator.mediaDevices?.getUserMedia) { bildirimGoster("Bu tarayıcı kamera erişimini desteklemiyor."); return; }
  try {
    arayuz.kameraBaslatButonu.disabled = true;
    arayuz.kameraBaslatButonu.textContent = "HAZIRLANIYOR…";
    durumGuncelle(arayuz.kameraDurumu, arayuz.kameraDurumNoktasi, "bekliyor", "KAMERA AÇILIYOR");
    const modelSozu = elModeliniHazirla();
    durum.kameraAkisi = await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280},height:{ideal:720},facingMode:"user"},audio:false});
    durum.kameraAkisi.getVideoTracks()[0]?.addEventListener("ended", () => {
      if (!durum.kameraAkisi) return;
      kamerayiDurdur();
      bildirimGoster("Kamera bağlantısı kesildi. Hazır olduğunda yeniden başlatabilirsin.");
    }, {once:true});
    arayuz.kameraGoruntusu.srcObject = durum.kameraAkisi;
    await arayuz.kameraGoruntusu.play();
    await modelSozu;
    arayuz.kameraYerTutucu.classList.add("gizli");
    arayuz.kameraDurdurButonu.disabled = false;
    durumGuncelle(arayuz.kameraDurumu, arayuz.kameraDurumNoktasi, "acik", "KAMERA CANLI");
    arayuz.durumMesaji.textContent = "Elini göster; işaret parmağınla bir tuşu hedefle.";
    algilamaDongusunuBaslat();
  } catch (hata) {
    console.error(hata);
    kameraAkisiniKapat();
    const mesaj = kameraHataMesaji(hata);
    durumGuncelle(arayuz.kameraDurumu, arayuz.kameraDurumNoktasi, "hata", "KAMERA HATASI");
    bildirimGoster(mesaj);
  } finally {
    arayuz.kameraBaslatButonu.disabled = Boolean(durum.kameraAkisi);
    arayuz.kameraBaslatButonu.textContent = "KAMERAYI BAŞLAT";
  }
}
function kameraAkisiniKapat() {
  if (durum.algilamaAnimasyonu) cancelAnimationFrame(durum.algilamaAnimasyonu);
  durum.algilamaAnimasyonu = null;
  durum.kameraAkisi?.getTracks().forEach(track => track.stop());
  durum.kameraAkisi = null;
  arayuz.kameraGoruntusu.srcObject = null;
  enerjiIziniTemizle();
}
function kamerayiDurdur() {
  kameraAkisiniKapat();
  elCanvasContext.clearRect(0,0,arayuz.elCanvas.width,arayuz.elCanvas.height);
  arayuz.kameraYerTutucu.classList.remove("gizli");
  arayuz.kameraBaslatButonu.disabled = false;
  arayuz.kameraDurdurButonu.disabled = true;
  durum.pinchAktif = false; durum.pinchSecimiYapildi = false; durum.pinchBaslangicHedefi = null;
  durum.isaretParmagiGecmisi = []; durum.basParmakGecmisi = []; durum.pinchOranGecmisi = [];
  arayuz.sanalImlec.classList.remove("gorunur","pinch");
  hedefiTemizle(); secimIlerlemesiniGuncelle(0);
  durumGuncelle(arayuz.kameraDurumu, arayuz.kameraDurumNoktasi, "kapali", "KAMERA KAPALI");
  durumGuncelle(arayuz.elDurumu, arayuz.elDurumNoktasi, "kapali", "Bekleniyor");
  durumGuncelle(arayuz.imlecDurumu, arayuz.imlecDurumNoktasi, "kapali", "Hazır değil");
  arayuz.algilananElSayisi.textContent = "0"; arayuz.parmakDurumu.textContent = "El bekleniyor";
}
function algilamaDongusunuBaslat() {
  if (durum.algilamaAnimasyonu) cancelAnimationFrame(durum.algilamaAnimasyonu);
  durum.algilamaAnimasyonu = requestAnimationFrame(elAlgilamaDongusu);
}
function elAlgilamaDongusu(zaman) {
  if (!durum.kameraAkisi || !durum.elIsaretleyici) return;
  if (arayuz.kameraGoruntusu.readyState >= 2 && arayuz.kameraGoruntusu.currentTime !== durum.sonVideoZamani && zaman - durum.sonAlgilamaZamani >= AYARLAR.algilamaAraligi) {
    durum.sonVideoZamani = arayuz.kameraGoruntusu.currentTime;
    durum.sonAlgilamaZamani = zaman;
    if (arayuz.elCanvas.width !== arayuz.kameraGoruntusu.videoWidth || arayuz.elCanvas.height !== arayuz.kameraGoruntusu.videoHeight) {
      arayuz.elCanvas.width = arayuz.kameraGoruntusu.videoWidth;
      arayuz.elCanvas.height = arayuz.kameraGoruntusu.videoHeight;
    }
    try { elSonucunuCiz(durum.elIsaretleyici.detectForVideo(arayuz.kameraGoruntusu, zaman)); }
    catch (hata) { console.error("El algılama karesi işlenemedi.", hata); }
  }
  durum.algilamaAnimasyonu = requestAnimationFrame(elAlgilamaDongusu);
}

function pinchDurumunuHesapla(noktalar) {
  const elOlcegi = Math.max(noktaMesafesi(noktalar[0], noktalar[9]), .0001);
  const oran = gecmiseOranEkle(noktaMesafesi(noktalar[4], noktalar[8]) / elOlcegi);
  const ilerleme = 1 - sayiyiSinirla((oran - AYARLAR.pinchBaslamaEsigi) / (AYARLAR.pinchBirakmaEsigi - AYARLAR.pinchBaslamaEsigi), 0, 1);
  let aktif = durum.pinchAktif;
  if (!aktif && oran <= AYARLAR.pinchBaslamaEsigi) aktif = true;
  if (aktif && oran >= AYARLAR.pinchBirakmaEsigi) aktif = false;
  return {aktif, ilerleme};
}
function secimIlerlemesiniGuncelle(oran) {
  const yuzde = Math.round(sayiyiSinirla(oran,0,1) * 100);
  arayuz.secimYuzdesi.textContent = `%${yuzde}`;
  arayuz.secimCubuguDolgu.style.width = `${yuzde}%`;
}
function elSonucunuCiz(sonuc) {
  elCanvasContext.clearRect(0,0,arayuz.elCanvas.width,arayuz.elCanvas.height);
  const eller = sonuc.landmarks || [];
  arayuz.algilananElSayisi.textContent = String(eller.length);
  if (!eller.length) {
    arayuz.parmakDurumu.textContent = "El görünmüyor";
    durum.pinchAktif = false; durum.pinchSecimiYapildi = false; durum.pinchBaslangicHedefi = null;
    durum.isaretParmagiGecmisi = []; durum.basParmakGecmisi = []; durum.pinchOranGecmisi = [];
    arayuz.sanalImlec.classList.remove("gorunur","pinch"); enerjiIziniTemizle(); hedefiTemizle(); secimIlerlemesiniGuncelle(0);
    durumGuncelle(arayuz.elDurumu, arayuz.elDurumNoktasi, "bekliyor", "El aranıyor");
    durumGuncelle(arayuz.imlecDurumu, arayuz.imlecDurumNoktasi, "kapali", "Hazır değil");
    return;
  }
  const noktalar = eller[0];
  durum.cizimAraci.drawConnectors(noktalar, durum.elIsaretleyiciSinifi.HAND_CONNECTIONS, {color:"#19e2d8", lineWidth:4});
  durum.cizimAraci.drawLandmarks(noktalar, {color:"#ffe7a8", fillColor:"#06302d", lineWidth:2, radius:4});
  durumGuncelle(arayuz.elDurumu, arayuz.elDurumNoktasi, "acik", "El algılandı");
  durumGuncelle(arayuz.imlecDurumu, arayuz.imlecDurumNoktasi, "acik", "Pinch hazır");

  const isaret = gecmiseNoktaEkle(durum.isaretParmagiGecmisi, noktalar[8]);
  const bas = gecmiseNoktaEkle(durum.basParmakGecmisi, noktalar[4]);
  sanalImleciGuncelle(isaret);
  const yumusatilmis = [...noktalar]; yumusatilmis[8] = isaret; yumusatilmis[4] = bas;
  const pinch = pinchDurumunuHesapla(yumusatilmis);
  secimIlerlemesiniGuncelle(pinch.ilerleme);
  const oncekiAktif = durum.pinchAktif;
  durum.pinchAktif = pinch.aktif;
  const simdi = performance.now();

  if (!oncekiAktif && pinch.aktif) {
    const hedefKararli = durum.sonHedefEleman && simdi - durum.hedefeGirisZamani >= AYARLAR.hedefKararSuresi;
    const cooldownBitti = simdi - durum.sonSecimZamani >= AYARLAR.pinchCooldownSuresi;
    durum.pinchBaslangicHedefi = hedefKararli && cooldownBitti ? durum.sonHedefEleman : null;
    durum.pinchBaslangicZamani = simdi;
    durum.pinchSecimiYapildi = false;
  }
  if (pinch.aktif) {
    arayuz.parmakDurumu.textContent = "Pinch algılandı";
    arayuz.sanalImlec.classList.add("pinch");
    if (durum.pinchBaslangicHedefi && durum.sonHedefEleman !== durum.pinchBaslangicHedefi) durum.pinchBaslangicHedefi = null;
    const dogrulandi = simdi - durum.pinchBaslangicZamani >= AYARLAR.pinchDogrulamaSuresi;
    if (!durum.pinchSecimiYapildi && durum.pinchBaslangicHedefi && dogrulandi) {
      durum.pinchSecimiYapildi = true;
      durum.sonSecimZamani = simdi;
      hedefiEtkinlestir(durum.pinchBaslangicHedefi);
    }
  } else {
    arayuz.parmakDurumu.textContent = "Seçime hazır";
    arayuz.sanalImlec.classList.remove("pinch");
    durum.pinchBaslangicHedefi = null;
    durum.pinchSecimiYapildi = false;
  }
}

function kameraDegeriniEkranaYay(deger) {
  const sinirli = sayiyiSinirla(deger, AYARLAR.kameraKenarPayi, 1-AYARLAR.kameraKenarPayi);
  return (sinirli - AYARLAR.kameraKenarPayi) / (1 - 2*AYARLAR.kameraKenarPayi);
}
function sanalImleciGuncelle(nokta) {
  const hedefX = (1-kameraDegeriniEkranaYay(nokta.x)) * innerWidth;
  const hedefY = kameraDegeriniEkranaYay(nokta.y) * innerHeight;
  durum.sanalImlecX += (hedefX-durum.sanalImlecX)*AYARLAR.imlecYumusatmaOrani;
  durum.sanalImlecY += (hedefY-durum.sanalImlecY)*AYARLAR.imlecYumusatmaOrani;
  arayuz.sanalImlec.style.left = `${durum.sanalImlecX}px`;
  arayuz.sanalImlec.style.top = `${durum.sanalImlecY}px`;
  arayuz.sanalImlec.classList.add("gorunur");
  durum.enerjiIzi.push({x:durum.sanalImlecX,y:durum.sanalImlecY,zaman:performance.now(),pinch:durum.pinchAktif});
  if (durum.enerjiIzi.length > 28) durum.enerjiIzi.shift();
  enerjiIziniCiz();
  imlecHedefiniBul(durum.sanalImlecX, durum.sanalImlecY);
}
function hedefiTemizle() {
  durum.sonHedefEleman?.classList.remove("el-hover");
  durum.sonHedefEleman = null;
  arayuz.hedefTusDurumu.textContent = "—";
}
function imlecHedefiniBul(x, y) {
  const yeniHedef = document.elementFromPoint(x,y)?.closest(".hedeflenebilir") || null;
  if (yeniHedef !== durum.sonHedefEleman) {
    durum.sonHedefEleman?.classList.remove("el-hover");
    durum.sonHedefEleman = yeniHedef;
    durum.hedefeGirisZamani = performance.now();
    yeniHedef?.classList.add("el-hover");
  }
  arayuz.hedefTusDurumu.textContent = yeniHedef ? (yeniHedef.dataset.harf || yeniHedef.textContent.trim().replace(/\s+/g," ").slice(0,14)) : "—";
}
function hedefiEtkinlestir(hedef) {
  if (!hedef || hedef.disabled) return;
  hedef.click();
  hedef.classList.add("el-tiklandi");
  setTimeout(() => hedef.classList.remove("el-tiklandi"), 280);
}

async function tamEkraniDegistir() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch { bildirimGoster("Tam ekran modu tarayıcı tarafından engellendi."); }
}
function tamEkranMetniniGuncelle() {
  arayuz.tamEkranButonu.innerHTML = document.fullscreenElement ? '× <span>TAM EKRANDAN ÇIK</span>' : '⛶ <span>TAM EKRAN</span>';
  arayuz.tamEkranButonu.setAttribute("aria-label", document.fullscreenElement ? "Tam ekrandan çık" : "Tam ekranı aç");
}

function fizikselKlavyeOlayi(olay) {
  const aktif = document.activeElement;
  if (aktif?.matches("input,textarea,[contenteditable='true']")) return;
  if (olay.key === "Escape" && !arayuz.ortakHafizaSahnesi.classList.contains("gizli")) { ortakHafizayiKapat(); return; }
  if (olay.key === "Escape" && durum.islemeAktif) { islemeToreniniBitir(); return; }
  if (olay.key === "Escape" && !arayuz.hatiraModal.classList.contains("gizli")) { hatiraModaliniKapat(); return; }
  if (olay.key === "Backspace") { olay.preventDefault(); sonHarfiSil(); return; }
  if (olay.key === "Delete") { olay.preventDefault(); metniTemizle(); return; }
  if (olay.key === " ") { olay.preventDefault(); boslukEkle(); return; }
  if (olay.key.length === 1) {
    const harf = olay.key.toLocaleUpperCase("tr-TR");
    if (GECERLI_HARFLER.includes(harf)) harfEkle(harf);
  }
}

function ortakHafizayiOturumSonundaSifirla(olay) {
  if (olay?.persisted || durum.hafizaSifirlamaGonderildi) return;
  durum.hafizaSifirlamaGonderildi = true;
  const govde = new Blob(["{}"], {type:"application/json"});
  const beaconGonderildi = navigator.sendBeacon?.("/api/ortak-hafiza/sifirla", govde) || false;
  if (!beaconGonderildi) {
    void fetch("/api/ortak-hafiza/sifirla", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:"{}",
      keepalive:true
    }).catch(() => {});
  }
}

function olaylariBagla() {
  arayuz.silButonu.addEventListener("click", sonHarfiSil);
  arayuz.boslukButonu.addEventListener("click", boslukEkle);
  arayuz.temizleButonu.addEventListener("click", metniTemizle);
  arayuz.kopyalaButonu.addEventListener("click", metniPanoyaKopyala);
  arayuz.hatiraButonu.addEventListener("click", tasIslemeToreniniBaslat);
  arayuz.hafizaButonu.addEventListener("click", ortakHafizayiAc);
  arayuz.kartHafizaButonu.addEventListener("click", ortakHafizayiAc);
  arayuz.hafizaKapatButonu.addEventListener("click", ortakHafizayiKapat);
  arayuz.ortakHafizaCanvas.addEventListener("pointermove", hafizaIsaretcisiniGuncelle);
  arayuz.ortakHafizaCanvas.addEventListener("pointerdown", hafizaIsaretcisiniGuncelle);
  arayuz.sesButonu.addEventListener("click", sesDurumunuDegistir);
  arayuz.islemeAtlaButonu.addEventListener("click", islemeToreniniBitir);
  arayuz.hatiraKapatButonu.addEventListener("click", hatiraModaliniKapat);
  arayuz.indirButonu.addEventListener("click", kartiIndir);
  arayuz.epostaGonderButonu.addEventListener("click", kartiEpostala);
  arayuz.paylasButonu.addEventListener("click", kartiPaylas);
  arayuz.kameraBaslatButonu.addEventListener("click", kamerayiBaslat);
  arayuz.kameraDurdurButonu.addEventListener("click", kamerayiDurdur);
  arayuz.tamEkranButonu.addEventListener("click", tamEkraniDegistir);
  arayuz.epostaAlani.addEventListener("input", () => {
    epostaGonderButonunuGuncelle();
    if (!arayuz.hatiraModal.classList.contains("gizli")) {
      qrOnizlemeyiGuncelle();
      const eposta = arayuz.epostaAlani.value.trim();
      arayuz.kartMailBilgisi.textContent = epostaGecerliMi(eposta) ? eposta : "E-posta bekleniyor";
    }
  });
  arayuz.hatiraModal.addEventListener("click", olay => { if (olay.target === arayuz.hatiraModal) hatiraModaliniKapat(); });
  document.addEventListener("keydown", fizikselKlavyeOlayi);
  document.addEventListener("fullscreenchange", tamEkranMetniniGuncelle);
  window.addEventListener("resize", () => {
    canvasBoyutlandir(arayuz.enerjiIziCanvas, enerjiIziContext);
    if (!arayuz.ortakHafizaSahnesi.classList.contains("gizli") && matchMedia("(prefers-reduced-motion: reduce)").matches) ortakHafizaGogunuCiz();
  });
  window.addEventListener("pagehide", kameraAkisiniKapat);
  window.addEventListener("pagehide", ortakHafizayiOturumSonundaSifirla);
}

function uygulamayiBaslat() {
  bayrakGorselleriniYukle();
  ulkeSeciminiOlustur();
  klavyeyiOlustur();
  ekraniGuncelle();
  genelQrOlustur();
  canvasBoyutlandir(arayuz.enerjiIziCanvas, enerjiIziContext);
  secimIlerlemesiniGuncelle(0);
  olaylariBagla();
  backendDurumunuKontrolEt();
}

uygulamayiBaslat();
