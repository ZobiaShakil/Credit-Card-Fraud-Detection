import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import PredictionForm from './predictionform';
import Dashboard from './Dashboard'; 

function App() {
  // 'logs' state is now in the parent App
  const [logs, setLogs] = useState([]);

  // This function fetches data from our new /logs endpoint
  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/logs');
      const data = await response.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  }, []);

  // Fetch logs when the app first loads
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // This function is what the form will call to force a refresh
  const handlePrediction = () => {
    fetchLogs(); // Just re-fetch all the data
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Credit Card Fraud Detection Dashboard</h1>
      </header>
      
      <div className="main-content">
        
        {/* Column 1: The Form */}
        <div className="form-container">
          <h2>New Prediction</h2>
          <h4>Enter transaction details to predict:</h4>
          {/* We pass the 'handlePrediction' function as a prop */}
          <PredictionForm onPredictionSuccess={handlePrediction} />
        </div>
        
        {/* Column 2: The Charts */}
        <div className="dashboard-container">
          <h2>Prediction History</h2>
          {/* We pass the 'logs' data as a prop */}
          <Dashboard logs={logs} />
        </div>
        
      </div>
    </div>
  );
}

export default App;