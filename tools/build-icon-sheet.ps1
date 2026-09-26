# build-icon-sheet.ps1
# Menggabungkan semua ikon + logo menjadi SATU file SVG (grid berlabel).
# Hasil: assets/nyampah-icons-sheet.svg  -> drag 1x ke Figma.
# Jalankan: powershell -ExecutionPolicy Bypass -File tools\build-icon-sheet.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$iconsDir = Join-Path $root 'assets\icons'
$logosDir = Join-Path $root 'assets\logos'
$outFile  = Join-Path $root 'assets\nyampah-icons-sheet.svg'

$utf8 = New-Object System.Text.UTF8Encoding($false)

# ---- Ambil isi tiap ikon (path-nya saja) ----
function Get-IconBody($path){
  $raw = Get-Content $path -Raw
  $m = [regex]::Match($raw, '(?s)<svg[^>]*>(.*)</svg>')
  $body = $m.Groups[1].Value
  # buang elemen <title>
  $body = $body -replace '(?s)<title>.*?</title>',''
  return $body.Trim()
}

$iconFiles = Get-ChildItem (Join-Path $iconsDir '*.svg') | Sort-Object Name
$logos = @()
foreach($lf in @('logo-nyampah.svg','logo-nyampah-outline.svg')){
  $p = Join-Path $logosDir $lf
  if(Test-Path $p){ $logos += [pscustomobject]@{ Name=$lf; Path=$p } }
}

# ---- Layout grid ----
$colW = 150; $rowH = 120; $cols = 8
$padX = 40; $padY = 40
$labelH = 26

$totalIcons = $iconFiles.Count
$iconRows = [math]::Ceiling($totalIcons / $cols)
$logoRows = [math]::Ceiling($logos.Count / $cols)
$gridW = $cols * $colW
$gridH = ($iconRows + $logoRows) * $rowH

$sheetW = $gridW + $padX * 2
$sheetH = $gridH + $padY * 2 + 70

$sb = New-Object System.Text.StringBuilder

# Header SVG
$header = @"
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="$sheetW" height="$sheetH" viewBox="0 0 $sheetW $sheetH" font-family="Inter, Arial, sans-serif">
<rect x="0" y="0" width="$sheetW" height="$sheetH" fill="#F7F9F7"/>
<text x="$padX" y="46" font-size="26" font-weight="800" fill="#12201A" font-family="Archivo, Arial, sans-serif">NYAMPAH - Icon Sheet</text>
<text x="$padX" y="70" font-size="14" fill="#5F6F66">$totalIcons ikon + $($logos.Count) logo - drag file ini ke Figma lalu pecah (ungroup) sesuai kebutuhan</text>
"@
[void]$sb.AppendLine($header)

# ---- Gambar ikon ----
$i = 0
foreach($f in $iconFiles){
  $col = $i % $cols
  $row = [math]::Floor($i / $cols)
  $x = $padX + $col * $colW
  $y = $padY + 70 + $row * $rowH
  $body = Get-IconBody $f.FullName
  $name = $f.BaseName

  # kartu
  [void]$sb.AppendLine("<g>")
  [void]$sb.AppendLine("<rect x=""$x"" y=""$y"" width=""$($colW-20)"" height=""$($rowH-20)"" rx=""16"" fill=""#FFFFFF"" stroke=""#E3E2E6"" stroke-width=""1""/>")
  # ikon 24x24 discale ke 32x32, ditempatkan tengah atas
  $ix = $x + ($colW - 20 - 32) / 2
  $iy = $y + 22
  [void]$sb.AppendLine("<g transform=""translate($ix,$iy) scale(1.3333)"" fill=""none"" stroke=""#1F5C42"" stroke-width=""1.9"" stroke-linecap=""round"" stroke-linejoin=""round"">")
  [void]$sb.AppendLine($body)
  [void]$sb.AppendLine("</g>")
  # label
  $ty = $y + ($rowH - 20) - 16
  [void]$sb.AppendLine("<text x=""$($x + ($colW-20)/2)"" y=""$ty"" font-size=""11"" fill=""#5F6F66"" text-anchor=""middle"" font-family=""monospace"">$name</text>")
  [void]$sb.AppendLine("</g>")
  $i++
}

# ---- Gambar logo ----
$j = 0
foreach($lg in $logos){
  $col = $j % $cols
  $row = $iconRows + [math]::Floor($j / $cols)
  $x = $padX + $col * $colW
  $y = $padY + 70 + $row * $rowH
  $raw = Get-Content $lg.Path -Raw

  # coba ambil konten dalam svg
  $m = [regex]::Match($raw, '(?s)<svg[^>]*>(.*)</svg>')
  $viewBox = [regex]::Match($raw, 'viewBox="([^"]+)"').Groups[1].Value
  if(-not $viewBox){ $viewBox = '0 0 120 120' }
  $body = $m.Groups[1].Value -replace '(?s)<title>.*?</title>',''

  [void]$sb.AppendLine("<g>")
  [void]$sb.AppendLine("<rect x=""$x"" y=""$y"" width=""$($colW-20)"" height=""$($rowH-20)"" rx=""16"" fill=""#FFFFFF"" stroke=""#E3E2E6"" stroke-width=""1""/>")
  $ix = $x + ($colW - 20 - 40) / 2
  $iy = $y + 18
  # nested svg dengan viewBox asli
  [void]$sb.AppendLine("<svg x=""$ix"" y=""$iy"" width=""40"" height=""40"" viewBox=""$viewBox"">$body</svg>")
  $ty = $y + ($rowH - 20) - 16
  [void]$sb.AppendLine("<text x=""$($x + ($colW-20)/2)"" y=""$ty"" font-size=""10"" fill=""#5F6F66"" text-anchor=""middle"" font-family=""monospace"">$($lg.Name)</text>")
  [void]$sb.AppendLine("</g>")
  $j++
}

[void]$sb.AppendLine("</svg>")

[System.IO.File]::WriteAllText($outFile, $sb.ToString(), $utf8)
Write-Host "SVG gabungan dibuat: $outFile"
Write-Host "Ukuran: $([math]::Round((Get-Item $outFile).Length/1KB,1)) KB"
Write-Host "Total: $totalIcons ikon + $($logos.Count) logo"
