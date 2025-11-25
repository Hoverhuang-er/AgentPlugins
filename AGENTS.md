# Agent Guidelines for AgentPlugins Repository

## Repository Structure
- Plugin subdirectories organized by function in root directory
- `.github/workflows/build.yml` - Triggered by tags starting with `v-` or `b-`
- `.github/workflows/release.yml` - Requires `CHANGELOG.md` to be updated before release

## Build/Lint/Test Commands
```bash
cargo build                     # Build all plugins
cargo build --package <plugin>  # Build specific plugin
cargo test                      # Run all tests
cargo test --package <plugin>   # Run tests for specific plugin
cargo test <test_name>          # Run single test
cargo clippy                    # Run linter
cargo fmt                       # Format code
```

## Code Style
- **Language**: Rust (2021 edition recommended)
- **Formatting**: Use `cargo fmt` with default rustfmt settings
- **Imports**: Group stdlib, external crates, then internal modules; alphabetize within groups
- **Naming**: snake_case for functions/variables, PascalCase for types/traits, SCREAMING_SNAKE_CASE for constants
- **Error Handling**: Use `Result<T, E>` with proper error types; prefer `?` operator over `unwrap()`
- **Types**: Explicit type annotations for public APIs; leverage type inference internally
- **Documentation**: Add `///` doc comments for public items; include examples where helpful

## Workflow Requirements
- Tag commits with `v-<version>` or `b-<build>` to trigger build actions
- Update `CHANGELOG.md` before triggering release workflow
- Each plugin should be a separate Cargo workspace member
