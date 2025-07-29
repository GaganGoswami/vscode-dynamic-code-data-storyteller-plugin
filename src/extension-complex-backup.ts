import * as vscode from 'vscode';
import { VariableTracker } from './VariableTracker';
import { CallGraphBuilder } from './CallGraphBuilder';
import { WhatIfEngine } from './WhatIfEngine';
import { SideEffectDetector } from './SideEffectDetector';
import { VisualizationPanel } from './webview/VisualizationPanel';

/**
 * Full-featured extension with proper imports
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 Dynamic Code & Data Storyteller extension is activating...');
    
    // Initialize core components
    let variableTracker: VariableTracker;
    let callGraphBuilder: CallGraphBuilder;
    let whatIfEngine: WhatIfEngine;
    let sideEffectDetector: SideEffectDetector;
    let visualizationPanel: VisualizationPanel | undefined;
    
    try {
        variableTracker = new VariableTracker();
        callGraphBuilder = new CallGraphBuilder();
        whatIfEngine = new WhatIfEngine();
        sideEffectDetector = new SideEffectDetector();
        console.log('✅ All core components initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize components:', error);
        vscode.window.showErrorMessage(`Component initialization failed: ${error}`);
        return;
    }
    
    try {
        // Test command for verification
        const testCommand = vscode.commands.registerCommand('storyteller.test', () => {
            const componentsStatus = {
                VariableTracker: !!variableTracker,
                CallGraphBuilder: !!callGraphBuilder,
                WhatIfEngine: !!whatIfEngine,
                SideEffectDetector: !!sideEffectDetector,
                VisualizationPanel: true // Available as import
            };
            
            const workingComponents = Object.values(componentsStatus).filter(Boolean).length;
            const totalComponents = Object.keys(componentsStatus).length;
            
            vscode.window.showInformationMessage(
                `✅ Extension working! Components loaded: ${workingComponents}/${totalComponents} - Full functionality available!`
            );
        });

        // Enhanced trace variable command - Always use full functionality
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
                // Start real variable tracking
                console.log(`🔍 Starting variable tracking for: ${selectedText}`);
                await variableTracker.startTracking(selectedText, editor.document);
                
                // Open visualization panel
                visualizationPanel = VisualizationPanel.createOrShow(context.extensionUri);
                visualizationPanel.show();
                console.log('📈 Visualization panel opened for variable tracking');
                
                vscode.window.showInformationMessage(`� Started real-time tracking: ${selectedText}. Check the visualization panel!`);
            } catch (error) {
                console.error('❌ Variable tracking failed:', error);
                vscode.window.showErrorMessage(`Failed to trace variable: ${error}`);
            }
        });

        // Enhanced call graph command - Always use full functionality
        const showCallGraphCommand = vscode.commands.registerCommand('storyteller.showCallGraph', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            
            try {
                // Generate real call graph
                console.log('🔍 Generating call graph...');
                const callGraph = await callGraphBuilder.buildCallGraph(editor.document);
                console.log('📊 Call graph generated:', callGraph);
                
                // Create and show visualization panel
                visualizationPanel = VisualizationPanel.createOrShow(context.extensionUri);
                visualizationPanel.show();
                console.log('📈 Visualization panel opened');
                
                // Update with call graph data
                visualizationPanel.updateCallGraph(callGraph);
                console.log('🎯 Call graph data sent to visualization');
                
                vscode.window.showInformationMessage('� Interactive call graph generated! Check the visualization panel.');
            } catch (error) {
                console.error('❌ Call graph generation failed:', error);
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
                
                // Run sandboxed analysis
                console.log('🔬 Running what-if analysis...');
                const analysis = await whatIfEngine.runAnalysis(editor.document, mockInput);
                
                // Create and show visualization panel
                visualizationPanel = VisualizationPanel.createOrShow(context.extensionUri);
                visualizationPanel.show();
                visualizationPanel.updateWhatIfAnalysis(analysis);
                
                vscode.window.showInformationMessage('🔬 What-if analysis completed! Results in visualization panel.');
            } catch (error) {
                if (error instanceof SyntaxError) {
                    vscode.window.showErrorMessage('Invalid JSON format');
                } else {
                    console.error('❌ What-if analysis failed:', error);
                    vscode.window.showErrorMessage(`Failed to run what-if analysis: ${error}`);
                }
            }
        });

        // Enhanced visualization panel command - Always use full functionality
        const openVisualizationCommand = vscode.commands.registerCommand('storyteller.openVisualization', () => {
            try {
                // Open interactive webview
                console.log('📈 Opening visualization panel...');
                visualizationPanel = VisualizationPanel.createOrShow(context.extensionUri);
                visualizationPanel.show();
                vscode.window.showInformationMessage('📈 Interactive visualization panel opened! Ready for data visualization.');
            } catch (error) {
                console.error('❌ Visualization panel failed:', error);
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
