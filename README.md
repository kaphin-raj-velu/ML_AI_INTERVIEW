Interview Copilot AI
Real-Time Bias Detection and Question Correction System
📌 Overview

Interview Copilot AI is an intelligent system designed to detect biased or inappropriate interview questions in real-time and suggest professional alternatives. It helps improve fairness, reduce discrimination, and ensure ethical hiring practices.

🎯 Problem Statement

Interviewers may unknowingly ask biased questions related to:

Gender
Age
Religion
Personal life

This can lead to:

Unfair hiring decisions
Legal risks
Lack of inclusivity
💡 Solution

This project provides a real-time bias detection system that:

Identifies biased interview questions
Classifies them into categories
Suggests neutral and professional alternatives
🧠 Key Features
✅ Real-time bias detection
✅ Automatic question correction
✅ Hybrid AI (Rule-Based + BERT)
✅ Confidence scoring
✅ User-friendly UI
✅ Secure authentication (JWT)
🛠️ Tech Stack
🔹 Frontend
React
Tailwind CSS
🔹 Backend
FastAPI (Python)
🔹 AI / NLP
Rule-based NLP (Regex + Patterns)
BERT (HuggingFace Transformers)
🔹 Database
JSON-based dataset
🔹 Authentication
JWT (JSON Web Tokens)
Passlib (bcrypt hashing)
⚙️ How It Works
User enters an interview question
Backend processes the input
Rule-based NLP checks for bias patterns
BERT analyzes contextual meaning (if needed)
System classifies the question:
Safe
Biased / Illegal
Suggestion engine generates improved question
Result is displayed to the user
📊 Model Evaluation
Dataset Split: 80% Training / 20% Testing
Metrics:
Accuracy: 89%
Precision: 87%
Recall: 85%
F1 Score: 86%
📂 Project Structure
backend/
│── main.py
│── routes/
│   ├── auth.py
│   ├── analysis.py
│── services/
│   ├── bias_detector.py
│   ├── bert_detector.py
│── data/
│   ├── dat.json
│   ├── users.json

frontend/
│── src/
│   ├── components/
│   ├── pages/
│   ├── App.js
🔐 Authentication
User signup & login
Password hashing using bcrypt
JWT-based secure sessions
🚀 Installation & Setup
1️⃣ Clone the repository
git clone https://github.com/your-username/interview-copilot-ai.git
cd interview-copilot-ai
2️⃣ Backend Setup
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
3️⃣ Frontend Setup
cd frontend
npm install
npm start
🌐 API Endpoints
Endpoint	Method	Description
/api/auth/signup	POST	Register user
/api/auth/login	POST	Login user
/api/analyze	POST	Analyze interview question
⚠️ Limitations
Limited dataset size
Struggles with subtle contextual bias
BERT not fully fine-tuned
🔮 Future Scope
Fine-tuned BERT model
Multi-agent AI system
Real-time platform integration
Multilingual support
Voice-based bias detection

This project is for academic and research purposes.

👨‍💻 Authors
TEAM MEMBER1:PRIYADHARSHAN R
TEAM MEMBER2:KAPHIN RAJ VELU G K
TEAM MEMBER3:KARTHIK ARAVIND M
TEAM MEMBER4:JAIDEV M V



This project aims to make hiring processes more fair, inclusive, and unbiased using AI.
