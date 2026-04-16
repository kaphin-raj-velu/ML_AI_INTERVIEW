# Interview Copilot AI - Setup Guide

## 🚀 Getting Started

### 1. Backend Setup (FastAPI)
1. Ensure Python 3.9+ is installed.
2. Navigate to `/backend`.
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the API:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### 2. Frontend Setup (React)
1. Navigate to `/frontend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open the browser at the local address provided.

### 3. Chrome Extension Setup
1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked**.
4. Select the `/extension` folder from this project.
5. You will see a floating bubble on every webpage. Select text and click the bubble to analyze, or use the popup.

## 🧠 AI Features
- **Real-time Bias Detection**: Categorizes questions into Gender, Age, Religion, Cultural, and Disability bias.
- **Legal Compliance**: Flags questions that violate EEOC guidelines.
- **Smart Rewriter**: Provides safe alternatives focused on skills.
- **Analytics**: Session-based distribution of bias categories.

## 🛠 Tech Stack
- **Backend**: FastAPI, Pydantic, Uvicorn.
- **Frontend**: React, Vite, Tailwind CSS, Recharts, Framer Motion.
- **Extension**: Chrome Manifest V3, Content Scripts.
