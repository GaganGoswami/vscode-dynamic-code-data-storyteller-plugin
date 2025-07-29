import * as vscode from 'vscode';
import { CallGraph } from '../CallGraphBuilder';
import { WhatIfResult } from '../WhatIfEngine';
import { SideEffectSummary } from '../SideEffectDetector';

/**
 * Manages the webview panel for visualizations
 */
export class VisualizationPanel {
    public static currentPanel: VisualizationPanel | undefined;
    public static readonly viewType = 'codeStoryteller';

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri): VisualizationPanel {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (VisualizationPanel.currentPanel) {
            VisualizationPanel.currentPanel.panel.reveal(column);
            return VisualizationPanel.currentPanel;
        }

        // Otherwise, create a new panel.
        VisualizationPanel.currentPanel = new VisualizationPanel(extensionUri);
        return VisualizationPanel.currentPanel;
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        VisualizationPanel.currentPanel = VisualizationPanel.createFromPanel(panel, extensionUri);
    }

    private static createFromPanel(panel: vscode.WebviewPanel, extensionUri: vscode.Uri): VisualizationPanel {
        const instance = Object.create(VisualizationPanel.prototype);
        instance.panel = panel;
        instance.extensionUri = extensionUri;
        instance.disposables = [];
        instance.initializePanel();
        return instance;
    }

    constructor(extensionUri: vscode.Uri) {
        // Create new panel
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        this.panel = vscode.window.createWebviewPanel(
            VisualizationPanel.viewType,
            'Code Storyteller',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'webview')]
            }
        );
        this.extensionUri = extensionUri;
        this.disposables = [];

        this.initializePanel();
    }

    private initializePanel() {

        // Set the webview's initial html content
        this.update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        // Update the content based on view changes
        this.panel.onDidChangeViewState(
            () => {
                if (this.panel.visible) {
                    this.update();
                }
            },
            null,
            this.disposables
        );

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'jumpToSource':
                        this.jumpToSource(message.file, message.line, message.column);
                        return;
                    case 'jumpToCurrentSource':
                        this.jumpToCurrentSource();
                        return;
                    case 'filterData':
                        this.filterVisualizationData(message.filters);
                        return;
                    case 'exportData':
                        this.exportVisualizationData(message.format);
                        return;
                    case 'requestFileContext':
                        this.sendCurrentFileContext();
                        return;
                    case 'highlightCodeRange':
                        this.highlightCodeRange(message.startLine, message.endLine);
                        return;
                }
            },
            null,
            this.disposables
        );
    }

    public show() {
        if (VisualizationPanel.currentPanel) {
            VisualizationPanel.currentPanel.panel.reveal();
        } else {
            VisualizationPanel.createOrShow(this.extensionUri);
        }
    }

    public updateCallGraph(callGraph: CallGraph) {
        this.panel.webview.postMessage({
            command: 'updateCallGraph',
            data: {
                ...callGraph,
                sourceFile: this.getCurrentFileName(),
                timestamp: Date.now()
            }
        });
    }

    public updateWhatIfAnalysis(analysis: WhatIfResult) {
        this.panel.webview.postMessage({
            command: 'updateWhatIfAnalysis',
            data: {
                ...analysis,
                sourceFile: this.getCurrentFileName(),
                timestamp: Date.now()
            }
        });
    }

    public updateSideEffects(sideEffects: SideEffectSummary) {
        this.panel.webview.postMessage({
            command: 'updateSideEffects',
            data: {
                ...sideEffects,
                sourceFile: this.getCurrentFileName(),
                timestamp: Date.now()
            }
        });
    }

    public updateVariableTrace(variables: any) {
        this.panel.webview.postMessage({
            command: 'updateVariableTrace',
            data: {
                variables,
                sourceFile: this.getCurrentFileName(),
                timestamp: Date.now()
            }
        });
    }

    public updateFileContext(fileName: string, filePath: string) {
        this.panel.webview.postMessage({
            command: 'updateFileContext',
            data: {
                fileName,
                filePath,
                fileExtension: this.getFileExtension(fileName),
                timestamp: Date.now()
            }
        });
    }

    public onDebugSessionStart(session: vscode.DebugSession) {
        this.panel.webview.postMessage({
            command: 'debugSessionStart',
            data: {
                sessionId: session.id,
                sessionName: session.name,
                sessionType: session.type
            }
        });
    }

    public onDebugSessionEnd(session: vscode.DebugSession) {
        this.panel.webview.postMessage({
            command: 'debugSessionEnd',
            data: {
                sessionId: session.id
            }
        });
    }

    public handleDebugMessage(message: any) {
        this.panel.webview.postMessage({
            command: 'debugMessage',
            data: message
        });
    }

    public dispose() {
        VisualizationPanel.currentPanel = undefined;

        // Clean up our resources
        this.panel.dispose();

        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private update() {
        const webview = this.panel.webview;
        this.panel.title = 'Code Storyteller';
        this.panel.webview.html = this.getHtmlForWebview(webview);
    }

    private jumpToSource(file: string, line: number, column: number) {
        vscode.workspace.openTextDocument(file).then(doc => {
            vscode.window.showTextDocument(doc).then(editor => {
                const position = new vscode.Position(line, column);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position));
            });
        });
    }

    private jumpToCurrentSource() {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            activeEditor.show();
            vscode.window.showTextDocument(activeEditor.document);
        }
    }

    private sendCurrentFileContext() {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            const fileName = this.getCurrentFileName();
            const filePath = activeEditor.document.fileName;
            this.updateFileContext(fileName, filePath);
        }
    }

    private highlightCodeRange(startLine: number, endLine: number) {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            const startPos = new vscode.Position(startLine, 0);
            const endPos = new vscode.Position(endLine, 0);
            const range = new vscode.Range(startPos, endPos);
            
            activeEditor.selection = new vscode.Selection(startPos, endPos);
            activeEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);
            
            // Optional: Create a decoration to highlight the range
            const decoration = vscode.window.createTextEditorDecorationType({
                backgroundColor: 'rgba(255, 255, 0, 0.3)',
                border: '1px solid rgba(255, 255, 0, 0.8)'
            });
            
            activeEditor.setDecorations(decoration, [range]);
            
            // Remove decoration after 3 seconds
            setTimeout(() => {
                decoration.dispose();
            }, 3000);
        }
    }

    private filterVisualizationData(filters: any) {
        // Handle filtering logic
        console.log('Applying filters:', filters);
    }

    private exportVisualizationData(format: string) {
        // Handle export logic
        vscode.window.showSaveDialog({
            filters: {
                'JSON': ['json'],
                'CSV': ['csv'],
                'SVG': ['svg']
            }
        }).then(uri => {
            if (uri) {
                console.log('Exporting data to:', uri.fsPath);
            }
        });
    }

    private getCurrentFileName(): string {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            const fileName = activeEditor.document.fileName;
            return fileName.split('/').pop() || fileName;
        }
        return 'Unknown File';
    }

    private getFileExtension(fileName: string): string {
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        const extensionMap: { [key: string]: string } = {
            'js': 'JS',
            'ts': 'TS',
            'jsx': 'JSX',
            'tsx': 'TSX',
            'py': 'PY',
            'java': 'JAVA',
            'cpp': 'C++',
            'c': 'C',
            'cs': 'C#',
            'go': 'GO',
            'rs': 'RS',
            'php': 'PHP',
            'rb': 'RB',
            'swift': 'SWIFT',
            'kt': 'KT'
        };
        return extensionMap[extension] || extension.toUpperCase();
    }

    private getCurrentFilePath(): string {
        const activeEditor = vscode.window.activeTextEditor;
        return activeEditor?.document.fileName || '';
    }

    private getHtmlForWebview(webview: vscode.Webview) {
        // Local path to main script run in the webview
        const scriptPathOnDisk = vscode.Uri.joinPath(this.extensionUri, 'webview', 'main.js');
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

        // Local path to css file
        const stylePathOnDisk = vscode.Uri.joinPath(this.extensionUri, 'webview', 'style.css');
        const styleUri = webview.asWebviewUri(stylePathOnDisk);

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}' 'unsafe-eval'; img-src ${webview.cspSource} https:; font-src ${webview.cspSource};">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleUri}" rel="stylesheet">
            <title>Code Storyteller</title>
            <style>
                /* Enhanced Styles for Code Storyteller */
                :root {
                    --primary-color: #007acc;
                    --secondary-color: #4fc3f7;
                    --success-color: #4caf50;
                    --warning-color: #ff9800;
                    --error-color: #f44336;
                    --background: var(--vscode-editor-background);
                    --foreground: var(--vscode-editor-foreground);
                    --border: var(--vscode-panel-border);
                    --hover: var(--vscode-list-hoverBackground);
                    --active: var(--vscode-list-activeSelectionBackground);
                }

                .file-header {
                    background: var(--vscode-titleBar-activeBackground);
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    padding: 8px 12px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-family: var(--vscode-editor-font-family);
                    font-size: 13px;
                }

                .file-icon {
                    width: 16px;
                    height: 16px;
                    background: var(--primary-color);
                    border-radius: 2px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                }

                .file-path {
                    color: var(--vscode-descriptionForeground);
                    font-size: 11px;
                    margin-left: auto;
                }

                .source-link {
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 3px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 11px;
                    transition: background 0.2s;
                }

                .source-link:hover {
                    background: var(--secondary-color);
                }

                .node-element {
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .node-element:hover {
                    stroke-width: 2px;
                    filter: brightness(1.2);
                }

                .function-node {
                    fill: var(--primary-color);
                    stroke: var(--vscode-editor-foreground);
                }

                .variable-node {
                    fill: var(--success-color);
                    stroke: var(--vscode-editor-foreground);
                }

                .side-effect-node {
                    fill: var(--warning-color);
                    stroke: var(--vscode-editor-foreground);
                }

                .error-node {
                    fill: var(--error-color);
                    stroke: var(--vscode-editor-foreground);
                }

                .node-label {
                    font-family: var(--vscode-editor-font-family);
                    font-size: 12px;
                    fill: var(--foreground);
                    pointer-events: none;
                    text-anchor: middle;
                    dominant-baseline: central;
                }

                .link-element {
                    stroke: var(--vscode-editor-foreground);
                    stroke-opacity: 0.6;
                    stroke-width: 1.5px;
                    fill: none;
                }

                .breadcrumb {
                    background: var(--vscode-breadcrumb-background);
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    padding: 6px 12px;
                    margin-bottom: 8px;
                    font-size: 12px;
                    color: var(--vscode-breadcrumb-foreground);
                }

                .breadcrumb-separator {
                    margin: 0 6px;
                    color: var(--vscode-descriptionForeground);
                }

                .tooltip {
                    position: absolute;
                    background: var(--vscode-editorHoverWidget-background);
                    border: 1px solid var(--vscode-editorHoverWidget-border);
                    border-radius: 4px;
                    padding: 8px;
                    font-size: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    pointer-events: none;
                    z-index: 1000;
                    max-width: 300px;
                }

                .metric-card {
                    background: var(--vscode-sideBar-background);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    padding: 12px;
                    margin: 8px 0;
                    transition: box-shadow 0.2s;
                }

                .metric-card:hover {
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .metric-title {
                    font-weight: 600;
                    margin-bottom: 4px;
                    color: var(--foreground);
                }

                .metric-value {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--primary-color);
                }

                .legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    padding: 8px;
                    background: var(--vscode-sideBar-background);
                    border-radius: 4px;
                    margin-bottom: 12px;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                }

                .legend-color {
                    width: 12px;
                    height: 12px;
                    border-radius: 2px;
                }
            </style>
        </head>
        <body>
            <div id="app">
                <!-- Navigation Tabs -->
                <div class="tab-container">
                    <div class="tab-header">
                        <button class="tab-button active" data-tab="call-graph">📊 Call Graph</button>
                        <button class="tab-button" data-tab="variable-trace">🔍 Variable Trace</button>
                        <button class="tab-button" data-tab="what-if">🎯 What-If Analysis</button>
                        <button class="tab-button" data-tab="side-effects">⚠️ Side Effects</button>
                        <button class="tab-button" data-tab="timeline">⏱️ Timeline</button>
                    </div>
                    
                    <!-- Control Panel -->
                    <div class="controls">
                        <button id="play-btn" class="control-btn">▶️ Play</button>
                        <button id="pause-btn" class="control-btn">⏸️ Pause</button>
                        <button id="reset-btn" class="control-btn">🔄 Reset</button>
                        <button id="export-btn" class="control-btn">💾 Export</button>
                        
                        <div class="speed-control">
                            <label for="speed-slider">Speed:</label>
                            <input type="range" id="speed-slider" min="0.1" max="2" step="0.1" value="1">
                            <span id="speed-value">1x</span>
                        </div>
                    </div>
                </div>

                <!-- Current File Context -->
                <div id="current-file-header" class="file-header" style="display: none;">
                    <div class="file-icon" id="file-icon">JS</div>
                    <span id="file-name">No file selected</span>
                    <span class="file-path" id="file-path"></span>
                    <button class="source-link" id="jump-to-source">📍 Jump to Source</button>
                </div>

                <!-- Tab Content -->
                <div class="tab-content">
                    <!-- Call Graph Tab -->
                    <div id="call-graph" class="tab-pane active">
                        <div class="breadcrumb" id="call-graph-breadcrumb">
                            Call Graph <span class="breadcrumb-separator">›</span> <span id="cg-current-file">Select a file to analyze</span>
                        </div>
                        <div class="legend">
                            <div class="legend-item">
                                <div class="legend-color" style="background: var(--primary-color);"></div>
                                <span>Function Calls</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background: var(--success-color);"></div>
                                <span>Entry Points</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background: var(--warning-color);"></div>
                                <span>Side Effects</span>
                            </div>
                        </div>
                        <div class="visualization-container">
                            <div id="call-graph-viz" class="visualization">
                                <div class="placeholder">Select a function or start debugging to view call graph</div>
                            </div>
                            <div class="info-panel">
                                <h3>📊 Call Graph Information</h3>
                                <div id="call-graph-info">
                                    <div class="metric-card">
                                        <div class="metric-title">Total Functions</div>
                                        <div class="metric-value" id="total-functions">0</div>
                                    </div>
                                    <div class="metric-card">
                                        <div class="metric-title">Call Depth</div>
                                        <div class="metric-value" id="call-depth">0</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Variable Trace Tab -->
                    <div id="variable-trace" class="tab-pane">
                        <div class="breadcrumb" id="variable-trace-breadcrumb">
                            Variable Trace <span class="breadcrumb-separator">›</span> <span id="vt-current-file">Select a variable to trace</span>
                        </div>
                        <div class="visualization-container">
                            <div class="variable-controls">
                                <input type="text" id="variable-filter" placeholder="🔍 Filter variables...">
                                <select id="variable-scope">
                                    <option value="all">All Scopes</option>
                                    <option value="global">Global</option>
                                    <option value="local">Local</option>
                                    <option value="parameter">Parameters</option>
                                </select>
                            </div>
                            <div id="variable-trace-viz" class="visualization">
                                <div class="placeholder">Start debugging or select a variable to trace its lifecycle</div>
                            </div>
                            <div class="info-panel">
                                <h3>🔍 Variable Information</h3>
                                <div id="variable-info">
                                    <div class="metric-card">
                                        <div class="metric-title">Tracked Variables</div>
                                        <div class="metric-value" id="tracked-variables">0</div>
                                    </div>
                                    <div class="metric-card">
                                        <div class="metric-title">State Changes</div>
                                        <div class="metric-value" id="state-changes">0</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- What-If Analysis Tab -->
                    <div id="what-if" class="tab-pane">
                        <div class="breadcrumb" id="what-if-breadcrumb">
                            What-If Analysis <span class="breadcrumb-separator">›</span> <span id="wi-current-file">Configure scenario parameters</span>
                        </div>
                        <div class="visualization-container">
                            <div class="what-if-controls">
                                <h3>🎯 Scenario Configuration</h3>
                                <div class="file-header">
                                    <div class="file-icon">📝</div>
                                    <span>Mock Input Configuration</span>
                                    <button class="source-link" onclick="loadTemplateInputs()">📋 Load Template</button>
                                </div>
                                <textarea id="mock-inputs" placeholder='{"variable1": "newValue", "parameter2": 42}'></textarea>
                                <button id="run-scenario" class="control-btn">🚀 Run Scenario</button>
                            </div>
                            <div id="what-if-viz" class="visualization">
                                <div class="placeholder">Configure mock inputs and run a scenario to see potential outcomes</div>
                            </div>
                            <div class="info-panel">
                                <h3>🎯 Analysis Results</h3>
                                <div id="what-if-info">
                                    <div class="metric-card">
                                        <div class="metric-title">Scenarios Run</div>
                                        <div class="metric-value" id="scenarios-run">0</div>
                                    </div>
                                    <div class="metric-card">
                                        <div class="metric-title">Execution Time</div>
                                        <div class="metric-value" id="execution-time">0ms</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Side Effects Tab -->
                    <div id="side-effects" class="tab-pane">
                        <div class="breadcrumb" id="side-effects-breadcrumb">
                            Side Effects <span class="breadcrumb-separator">›</span> <span id="se-current-file">Monitor code side effects</span>
                        </div>
                        <div class="legend">
                            <div class="legend-item">
                                <div class="legend-color" style="background: var(--error-color);"></div>
                                <span>Critical</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background: var(--warning-color);"></div>
                                <span>High Impact</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background: var(--secondary-color);"></div>
                                <span>Medium Impact</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background: var(--success-color);"></div>
                                <span>Low Impact</span>
                            </div>
                        </div>
                        <div class="visualization-container">
                            <div class="side-effects-controls">
                                <select id="effect-type-filter">
                                    <option value="all">All Types</option>
                                    <option value="io">💾 I/O Operations</option>
                                    <option value="network">🌐 Network Calls</option>
                                    <option value="database">🗄️ Database Access</option>
                                    <option value="file">📁 File Operations</option>
                                    <option value="console">🖥️ Console Output</option>
                                </select>
                                <select id="impact-filter">
                                    <option value="all">All Impact Levels</option>
                                    <option value="critical">🔴 Critical</option>
                                    <option value="high">🟠 High</option>
                                    <option value="medium">🟡 Medium</option>
                                    <option value="low">🟢 Low</option>
                                </select>
                            </div>
                            <div id="side-effects-viz" class="visualization">
                                <div class="placeholder">Start debugging to monitor side effects in real-time</div>
                            </div>
                            <div class="info-panel">
                                <h3>⚠️ Side Effect Details</h3>
                                <div id="side-effects-info">
                                    <div class="metric-card">
                                        <div class="metric-title">Total Effects</div>
                                        <div class="metric-value" id="total-effects">0</div>
                                    </div>
                                    <div class="metric-card">
                                        <div class="metric-title">Critical Issues</div>
                                        <div class="metric-value" id="critical-effects" style="color: var(--error-color);">0</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Timeline Tab -->
                    <div id="timeline" class="tab-pane">
                        <div class="breadcrumb" id="timeline-breadcrumb">
                            Execution Timeline <span class="breadcrumb-separator">›</span> <span id="tl-current-file">View execution flow over time</span>
                        </div>
                        <div class="visualization-container">
                            <div id="timeline-viz" class="visualization">
                                <div class="placeholder">Start debugging to view execution timeline</div>
                            </div>
                            <div class="info-panel">
                                <h3>⏱️ Timeline Information</h3>
                                <div id="timeline-info">
                                    <div class="metric-card">
                                        <div class="metric-title">Total Duration</div>
                                        <div class="metric-value" id="total-duration">0ms</div>
                                    </div>
                                    <div class="metric-card">
                                        <div class="metric-title">Events Logged</div>
                                        <div class="metric-value" id="events-logged">0</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Status Bar -->
                <div class="status-bar">
                    <span id="status-text">🟢 Ready</span>
                    <span id="debug-status"></span>
                    <span id="file-context"></span>
                </div>

                <!-- Tooltip for hover information -->
                <div id="tooltip" class="tooltip" style="display: none;"></div>
            </div>

            <script nonce="${nonce}" src="https://d3js.org/d3.v7.min.js"></script>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
