import React, { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow, // New hook for drag-and-drop positioning
} from 'reactflow';

import 'reactflow/dist/style.css';
import './App.css'; // Keep your custom CSS

// --- Node Definitions ---
// These define the types of nodes you can drag onto the canvas.
// We'll expand these later.
const nodeTypes = {
  // Timings
  timingNode: ({ data }) => (
    <div style={{ padding: '10px', border: '1px solid #777', borderRadius: '5px', background: data.bgColor, color: data.textColor }}>
      <strong>{data.label}</strong>
      {data.functionName && <div style={{ fontSize: '0.8em' }}>{data.functionName}</div>}
    </div>
  ),
  // Value Acquisition
  valueAcquisitionNode: ({ data }) => (
    <div style={{ padding: '10px', border: '1px solid #777', borderRadius: '5px', background: data.bgColor, color: data.textColor }}>
      <strong>{data.label}</strong>
      {data.functionName && <div style={{ fontSize: '0.8em' }}>{data.functionName}</div>}
    </div>
  ),
  // Consequences
  consequenceNode: ({ data }) => (
    <div style={{ padding: '10px', border: '1px solid #777', borderRadius: '5px', background: data.bgColor, color: data.textColor }}>
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
    data: { label: 'GlitchScript Start', functionName: 'Modular/TIMING:', category: 'Timing', bgColor: '#d0e0ff', textColor: '#333' },
    type: 'input',
    style: { background: '#d0e0ff', color: '#333', border: '1px solid #aaa' },
  },
];
const initialEdges = [];

// --- Main App Component ---
function App() {
  const reactFlowWrapper = useRef(null); // Ref for the ReactFlow container
  const { screenToFlowPosition } = useReactFlow(); // Hook to convert screen coords to flow coords

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All'); // 'All', 'Timing', 'Value Acquisition', 'Consequence'

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


  // Apply dynamic styles to existing nodes
  const styledNodes = nodes.map(node => ({
    ...node,
    style: {
      ...node.style,
      background: nodeBgColor,
      color: nodeTextColor,
      borderColor: nodeBorderColor,
    },
    data: {
      ...node.data,
      bgColor: nodeBgColor, // Pass these to custom node components
      textColor: nodeTextColor,
      borderColor: nodeBorderColor,
    }
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
    // Store information about the dragged node
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, functionData }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault(); // Prevent default to allow drop
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

        // Generate a unique ID for the new node
        const newNodeId = `${nodeType}-${Date.now()}`;

        const newNode = {
          id: newNodeId,
          type: nodeType,
          position,
          data: {
            label: functionData.label,
            functionName: functionData.functionName,
            category: functionData.category,
            bgColor: nodeBgColor, // Apply current theme colors
            textColor: nodeTextColor,
            borderColor: nodeBorderColor,
          },
          // Add handles for connections. This is a basic setup;
          // you'd typically define these more robustly per node type.
          sourcePosition: 'right', // Output handle on the right
          targetPosition: 'left',  // Input handle on the left
        };

        setNodes((nds) => nds.concat(newNode));
      }
    },
    [screenToFlowPosition, setNodes, nodeBgColor, nodeTextColor, nodeBorderColor],
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
        flexShrink: 0, // Prevent it from shrinking
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
            flexGrow: 1, // Allow search bar to take available space
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
        flexWrap: 'wrap', // Allow items to wrap
        gap: '10px',
        flexShrink: 0,
        color: textColor,
        maxHeight: '100px', // Limit height and add scroll if too many
        overflowY: 'auto',
      }}>
        {filteredFunctions.map(func => (
          <div
            key={func.id}
            className="dnd-node" // Custom class for styling
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
      <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ flexGrow: 1 }}> {/* Takes remaining vertical space */}
        <ReactFlow
          nodes={styledNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop} // Handle dropping nodes
          onDragOver={onDragOver} // Allow dropping
          nodeTypes={nodeTypes} // Register custom node types
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

export default App;