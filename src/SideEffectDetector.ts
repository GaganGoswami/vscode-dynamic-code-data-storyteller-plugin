import * as vscode from 'vscode';

export interface SideEffect {
    id: string;
    type: 'io' | 'network' | 'database' | 'file' | 'console' | 'memory' | 'process';
    description: string;
    timestamp: number;
    location?: vscode.Position;
    metadata: {
        functionName?: string;
        parameters?: any[];
        beforeState?: any;
        afterState?: any;
        impact: 'low' | 'medium' | 'high' | 'critical';
    };
}

export interface StateChange {
    id: string;
    variable: string;
    oldValue: any;
    newValue: any;
    timestamp: number;
    location: vscode.Position;
    cause: string;
}

export interface SideEffectSummary {
    totalEffects: number;
    effectsByType: Record<string, number>;
    highImpactEffects: SideEffect[];
    timeline: Array<{
        timestamp: number;
        effects: SideEffect[];
    }>;
    stateChanges: StateChange[];
}

/**
 * Detects and tracks side effects during code execution
 */
export class SideEffectDetector {
    private detectedEffects: SideEffect[] = [];
    private stateChanges: StateChange[] = [];
    private debugSessions: Set<vscode.DebugSession> = new Set();
    private effectCounter = 0;
    private stateChangeCounter = 0;
    private monitoringEnabled = true;

    /**
     * Start monitoring for side effects
     */
    startMonitoring(): void {
        this.monitoringEnabled = true;
        console.log('Side effect monitoring started');
    }

    /**
     * Stop monitoring for side effects
     */
    stopMonitoring(): void {
        this.monitoringEnabled = false;
        console.log('Side effect monitoring stopped');
    }

    /**
     * Attach to a debug session to monitor side effects
     */
    attachToDebugSession(session: vscode.DebugSession): void {
        this.debugSessions.add(session);
        console.log(`Attached side effect detector to debug session: ${session.name}`);
    }

    /**
     * Detach from a debug session
     */
    detachFromDebugSession(session: vscode.DebugSession): void {
        this.debugSessions.delete(session);
        console.log(`Detached side effect detector from debug session: ${session.name}`);
    }

    /**
     * Handle debug adapter protocol messages to detect side effects
     */
    handleDebugMessage(message: any): void {
        if (!this.monitoringEnabled) return;

        if (message.type === 'event') {
            switch (message.event) {
                case 'output':
                    this.detectConsoleOutput(message.body);
                    break;
                case 'breakpoint':
                    this.detectBreakpointHit(message.body);
                    break;
                case 'exited':
                    this.detectProcessExit(message.body);
                    break;
            }
        } else if (message.type === 'response') {
            switch (message.command) {
                case 'setVariable':
                    this.detectVariableChange(message.body);
                    break;
                case 'evaluate':
                    this.detectEvaluation(message.body);
                    break;
            }
        }
    }

    /**
     * Manually record a side effect
     */
    recordSideEffect(
        type: SideEffect['type'],
        description: string,
        location?: vscode.Position,
        metadata?: Partial<SideEffect['metadata']>
    ): void {
        const effect: SideEffect = {
            id: `effect_${this.effectCounter++}`,
            type,
            description,
            timestamp: Date.now(),
            location,
            metadata: {
                impact: 'medium',
                ...metadata
            }
        };

        this.detectedEffects.push(effect);
        console.log(`Recorded side effect: ${description}`);
    }

    /**
     * Record a state change
     */
    recordStateChange(
        variable: string,
        oldValue: any,
        newValue: any,
        location: vscode.Position,
        cause: string
    ): void {
        const change: StateChange = {
            id: `change_${this.stateChangeCounter++}`,
            variable,
            oldValue,
            newValue,
            timestamp: Date.now(),
            location,
            cause
        };

        this.stateChanges.push(change);
        console.log(`State change detected: ${variable} = ${oldValue} -> ${newValue}`);
    }

    /**
     * Get all detected side effects
     */
    getAllSideEffects(): SideEffect[] {
        return [...this.detectedEffects];
    }

    /**
     * Get side effects by type
     */
    getSideEffectsByType(type: SideEffect['type']): SideEffect[] {
        return this.detectedEffects.filter(effect => effect.type === type);
    }

    /**
     * Get high impact side effects
     */
    getHighImpactSideEffects(): SideEffect[] {
        return this.detectedEffects.filter(effect => 
            effect.metadata.impact === 'high' || effect.metadata.impact === 'critical'
        );
    }

    /**
     * Get side effect summary
     */
    getSummary(): SideEffectSummary {
        const effectsByType: Record<string, number> = {};
        
        for (const effect of this.detectedEffects) {
            effectsByType[effect.type] = (effectsByType[effect.type] || 0) + 1;
        }

        // Group effects by time intervals (e.g., every second)
        const timeline: Array<{timestamp: number, effects: SideEffect[]}> = [];
        const timeGroups = new Map<number, SideEffect[]>();

        for (const effect of this.detectedEffects) {
            const timeSlot = Math.floor(effect.timestamp / 1000) * 1000; // Group by second
            if (!timeGroups.has(timeSlot)) {
                timeGroups.set(timeSlot, []);
            }
            timeGroups.get(timeSlot)!.push(effect);
        }

        for (const [timestamp, effects] of timeGroups) {
            timeline.push({ timestamp, effects });
        }

        timeline.sort((a, b) => a.timestamp - b.timestamp);

        return {
            totalEffects: this.detectedEffects.length,
            effectsByType,
            highImpactEffects: this.getHighImpactSideEffects(),
            timeline,
            stateChanges: [...this.stateChanges]
        };
    }

    /**
     * Detect console output side effects
     */
    private detectConsoleOutput(body: any): void {
        if (body.output) {
            const impact = body.category === 'stderr' ? 'high' : 'low';
            
            this.recordSideEffect(
                'console',
                `Console output: ${body.output.trim()}`,
                undefined,
                {
                    impact,
                    parameters: [body.output]
                }
            );
        }
    }

    /**
     * Detect breakpoint hit effects
     */
    private detectBreakpointHit(body: any): void {
        this.recordSideEffect(
            'process',
            `Breakpoint hit at ${body.source?.path || 'unknown'}:${body.line}`,
            new vscode.Position(body.line - 1, body.column || 0),
            {
                impact: 'low',
                functionName: body.source?.name
            }
        );
    }

    /**
     * Detect process exit effects
     */
    private detectProcessExit(body: any): void {
        const impact = body.exitCode === 0 ? 'low' : 'high';
        
        this.recordSideEffect(
            'process',
            `Process exited with code: ${body.exitCode}`,
            undefined,
            {
                impact,
                parameters: [body.exitCode]
            }
        );
    }

    /**
     * Detect variable changes
     */
    private detectVariableChange(body: any): void {
        if (body.value !== undefined) {
            this.recordSideEffect(
                'memory',
                `Variable modified: ${body.name || 'unknown'} = ${body.value}`,
                undefined,
                {
                    impact: 'medium',
                    beforeState: body.previousValue,
                    afterState: body.value
                }
            );
        }
    }

    /**
     * Detect evaluation side effects
     */
    private detectEvaluation(body: any): void {
        if (body.result) {
            this.recordSideEffect(
                'memory',
                `Expression evaluated: ${body.expression || 'unknown'} = ${body.result}`,
                undefined,
                {
                    impact: 'low',
                    parameters: [body.expression, body.result]
                }
            );
        }
    }

    /**
     * Analyze code for potential side effects using static analysis
     */
    async analyzeCodeForSideEffects(document: vscode.TextDocument): Promise<SideEffect[]> {
        const potentialEffects: SideEffect[] = [];
        const text = document.getText();
        const lines = text.split('\\n');

        // Patterns for different types of side effects
        const patterns = {
            console: /console\\.(log|error|warn|info)\\s*\\(/g,
            file: /(fs\\.|readFile|writeFile|appendFile)\\s*\\(/g,
            network: /(fetch|axios|request|http\\.|https\\.)\\s*\\(/g,
            database: /(query|execute|insert|update|delete|select)\\s*\\(/g,
            process: /(process\\.|exit|spawn|exec)\\s*\\(/g
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            for (const [type, pattern] of Object.entries(patterns)) {
                let match;
                pattern.lastIndex = 0;
                
                while ((match = pattern.exec(line)) !== null) {
                    potentialEffects.push({
                        id: `static_${this.effectCounter++}`,
                        type: type as SideEffect['type'],
                        description: `Potential ${type} side effect: ${match[0]}`,
                        timestamp: Date.now(),
                        location: new vscode.Position(i, match.index),
                        metadata: {
                            impact: this.assessImpact(type),
                            functionName: this.extractFunctionName(line, match.index)
                        }
                    });
                }
            }
        }

        return potentialEffects;
    }

    /**
     * Assess the impact level of a side effect type
     */
    private assessImpact(type: string): SideEffect['metadata']['impact'] {
        switch (type) {
            case 'database':
            case 'file':
                return 'high';
            case 'network':
            case 'process':
                return 'medium';
            case 'console':
            case 'memory':
                return 'low';
            default:
                return 'medium';
        }
    }

    /**
     * Extract function name from line context
     */
    private extractFunctionName(line: string, position: number): string | undefined {
        // Simple heuristic to find the containing function
        const beforePosition = line.substring(0, position);
        const functionMatch = beforePosition.match(/function\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*=/);
        
        if (functionMatch) {
            return functionMatch[1] || functionMatch[2];
        }
        
        return undefined;
    }

    /**
     * Filter effects by time range
     */
    getEffectsInTimeRange(startTime: number, endTime: number): SideEffect[] {
        return this.detectedEffects.filter(effect => 
            effect.timestamp >= startTime && effect.timestamp <= endTime
        );
    }

    /**
     * Get effects by impact level
     */
    getEffectsByImpact(impact: SideEffect['metadata']['impact']): SideEffect[] {
        return this.detectedEffects.filter(effect => effect.metadata.impact === impact);
    }

    /**
     * Clear all detected side effects
     */
    clearAll(): void {
        this.detectedEffects = [];
        this.stateChanges = [];
        this.effectCounter = 0;
        this.stateChangeCounter = 0;
        console.log('Cleared all side effect data');
    }
}
