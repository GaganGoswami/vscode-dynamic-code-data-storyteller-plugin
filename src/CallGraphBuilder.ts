import * as vscode from 'vscode';

export interface FunctionCall {
    id: string;
    functionName: string;
    parameters: any[];
    returnValue?: any;
    startTime: number;
    endTime?: number;
    duration?: number;
    location: vscode.Position;
    callerFunction?: string;
    callDepth: number;
}

export interface CallGraphNode {
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

export interface CallGraph {
    rootNodes: CallGraphNode[];
    allCalls: FunctionCall[];
    metadata: {
        totalFunctions: number;
        totalCalls: number;
        maxDepth: number;
        analysisTime: number;
    };
}

/**
 * Builds and manages call graphs with execution metadata
 */
export class CallGraphBuilder {
    private activeCalls: Map<string, FunctionCall> = new Map();
    private completedCalls: FunctionCall[] = [];
    private debugSessions: Set<vscode.DebugSession> = new Set();
    private callCounter = 0;

    /**
     * Build a call graph from a document using static analysis
     */
    async buildCallGraph(document: vscode.TextDocument): Promise<CallGraph> {
        const startTime = Date.now();
        console.log('Building call graph for document:', document.fileName);

        const rootNodes: CallGraphNode[] = [];
        const allCalls: FunctionCall[] = [];

        try {
            // Parse the document to find function definitions and calls
            const functions = await this.extractFunctions(document);
            const calls = await this.extractFunctionCalls(document);

            // Build the graph structure
            const nodeMap = new Map<string, CallGraphNode>();

            // Create nodes for each function
            for (const func of functions) {
                const node: CallGraphNode = {
                    id: func.name,
                    name: func.name,
                    location: func.location,
                    calls: [],
                    childNodes: [],
                    metadata: {
                        totalCalls: 0,
                        averageDuration: 0,
                        minDuration: Infinity,
                        maxDuration: 0
                    }
                };
                nodeMap.set(func.name, node);
            }

            // Connect function calls to create graph edges
            for (const call of calls) {
                const callerNode = nodeMap.get(call.callerFunction || 'main');
                const calleeNode = nodeMap.get(call.functionName);

                if (callerNode && calleeNode) {
                    callerNode.calls.push(call);
                    callerNode.childNodes.push(calleeNode);
                    calleeNode.parentNode = callerNode;
                    allCalls.push(call);
                }
            }

            // Identify root nodes (functions with no parents)
            for (const [, node] of nodeMap) {
                if (!node.parentNode) {
                    rootNodes.push(node);
                }
            }

            const analysisTime = Date.now() - startTime;

            return {
                rootNodes,
                allCalls,
                metadata: {
                    totalFunctions: nodeMap.size,
                    totalCalls: allCalls.length,
                    maxDepth: this.calculateMaxDepth(rootNodes),
                    analysisTime
                }
            };
        } catch (error) {
            console.error('Error building call graph:', error);
            throw error;
        }
    }

    /**
     * Attach to a debug session to track function calls in real-time
     */
    attachToDebugSession(session: vscode.DebugSession): void {
        this.debugSessions.add(session);
        console.log(`Attached call graph builder to debug session: ${session.name}`);
    }

    /**
     * Detach from a debug session
     */
    detachFromDebugSession(session: vscode.DebugSession): void {
        this.debugSessions.delete(session);
        console.log(`Detached call graph builder from debug session: ${session.name}`);
    }

    /**
     * Handle debug adapter protocol messages to track function calls
     */
    handleDebugMessage(message: any): void {
        if (message.type === 'event') {
            switch (message.event) {
                case 'stopped':
                    this.onDebugStopped(message.body);
                    break;
                case 'continued':
                    this.onDebugContinued(message.body);
                    break;
            }
        } else if (message.type === 'response' && message.command === 'stackTrace') {
            this.processStackTrace(message.body);
        }
    }

    /**
     * Get the current call graph with real-time data
     */
    getCurrentCallGraph(): CallGraph {
        const rootNodes: CallGraphNode[] = [];
        const allCalls = [...this.completedCalls, ...Array.from(this.activeCalls.values())];

        // Build graph from completed and active calls
        const nodeMap = new Map<string, CallGraphNode>();

        for (const call of allCalls) {
            if (!nodeMap.has(call.functionName)) {
                nodeMap.set(call.functionName, {
                    id: call.functionName,
                    name: call.functionName,
                    location: call.location,
                    calls: [],
                    childNodes: [],
                    metadata: {
                        totalCalls: 0,
                        averageDuration: 0,
                        minDuration: Infinity,
                        maxDuration: 0
                    }
                });
            }

            const node = nodeMap.get(call.functionName)!;
            node.calls.push(call);
            node.metadata.totalCalls++;

            if (call.duration !== undefined) {
                node.metadata.minDuration = Math.min(node.metadata.minDuration, call.duration);
                node.metadata.maxDuration = Math.max(node.metadata.maxDuration, call.duration);
            }
        }

        // Calculate average durations
        for (const [, node] of nodeMap) {
            const durations = node.calls
                .filter(call => call.duration !== undefined)
                .map(call => call.duration!);
            
            if (durations.length > 0) {
                node.metadata.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            }
        }

        // Find root nodes
        for (const [, node] of nodeMap) {
            const hasParent = allCalls.some(call => 
                call.functionName !== node.name && 
                node.calls.some(nodeCall => nodeCall.callerFunction === call.functionName)
            );
            
            if (!hasParent) {
                rootNodes.push(node);
            }
        }

        return {
            rootNodes,
            allCalls,
            metadata: {
                totalFunctions: nodeMap.size,
                totalCalls: allCalls.length,
                maxDepth: this.calculateMaxDepth(rootNodes),
                analysisTime: 0
            }
        };
    }

    /**
     * Extract function definitions from document
     */
    private async extractFunctions(document: vscode.TextDocument): Promise<Array<{name: string, location: vscode.Position}>> {
        const functions: Array<{name: string, location: vscode.Position}> = [];
        const text = document.getText();
        const language = document.languageId;

        // Different regex patterns for different languages
        let functionRegex: RegExp;
        
        switch (language) {
            case 'javascript':
            case 'typescript':
                functionRegex = /(?:function\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*(?:=\\s*(?:async\\s+)?(?:function|\\([^)]*\\)\\s*=>)|:\\s*(?:async\\s+)?(?:function|\\([^)]*\\)\\s*=>)))/g;
                break;
            case 'python':
                functionRegex = /def\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\(/g;
                break;
            case 'java':
            case 'cpp':
                functionRegex = /(?:public|private|protected|static)?\\s*(?:\\w+\\s+)*([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\(/g;
                break;
            default:
                functionRegex = /function\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        }

        const lines = text.split('\\n');
        
        for (let i = 0; i < lines.length; i++) {
            let match;
            functionRegex.lastIndex = 0;
            
            while ((match = functionRegex.exec(lines[i])) !== null) {
                const functionName = match[1] || match[2];
                if (functionName) {
                    functions.push({
                        name: functionName,
                        location: new vscode.Position(i, match.index)
                    });
                }
            }
        }

        return functions;
    }

    /**
     * Extract function calls from document
     */
    private async extractFunctionCalls(document: vscode.TextDocument): Promise<FunctionCall[]> {
        const calls: FunctionCall[] = [];
        const text = document.getText();
        const lines = text.split('\\n');

        // Simple regex to find function calls (can be enhanced with AST parsing)
        const callRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*\\(/g;

        for (let i = 0; i < lines.length; i++) {
            let match;
            callRegex.lastIndex = 0;
            
            while ((match = callRegex.exec(lines[i])) !== null) {
                const functionName = match[1];
                calls.push({
                    id: `call_${this.callCounter++}`,
                    functionName,
                    parameters: [],
                    startTime: Date.now(),
                    location: new vscode.Position(i, match.index),
                    callDepth: 0
                });
            }
        }

        return calls;
    }

    /**
     * Calculate maximum depth of call graph
     */
    private calculateMaxDepth(rootNodes: CallGraphNode[]): number {
        let maxDepth = 0;

        function traverse(node: CallGraphNode, depth: number): void {
            maxDepth = Math.max(maxDepth, depth);
            for (const child of node.childNodes) {
                traverse(child, depth + 1);
            }
        }

        for (const root of rootNodes) {
            traverse(root, 1);
        }

        return maxDepth;
    }

    /**
     * Handle debug stopped event
     */
    private onDebugStopped(body: any): void {
        // Record function entry/exit based on stack frames
        for (const session of this.debugSessions) {
            this.captureCallStack(session);
        }
    }

    /**
     * Handle debug continued event
     */
    private onDebugContinued(body: any): void {
        // Mark active calls as continuing
        const now = Date.now();
        for (const [, call] of this.activeCalls) {
            // Update call duration if it was temporarily stopped
        }
    }

    /**
     * Process stack trace response
     */
    private processStackTrace(body: any): void {
        if (!body.stackFrames) return;

        const frames = body.stackFrames;
        const now = Date.now();

        // Track function calls based on stack frames
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const functionName = frame.name || 'anonymous';
            const callId = `${functionName}_${frame.id}`;

            if (!this.activeCalls.has(callId)) {
                const call: FunctionCall = {
                    id: callId,
                    functionName,
                    parameters: [],
                    startTime: now,
                    location: new vscode.Position(frame.line - 1, frame.column || 0),
                    callDepth: i,
                    callerFunction: i < frames.length - 1 ? frames[i + 1].name : undefined
                };

                this.activeCalls.set(callId, call);
            }
        }
    }

    /**
     * Capture current call stack
     */
    private async captureCallStack(session: vscode.DebugSession): Promise<void> {
        try {
            const stackTrace = await session.customRequest('stackTrace', { threadId: 1 });
            this.processStackTrace(stackTrace);
        } catch (error) {
            console.error('Error capturing call stack:', error);
        }
    }

    /**
     * Clear all call tracking data
     */
    clearAll(): void {
        this.activeCalls.clear();
        this.completedCalls = [];
        this.callCounter = 0;
        console.log('Cleared all call graph data');
    }
}
