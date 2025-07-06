#!/usr/bin/env bash

set -e

STRUCTURE_FILE="struct.json"

create_structure() {
  local path="$1"
  local json="$2"
  mkdir -p "$path"
  for key in $(echo "$json" | jq -r 'keys[]'); do
    value=$(echo "$json" | jq ".\"$key\"")

    if echo "$value" | jq -e 'type == "object"' > /dev/null; then
      create_structure "$path/$key" "$value"
    else
      touch "$path/$key"
    fi
  done
}

echo "📁 Creating folders and files from nested structure.json..."
ROOT_JSON=$(cat "$STRUCTURE_FILE")
create_structure "." "$ROOT_JSON"
