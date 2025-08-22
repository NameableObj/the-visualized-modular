import React, { useCallback, useState, useRef, useMemo } from 'react'; // Added useMemo import
import { DndProvider, useDrop, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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
const TimingNode = ({ id, data }) => {
  const handleChange = (field) => (event) => {
    data.onDataChange(id, { ...data, [field]: event.target.value });
  };

  const handleParamChange = (paramName) => (event) => {
  const updatedParams = { ...(data.parameters || {}), [paramName]: event.target.value };
  data.onDataChange(id, { ...data, parameters: updatedParams });
};

  return (
    <div className="custom-node" style={{ background: data.nodeColor, color: data.textColor, borderColor: data.borderColor }}>
      <Handle type="target" position={Position.Left} id="input" style={{ background: data.textColor }} isConnectable={false} />
      <strong>{data.label}</strong>
      {data.functionName && <div style={{ fontSize: '0.8em' }}>{data.functionName}</div>}
      
      {/* Render parameters for parameterized timing functions */}
      {data.hasParameters && data.parameters && (
        <div style={{ marginTop: '10px' }}>
          {data.functionName === 'OnSucceedAttack' || data.functionName === 'BeforeSA' || 
           data.functionName === 'WhenHit' || data.functionName === 'BeforeWhenHit' ? (
            <>
              <div>
                First Argument:
                <select 
                  value={data.parameters.var_1 || 'None'} 
                  onChange={handleParamChange('var_1')}
                  style={{ marginLeft: '5px' }}
                >
                  <option value="Head">Head</option>
                  <option value="Tail">Tail</option>
                  <option value="None">None</option>
                </select>
              </div>
              <div>
                Second Argument:
                <select 
                  value={data.parameters.var_2 || 'None'} 
                  onChange={handleParamChange('var_2')}
                  style={{ marginLeft: '5px' }}
                >
                  <option value="Crit">Crit</option>
                  <option value="NoCrit">NoCrit</option>
                  <option value="None">None</option>
                </select>
              </div>
            </>
          ) : null}
        </div>
      )}
      
      <Handle type="source" position={Position.Right} id="output" style={{ background: data.textColor }} />
    </div>
  );
};

const AssignmentNode = ({ id, data }) => {
  const handleChange = (field) => (event) => {
    data.onDataChange(id, { ...data, [field]: event.target.value });
  };

  // Render the embedded value node
  const renderEmbeddedNode = () => {
    if (!data.assignedNodeData) return null;

    return (
      <div style={{
        padding: '8px',
        background: data.assignedNodeData.nodeColor,
        borderRadius: '3px',
        margin: '4px 0'
      }}>
        <strong>{data.assignedNodeData.label}</strong>
        {data.assignedNodeData.functionName === 'bufcheck' && (
          <>
            <div>Target: <input type="text" value={data.assignedNodeData.target || ''} 
              onChange={e => data.onDataChange(id, { 
                ...data, 
                assignedNodeData: { ...data.assignedNodeData, target: e.target.value }
              })} 
              placeholder="Self, Target..." />
            </div>
            <div>Buff: <input type="text" value={data.assignedNodeData.buff || ''} 
              onChange={e => data.onDataChange(id, {
                ...data,
                assignedNodeData: { ...data.assignedNodeData, buff: e.target.value }
              })}
              placeholder="Keyword" />
            </div>
            <div>Mode: 
              <select value={data.assignedNodeData.mode || 'stack'}
                onChange={e => data.onDataChange(id, {
                  ...data,
                  assignedNodeData: { ...data.assignedNodeData, mode: e.target.value }
                })}>
                <option>stack</option>
                <option>turn</option>
              </select>
            </div>
          </>
        )}
        {/* Add similar blocks for other function types */}
      </div>
    );
  };

  return (
    <div className="custom-node" style={{ 
      background: data.nodeColor, 
      color: data.textColor, 
      borderColor: data.borderColor,
      padding: '10px',
      borderRadius: '5px',
      minWidth: '200px'
    }}>
      <Handle type="target" position={Position.Left} id="input" style={{ background: data.textColor }} />
      <strong>Assign Value</strong>
      
      <div style={{ margin: '10px 0' }}>
        <label>
          Variable:&nbsp;
          <select value={data.variable || 'VALUE_0'} onChange={handleChange('variable')}>
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i} value={`VALUE_${i}`}>{`VALUE_${i}`}</option>
            ))}
          </select>
        </label>
      </div>

      <div
      className="assignment-slot"
  onDrop={event => {
    event.preventDefault();
    event.stopPropagation(); // Stop event from reaching the canvas
    const transfer = event.dataTransfer.getData('application/reactflow');
    if (transfer) {
      const { nodeType, functionData } = JSON.parse(transfer);
      if (nodeType === 'valueAcquisitionNode') {
        data.onDataChange(id, { 
          ...data, 
          assignedNodeData: functionData 
        });
      }
    }
  }}
  onDragOver={e => {
    e.preventDefault();
    e.stopPropagation(); // Stop event from reaching the canvas
  }}
        style={{
          border: '2px dashed #888',
          padding: '10px',
          margin: '10px 0',
          borderRadius: '5px',
          background: data.assignedNodeData ? '#e0ffe0' : 'rgba(0,0,0,0.05)',
          minHeight: '50px',
        }}
      >
        {data.assignedNodeData ? renderEmbeddedNode() : 'Drop a value node here'}
      </div>

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
  'Skill Timing': isDarkMode ? '#585858' : '#d0e0ff',
  'Passive Timing': isDarkMode ? '#686868' : '#e0f0ff',
  'Value Acquisition': isDarkMode ? '#4a698c' : '#a8d8ff',
  'Consequence': isDarkMode ? '#8c4a4a' : '#ffb8b8',
  'Conditional': isDarkMode ? '#8a8a4a' : '#ffffb8',
  'Value Assignment': isDarkMode ? '#4a8c4a' : '#b8ffb8',
}), [isDarkMode]);

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
    { 
    id: 'timing-roundstart', 
    label: 'Round Start', 
    functionName: 'RoundStart', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '[Turn Start] - Runs if the skill is in the bottom 2 slots of the dashboard' 
  },
  { 
    id: 'timing-startbattle', 
    label: 'Start Battle', 
    functionName: 'StartBattle', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '[Combat Start]' 
  },
  { 
    id: 'timing-endbattle', 
    label: 'End Battle', 
    functionName: 'EndBattle', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '[Turn End]' 
  },
  { 
    id: 'timing-whenuse', 
    label: 'When Use', 
    functionName: 'WhenUse', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '[On Use]' 
  },
  { 
    id: 'timing-beforeattack', 
    label: 'Before Attack', 
    functionName: 'BeforeAttack', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '[Before Attack]' 
  },
  { 
    id: 'timing-beforeuse', 
    label: 'Before Use', 
    functionName: 'BeforeUse', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '[Before Use]' 
  },
  { 
    id: 'timing-duelclash', 
    label: 'Duel Clash', 
    functionName: 'DuelClash', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: 'Clash Count - Triggers On Each Individual Clash in a Duel (Clash)' 
  },
  { 
    id: 'timing-duelclashafter', 
    label: 'Duel Clash After', 
    functionName: 'DuelClashAfter', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: 'Clash Count - Triggers On Each Individual Clash in a Duel (Clash) (Difference between this and DuelClash are unknown)' 
  },
  { 
    id: 'timing-startduel', 
    label: 'Start Duel', 
    functionName: 'StartDuel', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '[Clash Start]' 
  },
  { 
    id: 'timing-winduel', 
    label: 'Win Duel', 
    functionName: 'WinDuel', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '[Clash Win]' 
  },
  { 
    id: 'timing-defeatduel', 
    label: 'Defeat Duel', 
    functionName: 'DefeatDuel', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '[Clash Lose]' 
  },
  { 
    id: 'timing-endskill', 
    label: 'End Skill', 
    functionName: 'EndSkill', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '[After Attack] - Bugged' 
  },
  { 
    id: 'timing-onsucceedevade', 
    label: 'On Succeed Evade', 
    functionName: 'OnSucceedEvade', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '[On Evade]' 
  },
  { 
    id: 'timing-ondefeatevade', 
    label: 'On Defeat Evade', 
    functionName: 'OnDefeatEvade', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '[Failed Evade]' 
  },
  { 
    id: 'timing-ondiscard', 
    label: 'On Discard', 
    functionName: 'OnDiscard', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '"if this Skill is Discarded" at the end of the line' 
  },
  { 
    id: 'timing-beforebehaviour', 
    label: 'Before Behaviour', 
    functionName: 'BeforeBehaviour', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '[Before Use]' 
  },
  { 
    id: 'timing-onstartbehaviour', 
    label: 'On Start Behaviour', 
    functionName: 'OnStartBehaviour', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '[On Use]' 
  },
  { 
    id: 'timing-onendbehaviour', 
    label: 'On End Behaviour', 
    functionName: 'OnEndBehaviour', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '[After Attack]' 
  },
  { 
    id: 'timing-enemykill', 
    label: 'Enemy Kill', 
    functionName: 'EnemyKill', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: '[On Kill]' 
  },
  { 
    id: 'timing-startvisualskilluse', 
    label: 'Start Visual Skill Use', 
    functionName: 'StartVisualSkillUse', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: 'Not In Vanilla - Triggers on the visual start of a Skill being used. (Used mainly for the sound consequence, with things like VFX, and dialogue lines)' 
  },
  { 
    id: 'timing-startvisualcointoss', 
    label: 'Start Visual Coin Toss', 
    functionName: 'StartVisualCoinToss', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: 'Not In Vanilla - Triggers on the visual start of a Coin being tossed. (Mainly used for the sound consequence, with things like voice lines)' 
  },
  { 
    id: 'timing-oncointoss', 
    label: 'On Coin Toss', 
    functionName: 'OnCoinToss', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: 'When a coin is tossed - activates each time a coin is tossed, similar to how bleed works' 
  },
  { 
    id: 'timing-fakepower', 
    label: 'Fake Power', 
    functionName: 'FakePower', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: 'Prediction Phase - (Used for prediction, only for base(), final(), and clash(). Don\'t use any other consequences)' 
  },

  // Parameterized Skill Timing Functions
  { 
    id: 'timing-onsucceedattack', 
    label: 'On Succeed Attack', 
    functionName: 'OnSucceedAttack', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: 'No Conditions: [On Hit], Crit Condition: [On Crit], NoCrit Condition: Only if not a critical hit',
    hasParameters: true,
    parameters: [
      { name: 'var_1', type: 'select', options: ['Head', 'Tail', 'None'], defaultValue: 'None', label: 'Coin Result' },
      { name: 'var_2', type: 'select', options: ['Crit', 'None', 'NoCrit'], defaultValue: 'None', label: 'Crit Condition' }
    ]
  },
  { 
    id: 'timing-beforesa', 
    label: 'Before SA', 
    functionName: 'BeforeSA', 
    category: 'Skill Timing', 
    type: 'timingNode', 
    description: 'Not In Vanilla - Triggers right before the hit connects',
    hasParameters: true,
    parameters: [
      { name: 'var_1', type: 'select', options: ['Head', 'None', 'Tail'], defaultValue: 'None', label: 'Coin Result' },
      { name: 'var_2', type: 'select', options: ['Crit', 'None', 'NoCrit'], defaultValue: 'None', label: 'Crit Condition' }
    ]
  },

  // Passive Timing Functions
  { 
    id: 'passive-roundstart', 
    label: 'Round Start', 
    functionName: 'RoundStart', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '[Turn Start]' 
  },
  { 
    id: 'passive-afterslots', 
    label: 'After Slots', 
    functionName: 'AfterSlots', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '[Turn Start] - A special RoundStart timing that triggers after Slots are formed. Used for skillslotreplace()' 
  },
  { 
    id: 'passive-startbattle', 
    label: 'Start Battle', 
    functionName: 'StartBattle', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '[Combat Start]' 
  },
  { 
    id: 'passive-endbattle', 
    label: 'End Battle', 
    functionName: 'EndBattle', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '[Turn End]' 
  },
  { 
    id: 'passive-whenuse', 
    label: 'When Use', 
    functionName: 'WhenUse', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '[On Use]' 
  },
  { 
    id: 'passive-beforeattack', 
    label: 'Before Attack', 
    functionName: 'BeforeAttack', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '[Before Attack]' 
  },
  { 
    id: 'passive-beforeuse', 
    label: 'Before Use', 
    functionName: 'BeforeUse', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '[Before Use]' 
  },
  { 
    id: 'passive-duelclash', 
    label: 'Duel Clash', 
    functionName: 'DuelClash', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: 'Clash Count - Triggers On Each Individual Clash in a Duel (Clash)' 
  },
  { 
    id: 'passive-startduel', 
    label: 'Start Duel', 
    functionName: 'StartDuel', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '[Clash Start]' 
  },
  { 
    id: 'passive-winduel', 
    label: 'Win Duel', 
    functionName: 'WinDuel', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '[Clash Win]' 
  },
  { 
    id: 'passive-defeatduel', 
    label: 'Defeat Duel', 
    functionName: 'DefeatDuel', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '[Clash Lose]' 
  },
  { 
    id: 'passive-endskill', 
    label: 'End Skill', 
    functionName: 'EndSkill', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '[After Attack] - Bugged' 
  },
  { 
    id: 'passive-ondiscard', 
    label: 'On Discard', 
    functionName: 'OnDiscard', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '"if this Skill is Discarded" at the end of the line' 
  },
  { 
    id: 'passive-onstartbehaviour', 
    label: 'On Start Behaviour', 
    functionName: 'OnStartBehaviour', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '[On Use]' 
  },
  { 
    id: 'passive-onendbehaviour', 
    label: 'On End Behaviour', 
    functionName: 'OnEndBehaviour', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '[After Attack]' 
  },
  { 
    id: 'passive-enemykill', 
    label: 'Enemy Kill', 
    functionName: 'EnemyKill', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '[On Kill]' 
  },
  { 
    id: 'passive-fakepower', 
    label: 'Fake Power', 
    functionName: 'FakePower', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: 'Prediction Phase - (Used for prediction, only for base(), final(), and clash(). Don\'t use any other consequences)' 
  },
  { 
    id: 'passive-oncointoss', 
    label: 'On Coin Toss', 
    functionName: 'OnCoinToss', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: 'When a coin is tossed - activates each time a coin is tossed, similar to how bleed works' 
  },
  { 
    id: 'passive-startbattleskill', 
    label: 'Start Battle Skill', 
    functionName: 'StartBattleSkill', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: 'Combat start, activates once for every skill chained - activates on combat start multiple times, the amount of times being dictated by the amount of chained skills' 
  },
  { 
    id: 'passive-specialaction', 
    label: 'Special Action', 
    functionName: 'SpecialAction', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: 'Most Complete Certainly NOT In Vanilla - (Unique Timing triggered when you ctrl+LMB the portrait of the Unit on the dashboard, this is experimental)' 
  },

  // Parameterized Passive Timing Functions
  { 
    id: 'passive-onsucceedattack', 
    label: 'On Succeed Attack', 
    functionName: 'OnSucceedAttack', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: 'No Conditions: [On Hit], Crit Condition: [On Crit], NoCrit Condition: Only if not a critical hit',
    hasParameters: true,
    parameters: [
      { name: 'var_1', type: 'select', options: ['Head', 'Tail', 'None'], defaultValue: 'None', label: 'Coin Result' },
      { name: 'var_2', type: 'select', options: ['Crit', 'None', 'NoCrit'], defaultValue: 'None', label: 'Crit Condition' }
    ]
  },
  { 
    id: 'passive-beforesa', 
    label: 'Before SA', 
    functionName: 'BeforeSA', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: 'Not In Vanilla - Triggers right before the hit connects',
    hasParameters: true,
    parameters: [
      { name: 'var_1', type: 'select', options: ['Head', 'None', 'Tail'], defaultValue: 'None', label: 'Coin Result' },
      { name: 'var_2', type: 'select', options: ['Crit', 'None', 'NoCrit'], defaultValue: 'None', label: 'Crit Condition' }
    ]
  },
  { 
    id: 'passive-whenhit', 
    label: 'When Hit', 
    functionName: 'WhenHit', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '[Before Getting Hit] - (\'Target\' becomes the unit BEING HIT, \'Self\' becomes the unit who USED THE ATTACK)',
    hasParameters: true,
    parameters: [
      { name: 'var_1', type: 'select', options: ['Head', 'None', 'Tail'], defaultValue: 'None', label: 'Coin Result' },
      { name: 'var_2', type: 'select', options: ['Crit', 'None', 'NoCrit'], defaultValue: 'None', label: 'Crit Condition' }
    ]
  },
  { 
    id: 'passive-beforewhenhit', 
    label: 'Before When Hit', 
    functionName: 'BeforeWhenHit', 
    category: 'Passive Timing', 
    type: 'timingNode', 
    description: '[Before Getting Hit] - (\'Target\' becomes the unit BEING HIT, \'Self\' becomes the unit who USED THE ATTACK)',
    hasParameters: true,
    parameters: [
      { name: 'var_1', type: 'select', options: ['Head', 'None', 'Tail'], defaultValue: 'None', label: 'Coin Result' },
      { name: 'var_2', type: 'select', options: ['Crit', 'None', 'NoCrit'], defaultValue: 'None', label: 'Crit Condition' }
    ]
  },
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

    if (event.target.closest('.assignment-slot')) {
      return;
    }

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const transferData = JSON.parse(event.dataTransfer.getData('application/reactflow'));

    if (transferData) {
      const { nodeType, functionData } = transferData;
      const position = screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNodeId = `${nodeType}-${Date.now()}`;

      // Initialize parameters for parameterized timing functions
      let nodeData = {...functionData};
if (nodeType === 'timingNode' && functionData.hasParameters) {
  const initialParams = {};
  if (functionData.parameters) {
    functionData.parameters.forEach(param => {
      initialParams[param.name] = param.defaultValue;
    });
  }
  nodeData = { 
    ...functionData, 
    parameters: initialParams,
    hasParameters: true 
  };
}

const newNode = {
  id: newNodeId,
  type: nodeType,
  position,
  data: getThemedNodeData(nodeData),
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
  setGeneratedScript("Needs to start with a timing node goober");
  setShowExportModal(true);
  return;
}

// Handle parameterized timing functions
if (timingNode.data.hasParameters && timingNode.data.parameters) {
  const params = Object.values(timingNode.data.parameters).join(',');
  script += `TIMING:${timingNode.data.functionName}(${params})/`;
} else {
  script += `TIMING:${timingNode.data.functionName}/`;
}

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

    if (node.type === 'assignmentNode') {
      let assignedValue = node.data.variable || 'VALUE_0';
      let assignedScript = '';

      // Use the embedded node data directly
      if (node.data.assignedNodeData) {
        let funcCall = '';
        let args = [];
        
        if (node.data.assignedNodeData.functionName === 'bufcheck') {
          args = [
            node.data.assignedNodeData.target,
            node.data.assignedNodeData.buff,
            node.data.assignedNodeData.mode
          ];
        } else if (node.data.assignedNodeData.functionName === 'getdata') {
          args = [
            node.data.assignedNodeData.target,
            node.data.assignedNodeData.id
          ];
        } else if (node.data.assignedNodeData.functionName === 'random') {
          args = [
            node.data.assignedNodeData.min,
            node.data.assignedNodeData.max
          ];
        }
        // ...other cases as needed

        const formattedArgs = args.filter(arg => arg !== undefined && arg !== null).join(',');
        funcCall = `${node.data.assignedNodeData.functionName}(${formattedArgs})`;
        assignedScript = `${assignedValue}:${funcCall}/`;
      }

      subScript += assignedScript;
      
      // FIX: Continue traversal for assignment nodes
      const nextEdges = edgeMap.get(`${node.id}-output`) || [];
      nextEdges.forEach(edge => {
        if (!visited.has(edge.target)) {
          queue.push(edge.target);
        }
      });
      
      continue; // Skip the rest of the processing for assignment nodes
    }

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

    // FIX: This part was not being executed for assignment nodes due to the continue statement
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
    const startEdges = edges.filter(edge => edge.source === timingNode.id);
startEdges.forEach(edge => {
  script += traverseGraph(edge.target);
});

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
           {['All', 'Skill Timing', 'Passive Timing', 'Value Acquisition', 'Consequence', 'Conditional', 'Value Assignment'].map(category => (
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
      fontSize: '0.9em' 
    }}
  >
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
    draggable
    onDragStart={(event) => onDragStart(event, func.type, func)}
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
          nodes={themedNodes.map(node => ({ ...node, data: { ...node.data, onDataChange: onNodeDataChange, setNodes  } }))}
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
            <h3 style={{ marginTop: 0, color: textColor }}>Generated Modular Moment</h3>
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
    <DndProvider backend={HTML5Backend}>
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </DndProvider>
  );
}

export default App;
