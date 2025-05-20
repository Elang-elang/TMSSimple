// src/components/TaskList.js
import React, { useState } from 'react';
import TaskItem from './TaskItem';
import './TaskList.css';

const TaskList = ({ tasks = [], onUpdateTask, onDeleteTask }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const filteredTasks = tasks.filter(task => {
    if (!task) return false;
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (!a || !b) return 0;
    
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'created_at' || sortBy === 'updated_at') {
      aValue = new Date(aValue || 0);
      bValue = new Date(bValue || 0);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const statusCounts = tasks.reduce((acc, task) => {
    if (task && task.status) {
      acc[task.status] = (acc[task.status] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="task-list">
      <div className="task-list-header">
        <h2>Tasks ({tasks.length})</h2>
        
        <div className="task-list-controls">
          <div className="filter-controls">
            <label>Filter:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All ({tasks.length})</option>
              <option value="pending">Pending ({statusCounts.pending || 0})</option>
              <option value="in_progress">In Progress ({statusCounts.in_progress || 0})</option>
              <option value="completed">Completed ({statusCounts.completed || 0})</option>
              <option value="cancelled">Cancelled ({statusCounts.cancelled || 0})</option>
            </select>
          </div>

          <div className="sort-controls">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="created_at">Created Date</option>
              <option value="updated_at">Updated Date</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
              <option value="estimated_time">Estimated Time</option>
            </select>
            <button 
              className="sort-order-btn"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      <div className="task-list-content">
        {sortedTasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks found</p>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')}>
                Show all tasks
              </button>
            )}
          </div>
        ) : (
          <div className="task-grid">
            {sortedTasks.map(task => (
              task && (
                <TaskItem
                  key={task.id || Math.random().toString(36).substr(2, 9)}
                  task={task}
                  onUpdate={onUpdateTask}
                  onDelete={onDeleteTask}
                />
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;