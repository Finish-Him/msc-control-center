#!/usr/bin/env bash
# new-log.sh — Cria dev log diario a partir do template
# Uso: bash scripts/new-log.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATE="$PROJECT_ROOT/dev-logs/templates/daily-log.md"

# Data e hora em GMT-3 (Brasilia)
export TZ="America/Sao_Paulo"
TODAY=$(date +%Y-%m-%d)
YEAR=$(date +%Y)
MONTH=$(date +%m)
HORA=$(date +%H:%M)

TARGET_DIR="$PROJECT_ROOT/dev-logs/$YEAR/$MONTH"
TARGET_FILE="$TARGET_DIR/$TODAY.md"

if [ -f "$TARGET_FILE" ]; then
  echo "Log de hoje ja existe: $TARGET_FILE"
  exit 0
fi

mkdir -p "$TARGET_DIR"

sed \
  -e "s/{{DATA}}/$TODAY/g" \
  -e "s/{{HORA}}/$HORA/g" \
  -e "s/{{HORA_FIM}}/--:--/g" \
  "$TEMPLATE" > "$TARGET_FILE"

echo "Dev log criado: $TARGET_FILE"
