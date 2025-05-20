# Di load_ai.py
import urllib.request
import os

model_url = "https://storage.googleapis.com/download.tensorflow.org/models/tflite/text_classification/text_classification.tflite"
model_path = "task_predictor.tflite"

if not os.path.exists(model_path):
    print("Downloading model...")
    urllib.request.urlretrieve(model_url, model_path)
    print("Model downloaded successfully")
else:
    print("Model already exists")
