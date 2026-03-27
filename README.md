# KMRL Document Intelligence System

The **KMRL Document Intelligence System** is a comprehensive, AI-powered document management and analytics platform built for Kochi Metro Rail Limited (KMRL). It streamlines the storage, retrieval, processing, and approval workflows of organizational documents using modern machine learning and web technologies.

## ✨ Key Features

- **Role-Based Access Control (RBAC):** Secure user authentication and tiered access for Admins, Managers, and Employees.
- **AI-Powered Document Processing:** 
  - OCR (Optical Character Recognition) using `easyocr` for extracting text from images and scanned records.
  - Semantic Search and vector embeddings via `sentence-transformers` and `faiss-cpu`.
- **Intelligent Analytics Dashboard:** Real-time insights into system health, storage, user activity, and processing statuses.
- **Document Approval Workflows:** Streamlined approval/rejection pipelines mapped to departmental boundaries.
- **Cloud Integration:** Scalable storage and database features powered by Firebase.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18, Vite
- **Styling:** Tailwind CSS, Heroicons
- **Routing:** React Router DOM (v6)
- **Networking:** Axios

### Backend
- **Framework:** FastAPI
- **Database / ORM:** SQLAlchemy, Firebase Admin SDK
- **Authentication:** OAuth2 with JWT tokens (python-jose, bcrypt)
- **AI / Data:** sentence-transformers, easyocr, faiss-cpu, pandas, numPy

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python 3.10+](https://www.python.org/)
- Firebase Service Account credentials (for backend integration)

### Backend Setup

1. **Navigate to the backend directory**:
   ```powershell
   cd backend
   ```

2. **Create and activate a virtual environment** (Recommended):
   ```powershell
   # On Windows
   python -m venv venv
   .\venv\Scripts\Activate
   
   # On macOS/Linux
   # source venv/bin/activate
   ```

3. **Install dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

4. **Environment Variables**:
   Ensure you have configured your `.env` variables and placed your Firebase credentials JSON file in the correct location based on `app.core.firebase_client.py`.

5. **Run the server**:
   ```powershell
   python -m uvicorn app.main:app --reload --port 8000
   ```
   The interactive API documentation will be available at `http://127.0.0.1:8000/docs`.

### Frontend Setup

1. **Open a new terminal** and navigate to the frontend directory:
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
   The frontend UI will be available at `http://localhost:5173`. Make sure the backend is running so the application dashboard can fetch data.

---

## 📋 Default User Roles
- **Admin**: Full system access, User Management, Global Document Management.
- **Manager**: Department-specific visibility, Document Approval capabilities.
- **Employee**: Can upload and track their own documents, views approved departmental documents.

## ⚙️ Troubleshooting
- **Port Conflicts**: If port `8000` is already in use, you can update the `uvicorn` command port. Ensure you update the API URL references (like `127.0.0.1:8000`) in the frontend correspondingly.
- **Connection Refused**: On Windows machines, fetching `localhost:8000` may fail if the frontend tries to resolve IPv6 while Uvicorn defaults to IPv4. The frontend is currently configured to connect directly via `127.0.0.1` to bypass this issue.
