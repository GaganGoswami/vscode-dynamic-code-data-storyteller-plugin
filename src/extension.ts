import * as vscode from 'vscode';
import { VariableTracker } from './VariableTracker';
import { CallGraphBuilder } from './CallGraphBuilder';
import { WhatIfEngine } from './WhatIfEngine';
import { SideEffectDetector } from './SideEffectDetector';
import { VisualizationPanel } from './webview/VisualizationPanel';

/**
 * Main extension entry point
 * Activates the Dynamic Code & Data Storyteller extension
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Dynamic Code & Data Storyteller extension is now active!');

    // Initialize core components
    const variableTracker = new VariableTracker();
    const callGraphBuilder = new CallGraphBuilder();
    const whatIfEngine = new WhatIfEngine();
    const sideEffectDetector = new SideEffectDetector();
    let visualizationPanel: VisualizationPanel | undefined;

    // Register commands
    const traceVariableCommand = vscode.commands.registerCommand(
        'storyteller.traceVariable',
        async () => {
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
                await variableTracker.startTracking(selectedText, editor.document);
                vscode.window.showInformationMessage(`Started tracing variable: ${selectedText}`);
                
                // Open visualization panel if not already open
                visualizationPanel = VisualizationPanel.createOrShow(context.extensionUri);
                visualizationPanel.show();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to trace variable: ${error}`);
            }
        }
    );

    const showCallGraphCommand = vscode.commands.registerCommand(
        'storyteller.showCallGraph',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }

            try {
                const callGraph = await callGraphBuilder.buildCallGraph(editor.document);
                
                visualizationPanel = VisualizationPanel.createOrShow(context.extensionUri);
                visualizationPanel.show();
                visualizationPanel.updateCallGraph(callGraph);
                vscode.window.showInformationMessage('Call graph generated successfully');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to generate call graph: ${error}`);
            }
        }
    );

    const whatIfAnalysisCommand = vscode.commands.registerCommand(
        'storyteller.whatIfAnalysis',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }

            // Get input from user for what-if scenario
            const input = await vscode.window.showInputBox({
                prompt: 'Enter mock input values (JSON format)',
                placeHolder: '{"param1": "value1", "param2": 42}'
            });

            if (!input) {
                return;
            }

            try {
                const mockInput = JSON.parse(input);
                const analysis = await whatIfEngine.runAnalysis(editor.document, mockInput);
                
                visualizationPanel = VisualizationPanel.createOrShow(context.extensionUri);
                visualizationPanel.show();
                visualizationPanel.updateWhatIfAnalysis(analysis);
                vscode.window.showInformationMessage('What-if analysis completed');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to run what-if analysis: ${error}`);
            }
        }
    );

    const openVisualizationCommand = vscode.commands.registerCommand(
        'storyteller.openVisualization',
        () => {
            VisualizationPanel.createOrShow(context.extensionUri);
        }
    );

    // Register debug session listeners
    const debugSessionStartListener = vscode.debug.onDidStartDebugSession((session) => {
        console.log(`Debug session started: ${session.name}`);
        
        // Start tracking variables and side effects during debugging
        variableTracker.attachToDebugSession(session);
        sideEffectDetector.attachToDebugSession(session);
        callGraphBuilder.attachToDebugSession(session);
        
        // Update visualization with real-time data
        if (visualizationPanel) {
            visualizationPanel.onDebugSessionStart(session);
        }
    });

    const debugSessionTerminateListener = vscode.debug.onDidTerminateDebugSession((session) => {
        console.log(`Debug session terminated: ${session.name}`);
        
        variableTracker.detachFromDebugSession(session);
        sideEffectDetector.detachFromDebugSession(session);
        callGraphBuilder.detachFromDebugSession(session);
        
        if (visualizationPanel) {
            visualizationPanel.onDebugSessionEnd(session);
        }
    });

    // Register debug adapter tracker factory
    const debugAdapterTrackerFactory = vscode.debug.registerDebugAdapterTrackerFactory('*', {
        createDebugAdapterTracker(session: vscode.DebugSession) {
            return {
                onWillReceiveMessage: (message: any) => {
                    // Track incoming debug adapter protocol messages
                    variableTracker.handleDebugMessage(message);
                    callGraphBuilder.handleDebugMessage(message);
                    sideEffectDetector.handleDebugMessage(message);
                },
                onDidSendMessage: (message: any) => {
                    // Track outgoing debug adapter protocol messages
                    if (visualizationPanel) {
                        visualizationPanel.handleDebugMessage(message);
                    }
                }
            };
        }
    });

    // Add all disposables to context
    context.subscriptions.push(
        traceVariableCommand,
        showCallGraphCommand,
        whatIfAnalysisCommand,
        openVisualizationCommand,
        debugSessionStartListener,
        debugSessionTerminateListener,
        debugAdapterTrackerFactory
    );
}

/**
 * Extension deactivation
 */
export function deactivate() {
    console.log('Dynamic Code & Data Storyteller extension deactivated');
}
