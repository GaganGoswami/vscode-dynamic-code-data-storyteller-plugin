# Dynamic Code & Data Storyteller - Installation & Usage Guide

## 🚀 Installation Methods

### Method 1: Development Mode (Recommended for Testing)

1. **Clone and setup the project:**
   ```bash
   cd /Users/Gagan/Code/vibe/code-dynamic-story-plugin
   npm install
   npm run compile
   ```

2. **Launch Extension Development Host:**
   - Open the project in VS Code
   - Press `F5` or go to `Run > Start Debugging`
   - A new VS Code window opens with your extension loaded

### Method 2: Install VSIX Package

1. **Package the extension:**
   ```bash
   vsce package
   ```

2. **Install the generated VSIX:**
   - Open VS Code
   - Go to `Extensions` view (`Cmd+Shift+X`)
   - Click the `...` menu → `Install from VSIX...`
   - Select `dynamic-code-storyteller-0.0.1.vsix`

### Method 3: Marketplace Installation (Future)
   ```bash
   code --install-extension dynamic-code-storyteller
   ```

## 📖 How to Use

### 1. Variable Tracking

**Track a variable's lifecycle during debugging:**

1. Open a JavaScript/TypeScript/Python file
2. Select a variable name in the code
3. Run command: `Code Storyteller: Trace Variable`
4. Start debugging your code (`F5`)
5. Watch real-time variable changes in the visualization panel

### 2. Call Graph Visualization

**Generate interactive call graphs:**

1. Open a source file
2. Run command: `Code Storyteller: Show Call Graph`
3. View the interactive D3.js visualization showing:
   - Function relationships
   - Call frequencies
   - Execution paths

### 3. What-If Analysis

**Run sandbox scenarios with mock data:**

1. Open a function you want to analyze
2. Run command: `Code Storyteller: What-If Analysis`
3. Enter mock input data in JSON format:
   ```json
   {"userId": 123, "data": [1, 2, 3]}
   ```
4. View the predicted execution flow and side effects

### 4. Side Effect Detection

**Monitor and categorize side effects:**

1. Start debugging your application
2. Side effects are automatically detected:
   - File I/O operations
   - Network requests
   - Database queries
   - Console outputs
3. View categorized effects in the visualization panel

## 🎮 Available Commands

Access these commands via:
- **Command Palette** (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux)
- **Right-click context menu** in editor

| Command | Description |
|---------|-------------|
| `Code Storyteller: Trace Variable` | Start tracking a selected variable |
| `Code Storyteller: Show Call Graph` | Generate call graph visualization |
| `Code Storyteller: What-If Analysis` | Run sandbox analysis with mock data |
| `Code Storyteller: Open Visualization` | Open the main visualization panel |

## 🔧 Supported Languages

- **JavaScript** (.js)
- **TypeScript** (.ts)
- **Python** (.py)
- **Java** (.java)
- **C++** (.cpp, .cc, .cxx)

## 📊 Visualization Features

### Interactive Elements:
- **Force-directed graphs** for call relationships
- **Timeline visualizations** for variable state changes
- **Side effect categorization** with color coding
- **Playback controls** for execution flow
- **Zoom and pan** capabilities
- **Real-time updates** during debugging

### Data Views:
- Variable lifecycle and state changes
- Function call frequency and relationships
- Side effect impact analysis
- What-if scenario comparisons
- Performance metrics

## 🐛 Debugging Integration

The extension automatically integrates with VS Code's debugging features:

1. **Start debugging** your application (`F5`)
2. **Set breakpoints** where you want to analyze
3. **Use debug commands** to step through code
4. **Watch real-time updates** in the visualization panel

## 📝 Example Usage Workflow

1. **Open a project** with JavaScript/TypeScript code
2. **Select a variable** you want to track (e.g., `userData`)
3. **Run** `Code Storyteller: Trace Variable`
4. **Start debugging** your application
5. **Set breakpoints** and step through code
6. **Observe** real-time variable changes in the visualization panel
7. **Run what-if analysis** to test different scenarios
8. **View call graph** to understand code structure

## 🔍 Troubleshooting

### Extension Not Loading
- Ensure you're using VS Code 1.74.0 or later
- Check that the extension is properly installed
- Restart VS Code if needed

### Visualization Panel Not Opening
- Try running `Code Storyteller: Open Visualization` command
- Check the developer console for errors (`Help > Toggle Developer Tools`)

### Debug Integration Issues
- Ensure your project has a proper debug configuration
- Check that your language's debug adapter is installed
- Verify breakpoints are set correctly

## 🔧 Development Setup

For contributing or customizing:

```bash
# Clone the repository
git clone <your-repo-url>
cd code-dynamic-story-plugin

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run tests
npm test

# Watch mode for development
npm run watch
```

## 📚 Additional Resources

- [VS Code Extension API Documentation](https://code.visualstudio.com/api)
- [Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol/)
- [Tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/)
- [D3.js Documentation](https://d3js.org/)

## 🤝 Support

For issues, feature requests, or contributions:
- Create an issue in the GitHub repository
- Check the existing documentation
- Review the CHANGELOG.md for recent updates
