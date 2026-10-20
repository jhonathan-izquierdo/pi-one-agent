# Desinstala Pi-One Agent del perfil personal de Pi.
# Uso: .\scripts\uninstall.ps1

$ErrorActionPreference = "Stop"
$packageSource = "git:github.com/jhonathan-izquierdo/pi-one-agent.git"

if (-not (Get-Command pi -ErrorAction SilentlyContinue)) {
  throw "No se encontró el comando 'pi'."
}

Write-Host "Desinstalando Pi-One Agent..." -ForegroundColor Cyan
pi remove $packageSource
Write-Host "Pi-One Agent fue eliminado de tu perfil personal de Pi." -ForegroundColor Green
