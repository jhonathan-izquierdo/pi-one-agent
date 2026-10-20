# Extensiones para Pi

Paquete de extensiones Pi-One Agent para [Pi](https://pi.dev).

## Instalación

El paquete se instala en el perfil personal de Pi desde GitHub. Requiere tener [Pi](https://pi.dev) instalado.

**PowerShell (Windows)**

```powershell
irm https://raw.githubusercontent.com/jhonathan-izquierdo/pi-one-agent/main/scripts/install.ps1 | iex
```

**Bash (macOS/Linux/Git Bash)**

```bash
curl -fsSL https://raw.githubusercontent.com/jhonathan-izquierdo/pi-one-agent/main/scripts/install.sh | sh
```

También puedes instalarlo directamente con Pi:

```bash
pi install git:github.com/jhonathan-izquierdo/pi-one-agent.git
```

Para actualizarlo posteriormente:

```bash
pi update git:github.com/jhonathan-izquierdo/pi-one-agent.git
```

Para eliminarlo:

```bash
pi remove git:github.com/jhonathan-izquierdo/pi-one-agent.git
```

## Banner Pi-One Agent

El logo oficial es [`assets/pi-logo-2.txt`](assets/pi-logo-2.txt). El comando `/pi-logo` muestra este arte ASCII, conservando sus caracteres y aplicando un gradiente neón cian → azul → violeta → magenta a todos los caracteres visibles. Usa ←/→ para recorrerlo si no cabe en tu terminal.

## Tema Halcy-one

[`themes/halcy-one.json`](themes/halcy-one.json) combina la atmósfera oscura de Halcyon con los acentos oficiales de SoftwareOne: Cool Cyan (`#62C7EF`), True Blue (`#3366FF`), Powder Purple (`#B0A7FF`), Teal Green (`#2C8F92`) y Cloudberry Red (`#F7675E`). Los fondos se mantienen azul-negro y los acentos se reservan para estados, sintaxis y elementos de interacción.

Al instalar el paquete, `halcy-one` es el tema predeterminado cuando Pi inicia con el tema `system`. Una selección explícita mediante `/settings` o `--use-theme` siempre prevalece. Para probarlo desde la raíz:

```bash
pi --extension ./extensions/pi-logo.ts --theme ./themes/halcy-one.json
```

También puedes elegir otro tema desde `/settings` → **Theme** cuando el paquete esté instalado. En Pi, ejecuta `/pi-logo`. Usa ←/→ para desplazar el arte y Enter o Esc para cerrar la ventana. Revisa el código de extensiones antes de habilitarlas: se ejecutan con los permisos del proceso de Pi.

## Estructura

- `extensions/`: extensiones TypeScript/JavaScript de Pi.
- `assets/`: logo ASCII oficial.
- `themes/`: temas distribuidos por el paquete.
- `scripts/`: instaladores y desinstaladores para PowerShell y Bash.
