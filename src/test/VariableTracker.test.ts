import * as assert from 'assert';
import * as vscode from 'vscode';
import { VariableTracker } from '../VariableTracker';

suite('VariableTracker Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    let variableTracker: VariableTracker;

    setup(() => {
        variableTracker = new VariableTracker();
    });

    teardown(() => {
        variableTracker.clearAll();
    });

    test('Should start tracking a variable', async () => {
        const mockDocument = {
            getText: () => 'let myVariable = 42;\\nconst result = myVariable * 2;',
            languageId: 'javascript'
        } as vscode.TextDocument;

        await variableTracker.startTracking('myVariable', mockDocument);
        
        const history = variableTracker.getVariableHistory('myVariable');
        assert.strictEqual(history?.variable, 'myVariable');
        assert.ok(history?.metadata.firstSeen);
    });

    test('Should stop tracking a variable', () => {
        const mockDocument = {
            getText: () => 'let myVariable = 42;',
            languageId: 'javascript'
        } as vscode.TextDocument;

        variableTracker.startTracking('myVariable', mockDocument);
        variableTracker.stopTracking('myVariable');
        
        const history = variableTracker.getVariableHistory('myVariable');
        assert.strictEqual(history, undefined);
    });

    test('Should handle debug session attachment', () => {
        const mockSession = {
            id: 'test-session',
            name: 'Test Session',
            type: 'node'
        } as vscode.DebugSession;

        variableTracker.attachToDebugSession(mockSession);
        
        // Should not throw and session should be tracked
        assert.doesNotThrow(() => {
            variableTracker.detachFromDebugSession(mockSession);
        });
    });

    test('Should handle debug messages', () => {
        const mockMessage = {
            type: 'response',
            command: 'variables',
            body: {
                variables: [
                    { name: 'testVar', value: '42', type: 'number' }
                ]
            }
        };

        // Should not throw when handling debug messages
        assert.doesNotThrow(() => {
            variableTracker.handleDebugMessage(mockMessage);
        });
    });

    test('Should track multiple variables', async () => {
        const mockDocument = {
            getText: () => 'let var1 = 1;\\nlet var2 = 2;',
            languageId: 'javascript'
        } as vscode.TextDocument;

        await variableTracker.startTracking('var1', mockDocument);
        await variableTracker.startTracking('var2', mockDocument);
        
        const allVars = variableTracker.getAllTrackedVariables();
        assert.strictEqual(allVars.size, 2);
        assert.ok(allVars.has('var1'));
        assert.ok(allVars.has('var2'));
    });

    test('Should clear all tracking data', async () => {
        const mockDocument = {
            getText: () => 'let testVar = 123;',
            languageId: 'javascript'
        } as vscode.TextDocument;

        await variableTracker.startTracking('testVar', mockDocument);
        variableTracker.clearAll();
        
        const allVars = variableTracker.getAllTrackedVariables();
        assert.strictEqual(allVars.size, 0);
    });
});
