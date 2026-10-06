$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

$adres = "http://localhost:5500"

function Bekle-Ve-Kapat {
    param([string]$Mesaj)
    Write-Host $Mesaj -ForegroundColor Red
    Read-Host "Kapatmak için Enter"
    exit 1
}

$nodeKomutu = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeKomutu) {
    Bekle-Ve-Kapat "Backend için Node.js 18 veya daha yeni bir sürüm gerekli. https://nodejs.org adresinden kurun."
}

$anaSurum = & $nodeKomutu.Source -p "Number(process.versions.node.split('.')[0])"
if ($LASTEXITCODE -ne 0 -or [int]$anaSurum -lt 18) {
    Bekle-Ve-Kapat "Node.js 18 veya daha yeni bir sürüm gerekli."
}

try {
    $durum = Invoke-RestMethod -Method Get -Uri "$adres/api/saglik" -TimeoutSec 2
    if ($durum.servis -eq "kokiz-backend") {
        Write-Host "KÖKİZ backend zaten çalışıyor." -ForegroundColor Green
        Start-Process $adres
        exit 0
    }
} catch {
    # Port boşsa normal başlatma akışına geçilir.
}

try {
    $yanit = Invoke-WebRequest -UseBasicParsing -Method Head -Uri $adres -TimeoutSec 2
    if ($yanit.StatusCode -ge 200) {
        Bekle-Ve-Kapat "5500 portunu başka bir uygulama kullanıyor. O uygulamayı kapatıp tekrar deneyin."
    }
} catch {
    # Beklenen durum: port boş.
}

Write-Host "KÖKİZ backend başlatılıyor: $adres" -ForegroundColor Cyan
if (-not (Test-Path -LiteralPath ".env")) {
    Write-Host "Not: Gerçek e-posta gönderimi için .env dosyasını yapılandırın." -ForegroundColor Yellow
}

Start-Process $adres
& $nodeKomutu.Source server.js

if ($LASTEXITCODE -ne 0) {
    Bekle-Ve-Kapat "Backend beklenmedik biçimde kapandı. Yukarıdaki hata mesajını kontrol edin."
}
