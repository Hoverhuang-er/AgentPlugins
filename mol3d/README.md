# Mol3D - 3D Molecule Viewer with WASM and LangChain

A high-performance 3D molecule visualization plugin built with:
- **Rust + WASM** for rendering
- **colco-rs** for element color management
- **LangChain** for AI-powered molecule generation
- **SurrealDB** for data persistence
- **Bun** for fast JavaScript runtime

## Features

- 🧪 3D molecular visualization with accurate element coloring
- 🤖 Natural language molecule generation via LangChain
- 💾 Persistent storage with SurrealDB
- ⚡ High-performance WASM rendering
- 🎨 CPK coloring scheme using colco-rs
- 🔍 Full-text molecule search

## Quick Start

```bash
# Build WASM module
cd mol3d
./build-wasm.sh

# Install and run UI
cd ui
bun install
bun run dev
```

See [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for detailed instructions.

## Architecture

```
Rust (WASM) → TypeScript → LangChain Chat UI
     ↓              ↓
  colco-rs    SurrealDB
```

## Example Usage

```typescript
import { Mol3DViewer } from "./index";

const viewer = new Mol3DViewer("canvas-id");
await viewer.initialize();

// Generate from natural language
const molecule = await viewer.processPrompt("Show me caffeine");

// Save to database
await viewer.saveMolecule(molecule);
```

## License

MIT OR Apache-2.0
