#!/usr/bin/env sh
# Instala Pi-One Agent para el perfil personal de Pi.
# Uso: ./scripts/install.sh

set -eu

package_source="git:github.com/jhonathan-izquierdo/pi-one-agent.git"

if ! command -v pi >/dev/null 2>&1; then
  printf '%s\n' "No se encontró el comando 'pi'. Instala Pi antes de ejecutar este script: https://pi.dev" >&2
  exit 1
fi

printf '%s\n' "Instalando Pi-One Agent desde GitHub..."
pi install "$package_source"

printf '%s\n' "Pi-One Agent fue instalado para tu perfil personal de Pi."
printf '%s\n' "Abre o reinicia Pi para cargar la personalización Pi-One y el estilo de herramientas."
