# Dynamic Code & Data Storyteller

A powerful Visual Studio Code extension that provides real-time, interactive visualization of code execution, data flow, call graphs, side effects, and test coverage across multiple programming languages.

## Features

### 🔍 Real-time Variable Tracking
- Track variable lifecycle and state changes during debugging
- Visual timeline of variable modifications
- Scope-aware variable monitoring
- Historical state tracking with timestamps

### 📊 Interactive Call Graph Visualization
- Dynamic call graph generation with execution metadata
- Function call animation and timing
- Parameter and return value tracking
- Call depth and frequency analysis

### 🧪 What-If Analysis Engine
- Sandboxed execution with mock inputs
- Branch path exploration
- Performance impact analysis
- Side effect prediction

### ⚠️ Side Effect Detection
- Real-time monitoring of I/O operations
- Network request tracking
- Database query detection
- File system operation monitoring
- Memory modification alerts

### 📈 Test Integration
- Jest, Mocha, pytest, JUnit support
- Test execution flow visualization
- Coverage overlay on visual representations
- Failure divergence highlighting

### 🎨 Rich Visualizations
- D3.js-powered interactive charts
- Timeline scrubbing and playback
- Zoom and pan capabilities
- Jump-to-source functionality
- Light/dark theme support

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Dynamic Code & Data Storyteller"
4. Click Install

## Usage

### Basic Commands

- **Trace Variable**: Select a variable in your code and run `Ctrl+Shift+P` → `Code Storyteller: Trace Variable`
- **Show Call Graph**: Open call graph visualization with `Ctrl+Shift+P` → `Code Storyteller: Show Call Graph`
- **What-If Analysis**: Run scenario analysis with `Ctrl+Shift+P` → `Code Storyteller: What-If Analysis`
- **Open Visualization**: Launch the main panel with `Ctrl+Shift+P` → `Code Storyteller: Open Visualization Panel`

### Debugging Integration

1. Start debugging your application (F5)
2. The extension automatically attaches to the debug session
3. Watch real-time updates in the visualization panel
4. Variable states and function calls are tracked automatically

### What-If Scenarios

1. Open the What-If Analysis tab
2. Enter mock input values in JSON format
3. Click "Run Scenario" to execute in sandbox
4. View execution paths and performance metrics

## Supported Languages

- JavaScript/TypeScript
- Python
- Java
- C/C++

## Configuration

Access settings via `File → Preferences → Settings` and search for "Code Storyteller":

```json
{
  "storyteller.enableRealTimeTracking": true,
  "storyteller.maxTraceDepth": 100,
  "storyteller.supportedLanguages": ["javascript", "typescript", "python", "java", "cpp"]
}
```

## Screenshots

### Call Graph Visualization
![Call Graph](docs/screenshots/call-graph.png)

### Variable Timeline
![Variable Timeline](docs/screenshots/variable-timeline.png)

### What-If Analysis
![What-If Analysis](docs/screenshots/what-if-analysis.png)

### Side Effects Dashboard
![Side Effects](docs/screenshots/side-effects.png)

## Architecture

The extension consists of several key components:

### Core Components
- **VariableTracker**: Monitors variable lifecycle and state changes
- **CallGraphBuilder**: Constructs and animates function call relationships
- **WhatIfEngine**: Executes sandboxed scenarios with mock data
- **SideEffectDetector**: Identifies and categorizes side effects
- **VisualizationPanel**: Manages the webview interface

### Frontend
- **D3.js**: Powers interactive visualizations
- **HTML/CSS/JS**: Responsive webview interface
- **Message Passing**: Real-time communication with extension

### Debugging Integration
- **Debug Adapter Protocol**: Hooks into VS Code debugging
- **Debug Session Tracking**: Monitors debug events and variables
- **Stack Frame Analysis**: Captures call stack information

## Development

### Prerequisites
- Node.js 16+
- VS Code 1.74+
- TypeScript 4.9+

### Setup
```bash
git clone https://github.com/your-repo/dynamic-code-storyteller
cd dynamic-code-storyteller
npm install
```

### Build
```bash
npm run compile
```

### Test
```bash
npm test
```

### Debug
1. Open the project in VS Code
2. Press F5 to launch Extension Development Host
3. Test the extension in the new window

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Reporting Issues
Please use the [GitHub Issues](https://github.com/your-repo/dynamic-code-storyteller/issues) page to report bugs or request features.

### Development Guidelines
- Follow TypeScript best practices
- Include comprehensive tests
- Update documentation for new features
- Ensure accessibility compliance

## License

MIT License - see [LICENSE](LICENSE) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Support

- 📧 Email: support@example.com
- 💬 Discord: [Join our community](https://discord.gg/example)
- 📖 Docs: [Full documentation](https://docs.example.com)

## Acknowledgments

- VS Code Extension API team
- D3.js community
- Tree-sitter project
- Debug Adapter Protocol specification

---

**Dynamic Code & Data Storyteller** - Making code execution visible and understandable.
