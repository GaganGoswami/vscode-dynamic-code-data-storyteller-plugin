# Architecture Documentation

## Overview

The Dynamic Code & Data Storyteller is a sophisticated VSCode extension that provides real-time visualization of code execution, data flow, and program behavior. This document outlines the architectural design, component relationships, and key technical decisions.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension Host                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │   Extension     │  │  Debug Adapter   │  │  Language   │ │
│  │   Controller    │  │    Protocol      │  │  Services   │ │
│  │  (extension.ts) │  │   Integration    │  │             │ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │ Variable        │  │ Call Graph       │  │ Side Effect │ │
│  │ Tracker         │  │ Builder          │  │ Detector    │ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
│                           │                                 │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ What-If         │  │ Sandbox          │                 │
│  │ Engine          │  │ Environment      │                 │
│  └─────────────────┘  └──────────────────┘                 │
├─────────────────────────────────────────────────────────────┤
│                    Webview Panel                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 Frontend UI                            │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │ │
│  │  │  D3.js      │ │ Interaction │ │ Message     │      │ │
│  │  │ Visualiza-  │ │ Controls    │ │ Passing     │      │ │
│  │  │ tions       │ │             │ │             │      │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Extension Controller (`extension.ts`)

**Responsibility**: Main entry point and orchestration
- Activation and deactivation lifecycle management
- Command registration and handling
- Debug session event coordination
- Component initialization and cleanup

**Key Functions**:
- `activate()`: Initialize all components and register event listeners
- Command handlers for user actions
- Debug session lifecycle management
- Webview panel coordination

### 2. Variable Tracker (`VariableTracker.ts`)

**Responsibility**: Monitor variable lifecycle and state changes

**Architecture**:
```typescript
interface VariableState {
    name: string;
    value: any;
    type: string;
    timestamp: number;
    location: vscode.Position;
    scope: string;
}

interface VariableHistory {
    variable: string;
    states: VariableState[];
    metadata: {
        firstSeen: number;
        lastUpdated: number;
        updateCount: number;
    };
}
```

**Key Features**:
- Real-time variable state tracking during debugging
- Historical state preservation with timestamps
- Scope-aware variable monitoring
- Debug Adapter Protocol integration
- Memory-efficient circular buffer for state history

### 3. Call Graph Builder (`CallGraphBuilder.ts`)

**Responsibility**: Construct and maintain dynamic call graphs

**Architecture**:
```typescript
interface CallGraphNode {
    id: string;
    name: string;
    location: vscode.Position;
    calls: FunctionCall[];
    childNodes: CallGraphNode[];
    parentNode?: CallGraphNode;
    metadata: {
        totalCalls: number;
        averageDuration: number;
        minDuration: number;
        maxDuration: number;
    };
}
```

**Implementation Strategy**:
- Static analysis using Tree-sitter for initial graph construction
- Runtime enhancement through debug session stack traces
- Force-directed graph layout for visualization
- Performance metrics collection and aggregation

### 4. What-If Engine (`WhatIfEngine.ts`)

**Responsibility**: Execute sandboxed scenarios with mock data

**Sandbox Architecture**:
```
┌─────────────────────────────────────────┐
│            Sandbox Environment          │
│  ┌─────────────────────────────────────┐ │
│  │        VM2 Isolated Context        │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │      User Code + Mocks         │ │ │
│  │  │  ┌─────────────────────────────┐│ │ │
│  │  │  │   Instrumented Functions   ││ │ │
│  │  │  └─────────────────────────────┘│ │ │
│  │  └─────────────────────────────────┘ │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Security Measures**:
- VM2 sandboxing for complete isolation
- Timeout protection against infinite loops
- Mock implementations for I/O operations
- Memory usage monitoring and limits

### 5. Side Effect Detector (`SideEffectDetector.ts`)

**Responsibility**: Identify and categorize program side effects

**Detection Strategies**:
- Debug message interception
- Static code analysis for potential effects
- Runtime monitoring through instrumentation
- Pattern matching for common side effect signatures

**Effect Categories**:
- I/O operations (file, network, console)
- Database transactions
- Memory modifications
- Process interactions

### 6. Visualization Panel (`VisualizationPanel.ts`)

**Responsibility**: Manage webview interface and user interactions

**Message Passing Architecture**:
```
Extension ←→ Webview
    │         │
    │         ├─ D3.js Visualizations
    │         ├─ User Interaction Handlers
    │         ├─ Animation Controllers
    │         └─ Data Processing
```

## Data Flow

### 1. Variable Tracking Flow
```
Debug Session Start
        ↓
Variable State Change
        ↓
Debug Adapter Message
        ↓
VariableTracker.handleDebugMessage()
        ↓
State History Update
        ↓
Webview Notification
        ↓
Visualization Update
```

### 2. Call Graph Generation Flow
```
User Command / Debug Session
        ↓
Static Analysis (Tree-sitter)
        ↓
Initial Graph Construction
        ↓
Runtime Enhancement (Stack Traces)
        ↓
Performance Metrics Collection
        ↓
Graph Visualization
```

### 3. What-If Analysis Flow
```
User Input (Mock Data)
        ↓
Code Instrumentation
        ↓
Sandbox Creation (VM2)
        ↓
Isolated Execution
        ↓
Execution Path Capture
        ↓
Performance Analysis
        ↓
Results Visualization
```

## Design Patterns

### 1. Observer Pattern
Used for debug session event handling and real-time updates:
```typescript
// Extension acts as subject
vscode.debug.onDidStartDebugSession(session => {
    // Notify all observers
    variableTracker.attachToDebugSession(session);
    callGraphBuilder.attachToDebugSession(session);
    sideEffectDetector.attachToDebugSession(session);
});
```

### 2. Strategy Pattern
Language-specific parsing and analysis:
```typescript
class LanguageStrategy {
    abstract parseVariables(code: string): Variable[];
    abstract extractFunctions(code: string): Function[];
}

class JavaScriptStrategy extends LanguageStrategy { /* ... */ }
class PythonStrategy extends LanguageStrategy { /* ... */ }
```

### 3. Singleton Pattern
Webview panel management ensures single instance:
```typescript
export class VisualizationPanel {
    public static currentPanel: VisualizationPanel | undefined;
    
    public static createOrShow(extensionUri: vscode.Uri): VisualizationPanel {
        if (VisualizationPanel.currentPanel) {
            VisualizationPanel.currentPanel.panel.reveal();
            return VisualizationPanel.currentPanel;
        }
        // Create new instance
    }
}
```

### 4. Command Pattern
User actions are encapsulated as commands:
```typescript
vscode.commands.registerCommand('storyteller.traceVariable', async () => {
    // Command implementation
});
```

## Performance Optimizations

### 1. Lazy Loading
- Components are initialized only when needed
- Visualizations are rendered on-demand
- Large datasets are paginated

### 2. Debouncing
- Debug message processing is debounced to prevent flooding
- UI updates are batched for better performance
- User input is debounced for responsive filtering

### 3. Memory Management
- Circular buffers for variable history
- Automatic cleanup of old data
- Weak references where appropriate

### 4. Efficient Data Structures
- Maps for O(1) lookups
- Sets for unique collections
- Optimized graph traversal algorithms

## Security Considerations

### 1. Sandbox Isolation
- VM2 provides complete execution isolation
- No access to host file system or network
- Timeout protection against infinite loops

### 2. Input Validation
- JSON input parsing with error handling
- Command parameter validation
- File path sanitization

### 3. Content Security Policy
- Strict CSP for webview content
- Nonce-based script execution
- Limited external resource access

## Error Handling Strategy

### 1. Graceful Degradation
- Component failures don't crash the entire extension
- Fallback visualizations for complex data
- User-friendly error messages

### 2. Logging and Diagnostics
- Comprehensive error logging
- Debug information collection
- Performance monitoring

### 3. Recovery Mechanisms
- Automatic retry for transient failures
- State restoration after crashes
- User notification for critical errors

## Extension Points

### 1. Language Support
- Tree-sitter grammar integration
- Custom parsing strategies
- Language-specific visualizations

### 2. Visualization Types
- Plugin architecture for new visualization types
- Custom D3.js chart implementations
- Theming and customization options

### 3. Export Formats
- Multiple output format support
- Custom export processors
- Integration with external tools

## Testing Strategy

### 1. Unit Tests
- Individual component testing
- Mock implementations for VS Code APIs
- Isolated function testing

### 2. Integration Tests
- End-to-end workflow testing
- Debug session simulation
- Webview interaction testing

### 3. Performance Tests
- Memory usage monitoring
- Execution time benchmarks
- Large dataset handling

## Future Enhancements

### 1. Machine Learning Integration
- Anomaly detection in execution patterns
- Predictive performance analysis
- Intelligent code optimization suggestions

### 2. Collaborative Features
- Shared visualization sessions
- Team performance analytics
- Code review integration

### 3. Advanced Visualizations
- 3D call graph representations
- VR/AR visualization modes
- Real-time collaboration tools

---

This architecture provides a solid foundation for the Dynamic Code & Data Storyteller extension while maintaining flexibility for future enhancements and ensuring optimal performance in the VS Code environment.
