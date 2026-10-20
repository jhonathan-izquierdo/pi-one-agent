#!/usr/bin/env sh
# Desinstala Pi-One Agent del perfil personal de Pi.
# Uso: ./scripts/uninstall.sh

set -eu

package_source="git:github.com/jhonathan-izquierdo/pi-one-agent.git"

if ! command -v pi >/dev/null 2>&1; then
  printf '%s\n' "No se encontró el comando 'pi'." >&2
  exit 1
fi

printf '%s\n' "Desinstalando Pi-One Agent..."
pi remove "$package_source"
printf '%s\n' "Pi-One Agent fue eliminado de tu perfil personal de Pi."
