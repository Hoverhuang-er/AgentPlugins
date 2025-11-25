#!/bin/bash
set -e

echo "Building mol3d WASM module..."

# Install wasm-pack if not already installed
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build for web target
wasm-pack build --target web --out-dir ui/pkg

echo "WASM build complete! Output in ui/pkg/"
