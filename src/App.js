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
  const updatedParams = { 
    ...(data.parameters || {}), 
    [paramName]: event.target.value 
  };
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

   // Helper to update embedded node data
  const updateEmbeddedData = (field, value) => {
    data.onDataChange(id, {
      ...data,
      assignedNodeData: { 
        ...data.assignedNodeData, 
        [field]: value 
      }
    });
  };

 // Render the embedded value node with appropriate inputs
const renderEmbeddedNode = () => {
  if (!data.assignedNodeData) return null;
  
  const funcData = data.assignedNodeData;
  const funcName = funcData.functionName;

  return (
    <div style={{
      padding: '8px',
      background: funcData.nodeColor,
      borderRadius: '3px',
      margin: '4px 0',
      color: funcData.textColor
    }}>
      <strong>{funcData.label}</strong>
      {funcData.functionName && <div style={{ fontSize: '0.8em' }}>{funcData.functionName}</div>}
      
      {/* Dynamic input fields based on function type */}
      {funcName === 'hpcheck' && (
        <>
          <div>Target: <input type="text" value={funcData.target || ''} 
            onChange={e => updateEmbeddedData('target', e.target.value)} 
            placeholder="Self, Target..." />
          </div>
          <div>Mode: 
            <select value={funcData.mode || 'normal'}
              onChange={e => updateEmbeddedData('mode', e.target.value)}>
              <option value="normal">normal (HP)</option>
              <option value="%">% (HP%)</option>
              <option value="max">max (Max HP)</option>
              <option value="missing">missing (Missing HP)</option>
              <option value="missing%">missing% (Missing HP%)</option>
            </select>
          </div>
        </>
      )}

      {funcName === 'math' && (
  <div>
    Expression: <input type="text" value={funcData.expression || ''} 
      onChange={e => updateEmbeddedData('expression', e.target.value)} 
      placeholder="VALUE_0*VALUE_0" />
  </div>
)}
      
      {funcName === 'mpcheck' && (
        <div>Target: <input type="text" value={funcData.target || ''} 
          onChange={e => updateEmbeddedData('target', e.target.value)} 
          placeholder="Self, Target..." />
        </div>
      )}
      
      {funcName === 'bufcheck' && (
        <>
          <div>Target: <input type="text" value={funcData.target || ''} 
            onChange={e => updateEmbeddedData('target', e.target.value)} 
            placeholder="Self, Target..." />
          </div>
          <div>Buff: <input type="text" value={funcData.buff || ''} 
            onChange={e => updateEmbeddedData('buff', e.target.value)}
            placeholder="Keyword" />
          </div>
          <div>Mode: 
            <select value={funcData.mode || 'stack'}
              onChange={e => updateEmbeddedData('mode', e.target.value)}>
              <option value="stack">stack (Potency)</option>
              <option value="turn">turn (Turns)</option>
              <option value="+">+ (Potency + Turns)</option>
              <option value="*">* (Potency × Turns)</option>
              <option value="consumed">consumed (Amount used)</option>
            </select>
          </div>
        </>
      )}
      
      {funcName === 'getdata' && (
        <>
          <div>Target: <input type="text" value={funcData.target || ''} 
            onChange={e => updateEmbeddedData('target', e.target.value)} 
            placeholder="Self, Target..." />
          </div>
          <div>ID: <input type="text" value={funcData.id || ''} 
            onChange={e => updateEmbeddedData('id', e.target.value)}
            placeholder="Data ID" />
          </div>
        </>
      )}
      
      {funcName === 'random' && (
        <>
          <div>Min: <input type="number" value={funcData.min || ''} 
            onChange={e => updateEmbeddedData('min', e.target.value)} 
            placeholder="Min" />
          </div>
          <div>Max: <input type="number" value={funcData.max || ''} 
            onChange={e => updateEmbeddedData('max', e.target.value)}
            placeholder="Max" />
          </div>
        </>
      )}
      
      {funcName === 'unitstate' && (
        <div>Target: <input type="text" value={funcData.target || ''} 
          onChange={e => updateEmbeddedData('target', e.target.value)} 
          placeholder="Self, Target..." />
        </div>
      )}
      
      {funcName === 'getid' && (
        <div>Target: <input type="text" value={funcData.target || ''} 
          onChange={e => updateEmbeddedData('target', e.target.value)} 
          placeholder="Self, Target..." />
        </div>
      )}
      
      {funcName === 'getcharacterid' && (
        <div>Target: <input type="text" value={funcData.target || ''} 
          onChange={e => updateEmbeddedData('target', e.target.value)} 
          placeholder="Self, Target..." />
        </div>
      )}
      
      {funcName === 'instid' && (
        <div>Target: <input type="text" value={funcData.target || ''} 
          onChange={e => updateEmbeddedData('target', e.target.value)} 
          placeholder="Self, Target..." />
        </div>
      )}
      
      {funcName === 'speedcheck' && (
        <>
          <div>Target: <input type="text" value={funcData.target || ''} 
            onChange={e => updateEmbeddedData('target', e.target.value)} 
            placeholder="Self, Target..." />
          </div>
          <div>Slot: <input type="number" value={funcData.slot || ''} 
            onChange={e => updateEmbeddedData('slot', e.target.value)}
            placeholder="Slot index (optional)" />
          </div>
        </>
      )}
      
      {funcName === 'getpattern' && (
        <div>Target: <input type="text" value={funcData.target || ''} 
          onChange={e => updateEmbeddedData('target', e.target.value)} 
          placeholder="Self, Target..." />
        </div>
      )}
      
      {funcName === 'deadallies' && (
        <div>Target: <input type="text" value={funcData.target || ''} 
          onChange={e => updateEmbeddedData('target', e.target.value)} 
          placeholder="Self, Target..." />
        </div>
      )}
      
      {funcName === 'getshield' && (
        <div>Target: <input type="text" value={funcData.target || ''} 
          onChange={e => updateEmbeddedData('target', e.target.value)} 
          placeholder="Self, Target..." />
        </div>
      )}
      
      {funcName === 'areallied' && (
        <>
          <div>Target 1: <input type="text" value={funcData.target1 || ''} 
            onChange={e => updateEmbeddedData('target1', e.target.value)} 
            placeholder="Self, Target..." />
          </div>
          <div>Target 2: <input type="text" value={funcData.target2 || ''} 
            onChange={e => updateEmbeddedData('target2', e.target.value)} 
            placeholder="Self, Target..." />
          </div>
        </>
      )}
      
      {funcName === 'getcoincount' && (
        <>
          <div>Target: 
            <select value={funcData.target || 'Self'}
              onChange={e => updateEmbeddedData('target', e.target.value)}>
              <option value="Self">Self</option>
              <option value="Target">Target</option>
            </select>
          </div>
          <div>Type: 
            <select value={funcData.type || 'cur'}
              onChange={e => updateEmbeddedData('type', e.target.value)}>
              <option value="cur">cur (Current)</option>
              <option value="og">og (Original)</option>
            </select>
          </div>
        </>
      )}
      
      {funcName === 'allcoinstate' && (
        <>
          <div>Target: 
            <select value={funcData.target || 'Self'}
              onChange={e => updateEmbeddedData('target', e.target.value)}>
              <option value="Self">Self</option>
              <option value="Target">Target</option>
            </select>
          </div>
          <div>Type: 
            <select value={funcData.type || 'full'}
              onChange={e => updateEmbeddedData('type', e.target.value)}>
              <option value="full">full (All same)</option>
              <option value="headcount">headcount (Heads count)</option>
              <option value="tailcount">tailcount (Tails count)</option>
            </select>
          </div>
        </>
      )}
      
      {/* Add more function types as needed */}
      
      {!['hpcheck', 'mpcheck', 'bufcheck', 'getdata', 'random', 'unitstate', 
          'getid', 'getcharacterid', 'instid', 'speedcheck', 'getpattern', 
          'deadallies', 'getshield', 'areallied', 'getcoincount', 'allcoinstate'].includes(funcName) && (
        <div>This function doesn't require additional parameters or specialized input fields.</div>
      )}
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
    event.stopPropagation();
    const transfer = event.dataTransfer.getData('application/reactflow');
    if (transfer) {
      const { nodeType, functionData } = JSON.parse(transfer);
      if (nodeType === 'valueAcquisitionNode') {
        // Initialize with default parameters based on function type
        let defaultParams = {};
        
        switch(functionData.functionName) {
          case 'hpcheck':
            defaultParams = { target: '', mode: 'normal' };
            break;
          case 'mpcheck':
            defaultParams = { target: '' };
            break;
          case 'bufcheck':
            defaultParams = { target: '', buff: '', mode: 'stack' };
            break;
          case 'getdata':
            defaultParams = { target: '', id: '' };
            break;
          case 'random':
            defaultParams = { min: '', max: '' };
            break;
          case 'unitstate':
            defaultParams = { target: '' };
            break;
          case 'getid':
            defaultParams = { target: '' };
            break;
          case 'getcharacterid':
            defaultParams = { target: '' };
            break;
          case 'instid':
            defaultParams = { target: '' };
            break;
          case 'speedcheck':
            defaultParams = { target: '', slot: '' };
            break;
          case 'getpattern':
            defaultParams = { target: '' };
            break;
          case 'deadallies':
            defaultParams = { target: '' };
            break;
          case 'getshield':
            defaultParams = { target: '' };
            break;
          case 'areallied':
            defaultParams = { target1: '', target2: '' };
            break;
          case 'getcoincount':
            defaultParams = { target: 'Self', type: 'cur' };
            break;
          case 'allcoinstate':
            defaultParams = { target: 'Self', type: 'full' };
            break;
          // Add more function types as needed
          default:
            defaultParams = {};
        }
        
        data.onDataChange(id, { 
          ...data, 
          assignedNodeData: { ...functionData, ...defaultParams } 
        });
      }
    }
  }}
  onDragOver={e => {
    e.preventDefault();
    e.stopPropagation();
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




const IfNode = ({ id, data }) => {
  const handleChange = (field, index = null) => (event) => {
    if (index !== null) {
      // Handle condition changes
      const updatedConditions = [...data.conditions];
      updatedConditions[index] = {
        ...updatedConditions[index],
        [field]: event.target.value
      };
      data.onDataChange(id, { ...data, conditions: updatedConditions });
    } else {
      // Handle other changes
      data.onDataChange(id, { ...data, [field]: event.target.value });
    }
  };

  const addCondition = () => {
    const newCondition = { left: 'VALUE_0', operator: '>', right: '0' };
    data.onDataChange(id, { 
      ...data, 
      conditions: [...(data.conditions || []), newCondition] 
    });
  };

  const removeCondition = (index) => {
    const updatedConditions = [...data.conditions];
    updatedConditions.splice(index, 1);
    data.onDataChange(id, { ...data, conditions: updatedConditions });
  };

  return (
    <div className="custom-node" style={{ background: data.nodeColor, color: data.textColor, borderColor: data.borderColor }}>
      <Handle type="target" position={Position.Left} id="input" style={{ background: data.textColor }} />
      <strong>IF Statement</strong>
      <div style={{ marginTop: '10px' }}>
        {/* Logical Operator Dropdown (only shown when multiple conditions exist) */}
        {(data.conditions && data.conditions.length > 1) && (
          <div style={{ marginBottom: '10px' }}>
            <select 
              value={data.logicalOperator || 'AND'} 
              onChange={handleChange('logicalOperator')}
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
              <option value="XOR">XOR</option>
            </select>
          </div>
        )}
        
        {/* Condition Inputs */}
        {(data.conditions || []).map((condition, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', flexWrap: 'wrap' }}>
            {/* Left Operand Dropdown */}
            <select 
              value={condition.left || 'VALUE_0'} 
              onChange={handleChange('left', index)}
              style={{ marginRight: '5px', width: '80px' }}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={`VALUE_${i}`}>{`VALUE_${i}`}</option>
              ))}
            </select>
            
            {/* Operator Dropdown */}
            <select 
              value={condition.operator || '>'} 
              onChange={handleChange('operator', index)}
              style={{ marginRight: '5px', width: '50px' }}
            >
              <option value=">">{'>'}</option>
              <option value="<">{'<'}</option>
              <option value="=">{'='}</option>
            </select>
            
            {/* Right Operand Input */}
            <input 
              type="text" 
              value={condition.right || ''} 
              onChange={handleChange('right', index)}
              placeholder="Value or VALUE_X" 
              style={{ width: '80px', marginRight: '5px' }}
            />
            
            {/* Remove Condition Button */}
            <button 
              onClick={() => removeCondition(index)}
              style={{ background: 'red', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        ))}
        
        {/* Add Condition Button */}
        <button 
          onClick={addCondition}
          style={{ marginTop: '10px', padding: '5px 10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
        >
          Add Condition
        </button>
        
        <div style={{ fontSize: '0.8em', marginTop: '10px', color: '#888' }}>
          Math ops: + - * % ! ¡ ?
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="true" style={{ top: '35%', background: 'green' }} />
      <Handle type="source" position={Position.Right} id="false" style={{ top: '65%', background: 'red' }} />
    </div>
  );
};

const ContinueIfNode = ({ id, data }) => {
  const handleChange = (field, index = null) => (event) => {
    if (index !== null) {
      const updatedConditions = [...data.conditions];
      updatedConditions[index] = {
        ...updatedConditions[index],
        [field]: event.target.value
      };
      data.onDataChange(id, { ...data, conditions: updatedConditions });
    } else {
      data.onDataChange(id, { ...data, [field]: event.target.value });
    }
  };

  const addCondition = () => {
    const newCondition = { left: 'VALUE_0', operator: '>', right: '0' };
    data.onDataChange(id, { 
      ...data, 
      conditions: [...(data.conditions || []), newCondition] 
    });
  };

  const removeCondition = (index) => {
    const updatedConditions = [...data.conditions];
    updatedConditions.splice(index, 1);
    data.onDataChange(id, { ...data, conditions: updatedConditions });
  };

  return (
    <div className="custom-node" style={{ background: data.nodeColor, color: data.textColor, borderColor: data.borderColor }}>
      <Handle type="target" position={Position.Left} id="input" style={{ background: data.textColor }} />
      <strong>CONTINUEIF</strong>
      <div style={{ marginTop: '10px' }}>
        <div style={{ marginBottom: '10px' }}>
          <select 
            value={data.logicalOperator || 'AND'} 
            onChange={handleChange('logicalOperator')}
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
            <option value="XOR">XOR</option>
          </select>
        </div>
        
        {(data.conditions || []).map((condition, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <select 
              value={condition.left || 'VALUE_0'} 
              onChange={handleChange('left', index)}
              style={{ marginRight: '5px', width: '80px' }}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={`VALUE_${i}`}>{`VALUE_${i}`}</option>
              ))}
            </select>
            
            <select 
              value={condition.operator || '>'} 
              onChange={handleChange('operator', index)}
              style={{ marginRight: '5px', width: '50px' }}
            >
              <option value=">">{'>'}</option>
              <option value="<">{'<'}</option>
              <option value="=">{'='}</option>
              <option value="!=">{'!='}</option>
            </select>
            
            <input 
              type="text" 
              value={condition.right || ''} 
              onChange={handleChange('right', index)}
              placeholder="Value" 
              style={{ width: '60px', marginRight: '5px' }}
            />
            
            <button 
              onClick={() => removeCondition(index)}
              style={{ background: 'red', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        ))}
        
        <button 
          onClick={addCondition}
          style={{ marginTop: '10px', padding: '5px 10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
        >
          Add Condition
        </button>
        
        <div style={{ fontSize: '0.8em', marginTop: '10px', color: '#888' }}>
          Stops execution if false. Math ops: + - * % ! ¡ ?
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="output" style={{ background: data.textColor }} />
    </div>
  );
};

const nodeTypes = {
  timingNode: TimingNode,
  valueAcquisitionNode: ValueAcquisitionNode,
  consequenceNode: ConsequenceNode,
  ifNode: IfNode,
  continueIfNode: ContinueIfNode,
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
  const [isPaletteExpanded, setIsPaletteExpanded] = useState(false);
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

 const expandButtonStyle = {
  position: 'absolute',
  bottom: '-10px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10,
  width: '40px',
  height: '20px',
  borderRadius: '0 0 20px 20px',
  border: `1px solid ${paletteBorderColor}`,
  borderTop: 'none',
  backgroundColor: paletteBgColor,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
  boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
};

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
  id: 'value-math', 
  label: 'Math Operation', 
  functionName: 'math', 
  category: 'Value Acquisition', 
  type: 'valueAcquisitionNode', 
  description: 'Performs math operations. Args: Math expression (e.g., VALUE_0*VALUE_0)' 
},
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
    description: 'var_1: Head/Tail/None (Only on heads, only on tails, or no condition.) var_2: Crit/None/NoCrit (Only on crit, or only when not a crit)',
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
    description: 'Triggers right before the hit connects. var_1: Head/Tail/None (Only on heads, only on tails, or no condition.) var_2: Crit/None/NoCrit (Only on crit, or only when not a crit)',
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
     { 
    id: 'value-hpcheck', 
    label: 'HP Check', 
    functionName: 'hpcheck', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Gets HP value. Args: Target, Mode (normal=HP, %=HP%, max=MaxHP, missing=MissingHP, missing%=MissingHP%)' 
  },
  { 
    id: 'value-mpcheck', 
    label: 'SP Check', 
    functionName: 'mpcheck', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Gets SP value. Args: Target' 
  },
  { 
    id: 'value-bufcheck', 
    label: 'Buff Check', 
    functionName: 'bufcheck', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns buff info. Args: Target, Buff keyword, Mode (stack=potency, turn=turns, +=sum, *=product, consumed=amount used)' 
  },
  { 
    id: 'value-getdmg', 
    label: 'Get Damage', 
    functionName: 'getdmg', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns damage amount. Only works with OnSucceedAttack and WhenHit timings. No arguments.' 
  },
  { 
    id: 'value-round', 
    label: 'Get Round', 
    functionName: 'round', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns current round number. No arguments.' 
  },
  { 
    id: 'value-wave', 
    label: 'Get Wave', 
    functionName: 'wave', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns current wave number. No arguments.' 
  },
  { 
    id: 'value-activations', 
    label: 'Get Activations', 
    functionName: 'activations', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns how many times this script has been triggered. No arguments.' 
  },
  { 
    id: 'value-unitstate', 
    label: 'Unit State', 
    functionName: 'unitstate', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns unit state. Args: Target (-1=doesn\'t exist, 0=dead, 1=alive, 2=staggered)' 
  },
  { 
    id: 'value-getid', 
    label: 'Get Unit ID', 
    functionName: 'getid', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns unit ID. Args: Target' 
  },
  { 
    id: 'value-getcharacterid', 
    label: 'Get Character ID', 
    functionName: 'getcharacterid', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns character ID (Sinners only). Args: Target' 
  },
  { 
    id: 'value-instid', 
    label: 'Get Instance ID', 
    functionName: 'instid', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns unique instance ID. Args: Target' 
  },
  { 
    id: 'value-speedcheck', 
    label: 'Speed Check', 
    functionName: 'speedcheck', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns speed. Args: Target, [Optional] Slot index' 
  },
  { 
    id: 'value-getpattern', 
    label: 'Get Pattern', 
    functionName: 'getpattern', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns pattern index. Args: Target' 
  },
  { 
    id: 'value-getdata', 
    label: 'Get Data', 
    functionName: 'getdata', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Gets encounter-persistent data. Args: Target, Data ID' 
  },
  { 
    id: 'value-deadallies', 
    label: 'Dead Allies', 
    functionName: 'deadallies', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Gets number of target\'s dead allies. Args: Target' 
  },
  { 
    id: 'value-random', 
    label: 'Random Number', 
    functionName: 'random', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns random integer. Args: Min value, Max value' 
  },
  { 
    id: 'value-getshield', 
    label: 'Get Shield', 
    functionName: 'getshield', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns shield amount. Args: Target' 
  },
  { 
    id: 'value-areallied', 
    label: 'Are Allied', 
    functionName: 'areallied', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns if units are allied. Args: Target 1, Target 2' 
  },
  { 
    id: 'value-getskillid', 
    label: 'Get Skill ID', 
    functionName: 'getskillid', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns skill ID being used. Only works with skill-related timings. No arguments.' 
  },
  { 
    id: 'value-getcoincount', 
    label: 'Get Coin Count', 
    functionName: 'getcoincount', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Gets coin count. Args: Self/Target, Type (cur=current, og=original)' 
  },
  { 
    id: 'value-allcoinstate', 
    label: 'All Coin State', 
    functionName: 'allcoinstate', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns coin states. Args: Self/Target, Type (full=all same, headcount=heads, tailcount=tails)' 
  },
  { 
    id: 'value-resonance', 
    label: 'Resonance', 
    functionName: 'resonance', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns resonance. Args: Type (highres, highperfect, or specific sin like AZURE)' 
  },
  { 
    id: 'value-resource', 
    label: 'Resource', 
    functionName: 'resource', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns sin resources. Args: Sin type (CRIMSON, SCARLET, etc.), [Optional] Enemy' 
  },
  { 
    id: 'value-haskey', 
    label: 'Has Keyword', 
    functionName: 'haskey', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns if unit has keyword. Args: Target, Logic (AND/OR), Keyword(s) comma separated' 
  },
  { 
    id: 'value-skillbase', 
    label: 'Skill Base', 
    functionName: 'skillbase', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns skill base power. Args: Self/Target' 
  },
  { 
    id: 'value-skillatkweight', 
    label: 'Skill ATK Weight', 
    functionName: 'skillatkweight', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns attack weight. Args: Self/Target' 
  },
  { 
    id: 'value-onescale', 
    label: 'One Scale', 
    functionName: 'onescale', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns coin power. Args: Self/Target, Coin index' 
  },
  { 
    id: 'value-skillatklevel', 
    label: 'Skill ATK Level', 
    functionName: 'skillatklevel', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns offense level. Args: Self/Target, Coin index' 
  },
  { 
    id: 'value-getskilllevel', 
    label: 'Get Skill Level', 
    functionName: 'getskilllevel', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns unit offense + skill offense level. Args: Self/Target' 
  },
  { 
    id: 'value-skillatk', 
    label: 'Skill ATK Type', 
    functionName: 'skillatk', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns attack type. Args: Self/Target (0=Slash, 1=Pierce, 2=Blunt, 3=None)' 
  },
  { 
    id: 'value-skillattribute', 
    label: 'Skill Attribute', 
    functionName: 'skillattribute', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns sin type. Args: Self/Target (0=Wrath, 1=Lust, 2=Sloth, 3=Gluttony, etc.)' 
  },
  { 
    id: 'value-skilldeftype', 
    label: 'Skill DEF Type', 
    functionName: 'skilldeftype', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns defense type. Args: Self/Target (0=None, 1=Guard, 2=Evade, 3=Counter, etc.)' 
  },
  { 
    id: 'value-skillrank', 
    label: 'Skill Rank', 
    functionName: 'skillrank', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns skill tier. Args: Self/Target' 
  },
  { 
    id: 'value-skillegotype', 
    label: 'Skill EGO Type', 
    functionName: 'skillegotype', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns EGO type. Args: Self/Target (0=Skill, 1=Awaken, 2=Corrosion, etc.)' 
  },
  { 
    id: 'value-amountattacks', 
    label: 'Amount Attacks', 
    functionName: 'amountattacks', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns number of skills attacking target. Args: Target' 
  },
  { 
    id: 'value-coinisbroken', 
    label: 'Coin Is Broken', 
    functionName: 'coinisbroken', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns if coin is broken (1) or not (0). No arguments.' 
  },
  { 
    id: 'value-skillslotcount', 
    label: 'Skill Slot Count', 
    functionName: 'skillslotcount', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns number of slots. Args: Target' 
  },
  { 
    id: 'value-isfocused', 
    label: 'Is Focused', 
    functionName: 'isfocused', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns if battle is focused (1) or regular (0). No arguments.' 
  },
  { 
    id: 'value-getdmgtaken', 
    label: 'Get Damage Taken', 
    functionName: 'getdmgtaken', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns damage taken. Args: Target, Type (prev=last turn, current=this turn)' 
  },
  { 
    id: 'value-getbuffcount', 
    label: 'Get Buff Count', 
    functionName: 'getbuffcount', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns buff count. Args: Target, Type (neg=negative, pos=positive)' 
  },
  { 
    id: 'value-unitcount', 
    label: 'Unit Count', 
    functionName: 'unitcount', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns number of units. Args: Target filter' 
  },
  { 
    id: 'value-breakcount', 
    label: 'Break Count', 
    functionName: 'breakcount', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns stagger bars count. Args: Target' 
  },
  { 
    id: 'value-breakvalue', 
    label: 'Break Value', 
    functionName: 'breakvalue', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns stagger bar value. Args: Target, Stagger index' 
  },
  { 
    id: 'value-getbloodfeast', 
    label: 'Get Bloodfeast', 
    functionName: 'getbloodfeast', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns bloodfeast info. Args: Type (available=current, spent=used)' 
  },
  { 
    id: 'value-getlevel', 
    label: 'Get Level', 
    functionName: 'getlevel', 
    category: 'Value Acquisition', 
    type: 'valueAcquisitionNode', 
    description: 'Returns unit level. Args: Target' 
  },
    { id: 'con-buf', label: 'Apply Buff', functionName: 'buf', category: 'Consequence', type: 'consequenceNode', nodeColor: nodeColors.Consequence, description: 'Applies a buff to the target.' },
    { id: 'con-bonusdmg', label: 'Bonus Damage', functionName: 'bonusdmg', category: 'Consequence', type: 'consequenceNode', nodeColor: nodeColors.Consequence, description: 'Deals bonus damage.' },
    { id: 'con-setdata', label: 'Set Data', functionName: 'setdata', category: 'Consequence', type: 'consequenceNode', nodeColor: nodeColors.Consequence, description: 'Sets encounter-persistent data.' },
    { id: 'con-if', label: 'IF', functionName: 'IF', category: 'Conditional', type: 'ifNode', nodeColor: nodeColors['Conditional'], description: 'Conditionally executes a script based on a value.' },
    { 
    id: 'conditional-continueif', 
    label: 'CONTINUEIF', 
    functionName: 'CONTINUEIF', 
    category: 'Conditional', 
    type: 'continueIfNode', 
    description: 'Stops execution if condition is false. Format: CONTINUEIF(condition)/' 
  },
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
      let nodeData = { ...functionData };
      if (nodeType === 'timingNode' && functionData.hasParameters) {
        // Set default values for parameters
        const initialParams = {};
        if (functionData.parameters) {
          functionData.parameters.forEach(param => {
            // Set the default value based on the parameter definition
            initialParams[param.name] = param.defaultValue || 'None';
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
        data: {
          ...getThemedNodeData(nodeData),
          conditions: [],
          logicalOperator: 'AND'
        },
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
    const params = [];
    if (timingNode.data.parameters.var_1) params.push(timingNode.data.parameters.var_1);
    if (timingNode.data.parameters.var_2) params.push(timingNode.data.parameters.var_2);
    script += `TIMING:${timingNode.data.functionName}(${params.join(',')})/`;
  } else {
    script += `TIMING:${timingNode.data.functionName}/`;
  }

  // Recursive function to traverse the graph
  const traverseGraph = (startNodeId) => {
    let subScript = '';
    const visited = new Set();
    const queue = [startNodeId];

    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      if (node.type === 'assignmentNode') {
        const funcData = node.data.assignedNodeData;
        if (!funcData) {
          // If there's no assigned function, skip or handle error
          return;
        }
        
        const funcName = funcData.functionName;
        let args = [];
        
        // Handle each function type
        if (funcName === 'hpcheck') {
          args = [funcData.target || 'Self', funcData.mode || 'normal'];
        }
        // Add more function types as needed
        
        // Build the script part for assignment
        subScript += `${node.data.variable || 'VALUE_0'}:${funcName}(${args.join(',')})/`;
        
        // Continue traversal
        const nextEdges = edgeMap.get(`${node.id}-output`) || [];
        nextEdges.forEach(edge => {
          if (!visited.has(edge.target)) {
            queue.push(edge.target);
          }
        });
      } else if (node.type === 'ifNode') {
        // Build condition string
        let conditionStr = '';
        if (node.data.conditions && node.data.conditions.length > 0) {
          if (node.data.conditions.length === 1) {
            // Single condition
            const cond = node.data.conditions[0];
            conditionStr = `${cond.left}${cond.operator}${cond.right}`;
          } else {
            // Multiple conditions with logical operator
            conditionStr = node.data.logicalOperator || 'AND';
            node.data.conditions.forEach(cond => {
              conditionStr += `,${cond.left}${cond.operator}${cond.right}`;
            });
          }
        }
        
        subScript += `IF(${conditionStr}):`;

        // Handle true branch
        const trueEdges = edgeMap.get(`${node.id}-true`) || [];
        if (trueEdges.length > 0) {
          const trueBranchScript = traverseGraph(trueEdges[0].target);
          subScript += trueBranchScript;
        }
        
        // Handle false branch if it exists
        const falseEdges = edgeMap.get(`${node.id}-false`) || [];
        if (falseEdges.length > 0) {
          subScript += ':';
          const falseBranchScript = traverseGraph(falseEdges[0].target);
          subScript += falseBranchScript;
        }
        
        subScript += '/';
      } else if (node.type === 'consequenceNode') {
        // Handle consequence nodes
        let args = [];
        if (node.data.functionName === 'buf') {
          args = [
            node.data.target || 'Self',
            node.data.buff || 'Enhancement',
            node.data.potency || '0',
            node.data.count || '0',
            node.data.activeRound || '0'
          ];
          subScript += `buf(${args.join(',')})/`;
        } else if (node.data.functionName === 'bonusdmg') {
          args = [
            node.data.target || 'Target',
            node.data.amount || '0',
            node.data.dmgType || '-1',
            node.data.sinType || '0'
          ];
          subScript += `bonusdmg(${args.join(',')})/`;
        }
        // Add more consequence types as needed
        
        // Continue traversal
        const nextEdges = edgeMap.get(`${node.id}-output`) || [];
        nextEdges.forEach(edge => {
          if (!visited.has(edge.target)) {
            queue.push(edge.target);
          }
        });
      }
    }
    return subScript;
  };
  
  // Start traversal from the timing node's output
  const startEdges = edges.filter(edge => edge.source === timingNode.id);
  startEdges.forEach(edge => {
    script += traverseGraph(edge.target);
  });

  // Remove any double slashes at the end
  script = script.replace(/\/+$/, '/');
  
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
      <div style={{ position: 'relative', marginBottom: '15px' }}>
  {/* Function Palette */}
  <div style={{
    backgroundColor: paletteBgColor,
    border: `1px solid ${paletteBorderColor}`,
    padding: '10px 20px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    flexShrink: 0,
    color: textColor,
    maxHeight: isPaletteExpanded ? '300px' : '120px',
    overflowY: 'auto',
    transition: 'max-height 0.3s ease-in-out',
    borderRadius: '8px',
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
  </div>

  {/* Extruded Tab - Positioned absolutely below the palette */}
  <div
  onClick={() => setIsPaletteExpanded(!isPaletteExpanded)}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = isDarkMode ? '#2a2a2a' : '#e8e8e8';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = paletteBgColor;
  }}
  style={{
    position: 'absolute',
    bottom: '-18px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100px',
    height: '18px',
    backgroundColor: paletteBgColor,
    border: `1px solid ${paletteBorderColor}`,
    borderTop: 'none',
    borderRadius: '0 0 10px 10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    transition: 'background-color 0.2s ease',
    boxShadow: isDarkMode ? '0 2px 6px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.1)',
  }}
  title={isPaletteExpanded ? 'Collapse palette' : 'Expand palette'}
>
  {/* Use a proper chevron icon that changes based on state */}
  {isPaletteExpanded ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 15L12 9L18 15" stroke={textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 9L12 15L18 9" stroke={textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )}
</div>
  
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
