// src/components/TaskForm.js
import React, { useState } from 'react';
import './TaskForm.css';

const TaskForm = ({ onCreateTask, onPredictTime, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    complexity: 'medium',
    status: 'pending'
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear prediction when title or complexity changes
    if (name === 'title' || name === 'complexity') {
      setPrediction(null);
    }
  };

  const handlePredict = async () => {
    if (!formData.title.trim()) {
      setError('Please enter a task title before predicting time');
      return;
    }

    try {
      setPredicting(true);
      setError(null);
      
      const result = await onPredictTime({
        title: formData.title,
        description: formData.description,
        complexity: formData.complexity
      });
      
      setPrediction(result.prediction);
    } catch (error) {
      setError(`Prediction failed: ${error.message}`);
      setPrediction(null);
    } finally {
      setPredicting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Please enter a task title');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await onCreateTask(formData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        complexity: 'medium',
        status: 'pending'
      });
      setPrediction(null);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setError(`Failed to create task: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="task-form">
      <div className="task-form-header">
        <h2>Create New Task</h2>
      </div>

      {error && (
        <div className="form-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="task-form-content">
        <div className="form-group">
          <label htmlFor="title">Task Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            disabled={loading}
            placeholder="Enter task title..."
            maxLength="200"
            required
          />
          <small>{formData.title.length}/200 characters</small>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            disabled={loading}
            placeholder="Enter task description..."
            rows="4"
            maxLength="1000"
          />
          <small>{formData.description.length}/1000 characters</small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="complexity">Complexity</label>
            <select
              id="complexity"
              name="complexity"
              value={formData.complexity}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">Initial Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
            </select>
          </div>
        </div>

        <div className="prediction-section">
          <div className="prediction-header">
            <h3>AI Time Estimation</h3>
            <button
              type="button"
              onClick={handlePredict}
              disabled={predicting || !formData.title.trim()}
              className="btn-predict"
            >
              {predicting ? 'Predicting...' : 'Get Prediction'}
            </button>
          </div>

          {prediction && (
            <div className="prediction-result">
              <div className="prediction-time">
                <span className="prediction-label">Estimated Time:</span>
                <span className="prediction-value">
                  {formatTime(prediction.estimated_time)}
                </span>
              </div>
              <div className="prediction-confidence">
                <span className="prediction-label">Confidence:</span>
                <span className="prediction-value">
                  {(prediction.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="prediction-bar">
                <div 
                  className="prediction-fill"
                  style={{ width: `${prediction.confidence * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading || !formData.title.trim()}
            className="btn-primary"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({
                title: '',
                description: '',
                complexity: 'medium',
                status: 'pending'
              });
              setPrediction(null);
              setError(null);
            }}
            disabled={loading}
            className="btn-secondary"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
