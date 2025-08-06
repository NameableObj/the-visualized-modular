import React, { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
} from 'reactflow';

import 'reactflow/dist/style.css';
import './App.css'; // Your custom CSS file

// --- Custom Node Components ---
const nodeTypes = {
  timingNode: ({ data }) => (
    <div className="custom-node" style={{ background: data.nodeColor, color: data.textColor, borderColor: data.borderColor }}>
      {/* Input handle for chaining from previous nodes (e.g., a logic node) */}
      {/* For Timing nodes, the input handle might be optional or represent a condition */}
      <Handle type="target" position={Position.Left} id="input" style={{ background: data.textColor }} isConnectable={false} /> {/* Not connectable by default for a timing start */}
      <strong>{data.label}</strong>
      {data.functionName && <div style={{ fontSize: '0.8em' }}>{data.functionName}</div>}
      {/* Output handle for connecting to subsequent nodes */}
      <Handle type="source" position={Position.Right} id="output" style={{ background: data.textColor }} />
    </div>
  ),
  valueAcquisitionNode: ({ data }) => (
    <div className="custom-node" style={{ background: data.nodeColor, color: data.textColor, borderColor: data.borderColor }}>
      <Handle type="target" position={Position.Left} id="input" style={{ background: data.textColor }} />
      <strong>{data.label}</strong>
      {data.functionName && <div style={{ fontSize: '0.8em' }}>{data.functionName}</div>}
      {/* Example Input Fields - these are placeholders for now */}
      {data.functionName === 'bufcheck' && (
        <>
          <div>Target: <select><option>Self</option><option>Target</option></select></div>
          <div>Buff: <input type="text" placeholder="Keyword" /></div>
          <div>Mode: <select><option>stack</option><option>turn</option></select></div>
        </>
      )}
      {data.functionName === 'getdata' && (
        <>
          <div>Target: <select><option>Self</option><option>Target</option></select></div>
          <div>ID: <input type="text" placeholder="Data ID" /></div>
        </>
      )}
      {data.functionName === 'unitstate' && (
        <div>Target: <select><option>Self</option><option>Target</option></select></div>
      )}
      {data.functionName === 'random' && (
        <>
          <div>Min: <input type="number" placeholder="Min" /></div>
          <div>Max: <input type="number" placeholder="Max" /></div>
        </>
      )}
      <Handle type="source" position={Position.Right} id="output" style={{ background: data.textColor }} />
    </div>
  ),
  consequenceNode: ({ data }) => (
    <div className="custom-node" style={{ background: data.nodeColor, color: data.textColor, borderColor: data.borderColor }}>
      <Handle type="target" position={Position.Left} id="input" style={{ background: data.textColor }} />
      <strong>{data.label}</strong>
      {data.functionName && <div style={{ fontSize: '0.8em' }}>{data.functionName}</div>}
      {/* Example Input Fields - these are placeholders for now */}
      {data.functionName === 'buf' && (
        <>
          <div>Target: <select><option>Self</option><option>Target</option></select></div>
          <div>Buff: <input type="text" placeholder="Keyword" /></div>
          <div>Potency: <input type="number" placeholder="Potency" /></div>
          <div>Count: <input type="number" placeholder="Count" /></div>
          <div>Active Round: <select><option>0</option><option>1</option></select></div>
        </>
      )}
      {data.functionName === 'bonusdmg' && (
        <>
          <div>Target: <select><option>Self</option><option>Target</option></select></div>
          <div>Amount: <input type="text" placeholder="Amount" /></div>
          <div>Dmg Type: <select><option>-1</option><option>0</option></select></div>
          <div>Sin Type: <select><option>0</option><option>1</option></select></div>
        </>
      )}
      {data.functionName === 'setdata' && (
        <>
          <div>Target: <select><option>Self</option><option>Target</option></select></div>
          <div>ID: <input type="text" placeholder="Data ID" /></div>
          <div>Value: <input type="text" placeholder="Value" /></div>
        </>
      )}
      {data.functionName === 'scale' && (
        <>
          <div>Amount: <input type="text" placeholder="Amount" /></div>
          <div>Operator: <select><option>ADD</option><option>SUB</option></select></div>
        </>
      )}
      {data.functionName === 'dmgmult' && (
        <div>Amount: <input type="text" placeholder="Amount" /></div>
      )}
      <Handle type="source" position={Position.Right} id="output" style={{ background: data.textColor }} />
    </div>
  ),
};

// --- Initial Graph Setup ---
// REMOVED THE INITIAL "GlitchScript Start" NODE
const initialNodes = []; // Start with an empty canvas
const initialEdges = [];

// --- Flow Component (Main Logic for React Flow) ---
function Flow() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  const [isDarkMode, setIsDarkMode] = useState(true); // Start in dark mode for prototype image match
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredFunction, setHoveredFunction] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const toggleDarkMode = () => setIsDarkMode((prevMode) => !prevMode);

  // Define colors based on mode
  const backgroundColor = isDarkMode ? '#333333' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#333333';
  const topBarBgColor = isDarkMode ? '#2a2a2a' : '#f0f0f0';
  const topBarBorderColor = isDarkMode ? '#444444' : '#e0e0e0';
  const buttonBgColor = isDarkMode ? '#444' : '#eee';
  const buttonBorderColor = isDarkMode ? '#555' : '#ccc';
  const paletteBgColor = isDarkMode ? '#222' : '#fafafa';
  const paletteBorderColor = isDarkMode ? '#333' : '#e0e0e0';

  // Node specific colors from the prototype image
  const nodeColors = {
    'Timing': isDarkMode ? '#585858' : '#d0e0ff', // Greyish for dark, light blue for light
    'Value Acquisition': isDarkMode ? '#4a698c' : '#a8d8ff', // Darker blue for dark, lighter blue for light
    'Consequence': isDarkMode ? '#8c4a4a' : '#ffb8b8', // Darker red for dark, lighter red for light
    'Value Assignment': isDarkMode ? '#4a8c4a' : '#b8ffb8', // Darker green for dark, lighter green for light
  };

  // Helper function to apply current theme colors and specific node colors to node data
  const getThemedNodeData = useCallback((nodeData) => ({
    ...nodeData,
    textColor: textColor,
    borderColor: isDarkMode ? '#555555' : '#cccccc',
    nodeColor: nodeColors[nodeData.category] || (isDarkMode ? '#585858' : '#d0e0ff'), // Fallback to default timing color
  }), [textColor, isDarkMode, nodeColors]);

  // Apply themed data to all current nodes for consistent rendering
  const themedNodes = nodes.map(node => ({
    ...node,
    data: getThemedNodeData(node.data),
  }));

  // --- Draggable Function Definitions ---
  const availableFunctions = [
    // Timings (Greyish/Light Blue)
    { id: 'timing-roundstart', label: 'Round Start', functionName: 'RoundStart', category: 'Timing', type: 'timingNode', nodeColor: nodeColors.Timing,
      description: 'Triggers at the start of each round.' },
    { id: 'timing-whenuse', label: 'When Use', functionName: 'WhenUse', category: 'Timing', type: 'timingNode', nodeColor: nodeColors.Timing,
      description: 'Triggers when this unit uses a skill. ("Target" becomes the unit BEING HIT, "Self" becomes the unit who USED THE ATTACK)' },
    { id: 'timing-onbreak', label: 'On Break', functionName: 'OnBreak', category: 'Timing', type: 'timingNode', nodeColor: nodeColors.Timing,
      description: 'Triggers when this unit gets staggered. ("Target" becomes the dead unit unless LOOP is involved)' },
    { id: 'timing-endbattle', label: 'End Battle', functionName: 'EndBattle', category: 'Timing', type: 'timingNode', nodeColor: nodeColors.Timing,
      description: 'Triggers at the end of the combat phase.' },
    { id: 'timing-onburst', label: 'On Burst', functionName: 'OnBurst', category: 'Timing', type: 'timingNode', nodeColor: nodeColors.Timing,
      description: 'Triggers when a Tremor Burst occurs.' },
    { id: 'timing-whenhit', label: 'When Hit', functionName: 'WhenHit', category: 'Timing', type: 'timingNode', nodeColor: nodeColors.Timing,
      description: "Triggers when this unit gets hit by an attack. ('Target' becomes the unit BEING HIT, 'Self' becomes the unit who USED THE ATTACK)" },
    { id: 'timing-bwh', label: 'Before When Hit', functionName: 'BWH', category: 'Timing', type: 'timingNode', nodeColor: nodeColors.Timing,
      description: "Triggers before this unit gets hit. ('Target' becomes the unit BEING HIT, 'Self' becomes the unit who USED THE ATTACK)" },

    // Value Acquisition Functions (Blue)
    { id: 'value-bufcheck', label: 'Buff Check', functionName: 'bufcheck', category: 'Value Acquisition', type: 'valueAcquisitionNode', nodeColor: nodeColors['Value Acquisition'],
      description: 'Returns the potency, turns, or product/sum of potency and turns of a buff.\n\nArguments:\nvar_1: See Single-Target (e.g., Self, Target)\nvar_2: Buff keyword (e.g., Enhancement, Agility)\nvar_3: stack | turn | + | *' },
    { id: 'value-getdata', label: 'Get Data', functionName: 'getdata', category: 'Value Acquisition', type: 'valueAcquisitionNode', nodeColor: nodeColors['Value Acquisition'],
      description: 'Retrieves encounter-persistent data from the target.\n\nArguments:\nvar_1: See Multi-Target (e.g., Self, Target)\nvar_2: VALUE_# | any integer (The Data ID)' },
    { id: 'value-round', label: 'Round Number', functionName: 'round', category: 'Value Acquisition', type: 'valueAcquisitionNode', nodeColor: nodeColors['Value Acquisition'],
      description: 'Returns the current round number.' },
    { id: 'value-unitstate', label: 'Unit State', functionName: 'unitstate', category: 'Value Acquisition', type: 'valueAcquisitionNode', nodeColor: nodeColors['Value Acquisition'],
      description: 'Returns the current state of the unit (e.g., 0 for normal, 2 for staggered).\n\nArguments:\nvar_1: See Single-Target (e.g., Self, Target)' },
    { id: 'value-random', label: 'Random Number', functionName: 'random', category: 'Value Acquisition', type: 'valueAcquisitionNode', nodeColor: nodeColors['Value Acquisition'],
      description: 'Generates a random integer within a specified range.\n\nArguments:\nvar_1: Minimum value\nvar_2: Maximum value' },

    // Consequences (Red)
    { id: 'con-buf', label: 'Apply Buff', functionName: 'buf', category: 'Consequence', type: 'consequenceNode', nodeColor: nodeColors.Consequence,
      description: 'Applies a buff to the target.\n\nArguments:\nvar_1: See Multi-Target (e.g., Self, Target)\nvar_2: Buff keyword\nvar_3: Potency\nvar_4: Count\nvar_5: Active Round (0 for current, 1 for next)' },
    { id: 'con-bonusdmg', label: 'Bonus Damage', functionName: 'bonusdmg', category: 'Consequence', type: 'consequenceNode', nodeColor: nodeColors.Consequence,
      description: 'Deals bonus damage.\n\nArguments:\nvar_1: See Multi-Target (e.g., Self, Target)\nvar_2: Damage amount\nvar_3: -1 (true) | 0 (slash) | 1 (pierce) | 2 (blunt)\nvar_4: -1 (true) | 0~6 (sin types)' },
    { id: 'con-setdata', label: 'Set Data', functionName: 'setdata', category: 'Consequence', type: 'consequenceNode', nodeColor: nodeColors.Consequence,
      description: 'Sets encounter-persistent data to the target.\n\nArguments:\nvar_1: See Multi-Target (e.g., Self, Target)\nvar_2: VALUE_# | any integer (The Data ID. Make this unique so it does not conflict with other mods, e.g: Skill ID + 10 or similar)\nvar_3: VALUE_# | any integer (The value to be set)' },
    { id: 'con-endbattle', label: 'End Battle', functionName: 'endbattle', category: 'Consequence', type: 'consequenceNode', nodeColor: nodeColors.Consequence,
      description: 'Ends the current turn\'s battle, skips to next turn.' },
    { id: 'con-scale', label: 'Coin Power', functionName: 'scale', category: 'Consequence', type: 'consequenceNode', nodeColor: nodeColors.Consequence,
      description: 'Gains coin power (similar to vanilla for negative coins).\n\nArguments:\nvar_1: VALUE_# | any integer (Adds or subtracts coin power)\nvar_1: ADD | SUB | MUL (Changes the operatorType of the coins)\nopt_2: any integer (Sets the index of the coin to be affected. 0 means first coin, 4 means fifth coin)' },
    { id: 'con-dmgmult', label: 'Damage Multiplier', functionName: 'dmgmult', category: 'Consequence', type: 'consequenceNode', nodeColor: nodeColors.Consequence,
      description: 'Gains +Damage%.\n\nArguments:\nvar_1: VALUE_# | any integer (Adds or subtracts percentage)' },
    { id: 'con-breakrecover', label: 'Break Recover', functionName: 'breakrecover', category: 'Consequence', type: 'consequenceNode', nodeColor: nodeColors.Consequence,
      description: 'Recovers the unit from the Staggered state.\n\nArguments:\nvar_1: See Single-Target (e.g., Self, Target)' },
  ];

  // Filter functions based on search term and active category
  const filteredFunctions = availableFunctions.filter(func => {
    const matchesSearch = func.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          func.functionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (func.description && func.description.toLowerCase().includes(searchTerm.toLowerCase()));
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
          data: getThemedNodeData(functionData),
          // Handles are now defined within the custom node components (e.g., Handle component)
          // so we don't need sourcePosition/targetPosition here unless it's a default node.
          // For custom nodes, handles are placed manually.
        };

        setNodes((nds) => nds.concat(newNode));
      }
    },
    [screenToFlowPosition, setNodes, getThemedNodeData],
  );

  // --- Tooltip Handlers ---
  const handleMouseEnter = useCallback((event, func) => {
    setHoveredFunction(func);
    setHoverPos({ x: event.clientX + 15, y: event.clientY + 15 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredFunction(null);
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
        flexShrink: 0,
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
            flexGrow: 1,
            maxWidth: '350px',
          }}
        />
      </div>

      {/* --- Draggable Functions Palette --- */}
      <div style={{
        backgroundColor: paletteBgColor,
        borderBottom: `1px solid ${paletteBorderColor}`,
        padding: '10px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        flexShrink: 0,
        color: textColor,
        maxHeight: '120px',
        overflowY: 'auto',
        position: 'relative',
      }}>
        <h3 style={{ width: '100%', margin: '0 0 10px 0', color: textColor }}>Available Functions:</h3>
        {filteredFunctions.map(func => (
          <div
            key={func.id}
            className="dnd-node-palette"
            onDragStart={(event) => onDragStart(event, func.type, func)}
            draggable
            onMouseEnter={(event) => handleMouseEnter(event, func)}
            onMouseLeave={handleMouseLeave}
            style={{
              padding: '8px 15px',
              borderRadius: '5px',
              border: `1px solid ${getThemedNodeData(func).borderColor}`,
              background: getThemedNodeData(func).nodeColor,
              color: getThemedNodeData(func).textColor,
              cursor: 'grab',
              fontSize: '0.9em',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              whiteSpace: 'nowrap',
            }}
          >
            {func.label} ({func.functionName})
          </div>
        ))}

        {/* --- Tooltip Display --- */}
        {hoveredFunction && (
          <div
            style={{
              position: 'fixed',
              left: hoverPos.x,
              top: hoverPos.y,
              backgroundColor: isDarkMode ? '#444' : '#fff',
              border: `1px solid ${isDarkMode ? '#666' : '#ccc'}`,
              borderRadius: '5px',
              padding: '10px',
              maxWidth: '300px',
              zIndex: 2000,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              color: isDarkMode ? '#fff' : '#333',
              fontSize: '0.85em',
              pointerEvents: 'none',
              whiteSpace: 'pre-wrap',
            }}
          >
            <strong>{hoveredFunction.label} ({hoveredFunction.functionName})</strong>
            <hr style={{ borderColor: isDarkMode ? '#666' : '#eee', margin: '5px 0' }} />
            <p style={{ margin: 0 }}>{hoveredFunction.description}</p>
          </div>
        )}
      </div>


      {/* --- React Flow Canvas --- */}
      <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ flexGrow: 1 }}>
        <ReactFlow
          nodes={themedNodes}
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

// --- App Component (Root) ---
function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

export default App;