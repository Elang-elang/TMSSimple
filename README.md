# **🚀 TaskMaster AI: Intelligent Task Management System simple**  

---

## **✨ Why TaskMaster AI?**  

Tired of manually estimating how long tasks will take? **TaskMaster AI** is a **real-time, AI-powered task management system** that:  

✅ **Predicts task completion time** using machine learning  
✅ **Syncs instantly** across devices with WebSocket technology  
✅ **Beautiful dashboard** with interactive charts and analytics  
✅ **Self-learning** – improves estimates based on your actual task times  
✅ **Open-source & customizable** – modify it to fit your workflow  

Built with **Python (Flask), React, and TensorFlow Lite**, this system is perfect for **developers, project managers, and productivity enthusiasts** who want **smarter task tracking**.  

---

## **🔥 Key Features**  

### **📊 Smart Task Management**  
- Create, update, and delete tasks with ease  
- AI estimates time based on **title, description, and complexity**  
- Track **actual vs. estimated time** for better planning  

### **⚡ Real-Time Updates**  
- **Instant sync** between multiple users  
- No page reloads needed – changes appear immediately  

### **📈 Analytics Dashboard**  
- Visualize task status (**pending, in progress, completed**)  
- Breakdown by **complexity (low, medium, high)**  
- Compare **estimated vs. actual time**  

### **🤖 AI-Powered Predictions**  
- Uses **TensorFlow Lite** for fast, lightweight predictions  
- Fallback to **rule-based estimation** if AI model fails  
- Confidence score shows prediction reliability  

---

## **🛠 Tech Stack**  

| **Category**       | **Technology** | **Why?** |
|-------------------|--------------|---------|
| **Backend**       | Python (Flask) | Lightweight & scalable |
| **Database**      | SQLite (APSW) | Fast, file-based, no setup needed |
| **Real-Time**     | Socket.IO | Bidirectional event-based updates |
| **Frontend**      | React 18 | Modern, fast UI |
| **AI Engine**     | TensorFlow Lite | Optimized for edge inference |
| **Charts**        | Chart.js | Beautiful, interactive visualizations |

---

## **🚀 Quick Setup (3 Steps)**  

### **1️⃣ Clone & Install**  
```bash
git clone https://github.com/Elang-elang/TMSSimple.git
cd TMSSimple
```

### **2️⃣ Run the Backend & AI Service**  
```bash
# Start the Flask backend (Port 5000)
cd backend
pip install -r requirements.txt
python app.py

# Start the AI service (Port 5001)
cd ../ai_service
pip install -r requirements.txt
python ai_service.py
```

### **3️⃣ Launch the React Frontend**  
```bash
cd ../frontend
npm install
npm start  # Runs on http://localhost:3000
```

**✨ Boom!** Open [http://localhost:3000](http://localhost:3000) and start managing tasks intelligently.  

---

## **📂 Project Structure**  

```
taskmaster-ai/
├── 📁 ai_service/        # AI prediction microservice
│   ├── 🤖 ai_service.py  # Flask + TensorFlow Lite
│   └── 📥 load_ai.py     # Downloads ML model
├── 📁 backend/           # Main API & WebSocket server
│   └── 🚀 app.py         # Flask + Socket.IO
└── 📁 frontend/          # React dashboard
    ├── 📁 public/        # Static files
    ├── 📁 src/           # React components
    └── 📄 package.json   # Frontend dependencies
```

---

## **🔍 How the AI Works**  

1. **Input Analysis**  
   - Extracts keywords from **title & description**  
   - Maps **complexity (low/medium/high)** to numerical values  

2. **Prediction Engine**  
   - **Primary:** TensorFlow Lite model (if available)  
   - **Fallback:** Rule-based heuristic (time multipliers)  

3. **Confidence Scoring**  
   - Returns **estimated minutes + confidence %**  
   - Adjusts based on historical accuracy  

---

## **📊 Dashboard Preview**  

![Dashboard Screenshot Ilustration](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnpblzerH29ISuxSABNDb6EC9nerXbVjyvvCaZQgApWhNheRfRyDgO9uIk&s=10)  

- **Task Status Distribution** (Bar Chart)  
- **Complexity Breakdown** (Pie Chart)  
- **Avg. Estimated vs. Actual Time**  

---
