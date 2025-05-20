// src/components/TaskItem.js
import React, { useState } from 'react';
import './TaskItem.css';

const TaskItem = ({ task = {}, onUpdate, onDelete }) => {
  // Provide default values for task properties
  const safeTask = {
    id: task.id || '',
    title: task.title || 'Untitled Task',
    description: task.description || '',
    status: task.status || 'pending',
    complexity: task.complexity || 'medium',
    estimated_time: task.estimated_time || 0,
    actual_time: task.actual_time || 0,
    created_at: task.created_at || new Date().toISOString(),
    updated_at: task.updated_at || new Date().toISOString()
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: safeTask.title,
    description: safeTask.description,
    status: safeTask.status,
    actual_time: safeTask.actual_time,
    complexity: safeTask.complexity
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      title: safeTask.title,
      description: safeTask.description,
      status: safeTask.status,
      actual_time: safeTask.actual_time,
      complexity: safeTask.complexity
    });
    setError(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await onUpdate(safeTask.id, editData);
      setIsEditing(false);
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        setLoading(true);
        await onDelete(safeTask.id);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return 'Not set';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadgeClass = (status) => {
    const safeStatus = status || 'pending';
    switch (safeStatus) {
      case 'pending': return 'status-pending';
      case 'in_progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const getComplexityBadgeClass = (complexity) => {
    const safeComplexity = complexity || 'medium';
    switch (safeComplexity) {
      case 'low': return 'complexity-low';
      case 'medium': return 'complexity-medium';
      case 'high': return 'complexity-high';
      default: return 'complexity-medium';
    }
  };

  const formatStatusText = (status) => {
    return (status || 'pending').replace('_', ' ');
  };

  const formatComplexityText = (complexity) => {
    return complexity || 'medium';
  };

  return (
    <div className={`task-item ${isEditing ? 'editing' : ''}`}>
      {error && (
        <div className="task-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {isEditing ? (
        <div className="task-edit-form">
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({...editData, title: e.target.value})}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
              disabled={loading}
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status:</label>
              <select
                value={editData.status}
                onChange={(e) => setEditData({...editData, status: e.target.value})}
                disabled={loading}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label>Complexity:</label>
              <select
                value={editData.complexity}
                onChange={(e) => setEditData({...editData, complexity: e.target.value})}
                disabled={loading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Actual Time (minutes):</label>
            <input
              type="number"
              value={editData.actual_time}
              onChange={(e) => setEditData({...editData, actual_time: e.target.value})}
              disabled={loading}
              min="0"
            />
          </div>

          <div className="task-actions">
            <button 
              onClick={handleSave}
              disabled={loading || !editData.title.trim()}
              className="btn-primary"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button 
              onClick={handleCancel}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="task-content">
          <div className="task-header">
            <h3 className="task-title">{safeTask.title}</h3>
            <div className="task-badges">
              <span className={`status-badge ${getStatusBadgeClass(safeTask.status)}`}>
                {formatStatusText(safeTask.status)}
              </span>
              <span className={`complexity-badge ${getComplexityBadgeClass(safeTask.complexity)}`}>
                {formatComplexityText(safeTask.complexity)}
              </span>
            </div>
          </div>

          {safeTask.description && (
            <p className="task-description">{safeTask.description}</p>
          )}

          <div className="task-times">
            <div className="time-item">
              <span className="time-label">Estimated:</span>
              <span className="time-value">{formatTime(safeTask.estimated_time)}</span>
            </div>
            {safeTask.actual_time && (
              <div className="time-item">
                <span className="time-label">Actual:</span>
                <span className="time-value">{formatTime(safeTask.actual_time)}</span>
              </div>
            )}
          </div>

          <div className="task-dates">
            <div className="date-item">
              <span className="date-label">Created:</span>
              <span className="date-value">{formatDate(safeTask.created_at)}</span>
            </div>
            {safeTask.updated_at !== safeTask.created_at && (
              <div className="date-item">
                <span className="date-label">Updated:</span>
                <span className="date-value">{formatDate(safeTask.updated_at)}</span>
              </div>
            )}
          </div>

          <div className="task-actions">
            <button 
              onClick={handleEdit}
              disabled={loading}
              className="btn-secondary"
            >
              Edit
            </button>
            <button 
              onClick={handleDelete}
              disabled={loading}
              className="btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;