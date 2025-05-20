// src/components/Dashboard.js
import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = ({ tasks = [] }) => {
  const stats = useMemo(() => {
    const statusCounts = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 };
    const complexityCounts = { low: 0, medium: 0, high: 0 };
    let totalEstimated = 0;
    let totalActual = 0;
    let tasksWithActual = 0;
    let tasksWithEstimated = 0;

    tasks.forEach(task => {
      if (!task) return;
      
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
      complexityCounts[task.complexity] = (complexityCounts[task.complexity] || 0) + 1;
      
      if (task.estimated_time) {
        totalEstimated += task.estimated_time;
        tasksWithEstimated++;
      }
      
      if (task.actual_time) {
        totalActual += task.actual_time;
        tasksWithActual++;
      }
    });

    return {
      total: tasks.length,
      statusCounts,
      complexityCounts,
      averageEstimated: tasksWithEstimated > 0 ? totalEstimated / tasksWithEstimated : 0,
      averageActual: tasksWithActual > 0 ? totalActual / tasksWithActual : 0,
      completionRate: tasks.length > 0 ? (statusCounts.completed / tasks.length) * 100 : 0
    };
  }, [tasks]);

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const statusChartData = {
    labels: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    datasets: [
      {
        label: 'Number of Tasks',
        data: [
          stats.statusCounts.pending,
          stats.statusCounts.in_progress,
          stats.statusCounts.completed,
          stats.statusCounts.cancelled
        ],
        backgroundColor: [
          '#fbbf24',
          '#3b82f6',
          '#10b981',
          '#ef4444'
        ],
        borderColor: [
          '#f59e0b',
          '#2563eb',
          '#059669',
          '#dc2626'
        ],
        borderWidth: 1,
      },
    ],
  };

  const complexityChartData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [
      {
        data: [
          stats.complexityCounts.low,
          stats.complexityCounts.medium,
          stats.complexityCounts.high
        ],
        backgroundColor: [
          '#10b981',
          '#f59e0b',
          '#ef4444'
        ],
        borderColor: [
          '#059669',
          '#d97706',
          '#dc2626'
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Task Statistics',
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Task Complexity Distribution',
      },
    },
  };

  const formatStatusText = (status) => {
    return (status || '').replace('_', ' ');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Task Management Dashboard</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.statusCounts.completed}</div>
          <div className="stat-label">Completed Tasks</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.completionRate.toFixed(1)}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            {stats.averageEstimated > 0 ? formatTime(stats.averageEstimated) : 'N/A'}
          </div>
          <div className="stat-label">Avg. Estimated Time</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            {stats.averageActual > 0 ? formatTime(stats.averageActual) : 'N/A'}
          </div>
          <div className="stat-label">Avg. Actual Time</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.statusCounts.in_progress}</div>
          <div className="stat-label">In Progress</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <Bar data={statusChartData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <Pie data={complexityChartData} options={pieOptions} />
        </div>
      </div>

      <div className="task-breakdown">
        <h3>Task Breakdown by Status</h3>
        <div className="breakdown-grid">
          {Object.entries(stats.statusCounts).map(([status, count]) => (
            <div key={status} className={`breakdown-item status-${status}`}>
              <div className="breakdown-count">{count}</div>
              <div className="breakdown-label">
                {formatStatusText(status).toUpperCase()}
              </div>
              <div className="breakdown-percentage">
                {stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;