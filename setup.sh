#!/usr/bin/env bash

set -e

STRUCTURE_FILE="struct.json"
ENV_NAME="travel-planner"
DB_FILE="./data/db.sqlite"
CONDA_ENV_FILE="frontend/environment.yml"

create_project_structure() {
  echo "📁 Creating folders and files from struct.json..."
  local path="$1"
  local json="$2"
  mkdir -p "$path"

  for key in $(echo "$json" | jq -r 'keys[]'); do
    local value=$(echo "$json" | jq ".\"$key\"")
    if echo "$value" | jq -e 'type == "object"' > /dev/null; then
      create_project_structure "$path/$key" "$value"
    else
      touch "$path/$key"
    fi
  done
}

setup_conda_env() {
  echo "🔍 Checking for existing Conda environment..."
  if conda info --envs | grep -q "$ENV_NAME"; then
    echo "✅ Conda environment '$ENV_NAME' already exists."
  else
    echo "📦 Writing Conda environment file..."
    cat <<EOF > $CONDA_ENV_FILE
name: $ENV_NAME
channels:
  - conda-forge
dependencies:
  - python=3.11
  - streamlit
  - pandas
  - requests
  - python-dotenv
  - openpyxl
EOF

    echo "🛠️ Creating Conda environment '$ENV_NAME'..."
    conda env create -f $CONDA_ENV_FILE
  fi
}


init_backend() {
  echo "🔄 Initializing backend npm project..."
  cd backend
  npm init -y
  npm install \
    express \
    axios \
    sqlite3 \
    dotenv \
    cors \
    helmet \
    compression \
    morgan \
    module-alias \
    winston \
    bcrypt \
    express-rate-limit \
    express-validator \
    swagger-jsdoc \
    swagger-ui-express

  npm install --save-dev \
    nodemon \
    prettier

  echo "🛠️ Adding scripts to package.json..."
  if command -v npx &> /dev/null; then
    npx json -I -f package.json -e '
      this.scripts = {
        "test": "echo \"Error: no test specified\" && exit 1",
        "start": "node server.js",
        "dev": "nodemon --quiet server.js",
        "format": "prettier --write \"**/*.{js,json,md}\""
      }'
  else
    echo "⚠️ 'npx' not found. Using sed to add dev script..."
    sed -i.bak 's/"scripts": {/&\n    "start": "node server.js",\n    "dev": "nodemon --quiet server.js",\n    "format": "prettier --write \"**\/*.{js,json,md}\""/' package.json
    rm package.json.bak
  fi
  cd ..
}

check_or_install_ollama() {
  echo "🔍 Checking for Ollama..."
  if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found."
    echo "📦 Installing Ollama via apt..."
    if ! command -v apt &> /dev/null; then
      echo "🚫 'apt' not available. Cannot install Ollama automatically."
      echo "Please install Ollama manually: https://ollama.com/download"
      exit 1
    fi
    curl -fsSL https://ollama.com/install.sh | sh
  else
    echo "✅ Ollama is installed."
  fi
}

pull_mistral_model() {
  echo "🔍 Checking for 'mistral' model..."
  if ! ollama list | grep -q "mistral"; then
    echo "⬇️ Pulling mistral model..."
    ollama pull mistral
  else
    echo "✅ Mistral model is available."
  fi
}

# === MAIN SETUP ENTRY POINT ===
main() {
  ROOT_JSON=$(cat "$STRUCTURE_FILE")
  create_project_structure "." "$ROOT_JSON"
  setup_conda_env
  init_backend
  check_or_install_ollama
  pull_mistral_model

  echo "✅ Full setup complete!"
  echo
  echo "👉 Next steps:"
  echo "   1. Run: conda activate $ENV_NAME"
  echo "   2. Run: npm run dev (inside ./backend)"
  echo "   3. Run: streamlit run frontend/app.py"
}

main
