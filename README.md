# Pi-One Agent para Pi

Personaliza Pi con una cabecera y tema propios, renderizado enriquecido de herramientas y diffs, estado de sesión y utilidades para el flujo de trabajo. Integra las funciones de [`pi-cc-extensions`](https://github.com/minuque/pi-cc-extensions), conservando su licencia MIT y atribución.

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

## Personalización TUI y estilo de herramientas

La extensión principal adapta Pi con renderizado de herramientas y diffs en modos normal/compacto, cabecera de inicio Pi-One, pie con métricas de tokens/coste/git, configuración interactiva, vista de contexto, referencias a sesiones/subagentes y compatibilidad fullscreen/ratón.

- `/pi-style` abre la configuración; admite `on`, `compact`, `off` y `status`.
- `/context` inspecciona el contexto disponible.
- `/pi-logo` muestra el logo ASCII completo con gradiente.
- La configuración se guarda en `~/.pi/agent/pi-one-agent.json`.
- Temas disponibles: `halcy-one`, `pi-one-dark` y `pi-one-light`.
- El tema inicial de Pi queda en `halcy-one`; cámbialo desde `/settings` → **Theme** cuando quieras.

`pi-one-dark` y `pi-one-light` derivan de los temas MIT de `pi-cc-extensions`; `halcy-one` conserva la identidad de SoftwareOne.

## Tema Halcy-one

[`themes/halcy-one.json`](themes/halcy-one.json) combina la atmósfera oscura de Halcyon con los acentos oficiales de SoftwareOne: Cool Cyan (`#62C7EF`), True Blue (`#3366FF`), Powder Purple (`#B0A7FF`), Teal Green (`#2C8F92`) y Cloudberry Red (`#F7675E`). Los fondos se mantienen azul-negro y los acentos se reservan para estados, sintaxis y elementos de interacción.

Al instalar el paquete, `halcy-one` es el tema predeterminado cuando Pi inicia con el tema `system`. Una selección explícita mediante `/settings` o `--use-theme` siempre prevalece. Para probarlo desde la raíz:

```bash
pi --extension ./extensions/pi-logo.ts --theme ./themes/halcy-one.json
```

También puedes elegir otro tema desde `/settings` → **Theme** cuando el paquete esté instalado. En Pi, ejecuta `/pi-logo`. Usa ←/→ para desplazar el arte y Enter o Esc para cerrar la ventana. Revisa el código de extensiones antes de habilitarlas: se ejecutan con los permisos del proceso de Pi.

## Estructura

- `extensions/`: extensión Pi-One y código integrado de `pi-cc-extensions`.
- `tests/`: pruebas de la extensión integrada.
- `LICENSE.pi-cc-extensions`: licencia MIT del código derivado; `extensions/renderer/tool/diff/ATTRIBUTION.md` conserva la atribución del componente de diff.
- `assets/`: logo ASCII oficial.
- `themes/`: temas distribuidos por el paquete.
- `scripts/`: instaladores y desinstaladores para PowerShell y Bash.
