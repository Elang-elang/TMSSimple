# ai_service.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import logging
import re
import os

# Setup untuk TensorFlow Lite
try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    import tensorflow.lite as tflite

# Konfigurasi logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# In ai_service.py
CORS(app, resources={
    r"/predict": {"origins": "*"},
    r"/model*": {"origins": "*"}
})

# ai_service.py (updated version)
# ... (keep previous imports and setup)

class TaskPredictor:
    def __init__(self, model_path='task_predictor.tflite'):
        self.model_path = model_path
        self.interpreter = None
        self.input_details = None
        self.output_details = None
        self.load_model()
        
        # Mapping complexity ke angka
        self.complexity_map = {'low': 0, 'medium': 1, 'high': 2}
        
        # Keywords untuk estimasi dasar jika model tidak tersedia
        self.time_keywords = {
            'review': 30, 'code': 60, 'debug': 45, 'test': 40,
            'document': 90, 'meeting': 60, 'research': 120,
            'implement': 180, 'design': 150, 'deploy': 90
        }
        
        # Model expected input size
        self.expected_input_size = 256  # Update this based on your model's requirements
    
    def load_model(self):
        """Load TensorFlow Lite model"""
        try:
            if os.path.exists(self.model_path):
                self.interpreter = tflite.Interpreter(model_path=self.model_path)
                self.interpreter.allocate_tensors()
                
                self.input_details = self.interpreter.get_input_details()
                self.output_details = self.interpreter.get_output_details()
                
                # Get actual expected input size from model
                input_shape = self.input_details[0]['shape']
                self.expected_input_size = input_shape[1]  # Assuming shape is [1, 256, ...]
                
                logger.info(f"TensorFlow Lite model loaded successfully. Expected input size: {self.expected_input_size}")
            else:
                logger.warning(f"Model file {self.model_path} not found. Using fallback prediction.")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
    
    def preprocess_input(self, title, description, complexity):
        """Preprocessing input untuk model"""
        try:
            # Feature engineering sederhana
            title_length = len(title) if title else 0
            desc_length = len(description) if description else 0
            complexity_value = self.complexity_map.get(complexity.lower(), 1)
            
            # Hitung kata kunci dalam title dan description
            text = f"{title} {description}".lower()
            keyword_score = sum(1 for keyword in self.time_keywords if keyword in text)
            
            # Gabungkan features utama
            main_features = np.array([
                title_length / 100.0,  # Normalized title length
                desc_length / 500.0,   # Normalized description length
                complexity_value / 2.0, # Normalized complexity
                keyword_score / 10.0   # Normalized keyword score
            ], dtype=np.float32)
            
            # Pad features to match model's expected input size
            if len(main_features) < self.expected_input_size:
                # Create padded array with zeros
                padded_features = np.zeros(self.expected_input_size, dtype=np.float32)
                # Fill the beginning with our actual features
                padded_features[:len(main_features)] = main_features
                return padded_features.reshape(1, -1)
            else:
                return main_features.reshape(1, -1)
        
        except Exception as e:
            logger.error(f"Error in preprocessing: {str(e)}")
            return np.zeros((1, self.expected_input_size), dtype=np.float32)
    
    def predict_with_model(self, features):
        """Prediksi menggunakan TensorFlow Lite model"""
        try:
            if self.interpreter is None:
                return None
            
            # Ensure features match model's expected shape
            if features.shape[1] != self.expected_input_size:
                features = np.pad(
                    features, 
                    ((0, 0), (0, self.expected_input_size - features.shape[1])),
                    mode='constant'
                )
            
            # Set input tensor
            self.interpreter.set_tensor(self.input_details[0]['index'], features)
            
            # Run inference
            self.interpreter.invoke()
            
            # Get output
            output_data = self.interpreter.get_tensor(self.output_details[0]['index'])
            
            # Convert to minutes and add confidence
            estimated_time = int(output_data[0][0] * 240)  # Scale to 0-240 minutes
            confidence = 0.85  # Placeholder confidence
            
            return estimated_time, confidence
        
        except Exception as e:
            logger.error(f"Error in model prediction: {str(e)}")
            return None
    
    # ... (keep the rest of the methods the same)
    
    def fallback_prediction(self, title, description, complexity):
        """Prediksi fallback jika model tidak tersedia"""
        base_time = 60  # 60 minutes base time
        
        # Adjust based on complexity
        complexity_multiplier = {'low': 0.7, 'medium': 1.0, 'high': 1.5}
        multiplier = complexity_multiplier.get(complexity.lower(), 1.0)
        
        # Check for keywords
        text = f"{title} {description}".lower()
        keyword_time = 0
        for keyword, time in self.time_keywords.items():
            if keyword in text:
                keyword_time = max(keyword_time, time)
        
        # Calculate final time
        if keyword_time > 0:
            estimated_time = int(keyword_time * multiplier)
        else:
            estimated_time = int(base_time * multiplier)
        
        # Adjust based on text length
        text_length = len(title) + len(description)
        if text_length > 200:
            estimated_time = int(estimated_time * 1.2)
        elif text_length < 50:
            estimated_time = int(estimated_time * 0.8)
        
        return estimated_time, 0.75  # Lower confidence for fallback
    
    def predict(self, title, description, complexity):
        """Main prediction method"""
        try:
            # Preprocess input
            features = self.preprocess_input(title, description, complexity)
            
            # Try model prediction first
            model_result = self.predict_with_model(features)
            
            if model_result:
                estimated_time, confidence = model_result
            else:
                # Fallback to rule-based prediction
                estimated_time, confidence = self.fallback_prediction(title, description, complexity)
            
            # Ensure reasonable bounds
            estimated_time = max(15, min(480, estimated_time))  # Between 15 minutes and 8 hours
            
            return {
                'estimated_time': estimated_time,
                'confidence': round(confidence, 2)
            }
        
        except Exception as e:
            logger.error(f"Error in prediction: {str(e)}")
            return {
                'estimated_time': 60,  # Default 1 hour
                'confidence': 0.5
            }

# Initialize predictor
predictor = TaskPredictor()

# Routes
@app.route('/predict', methods=['POST'])
def predict_task_time():
    """Prediksi estimasi waktu penyelesaian tugas"""
    try:
        data = request.get_json()
        
        # Validasi input
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        title = data.get('title', '')
        description = data.get('description', '')
        complexity = data.get('complexity', 'medium')
        
        if not title:
            return jsonify({'error': 'Title is required'}), 400
        
        # Make prediction
        prediction = predictor.predict(title, description, complexity)
        
        response = {
            'input': {
                'title': title,
                'description': description,
                'complexity': complexity
            },
            'prediction': prediction
        }
        
        logger.info(f"Prediction made: {prediction['estimated_time']} minutes with {prediction['confidence']} confidence")
        
        return jsonify(response), 200
    
    except Exception as e:
        logger.error(f"Error in prediction endpoint: {str(e)}")
        return jsonify({'error': 'Prediction failed'}), 500

@app.route('/model/info', methods=['GET'])
def model_info():
    """Informasi tentang model"""
    info = {
        'model_loaded': predictor.interpreter is not None,
        'model_path': predictor.model_path,
        'input_shape': None,
        'output_shape': None
    }
    
    if predictor.interpreter:
        info['input_shape'] = predictor.input_details[0]['shape'].tolist()
        info['output_shape'] = predictor.output_details[0]['shape'].tolist()
    
    return jsonify(info), 200

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'ai-prediction-service'}), 200

# Error handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
