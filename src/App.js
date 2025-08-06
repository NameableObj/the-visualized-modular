import React, { useCallback, useState, useRef, useMemo } from 'react';
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
const CustomNode = ({ id, data, type, setNodes }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, [name]: value } } : node
      )
    );
  };

  // Reusable Target Input with Datalist for flexible input
  const TargetInput = ({ name, value }) => (
    <div>
      Target:
      <input
        list="target-options"
        name={name}
        value={value || ''} // Ensure value is always a string
        onChange={handleChange}
        placeholder="Self, Target, MainTarget..."
      />
      <datalist id="target-options">
        <option value="Self" />
        <option value="SelfCore" />
        <option value="Target" />
        <option value="TargetCore" />
        <option value="MainTarget" />
        <option value="EveryTarget" />
        <option value="id#####" />
        <option value="inst#####" />
        <option value="adjLeft" />
        <option value="adjRight" />
        <option value="Enemy" />
        <option value="Ally" />
      </datalist>
    </div>
  );

  const renderInputs = () => {
    switch (data.functionName) {
      case 'bufcheck':
        return (
          <>
            <TargetInput name="var1" value={data.var1} />
            <div>Buff: <input type="text" name="var2" value={data.var2 || ''} onChange={handleChange} placeholder="Keyword" /></div>
            <div>Mode: <select name="var3" value={data.var3 || 'stack'} onChange={handleChange}><option>stack</option><option>turn</option><option>+</option><option>*</option></select></div>
          </>
        );
      case 'getdata':
        return (
          <>
            <TargetInput name="var1" value={data.var1} />
            <div>ID: <input type="text" name="var2" value={data.var2 || ''} onChange={handleChange} placeholder="Data ID" /></div>
          </>
        );
      case 'unitstate':
        return (
          <TargetInput name="var1" value={data.var1} />
        );
      case 'random':
        return (
          <>
            <div>Min: <input type="number" name="var1" value={data.var1 || ''} onChange={handleChange} placeholder="Min" /></div>
            <div>Max: <input type="number" name="var2" value={data.var2 || ''} onChange={handleChange} placeholder="Max" /></div>
          </>
        );
      case 'buf':
        return (
          <>
            <TargetInput name="var1" value={data.var1} />
            <div>Buff: <input type="text" name="var2" value={data.var2 || ''} onChange={handleChange} placeholder="Keyword" /></div>
            <div>Potency: <input type="number" name="var3" value={data.var3 || ''} onChange={handleChange} placeholder="Potency" /></div>
            <div>Count: <input type="number" name="var4" value={data.var4 || ''} onChange={handleChange} placeholder="Count" /></div>
            <div>Active Round: <select name="var5" value={data.var5 || '0'} onChange={handleChange}><option>0</option><option>1</option></select></div>
          </>
        );
      case 'bonusdmg':
        return (
          <>
            <TargetInput name="var1" value={data.var1} />
            <div>Amount: <input type="text" name="var2" value={data.var2 || ''} onChange={handleChange} placeholder="Amount" /></div>
            <div>Dmg Type: <select name="var3" value={data.var3 || '-1'} onChange={handleChange}><option value="-1">True</option><option value="0">Slash</option><option value="1">Pierce</option><option value="2">Blunt</option></select></div>
            <div>Sin Type: <select name="var4" value={data.var4 || '0'} onChange={handleChange}><option value="0">Wrath</option><option value="1">Lust</option><option value="2">Sloth</option><option value="3">Gluttony</option><option value="4">Envy</option><option value="5">Pride</option><option value="6">Greed</option></select></div>
          </>
        );
      case 'setdata':
        return (
          <>
            <TargetInput name="var1" value={data.var1} />
            <div>ID: <input type="text" name="var2" value={data.var2 || ''} onChange={handleChange} placeholder="Data ID" /></div>
            <div>Value: <input type="text" name="var3" value={data.var3 || ''} onChange={handleChange} placeholder="Value" /></div>
          </>
        );
      case 'scale':
        return (
          <>
            <TargetInput name="var1" value={data.var1} />
            <div>Amount: <input type="text" name="var2" value={data.var2 || ''} onChange={handleChange} placeholder="Amount" /></div>
            <div>Operator: <select name="var2" value={data.var2 || 'ADD'} onChange={handleChange}><option>ADD</option><option>SUB</option><option>MUL</option></select></div>
            <div>Coin Index (opt): <input type="number" name="var3" value={data.var3 || ''} onChange={handleChange} placeholder="0-4" /></div>
          </>
        );
      case 'dmgmult':
        return (
          <div>Amount: <input type="text" name="var1" value={data.var1 || ''} onChange={handleChange} placeholder="Amount" /></div>
        );
      case 'breakrecover':
        return (
          <TargetInput name="var1" value={data.var1} />
        );
      default:
        return null;
    }
  };

  const isTimingNode = type === 'timingNode';
  const hasInputHandle = !isTimingNode;
  const hasOutputHandle = true;

  return (
    <div className="custom-node" style={{ background: data.nodeColor, color: data.textColor, borderColor: data.borderColor }}>
      {hasInputHandle && <Handle type="target" position={Position.Left} id="input" style={{ background: data.textColor }} />}
      <strong>{data.label}</strong>
      {data.functionName && <div style={{ fontSize: '0.8em' }}>{data.functionName}</div>}
      {renderInputs()}
      {hasOutputHandle && <Handle type="source" position={Position.Right} id="output" style={{ background: data.textColor }} />}
    </div>
  );
};


// --- Initial Graph Setup ---
const initialNodes = [];
const initialEdges = [];

// --- Flow Component (Main Logic for React Flow) ---
function Flow() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredFunction, setHoveredFunction] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const [showExportModal, setShowExportModal] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');

  const toggleDarkMode = () => setIsDarkMode((prevMode) => !prevMode);

  // FIX: Memoize nodeColors object so it doesn't change on every render
  const nodeColors = useMemo(() => ({
    'Timing': isDarkMode ? '#585858' : '#d0e0ff',
    'Value Acquisition': isDarkMode ? '#4a698c' : '#a8d8ff',
    'Consequence': isDarkMode ? '#8c4a4a' : '#ffb8b8',
    'Value Assignment': isDarkMode ? '#4a8c4a' : '#b8ffb8',
  }), [isDarkMode]); // Only recreate when isDarkMode changes

  // Define colors based on mode (moved inside Flow to be in scope)
  const backgroundColor = isDarkMode ? '#333333' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#333333';
  const topBarBgColor = isDarkMode ? '#2a2a2a' : '#f0f0f0';
  const topBarBorderColor = isDarkMode ? '#444444' : '#e0e0e0';
  const buttonBgColor = isDarkMode ? '#444' : '#eee';
  const buttonBorderColor = isDarkMode ? '#555' : '#ccc';
  const paletteBgColor = isDarkMode ? '#222' : '#fafafa';
  const paletteBorderColor = isDarkMode ? '#333' : '#e0e0e0';

  // Helper function to apply current theme colors and specific node colors to node data
  const getThemedNodeData = useCallback((nodeData) => ({
    ...nodeData,
    textColor: textColor,
    borderColor: isDarkMode ? '#555555' : '#cccccc',
    nodeColor: nodeColors[nodeData.category] || (isDarkMode ? '#585858' : '#d0e0ff'),
  }), [textColor, isDarkMode, nodeColors]); // nodeColors is now a stable dependency

  // Apply themed data to all current nodes for consistent rendering
  const themedNodes = nodes.map(node => ({
    ...node,
    data: getThemedNodeData(node.data),
  }));

  // --- Draggable Function Definitions ---
  const availableFunctions = [
    // Timings
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

    // Value Acquisition Functions
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

    // Consequences
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

        // Initialize all potential varX properties to empty strings when creating a new node
        const initialVars = {};
        for (let i = 1; i <= 5; i++) { // Assuming max 5 args
            initialVars[`var${i}`] = '';
        }

        const newNode = {
          id: newNodeId,
          type: nodeType,
          position,
          data: {
            ...getThemedNodeData(functionData), // Apply theme data
            ...initialVars, // Add initialized varX properties
          },
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

  // --- Script Generation Logic (Now with basic graph traversal and argument extraction) ---
  const generateScript = useCallback(() => {
    let script = "Modular/";
    const visitedNodes = new Set();
    const queue = [];
    let currentVarIndex = 0; // To assign VALUE_0, VALUE_1 etc.

    // 1. Find the starting Timing node(s)
    const timingNodes = nodes.filter(node => node.type === 'timingNode');

    if (timingNodes.length === 0) {
      setGeneratedScript("Error: No Timing node found. A GlitchScript must start with a Timing node.");
      setShowExportModal(true);
      return;
    }

    // For simplicity, we'll start with the first timing node found.
    const startNode = timingNodes[0];
    queue.push(startNode.id);
    visitedNodes.add(startNode.id);

    script += `TIMING:${startNode.data.functionName}/`;

    // 2. Traverse the graph (Breadth-First Search for simplicity)
    while (queue.length > 0) {
      const nodeId = queue.shift(); // Get the next node to process
      const currentNode = nodes.find(n => n.id === nodeId);

      if (!currentNode || currentNode.id === startNode.id) continue;

      // Process the current node's function and arguments
      let functionString = currentNode.data.functionName;
      const args = [];

      // Collect arguments (var1, var2, etc.) from node.data
      const argNames = ['var1', 'var2', 'var3', 'var4', 'var5']; // Max 5 args for now
      for (const argName of argNames) {
          // Only add argument if it's not empty
          if (currentNode.data[argName] !== undefined && currentNode.data[argName] !== null && currentNode.data[argName] !== '') {
              args.push(currentNode.data[argName]);
          }
      }

      // If it's a value acquisition node, assign it to a VALUE_X
      if (currentNode.type === 'valueAcquisitionNode') {
        functionString = `VALUE_${currentVarIndex}:${functionString}`;
        currentVarIndex++;
      }

      if (args.length > 0) {
        functionString += `(${args.join(',')})`;
      }

      script += `${functionString}/`;


      // Find connected nodes (children)
      const outgoingEdges = edges.filter(edge => edge.source === currentNode.id);
      outgoingEdges.forEach(edge => {
        if (!visitedNodes.has(edge.target)) {
          queue.push(edge.target);
          visitedNodes.add(edge.target);
        }
      });
    }

    setGeneratedScript(script);
    setShowExportModal(true);
  }, [nodes, edges]);


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

        {/* --- EXPORT SCRIPT BUTTON --- */}
        <button
          onClick={generateScript}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#4CAF50', // Green for export
            color: 'white',
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: 'bold',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            marginLeft: 'auto', // Push to the right
          }}
        >
          Export Script
        </button>
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
          // FIX: Define the nodeTypes map directly here within the Flow component's scope
          nodeTypes={Object.keys(customNodeTypesMap).reduce((acc, key) => {
            acc[key] = (props) => <CustomNode {...props} type={key} setNodes={setNodes} />;
            return acc;
          }, {})}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <MiniMap style={{ background: backgroundColor }} />
          <Controls style={{ background: backgroundColor, color: textColor }} />
          <Background variant="dots" gap={12} size={1} color={isDarkMode ? '#555' : '#aaa'} />
        </ReactFlow>
      </div>

      {/* --- Export Modal/Overlay --- */}
      {showExportModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 3000,
          }}
        >
          <div
            style={{
              backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
              padding: '25px',
              borderRadius: '10px',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
              maxWidth: '600px',
              width: '90%',
              color: textColor,
              position: 'relative',
            }}
          >
            <h3 style={{ marginTop: 0, color: textColor }}>Generated GlitchScript</h3>
            <textarea
              readOnly
              value={generatedScript}
              style={{
                width: '100%',
                height: '200px',
                padding: '10px',
                borderRadius: '5px',
                border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`,
                backgroundColor: isDarkMode ? '#1a1a1a' : '#eee',
                color: isDarkMode ? '#fff' : '#333',
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
            />
            <button
              onClick={() => {
                const textArea = document.createElement('textarea');
                textArea.value = generatedScript;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                  document.execCommand('copy');
                  console.log('Script copied to clipboard!');
                } catch (err) {
                  console.error('Failed to copy text: ', err);
                }
                document.body.removeChild(textArea);
              }}
              style={{
                padding: '10px 15px',
                borderRadius: '5px',
                border: 'none',
                background: '#007bff',
                color: 'white',
                cursor: 'pointer',
                marginTop: '15px',
                marginRight: '10px',
              }}
            >
              Copy to Clipboard
            </button>
            <button
              onClick={() => setShowExportModal(false)}
              style={{
                padding: '10px 15px',
                borderRadius: '5px',
                border: 'none',
                background: '#dc3545',
                color: 'white',
                cursor: 'pointer',
                marginTop: '15px',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
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