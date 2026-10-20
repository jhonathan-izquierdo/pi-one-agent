# Instala Pi-One Agent para el perfil personal de Pi.
# Uso: .\scripts\install.ps1

$ErrorActionPreference = "Stop"
$packageSource = "git:github.com/jhonathan-izquierdo/pi-one-agent.git"

if (-not (Get-Command pi -ErrorAction SilentlyContinue)) {
  throw "No se encontró el comando 'pi'. Instala Pi antes de ejecutar este script: https://pi.dev"
}

Write-Host "Instalando Pi-One Agent desde GitHub..." -ForegroundColor Cyan
pi install $packageSource

Write-Host "Pi-One Agent fue instalado para tu perfil personal de Pi." -ForegroundColor Green
Write-Host "Abre o reinicia Pi para cargar el logo oficial y el tema Halcy-one."
