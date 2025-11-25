# Mol3D 开发指南

## 概述

Mol3D 是一个使用 Rust 和 WASM 构建的 3D 分子查看器,与 LangChain Chat UI 集成,支持自然语言生成分子。它使用 colco-rs 进行颜色管理,使用 SurrealDB 进行数据持久化。

## 架构

```
mol3d/
├── src/
│   └── lib.rs          # Rust WASM 模块(集成 colco-rs)
├── ui/
│   ├── src/
│   │   ├── index.ts    # LangChain 主集成
│   │   └── database.ts # SurrealDB 客户端
│   ├── pkg/            # 生成的 WASM 输出
│   └── package.json    # Bun 依赖管理
├── build-wasm.sh       # WASM 构建脚本
└── Cargo.toml          # Rust 依赖配置
```

## 环境要求

- **Rust** (1.70+): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **wasm-pack**: `cargo install wasm-pack`
- **Bun** (1.0+): `curl -fsSL https://bun.sh/install | bash`
- **SurrealDB**: `curl -sSf https://install.surrealdb.com | sh`

## 安装配置

### 1. 构建 WASM 模块

```bash
cd mol3d
./build-wasm.sh
```

此命令将 Rust 代码编译为 WASM,输出到 `ui/pkg/` 目录。

### 2. 安装 UI 依赖

```bash
cd ui
bun install
```

### 3. 启动 SurrealDB

```bash
surreal start --log trace --user root --pass root memory
```

或使用持久化文件:

```bash
surreal start --user root --pass root file://mol3d.db
```

## 开发流程

### 运行开发服务器

```bash
cd ui
bun run dev
```

### 测试 WASM 模块

```bash
cd mol3d
cargo test
```

### 生产构建

```bash
# 构建 WASM
./build-wasm.sh

# 构建 UI
cd ui
bun run build
```

## 在 WASM 中使用 colco-rs

colco-rs 库为元素可视化提供颜色操作功能。在 `src/lib.rs` 中:

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

### WASM 集成流程

1. **Rust 端**: 定义 `#[wasm_bindgen]` 结构体和方法
2. **构建**: `wasm-pack` 生成 JavaScript 绑定
3. **TypeScript 端**: 导入并使用 WASM 模块

```typescript
import init, { MolViewer } from "../pkg/mol3d.js";

await init(); // 初始化 WASM
const viewer = new MolViewer("canvas-id");
viewer.render();
```

## LangChain Chat UI 集成

### 基础用法

```typescript
import { createMol3DChat } from "./index";

const chat = await createMol3DChat();

// 处理用户消息
const response = await chat.handleMessage(
  "显示一个水分子"
);

console.log(response); // "Generated and displaying molecule: Water (H2O)"
```

### 自定义集成

```typescript
import { Mol3DViewer } from "./index";

const viewer = new Mol3DViewer("mol3d-canvas", "ws://localhost:8000/rpc");
await viewer.initialize();

// 从提示词生成分子
const molecule = await viewer.processPrompt(
  "创建一个咖啡因分子"
);

// 保存到数据库
await viewer.saveMolecule(molecule);

// 搜索数据库
const results = await viewer.searchMolecules("咖啡因");
```

## SurrealDB 数据模式

```sql
-- 定义分子表
DEFINE TABLE molecule SCHEMAFULL;

DEFINE FIELD name ON molecule TYPE string;
DEFINE FIELD formula ON molecule TYPE option<string>;
DEFINE FIELD smiles ON molecule TYPE option<string>;
DEFINE FIELD atoms ON molecule TYPE array;
DEFINE FIELD bonds ON molecule TYPE array;

-- 创建索引
DEFINE INDEX molecule_name ON molecule FIELDS name;
```

## API 参考

### Rust (WASM)

**`MolViewer`**
- `new(canvas_id: String)`: 创建查看器
- `load_molecule(json: String)`: 从 JSON 加载分子
- `render()`: 渲染到画布
- `create_water_molecule()`: 创建示例水分子

### TypeScript

**`Mol3DViewer`**
- `initialize()`: 初始化 WASM 和数据库
- `processPrompt(prompt: string)`: 从文本生成分子
- `loadMoleculeByName(name: string)`: 从数据库加载
- `saveMolecule(molecule: MoleculeData)`: 保存到数据库
- `searchMolecules(query: string)`: 搜索数据库

**`MoleculeDB`**
- `connect()`: 连接到 SurrealDB
- `createMolecule(molecule)`: 插入分子数据
- `getMoleculeByName(name)`: 按名称查询
- `searchMolecules(query)`: 全文搜索

## 常见问题

### WASM 模块无法加载

确保 `build-wasm.sh` 成功完成且 `ui/pkg/` 目录存在。

### SurrealDB 连接失败

检查 SurrealDB 是否运行: `curl http://localhost:8000/health`

### Bun 导入错误

清除缓存: `rm -rf node_modules && bun install`

## 性能优化建议

1. **WASM 优化**: 在 build-wasm.sh 中使用 `--release` 标志
2. **数据库索引**: 为频繁查询的字段添加索引
3. **延迟加载**: 仅在需要时初始化 WASM

## 贡献指南

代码风格指南请参考主仓库的 AGENTS.md 文件。

## 许可证

MIT OR Apache-2.0
