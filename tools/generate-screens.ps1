# generate-screens.ps1
# Menghasilkan satu file HTML per layar di folder screens/ untuk konversi Figma.
# Jalankan: powershell -ExecutionPolicy Bypass -File tools\generate-screens.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$srcPath = Join-Path $root 'app-mobile.html'
$screensDir = Join-Path $root 'screens'
$iconsPath = Join-Path $root 'partials\icons.html'

$src = Get-Content $srcPath -Raw
$sprite = Get-Content $iconsPath -Raw

# Mapping id view -> nama file + judul
$map = [ordered]@{
  'v-splash'      = @{ file='01-splash';         title='Splash / Welcome';        role='warga' }
  'v-pilihperan'  = @{ file='02-pilih-peran';    title='Pilih Peran';             role='warga' }
  'v-auth'        = @{ file='03-auth';           title='Login / Daftar';          role='warga' }
  'v-adminpin'    = @{ file='04-admin-pin';      title='Verifikasi Kode Admin';   role='rt' }
  'v-peta'        = @{ file='05-warga-beranda';  title='Warga - Beranda Peta';    role='warga' }
  'v-riwayat'     = @{ file='06-warga-riwayat';  title='Warga - Riwayat';         role='warga' }
  'v-kontribusi'  = @{ file='07-warga-poin';     title='Warga - Kontribusiku';    role='warga' }
  'v-profil'      = @{ file='08-warga-profil';   title='Warga - Profil';          role='warga' }
  'v-panduan'     = @{ file='09-warga-panduan';  title='Warga - Panduan Pilah';   role='warga' }
  'v-lapor'       = @{ file='10-warga-lapor';    title='Warga - Form Lapor';      role='warga' }
  'v-konfirmasi'  = @{ file='11-warga-konfirmasi';title='Warga - Konfirmasi';     role='warga' }
  'v-rute'        = @{ file='12-pengangkut-rute';title='Pengangkut - Rute';       role='udin' }
  'v-bukti'       = @{ file='13-pengangkut-bukti';title='Pengangkut - Foto Bukti';role='udin' }
  'v-dashboard'   = @{ file='14-rt-dashboard';   title='Pengelola - Dashboard';   role='rt' }
  'v-detail'      = @{ file='15-rt-detail';      title='Pengelola - Detail Gang'; role='rt' }
  'v-lokasi'      = @{ file='16-rt-kelola-lokasi';title='Pengelola - Kelola Lokasi';role='rt' }
}

# Ambil blok views
$start = $src.IndexOf('<div class="views" id="views">')
$end = $src.IndexOf('<!-- TAB BAR (warga) -->')
$viewsBlock = $src.Substring($start, $end - $start)

$rx = [regex]'(?s)(<!-- ===== .*? ===== -->\s*<section class="view" id="([^"]+)".*?</section>)'
$matches = @{}
foreach($m in $rx.Matches($viewsBlock)){
  $matches[$m.Groups[2].Value] = $m.Groups[1].Value.Trim()
}

# Tab bar (untuk layar warga)
$tbStart = $end
$tbEnd = $src.IndexOf('<!-- SHEET -->')
$tabbarBlock = $src.Substring($tbStart, $tbEnd - $tbStart).Trim()

# Statusbar
$sbStart = $src.IndexOf('<!-- STATUS BAR -->')
$sbEnd = $src.IndexOf('<!-- VIEWS -->')
$statusbarBlock = $src.Substring($sbStart, $sbEnd - $sbStart).Trim()

if(-not (Test-Path $screensDir)){ New-Item -ItemType Directory -Path $screensDir | Out-Null }

$count = 0
foreach($id in $map.Keys){
  $info = $map[$id]
  if(-not $matches.ContainsKey($id)){ Write-Warning "View $id tidak ditemukan"; continue }
  $section = $matches[$id]

  $needTabbar = ($info.role -eq 'warga' -and $id -notin @('v-splash','v-pilihperan','v-auth','v-adminpin','v-lapor','v-konfirmasi'))

  $tbHtml = if($needTabbar){ "`n    $tabbarBlock" } else { "" }

  $html = @"
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NYAMPAH - $($info.title)</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/nyampah.css">
</head>
<body>
<!-- ============================================================
     LAYAR: $($info.title)  ($id)
     File mandiri untuk konversi Figma.
     Untuk versi gabungan lengkap -> buka ../app-mobile.html
     ============================================================ -->

<!-- SVG ICON SPRITE -->
$sprite

<div id="app">

$statusbarBlock

  <div class="views" id="views">

$section

  </div>
$tbHtml

  <div class="scrim" id="scrim" onclick="tutupSheet()"></div>
  <div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-label="Panel" tabindex="-1"><div class="handle"></div><div id="sheetContent"></div></div>
  <div class="toast" id="toast"></div>

</div>

<script src="../js/app.js"></script>
<script>
/* Tampilkan layar ini (dan siapkan datanya). Defensif: aman walau elemen lain tidak ada. */
try {
  state.role = '$($info.role)';
  updateHero();
  show('$id');
  if('$id'==='v-rute') renderUdin();
  if('$id'==='v-peta'){ renderPins(); renderRiwayat(); renderProfil(); }
  if('$id'==='v-riwayat') renderRiwayat();
  if('$id'==='v-profil') renderProfil();
  if('$id'==='v-dashboard') renderDashboard();
  if('$id'==='v-lokasi') renderKelolaLokasi();
  if('$id'==='v-kontribusi') renderKontribusi();
  if('$id'==='v-detail') bukaDetail('Gang Pisang');
  if('$id'==='v-lapor'){ deteksiLokasi(); }
  if('$id'==='v-konfirmasi'){ state.lokasiPilih='Gang Pisang'; var _cg=document.getElementById('confGang'); if(_cg) _cg.textContent='Gang Pisang'; }
  if('$id'==='v-bukti'){ state.buktiTarget='G3'; var _bg=document.getElementById('buktiGang'); if(_bg) _bg.textContent='Pisang'; }
} catch(e){ console.warn('init screen:', e.message); }
</script>
</body>
</html>
"@
  $outPath = Join-Path $screensDir ($info.file + '.html')
  Set-Content -Path $outPath -Value $html -Encoding UTF8
  $count++
  Write-Host ("  [$count] {0}.html  <- {1}" -f $info.file, $info.title)
}
Write-Host ""
Write-Host "Selesai: $count file layar dibuat di screens/"
