import React, { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider, // <--- NEW IMPORT HERE
} from 'reactflow';

import 'reactflow/dist/style.css';
import './App.css'; // Keep your custom CSS

// --- Node Definitions ---
// These define the types of nodes you can drag onto the canvas.
const nodeTypes = {
  // Timings
  timingNode: ({ data }) => (
    <div style={{ padding: '10px', border: `1px solid ${data.borderColor}`, borderRadius: '5px', background: data.bgColor, color: data.textColor }}>
      <strong>{data.label}</strong>
      {data.functionName && <div style={{ fontSize: '0.8em' }}>{data.functionName}</div>}
    </div>
  ),
  // Value Acquisition
  valueAcquisitionNode: ({ data }) => (
    <div style={{ padding: '10px', border: `1px solid ${data.borderColor}`, borderRadius: '5px', background: data.bgColor, color: data.textColor }}>
      <strong>{data.label}</strong>
      {data.functionName && <div style={{ fontSize: '0.8em' }}>{data.functionName}</div>}
    </div>
  ),
  // Consequences
  consequenceNode: ({ data }) => (
    <div style={{ padding: '10px', border: `1px solid ${data.borderColor}`, borderRadius: '5px', background: data.bgColor, color: data.textColor }}>
      <strong>{data.label}</strong>
      {data.functionName && <div style={{ fontSize: '0.8em' }}>{data.functionName}</div>}
    </div>
  ),
};

// --- Initial Setup ---
const initialNodes = [
  {
    id: '1',
    position: { x: 50, y: 150 },
    data: { label: 'GlitchScript Start', functionName: 'Modular/TIMING:', category: 'Timing' },
    type: 'input',
  },
];
const initialEdges = [];

// --- Main App Component (Now wrapped in ReactFlowProvider) ---
// We create a wrapper component to use useReactFlow, as it must be
// a child of ReactFlowProvider.
function Flow() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow(); // Now correctly used within the provider

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const toggleDarkMode = () => setIsDarkMode((prevMode) => !prevMode);

  // Define colors based on mode
  const backgroundColor = isDarkMode ? '#1a1a1a' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#333333';
  const nodeBgColor = isDarkMode ? '#333333' : '#ffffff';
  const nodeTextColor = isDarkMode ? '#ffffff' : '#333333';
  const nodeBorderColor = isDarkMode ? '#555555' : '#cccccc';
  const topBarBgColor = isDarkMode ? '#2a2a2a' : '#f0f0f0';
  const topBarBorderColor = isDarkMode ? '#444444' : '#e0e0e0';
  const buttonBgColor = isDarkMode ? '#444' : '#eee';
  const buttonBorderColor = isDarkMode ? '#555' : '#ccc';


  // Apply dynamic styles to nodes (both initial and new ones)
  const getThemedNodeData = (node) => ({
    ...node.data,
    bgColor: nodeBgColor,
    textColor: nodeTextColor,
    borderColor: nodeBorderColor,
  });

  const themedNodes = nodes.map(node => ({
    ...node,
    data: getThemedNodeData(node),
  }));


  // --- Draggable Node Definitions for the Top Bar ---
  const availableFunctions = [
    // Timings
    { id: 'timing-roundstart', label: 'Round Start', functionName: 'RoundStart', category: 'Timing', type: 'timingNode' },
    { id: 'timing-whenuse', label: 'When Use', functionName: 'WhenUse', category: 'Timing', type: 'timingNode' },
    { id: 'timing-onbreak', label: 'On Break', functionName: 'OnBreak', category: 'Timing', type: 'timingNode' },
    // Value Acquisition
    { id: 'value-bufcheck', label: 'Buff Check', functionName: 'bufcheck', category: 'Value Acquisition', type: 'valueAcquisitionNode' },
    { id: 'value-getdata', label: 'Get Data', functionName: 'getdata', category: 'Value Acquisition', type: 'valueAcquisitionNode' },
    { id: 'value-round', label: 'Round Number', functionName: 'round', category: 'Value Acquisition', type: 'valueAcquisitionNode' },
    // Consequences
    { id: 'con-buf', label: 'Apply Buff', functionName: 'buf', category: 'Consequence', type: 'consequenceNode' },
    { id: 'con-bonusdmg', label: 'Bonus Damage', functionName: 'bonusdmg', category: 'Consequence', type: 'consequenceNode' },
    { id: 'con-setdata', label: 'Set Data', functionName: 'setdata', category: 'Consequence', type: 'consequenceNode' },
    { id: 'con-endbattle', label: 'End Battle', functionName: 'endbattle', category: 'Consequence', type: 'consequenceNode' },
  ];

  // Filter functions based on search term and active category
  const filteredFunctions = availableFunctions.filter(func => {
    const matchesSearch = func.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          func.functionName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || func.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // --- Drag and Drop Handlers ---
  const onDragStart = (event, nodeType, functionData) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, functionData }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const transferData = JSON.parse(event.dataTransfer.getData('application/reactflow'));

      if (transferData) {
        const { nodeType, functionData } = transferData;
        const position = screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const newNodeId = `${nodeType}-${Date.now()}`;

        const newNode = {
          id: newNodeId,
          type: nodeType,
          position,
          data: getThemedNodeData({ data: functionData }), // Apply theme to new node
          sourcePosition: 'right',
          targetPosition: 'left',
        };

        setNodes((nds) => nds.concat(newNode));
      }
    },
    [screenToFlowPosition, setNodes, getThemedNodeData],
  );

  return (
    <div className={isDarkMode ? 'dark-mode' : 'light-mode'} style={{ width: '100vw', height: '100vh', backgroundColor: backgroundColor, display: 'flex', flexDirection: 'column' }}>

      {/* --- Top Bar --- */}
      <div style={{
        backgroundColor: topBarBgColor,
        borderBottom: `1px solid ${topBarBorderColor}`,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        flexShrink: 0,
        color: textColor,
      }}>
        <h2 style={{ margin: 0, fontSize: '1.2em' }}>GlitchScript Editor</h2>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          style={{
            padding: '6px 12px',
            borderRadius: '5px',
            border: `1px solid ${buttonBorderColor}`,
            background: buttonBgColor,
            color: textColor,
            cursor: 'pointer',
            fontSize: '0.9em',
          }}
        >
          {isDarkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
        </button>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '5px' }}>
          {['All', 'Timing', 'Value Acquisition', 'Consequence'].map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={{
                padding: '6px 12px',
                borderRadius: '5px',
                border: `1px solid ${buttonBorderColor}`,
                background: activeCategory === category ? (isDarkMode ? '#555' : '#ddd') : buttonBgColor,
                color: textColor,
                cursor: 'pointer',
                fontSize: '0.9em',
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search functions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '5px',
            border: `1px solid ${buttonBorderColor}`,
            background: isDarkMode ? '#333' : '#fff',
            color: textColor,
            fontSize: '0.9em',
            flexGrow: 1,
            maxWidth: '300px',
          }}
        />
      </div>

      {/* --- Draggable Functions Palette --- */}
      <div style={{
        backgroundColor: topBarBgColor,
        borderBottom: `1px solid ${topBarBorderColor}`,
        padding: '10px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        flexShrink: 0,
        color: textColor,
        maxHeight: '100px',
        overflowY: 'auto',
      }}>
        {filteredFunctions.map(func => (
          <div
            key={func.id}
            className="dnd-node"
            onDragStart={(event) => onDragStart(event, func.type, func)}
            draggable
            style={{
              padding: '8px 15px',
              borderRadius: '5px',
              border: `1px solid ${nodeBorderColor}`,
              background: nodeBgColor,
              color: nodeTextColor,
              cursor: 'grab',
              fontSize: '0.9em',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {func.label} ({func.functionName})
          </div>
        ))}
      </div>


      {/* --- React Flow Canvas --- */}
      <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ flexGrow: 1 }}>
        <ReactFlow
          nodes={themedNodes} // Use themedNodes here
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
        >
          <MiniMap style={{ background: backgroundColor }} />
          <Controls style={{ background: backgroundColor, color: textColor }} />
          <Background variant="dots" gap={12} size={1} color={isDarkMode ? '#555' : '#aaa'} />
        </ReactFlow>
      </div>
    </div>
  );
}

// The main App component now just wraps the Flow component with ReactFlowProvider
function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

export default App;