# Extensiones para Pi

Repositorio de extensiones y experimentos para [Pi](https://pi.dev).

## Banner Pi-One Agent

El logo oficial es [`assets/pi-logo-2.txt`](assets/pi-logo-2.txt). Los comandos `/pi-logo` y `/pi-logo-2` muestran este mismo arte ASCII, conservando sus caracteres y aplicando un gradiente neón cian → azul → violeta → magenta a todos los caracteres visibles. Usa ←/→ para recorrerlo si no cabe en tu terminal.

El banner anterior se conserva en [`assets/pi-logo.txt`](assets/pi-logo.txt) como referencia histórica.

## Tema Halcy-one

[`themes/halcy-one.json`](themes/halcy-one.json) combina la atmósfera oscura de Halcyon con los acentos oficiales de SoftwareOne: Cool Cyan (`#62C7EF`), True Blue (`#3366FF`), Powder Purple (`#B0A7FF`), Teal Green (`#2C8F92`) y Cloudberry Red (`#F7675E`). Los fondos se mantienen azul-negro y los acentos se reservan para estados, sintaxis y elementos de interacción.

Al instalar el paquete, `halcy-one` es el tema predeterminado cuando Pi inicia con el tema `system`. Una selección explícita mediante `/settings` o `--use-theme` siempre prevalece. Para probarlo desde la raíz:

```bash
pi --extension ./extensions/pi-logo.ts --theme ./themes/halcy-one.json
```

También puedes elegir otro tema desde `/settings` → **Theme** cuando el paquete esté instalado. En Pi, ejecuta `/pi-logo` (o su alias `/pi-logo-2`). Usa ←/→ para desplazar el arte y Enter o Esc para cerrar la ventana. Revisa el código de extensiones antes de habilitarlas: se ejecutan con los permisos del proceso de Pi.

## Estructura

- `extensions/`: extensiones TypeScript/JavaScript de Pi.
- `assets/`: referencia PNG y banner ASCII.
