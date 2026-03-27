# KMRL Document Intelligence System - Run Instructions

This project consists of a FastAPI backend and a React/Vite frontend.

## Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python 3.10+](https://www.python.org/)

## Backend Setup & Running

1. **Navigate to the backend directory**:
   ```powershell
   cd backend
   ```

2. **Create and activate a virtual environment** (Recommended):
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate
   ```

3. **Install dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

4. **Run the server**:
   ```powershell
   python -m uvicorn app.main:app --reload --port 8000
   ```
   The backend will be available at `http://localhost:8000`.

## Frontend Setup & Running

1. **Open a NEW terminal** and navigate to the frontend directory:
   ```powershell
   cd frontend
   ```

2. **Install dependencies**:
   ```powershell
   npm install
   ```

3. **Run the development server**:
   ```powershell
   npm run dev
   ```
   The frontend will be available at (usually) `http://localhost:5173`.

---

### Troubleshooting
- **Port Error**: If `localhost:8000` is in use, you can change the port in the uvicorn command, but you must also update the API URLs in `frontend/src/pages/docs/Search.jsx` and `Upload.jsx`. I have unified both parts of the app to use port 8000.
- **Database**: The project uses SQLite by default (`kmrl_docs.db`), so no external database setup is required for local development.
