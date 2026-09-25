# 🗑️ "NYAMPAH" — Bedah Lengkap & Rinci

Oke, saya akan jelaskan NYAMPAH secara menyeluruh — dan sekaligus saya perbaiki kelemahannya yang saya temukan sendiri di kritik sebelumnya (masalah "sampah→banjir" yang masih klise, dan inovasi peta anonim yang tipis). Saya desain ulang supaya ide ini benar-benar tahan di depan juri UI/UX.

---

## BAGIAN 1: CARA MEMANDANG MASALAHNYA

### Masalah umum (JANGAN dipakai — klise)

> "Indonesia menghasilkan 25 juta ton sampah per tahun, 40% sisa makanan." (KLHK 2025)

Ini data benar, tapi semua peserta akan pakai ini. Juri sudah bosan. Ini membunuh kamu di 20% "Identifikasi Permasalahan."

### Masalah spesifik (PAKAI INI — tajam & spasial)

Di kampung padat kota (RW padat, gang 1-2 meter), sampah tidak bisa dijangkau truk pengangkut. Sampah menumpuk di sudut gang, TPS liar muncul, lalu warga membuang ke kali/bantaran sungai → menyumbat drainase → banjir saat hujan.

**Kenapa ini kuat:**

1. **Spasial** — masalahnya tentang ruang & akses, jadi sangat cocok didesain sebagai peta/UI spasial. Bukan masalah "kesadaran warga" yang abstrak.
2. **Ada penyebab struktural yang jelas** — truk tak bisa masuk, bukan "warga malas."
3. **Rantai sebab-akibat bisa digambar:** gang sempit → truk gagal → tumpukan → TPS liar → buang ke kali → banjir.
4. **Bisa diverifikasi** — kamu bisa foto gang, wawancara warga, ngukur lebar gang.

**Kalimat kunci untuk proposal:**

> "Masalahnya bukan warga tidak mau membuang sampah pada tempatnya. Masalahnya, 'tempatnya' tidak pernah didesain untuk gang mereka."

Ini kalimat yang bikin juri mengangguk. Menyerang asumsi, bukan menuduh.

---

## BAGIAN 2: SIAPA YANG TERDAMPAK? (Persona Nyata, Bukan "Masyarakat Indonesia")

Kesalahan fatal ide-ide lemah: target user "masyarakat Indonesia." Juri UI/UX langsung potong poin. Kamu harus spesifik.

### 👤 3 Persona Nyata

#### PERSONA 1 — "Bu Yati" (55) — Kader RW / Pengurus Sampah

- **Konteks:** Mengurus jadwal sampah RW secara sukarela. Punya WhatsApp grup RW.
- **Masalah:** Tidak tahu titik mana yang paling urgent. Warga komplain "sampah masih numpuk!" tapi Bu Yati tak bisa lihat kondisi gang real-time.
- **Yang dia butuh:** Peta yang menunjukkan titik panas sekarang.
- **Literasi digital:** Sedang. Pakai WhatsApp lancar, aplikasi baru butuh yang sederhana.

#### PERSONA 2 — "Mas Udin" (38) — Tukang Sampah / Pemulung Informal

- **Konteks:** Naik motor roda tiga / gerobak, mengangkut sampah gang ke TPS. Dia "hero" yang tak terlihat.
- **Masalah:** Tidak tahu gang mana yang sudah penuh. Kadang jalan ke gang kosong (buang bensin), kadang gang penuh sudah banjir sampah.
- **Yang dia butuh:** Rute efisien — gang mana yang harus dibersihkan duluan hari ini.
- **Literasi digital:** Rendah. Ini tantangan desain terbesar & paling menarik — UI harus ramah orang dengan HP murah, sinyal jelek, dan skill rendah.

#### PERSONA 3 — "Pak RT Hendra" (48) — Pengambil Keputusan

- **Konteks:** Bisa mengusulkan anggaran ke kelurahan, mengatur jadwal, menghubungi dinas.
- **Masalah:** Butuh bukti (data) untuk mengajukan perbaikan infrastruktur ke kelurahan.
- **Yang dia butuh:** Laporan/data — "gang ini punya 47 laporan tumpukan dalam sebulan."
- **Literasi digital:** Sedang-tinggi.

### Insight desain dari 3 persona ini

Satu produk, tiga orientasi:

- **Bu Yati:** pantau (lihat kondisi)
- **Mas Udin:** bertindak (rute kerja)
- **Pak RT:** buktikan (data ke atas)

→ Ini mengisi **Metode Desain 30%**: persona bukan hiasan, tapi menghasilkan keputusan desain berbeda.

---

## BAGIAN 3: INOVASI DESAIN (30% — Bobot Terbesar)

Ini kesalahan saya sebelumnya: saya cuma punya 1 inovasi ("peta anonim"). Saya perbaiki jadi 4 inovasi desain nyata:

### 💡 INOVASI #1 — "Titik Hidup" (Living Point)

- **Konsep lama:** Sampah dibuang di "TPS tetap, jadwal tetap."
- **Konsep baru:** Titik jemput bermunculan & menghilang berdasarkan data warga.
  - Warga tandai "ada tumpukan di sini" → titik muncul di peta.
  - Mas Udin angkut → titik hilang.
  - Kalau titik yang sama muncul 3x seminggu → sistem naikkan jadi "titik kronis" → dikirim ke Pak RT.

**Kenapa inovatif:** Mengubah konsep "jadwal RT yang kaku" menjadi peta hidup yang responsif. Ini keputusan desain, bukan fitur biasa.

### 💡 INOVASI #2 — "Lapor Tanpa Akun" (Zero-Friction Reporting)

**Masalahnya:** Semua app pelaporan sampah/gang (JAKI, dll.) minta login → orang malas → partisipasi mati.

**Solusi desain:** Warga buang laporan tanpa akun sama sekali.

- Scan QR di tembok gang → langsung muncul layar "Ada tumpukan di sini" → tap 1x → selesai.
- Atau lewat SMS/WhatsApp bot (karena warga gang padat mungkin tak mau install app).

**Kenapa inovatif:** Mengalahkan hambatan terbesar aplikasi partisipatif: friksi pendaftaran. Ini keputusan UX yang berani (bahkan melawan "best practice" yang bilang harus ada akun).

**Cara mengatasi spam tanpa akun:** cukup andalkan verifikasi unik (QR per lokasi + rate-limit per nomor HP). Ini yang harus kamu jelaskan di metode — tunjukkan kamu berpikir soal risiko, bukan hanya berangan.

### 💡 INOVASI #3 — "Rute Udin" (Desain untuk Orang yang Dilewatkan)

**Konsep:** Peta kerja khusus Mas Udin — bukan peta penuh fitur, tapi satu layar, satu pertanyaan: **"Hari ini saya ke mana?"**

- Urutan gang dioptimalkan: yang penuh dulu, yang dekat digabung.
- Tombol raksasa: **✓ SUDAH DIANGKUT** — warna, bukan teks (karena literasi rendah).
- Mode suara: "Gang 3, gang 5, gang 7."
- Bisa dikirim ke WhatsApp Mas Udin (tak perlu install apa-apa).

**Kenapa inovatif:** Aplikasi partisipatif selalu desain untuk orang terdidik. Ini desain untuk pekerja informal dengan HP murah. Ini portofolio insight yang kuat.

### 💡 INOVASI #4 — "Skor Gang" (Data Jadi Bukti)

Setiap gang punya skor — bukan angka abstrak, tapi biar Pak RT bisa bawa ke kelurahan.

```
GANG 3 — STATUS KRONIS
🔴 47 laporan dalam 30 hari
📸 Foto tumpukan: 12
🧹 Terangkut: 24 dari 47
Kesimpulan: Tingkat layanan 51%
[DOWNLOAD LAPORAN RW]
```

**Kenapa inovatif:** Mengubah laporan warga yang berserakan jadi dokumen bukti untuk advokasi. Ini yang membedakan NYAMPAH dari "app pelaporan biasa" — ada output nyata yang punya daya guna politik.

---

## BAGIAN 4: USER FLOW (Cerita Alur Per Persona)

Ini yang wajib ada di proposal babak penyisihan (guidebook minta "skenario penggunaan").

### 🔵 FLOW 1 — Warga Lapor (Bu Yati / warga biasa)

```
Temukan tumpukan
   ↓
Scan QR tembok gang  (atau buka WhatsApp bot)
   ↓
[ Lokasi otomatis terisi ]
   ↓
Tap: "Seberapa penuh?" 🟡 sedang
   ↓
📷 Foto (opsional)
   ↓
[SELESAI] — selesai dalam <10 detik
   ↓
Titik muncul di peta warga lain
```

### 🟢 FLOW 2 — Udin Bertindak (Tukang Sampah)

```
Buka app (mode Udin) / terima link WhatsApp
   ↓
🎯 "Rute Hari Ini" (auto-diurutkan)
   ↓
Gang 3 (penuh) → Gang 9 (kronis) → Gang 5
   ↓
Tiba di gang:
   ↓
Tap besar: [✓ SUDAH DIANGKUT]
   ↓
Kamera bukti (otomatis)
   ↓
Titik HILANG dari peta
   ↓
Data masuk ke Skor Gang
```

### 🟣 FLOW 3 — RT Mengambil Keputusan (Pak RT)

```
Buka dashboard RW
   ↓
Lihat "Gang Prioritas" (peringkat kriminal)
   ↓
Klik GANG 3 → lihat riwayat 30 hari
   ↓
[ EKSPOR LAPORAN PDF ]
   ↓
Bawa ke kelurahan / jadi lampiran proposal
   ↓
(Kembali ke atas — loop perbaikan RW)
```

Ini **closed-loop**: lapor → tangani → buktikan → perbaiki. Sama seperti NUSA punya loop, NYAMPAH juga punya.

---

## BAGIAN 5: ARSITEKTUR INFORMASI

```
                      NYAMPAH
                         │
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
   LIHAT (Yati)    BERTINDAK (Udin)   BUKTIKAN (RT)
         │               │               │
         ↓               ↓               ↓
   Peta Gang       Rute Hari Ini      Dashboard RW
         │               │               │
         └───────┬───────┴───────┬───────┘
                 ↓               ↓
            "TITIK HIDUP"    "SKOR GANG"
                 │               │
                 └───────┬───────┘
                         ↓
                   DATA TERPADU
                         │
              ┌──────────┼──────────┐
              ↓          ↓          ↓
          LAPOR    LACAK (Tracking)  ADVO (Bukti)
```

### Tiga pillar inti

1. **LAPOR** — warga tanpa akun lapor titik
2. **LACAK** — titik hidup & hilang seiring waktu (real-time)
3. **ADVO** — data jadi bukti advokasi

Semua fitur turunan masuk ke 3 pillar ini. Rapi, mudah dijelaskan di presentasi, tidak over-scope.

---

## BAGIAN 6: METODE DESAIN (30% — Ini yang Sering Diabaikan)

Ini wajib ada di proposal. Kamu perlu menunjukkan proses, bukan cuma hasil.

### Fase 1 — EMPATHIZE (Riset Lapangan)

- Observasi 3 gang (foto, ukur lebar gang, catat titik tumpukan).
- 5-7 wawancara: 2 warga, 1 tukang sampah, 1 RT, 1 petugas kelurahan.
- Insight yang kamu cari: "Kenapa warga tak buang di TPS?" → hipotesis awalmu: karena tak ada TPS yang bisa dijangkau.

### Fase 2 — DEFINE

- Buat Persona (Bu Yati, Mas Udin, Pak RT).
- Buat Customer/User Journey Map untuk tiap persona.
- Kalimat masalah (Problem Statement):

> "Mas Udin perlu tahu gang mana yang paling urgent untuk diangkut hari ini, agar dia tidak membuang waktu dan bahan bakar ke gang kosong."

### Fase 3 — IDEATE

Sketch 3 konsep berbeda:

1. App full-featured (gagal — terlalu ramai)
2. WhatsApp bot saja (terlalu terbatas)
3. **Hybrid:** peta untuk warga + rute untuk Udin + laporan untuk RT ← **menang**

Tunjukkan kenapa 1 & 2 ditolak. Juri suka lihat proses berpikir, bukan cuma keputusan akhir.

### Fase 4 — PROTOTYPE (Low-fi → Hi-fi)

- **Low-fi:** kertas / wireframe kasar.
- Uji ke 3 orang (bisa teman/keluarga yang diposisikan sebagai Udin, dll.).
- Catat masalah → perbaiki.
- **Hi-fi:** Figma.

### Fase 5 — TEST

- Uji usabilitas prototipe ke minimal 3 orang.
- Kutip masalah nyata: "Udin tak paham tombol teks 'SUBMIT' → diganti ikon centang besar & warna."
- Tunjukkan iterasi: sebelum → sesudah.

**Poin emas metode:** setiap masalah uji → menghasilkan keputusan desain konkret. Itu yang dinilai.

---

## BAGIAN 7: SDG YANG DIPILIH

| SDG | Kaitan |
|-----|--------|
| **SDG 11** ⭐ (inti) | Kota & komunitas berkelanjutan — banjir, permukiman padat |
| SDG 12 | Pola konsumsi & produksi — pengelolaan sampah |
| SDG 6 | Air bersih & sanitasi — sampah menyumbat drainase → banjir |
| SDG 3 | Kesehatan — banjir memicu penyakit |
| SDG 17 | Kemitraan — warga + tukang sampah + RT + kelurahan |

Pilih SDG 11 sebagai utama, sisanya penyokong. Menyentuh lebih dari satu = nilai plus di "Kesesuaian Tema."

---

## BAGIAN 8: SKENARIO PRESENTASI 10 MENIT

| Waktu | Isi | Parameter yang disasar |
|-------|-----|------------------------|
| 0:00-1:00 | Hook: foto gang nyata + "Masalahnya bukan warga malas. Masalahnya 'tempatnya' tak pernah didesain untuk gang mereka." | Komunikasi, Pemahaman Masalah |
| 1:00-2:30 | Masalah + data + 3 persona (Bu Yati, Mas Udin, Pak RT) | Identifikasi Permasalahan (20%) |
| 2:30-5:00 | Demo prototipe: 3 flow (lapor → rute → dashboard) | Desain UI/UX (20%) |
| 5:00-7:00 | Metode desain: dari wawancara → insight → iterasi (ini yang sering dilewatkan pesaing) | Metode (30%) |
| 7:00-8:30 | Inovasi: 4 poin (titik hidup, tanpa akun, rute Udin, skor gang) | Inovasi (30%) |
| 8:30-9:30 | SDG + dampak + closed-loop | Kesesuaian Tema (10%) |
| 9:30-10:00 | Penutup + tagline | Komunikasi |

**Kenapa 10 menit ini kuat:** kamu menempatkan Demo (Desain UI/UX) di tengah, dan Metode + Inovasi di porsi terbesar — karena itulah yang berbobot 60%+.

---

## BAGIAN 9: TAGLINE / POSITIONING

- ❌ Jangan: "Aplikasi pelaporan sampah." (datar, sudah ada)
- ❌ Jangan: "Aplikasi peta sampah." (klise)
- ✅ Pakai:

> **NYAMPAH — "Peta hidup untuk gang yang truk tidak bisa masuk."**

Atau versi pitch:

> "Kami tidak mengubah kesadaran warga. Kami mendesain 'tempat' yang akhirnya cocok untuk gang mereka."

---

## BAGIAN 10: KELEMAHAN YANG HARUS KAMU SIAPKAN JAWABANNYA

Juri akan menyerang. Siapkan ini:

| Serangan Juri | Jawabanmu |
|---------------|-----------|
| "Bedanya dengan aplikasi pelaporan kota (JAKI, dll.)?" | "Mereka minta akun & tidak desain untuk tukang sampah informal. Kami desain untuk chain: warga → Udin → RT." |
| "Kalau tak ada akun, bagaimana cegah spam/laporan palsu?" | "Rate-limit per nomor + verifikasi QR lokasi. Dan foto opsional tapi memberi skor keandalan." |
| "Ini kan masalah infrastruktur, bukan aplikasi?" | "Betul — tapi aplikasi mengubah data menjadi bukti untuk memperbaiki infrastruktur. Kami bagian dari solusi, bukan solusinya seluruhnya." |
| "Kenapa tak langsung pasang TPS?" | "Nyampah adalah lapisan data yang memberi tahu di mana TPS dibutuhkan. Kami mempercepat keputusan tepat sasaran." |

(Kalau kamu bisa jawab 4 ini dengan tenang, kamu sudah mengalahkan 80% peserta.)

---

## ✅ RANGKUMAN KEKUATAN NYAMPAH UNTUK RUBRIK

| Parameter | Cara NYAMPAH menyerang |
|-----------|------------------------|
| Identifikasi Masalah (20%) | Masalah spasial spesifik, bukan klise "sampah-banjir" |
| Inovasi Desain (30%) | 4 inovasi nyata (titik hidup, tanpa akun, rute informal, skor advokasi) |
| Metode Desain (30%) | Riset lapangan mudah + 5 fase Design Thinking jelas + iterasi |
| Komunikasi (20%) | Cerita rantai sebab-akibat + tagline kuat |
| Presentasi Final | Demo 3 flow, alokasi waktu terstruktur, jawaban siap |

---

## Langkah Lanjutan

Mau saya lanjutkan ke:

- **A.** Rancang wireframe & layout tiap layar (peta, mode Udin, dashboard RT) secara detail?
- **B.** Susun metode desain konkret (pertanyaan wawancara, template journey map) supaya bisa langsung dieksekusi?
- **C.** Buat kerangka proposal baku yang dipetakan per-parameter (biar tak ada bagian yang kosong)?

Saya sarankan **C** dulu (kerangka proposal), karena proposal adalah penentu lolos ke final. Mana yang mau?