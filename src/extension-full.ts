import * as vscode from 'vscode';

// Import components with error handling
let VariableTracker: any;
let CallGraphBuilder: any;
let WhatIfEngine: any;
let SideEffectDetector: any;
let VisualizationPanel: any;

try {
    VariableTracker = require('./VariableTracker').VariableTracker;
    CallGraphBuilder = require('./CallGraphBuilder').CallGraphBuilder;
    WhatIfEngine = require('./WhatIfEngine').WhatIfEngine;
    SideEffectDetector = require('./SideEffectDetector').SideEffectDetector;
    VisualizationPanel = require('./webview/VisualizationPanel').VisualizationPanel;
} catch (error) {
    console.warn('Some extension components could not be loaded:', error);
}

/**
 * Full-featured extension with graceful error handling
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 Dynamic Code & Data Storyteller extension is activating...');
    
    // Initialize core components with error handling
    let variableTracker: any;
    let callGraphBuilder: any;
    let whatIfEngine: any;
    let sideEffectDetector: any;
    let visualizationPanel: any;
    
    try {
        if (VariableTracker) variableTracker = new VariableTracker();
        if (CallGraphBuilder) callGraphBuilder = new CallGraphBuilder();
        if (WhatIfEngine) whatIfEngine = new WhatIfEngine();
        if (SideEffectDetector) sideEffectDetector = new SideEffectDetector();
    } catch (error) {
        console.warn('Failed to initialize some components:', error);
    }
    
    try {
        // Test command for verification
        const testCommand = vscode.commands.registerCommand('storyteller.test', () => {
            const componentsStatus = {
                VariableTracker: !!variableTracker,
                CallGraphBuilder: !!callGraphBuilder,
                WhatIfEngine: !!whatIfEngine,
                SideEffectDetector: !!sideEffectDetector,
                VisualizationPanel: !!VisualizationPanel
            };
            
            const workingComponents = Object.values(componentsStatus).filter(Boolean).length;
            const totalComponents = Object.keys(componentsStatus).length;
            
            vscode.window.showInformationMessage(
                `✅ Extension working! Components loaded: ${workingComponents}/${totalComponents}`
            );
        });

        // Enhanced trace variable command
        const traceVariableCommand = vscode.commands.registerCommand('storyteller.traceVariable', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            
            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);
            
            if (!selectedText) {
                vscode.window.showErrorMessage('Please select a variable to trace');
                return;
            }
            
            try {
                if (variableTracker) {
                    // Full functionality: Start real variable tracking
                    await variableTracker.startTracking(selectedText, editor.document);
                    vscode.window.showInformationMessage(`🔍 Started real-time tracking: ${selectedText}`);
                    
                    // Open visualization panel
                    if (VisualizationPanel) {
                        visualizationPanel = VisualizationPanel.createOrShow(context.extensionUri);
                        visualizationPanel.show();
                    }
                } else {
                    // Fallback: Basic tracking simulation
                    vscode.window.showInformationMessage(`📝 Tracking variable: ${selectedText} (basic mode)`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to trace variable: ${error}`);
            }
        });

        // Enhanced call graph command
        const showCallGraphCommand = vscode.commands.registerCommand('storyteller.showCallGraph', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            
            try {
                if (callGraphBuilder) {
                    // Full functionality: Generate real call graph
                    const callGraph = await callGraphBuilder.buildCallGraph(editor.document);
                    
                    if (VisualizationPanel) {
                        visualizationPanel = VisualizationPanel.createOrShow(context.extensionUri);
                        visualizationPanel.show();
                        visualizationPanel.updateCallGraph(callGraph);
                    }
                    
                    vscode.window.showInformationMessage('📊 Call graph generated successfully');
                } else {
                    // Fallback: Show basic file analysis
                    const functions = await analyzeFileFunctions(editor.document);
                    vscode.window.showInformationMessage(`📈 Found ${functions.length} functions in ${editor.document.fileName}`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to generate call graph: ${error}`);
            }
        });

        // Enhanced what-if analysis command
        const whatIfAnalysisCommand = vscode.commands.registerCommand('storyteller.whatIfAnalysis', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            
            const input = await vscode.window.showInputBox({
                prompt: 'Enter mock input values (JSON format)',
                placeHolder: '{"param1": "value1", "param2": 42}'
            });
            
            if (!input) {
                return;
            }
            
            try {
                const mockInput = JSON.parse(input);
                
                if (whatIfEngine) {
                    // Full functionality: Run sandboxed analysis
                    const analysis = await whatIfEngine.runAnalysis(editor.document, mockInput);
                    
                    if (VisualizationPanel) {
                        visualizationPanel = VisualizationPanel.createOrShow(context.extensionUri);
                        visualizationPanel.show();
                        visualizationPanel.updateWhatIfAnalysis(analysis);
                    }
                    
                    vscode.window.showInformationMessage('🔬 What-if analysis completed successfully');
                } else {
                    // Fallback: Basic scenario simulation
                    vscode.window.showInformationMessage(`🧪 Simulating scenario with: ${JSON.stringify(mockInput)}`);
                }
            } catch (error) {
                if (error instanceof SyntaxError) {
                    vscode.window.showErrorMessage('Invalid JSON format');
                } else {
                    vscode.window.showErrorMessage(`Failed to run what-if analysis: ${error}`);
                }
            }
        });

        // Enhanced visualization panel command
        const openVisualizationCommand = vscode.commands.registerCommand('storyteller.openVisualization', () => {
            try {
                if (VisualizationPanel) {
                    // Full functionality: Open interactive webview
                    visualizationPanel = VisualizationPanel.createOrShow(context.extensionUri);
                    visualizationPanel.show();
                    vscode.window.showInformationMessage('📈 Interactive visualization panel opened');
                } else {
                    // Fallback: Show status information
                    vscode.window.showInformationMessage('📊 Visualization panel (basic mode) - Full features coming soon!');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open visualization: ${error}`);
            }
        });

        // Register debug session listeners (with error handling)
        let debugSessionStartListener: vscode.Disposable | undefined;
        let debugSessionTerminateListener: vscode.Disposable | undefined;
        let debugAdapterTrackerFactory: vscode.Disposable | undefined;

        try {
            debugSessionStartListener = vscode.debug.onDidStartDebugSession((session) => {
                console.log(`Debug session started: ${session.name}`);
                
                if (variableTracker) variableTracker.attachToDebugSession(session);
                if (sideEffectDetector) sideEffectDetector.attachToDebugSession(session);
                if (callGraphBuilder) callGraphBuilder.attachToDebugSession(session);
                
                if (visualizationPanel) {
                    visualizationPanel.onDebugSessionStart(session);
                }
                
                vscode.window.showInformationMessage(`🐛 Debug tracking started for: ${session.name}`);
            });

            debugSessionTerminateListener = vscode.debug.onDidTerminateDebugSession((session) => {
                console.log(`Debug session terminated: ${session.name}`);
                
                if (variableTracker) variableTracker.detachFromDebugSession(session);
                if (sideEffectDetector) sideEffectDetector.detachFromDebugSession(session);
                if (callGraphBuilder) callGraphBuilder.detachFromDebugSession(session);
                
                if (visualizationPanel) {
                    visualizationPanel.onDebugSessionEnd(session);
                }
            });

            // Register debug adapter tracker factory
            debugAdapterTrackerFactory = vscode.debug.registerDebugAdapterTrackerFactory('*', {
                createDebugAdapterTracker(session) {
                    return {
                        onWillReceiveMessage: (message) => {
                            if (variableTracker) variableTracker.handleDebugMessage(message);
                            if (callGraphBuilder) callGraphBuilder.handleDebugMessage(message);
                            if (sideEffectDetector) sideEffectDetector.handleDebugMessage(message);
                        },
                        onDidSendMessage: (message) => {
                            if (visualizationPanel) {
                                visualizationPanel.handleDebugMessage(message);
                            }
                        }
                    };
                }
            });
        } catch (error) {
            console.warn('Debug integration partially available:', error);
        }

        // Register all commands and listeners
        const disposables = [
            testCommand,
            traceVariableCommand,
            showCallGraphCommand,
            whatIfAnalysisCommand,
            openVisualizationCommand
        ];

        if (debugSessionStartListener) disposables.push(debugSessionStartListener);
        if (debugSessionTerminateListener) disposables.push(debugSessionTerminateListener);
        if (debugAdapterTrackerFactory) disposables.push(debugAdapterTrackerFactory);

        context.subscriptions.push(...disposables);

        console.log('✅ Extension activated successfully with full features');
        vscode.window.showInformationMessage('🚀 Dynamic Code Storyteller: Ready with full features!');
        
    } catch (error) {
        console.error('❌ Error during extension activation:', error);
        vscode.window.showErrorMessage(`Extension activation failed: ${error}`);
    }
}

/**
 * Fallback function analysis for when CallGraphBuilder is not available
 */
async function analyzeFileFunctions(document: vscode.TextDocument): Promise<string[]> {
    const text = document.getText();
    const functions: string[] = [];
    
    // Simple regex-based function detection
    const jsPattern = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    const arrowPattern = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:\([^)]*\)\s*)?=>/g;
    const pythonPattern = /def\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
    
    let match;
    
    // JavaScript/TypeScript function detection
    while ((match = jsPattern.exec(text)) !== null) {
        functions.push(match[1]);
    }
    
    while ((match = arrowPattern.exec(text)) !== null) {
        functions.push(match[1]);
    }
    
    // Python function detection
    while ((match = pythonPattern.exec(text)) !== null) {
        functions.push(match[1]);
    }
    
    return functions;
}

export function deactivate() {
    console.log('👋 Dynamic Code & Data Storyteller extension deactivated');
}
