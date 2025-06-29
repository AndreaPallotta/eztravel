#!/usr/bin/env bash

set -e
bash ./struct.sh

echo "📦 Writing Conda environment file..."
cat <<EOF > frontend/environment.yml
name: travel-planner
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

echo "🔍 Checking for existing Conda environment..."
if conda info --envs | grep -q "travel-planner"; then
  echo "✅ Conda environment 'travel-planner' already exists."
else
  echo "🛠️ Creating Conda environment 'travel-planner'..."
  conda env create -f frontend/environment.yml
fi

echo "🔄 Initializing backend npm project..."
cd backend
npm init -y
npm install express axios sqlite3 dotenv cors helmet compression morgan module-alias winston
npm install --save-dev nodemon

echo "🛠️ Adding nodemon dev script to package.json..."
if command -v npx &> /dev/null; then
  npx json -I -f package.json -e 'this.scripts.dev="nodemon server.js"'
else
  echo "⚠️ 'npx' not found. Using sed to add dev script..."
  sed -i.bak 's/"scripts": {/"scripts": {\n    "dev": "nodemon server.js",/' package.json
  rm package.json.bak  # Clean up backup if not needed
fi

cd ..

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

echo "🔍 Checking for 'mistral' model..."
if ! ollama list | grep -q "mistral"; then
  echo "⬇️ Pulling mistral model..."
  ollama pull mistral
else
  echo "✅ Mistral model is available."
fi

echo "✅ Full setup complete!"
echo
echo "👉 Next steps:"
echo "   1. Run: conda activate travel-planner"
echo "   2. Run: npm run dev (inside ./backend)"
echo "   3. Run: streamlit run frontend/app.py"

