import React, { useCallback, useState } from 'react'; // Import useState
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';

import 'reactflow/dist/style.css';
// You can add custom styles here or in a separate CSS file
// For now, let's add some basic styles directly in App.js for demonstration
import './App.css'; // We'll create this file next

const initialNodes = [
  {
    id: '1',
    position: { x: 100, y: 100 },
    data: { label: 'GlitchScript Start (Timing)' },
    type: 'input',
    style: { background: '#fff', color: '#333', border: '1px solid #ccc' }, // Default node style
  },
];

const initialEdges = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  // New state for dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // Define colors based on mode
  const backgroundColor = isDarkMode ? '#1a1a1a' : '#ffffff'; // Dark grey or white
  const textColor = isDarkMode ? '#ffffff' : '#333333';      // White or dark grey for text
  const nodeBgColor = isDarkMode ? '#333333' : '#ffffff';    // Darker node background
  const nodeTextColor = isDarkMode ? '#ffffff' : '#333333';  // Node text color
  const nodeBorderColor = isDarkMode ? '#555555' : '#cccccc'; // Node border color

  // Update node styles dynamically based on mode
  // This is a simple way to update existing nodes. For dynamic node additions,
  // you'd pass these styles when creating new nodes.
  const styledNodes = nodes.map(node => ({
    ...node,
    style: {
      ...node.style, // Keep existing styles
      background: nodeBgColor,
      color: nodeTextColor,
      borderColor: nodeBorderColor,
    },
  }));


  return (
    <div className={isDarkMode ? 'dark-mode' : 'light-mode'} style={{ width: '100vw', height: '100vh', backgroundColor: backgroundColor }}>
      <button
        onClick={toggleDarkMode}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000, // Ensure button is on top
          padding: '8px 15px',
          borderRadius: '5px',
          border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`,
          background: isDarkMode ? '#444' : '#eee',
          color: isDarkMode ? '#fff' : '#333',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        {isDarkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
      </button>

      <ReactFlow
        nodes={styledNodes} // Use styledNodes here
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <MiniMap style={{ background: backgroundColor }} /> {/* Apply background to minimap */}
        <Controls style={{ background: backgroundColor, color: textColor }} /> {/* Apply background/color to controls */}
        <Background variant="dots" gap={12} size={1} color={isDarkMode ? '#555' : '#aaa'} /> {/* Darker dots for dark mode */}
      </ReactFlow>
    </div>
  );
}

export default App;