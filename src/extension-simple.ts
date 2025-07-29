import * as vscode from 'vscode';

/**
 * Simplified extension entry point for debugging command registration issues
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 Dynamic Code & Data Storyteller extension is activating...');
    
    try {
        // Test command registration with minimal dependencies
        const testCommand = vscode.commands.registerCommand('storyteller.test', () => {
            vscode.window.showInformationMessage('Extension is working! 🎉');
        });

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
            
            vscode.window.showInformationMessage(`✅ Started tracing variable: ${selectedText}`);
        });

        const showCallGraphCommand = vscode.commands.registerCommand('storyteller.showCallGraph', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            
            vscode.window.showInformationMessage('📊 Call graph feature activated (simplified version)');
        });

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
                JSON.parse(input); // Validate JSON
                vscode.window.showInformationMessage(`🔬 What-if analysis started with: ${input}`);
            } catch (error) {
                vscode.window.showErrorMessage('Invalid JSON format');
            }
        });

        const openVisualizationCommand = vscode.commands.registerCommand('storyteller.openVisualization', () => {
            vscode.window.showInformationMessage('📈 Visualization panel opened (simplified version)');
        });

        // Register all commands
        context.subscriptions.push(
            testCommand,
            traceVariableCommand,
            showCallGraphCommand,
            whatIfAnalysisCommand,
            openVisualizationCommand
        );

        console.log('✅ All commands registered successfully');
        vscode.window.showInformationMessage('Dynamic Code Storyteller: Ready! 🚀');
        
    } catch (error) {
        console.error('❌ Error during extension activation:', error);
        vscode.window.showErrorMessage(`Extension activation failed: ${error}`);
    }
}

export function deactivate() {
    console.log('👋 Dynamic Code & Data Storyteller extension deactivated');
}
