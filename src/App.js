import React, { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider, // Essential for React Flow hooks to work
} from 'reactflow';

import 'reactflow/dist/style.css';
import './App.css'; // Your custom CSS file

// --- Custom Node Components ---
// These components define how each type of node looks and behaves on the canvas.
const nodeTypes = {
  timingNode: ({ data }) => (
    <div className="custom-node" style={{ background: data.bgColor, color: data.textColor, borderColor: data.borderColor }}>
      <strong>{data.label}</strong>
      {data.functionName && <div style={{ fontSize: '0.8em' }}>{data.functionName}</div>}
    </div>
  ),
  valueAcquisitionNode: ({ data }) => (
    <div className="custom-node" style={{ background: data.bgColor, color: data.textColor, borderColor: data.borderColor }}>
      <strong>{data.label}</strong>
      {data.functionName && <div style={{ fontSize: '0.8em' }}>{data.functionName}</div>}
    </div>
  ),
  consequenceNode: ({ data }) => (
    <div className="custom-node" style={{ background: data.bgColor, color: data.textColor, borderColor: data.borderColor }}>
      <strong>{data.label}</strong>
      {data.functionName && <div style={{ fontSize: '0.8em' }}>{data.functionName}</div>}
    </div>
  ),
};

// --- Initial Graph Setup ---
// Defines the nodes that are present when the editor first loads.
const initialNodes = [
  {
    id: '1',
    position: { x: 50, y: 150 },
    data: { label: 'GlitchScript Start', functionName: 'Modular/TIMING:', category: 'Timing' },
    type: 'input', // 'input' type nodes typically have only outgoing connections
  },
];
const initialEdges = []; // No connections initially

// --- Flow Component (Main Logic for React Flow) ---
// This component contains the core logic for the node editor, including state management,
// drag-and-drop handlers, and UI rendering. It must be a child of ReactFlowProvider.
function Flow() {
  const reactFlowWrapper = useRef(null); // Reference to the React Flow container for drag-and-drop calculations
  const { screenToFlowPosition } = useReactFlow(); // Hook to convert screen coordinates to flow coordinates

  // React Flow state management for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Callback for when a new connection is made between nodes
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  // UI state for dark mode, search, category filters, and hover tooltips
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredFunction, setHoveredFunction] = useState(null); // Stores data of the function currently hovered
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 }); // Stores position for the tooltip

  // Toggle dark mode state
  const toggleDarkMode = () => setIsDarkMode((prevMode) => !prevMode);

  // --- Dynamic Theming ---
  // Define colors based on the current mode for consistent styling
  const backgroundColor = isDarkMode ? '#1a1a1a' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#333333';
  const nodeBgColor = isDarkMode ? '#333333' : '#ffffff';
  const nodeTextColor = isDarkMode ? '#ffffff' : '#333333';
  const nodeBorderColor = isDarkMode ? '#555555' : '#cccccc';
  const topBarBgColor = isDarkMode ? '#2a2a2a' : '#f0f0f0';
  const topBarBorderColor = isDarkMode ? '#444444' : '#e0e0e0';
  const buttonBgColor = isDarkMode ? '#444' : '#eee';
  const buttonBorderColor = isDarkMode ? '#555' : '#ccc';
  const paletteBgColor = isDarkMode ? '#222' : '#fafafa';
  const paletteBorderColor = isDarkMode ? '#333' : '#e0e0e0';

  // Helper function to apply current theme colors to node data
  const getThemedNodeData = useCallback((nodeData) => ({
    ...nodeData,
    bgColor: nodeBgColor,
    textColor: nodeTextColor,
    borderColor: nodeBorderColor,
  }), [nodeBgColor, nodeTextColor, nodeBorderColor]);

  // Apply themed data to all current nodes for consistent rendering
  const themedNodes = nodes.map(node => ({
    ...node,
    data: getThemedNodeData(node.data),
  }));

  // --- Draggable Function Definitions ---
  // This array holds all available GlitchScript functions with their metadata and descriptions.
  const availableFunctions = [
    // Timings
    { id: 'timing-roundstart', label: 'Round Start', functionName: 'RoundStart', category: 'Timing', type: 'timingNode',
      description: 'Triggers at the start of each round.' },
    { id: 'timing-whenuse', label: 'When Use', functionName: 'WhenUse', category: 'Timing', type: 'timingNode',
      description: 'Triggers when this unit uses a skill. ("Target" becomes the unit BEING HIT, "Self" becomes the unit who USED THE ATTACK)' },
    { id: 'timing-onbreak', label: 'On Break', functionName: 'OnBreak', category: 'Timing', type: 'timingNode',
      description: 'Triggers when this unit gets staggered. ("Target" becomes the dead unit unless LOOP is involved)' },
    { id: 'timing-endbattle', label: 'End Battle', functionName: 'EndBattle', category: 'Timing', type: 'timingNode',
      description: 'Triggers at the end of the combat phase.' },
    { id: 'timing-onburst', label: 'On Burst', functionName: 'OnBurst', category: 'Timing', type: 'timingNode',
      description: 'Triggers when a Tremor Burst occurs.' },
    { id: 'timing-whenhit', label: 'When Hit', functionName: 'WhenHit', category: 'Timing', type: 'timingNode',
      description: "Triggers when this unit gets hit by an attack. ('Target' becomes the unit BEING HIT, 'Self' becomes the unit who USED THE ATTACK)" },
    { id: 'timing-bwh', label: 'Before When Hit', functionName: 'BWH', category: 'Timing', type: 'timingNode',
      description: "Triggers before this unit gets hit. ('Target' becomes the unit BEING HIT, 'Self' becomes the unit who USED THE ATTACK)" },

    // Value Acquisition Functions
    { id: 'value-bufcheck', label: 'Buff Check', functionName: 'bufcheck', category: 'Value Acquisition', type: 'valueAcquisitionNode',
      description: 'Returns the potency, turns, or product/sum of potency and turns of a buff.\n\nArguments:\nvar_1: See Single-Target (e.g., Self, Target)\nvar_2: Buff keyword (e.g., Enhancement, Agility)\nvar_3: stack | turn | + | *' },
    { id: 'value-getdata', label: 'Get Data', functionName: 'getdata', category: 'Value Acquisition', type: 'valueAcquisitionNode',
      description: 'Retrieves encounter-persistent data from the target.\n\nArguments:\nvar_1: See Multi-Target (e.g., Self, Target)\nvar_2: VALUE_# | any integer (The Data ID)' },
    { id: 'value-round', label: 'Round Number', functionName: 'round', category: 'Value Acquisition', type: 'valueAcquisitionNode',
      description: 'Returns the current round number.' },
    { id: 'value-unitstate', label: 'Unit State', functionName: 'unitstate', category: 'Value Acquisition', type: 'valueAcquisitionNode',
      description: 'Returns the current state of the unit (e.g., 0 for normal, 2 for staggered).\n\nArguments:\nvar_1: See Single-Target (e.g., Self, Target)' },
    { id: 'value-random', label: 'Random Number', functionName: 'random', category: 'Value Acquisition', type: 'valueAcquisitionNode',
      description: 'Generates a random integer within a specified range.\n\nArguments:\nvar_1: Minimum value\nvar_2: Maximum value' },

    // Consequence Functions
    { id: 'con-buf', label: 'Apply Buff', functionName: 'buf', category: 'Consequence', type: 'consequenceNode',
      description: 'Applies a buff to the target.\n\nArguments:\nvar_1: See Multi-Target (e.g., Self, Target)\nvar_2: Buff keyword\nvar_3: Potency\nvar_4: Count\nvar_5: Active Round (0 for current, 1 for next)' },
    { id: 'con-bonusdmg', label: 'Bonus Damage', functionName: 'bonusdmg', category: 'Consequence', type: 'consequenceNode',
      description: 'Deals bonus damage.\n\nArguments:\nvar_1: See Multi-Target (e.g., Self, Target)\nvar_2: Damage amount\nvar_3: -1 (true) | 0 (slash) | 1 (pierce) | 2 (blunt)\nvar_4: -1 (true) | 0~6 (sin types)' },
    { id: 'con-setdata', label: 'Set Data', functionName: 'setdata', category: 'Consequence', type: 'consequenceNode',
      description: 'Sets encounter-persistent data to the target.\n\nArguments:\nvar_1: See Multi-Target (e.g., Self, Target)\nvar_2: VALUE_# | any integer (The Data ID. Make this unique so it does not conflict with other mods, e.g: Skill ID + 10 or similar)\nvar_3: VALUE_# | any integer (The value to be set)' },
    { id: 'con-endbattle', label: 'End Battle', functionName: 'endbattle', category: 'Consequence', type: 'consequenceNode',
      description: 'Ends the current turn\'s battle, skips to next turn.' },
    { id: 'con-scale', label: 'Coin Power', functionName: 'scale', category: 'Consequence', type: 'consequenceNode',
      description: 'Gains coin power (similar to vanilla for negative coins).\n\nArguments:\nvar_1: VALUE_# | any integer (Adds or subtracts coin power)\nvar_1: ADD | SUB | MUL (Changes the operatorType of the coins)\nopt_2: any integer (Sets the index of the coin to be affected. 0 means first coin, 4 means fifth coin)' },
    { id: 'con-dmgmult', label: 'Damage Multiplier', functionName: 'dmgmult', category: 'Consequence', type: 'consequenceNode',
      description: 'Gains +Damage%.\n\nArguments:\nvar_1: VALUE_# | any integer (Adds or subtracts percentage)' },
    { id: 'con-breakrecover', label: 'Break Recover', functionName: 'breakrecover', category: 'Consequence', type: 'consequenceNode',
      description: 'Recovers the unit from the Staggered state.\n\nArguments:\nvar_1: See Single-Target (e.g., Self, Target)' },
  ];

  // Filter functions based on search term and active category
  const filteredFunctions = availableFunctions.filter(func => {
    const matchesSearch = func.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          func.functionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (func.description && func.description.toLowerCase().includes(searchTerm.toLowerCase())); // Search in description too
    const matchesCategory = activeCategory === 'All' || func.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // --- Drag and Drop Handlers ---
  // Called when a draggable item from the palette starts being dragged
  const onDragStart = (event, nodeType, functionData) => {
    // Store data about the dragged node in the dataTransfer object
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, functionData }));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Called when a draggable item is dragged over the React Flow canvas
  const onDragOver = useCallback((event) => {
    event.preventDefault(); // Essential to allow the 'drop' event to fire
    event.dataTransfer.dropEffect = 'move'; // Visual feedback for the user
  }, []);

  // Called when a draggable item is dropped onto the React Flow canvas
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const transferData = JSON.parse(event.dataTransfer.getData('application/reactflow'));

      if (transferData) {
        const { nodeType, functionData } = transferData;
        // Convert screen coordinates of the drop to React Flow canvas coordinates
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
          data: getThemedNodeData(functionData), // Apply theme to the new node's data
          sourcePosition: 'right', // Default output handle on the right
          targetPosition: 'left',  // Default input handle on the left
        };

        setNodes((nds) => nds.concat(newNode)); // Add the new node to the React Flow state
      }
    },
    [screenToFlowPosition, setNodes, getThemedNodeData], // Dependencies for useCallback
  );

  // --- Tooltip Handlers ---
  // Called when the mouse enters a draggable function item in the palette
  const handleMouseEnter = useCallback((event, func) => {
    setHoveredFunction(func); // Set the hovered function data
    // Position tooltip slightly offset from the mouse cursor
    setHoverPos({ x: event.clientX + 15, y: event.clientY + 15 });
  }, []);

  // Called when the mouse leaves a draggable function item
  const handleMouseLeave = useCallback(() => {
    setHoveredFunction(null); // Hide the tooltip
  }, []);


  return (
    <div className={isDarkMode ? 'dark-mode' : 'light-mode'} style={{ width: '100vw', height: '100vh', backgroundColor: backgroundColor, display: 'flex', flexDirection: 'column' }}>

      {/* --- Top Bar (Header) --- */}
      <div style={{
        backgroundColor: topBarBgColor,
        borderBottom: `1px solid ${topBarBorderColor}`,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        flexShrink: 0, // Prevents this div from shrinking
        color: textColor,
      }}>
        <h2 style={{ margin: 0, fontSize: '1.2em' }}>GlitchScript Editor</h2>

        {/* Dark Mode Toggle Button */}
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

        {/* Category Filter Buttons */}
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
          placeholder="Search functions (name or description)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '5px',
            border: `1px solid ${buttonBorderColor}`,
            background: isDarkMode ? '#333' : '#fff',
            color: textColor,
            fontSize: '0.9em',
            flexGrow: 1, // Allows the search bar to expand
            maxWidth: '350px',
          }}
        />
      </div>

      {/* --- Draggable Functions Palette --- */}
      {/* This section displays the available functions that can be dragged onto the canvas. */}
      <div style={{
        backgroundColor: paletteBgColor,
        borderBottom: `1px solid ${paletteBorderColor}`,
        padding: '10px 20px',
        display: 'flex',
        flexWrap: 'wrap', // Allows items to wrap to the next line
        gap: '10px',
        flexShrink: 0,
        color: textColor,
        maxHeight: '120px', // Limits height and adds scrollbar if content overflows
        overflowY: 'auto',
        position: 'relative', // Needed for absolute positioning of the tooltip
      }}>
        <h3 style={{ width: '100%', margin: '0 0 10px 0', color: textColor }}>Available Functions:</h3>
        {filteredFunctions.map(func => (
          <div
            key={func.id}
            className="dnd-node-palette" // Custom class for styling palette items
            onDragStart={(event) => onDragStart(event, func.type, func)} // Start drag operation
            draggable // Make the div draggable
            onMouseEnter={(event) => handleMouseEnter(event, func)} // Show tooltip on hover
            onMouseLeave={handleMouseLeave} // Hide tooltip on mouse leave
            style={{
              padding: '8px 15px',
              borderRadius: '5px',
              border: `1px solid ${nodeBorderColor}`,
              background: nodeBgColor,
              color: nodeTextColor,
              cursor: 'grab', // Indicates draggable
              fontSize: '0.9em',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              whiteSpace: 'nowrap', // Prevents text wrapping within the palette item
            }}
          >
            {func.label} ({func.functionName})
          </div>
        ))}

        {/* --- Tooltip Display --- */}
        {/* Conditionally renders the tooltip if a function is being hovered. */}
        {hoveredFunction && (
          <div
            style={{
              position: 'fixed', // Positions relative to the viewport
              left: hoverPos.x,
              top: hoverPos.y,
              backgroundColor: isDarkMode ? '#444' : '#fff',
              border: `1px solid ${isDarkMode ? '#666' : '#ccc'}`,
              borderRadius: '5px',
              padding: '10px',
              maxWidth: '300px',
              zIndex: 2000, // Ensures tooltip is on top of other elements
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              color: isDarkMode ? '#fff' : '#333',
              fontSize: '0.85em',
              pointerEvents: 'none', // Allows mouse events to pass through the tooltip
              whiteSpace: 'pre-wrap', // Preserves newlines in the description
            }}
          >
            <strong>{hoveredFunction.label} ({hoveredFunction.functionName})</strong>
            <hr style={{ borderColor: isDarkMode ? '#666' : '#eee', margin: '5px 0' }} />
            <p style={{ margin: 0 }}>{hoveredFunction.description}</p>
          </div>
        )}
      </div>


      {/* --- React Flow Canvas --- */}
      {/* This is the main interactive area where nodes are placed and connected. */}
      <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ flexGrow: 1 }}>
        <ReactFlow
          nodes={themedNodes} // Display nodes with applied themes
          edges={edges}
          onNodesChange={onNodesChange} // Handle node movements, selections, deletions
          onEdgesChange={onEdgesChange} // Handle edge additions/deletions
          onConnect={onConnect} // Handle new connections
          onDrop={onDrop} // Handle dropping new nodes from the palette
          onDragOver={onDragOver} // Allow drag over the canvas
          nodeTypes={nodeTypes} // Register custom node components
          fitView // Automatically fits all nodes into view on load/resize
        >
          <MiniMap style={{ background: backgroundColor }} /> {/* Themed minimap */}
          <Controls style={{ background: backgroundColor, color: textColor }} /> {/* Themed controls */}
          <Background variant="dots" gap={12} size={1} color={isDarkMode ? '#555' : '#aaa'} /> {/* Themed background dots */}
        </ReactFlow>
      </div>
    </div>
  );
}

// --- App Component (Root) ---
// This component simply wraps the Flow component with ReactFlowProvider.
// ReactFlowProvider is necessary to provide the context that React Flow hooks need.
function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

export default App;