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
                    case 'filterData':
                        this.filterVisualizationData(message.filters);
                        return;
                    case 'exportData':
                        this.exportVisualizationData(message.format);
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
            data: callGraph
        });
    }

    public updateWhatIfAnalysis(analysis: WhatIfResult) {
        this.panel.webview.postMessage({
            command: 'updateWhatIfAnalysis',
            data: analysis
        });
    }

    public updateSideEffects(sideEffects: SideEffectSummary) {
        this.panel.webview.postMessage({
            command: 'updateSideEffects',
            data: sideEffects
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
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}' 'unsafe-eval'; img-src ${webview.cspSource} https:;">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleUri}" rel="stylesheet">
            <title>Code Storyteller</title>
        </head>
        <body>
            <div id="app">
                <!-- Navigation Tabs -->
                <div class="tab-container">
                    <div class="tab-header">
                        <button class="tab-button active" data-tab="call-graph">Call Graph</button>
                        <button class="tab-button" data-tab="variable-trace">Variable Trace</button>
                        <button class="tab-button" data-tab="what-if">What-If Analysis</button>
                        <button class="tab-button" data-tab="side-effects">Side Effects</button>
                        <button class="tab-button" data-tab="timeline">Timeline</button>
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

                <!-- Tab Content -->
                <div class="tab-content">
                    <!-- Call Graph Tab -->
                    <div id="call-graph" class="tab-pane active">
                        <div class="visualization-container">
                            <div id="call-graph-viz" class="visualization"></div>
                            <div class="info-panel">
                                <h3>Call Graph Information</h3>
                                <div id="call-graph-info"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Variable Trace Tab -->
                    <div id="variable-trace" class="tab-pane">
                        <div class="visualization-container">
                            <div class="variable-controls">
                                <input type="text" id="variable-filter" placeholder="Filter variables...">
                                <select id="variable-scope">
                                    <option value="all">All Scopes</option>
                                    <option value="global">Global</option>
                                    <option value="local">Local</option>
                                </select>
                            </div>
                            <div id="variable-trace-viz" class="visualization"></div>
                            <div class="info-panel">
                                <h3>Variable Information</h3>
                                <div id="variable-info"></div>
                            </div>
                        </div>
                    </div>

                    <!-- What-If Analysis Tab -->
                    <div id="what-if" class="tab-pane">
                        <div class="visualization-container">
                            <div class="what-if-controls">
                                <h3>Scenario Configuration</h3>
                                <textarea id="mock-inputs" placeholder="Enter mock inputs (JSON format)"></textarea>
                                <button id="run-scenario">Run Scenario</button>
                            </div>
                            <div id="what-if-viz" class="visualization"></div>
                            <div class="info-panel">
                                <h3>Analysis Results</h3>
                                <div id="what-if-info"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Side Effects Tab -->
                    <div id="side-effects" class="tab-pane">
                        <div class="visualization-container">
                            <div class="side-effects-controls">
                                <select id="effect-type-filter">
                                    <option value="all">All Types</option>
                                    <option value="io">I/O</option>
                                    <option value="network">Network</option>
                                    <option value="database">Database</option>
                                    <option value="file">File</option>
                                    <option value="console">Console</option>
                                </select>
                                <select id="impact-filter">
                                    <option value="all">All Impact Levels</option>
                                    <option value="critical">Critical</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                            <div id="side-effects-viz" class="visualization"></div>
                            <div class="info-panel">
                                <h3>Side Effect Details</h3>
                                <div id="side-effects-info"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Timeline Tab -->
                    <div id="timeline" class="tab-pane">
                        <div class="visualization-container">
                            <div id="timeline-viz" class="visualization"></div>
                            <div class="info-panel">
                                <h3>Timeline Information</h3>
                                <div id="timeline-info"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Status Bar -->
                <div class="status-bar">
                    <span id="status-text">Ready</span>
                    <span id="debug-status"></span>
                </div>
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
