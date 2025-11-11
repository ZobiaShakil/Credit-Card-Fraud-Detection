import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define our colors
const COLORS = {
  notFraud: '#00C49F', // Green
  fraud: '#FF8042',    // Orange-Red
};

function Dashboard({ logs }) {

  // This 'useMemo' hook calculates all our stats from the 'logs' prop
  // It only re-calculates when the 'logs' prop changes
  const { kpiData, pieData, recentLogs } = useMemo(() => {
    
    // 1. Calculate KPI stats
    const totalLogs = logs.length;
    const totalFraud = logs.filter(log => log.fraud_likely).length;
    const fraudRate = totalLogs > 0 ? (totalFraud / totalLogs) * 100 : 0;

    const kpiData = [
      { title: 'Total Predictions', value: totalLogs },
      { title: 'Fraud Detected', value: totalFraud },
      { title: 'Fraud Rate', value: `${fraudRate.toFixed(1)}%` },
    ];

    // 2. Calculate Pie Chart data
    const notFraudCount = totalLogs - totalFraud;
    const pieData = [
      { name: 'Not Fraud', value: notFraudCount, color: COLORS.notFraud },
      { name: 'Fraud', value: totalFraud, color: COLORS.fraud },
    ];
    
    // 3. Get 5 most recent logs (logs are already sorted by backend)
    const recentLogs = logs.slice(0, 4);

    return { kpiData, pieData, recentLogs };
  }, [logs]); // Dependency: re-run when 'logs' changes

  return (
    <div className="dashboard">
      
      {/* 1. KPI CARDS SECTION */}
      <div className="kpi-container">
        {kpiData.map(kpi => (
          <div className="kpi-card" key={kpi.title}>
            <h3>{kpi.title}</h3>
            <p>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* 2. PIE CHART SECTION */}
      <div className="chart-container">
        <h3>Fraud vs. Not Fraud</h3>
        {logs.length === 0 ? (
          <p>No predictions logged yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* 3. RECENT LOGS TABLE */}
      <div className="table-container">
        <h3>Recent Predictions</h3>
        <table className="logs-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Prediction</th>
              <th>Probability</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {recentLogs.map((log) => (
              <tr key={log.id} className={log.fraud_likely ? 'fraud-row' : ''}>
                <td>{log.id}</td>
                <td>{log.fraud_likely ? 'FRAUD' : 'Not Fraud'}</td>
                <td>{log.probability.toFixed(4)}</td>
                <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}

export default Dashboard;