import React, { useCallback, useState, useRef, useMemo } from 'react'; // Added useMemo import
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
import './App.css';

// --- Custom Node Components ---
const TimingNode = ({ data }) => (
    <div className="custom-node" style={{ background: data.nodeColor, color: data.textColor, borderColor: data.borderColor }}>
      <Handle type="target" position={Position.Left} id="input" style={{ background: data.textColor }} isConnectable={false} />
      <strong>{data.label}</strong>
      {data.functionName && <div style={{ fontSize: '0.8em' }}>{data.functionName}</div>}
      <Handle type="source" position={Position.Right} id="output" style={{ background: data.textColor }} />
    </div>
);

const AssignmentNode = ({ id, data }) => {
  const handleChange = (field) => (event) => {
    data.onDataChange(id, { ...data, [field]: event.target.value });
  };

  return (
    <div className="custom-node" style={{ background: data.nodeColor, color: data.textColor, borderColor: data.borderColor }}>
      <Handle type="target" position={Position.Left} id="input" style={{ background: data.textColor }} />
      <strong>Assign Value</strong>
      <div>
        Variable:&nbsp;
        <select value={data.variable || 'VALUE_0'} onChange={handleChange('variable')}>
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i} value={`VALUE_${i}`}>{`VALUE_${i}`}</option>
          ))}
        </select>
      </div>
      {/* Removed manual function input field */}
      <Handle type="source" position={Position.Right} id="output" style={{ background: data.textColor }} />
    </div>
  );
};

const ValueAcquisitionNode = ({ id, data }) => {
  const handleChange = (field) => (event) => {
    // Use data.onDataChange instead of onDataChange
    data.onDataChange(id, { ...data, [field]: event.target.value });
  };
  
  return (
    <div className="custom-node" style={{ background: data.nodeColor, color: data.textColor, borderColor: data.borderColor }}>
      <Handle type="target" position={Position.Left} id="input" style={{ background: data.textColor }} />
      <strong>{data.label}</strong>
      {data.functionName && <div style={{ fontSize: '0.8em' }}>{data.functionName}</div>}
      
      {data.functionName === 'bufcheck' && (
        <>
          <div>Target: <input type="text" value={data.target || ''} onChange={handleChange('target')} placeholder="Self, Target..." /></div>
          <div>Buff: <input type="text" value={data.buff || ''} onChange={handleChange('buff')} placeholder="Keyword" /></div>
          <div>Mode: <select value={data.mode || 'stack'} onChange={handleChange('mode')}><option>stack</option><option>turn</option></select></div>
        </>
      )}
      {data.functionName === 'getdata' && (
        <>
          <div>Target: <input type="text" value={data.target || ''} onChange={handleChange('target')} placeholder="Self, Target..." /></div>
          <div>ID: <input type="text" value={data.id || ''} onChange={handleChange('id')} placeholder="Data ID" /></div>
        </>
      )}
      {data.functionName === 'unitstate' && (
        <div>Target: <input type="text" value={data.target || ''} onChange={handleChange('target')} placeholder="Self, Target..." /></div>
      )}
      {data.functionName === 'random' && (
        <>
          <div>Min: <input type="number" value={data.min || ''} onChange={handleChange('min')} placeholder="Min" /></div>
          <div>Max: <input type="number" value={data.max || ''} onChange={handleChange('max')} placeholder="Max" /></div>
        </>
      )}
      <Handle type="source" position={Position.Right} id="output" style={{ background: data.textColor }} />
    </div>
  );
};

const ConsequenceNode = ({ id, data, onDataChange }) => {
  const handleChange = (field) => (event) => {
    data.onDataChange(id, { ...data, [field]: event.target.value });
  };
  
  return (
    <div className="custom-node" style={{ background: data.nodeColor, color: data.textColor, borderColor: data.borderColor }}>
      <Handle type="target" position={Position.Left} id="input" style={{ background: data.textColor }} />
      <strong>{data.label}</strong>
      {data.functionName && <div style={{ fontSize: '0.8em' }}>{data.functionName}</div>}
      
      {data.functionName === 'buf' && (
        <>
          <div>Target: <input type="text" value={data.target || ''} onChange={handleChange('target')} placeholder="Self, Target..." /></div>
          <div>Buff: <input type="text" value={data.buff || ''} onChange={handleChange('buff')} placeholder="Keyword" /></div>
          <div>Potency: <input type="number" value={data.potency || ''} onChange={handleChange('potency')} placeholder="Potency" /></div>
          <div>Count: <input type="number" value={data.count || ''} onChange={handleChange('count')} placeholder="Count" /></div>
          <div>Active Round: <select value={data.activeRound || '0'} onChange={handleChange('activeRound')}><option>0</option><option>1</option></select></div>
        </>
      )}
      {data.functionName === 'bonusdmg' && (
        <>
          <div>Target: <input type="text" value={data.target || ''} onChange={handleChange('target')} placeholder="Self, Target..." /></div>
          <div>Amount: <input type="text" value={data.amount || ''} onChange={handleChange('amount')} placeholder="Amount" /></div>
          <div>Dmg Type: <select value={data.dmgType || '-1'} onChange={handleChange('dmgType')}><option>-1</option><option>0</option></select></div>
          <div>Sin Type: <select value={data.sinType || '0'} onChange={handleChange('sinType')}><option>0</option><option>1</option></select></div>
        </>
      )}
      {data.functionName === 'setdata' && (
        <>
          <div>Target: <input type="text" value={data.target || ''} onChange={handleChange('target')} placeholder="Self, Target..." /></div>
          <div>ID: <input type="text" value={data.id || ''} onChange={handleChange('id')} placeholder="Data ID" /></div>
          <div>Value: <input type="text" value={data.value || ''} onChange={handleChange('value')} placeholder="Value" /></div>
        </>
      )}
      {data.functionName === 'scale' && (
        <>
          <div>Amount: <input type="text" value={data.amount || ''} onChange={handleChange('amount')} placeholder="Amount" /></div>
          <div>Operator: <select value={data.operator || 'ADD'} onChange={handleChange('operator')}><option>ADD</option><option>SUB</option></select></div>
        </>
      )}
      {data.functionName === 'dmgmult' && (
        <div>Amount: <input type="text" value={data.amount || ''} onChange={handleChange('amount')} placeholder="Amount" /></div>
      )}
      {data.functionName === 'breakrecover' && (
        <div>Target: <input type="text" value={data.target || ''} onChange={handleChange('target')} placeholder="Self, Target..." /></div>
      )}
      <Handle type="source" position={Position.Right} id="output" style={{ background: data.textColor }} />
    </div>
  );
};

const IfNode = ({ id, data, onDataChange }) => {
  const handleChange = (field) => (event) => {
    data.onDataChange(id, { ...data, [field]: event.target.value });
  };
  
  return (
    <div className="custom-node" style={{ background: data.nodeColor, color: data.textColor, borderColor: data.borderColor }}>
      <Handle type="target" position={Position.Left} id="input" style={{ background: data.textColor }} />
      <strong>IF</strong>
      <div>
        Condition: <input type="text" value={data.condition || ''} onChange={handleChange('condition')} placeholder="VALUE_0=1" />
      </div>
      <Handle type="source" position={Position.Right} id="true" style={{ top: '35%', background: 'green' }} />
      <Handle type="source" position={Position.Right} id="false" style={{ top: '65%', background: 'red' }} />
    </div>
  );
};

const nodeTypes = {
  timingNode: TimingNode,
  valueAcquisitionNode: ValueAcquisitionNode,
  consequenceNode: ConsequenceNode,
  ifNode: IfNode, // Add the new IF node type
  assignmentNode: AssignmentNode
};

// --- Initial Graph Setup ---
const initialNodes = [];
const initialEdges = [];

function Flow() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  // FIX: Added setEdges to dependency array for onConnect
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeDataChange = useCallback((id, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: newData };
        }
        return node;
      })
    );
  }, [setNodes]);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredFunction, setHoveredFunction] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [showExportModal, setShowExportModal] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');

  const toggleDarkMode = () => setIsDarkMode((prevMode) => !prevMode);

  // FIX: Memoized nodeColors object so it doesn't change on every render
  const nodeColors = useMemo(() => ({
    'Timing': isDarkMode ? '#585858' : '#d0e0ff',
    'Value Acquisition': isDarkMode ? '#4a698c' : '#a8d8ff',
    'Consequence': isDarkMode ? '#8c4a4a' : '#ffb8b8',
    'Conditional': isDarkMode ? '#8a8a4a' : '#ffffb8',
    'Value Assignment': isDarkMode ? '#4a8c4a' : '#b8ffb8',
  }), [isDarkMode]); // Only recreate when isDarkMode changes

  // Define colors based on mode
  const backgroundColor = isDarkMode ? '#333333' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#333333';
  const topBarBgColor = isDarkMode ? '#2a2a2a' : '#f0f0f0';
  const topBarBorderColor = isDarkMode ? '#444444' : '#e0e0e0';
  const buttonBgColor = isDarkMode ? '#444' : '#eee';
  const buttonBorderColor = isDarkMode ? '#555' : '#ccc';
  const paletteBgColor = isDarkMode ? '#222' : '#fafafa';
  const paletteBorderColor = isDarkMode ? '#333' : '#e0e0e0';

  // Helper function to apply current theme colors and specific node colors to node data
  // FIX: Ensured dependencies are correct for useCallback
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

  const availableFunctions = [
    { id: 'timing-roundstart', label: 'Round Start', functionName: 'RoundStart', category: 'Timing', type: 'timingNode', nodeColor: nodeColors.Timing, description: 'Triggers at the start of each round.' },
    { id: 'timing-whenuse', label: 'When Use', functionName: 'WhenUse', category: 'Timing', type: 'timingNode', nodeColor: nodeColors.Timing, description: 'Triggers when this unit uses a skill.' },
    { id: 'value-bufcheck', label: 'Buff Check', functionName: 'bufcheck', category: 'Value Acquisition', type: 'valueAcquisitionNode', nodeColor: nodeColors['Value Acquisition'], description: 'Returns a buff\'s potency or turns.' },
    { id: 'value-getdata', label: 'Get Data', functionName: 'getdata', category: 'Value Acquisition', type: 'valueAcquisitionNode', nodeColor: nodeColors['Value Acquisition'], description: 'Retrieves encounter-persistent data.' },
    { id: 'value-random', label: 'Random Number', functionName: 'random', category: 'Value Acquisition', type: 'valueAcquisitionNode', nodeColor: nodeColors['Value Acquisition'], description: 'Generates a random integer.' },
    { id: 'con-buf', label: 'Apply Buff', functionName: 'buf', category: 'Consequence', type: 'consequenceNode', nodeColor: nodeColors.Consequence, description: 'Applies a buff to the target.' },
    { id: 'con-bonusdmg', label: 'Bonus Damage', functionName: 'bonusdmg', category: 'Consequence', type: 'consequenceNode', nodeColor: nodeColors.Consequence, description: 'Deals bonus damage.' },
    { id: 'con-setdata', label: 'Set Data', functionName: 'setdata', category: 'Consequence', type: 'consequenceNode', nodeColor: nodeColors.Consequence, description: 'Sets encounter-persistent data.' },
    { id: 'con-if', label: 'IF', functionName: 'IF', category: 'Conditional', type: 'ifNode', nodeColor: nodeColors['Conditional'], description: 'Conditionally executes a script based on a value.' },
    { id: 'assign-value', label: 'Assign Value',functionName: 'assign', category: 'Value Assignment', type: 'assignmentNode', nodeColor: nodeColors['Value Assignment'],description: 'Assigns the result of a function to VALUE_0~VALUE_9 for later use.',
  }
  ];

  const filteredFunctions = availableFunctions.filter(func => {
    const matchesSearch = func.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          func.functionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (func.description && func.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = activeCategory === 'All' || func.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
        };

        setNodes((nds) => nds.concat(newNode));
      }
    },
    [screenToFlowPosition, setNodes, getThemedNodeData],
  );

  const handleMouseEnter = useCallback((event, func) => {
    setHoveredFunction(func);
    setHoverPos({ x: event.clientX + 15, y: event.clientY + 15 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredFunction(null);
  }, []);

  const generateScript = useCallback(() => {
    let script = "Modular/";
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const edgeMap = new Map();
    edges.forEach(edge => {
      const sourceKey = `${edge.source}-${edge.sourceHandle}`;
      if (!edgeMap.has(sourceKey)) {
        edgeMap.set(sourceKey, []);
      }
      edgeMap.get(sourceKey).push(edge);
    });

    const timingNode = nodes.find(node => node.type === 'timingNode');
    if (!timingNode) {
      setGeneratedScript("Error: A GlitchScript must start with a Timing node.");
      setShowExportModal(true);
      return;
    }

    script += `TIMING:${timingNode.data.functionName}/`;

    const generatedVariables = new Map();
    let variableCounter = 0;

    const traverseGraph = (startNodeId) => {
  let subScript = '';
  const visited = new Set();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node || node.type === 'timingNode') continue;

    // --- INSERT THIS BLOCK HERE ---
    if (node.type === 'assignmentNode') {
  // Find the output edge (should be only one for assignment)
  const outputEdge = edges.find(edge => edge.source === node.id);
  let assignedValue = node.data.variable || 'VALUE_0';
  let assignedScript = '';

  let realTargetNode = null;
  if (outputEdge) {
    let candidateNode = nodeMap.get(outputEdge.target);
    // Walk forward if the candidate is a timing node (shouldn't happen, but for safety)
    while (candidateNode && candidateNode.type === 'timingNode') {
      const nextEdge = edges.find(e => e.source === candidateNode.id);
      if (!nextEdge) break;
      candidateNode = nodeMap.get(nextEdge.target);
    }
    realTargetNode = candidateNode;
  }

  if (realTargetNode) {
    let funcCall = '';
    let args = [];
    if (realTargetNode.data.functionName === 'bufcheck') {
      args = [realTargetNode.data.target, realTargetNode.data.buff, realTargetNode.data.mode];
    } else if (realTargetNode.data.functionName === 'getdata') {
      args = [realTargetNode.data.target, realTargetNode.data.id];
    } else if (realTargetNode.data.functionName === 'random') {
      args = [realTargetNode.data.min, realTargetNode.data.max];
    }
    // ...add other functionName cases as needed

    const formattedArgs = args.filter(arg => arg !== undefined && arg !== null).join(',');
    funcCall = `${realTargetNode.data.functionName}(${formattedArgs})`;
    assignedScript = `${assignedValue}:${funcCall}/`;
  }

  subScript += assignedScript;

  // Continue to next node(s)
  const nextEdges = edgeMap.get(`${node.id}-output`) || [];
  nextEdges.forEach(edge => {
    if (!visited.has(edge.target)) {
      queue.push(edge.target);
    }
  });
  continue; // Prevents further processing for this node
}
    // --- END OF INSERTED BLOCK ---

    if (node.type === 'ifNode') {
      subScript += `IF(${node.data.condition}):`;

      const trueEdges = edgeMap.get(`${node.id}-true`) || [];
      if (trueEdges.length > 0) {
        subScript += traverseGraph(trueEdges[0].target);
      }
      subScript += '/';
    } else {
      let functionCall = node.data.functionName;
      let args = [];
      if (node.data.functionName === 'bufcheck') {
        args = [node.data.target, node.data.buff, node.data.mode];
      } else if (node.data.functionName === 'getdata') {
        args = [node.data.target, node.data.id];
      } else if (node.data.functionName === 'unitstate') {
        args = [node.data.target];
      } else if (node.data.functionName === 'random') {
        args = [node.data.min, node.data.max];
        const varName = `VALUE_${variableCounter++}`;
        generatedVariables.set(node.id, varName);
        functionCall = `${varName}:${functionCall}`;
      } else if (node.data.functionName === 'buf') {
        args = [node.data.target, node.data.buff, node.data.potency, node.data.count, node.data.activeRound];
      } else if (node.data.functionName === 'bonusdmg') {
        args = [node.data.target, node.data.amount, node.data.dmgType, node.data.sinType];
      } else if (node.data.functionName === 'setdata') {
        args = [node.data.target, node.data.id, node.data.value];
      } else if (node.data.functionName === 'scale') {
        args = [node.data.amount, node.data.operator];
      } else if (node.data.functionName === 'dmgmult') {
        args = [node.data.amount];
      } else if (node.data.functionName === 'breakrecover') {
        args = [node.data.target];
      }

      // Replace arguments with variable names if a connection exists
      const inputEdges = edges.filter(edge => edge.target === node.id);
      inputEdges.forEach(edge => {
        const varName = generatedVariables.get(edge.source);
        if (varName) {
          const argIndex = ['random'].includes(node.data.functionName) ? 0 : 0; // Simplified for now
          args[argIndex] = varName;
        }
      });

      // Filter out undefined/null arguments
      const formattedArgs = args.filter(arg => arg !== undefined && arg !== null).join(',');
      subScript += `${functionCall}(${formattedArgs})/`;
    }

    const nextEdges = edgeMap.get(`${node.id}-output`) || [];
    nextEdges.forEach(edge => {
      if (!visited.has(edge.target)) {
        queue.push(edge.target);
      }
    });
  }
  return subScript;
};
    
    // Start traversal from the timing node's output
    const startEdges = edgeMap.get(`${timingNode.id}-output`) || [];
    if (startEdges.length > 0) {
        script += traverseGraph(startEdges[0].target);
    }

    setGeneratedScript(script);
    setShowExportModal(true);
  }, [nodes, edges, setNodes, onNodeDataChange]);

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
        <h2 style={{ margin: 0, fontSize: '1.2em' }}>Modular Visualized</h2>

        {/* Dark Mode Toggle Button */}
        <button onClick={toggleDarkMode} style={{ padding: '6px 12px', borderRadius: '5px', border: `1px solid ${buttonBorderColor}`, background: buttonBgColor, color: textColor, cursor: 'pointer', fontSize: '0.9em' }}>
          {isDarkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
        </button>

        {/* Category Filter Buttons */}
        <div style={{ display: 'flex', gap: '5px' }}>
           {['All', 'Timing', 'Value Acquisition', 'Consequence', 'Conditional', 'Value Assignment'].map(category => (
           <button key={category} onClick={() => setActiveCategory(category)} style={{ padding: '6px 12px', borderRadius: '5px', border: `1px solid ${buttonBorderColor}`, background: activeCategory === category ? (isDarkMode ? '#555' : '#ddd') : buttonBgColor, color: textColor, cursor: 'pointer', fontSize: '0.9em' }}>
               {category}
           </button>
         ))}
        </div>

        {/* Search Bar */}
        <input type="text" placeholder="Search functions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '6px 10px', borderRadius: '5px', border: `1px solid ${buttonBorderColor}`, background: isDarkMode ? '#333' : '#fff', color: textColor, fontSize: '0.9em', flexGrow: 1, maxWidth: '350px' }}/>

        {/* --- EXPORT SCRIPT BUTTON --- */}
        <button onClick={generateScript} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#4CAF50', color: 'white', cursor: 'pointer', fontSize: '1em', fontWeight: 'bold', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', marginLeft: 'auto' }}>
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
          nodes={themedNodes.map(node => ({ ...node, data: { ...node.data, onDataChange: onNodeDataChange } }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div style={{ backgroundColor: isDarkMode ? '#2a2a2a' : '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)', maxWidth: '600px', width: '90%', color: textColor, position: 'relative' }}>
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
            <button onClick={() => { const textArea = document.createElement('textarea'); textArea.value = generatedScript; document.body.appendChild(textArea); textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea); }} style={{ padding: '10px 15px', borderRadius: '5px', border: 'none', background: '#007bff', color: 'white', cursor: 'pointer', marginTop: '15px', marginRight: '10px' }}>
              Copy to Clipboard
            </button>
            <button onClick={() => setShowExportModal(false)} style={{ padding: '10px 15px', borderRadius: '5px', border: 'none', background: '#dc3545', color: 'white', cursor: 'pointer', marginTop: '15px' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

export default App;
