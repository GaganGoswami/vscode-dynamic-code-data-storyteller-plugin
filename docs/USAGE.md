# Dynamic Code & Data Storyteller - Usage Guide

## Getting Started

### Installation
1. Install the extension from the VS Code marketplace
2. Open a project with supported languages (JavaScript, TypeScript, Python, Java, C++)
3. Start debugging or use the command palette to access features

### Basic Usage

#### Variable Tracking
1. Select a variable in your code
2. Right-click and choose "Trace Variable" or use `Ctrl+Shift+P` → "Code Storyteller: Trace Variable"
3. The variable will be tracked during debugging sessions
4. View the variable's lifecycle in the visualization panel

#### Call Graph Generation
1. Open any code file
2. Use `Ctrl+Shift+P` → "Code Storyteller: Show Call Graph"
3. The extension will analyze the code and generate an interactive call graph
4. Click on nodes to see function details and jump to source

#### What-If Analysis
1. Use `Ctrl+Shift+P` → "Code Storyteller: What-If Analysis"
2. Enter mock input values in JSON format
3. The extension will run your code in a sandbox with the mock data
4. View the execution paths and performance metrics

### Debugging Integration

The extension automatically integrates with VS Code's debugging features:

1. **Start Debugging**: Press F5 or use the debug panel
2. **Automatic Tracking**: The extension attaches to debug sessions automatically
3. **Real-time Updates**: Watch variables and function calls update in real-time
4. **Breakpoint Integration**: Side effects are tracked when breakpoints are hit

### Visualization Panel

The main visualization panel has several tabs:

#### Call Graph Tab
- Interactive force-directed graph of function calls
- Node size represents call frequency
- Colors indicate call depth
- Click nodes to jump to source code
- Drag to rearrange the layout

#### Variable Trace Tab
- Timeline of variable state changes
- Filter by variable name or scope
- See historical values and timestamps
- Correlate changes with function calls

#### What-If Analysis Tab
- Configure and run scenarios
- View execution paths as Sankey diagrams
- Compare performance metrics
- See code coverage for each scenario

#### Side Effects Tab
- Categorized list of side effects
- Filter by type (I/O, network, database, etc.)
- Impact level indicators
- Timeline view of when effects occurred

#### Timeline Tab
- Comprehensive timeline of all events
- Synchronized playback controls
- Speed adjustment
- Jump to specific time points

### Advanced Features

#### Filters and Search
- Use the search box to filter variables
- Select scope (global, local, all)
- Filter side effects by type and impact
- Export filtered data

#### Playback Controls
- Play/pause animation
- Adjust playback speed (0.1x to 2x)
- Reset to beginning
- Scrub through timeline

#### Export Options
- Export visualizations as SVG
- Save data as JSON or CSV
- Share scenarios with team members

### Supported Languages

#### JavaScript/TypeScript
- Full AST parsing with Tree-sitter
- ES6+ syntax support
- TypeScript type information
- Node.js and browser environments

#### Python
- Function and class detection
- Variable scope analysis
- Import tracking
- Virtual environment support

#### Java
- Class and method parsing
- Package structure analysis
- Exception tracking
- Maven/Gradle project support

#### C/C++
- Function and variable detection
- Header file analysis
- Memory operation tracking
- Cross-platform support

### Configuration

Access settings via File → Preferences → Settings → Extensions → Code Storyteller:

#### Real-time Tracking
- `storyteller.enableRealTimeTracking`: Enable/disable real-time variable tracking
- Default: `true`

#### Trace Depth
- `storyteller.maxTraceDepth`: Maximum depth for call graph analysis
- Default: `100`
- Range: 1-1000

#### Supported Languages
- `storyteller.supportedLanguages`: Array of languages to analyze
- Default: `["javascript", "typescript", "python", "java", "cpp"]`

### Performance Considerations

#### Large Codebases
- The extension may take longer to analyze large files
- Consider using filters to focus on specific areas
- Increase trace depth gradually for complex call chains

#### Memory Usage
- Variable history is limited to prevent memory issues
- Older entries are automatically cleaned up
- Consider reducing trace depth for memory-constrained environments

#### Sandboxed Execution
- What-if analysis runs in isolated environment
- Network and file system access is mocked
- Execution timeout prevents infinite loops

### Troubleshooting

#### Extension Not Starting
1. Check VS Code version (requires 1.74+)
2. Verify supported language files are open
3. Check console for error messages
4. Restart VS Code

#### No Debug Information
1. Ensure debugging is properly configured
2. Check that source maps are available
3. Verify debug adapter supports variable inspection
4. Check debug console for errors

#### Visualization Not Loading
1. Check webview is enabled in VS Code
2. Verify no content security policy conflicts
3. Check browser developer tools in webview
4. Try refreshing the visualization panel

#### Performance Issues
1. Reduce max trace depth in settings
2. Filter out unnecessary variables
3. Disable real-time tracking if needed
4. Close unused visualization tabs

### Tips and Best Practices

#### Effective Variable Tracking
- Focus on key variables rather than tracking everything
- Use meaningful variable names for easier identification
- Group related variables for better visualization

#### Call Graph Analysis
- Start with main/entry functions
- Use filters to focus on specific modules
- Look for unexpected call patterns
- Check for recursive calls and their depth

#### What-If Scenarios
- Start with simple input variations
- Test edge cases and boundary conditions
- Compare performance across scenarios
- Document interesting findings

#### Side Effect Monitoring
- Pay attention to high-impact effects
- Monitor database and network operations
- Track file system changes
- Review console output patterns

### Keyboard Shortcuts

- `Ctrl+Shift+P` → Commands: Access all extension commands
- Right-click → Context menu: Quick access to trace variable
- `F5`: Start debugging (automatic integration)
- `Ctrl+Shift+E`: Toggle visualization panel

### Integration with Other Tools

#### Test Frameworks
- Jest: Automatic test execution tracking
- Mocha: Test lifecycle integration
- pytest: Python test support
- JUnit: Java test framework support

#### Build Tools
- webpack: Module bundling awareness
- npm scripts: Package.json script integration
- Maven/Gradle: Java build tool support

#### Version Control
- Git integration for code change correlation
- Blame information in visualizations
- Branch comparison features

## Support

For additional help:
- Check the GitHub repository for issues and documentation
- Join the community Discord server
- Contact support via email

---

**Happy code storytelling!** 🚀
