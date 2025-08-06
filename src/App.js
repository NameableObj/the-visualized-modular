import React, { useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';

// Import the React Flow CSS. This is essential for it to look correct.
import 'reactflow/dist/style.css'; 

// Define initial nodes for our simple example
const initialNodes = [
  {
    id: '1', // Unique ID for the node
    position: { x: 100, y: 100 }, // Position on the canvas
    data: { label: 'GlitchScript Start (Timing)' }, // Data displayed inside the node
    type: 'input', // Special type for starting nodes (no incoming handles)
  },
];

// Define initial edges (connections) - none for now
const initialEdges = [];

function App() {
  // useNodesState and useEdgesState manage the state of your nodes and edges
  // They are React Flow hooks that provide the current state and a setter function
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // useCallback is used to memoize functions, which is good for performance in React
  // This function handles what happens when a new connection is made between nodes
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}> {/* Full viewport size */}
      <ReactFlow
        nodes={nodes} // Pass our nodes state
        edges={edges} // Pass our edges state
        onNodesChange={onNodesChange} // Handler for node position/selection/deletion changes
        onEdgesChange={onEdgesChange} // Handler for edge additions/deletions
        onConnect={onConnect} // Handler for new connections
        fitView // Zooms and positions the graph to fit all elements initially
      >
        {/* MiniMap helps navigate large graphs */}
        <MiniMap />
        {/* Controls provide zoom, pan, and fit view buttons */}
        <Controls />
        {/* Background adds a grid or dots for visual structure */}
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default App;