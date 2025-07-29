import * as vscode from 'vscode';

export interface VariableState {
    name: string;
    value: any;
    type: string;
    timestamp: number;
    location: vscode.Position;
    scope: string;
}

export interface VariableHistory {
    variable: string;
    states: VariableState[];
    metadata: {
        firstSeen: number;
        lastUpdated: number;
        updateCount: number;
    };
}

/**
 * Tracks variable lifecycle and state changes during code execution
 */
export class VariableTracker {
    private trackedVariables: Map<string, VariableHistory> = new Map();
    private debugSessions: Set<vscode.DebugSession> = new Set();
    private readonly maxHistoryLength = 1000;

    /**
     * Start tracking a specific variable
     */
    async startTracking(variableName: string, document: vscode.TextDocument): Promise<void> {
        console.log(`Starting to track variable: ${variableName}`);
        
        if (!this.trackedVariables.has(variableName)) {
            this.trackedVariables.set(variableName, {
                variable: variableName,
                states: [],
                metadata: {
                    firstSeen: Date.now(),
                    lastUpdated: Date.now(),
                    updateCount: 0
                }
            });
        }

        // Analyze the document to find variable declarations and usage
        await this.analyzeVariableInDocument(variableName, document);
    }

    /**
     * Stop tracking a variable
     */
    stopTracking(variableName: string): void {
        this.trackedVariables.delete(variableName);
        console.log(`Stopped tracking variable: ${variableName}`);
    }

    /**
     * Get the history of a tracked variable
     */
    getVariableHistory(variableName: string): VariableHistory | undefined {
        return this.trackedVariables.get(variableName);
    }

    /**
     * Get all currently tracked variables
     */
    getAllTrackedVariables(): Map<string, VariableHistory> {
        return new Map(this.trackedVariables);
    }

    /**
     * Attach to a debug session to track variables in real-time
     */
    attachToDebugSession(session: vscode.DebugSession): void {
        this.debugSessions.add(session);
        console.log(`Attached variable tracker to debug session: ${session.name}`);
    }

    /**
     * Detach from a debug session
     */
    detachFromDebugSession(session: vscode.DebugSession): void {
        this.debugSessions.delete(session);
        console.log(`Detached variable tracker from debug session: ${session.name}`);
    }

    /**
     * Handle debug adapter protocol messages to track variable changes
     */
    handleDebugMessage(message: any): void {
        if (message.type === 'response' && message.command === 'variables') {
            this.processVariablesResponse(message.body);
        } else if (message.type === 'event' && message.event === 'stopped') {
            this.onDebugStopped(message.body);
        }
    }

    /**
     * Analyze a document to find variable declarations and usage
     */
    private async analyzeVariableInDocument(variableName: string, document: vscode.TextDocument): Promise<void> {
        const text = document.getText();
        const lines = text.split('\\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const regex = new RegExp(`\\\\b${variableName}\\\\b`, 'g');
            let match;
            
            while ((match = regex.exec(line)) !== null) {
                const position = new vscode.Position(i, match.index);
                this.recordVariableUsage(variableName, position, 'static-analysis');
            }
        }
    }

    /**
     * Process variables response from debug adapter
     */
    private processVariablesResponse(body: any): void {
        if (!body.variables) return;

        for (const variable of body.variables) {
            const variableName = variable.name;
            
            if (this.trackedVariables.has(variableName)) {
                this.updateVariableState(variableName, {
                    name: variableName,
                    value: variable.value,
                    type: variable.type || 'unknown',
                    timestamp: Date.now(),
                    location: new vscode.Position(0, 0), // Will be updated with actual location
                    scope: 'debug-session'
                });
            }
        }
    }

    /**
     * Handle debug session stopped event
     */
    private onDebugStopped(body: any): void {
        // Request variables for all active debug sessions
        for (const session of this.debugSessions) {
            this.requestVariables(session);
        }
    }

    /**
     * Request variables from debug session
     */
    private async requestVariables(session: vscode.DebugSession): Promise<void> {
        try {
            // Get stack frames
            const stackTrace = await session.customRequest('stackTrace', { threadId: 1 });
            
            if (stackTrace.stackFrames && stackTrace.stackFrames.length > 0) {
                const frameId = stackTrace.stackFrames[0].id;
                
                // Get scopes for the top frame
                const scopes = await session.customRequest('scopes', { frameId });
                
                for (const scope of scopes.scopes) {
                    // Get variables for each scope
                    await session.customRequest('variables', { variablesReference: scope.variablesReference });
                }
            }
        } catch (error) {
            console.error('Error requesting variables:', error);
        }
    }

    /**
     * Record variable usage at a specific location
     */
    private recordVariableUsage(variableName: string, location: vscode.Position, scope: string): void {
        const history = this.trackedVariables.get(variableName);
        if (!history) return;

        const state: VariableState = {
            name: variableName,
            value: 'unknown',
            type: 'unknown',
            timestamp: Date.now(),
            location,
            scope
        };

        this.updateVariableState(variableName, state);
    }

    /**
     * Update the state of a tracked variable
     */
    private updateVariableState(variableName: string, newState: VariableState): void {
        const history = this.trackedVariables.get(variableName);
        if (!history) return;

        history.states.push(newState);
        history.metadata.lastUpdated = Date.now();
        history.metadata.updateCount++;

        // Limit history length to prevent memory issues
        if (history.states.length > this.maxHistoryLength) {
            history.states = history.states.slice(-this.maxHistoryLength);
        }

        console.log(`Updated variable ${variableName} state:`, newState);
    }

    /**
     * Clear all tracking data
     */
    clearAll(): void {
        this.trackedVariables.clear();
        console.log('Cleared all variable tracking data');
    }
}
