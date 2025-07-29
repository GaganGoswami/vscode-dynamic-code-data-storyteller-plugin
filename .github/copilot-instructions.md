<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Copilot Instructions for Dynamic Code & Data Storyteller

This is a VS Code extension project. Please use the get_vscode_api with a query as input to fetch the latest VS Code API references.

## Project Context

This extension provides real-time, interactive visualization of code execution, data flow, call graphs, side effects, and test coverage across multiple programming languages including JavaScript/TypeScript, Python, Java, and C++.

## Key Components

- **VariableTracker**: Monitors variable lifecycle and state changes during debugging
- **CallGraphBuilder**: Constructs and animates function call relationships  
- **WhatIfEngine**: Executes sandboxed scenarios with mock data using vm2
- **SideEffectDetector**: Identifies and categorizes side effects (I/O, network, database, etc.)
- **VisualizationPanel**: Manages the webview interface with D3.js visualizations

## Development Guidelines

1. **TypeScript**: Use strict TypeScript with proper type annotations
2. **VS Code API**: Always use the latest VS Code extension APIs
3. **Async/Await**: Use async/await pattern for all I/O operations
4. **Error Handling**: Include comprehensive error handling and logging
5. **Testing**: Write unit tests for all new functionality
6. **Documentation**: Include JSDoc comments for public APIs

## Architecture Patterns

- Use the Debug Adapter Protocol for real-time debugging integration
- Implement message passing between extension and webview
- Follow VS Code extension best practices for activation events
- Use Tree-sitter for language-aware code parsing
- Implement sandboxed execution for what-if analysis

## Code Style

- Use camelCase for variables and methods
- Use PascalCase for classes and interfaces
- Include comprehensive error handling
- Log important events for debugging
- Follow VS Code extension naming conventions

## Dependencies

- Core: vscode, typescript
- Parsing: tree-sitter, tree-sitter-*
- Sandbox: vm2
- Visualization: D3.js (in webview)
- Testing: mocha, @vscode/test-electron
