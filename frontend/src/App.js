// Updated App.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize socket and fetch tasks
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    setSocket(newSocket);

    // Fetch initial tasks
    const fetchTasks = async () => {
      try {
        const response = await axios.get('http://localhost:5000/tasks');
        setTasks(response.data.tasks);
      } catch (err) {
        setError('Failed to fetch tasks');
        console.error('Error fetching tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    newSocket.on('connect', () => {
      setIsConnected(true);
      fetchTasks();
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Socket event listeners
    newSocket.on('task_created', (newTask) => {
      setTasks(prev => [...prev, newTask]);
    });

    newSocket.on('task_updated', (updatedTask) => {
      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
    });

    newSocket.on('task_deleted', ({id}) => {
      setTasks(prev => prev.filter(task => task.id !== id));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Update the socket usage in App.js
  const emitTaskUpdate = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  // Then use it in your handlers
  const handleCreateTask = async (taskData) => {
    try {
      const response = await axios.post('http://localhost:5000/tasks', taskData);
      emitTaskUpdate('task_update', response.data);
      return response.data;
    } catch (err) {
      console.error('Error creating task:', err);
      throw err;
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await axios.put(`http://localhost:5000/tasks/${taskId}`, updates);
      return response.data;
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`http://localhost:5000/tasks/${taskId}`);
    } catch (err) {
      console.error('Error deleting task:', err);
      throw err;
    }
  };

  const handlePredictTime = async (taskData) => {
    try {
      const response = await axios.post('http://localhost:5001/predict', taskData);
      return response.data;
    } catch (err) {
      console.error('Error predicting time:', err);
      return {
        prediction: {
          estimated_time: 60,
          confidence: 0.5
        }
      };
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Task Management System</h1>
        <div className="connection-status">
          <span>Status:</span>
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      <nav className="app-nav">
        <button 
          className={activeTab === 'tasks' ? 'active' : ''}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks
        </button>
        <button 
          className={activeTab === 'form' ? 'active' : ''}
          onClick={() => setActiveTab('form')}
        >
          Create Task
        </button>
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'tasks' && (
          <TaskList 
            tasks={tasks}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
        
        {activeTab === 'form' && (
          <TaskForm 
            onCreateTask={handleCreateTask}
            onPredictTime={handlePredictTime}
            onSuccess={() => setActiveTab('tasks')}
          />
        )}
        
        {activeTab === 'dashboard' && (
          <Dashboard tasks={tasks} />
        )}
      </main>
    </div>
  );
}

export default App;