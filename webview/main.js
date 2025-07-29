// Get the VS Code API
const vscode = acquireVsCodeApi();

// Global state
let currentData = {
    callGraph: null,
    variableTrace: null,
    whatIfAnalysis: null,
    sideEffects: null,
    timeline: null
};

let animationState = {
    isPlaying: false,
    speed: 1,
    currentTime: 0,
    maxTime: 0
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeControls();
    initializeVisualizations();
    setupMessageHandling();
});

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update active tab pane
            tabPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');
            
            // Refresh visualization for the active tab
            refreshCurrentVisualization();
        });
    });
}

function initializeControls() {
    // Play/Pause controls
    document.getElementById('play-btn').addEventListener('click', function() {
        if (animationState.isPlaying) {
            pauseAnimation();
        } else {
            playAnimation();
        }
    });

    document.getElementById('pause-btn').addEventListener('click', pauseAnimation);
    document.getElementById('reset-btn').addEventListener('click', resetAnimation);
    document.getElementById('export-btn').addEventListener('click', exportCurrentData);

    // Speed control
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    
    speedSlider.addEventListener('input', function() {
        animationState.speed = parseFloat(this.value);
        speedValue.textContent = `${this.value}x`;
    });

    // What-if scenario controls
    document.getElementById('run-scenario').addEventListener('click', runWhatIfScenario);

    // Filter controls
    document.getElementById('variable-filter').addEventListener('input', filterVariables);
    document.getElementById('variable-scope').addEventListener('change', filterVariables);
    document.getElementById('effect-type-filter').addEventListener('change', filterSideEffects);
    document.getElementById('impact-filter').addEventListener('change', filterSideEffects);
}

function initializeVisualizations() {
    // Initialize D3 containers for each visualization type
    initializeCallGraphVisualization();
    initializeVariableTraceVisualization();
    initializeWhatIfVisualization();
    initializeSideEffectsVisualization();
    initializeTimelineVisualization();
}

function setupMessageHandling() {
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.command) {
            case 'updateCallGraph':
                updateCallGraphVisualization(message.data);
                break;
            case 'updateWhatIfAnalysis':
                updateWhatIfVisualization(message.data);
                break;
            case 'updateSideEffects':
                updateSideEffectsVisualization(message.data);
                break;
            case 'debugSessionStart':
                onDebugSessionStart(message.data);
                break;
            case 'debugSessionEnd':
                onDebugSessionEnd(message.data);
                break;
            case 'debugMessage':
                handleDebugMessage(message.data);
                break;
        }
    });
}

// Call Graph Visualization
function initializeCallGraphVisualization() {
    const container = d3.select('#call-graph-viz');
    const width = container.node().getBoundingClientRect().width;
    const height = 600;

    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('id', 'call-graph-svg');

    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 3])
        .on('zoom', (event) => {
            svg.select('.zoom-group').attr('transform', event.transform);
        });

    svg.call(zoom);
    svg.append('g').attr('class', 'zoom-group');
}

function updateCallGraphVisualization(callGraphData) {
    currentData.callGraph = callGraphData;
    
    const svg = d3.select('#call-graph-svg .zoom-group');
    svg.selectAll('*').remove(); // Clear existing content

    if (!callGraphData || !callGraphData.rootNodes) return;

    // Create force simulation
    const simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(400, 300));

    // Prepare nodes and links data
    const nodes = [];
    const links = [];

    function processNode(node, depth = 0) {
        nodes.push({
            id: node.id,
            name: node.name,
            depth: depth,
            totalCalls: node.metadata.totalCalls,
            averageDuration: node.metadata.averageDuration
        });

        node.childNodes.forEach(child => {
            links.push({
                source: node.id,
                target: child.id,
                callCount: child.calls.length
            });
            processNode(child, depth + 1);
        });
    }

    callGraphData.rootNodes.forEach(root => processNode(root));

    // Create links
    const link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', d => Math.max(1, d.callCount / 10));

    // Create nodes
    const node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(nodes)
        .enter().append('g')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    // Add circles to nodes
    node.append('circle')
        .attr('r', d => Math.max(5, Math.sqrt(d.totalCalls) * 2))
        .attr('fill', d => {
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
            return colors[d.depth % colors.length];
        })
        .on('click', function(event, d) {
            showNodeDetails(d);
            jumpToSource(d);
        });

    // Add labels to nodes
    node.append('text')
        .text(d => d.name)
        .attr('x', 12)
        .attr('y', 3)
        .style('font-size', '12px')
        .style('fill', '#333');

    // Update simulation
    simulation.nodes(nodes).on('tick', ticked);
    simulation.force('link').links(links);

    function ticked() {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node
            .attr('transform', d => `translate(${d.x},${d.y})`);
    }

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    // Update info panel
    document.getElementById('call-graph-info').innerHTML = `
        <div class="metric">
            <label>Total Functions:</label>
            <span>${callGraphData.metadata.totalFunctions}</span>
        </div>
        <div class="metric">
            <label>Total Calls:</label>
            <span>${callGraphData.metadata.totalCalls}</span>
        </div>
        <div class="metric">
            <label>Max Depth:</label>
            <span>${callGraphData.metadata.maxDepth}</span>
        </div>
        <div class="metric">
            <label>Analysis Time:</label>
            <span>${callGraphData.metadata.analysisTime}ms</span>
        </div>
    `;
}

// Variable Trace Visualization
function initializeVariableTraceVisualization() {
    const container = d3.select('#variable-trace-viz');
    const width = container.node().getBoundingClientRect().width;
    const height = 400;

    container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('id', 'variable-trace-svg');
}

function updateVariableTraceVisualization(variableData) {
    currentData.variableTrace = variableData;
    
    // Create timeline chart for variable changes
    const svg = d3.select('#variable-trace-svg');
    svg.selectAll('*').remove();

    if (!variableData) return;

    // Implementation for variable trace timeline
    const margin = {top: 20, right: 30, bottom: 40, left: 50};
    const width = svg.attr('width') - margin.left - margin.right;
    const height = svg.attr('height') - margin.top - margin.bottom;

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales and axes for timeline
    // This would be implemented based on actual variable data structure
}

// What-If Analysis Visualization
function initializeWhatIfVisualization() {
    const container = d3.select('#what-if-viz');
    const width = container.node().getBoundingClientRect().width;
    const height = 500;

    container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('id', 'what-if-svg');
}

function updateWhatIfVisualization(analysisData) {
    currentData.whatIfAnalysis = analysisData;
    
    const svg = d3.select('#what-if-svg');
    svg.selectAll('*').remove();

    if (!analysisData) return;

    // Create sankey diagram for execution paths
    // Implementation would show different execution paths based on what-if scenarios
    
    // Update info panel
    document.getElementById('what-if-info').innerHTML = `
        <div class="metric">
            <label>Scenario:</label>
            <span>${analysisData.scenario.description}</span>
        </div>
        <div class="metric">
            <label>Execution Paths:</label>
            <span>${analysisData.executionPaths.length}</span>
        </div>
        <div class="metric">
            <label>Side Effects:</label>
            <span>${analysisData.sideEffects.length}</span>
        </div>
        <div class="metric">
            <label>Execution Time:</label>
            <span>${analysisData.performanceMetrics.totalExecutionTime}ms</span>
        </div>
        <div class="metric">
            <label>Coverage:</label>
            <span>${analysisData.codeCoverage.coveragePercentage.toFixed(1)}%</span>
        </div>
    `;
}

// Side Effects Visualization
function initializeSideEffectsVisualization() {
    const container = d3.select('#side-effects-viz');
    const width = container.node().getBoundingClientRect().width;
    const height = 400;

    container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('id', 'side-effects-svg');
}

function updateSideEffectsVisualization(sideEffectsData) {
    currentData.sideEffects = sideEffectsData;
    
    const svg = d3.select('#side-effects-svg');
    svg.selectAll('*').remove();

    if (!sideEffectsData) return;

    // Create bubble chart or treemap for side effects by type and impact
    const margin = {top: 20, right: 30, bottom: 40, left: 50};
    const width = svg.attr('width') - margin.left - margin.right;
    const height = svg.attr('height') - margin.top - margin.bottom;

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create visualization based on side effects data
    // Group by type and show impact levels

    // Update info panel
    document.getElementById('side-effects-info').innerHTML = `
        <div class="metric">
            <label>Total Effects:</label>
            <span>${sideEffectsData.totalEffects}</span>
        </div>
        <div class="metric">
            <label>High Impact:</label>
            <span>${sideEffectsData.highImpactEffects.length}</span>
        </div>
        <div class="effects-by-type">
            <h4>Effects by Type:</h4>
            ${Object.entries(sideEffectsData.effectsByType)
                .map(([type, count]) => `<div>${type}: ${count}</div>`)
                .join('')}
        </div>
    `;
}

// Timeline Visualization
function initializeTimelineVisualization() {
    const container = d3.select('#timeline-viz');
    const width = container.node().getBoundingClientRect().width;
    const height = 300;

    container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('id', 'timeline-svg');
}

function updateTimelineVisualization() {
    const svg = d3.select('#timeline-svg');
    svg.selectAll('*').remove();

    // Combine all data for timeline view
    const timelineData = [];
    
    if (currentData.sideEffects && currentData.sideEffects.timeline) {
        timelineData.push(...currentData.sideEffects.timeline);
    }

    // Create comprehensive timeline showing all events
    // This would show variable changes, function calls, side effects over time
}

// Animation Controls
function playAnimation() {
    animationState.isPlaying = true;
    document.getElementById('play-btn').textContent = '⏸️ Pause';
    updateStatus('Playing animation...');
    
    // Start animation loop
    animateVisualization();
}

function pauseAnimation() {
    animationState.isPlaying = false;
    document.getElementById('play-btn').textContent = '▶️ Play';
    updateStatus('Animation paused');
}

function resetAnimation() {
    animationState.isPlaying = false;
    animationState.currentTime = 0;
    document.getElementById('play-btn').textContent = '▶️ Play';
    updateStatus('Animation reset');
    
    // Reset all visualizations to initial state
    refreshCurrentVisualization();
}

function animateVisualization() {
    if (!animationState.isPlaying) return;

    // Update animation frame
    animationState.currentTime += animationState.speed;
    
    // Apply animation to current visualization
    const activeTab = document.querySelector('.tab-button.active').dataset.tab;
    
    switch (activeTab) {
        case 'call-graph':
            animateCallGraph();
            break;
        case 'variable-trace':
            animateVariableTrace();
            break;
        case 'timeline':
            animateTimeline();
            break;
    }

    // Schedule next frame
    if (animationState.isPlaying) {
        setTimeout(animateVisualization, 100 / animationState.speed);
    }
}

function animateCallGraph() {
    // Animate function calls in sequence
    if (!currentData.callGraph) return;
    
    // Highlight active calls based on current time
    // This would show the progression of function calls over time
}

function animateVariableTrace() {
    // Animate variable changes over time
    // Show how variables change their values during execution
}

function animateTimeline() {
    // Animate the timeline scrubber
    // Show current position in the execution timeline
}

// Utility Functions
function refreshCurrentVisualization() {
    const activeTab = document.querySelector('.tab-button.active').dataset.tab;
    
    switch (activeTab) {
        case 'call-graph':
            if (currentData.callGraph) updateCallGraphVisualization(currentData.callGraph);
            break;
        case 'variable-trace':
            if (currentData.variableTrace) updateVariableTraceVisualization(currentData.variableTrace);
            break;
        case 'what-if':
            if (currentData.whatIfAnalysis) updateWhatIfVisualization(currentData.whatIfAnalysis);
            break;
        case 'side-effects':
            if (currentData.sideEffects) updateSideEffectsVisualization(currentData.sideEffects);
            break;
        case 'timeline':
            updateTimelineVisualization();
            break;
    }
}

function showNodeDetails(nodeData) {
    // Show detailed information about a node in the call graph
    const info = document.getElementById('call-graph-info');
    info.innerHTML += `
        <div class="node-details">
            <h4>${nodeData.name}</h4>
            <div>Total Calls: ${nodeData.totalCalls}</div>
            <div>Average Duration: ${nodeData.averageDuration}ms</div>
            <div>Depth: ${nodeData.depth}</div>
        </div>
    `;
}

function jumpToSource(nodeData) {
    // Send message to VS Code to jump to source location
    vscode.postMessage({
        command: 'jumpToSource',
        file: nodeData.file,
        line: nodeData.line,
        column: nodeData.column
    });
}

function exportCurrentData() {
    const activeTab = document.querySelector('.tab-button.active').dataset.tab;
    const dataToExport = currentData[activeTab.replace('-', '')];
    
    vscode.postMessage({
        command: 'exportData',
        format: 'json',
        data: dataToExport
    });
}

function updateStatus(message) {
    document.getElementById('status-text').textContent = message;
}

function runWhatIfScenario() {
    const mockInputs = document.getElementById('mock-inputs').value;
    
    try {
        const inputs = JSON.parse(mockInputs);
        vscode.postMessage({
            command: 'runWhatIfScenario',
            inputs: inputs
        });
        updateStatus('Running what-if scenario...');
    } catch (error) {
        updateStatus('Error: Invalid JSON in mock inputs');
    }
}

function filterVariables() {
    const filter = document.getElementById('variable-filter').value;
    const scope = document.getElementById('variable-scope').value;
    
    vscode.postMessage({
        command: 'filterData',
        filters: {
            type: 'variables',
            filter: filter,
            scope: scope
        }
    });
}

function filterSideEffects() {
    const typeFilter = document.getElementById('effect-type-filter').value;
    const impactFilter = document.getElementById('impact-filter').value;
    
    vscode.postMessage({
        command: 'filterData',
        filters: {
            type: 'sideEffects',
            effectType: typeFilter,
            impact: impactFilter
        }
    });
}

function onDebugSessionStart(sessionData) {
    updateStatus(`Debug session started: ${sessionData.sessionName}`);
    document.getElementById('debug-status').textContent = `🐛 ${sessionData.sessionName}`;
}

function onDebugSessionEnd(sessionData) {
    updateStatus('Debug session ended');
    document.getElementById('debug-status').textContent = '';
}

function handleDebugMessage(debugMessage) {
    // Handle real-time debug messages
    // Update visualizations based on debug events
    
    if (debugMessage.type === 'event') {
        switch (debugMessage.event) {
            case 'stopped':
                updateStatus('Debug session paused');
                break;
            case 'continued':
                updateStatus('Debug session resumed');
                break;
        }
    }
}
