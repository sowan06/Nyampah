/* ============================================================
   NYAMPAH - logika aplikasi
   Dipecah dari app-mobile.html untuk kemudahan konversi Figma.
   ============================================================ */
/* =========================================================
   NYAMPAH - App Logic
   ========================================================= */

/* =========================================================
   MODEL WILAYAH & LOKASI (2 lapis + geofence)
   ---------------------------------------------------------
   - WILAYAH : batas RW yang dikelola RT (geofence lingkaran).
     Laporan/titik baru WAJIB di dalam radius ini, kalau tidak
     ditolak - supaya tidak kontradiksi dengan ruang lingkup RW.
   - LOKASI RESMI  : didaftarkan RT di muka (dari titik ad-hoc
     atau manual) + punya QR yang ditempel di tembok gang.
   - LOKASI AD-HOC : dibuat otomatis oleh sistem saat warga
     lapor di titik yang belum terdaftar (via GPS), lalu
     di-cluster. Jika sering muncul -> dipromosikan RT.
   ========================================================= */
const WILAYAH = { rw:'RW 05', lat:-6.9730, lng:110.4086, radiusM:600 };
const GANGS = [
  {id:'G3', name:'Gang Pisang', x:82,  y:98,  status:'penuh',  lapor:8,  verif:12, resmi:true,  lat:-6.9722, lng:110.4072},
  {id:'G5', name:'Gang Melati', x:232, y:132, status:'sedang', lapor:22, verif:5,  resmi:true,  lat:-6.9738, lng:110.4101},
  {id:'G2', name:'Gang Mawar',  x:180, y:72,  status:'bersih', lapor:60, verif:3,  resmi:true,  lat:-6.9715, lng:110.4089},
  {id:'G9', name:'Gang Jambu',  x:250, y:200, status:'penuh',  lapor:15, verif:9,  resmi:true,  lat:-6.9748, lng:110.4094},
];

/* Hitung jarak dua koordinat (meter) - Haversine sederhana */
function jarakMeter(lat1,lng1,lat2,lng2){
  const R=6371000, toRad=d=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLng=toRad(lng2-lng1);
  const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return Math.round(2*R*Math.asin(Math.sqrt(a)));
}
/* Apakah sebuah titik berada di dalam wilayah RW? */
function dalamWilayah(lat,lng){
  return jarakMeter(WILAYAH.lat,WILAYAH.lng,lat,lng) <= WILAYAH.radiusM;
}

const KRONIS = [
  {id:'G3', name:'Gang Pisang', lapor:47, layanan:'terangkut 24/47 (51%)'},
  {id:'G9', name:'Gang Jambu', lapor:31, layanan:'terangkut 62%'},
];
const STATUS_COLOR = {penuh:'#C0392B', sedang:'#B5820F', bersih:'#0E7A4E'};
const STATUS_LABEL = {penuh:'Penuh', sedang:'Sedang', bersih:'Bersih'};

/* Tingkat isi laporan warga (dari form: sedikit/sedang/penuh) -> info aman & konsisten */
const TINGKAT_INFO = {
  sedikit: {label:'Sedikit', key:'bersih', color:'#0A5C3B', bg:'#E9F4EE', ico:'leaf'},
  sedang:  {label:'Sedang',  key:'sedang', color:'#7A560C', bg:'#FCF3E4', ico:'clock'},
  penuh:   {label:'Penuh',   key:'penuh',  color:'#A82E22', bg:'#FCEDEB', ico:'warning'},
  bersih:  {label:'Bersih',  key:'bersih', color:'#0A5C3B', bg:'#E9F4EE', ico:'leaf'},
};
function tingkatInfo(t){
  return TINGKAT_INFO[t] || TINGKAT_INFO.sedang;
}

/* ---------- DETAIL LAPORAN PER GANG (untuk popup "Gang Sekitar") ----------
   Mock data: titik laporan (patokan dalam gang) + pelapor + waktu + tingkat.
   Dipakai saat gang diklik -> bottom sheet menampilkan lokasi & dari siapa. */
const REPORTER_NAMES = ['Bu Yati','Pak Slamet','Bu Rina','Mas Bagas','Bu Sri','Pak Dedi','Bu Wati','Mas Anto','Bu Nur','Pak Joko'];
const LAPORAN_GANG = {
  G3:[ {lok:'Depan warung Bu Yati',  oleh:'Bu Yati',    status:'penuh',  menit:8},
       {lok:'Samping pos ronda',     oleh:'Pak Slamet',  status:'penuh',  menit:26},
       {lok:'Pertigaan gang 3',      oleh:'Bu Rina',     status:'sedang', menit:74} ],
  G5:[ {lok:'Belakang masjid',       oleh:'Bu Sri',     status:'sedang', menit:22},
       {lok:'Depan nomor 12',        oleh:'Mas Anto',    status:'sedang', menit:51} ],
  G2:[ {lok:'Ujung gang (buntu)',    oleh:'Pak Dedi',   status:'bersih', menit:60},
       {lok:'Depan nomor 7',         oleh:'Bu Nur',      status:'sedang', menit:180} ],
  G9:[ {lok:'Dekat TPU',             oleh:'Bu Wati',    status:'penuh',  menit:15},
       {lok:'Depan kios sayur',      oleh:'Pak Joko',    status:'penuh',  menit:33},
       {lok:'Tengah gang 9',         oleh:'Mas Bagas',   status:'sedang', menit:120},
       {lok:'Depan nomor 4',         oleh:'Bu Yati',     status:'sedang', menit:240} ],
};
function laporanGang(g){
  /* gabungkan data mock + laporan nyata pengguna (state.laporan) untuk gang ini */
  const mock = (LAPORAN_GANG[g.id] || []).map(x=>({...x, sumber:'mock'}));
  const nyata = state.laporan.filter(r=>r.gang===g.name).map(r=>({
    lok: (r.sumber==='baru' ? 'Titik baru (GPS warga)' : 'Lokasi dilaporkan'),
    oleh:'Kamu', status:r.status, menit: Math.max(1, Math.round((Date.now()-r.waktu)/60000)),
    nyata:true
  }));
  return [...nyata, ...mock];
}
function waktuMenitLalu(m){
  if(m<1) return 'baru saja';
  if(m<60) return m+' menit lalu';
  const j = Math.round(m/60);
  if(j<24) return j+' jam lalu';
  return Math.round(j/24)+ ' hari lalu';
}

/* ---------- SIKLUS STATUS LAPORAN (NYAMPAH.md 6) ---------- */
/* menunggu -> diproses -> selesai (ditolak opsional oleh admin) */
const STATUS_LAPOR = {
  menunggu: {label:'Menunggu', badge:'kuning',  ico:'clock',   ket:'Laporan baru, belum diambil pengangkut'},
  diproses: {label:'Diproses', badge:'biru',    ico:'truck',   ket:'Sedang ditangani oleh pengangkut'},
  selesai:  {label:'Selesai',  badge:'hijau',   ico:'check',   ket:'Sudah diverifikasi selesai ditangani'},
  ditolak:  {label:'Ditolak',  badge:'merah',   ico:'x',       ket:'Laporan tidak valid/duplikat'},
};
function badgeLapor(st){
  const m = STATUS_LAPOR[st] || STATUS_LAPOR.menunggu;
  return `<span class="badge ${m.badge}"><svg class="ic ic-sm" aria-hidden="true" style="margin-right:3px"><use href="#i-${m.ico}"/></svg>${m.label}</span>`;
}

/* ---------- SISTEM POIN & ACHIEVEMENT ---------- */
const POIN_STATUS = {sedikit:1, sedang:2, penuh:3};
const ACHIEVEMENTS = [
  {poin:40,  ico:'leaf',    judul:'Mulai Peduli',       isi:'Selamat!! Kamu adalah orang yang mulai peduli lingkungan sekitarmu'},
  {poin:100, ico:'recycle', judul:'Penjaga Kebersihan', isi:'Selamat!! Kamu orang yang selalu menjaga kebersihan lingkungan sekitarmu'},
  {poin:700, ico:'trophy',  judul:'Perfeksionis',       isi:'Selamat!! Kamu perfeksionis dalam menjaga kebersihan..'},
];
function poinDariStatus(s){ return POIN_STATUS[s] || 1; }
function tambahPoin(s){ state.poin += poinDariStatus(s); save('nyampah_poin', state.poin); }
function achievementTerbuka(){ return ACHIEVEMENTS.filter(a=>state.poin>=a.poin); }
function achievementBerikut(){ return ACHIEVEMENTS.find(a=>state.poin<a.poin) || null; }
function labelTierPoin(){
  if(state.poin>=700) return 'Perfeksionis';
  if(state.poin>=100) return 'Penjaga Kebersihan';
  if(state.poin>=40)  return 'Mulai Peduli';
  return 'Pemula';
}
/* dot berwarna (bukan emoji) untuk penanda status */
function statusDot(s){ return `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${STATUS_COLOR[s]};vertical-align:middle"></span>`; }
/* helper ikon SVG */
function ic(name, cls){ return `<svg class="ic ${cls||''}" aria-hidden="true"><use href="#i-${name}"/></svg>`; }

/* Migrasi data lama: nama gang lama -> nama baru, normalisasi tingkat */
const GANG_RENAME = {'Gang 3':'Gang Pisang','Gang 5':'Gang Melati','Gang 2':'Gang Mawar','Gang 9':'Gang Jambu'};
function migrasiLaporan(list){
  return (list||[]).map(r=>{
    const rec = {...r};
    if(GANG_RENAME[rec.gang]) rec.gang = GANG_RENAME[rec.gang];
    if(!TINGKAT_INFO[rec.status]) rec.status = 'sedang';
    return rec;
  });
}

let state = {
  role:null,
  user:null,
  activeView:'v-splash',
  laporan: migrasiLaporan(load('nyampah_laporan', [])),
  notif: load('nyampah_notif', []),
  laporRT: load('nyampah_laporkan_rt', []),
  akun: load('nyampah_akun', []),
  poin: load('nyampah_poin', 40),
  rute:[
    {id:'G3', name:'Gang Pisang', status:'penuh',  prioritas:true,  done:false},
    {id:'G9', name:'Gang Jambu', status:'sedang', prioritas:false, done:false},
    {id:'G5', name:'Gang Melati', status:'sedang', prioritas:false, done:false},
  ],
  laporPenuh:'sedikit',
  foto:false,
  lokasiPilih:'Gang Pisang',
  tipGang:'G3',
  buktiTarget:null,
  /* lokasi ad-hoc (dibuat sistem dari laporan GPS warga) */
  lokasiAdhoc: load('nyampah_adhoc', []),
  /* hasil "GPS" pada form lapor: {mode:'resmi'|'baru'|'luar', nama, lat, lng, jarak} */
  laporGeo:null,
  promosiCount:0,
};

function load(k,def){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):def; }catch(e){ return def; } }
function save(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }

/* ---------- MANAJEMEN LOKASI (resmi + ad-hoc) ---------- */
/* Semua lokasi yang bisa dipilih: resmi (RT) + ad-hoc (sistem) */
function semuaLokasi(){
  return [
    ...GANGS.map(g=>({id:g.id, name:g.name, status:g.status, lat:g.lat, lng:g.lng, resmi:true, lapor:g.lapor, verif:g.verif, x:g.x, y:g.y})),
    ...state.lokasiAdhoc.map(a=>({id:a.id, name:a.name, status:a.status||'sedang', lat:a.lat, lng:a.lng, resmi:false, laporanCount:a.laporanCount||1, x:a.x, y:a.y})),
  ];
}
function lokasiByNama(nama){ return semuaLokasi().find(l=>l.name===nama); }
/* QR unik per lokasi (dipakai untuk "Lapor Tanpa Akun" via scan tembok) */
function qrLokasi(l){ return 'NYAMPAH/' + WILAYAH.rw.replace(/\s/g,'') + '/' + l.id; }
/* Kode lokasi dari QR yang di-scan (simulasi) */
function parseQR(code){
  const m = /^NYAMPAH\/([A-Za-z0-9]+)\/(.+)$/.exec((code||'').trim());
  if(!m) return null;
  return semuaLokasi().find(l=>l.id===m[2]) || null;
}
/* Simulasi pembacaan GPS di form lapor: cari lokasi resmi terdekat,
   atau buat titik ad-hoc jika belum ada & di dalam wilayah */
function bacaGPS(){
  const titik = {lat:-6.9726, lng:110.4078}; /* posisi "sekarang" (demo) */
  if(!dalamWilayah(titik.lat,titik.lng)){
    return {mode:'luar', lat:titik.lat, lng:titik.lng, jarak:jarakMeter(WILAYAH.lat,WILAYAH.lng,titik.lat,titik.lng)};
  }
  /* cari lokasi terdekat dalam radius 60m */
  let terdekat=null, minJ=Infinity;
  semuaLokasi().forEach(l=>{
    const j = jarakMeter(titik.lat,titik.lng,l.lat,l.lng);
    if(j<minJ){ minJ=j; terdekat=l; }
  });
  if(terdekat && minJ<=60 && terdekat.resmi){
    return {mode:'resmi', nama:terdekat.name, id:terdekat.id, lat:terdekat.lat, lng:terdekat.lng, jarak:minJ};
  }
  /* titik baru: cari cluster ad-hoc terdekat (<=40m) supaya tidak dobel */
  const cluster = state.lokasiAdhoc.find(a=>jarakMeter(titik.lat,titik.lng,a.lat,a.lng)<=40);
  if(cluster) return {mode:'baru', id:cluster.id, nama:cluster.name, lat:cluster.lat, lng:cluster.lng, jarak:0, cluster:true};
  return {mode:'baru', id:'A'+Date.now().toString(36), nama:'Titik Baru', lat:titik.lat, lng:titik.lng, jarak:0, cluster:false};
}
/* Simpan titik ad-hoc baru (jika belum ada) + naikkan hitungan cluster */
function simpanAdhoc(geo){
  if(geo.cluster){
    const a = state.lokasiAdhoc.find(x=>x.id===geo.id);
    if(a){ a.laporanCount = (a.laporanCount||1)+1; a.status='penuh'; }
  } else {
    const urut = state.lokasiAdhoc.length + 1;
    state.lokasiAdhoc.push({
      id:geo.id, name:'Titik Ad-hoc #'+urut, lat:geo.lat, lng:geo.lng,
      status:'penuh', laporanCount:1, x:150 + Math.floor(Math.random()*60), y:150 + Math.floor(Math.random()*60),
    });
  }
  save('nyampah_adhoc', state.lokasiAdhoc);
}
/* Pool nama jalan/gang khas kampung (dipakai saat promosi otomatis) */
const NAMA_GANG_POOL = ['Gang Anggrek','Gang Kenanga','Gang Kamboja','Gang Sawo','Gang Mangga','Gang Rambutan','Gang Durian','Gang Seroja','Gang Flamboyan','Gang Cempaka'];
/* Promosikan titik ad-hoc menjadi lokasi resmi (oleh RT) */
function promosikanLokasi(id){
  const idx = state.lokasiAdhoc.findIndex(a=>a.id===id);
  if(idx<0) return;
  const a = state.lokasiAdhoc[idx];
  /* pilih nama lokal yang belum dipakai */
  let namaResmi = NAMA_GANG_POOL.find(n=>!semuaLokasi().some(l=>l.name.toLowerCase()===n.toLowerCase()));
  if(!namaResmi) namaResmi = 'Gang Baru ' + (GANGS.length + (state.promosiCount||0) + 1);
  GANGS.push({id:a.id, name:namaResmi, x:a.x, y:a.y, status:a.status||'sedang', lapor:0, verif:0, resmi:true, lat:a.lat, lng:a.lng});
  state.lokasiAdhoc.splice(idx,1);
  state.promosiCount = (state.promosiCount||0) + 1;
  save('nyampah_adhoc', state.lokasiAdhoc);
  renderPins(); renderKelolaLokasi(); renderDashboard();
  toast(namaResmi + ' kini lokasi resmi - QR siap dicetak');
}
/* Daftarkan lokasi resmi manual oleh RT */
function tambahLokasiResmi(nama){
  nama = (nama||'').trim();
  if(!nama){ toast('Nama gang belum diisi'); return; }
  if(semuaLokasi().some(l=>l.name.toLowerCase()===nama.toLowerCase())){ toast('Nama gang sudah ada'); return; }
  const id = 'GRT'+Date.now().toString(36);
  GANGS.push({id, name:nama, x:80 + Math.floor(Math.random()*200), y:80 + Math.floor(Math.random()*120),
    status:'bersih', lapor:0, verif:0, resmi:true, lat:WILAYAH.lat+(Math.random()-0.5)*0.004, lng:WILAYAH.lng+(Math.random()-0.5)*0.004});
  renderPins(); renderKelolaLokasi(); renderDashboard();
  toast(nama + ' terdaftar sebagai lokasi resmi');
}

/* ---------- NOTIFIKASI (warga / udin / rt) ---------- */
const NOTIF_TINT = {merah:'rgba(255,122,122,0.28)', kuning:'rgba(245,197,66,0.30)', hijau:'rgba(18,183,106,0.30)', biru:'rgba(96,165,250,0.30)', ungu:'rgba(185,167,255,0.30)'};
function tambahNotif(o){
  state.notif.unshift({id:'n'+Date.now()+Math.floor(Math.random()*1000), untuk:o.untuk, ico:o.ico||'bell',
    warna:o.warna||'hijau', judul:o.judul, isi:o.isi, waktu:Date.now(), dibaca:false});
  state.notif = state.notif.slice(0,40);
  save('nyampah_notif', state.notif);
  refreshNotifBadge();
}
function notifUntuk(siapa){ return state.notif.filter(n=>n.untuk===siapa); }
function notifBaru(siapa){ return notifUntuk(siapa).filter(n=>!n.dibaca).length; }
function refreshNotifBadge(){
  const map = { bellWarga:'warga', bellUdin:'udin', bellAdmin:'rt' };
  Object.keys(map).forEach(id=>{
    const el = document.getElementById(id); if(!el) return;
    const ada = notifBaru(map[id])>0;
    el.classList.toggle('seen', !ada);
  });
}
function bukaNotif(siapa){
  const list = notifUntuk(siapa);
  notifUntuk(siapa).forEach(n=>n.dibaca=true); save('nyampah_notif', state.notif); refreshNotifBadge();
  const judul = siapa==='warga'?'Notifikasi Saya':siapa==='udin'?'Tugas Masuk':'Kabar untuk Pengelola';
  const sub = siapa==='warga'?'Kabar laporan & gangmu':siapa==='udin'?'Laporan yang perlu diangkut':'Laporan warga & pengaduan';
  const body = list.length===0
    ? `<div class="empty"><div class="em"><svg class="ic" style="width:56px;height:56px" aria-hidden="true"><use href="#i-bell"/></svg></div><h4>Belum ada notifikasi</h4><p>Kabar terbaru akan muncul di sini.</p></div>`
    : list.map(n=>`<div class="role" style="margin-bottom:12px" onclick="tutupSheet()">
        <div class="ico" style="background:${NOTIF_TINT[n.warna]||NOTIF_TINT.hijau}"><svg class="ic" aria-hidden="true"><use href="#i-${n.ico}"/></svg></div>
        <div class="txt" style="flex:1;min-width:0"><h4>${n.judul}</h4><p>${n.isi}</p></div>
        <span style="font-size:11px;color:var(--teks-muted);white-space:nowrap;align-self:flex-start;margin-top:2px">${waktuLalu(n.waktu)}</span></div>`).join('');
  bukaSheet(`<h3>${judul}</h3><p class="sub">${sub}</p>${body}`);
}


/* ---------- NAVIGASI ---------- */
function show(id, back){
  const next = document.getElementById(id);
  if(!next) return;

  document.querySelectorAll('.view').forEach(v=>{ v.hidden = true; v.classList.remove('enter','enter-back'); });
  next.hidden = false;
  next.classList.add(back ? 'enter-back' : 'enter');
  next.scrollTop = 0;
  state.activeView = id;

  const tabbar = document.getElementById('tabbar');
  const wargaTabs = ['v-peta','v-riwayat','v-kontribusi','v-profil'];
  if(tabbar) tabbar.hidden = !(state.role==='warga' && wargaTabs.includes(id));
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===id));

  /* status bar selalu gelap (tema putih) */
  const sb = document.getElementById('statusbar');
  if(sb) sb.classList.remove('terang');

  // skeleton sesaat untuk riwayat (feedback loading, hindari flash)
  if(id==='v-riwayat'){
    const el = document.getElementById('riwayatContent');
    el.innerHTML = skeleton();
    setTimeout(()=>renderRiwayat(), 320);
  }
  if(id==='v-kontribusi'){
    renderKontribusi();
  }
  if(id==='v-peta' && nyMap){
    setTimeout(()=>nyMap.invalidateSize(), 60);
  }
}

/* ---------- GANTI PERAN (pakai halaman Pilih Peran) ---------- */
let pilihPeranFrom = 'v-splash';   // asal buka halaman pilih peran
function gantiPeran(fromId){
  pilihPeranFrom = fromId || state.activeView || 'v-splash';
  show('v-pilihperan');
}
function tutupPilihPeran(){
  const dest = (state.role==='warga'||state.role==='udin'||state.role==='rt'||state.role==='admin')
    ? (pilihPeranFrom && pilihPeranFrom!=='v-splash' ? pilihPeranFrom : 'v-splash')
    : 'v-splash';
  show(dest, true);
}

/* ---------- LOGIN (sementara: email 1234 / sandi 1234) ---------- */
const DEMO_EMAIL='1234', DEMO_PASS='1234', DEMO_ADMIN_CODE='1234';

function loginInputOn(which){
  const el=document.getElementById('loginErr');
  if(el) el.textContent='';
  [['email','wrapEmail'],['pass','wrapPass'],['nama','wrapNama']].forEach(([k,id])=>{
    const w=document.getElementById(id); if(w) w.classList.remove('err');
  });
  const w=document.getElementById('wrapTerms'); if(w) w.style.color='';
}
function loginKey(e){ if(e.key==='Enter'){ e.preventDefault(); doLogin(); } }
function togglePass(){
  const inp=document.getElementById('inPass'), btn=document.getElementById('eyeBtn');
  const show = inp.type==='password';
  inp.type = show ? 'text' : 'password';
  btn.setAttribute('aria-pressed', show?'true':'false');
  btn.setAttribute('aria-label', show?'Sembunyikan kata sandi':'Tampilkan kata sandi');
}
function loginErr(msg, field){
  const el=document.getElementById('loginErr');
  el.innerHTML =
    '<svg class="ic ic-sm" aria-hidden="true" style="color:var(--merah)"><use href="#i-warning"/></svg>'+
    '<span>'+msg+'</span>';
  /* per-field: tandai invalid + fokuskan agar pembaca layar & keyboard tahu kesalahannya */
  const inputs = {Email:'inEmail', Pass:'inPass', Nama:'inNama'};
  Object.keys(inputs).forEach(k=>{
    const inp = document.getElementById(inputs[k]);
    if(inp) inp.removeAttribute('aria-invalid');
  });
  if(field){
    const w=document.getElementById('wrap'+field); if(w) w.classList.add('err');
    const inp = document.getElementById(inputs[field]);
    if(inp){ inp.setAttribute('aria-invalid','true'); inp.focus({preventScroll:true}); }
  }
}
function doLogin(){
  const email=document.getElementById('inEmail').value.trim();
  const pass=document.getElementById('inPass').value.trim();
  const terms=document.getElementById('chkTerms').checked;
  const nama=document.getElementById('inNama').value.trim();
  const daftar = authMode==='daftar';

  if(daftar && !nama){ loginErr('Nama belum diisi','Nama'); return; }
  if(!email){ loginErr('Email belum diisi','Email'); return; }
  if(!pass){ loginErr('Kata sandi belum diisi','Pass'); return; }
  if(!terms){
    loginErr('Centang dulu persetujuan penggunaan lokasi.');
    const w=document.getElementById('wrapTerms'); if(w) w.style.color='var(--merah)';
    return;
  }

  if(daftar){
    /* Mode daftar: buat akun lokal (demo), lalu langsung masuk */
    const akun = {id:'u'+Date.now(), nama:nama, email:email, role:authRole==='udin'?'pengepul':'warga', status:'pending'};
    state.akun.unshift(akun); save('nyampah_akun', state.akun);
    state.user = nama;
    if(navigator.vibrate) navigator.vibrate(12);
    toast('Akun dibuat - selamat datang, '+nama);
    masukSebagai(authRole);
    return;
  }

  if(email!==DEMO_EMAIL || pass!==DEMO_PASS){
    loginErr('Email atau kata sandi salah. Coba 1234 / 1234.');
    return;
  }
  state.user = email;
  document.getElementById('inPass').value='';
  document.getElementById('loginErr').textContent='';
  if(navigator.vibrate) navigator.vibrate(12);
  toast('Berhasil masuk');
  masukSebagai(authRole);
}
function masukSebagai(role){
  if(role==='rt'){
    /* Pengelola: setelah login/daftar, verifikasi kode dulu */
    resetPin(); show('v-adminpin');
    state.role='rt';
    setTimeout(()=>pinBoxes()[0].focus(), 350);
    return;
  }
  setRole(role);
}
function doLogout(){
  state.user=null; state.role=null;
  document.getElementById('inEmail').value='';
  document.getElementById('inPass').value='';
  document.getElementById('inNama').value='';
  document.getElementById('chkTerms').checked=false;
  document.getElementById('loginErr').textContent='';
  resetPin();
  show('v-splash', true);
  toast('Kamu sudah keluar');
}

/* ---------- VERIFIKASI KODE ADMIN ---------- */
function pinBoxes(){ return [...document.querySelectorAll('#pinRow .pin-box')]; }
function resetPin(){
  pinBoxes().forEach(b=>{ b.value=''; b.classList.remove('filled','err'); });
  const e=document.getElementById('pinErr'); if(e) e.textContent='';
  const btn=document.getElementById('pinBtn'); if(btn) btn.disabled=true;
}
function pinValue(){ return pinBoxes().map(b=>b.value).join(''); }
function pinOn(el, i){
  el.value = el.value.replace(/\D/g,'').slice(-1);
  el.classList.toggle('filled', !!el.value);
  el.classList.remove('err');
  document.getElementById('pinErr').textContent='';
  const boxes=pinBoxes();
  if(el.value && i<boxes.length-1) boxes[i+1].focus();
  document.getElementById('pinBtn').disabled = pinValue().length!==4;
  if(pinValue().length===4) setTimeout(verifAdmin, 160);
}
function pinKey(e, i){
  const boxes=pinBoxes();
  if(e.key==='Backspace' && !boxes[i].value && i>0){ boxes[i-1].focus(); boxes[i-1].value=''; boxes[i-1].classList.remove('filled'); }
  if(e.key==='ArrowLeft'  && i>0) boxes[i-1].focus();
  if(e.key==='ArrowRight' && i<boxes.length-1) boxes[i+1].focus();
}
function pinKirimUlang(){ toast('Kode verifikasi baru sudah dikirim'); }
function verifAdmin(){
  const val=pinValue();
  if(val.length!==4){ document.getElementById('pinErr').textContent='Isi dulu 4 angka kode verifikasi.'; return; }
  if(val!==DEMO_ADMIN_CODE){
    const boxes=pinBoxes();
    boxes.forEach(b=>b.classList.add('err'));
    document.getElementById('pinErr').textContent='Kode verifikasi salah.';
    if(navigator.vibrate) navigator.vibrate([14,60,14]);
    setTimeout(()=>{ resetPin(); pinBoxes()[0].focus(); }, 700);
    return;
  }
  state.role='rt';
  if(navigator.vibrate) navigator.vibrate(12);
  toast('Kode benar - masuk sebagai Pengelola');
  resetPin();
  renderDashboard(); show('v-dashboard');
}

/* ---------- PILIH PERAN -> AUTH ---------- */
const ROLE_META = {
  warga: {nama:'Warga',           ico:'user',  desc:'Ada sampah numpuk? Lapor aja, biar gang kita bersih lagi.'},
  udin:  {nama:'Pengangkut Sampah',ico:'truck', desc:'Siap bertugas angkut sampah ke TPS terdekat.'},
  rt:    {nama:'Pengelola (RT / Kelurahan)', ico:'chart', desc:'Masuk dulu, verifikasi kode menyusul.'},
};
let authMode = 'masuk', authRole = 'warga';

document.querySelectorAll('.role').forEach(r=>{
  r.addEventListener('click',()=>{
    const role = r.dataset.role;
    if(!role) return;
    // kalau sudah masuk & pilih role yang sama dari menu, langsung ganti peran
    if(state.user && role!=='rt'){ setRole(role); return; }
    bukaAuth(role);
  });
});

/* ---------- FORM AUTH (Login / Daftar) ---------- */
function bukaAuth(role){
  authRole = role;
  const m = ROLE_META[role];
  document.getElementById('authRoleDesc').textContent = m.desc;
  document.getElementById('authHead').textContent = 'Masuk sebagai ' + m.nama;
  authTab('masuk');
  document.getElementById('loginErr').textContent='';
  show('v-auth');
}
function authTab(mode){
  authMode = mode;
  const daftar = mode==='daftar';
  document.getElementById('fieldNama').style.display = daftar ? 'block' : 'none';
  document.getElementById('authSubmit').textContent = daftar ? 'DAFTAR & MASUK' : 'MASUK';
  document.getElementById('authSwitchTxt').textContent = daftar ? 'Sudah punya akun?' : 'Belum punya akun?';
  document.getElementById('authSwitchBtn').textContent = daftar ? 'Login di sini' : 'Daftar sekarang';
  document.getElementById('authSwitchBtn').onclick = ()=>authTab(daftar ? 'masuk' : 'daftar');
  document.getElementById('loginErr').textContent='';
  document.getElementById('lblPass').textContent = daftar ? 'Buat kata sandi' : 'Kata sandi';
  /* fokuskan field pertama agar keyboard/reader langsung sampai */
  const first = daftar ? document.getElementById('inNama') : document.getElementById('inEmail');
  if(first) first.focus({preventScroll:true});
}

/* ---------- SET PERAN ---------- */
function setRole(role){
  state.role = role;
  if(role==='warga'){ renderPins(); renderRiwayat(); renderProfil(); show('v-peta'); }
  else if(role==='udin'){ renderUdin(); show('v-rute'); }
  else if(role==='rt'){ renderDashboard(); show('v-dashboard'); }
  refreshNotifBadge();
}

/* ---------- PETA (Leaflet interaktif) ---------- */
let nyMap = null, nyMarkers = {}, nyYouMarker = null;
function initMap(){
  if(nyMap || typeof L === 'undefined') return;
  const el = document.getElementById('leafletMap');
  if(!el) return;
  nyMap = L.map(el, {
    zoomControl:false, attributionControl:true,
    center:[-6.9731, 110.4090], zoom:16, zoomSnap:0.5,
    scrollWheelZoom:false, tap:true
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19, attribution:'&copy; OpenStreetMap'
  }).addTo(nyMap);
  /* titik "kamu di sini" */
  nyYouMarker = L.marker([-6.9725, 110.4083], {
    icon: L.divIcon({className:'', html:'<div class="you-dot"></div>', iconSize:[22,22], iconAnchor:[11,11]}),
    interactive:false
  }).addTo(nyMap);
}
function renderPins(newId){
  initMap();
  if(!nyMap){
    /* fallback: jika Leaflet gagal dimuat, tetap tampilkan kartu lokasi */
    renderTip(GANGS.find(x=>x.id===state.tipGang) || GANGS[0]);
    return;
  }
  /* bersihkan marker lama */
  Object.values(nyMarkers).forEach(m=>nyMap.removeLayer(m));
  nyMarkers = {};

  GANGS.forEach((g,i)=>{
    const icon = L.divIcon({
      className:'ny-pin'+(newId===g.id?' newPin':''),
      html: pinSVG(STATUS_COLOR[g.status], String(i+1)),
      iconSize:[34,42], iconAnchor:[17,42], popupAnchor:[0,-38]
    });
    const m = L.marker([g.lat, g.lng], {icon, title:g.name, alt:g.name+' - '+STATUS_LABEL[g.status]}).addTo(nyMap);
    m.on('click', ()=>pilihPinById(g.id));
    m.bindTooltip(g.name, {direction:'top', offset:[0,-36]});
    nyMarkers[g.id] = m;
  });

  /* pin ad-hoc (belum resmi, lat/lng titik) */
  state.lokasiAdhoc.forEach(a=>{
    const lat = a.lat || WILAYAH.lat, lng = a.lng || WILAYAH.lng;
    const icon = L.divIcon({
      className:'ny-pin'+(newId===a.id?' newPin':''),
      html: pinAdhocSVG(), iconSize:[30,37], iconAnchor:[15,37]
    });
    const m = L.marker([lat, lng], {icon, title:a.name, alt:a.name+' - titik ad-hoc'}).addTo(nyMap);
    m.on('click', ()=>toast(a.name + ' - titik ad-hoc (belum terdaftar)'));
    nyMarkers[a.id] = m;
  });

  renderTip(GANGS.find(x=>x.id===state.tipGang) || GANGS[0]);
  setTimeout(()=>nyMap.invalidateSize(), 60);
}
function fokusPeta(id){
  const g = GANGS.find(x=>x.id===id);
  if(g && nyMap) nyMap.flyTo([g.lat, g.lng], Math.max(nyMap.getZoom(), 16.5), {duration:0.6});
  const mk = nyMarkers[id];
  if(mk && nyMap) mk.openTooltip();
}
function pinSVG(color,label){
  return `<svg width="34" height="42" viewBox="0 0 34 42"><path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 25 17 25s17-13 17-25C34 7.6 26.4 0 17 0z" fill="${color}"/><circle cx="17" cy="16" r="11" fill="rgba(255,255,255,0.25)"/><text x="17" y="21" font-family="Archivo,sans-serif" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">${label}</text></svg>`;
}
function pinAdhocSVG(){
  return `<svg width="30" height="37" viewBox="0 0 34 42"><path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 25 17 25s17-13 17-25C34 7.6 26.4 0 17 0z" fill="#fff" stroke="#8A6415" stroke-width="2.5" stroke-dasharray="4 3"/><circle cx="17" cy="16" r="5" fill="#B5820F"/></svg>`;
}

function renderTip(g){
  state.tipGang = g.id;
  // kartu mengambang di peta
  document.getElementById('locName').textContent = g.name;
  document.getElementById('locMeta').textContent = g.lapor + ' menit lalu - ' + g.verif + ' warga verifikasi';
  // kartu gang sekitar (Material 3: tonal container, chip pill, mini-dots) — berwarna per status
  const ico = {penuh:'warning', sedang:'clock', bersih:'leaf'};
  document.getElementById('tipCard').innerHTML = GANGS.map(x=>`
    <div class="gang-card${x.id===state.tipGang?' sel':''}" data-status="${x.status}" onclick="pilihPinById('${x.id}')">
      <div class="gc-top">
        <div class="gc-ico" aria-hidden="true"><svg class="ic"><use href="#i-${ico[x.status]}"/></svg></div>
        <div class="gc-name">
          <h4>${x.name}</h4>
          <div class="sub">${x.lapor} menit lalu - ${x.verif} warga verifikasi</div>
        </div>
      </div>
      <div class="gc-meta">
        <span class="gc-tag"><svg class="ic" aria-hidden="true"><use href="#i-file"/></svg>${x.lapor} laporan</span>
        <span class="gc-lvl" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="gc-pill"><svg class="ic" aria-hidden="true"><use href="#i-${ico[x.status]}"/></svg>${STATUS_LABEL[x.status]}</span>
      </div>
    </div>`).join('');
}
function pilihPinById(id){
  const g = GANGS.find(x=>x.id===id);
  if(g){ renderTip(g); fokusPeta(id); bukaDetailGang(id); }
}
/* Bottom sheet: detail gang (lokasi laporan & dari siapa) */
function bukaDetailGang(id){
  const g = GANGS.find(x=>x.id===id);
  if(!g) return;
  const list = laporanGang(g);
  const baris = list.length ? list.map(x=>`
    <div class="dg-item">
      <div class="dg-txt">
        <div class="dg-lok"><svg class="ic ic-sm" aria-hidden="true"><use href="#i-pin"/></svg>${x.lok}</div>
        <div class="dg-sub">${x.oleh} - ${waktuMenitLalu(x.menit)}</div>
      </div>
      <span class="dg-status">${STATUS_LABEL[x.status]}</span>
    </div>`).join('') : `<p class="dg-empty">Belum ada laporan di gang ini.</p>`;

  bukaSheet(`
    <h3>${g.name}</h3>
    <p class="sub">${g.lapor} menit lalu - ${g.verif} warga verifikasi - status <b>${STATUS_LABEL[g.status]}</b></p>

    <div class="dg-sum">
      <div class="dg-sum-c"><b>${list.length}</b><span>Titik laporan</span></div>
      <div class="dg-sum-c"><b>${new Set(list.map(x=>x.oleh)).size}</b><span>Pelapor</span></div>
      <div class="dg-sum-c"><b>${list.filter(x=>x.status==='penuh').length}</b><span>Penuh</span></div>
    </div>

    <div class="dg-label">Lokasi laporan &amp; pelapor</div>
    <div class="dg-list">${baris}</div>
  `);
}

/* ---------- FORM LAPOR ---------- */
function keLapor(){
  resetSeg();
  state.foto = false; updateFotoUI();
  /* deteksi lokasi otomatis: GPS -> lokasi resmi terdekat / titik ad-hoc / luar wilayah */
  deteksiLokasi();
  show('v-lapor');
}
/* Deteksi lokasi (simulasi GPS) + render status sumbernya */
function deteksiLokasi(){
  const geo = bacaGPS();
  state.laporGeo = geo;
  const box = document.getElementById('locBox');
  const txt = document.getElementById('laporLokasi');
  const src = document.getElementById('locSource');

  if(geo.mode==='luar'){
    if(box) box.classList.add('warn');
    if(txt) txt.textContent = 'Di luar wilayah ' + WILAYAH.rw;
    if(src){ src.className='loc-source luar'; src.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-warning"/></svg> Perangkat berada ~'+geo.jarak+' m dari pusat RW. Laporan hanya untuk wilayah RW '+WILAYAH.rw.replace('RW ','')+'.'; }
    state.lokasiPilih = null;
    return;
  }
  if(box) box.classList.remove('warn');
  if(geo.mode==='resmi'){
    state.lokasiPilih = geo.nama;
    if(txt) txt.textContent = geo.nama + ', ' + WILAYAH.rw;
    if(src){ src.className='loc-source ok'; src.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-pin"/></svg> Terdeteksi di lokasi resmi - '+geo.jarak+' m dari titik'; }
    return;
  }
  /* mode baru (ad-hoc) */
  state.lokasiPilih = geo.cluster ? geo.nama : 'Lokasi Baru (Belum terdaftar)';
  if(txt) txt.textContent = geo.cluster ? (geo.nama + ' (titik ad-hoc)') : 'Lokasi Baru (Belum terdaftar)';
  if(src){ src.className='loc-source baru'; src.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-info"/></svg> Belum ada QR di sini - titik akan dibuat otomatis di dalam wilayah '+WILAYAH.rw.replace('RW ','')+'.'; }
}
/* Set lokasi manual dari sheet (lokasi resmi) */
function setLokasi(nama){ setLokasiObj(nama, 'manual'); }
function setLokasiObj(nama, from){
  state.lokasiPilih = nama;
  const src = document.getElementById('locSource');
  const box = document.getElementById('locBox');
  if(box) box.classList.remove('warn');
  document.getElementById('laporLokasi').textContent = nama + ', ' + WILAYAH.rw;
  if(src){ src.className='loc-source ok'; src.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-check"/></svg> Lokasi dipilih manual'; }
  state.laporGeo = {mode:'manual', nama};
  tutupSheet();
}
function pilihLokasiSheet(){
  bukaSheet(`<h3>Pilih Lokasi</h3><p class="sub">Pilih gang tempat tumpukan berada</p>
    ${semuaLokasi().map(l=>`<div class="role" style="margin-bottom:10px" onclick="setLokasi('${l.name}')">
      <div class="ico" style="background:${l.resmi?'var(--hijau-muda)':'var(--kuning-muda)'};color:${l.resmi?'var(--hijau-tua)':'#8A6415'}"><svg class="ic" aria-hidden="true"><use href="#i-pin"/></svg></div>
      <div class="txt"><h4>${l.name}</h4><p>${WILAYAH.rw} - ${l.resmi?'Lokasi resmi':'Titik ad-hoc'}</p></div>
      <div class="chev"><svg class="ic ic-sm" aria-hidden="true"><use href="#i-chevron-right"/></svg></div></div>`).join('')}`);
}

function kirimLaporan(ev){
  /* validasi wilayah dulu */
  const geo = state.laporGeo;
  if(geo && geo.mode==='luar'){
    toast('Di luar wilayah ' + WILAYAH.rw + ' - laporan tidak bisa dikirim');
    return;
  }
  if(!state.lokasiPilih){ toast('Lokasi belum terdeteksi'); return; }

  const btn = (ev&&ev.target)?ev.target:document.getElementById('btnKirim');
  const old = btn.innerHTML;
  btn.innerHTML = '<div class="spinner"></div>'; btn.disabled = true;

  setTimeout(()=>{
    btn.innerHTML = old; btn.disabled = false;

    /* jika titik ad-hoc baru -> simpan ke sistem (cluster) */
    let namaFinal = state.lokasiPilih;
    if(geo && geo.mode==='baru'){
      simpanAdhoc(geo);
      const a = state.lokasiAdhoc.find(x=>x.id===geo.id) || state.lokasiAdhoc[state.lokasiAdhoc.length-1];
      if(a){ namaFinal = a.name; state.lokasiPilih = a.name; }
      tambahNotif({untuk:'rt', ico:'pin', warna:'kuning', judul:'Titik baru terdeteksi',
        isi:'Warga lapor di lokasi belum terdaftar. Perlu ditinjau untuk dijadikan lokasi resmi.'});
    }

    const rec = {gang:namaFinal, status:state.laporPenuh, waktu:Date.now(), laporStatus:'menunggu', sumber:(geo&&geo.mode)||'manual'};
    state.laporan.unshift(rec); save('nyampah_laporan', state.laporan);
    tambahPoin(rec.status);

    const g = GANGS.find(x=>x.name===namaFinal);
    if(g){ g.status = state.laporPenuh==='penuh'?'penuh':'sedang'; g.lapor=1; }

    document.getElementById('confGang').textContent = namaFinal;
    document.getElementById('confStatus').textContent = STATUS_LABEL[state.laporPenuh];
    document.getElementById('confVerif').textContent = Math.floor(Math.random()*10)+8;

    renderPins(g?g.id:null);
    renderRiwayat(); renderProfil(); updateHero();
    tambahNotif({untuk:'udin', ico:'truck', warna:'kuning', judul:'Laporan baru - '+namaFinal,
      isi:'Warga melaporkan tumpukan '+STATUS_LABEL[state.laporPenuh].toLowerCase()+' di '+namaFinal});
    tambahNotif({untuk:'rt', ico:'camera', warna:'merah', judul:'Laporan warga - '+namaFinal,
      isi:'Status '+STATUS_LABEL[state.laporPenuh].toLowerCase()+', menunggu pengangkutan'});
    show('v-konfirmasi');
    toast('Laporan terkirim!');
  }, 1000);
}
function segBtns(){ return [...document.querySelectorAll('#segPenuh button')]; }
function pilihSeg(idx, focus){
  const bs = segBtns();
  if(!bs.length) return;
  idx = (idx + bs.length) % bs.length;   /* wrap */
  bs.forEach((x,i)=>{
    const on = i===idx;
    x.classList.toggle('on', on);
    x.setAttribute('aria-checked', on?'true':'false');
    x.tabIndex = on ? 0 : -1;            /* roving tabindex */
  });
  state.laporPenuh = bs[idx].dataset.v;
  if(focus) bs[idx].focus();
}
segBtns().forEach((b,i)=>{
  b.onclick = ()=>pilihSeg(i);
  b.addEventListener('keydown', e=>{
    if(e.key==='ArrowRight' || e.key==='ArrowDown'){ e.preventDefault(); pilihSeg(i+1, true); }
    else if(e.key==='ArrowLeft' || e.key==='ArrowUp'){ e.preventDefault(); pilihSeg(i-1, true); }
    else if(e.key===' ' || e.key==='Enter'){ e.preventDefault(); pilihSeg(i, true); }
  });
});
function resetSeg(){
  pilihSeg(0);
}
function toggleFoto(){ state.foto = !state.foto; updateFotoUI(); }
function updateFotoUI(){
  document.getElementById('photoPrev').style.display = state.foto?'block':'none';
  document.getElementById('photoIco').innerHTML = state.foto
    ? '<svg class="ic ic-lg" style="color:var(--hijau)" aria-hidden="true"><use href="#i-check-circle"/></svg>'
    : '<svg class="ic ic-lg" aria-hidden="true"><use href="#i-camera"/></svg>';
  document.getElementById('photoTxt').innerHTML = state.foto?'<b>Foto terlampir</b><br>Terima kasih!':'Membantu pengangkut sampah<br>menemukan titik lebih cepat';
}
function hapusFoto(e){ e.stopPropagation(); state.foto=false; updateFotoUI(); }

/* ---------- RIWAYAT ---------- */
function skeleton(){
  return Array.from({length:3}).map(()=>`<div class="list-card" style="cursor:default">
    <div class="lc-ico skel" style="border-radius:12px"></div>
    <div style="flex:1"><div class="skel skel-line w60"></div><div class="skel skel-line w40" style="margin-bottom:0"></div></div>
  </div>`).join('');
}
function renderRiwayat(){
  const el = document.getElementById('riwayatContent');
  if(state.laporan.length===0){
    el.innerHTML = `<div class="empty"><div class="em"><svg class="ic" style="width:56px;height:56px" aria-hidden="true"><use href="#i-clock"/></svg></div><h4>Belum ada laporan</h4>
      <p>Laporan yang kamu kirim akan muncul di sini.</p>
      <button class="btn btn-primer" style="max-width:220px;margin-top:6px" onclick="show('v-peta')">Lihat Peta</button></div>`;
    return;
  }
  const total = state.laporan.length;
  const selesai = state.laporan.filter(r=>r.angkut || r.laporStatus==='selesai').length;
  const ringkasan = `
    <div class="stat-grid" style="margin-top:4px">
      <div class="stat s1"><div class="num">${total}</div><div class="lbl">Total Laporan</div></div>
      <div class="stat s2"><div class="num">${selesai}</div><div class="lbl">Sudah Diangkut</div></div>
    </div>
    <div class="section-title">Daftar Laporan</div>`;

  el.innerHTML = ringkasan + state.laporan.map(r=>{
    const st = r.laporStatus || (r.angkut ? 'selesai' : 'menunggu');
    const m = STATUS_LAPOR[st] || STATUS_LAPOR.menunggu;
    const t = tingkatInfo(r.status);
    const waktuLabel = r.angkut ? ('Diangkut ' + waktuLalu(r.angkutWaktu)) : m.ket;
    return `
    <div class="riw-card" data-st="${st}">
      <div class="riw-top">
        <div class="riw-ico" aria-hidden="true"><svg class="ic"><use href="#i-${m.ico}"/></svg></div>
        <div class="riw-head">
          <h4><svg class="ic" aria-hidden="true"><use href="#i-pin"/></svg>${r.gang}</h4>
          <div class="sub">${waktuLabel}</div>
        </div>
        <span class="riw-pill"><svg class="ic" aria-hidden="true"><use href="#i-${m.ico}"/></svg>${m.label}</span>
      </div>
      <div class="riw-foot">
        <span class="riw-tag" style="color:${t.color}"><svg class="ic" aria-hidden="true"><use href="#i-${t.ico}"/></svg>Tingkat: ${t.label}</span>
        <span class="riw-time"><svg class="ic" aria-hidden="true"><use href="#i-clock"/></svg>${waktuLalu(r.waktu)}</span>
      </div>
    </div>`;
  }).join('');
}

/* ---------- PROFIL ---------- */
function renderProfil(){
  document.getElementById('profilContent').innerHTML = `
    <div class="card" style="text-align:center;padding:24px 18px">
      <div style="width:76px;height:76px;border-radius:16px;background:var(--kompos-muda);display:flex;align-items:center;justify-content:center;margin:0 auto"><svg class="ic" style="width:40px;height:40px;color:var(--kompos)" aria-hidden="true"><use href="#i-user"/></svg></div>
      <h3 style="font-family:'Archivo';font-weight:800;font-size:19px;color:var(--hitam);margin-top:12px">Warga RW 05</h3>
      <p style="font-size:13px;color:var(--teks-muted);margin-top:4px">Tanpa akun - Tanpa data pribadi</p>
    </div>
    <div class="section-title">Statistik</div>
    <div class="stat-grid">
      <div class="stat s1"><div class="num" id="statSaya">${state.laporan.length}</div><div class="lbl">Laporan Saya</div></div>
      <div class="stat s2"><div class="num">${state.laporan.filter(r=>r.angkut).length}</div><div class="lbl">Sudah Diangkut</div></div>
    </div>
    <div class="section-title">Pengaturan</div>
    <div class="list-card" onclick="bukaNotif('warga')">
      <div class="lc-ico" style="background:#FDF3E2"><svg class="ic" aria-hidden="true"><use href="#i-bell"/></svg></div>
      <div style="flex:1"><div class="title">Notifikasi</div><div class="meta">Kabar saat gangmu terangkut</div></div>
      ${notifBaru('warga')>0?`<span class="badge merah">${notifBaru('warga')} baru</span>`:`<span class="badge hijau">Aktif</span>`}
    </div>
    <div class="list-card" onclick="bukaLaporRT()">
      <div class="lc-ico" style="background:rgba(255,122,122,0.30)"><svg class="ic" aria-hidden="true"><use href="#i-warning"/></svg></div>
      <div style="flex:1"><div class="title">Laporkan RT</div><div class="meta">Sampah tak kunjung diangkut? Adukan ke pengelola</div></div>
      <span style="display:flex;color:var(--abu)"><svg class="ic" aria-hidden="true"><use href="#i-chevron-right"/></svg></span>
    </div>
    <div class="list-card">
      <div class="lc-ico" style="background:#EAF6EE"><svg class="ic" aria-hidden="true"><use href="#i-moon"/></svg></div>
      <div style="flex:1"><div class="title">Mode gelap sore</div><div class="meta">Otomatis setelah jam 6</div></div>
      <span class="badge kompos">Auto</span>
    </div>
    <div class="list-card" onclick="gantiPeran('v-profil')">
      <div class="lc-ico" style="background:#FBEAEA"><svg class="ic" aria-hidden="true"><use href="#i-door"/></svg></div>
      <div style="flex:1"><div class="title">Ganti peran</div></div>
      <span style="display:flex;color:var(--abu)"><svg class="ic" aria-hidden="true"><use href="#i-chevron-right"/></svg></span>
    </div>`;
}

/* ---------- LAPORKAN RT (warga > admin) ---------- */
function bukaLaporRT(){
  const inputStyle = 'width:100%;padding:13px;border-radius:12px;border:1.5px solid rgba(140,140,140,0.45);background:rgba(255,255,255,0.06);color:inherit;font-family:inherit;font-size:14.5px;font-weight:600;outline:none';
  bukaSheet(`<h3>Laporkan RT</h3><p class="sub">Sampah tak kunjung diangkut? Beri tahu pengelola.</p>
    <div class="field">
      <label class="field-label">Gang yang bermasalah</label>
      <select id="rtGang" style="${inputStyle}">
        ${semuaLokasi().map(l=>`<option value="${l.name}">${l.name}${l.resmi?'':' (ad-hoc)'}</option>`).join('')}
      </select>
    </div>
    <div class="field" style="margin-top:12px">
      <label class="field-label">Sudah berapa lama tidak diangkut?</label>
      <select id="rtLama" style="${inputStyle}">
        <option value="1 hari">1 hari</option>
        <option value="2-3 hari">2-3 hari</option>
        <option value="Lebih dari 3 hari">Lebih dari 3 hari</option>
        <option value="Lebih dari seminggu">Lebih dari seminggu</option>
      </select>
    </div>
    <div class="field" style="margin-top:12px">
      <label class="field-label">Catatan (opsional)</label>
      <textarea id="rtCatatan" rows="3" style="${inputStyle};resize:none" placeholder="Contoh: sudah menumpuk dan bau, gang sempit"></textarea>
    </div>
    <button class="btn btn-primer btn-lg" style="margin-top:18px" onclick="kirimLaporRT()"><svg class="ic ic-sm" aria-hidden="true"><use href="#i-warning"/></svg> Kirim Aduan ke RT</button>`);
}
function kirimLaporRT(){
  const gang = (document.getElementById('rtGang')||{}).value || state.lokasiPilih;
  const lama = (document.getElementById('rtLama')||{}).value || '1 hari';
  const catatan = ((document.getElementById('rtCatatan')||{}).value || '').trim();
  const rec = {gang, lama, catatan, waktu:Date.now(), status:'menunggu'};
  state.laporRT.unshift(rec); save('nyampah_laporkan_rt', state.laporRT);
  tambahNotif({untuk:'rt', ico:'warning', warna:'merah', judul:'Aduan warga - '+gang,
    isi:'Belum diangkut '+lama+'. '+(catatan?('"'+catatan+'"'):'Warga meminta penanganan.')});
  tutupSheet();
  toast('Aduan terkirim ke RT');
}


/* ---------- HERO & KONTRIBUSI ---------- */
function updateHero(){
  const penuh = GANGS.filter(g=>g.status==='penuh').length;
  const hc = document.getElementById('heroCount');
  if(hc) hc.innerHTML = penuh + ' <small>titik penuh</small>';
  const fk = document.getElementById('featKontrib');
  if(fk) fk.textContent = state.poin + ' poin';
}

/* ---------- HALAMAN KONTRIBUSIKU ---------- */
function renderKontribusi(){
  const el = document.getElementById('kontribusiContent');
  if(!el) return;
  const next = achievementBerikut();
  const prevPoin = achievementTerbuka().reduce((m,a)=>Math.max(m,a.poin),0);
  const targetPoin = next ? next.poin : state.poin;
  const pct = next ? Math.min(100, Math.round(((state.poin-prevPoin)/(targetPoin-prevPoin))*100)) : 100;
  const terbuka = achievementTerbuka().length;

  el.innerHTML = `
    <div class="card" style="padding:20px;background:#EAF6EE;color:#12201A">
      <div style="font-size:12.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;opacity:.8">Total Poin Kontribusi</div>
      <div style="font-size:40px;font-weight:800;line-height:1.05;margin-top:6px;letter-spacing:-0.5px">${state.poin} <small style="font-size:15px;font-weight:700;opacity:.8">poin</small></div>
      <div style="font-size:13px;margin-top:8px;opacity:.92;line-height:1.5">Tingkat: <b>${labelTierPoin()}</b> - ${terbuka}/${ACHIEVEMENTS.length} pencapaian terbuka</div>
    </div>

    <div class="section-title">Progres ke Pencapaian Berikutnya</div>
    <div class="card" style="padding:16px">
      ${next ? `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-size:12.5px;color:var(--abu)">Menuju <b style="color:inherit">${next.judul}</b></div>
          <div style="font-size:12.5px;color:var(--abu)"><b style="color:inherit">${state.poin}</b> / ${next.poin}</div>
        </div>
        <div style="height:11px;border-radius:99px;background:rgba(128,128,128,0.22);overflow:hidden">
          <div style="height:100%;width:${pct}%;border-radius:99px;background:var(--hijau);transition:width .6s"></div>
        </div>
        <div style="font-size:11.5px;color:var(--abu);margin-top:9px">Kurang <b style="color:var(--hijau)">${next.poin-state.poin} poin</b> lagi untuk membuka pencapaian ini.</div>
      ` : `
        <div style="display:flex;align-items:center;gap:10px">
          <svg class="ic ic-lg" style="color:var(--hijau)" aria-hidden="true"><use href="#i-trophy"/></svg>
          <div style="font-size:13px">Semua pencapaian sudah terbuka. Hebat!</div>
        </div>
      `}
    </div>

    <div class="section-title">Cara Mendapat Poin</div>
    <div class="list-card" style="cursor:default"><div class="lc-ico" style="background:rgba(18,183,106,0.30)">${statusDot('bersih')}</div><div style="flex:1"><div class="title">Lapor tumpukan sedikit</div><div class="meta">Bantu bersihkan gang dengan laporan ringan</div></div><b style="color:var(--hijau)">+1</b></div>
    <div class="list-card" style="cursor:default"><div class="lc-ico" style="background:rgba(245,197,66,0.30)">${statusDot('sedang')}</div><div style="flex:1"><div class="title">Lapor tumpukan sedang</div><div class="meta">Laporan dengan tumpukan sedang</div></div><b style="color:var(--kuning)">+2</b></div>
    <div class="list-card" style="cursor:default"><div class="lc-ico" style="background:rgba(255,122,122,0.30)">${statusDot('penuh')}</div><div style="flex:1"><div class="title">Lapor tumpukan penuh</div><div class="meta">Tumpukan banyak yang perlu segera diangkut</div></div><b style="color:var(--merah)">+3</b></div>

    <div class="section-title">Pencapaian</div>
    ${ACHIEVEMENTS.map(a=>{
      const ok = state.poin >= a.poin;
      return `<div class="card" style="padding:16px;margin-bottom:13px;${ok?'background:#EAF6EE':'opacity:.72'}">
        <div style="display:flex;align-items:center;gap:13px">
          <div style="width:52px;height:52px;border-radius:16px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:${ok?'#EAF6EE':'rgba(128,128,128,0.18)'};color:${ok?'#0E7A4E':'var(--abu)'}">
            <svg class="ic ic-lg" aria-hidden="true"><use href="#i-${ok?'trophy':'lock'}"/></svg>
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <h4 style="font-family:'Archivo';font-weight:800;font-size:15px">${a.judul}</h4>
              <span class="badge ${ok?'hijau':'kompos'}" style="font-size:9.5px">${ok?'Terbuka':'Terkunci'} - ${a.poin} poin</span>
            </div>
            <p style="font-size:12px;color:var(--abu);margin-top:5px;line-height:1.5">${a.isi}</p>
          </div>
        </div>
      </div>`;
    }).join('')}
  `;
}

/* ---------- MODE UDIN ---------- */
function renderUdin(){
  const list = document.getElementById('udinList');
  const total = state.rute.length;
  const belum = state.rute.filter(r=>!r.done);
  const done = total - belum.length;
  const prio = state.rute.filter(r=>r.prioritas && !r.done).length;

  /* header ringkas */
  const c = document.getElementById('udinCount2');
  if(c) c.textContent = belum.length ? (belum.length + ' gang untuk diangkut') : 'Semua gang beres!';
  const hero = document.getElementById('udinHero');
  if(hero) hero.innerHTML = belum.length + ' <small>gang menunggu</small>';

  /* ring progres + chip statistik */
  const pct = total ? Math.round((done/total)*100) : 0;
  const ring = document.getElementById('ruteRing');
  if(ring){ const C=194.8; ring.style.strokeDashoffset = C - (C*pct/100); }
  const ringNum = document.getElementById('ruteRingNum'); if(ringNum) ringNum.textContent = pct + '%';
  const elPrio = document.getElementById('udinPri'); if(elPrio) elPrio.textContent = prio;
  const elDone = document.getElementById('udinDone'); if(elDone) elDone.textContent = done;
  const elEta = document.getElementById('udinEta'); if(elEta) elEta.textContent = '~' + (belum.length*15);

  /* mode gelap: abaikan (fitur terpisah) */

  if(belum.length===0){
    list.innerHTML = `<div class="rute-clear">
      <div class="rc-ico"><svg class="ic" style="width:34px;height:34px" aria-hidden="true"><use href="#i-check-circle"/></svg></div>
      <h4>Semua gang sudah diangkut!</h4>
      <p>Kerja bagus, Mas Udin. Rute hari ini tuntas - istirahat dulu.</p>
    </div>`;
    return;
  }

  list.innerHTML = state.rute.map(r=>{
    const isPrio = r.prioritas && !r.done;
    const nomor = r.done ? ic('check','ic-sm') : (belum.indexOf(r)+1);
    const lbl = STATUS_LABEL[r.status];
    const icoFill = r.status==='penuh' ? 'warning' : r.status==='sedang' ? 'clock' : 'leaf';
    return `<div class="udin-card ${isPrio?'priority':''} ${r.done?'done':''}" data-status="${r.status}">
      <div class="row1">
        <div class="num">${nomor}</div>
        <div class="head">
          <div class="gname">${r.name.toUpperCase()}</div>
          <div class="meta">
            <span class="ufill ${r.status}"><svg class="ic" aria-hidden="true"><use href="#i-${icoFill}"/></svg>${lbl}</span>
            <span>${r.done?'Sudah diangkut':('Estimasi ~'+(15)+' menit')}</span>
          </div>
        </div>
      </div>
      ${isPrio?`<div class="uprio"><svg class="ic" aria-hidden="true"><use href="#i-warning"/></svg> Prioritas - gang paling penuh, angkut duluan</div>`:''}
      ${!r.done
        ? `<button class="btn-udin ${isPrio?'prio':''}" onclick="mulaiBukti('${r.id}')"><svg class="ic ic-sm" aria-hidden="true"><use href="#i-check"/></svg> SUDAH DIANGKUT</button>`
        : `<div class="udin-done-note"><svg class="ic" aria-hidden="true"><use href="#i-check-circle"/></svg> Selesai - terangkut pada rute ini</div>`}
    </div>`;
  }).join('');
}
function mulaiBukti(id){
  state.buktiTarget = id;
  const r = state.rute.find(x=>x.id===id);
  if(r){
    /* pengangkut mengambil tugas -> laporan di gang ini jadi "diproses" */
    state.laporan.forEach(l=>{ if(l.gang===r.name && !l.angkut && (l.laporStatus||'menunggu')==='menunggu'){ l.laporStatus='diproses'; } });
    save('nyampah_laporan', state.laporan);
    renderRiwayat();
  }
  document.getElementById('buktiGang').textContent = r.name;
  show('v-bukti');
}
function konfirmasiAngkut(skip){
  const r = state.rute.find(x=>x.id===state.buktiTarget);
  if(r) r.done = true;
  if(navigator.vibrate) navigator.vibrate(60);
  if(r){
    /* tandai laporan warga di gang ini sudah diangkut */
    state.laporan.forEach(l=>{ if(l.gang===r.name && !l.angkut){ l.angkut = true; l.angkutWaktu = Date.now(); l.laporStatus='selesai'; } });
    save('nyampah_laporan', state.laporan);
    tambahNotif({untuk:'warga', ico:'truck', warna:'hijau', judul:r.name+' sudah diangkut!',
      isi:'Terima kasih sudah melapor. Tumpukan di '+r.name+' sudah dibersihkan.'});
    tambahNotif({untuk:'rt', ico:'check', warna:'hijau', judul:'Selesai angkut - '+r.name,
      isi:'Pengangkut menandai '+r.name+' sudah diangkut.'});
  }
  renderUdin(); renderRiwayat(); renderProfil(); show('v-rute', true);
  refreshNotifBadge();
  if(r) toast(`${r.name} ditandai sudah diangkut`);
}

/* ---------- MANAJEMEN AKUN (NYAMPAH.md 3.3) ---------- */
const AKUN_DEFAULT = [
  {id:'u1', nama:'Bu Yati',     role:'warga',    status:'aktif'},
  {id:'u2', nama:'Pak Slamet',  role:'warga',    status:'aktif'},
  {id:'u3', nama:'Bu Rina',     role:'warga',    status:'pending'},
  {id:'u4', nama:'Mas Udin',    role:'pengepul', status:'aktif'},
  {id:'u5', nama:'Mas Bagas',   role:'pengepul', status:'suspend'},
];
const AKUN_STATUS = {
  aktif:   {label:'Aktif',   badge:'hijau'},
  pending: {label:'Belum terverifikasi', badge:'kuning'},
  suspend: {label:'Suspend', badge:'merah'},
};
function renderAkun(){
  const el = document.getElementById('akunList'); if(!el) return;
  const list = state.akun.length ? state.akun : AKUN_DEFAULT;
  el.innerHTML = list.map(a=>{
    const st = AKUN_STATUS[a.status] || AKUN_STATUS.aktif;
    const ico = a.role==='pengepul' ? 'truck' : 'user';
    const roleLbl = a.role==='pengepul' ? 'Pengepul' : 'Warga';
    return `<div class="kronis ok" style="cursor:default">
      <div class="info" style="display:flex;align-items:center;gap:11px">
        <span style="width:38px;height:38px;border-radius:11px;flex-shrink:0;background:var(--hijau-muda);display:flex;align-items:center;justify-content:center;color:var(--hijau-tua)"><svg class="ic ic-sm" aria-hidden="true"><use href="#i-${ico}"/></svg></span>
        <span style="flex:1;min-width:0">
          <h4 style="margin:0">${a.nama} <span style="font-weight:500;font-size:11px;opacity:.7">- ${roleLbl}</span></h4>
          <p style="margin-top:3px"><span class="badge ${st.badge}" style="font-size:9.5px">${st.label}</span></p>
        </span>
      </div>
      ${a.status==='aktif'
        ? `<button class="more" style="color:var(--merah);border-color:var(--merah)" onclick="setAkunStatus('${a.id}','suspend')">Suspend</button>`
        : `<button class="more" onclick="setAkunStatus('${a.id}','aktif')">${a.status==='suspend'?'Aktifkan':'Verifikasi'}</button>`}
    </div>`;
  }).join('');
}
function setAkunStatus(id, status){
  if(!state.akun.length) state.akun = AKUN_DEFAULT.map(a=>({...a}));
  const a = state.akun.find(x=>x.id===id);
  if(a){ a.status = status; save('nyampah_akun', state.akun); renderAkun(); toast(`${a.nama} > ${AKUN_STATUS[status].label}`); }
}

/* ---------- DASHBOARD ---------- */
function renderAduan(){
  const el = document.getElementById('aduanList'); if(!el) return;
  if(state.laporRT.length===0){
    el.innerHTML = `<div class="kronis warn" style="cursor:default"><div class="info"><h4>Belum ada aduan</h4><p>Warga belum melaporkan masalah pengangkutan.</p></div></div>`;
    return;
  }
  el.innerHTML = state.laporRT.map(a=>`
    <div class="kronis warn" style="cursor:default">
      <div class="info"><h4>${ic('warning','ic-sm')} ${a.gang}</h4><p>Belum diangkut ${a.lama}${a.catatan?(' - "'+a.catatan+'"'):''}</p></div>
      <span style="font-size:11px;color:inherit;opacity:.6;white-space:nowrap">${waktuLalu(a.waktu)}</span>
    </div>`).join('');
}
function renderDashboard(){
  renderAduan();
  renderAkun();
  document.getElementById('kronisList').innerHTML = KRONIS.map(k=>`
    <div class="kronis warn" onclick="bukaDetail('${k.name}')">
      <div class="info"><h4>${statusDot('penuh')} ${k.name.toUpperCase()}</h4><p>${k.lapor} laporan - ${k.layanan}</p></div>
      <span class="arrow"><svg class="ic ic-sm" aria-hidden="true"><use href="#i-arrow-right"/></svg></span>
    </div>`).join('');
  const bars = document.getElementById('chartBars');
  bars.innerHTML = [30,45,60,50,75,100,85,70,95].map(h=>`<div class="bar ${h>=90?'hi':''}" data-h="${h}"></div>`).join('');
  setTimeout(()=> bars.querySelectorAll('.bar').forEach(b=> b.style.height=b.dataset.h+'%'), 60);
  /* ringkas status lokasi */
  const km = document.getElementById('kelolaMeta');
  if(km) km.textContent = GANGS.length + ' lokasi resmi - ' + state.lokasiAdhoc.length + ' titik ad-hoc menunggu';
}

/* ============ RT: KELOLA LOKASI & QR ============ */
function renderKelolaLokasi(){
  const wn = document.getElementById('wilayahNama'); if(wn) wn.textContent = WILAYAH.rw;
  const wi = document.getElementById('wilayahInfo'); if(wi) wi.textContent = 'Radius wilayah ' + WILAYAH.radiusM + ' m dari titik pusat ' + WILAYAH.rw;
  const lw = document.getElementById('lokasiWilayah'); if(lw) lw.textContent = WILAYAH.rw;

  const cr = document.getElementById('countResmi'); if(cr) cr.textContent = GANGS.length;
  const ca = document.getElementById('countAdhoc'); if(ca) ca.textContent = state.lokasiAdhoc.length;

  const rl = document.getElementById('lokasiResmiList');
  if(rl) rl.innerHTML = GANGS.map(g=>`
    <div class="loc-item">
      <div class="li-ico resmi" aria-hidden="true"><svg class="ic"><use href="#i-pin"/></svg></div>
      <div class="li-body">
        <h4>${g.name} ${badgeLokasi(g.status)}</h4>
        <p>QR: <code>${qrLokasi(g)}</code></p>
      </div>
      <div class="li-act">
        <button class="more" onclick="sheetQR('${g.id}')"><svg class="ic ic-sm" style="margin-right:4px" aria-hidden="true"><use href="#i-grid"/></svg>QR</button>
      </div>
    </div>`).join('');

  const al = document.getElementById('lokasiAdhocList');
  if(al){
    if(state.lokasiAdhoc.length===0){
      al.innerHTML = `<div class="kronis ok" style="cursor:default"><div class="info"><h4>Belum ada titik ad-hoc</h4><p>Titik akan muncul otomatis saat warga lapor di lokasi yang belum terdaftar.</p></div></div>`;
    } else {
      al.innerHTML = state.lokasiAdhoc.map(a=>`
        <div class="loc-item">
          <div class="li-ico adhoc" aria-hidden="true"><svg class="ic"><use href="#i-warning"/></svg></div>
          <div class="li-body">
            <h4>${a.name} <span class="badge kuning">${a.laporanCount}x lapor</span></h4>
            <p>Koordinat ${a.lat.toFixed(4)}, ${a.lng.toFixed(4)} - dibuat otomatis oleh sistem</p>
          </div>
          <div class="li-act">
            <button class="more" onclick="promosikanLokasi('${a.id}')">Jadikan resmi</button>
          </div>
        </div>`).join('');
    }
  }
}
function badgeLokasi(st){
  const m = {penuh:'merah', sedang:'kuning', bersih:'hijau'};
  return `<span class="badge ${m[st]||'hijau'}" style="font-size:9.5px">${STATUS_LABEL[st]||'Bersih'}</span>`;
}

/* Sheet: tampilkan QR lokasi (untuk dicetak & ditempel) */
function sheetQR(id){
  const l = semuaLokasi().find(x=>x.id===id);
  if(!l) return;
  const code = qrLokasi(l);
  bukaSheet(`<h3>QR Lokasi - ${l.name}</h3>
    <p class="sub">Cetak &amp; tempel di tembok gang. Warga scan untuk lapor tanpa akun.</p>
    <div class="qr-box">
      ${qrSVG(code)}
      <div class="qr-code-txt">${code}</div>
    </div>
    <p style="font-size:12px;color:var(--teks-muted);margin-top:14px;text-align:center;line-height:1.5">Satu QR per gang - otomatis mengisi lokasi saat warga lapor.</p>
    <button class="btn btn-primer btn-lg" style="margin-top:16px" onclick="toast('QR dikirim ke printer...')"><svg class="ic ic-sm" aria-hidden="true"><use href="#i-file"/></svg> Cetak QR</button>`);
}
/* Render QR sebagai SVG deterministik dari string (bukan QR asli, cukup visual di prototype) */
function qrSVG(text){
  const N=25, cell=190/N;
  /* hash sederhana -> pola biner deterministik */
  let h=2166136261;
  const bits=[];
  for(let i=0;i<N*N;i++){
    h ^= (text.charCodeAt(i%text.length)+i);
    h = Math.imul(h, 16777619) >>> 0;
    bits.push(h & 1);
  }
  let rects='';
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const isFinder = (x<7&&y<7)||(x>=N-7&&y<7)||(x<7&&y>=N-7);
    const on = isFinder ? ((x===0||x===6||y===0||y===6||(x>=2&&x<=4&&y>=2&&y<=4)) && !((x===1||x===5)&&(y===1||y===5)))
                        : bits[y*N+x];
    if(on) rects += `<rect x="${(x*cell).toFixed(2)}" y="${(y*cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}"/>`;
  }
  return `<svg class="qr-canvas" viewBox="0 0 190 190" role="img" aria-label="Kode QR lokasi"><rect width="190" height="190" fill="#fff"/><g fill="#12201A">${rects}</g></svg>`;
}

/* Sheet: tambah lokasi resmi manual */
function sheetTambahLokasi(){
  const inputStyle='width:100%;padding:13px;border-radius:12px;border:1.5px solid var(--line);background:#fff;color:inherit;font-family:inherit;font-size:14.5px;font-weight:600;outline:none';
  bukaSheet(`<h3>Tambah Lokasi Resmi</h3>
    <p class="sub">Daftarkan gang di dalam wilayah ${WILAYAH.rw}.</p>
    <div class="field">
      <label class="field-label" for="newGangName">Nama gang</label>
      <input id="newGangName" type="text" placeholder="Contoh: Gang Pisang, Gang Melati" style="${inputStyle}">
    </div>
    <p class="wilayah-note" style="margin-top:14px"><svg class="ic ic-sm" aria-hidden="true"><use href="#i-info"/></svg> Lokasi akan punya QR sendiri setelah dibuat.</p>
    <button class="btn btn-primer btn-lg" style="margin-top:16px" onclick="tambahLokasiResmi((document.getElementById('newGangName')||{}).value);tutupSheet()"><svg class="ic ic-sm" aria-hidden="true"><use href="#i-plus"/></svg> Simpan Lokasi</button>`);
}
function bukaDetail(name){
  document.getElementById('detailName').textContent = name.toUpperCase();
  show('v-detail');
  setTimeout(()=> document.querySelectorAll('#v-detail .bar').forEach(b=> b.style.height=b.dataset.h+'%'), 60);
}
function exportLaporan(){
  toast('Menyiapkan laporan...');
  setTimeout(()=> toast('Laporan berhasil diunduh'), 1500);
}


/* ---------- SHEET & TOAST ---------- */
let sheetLastFocus = null;
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function sheetFocusables(){
  return [...document.getElementById('sheet').querySelectorAll(FOCUSABLE)].filter(el=>el.offsetParent!==null);
}
function bukaSheet(html){
  sheetLastFocus = document.activeElement;
  document.getElementById('sheetContent').innerHTML = html;
  document.getElementById('scrim').classList.add('show');
  const sheet = document.getElementById('sheet');
  sheet.classList.add('show');
  /* fokuskan kontrol pertama (atau sheet itu sendiri) agar keyboard/reader masuk dialog */
  setTimeout(()=>{
    const f = sheetFocusables();
    (f[0] || sheet).focus({preventScroll:true});
  }, 340);
}
function tutupSheet(){
  document.getElementById('scrim').classList.remove('show');
  document.getElementById('sheet').classList.remove('show');
  /* kembalikan fokus ke elemen pemicu */
  if(sheetLastFocus && document.contains(sheetLastFocus)){
    sheetLastFocus.focus({preventScroll:true});
  }
  sheetLastFocus = null;
}
/* trap Tab di dalam sheet + Escape menutup */
document.addEventListener('keydown', e=>{
  const sheet = document.getElementById('sheet');
  if(!sheet || !sheet.classList.contains('show')) return;
  if(e.key==='Escape'){ e.preventDefault(); tutupSheet(); return; }
  if(e.key==='Tab'){
    const f = sheetFocusables();
    if(f.length===0){ e.preventDefault(); sheet.focus(); return; }
    const first=f[0], last=f[f.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  }
});
let toastTimer;
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
}

/* ---------- UTIL ---------- */
function waktuLalu(ts){
  const s = Math.floor((Date.now()-ts)/1000);
  if(s<60) return 'baru saja';
  if(s<3600) return Math.floor(s/60)+' menit lalu';
  if(s<86400) return Math.floor(s/3600)+' jam lalu';
  return Math.floor(s/86400)+' hari lalu';
}

/* ---------- CLOCK ---------- */
function tick(){
  const d = new Date();
  const el = document.getElementById('clock');
  if(el) el.textContent = String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}
tick(); setInterval(tick, 10000);

/* ---------- CEGAH ZOOM GESTURE ---------- */
document.addEventListener('gesturestart', e=>e.preventDefault());
document.addEventListener('dblclick', e=>e.preventDefault(), {passive:false});

/* ---------- INIT ---------- */
/* Auto-init hanya jika layar splash ada (app-mobile.html).
   Halaman screen/ mengatur tampilannya sendiri via script inline. */
updateHero();
if(document.getElementById('v-splash')) show('v-splash');
