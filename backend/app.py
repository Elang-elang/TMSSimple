# app.py
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import apsw
import json
import datetime
import os
import logging
from werkzeug.exceptions import BadRequest
import requests


# Konfigurasi logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inisialisasi Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
# In app.py
CORS(app, resources={
    r"/tasks*": {"origins": "*"},
    r"/socket.io*": {"origins": "*"}
})
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

# Konfigurasi database
DATABASE_PATH = 'tasks.db'
AI_SERVICE_URL = 'http://localhost:5001'

# Update the DatabaseManager class in app.py
class DatabaseManager:
    def __init__(self, db_path):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        try:
            conn = apsw.Connection(self.db_path)
            conn.setbusytimeout(3000)  # 3 second timeout
            return conn
        except apsw.Error as e:
            logger.error(f"Database connection failed: {str(e)}")
            raise
    
    def init_database(self):
        """Initialize database tables with better error handling"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS tasks (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT NOT NULL,
                        description TEXT,
                        status TEXT DEFAULT 'pending',
                        estimated_time INTEGER,
                        actual_time INTEGER,
                        complexity TEXT DEFAULT 'medium',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                cursor.execute('''
                    CREATE TRIGGER IF NOT EXISTS update_timestamp 
                    AFTER UPDATE ON tasks 
                    BEGIN
                        UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                    END
                ''')
                logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing database: {str(e)}")
            raise

# Instance database manager
db_manager = DatabaseManager(DATABASE_PATH)

# Validasi input
def validate_task_input(data):
    """Validasi input untuk task"""
    errors = []
    
    if not data.get('title') or not data['title'].strip():
        errors.append('Title is required')
    
    if data.get('title') and len(data['title']) > 200:
        errors.append('Title must be less than 200 characters')
    
    if data.get('description') and len(data['description']) > 1000:
        errors.append('Description must be less than 1000 characters')
    
    valid_statuses = ['pending', 'in_progress', 'completed', 'cancelled']
    if data.get('status') and data['status'] not in valid_statuses:
        errors.append(f'Status must be one of: {", ".join(valid_statuses)}')
    
    valid_complexity = ['low', 'medium', 'high']
    if data.get('complexity') and data['complexity'] not in valid_complexity:
        errors.append(f'Complexity must be one of: {", ".join(valid_complexity)}')
    
    return errors

# Routes
@app.route('/tasks', methods=['GET'])
def get_tasks():
    """Mengambil semua tugas"""
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, title, description, status, estimated_time, 
                       actual_time, complexity, created_at, updated_at
                FROM tasks 
                ORDER BY created_at DESC
            ''')
            
            tasks = []
            for row in cursor.fetchall():
                tasks.append({
                    'id': row[0],
                    'title': row[1],
                    'description': row[2],
                    'status': row[3],
                    'estimated_time': row[4],
                    'actual_time': row[5],
                    'complexity': row[6],
                    'created_at': row[7],
                    'updated_at': row[8]
                })
            
            return jsonify({'tasks': tasks}), 200
    
    except Exception as e:
        logger.error(f"Error fetching tasks: {str(e)}")
        return jsonify({'error': 'Failed to fetch tasks'}), 500

@app.route('/tasks', methods=['POST'])
def create_task():
    try:
        data = request.get_json()
        
        # Validasi input
        errors = validate_task_input(data)
        if errors:
            return jsonify({'errors': errors}), 400
        
        # Prediksi estimasi waktu menggunakan AI service
        estimated_time = None
        try:
            ai_response = requests.post(f'{AI_SERVICE_URL}/predict', 
                                      json={
                                          'title': data['title'],
                                          'description': data.get('description', ''),
                                          'complexity': data.get('complexity', 'medium')
                                      }, timeout=5)
            
            if ai_response.status_code == 200:
                prediction = ai_response.json()
                estimated_time = prediction.get('prediction', {}).get('estimated_time')
        except Exception as e:
            logger.warning(f"AI prediction failed: {str(e)}")
        
        # Simpan ke database
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO tasks (title, description, status, estimated_time, complexity)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                data['title'],
                data.get('description', ''),
                data.get('status', 'pending'),
                estimated_time,
                data.get('complexity', 'medium')
            ))
            
            # Get the last inserted rowid using APSW's proper method
            task_id = cursor.getconnection().last_insert_rowid()
            
            # Ambil data lengkap task yang baru dibuat
            cursor.execute('''
                SELECT id, title, description, status, estimated_time, 
                       actual_time, complexity, created_at, updated_at
                FROM tasks WHERE id = ?
            ''', (task_id,))
            
            row = cursor.fetchone()
            new_task = {
                'id': row[0],
                'title': row[1],
                'description': row[2],
                'status': row[3],
                'estimated_time': row[4],
                'actual_time': row[5],
                'complexity': row[6],
                'created_at': row[7],
                'updated_at': row[8]
            }
        
        # Emit real-time update
        socketio.emit('task_created', new_task, room='tasks')
        
        return jsonify(new_task), 201
    
    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        return jsonify({'error': 'Failed to create task'}), 500

@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update tugas"""
    try:
        data = request.get_json()
        
        # Validasi input
        errors = validate_task_input(data)
        if errors:
            return jsonify({'errors': errors}), 400
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if task exists
            cursor.execute('SELECT id FROM tasks WHERE id = ?', (task_id,))
            if not cursor.fetchone():
                return jsonify({'error': 'Task not found'}), 404
            
            # Update task
            cursor.execute('''
                UPDATE tasks 
                SET title = ?, description = ?, status = ?, 
                    actual_time = ?, complexity = ?
                WHERE id = ?
            ''', (
                data.get('title'),
                data.get('description'),
                data.get('status'),
                data.get('actual_time'),
                data.get('complexity'),
                task_id
            ))
            
            # Fetch updated task
            cursor.execute('''
                SELECT id, title, description, status, estimated_time, 
                       actual_time, complexity, created_at, updated_at
                FROM tasks WHERE id = ?
            ''', (task_id,))
            
            row = cursor.fetchone()
            updated_task = {
                'id': row[0],
                'title': row[1],
                'description': row[2],
                'status': row[3],
                'estimated_time': row[4],
                'actual_time': row[5],
                'complexity': row[6],
                'created_at': row[7],
                'updated_at': row[8]
            }
        
        # Emit real-time update
        socketio.emit('task_updated', updated_task, room='tasks')
        
        return jsonify(updated_task), 200
    
    except Exception as e:
        logger.error(f"Error updating task: {str(e)}")
        return jsonify({'error': 'Failed to update task'}), 500

@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Hapus tugas"""
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if task exists
            cursor.execute('SELECT id FROM tasks WHERE id = ?', (task_id,))
            if not cursor.fetchone():
                return jsonify({'error': 'Task not found'}), 404
            
            # Delete task
            cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
        
        # Emit real-time update
        socketio.emit('task_deleted', {'id': task_id}, room='tasks')
        
        return '', 204
    
    except Exception as e:
        logger.error(f"Error deleting task: {str(e)}")
        return jsonify({'error': 'Failed to delete task'}), 500

# Socket.IO Events
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f"Client connected: {request.sid}")
    emit('connected', {'message': 'Connected to task management system'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('join_tasks')
def handle_join_tasks():
    """Join tasks room for real-time updates"""
    from flask_socketio import join_room
    join_room('tasks')
    logger.info(f"Client {request.sid} joined tasks room")
    emit('joined_tasks', {'message': 'Joined tasks room'})

@socketio.on('leave_tasks')
def handle_leave_tasks():
    """Leave tasks room"""
    from flask_socketio import leave_room
    leave_room('tasks')
    logger.info(f"Client {request.sid} left tasks room")
# Health check endpoint
@app.route('/test-db')
def test_db():
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            return jsonify({'status': 'success', 'tables': tables})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'task-management-backend'}), 200

# Error handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
