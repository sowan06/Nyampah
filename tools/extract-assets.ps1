# extract-assets.ps1
# Mengekstrak semua logo & ikon SVG ke folder assets/ agar bisa diimpor manual ke Figma.
# Jalankan: powershell -ExecutionPolicy Bypass -File tools\extract-assets.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$assetsDir = Join-Path $root 'assets'
$iconsDir = Join-Path $assetsDir 'icons'
$logosDir = Join-Path $assetsDir 'logos'

New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null
New-Item -ItemType Directory -Force -Path $logosDir | Out-Null

$utf8 = New-Object System.Text.UTF8Encoding($false)

# ---- 1. Ekstrak ikon dari sprite ----
$iconsHtml = Get-Content (Join-Path $root 'partials\icons.html') -Raw
$extra = Get-Content (Join-Path $root 'app-mobile.html') -Raw

# warna utama NYAMPAH hijau tua (agar terlihat saat dibuka di Figma)
$strokeColor = '#1F5C42'

$symbolMap = @{}
$rx = [regex]'(?s)<symbol id="([^"]+)"\s+viewBox="([^"]+)">(.*?)</symbol>'
foreach($m in $rx.Matches($iconsHtml)){
  $symbolMap[$m.Groups[1].Value] = @{ vb=$m.Groups[2].Value; body=$m.Groups[3].Value }
}
# ikon tambahan yang mungkin hanya ada di app-mobile.html
foreach($m in $rx.Matches($extra)){
  if(-not $symbolMap.ContainsKey($m.Groups[1].Value)){
    $symbolMap[$m.Groups[1].Value] = @{ vb=$m.Groups[2].Value; body=$m.Groups[3].Value }
  }
}

$count = 0
foreach($id in $symbolMap.Keys){
  $s = $symbolMap[$id]
  $name = $id -replace '^i-',''
  $body = $s.body

  # logo menggunakan warna solidnya sendiri -> lewati (ditangani terpisah)
  if($name -eq 'logo-nyampah'){ continue }

  # bersihkan atribut id internal pada symbol body (hindari duplikat id)
  $body = $body -replace '\s+id="[^"]*"',''

  $svg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="$($s.vb)" width="24" height="24" fill="none" stroke="$strokeColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
  <title>$name</title>
  $body
</svg>
"@
  [System.IO.File]::WriteAllText((Join-Path $iconsDir "$name.svg"), $svg, $utf8)
  $count++
}
Write-Host "Ikon diekstrak: $count file -> assets/icons/"

# ---- 2. Salin logo yang sudah ada ----
$logoFiles = @('logo-nyampah.svg','logo-nyampah.png','favicon-nyampah.png','logo1.avif')
foreach($lf in $logoFiles){
  $src = Join-Path $root $lf
  if(Test-Path $src){
    Copy-Item -LiteralPath $src -Destination (Join-Path $logosDir $lf) -Force
    Write-Host "Logo disalin: $lf"
  }
}

# ---- 3. Ekspor logo sprite (versi inline) sebagai SVG standalone bila belum ada ----
$logoSymbol = $symbolMap['i-logo-nyampah']
if($logoSymbol){
  $logoStandalone = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="$($logoSymbol.vb)" width="120" height="120" fill="none" stroke="#1F5C42" stroke-width="6.5" stroke-linejoin="round">
  <title>Logo NYAMPAH (garis)</title>
  $($logoSymbol.body -replace '\s+id="[^"]*"','')
</svg>
"@
  [System.IO.File]::WriteAllText((Join-Path $logosDir 'logo-nyampah-outline.svg'), $logoStandalone, $utf8)
  Write-Host "Logo outline diekspor: logo-nyampah-outline.svg"
}

Write-Host ""
Write-Host "Selesai. Semua aset ada di folder assets/"
