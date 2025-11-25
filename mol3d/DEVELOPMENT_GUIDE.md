# Mol3D Development Guide

## Overview

Mol3D is a 3D molecule viewer built with Rust and WASM, integrated with LangChain Chat UI for natural language molecule generation. It uses colco-rs for color management and SurrealDB for data persistence.

## Architecture

```
mol3d/
├── src/
│   └── lib.rs          # Rust WASM module (colco-rs integration)
├── ui/
│   ├── src/
│   │   ├── index.ts    # Main LangChain integration
│   │   └── database.ts # SurrealDB client
│   ├── pkg/            # Generated WASM output
│   └── package.json    # Bun dependencies
├── build-wasm.sh       # WASM build script
└── Cargo.toml          # Rust dependencies
```

## Prerequisites

- **Rust** (1.70+): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **wasm-pack**: `cargo install wasm-pack`
- **Bun** (1.0+): `curl -fsSL https://bun.sh/install | bash`
- **SurrealDB**: `curl -sSf https://install.surrealdb.com | sh`

## Setup

### 1. Build WASM Module

```bash
cd mol3d
./build-wasm.sh
```

This compiles Rust code to WASM and outputs to `ui/pkg/`.

### 2. Install UI Dependencies

```bash
cd ui
bun install
```

### 3. Start SurrealDB

```bash
surreal start --log trace --user root --pass root memory
```

Or use a persistent file:

```bash
surreal start --user root --pass root file://mol3d.db
```

## Development

### Running the Development Server

```bash
cd ui
bun run dev
```

### Testing WASM Module

```bash
cd mol3d
cargo test
```

### Building for Production

```bash
# Build WASM
./build-wasm.sh

# Build UI
cd ui
bun run build
```

## Using colco-rs with WASM

The colco-rs library provides color manipulation for element visualization. In `src/lib.rs`:

```rust
use colco::Color;

fn element_to_color(element: &str) -> [u8; 3] {
    match element {
        "C" => Color::from_hex("#909090").unwrap().to_rgb_u8(),
        "O" => Color::from_hex("#FF0D0D").unwrap().to_rgb_u8(),
        // ...
    }
}
```

### WASM Integration Flow

1. **Rust side**: Define `#[wasm_bindgen]` structs and methods
2. **Build**: `wasm-pack` generates JavaScript bindings
3. **TypeScript side**: Import and use WASM modules

```typescript
import init, { MolViewer } from "../pkg/mol3d.js";

await init(); // Initialize WASM
const viewer = new MolViewer("canvas-id");
viewer.render();
```

## LangChain Chat UI Integration

### Basic Usage

```typescript
import { createMol3DChat } from "./index";

const chat = await createMol3DChat();

// Handle user message
const response = await chat.handleMessage(
  "Show me a water molecule"
);

console.log(response); // "Generated and displaying molecule: Water (H2O)"
```

### Custom Integration

```typescript
import { Mol3DViewer } from "./index";

const viewer = new Mol3DViewer("mol3d-canvas", "ws://localhost:8000/rpc");
await viewer.initialize();

// Generate from prompt
const molecule = await viewer.processPrompt(
  "Create a caffeine molecule"
);

// Save to database
await viewer.saveMolecule(molecule);

// Search database
const results = await viewer.searchMolecules("caffeine");
```

## SurrealDB Schema

```sql
-- Define molecule table
DEFINE TABLE molecule SCHEMAFULL;

DEFINE FIELD name ON molecule TYPE string;
DEFINE FIELD formula ON molecule TYPE option<string>;
DEFINE FIELD smiles ON molecule TYPE option<string>;
DEFINE FIELD atoms ON molecule TYPE array;
DEFINE FIELD bonds ON molecule TYPE array;

-- Create indexes
DEFINE INDEX molecule_name ON molecule FIELDS name;
```

## API Reference

### Rust (WASM)

**`MolViewer`**
- `new(canvas_id: String)`: Create viewer
- `load_molecule(json: String)`: Load molecule from JSON
- `render()`: Render to canvas
- `create_water_molecule()`: Create example H2O

### TypeScript

**`Mol3DViewer`**
- `initialize()`: Setup WASM and database
- `processPrompt(prompt: string)`: Generate molecule from text
- `loadMoleculeByName(name: string)`: Load from database
- `saveMolecule(molecule: MoleculeData)`: Save to database
- `searchMolecules(query: string)`: Search database

**`MoleculeDB`**
- `connect()`: Connect to SurrealDB
- `createMolecule(molecule)`: Insert molecule
- `getMoleculeByName(name)`: Query by name
- `searchMolecules(query)`: Full-text search

## Troubleshooting

### WASM Module Not Loading

Ensure `build-wasm.sh` completed successfully and `ui/pkg/` exists.

### SurrealDB Connection Failed

Check SurrealDB is running: `curl http://localhost:8000/health`

### Bun Import Errors

Clear cache: `rm -rf node_modules && bun install`

## Performance Tips

1. **WASM optimization**: Use `--release` flag in build-wasm.sh
2. **Database indexing**: Add indexes for frequently queried fields
3. **Lazy loading**: Initialize WASM only when needed

## Contributing

See main repository AGENTS.md for code style guidelines.

## License

MIT OR Apache-2.0
