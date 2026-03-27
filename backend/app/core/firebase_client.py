import firebase_admin
from firebase_admin import credentials, firestore, storage
import os
from app.core.config import settings

def initialize_firebase():
    key_path = os.path.join(os.getcwd(), "backend", "serviceAccountKey.json")
    
    # Fallback to absolute path check if CWD is already backend
    if not os.path.exists(key_path):
        key_path = os.path.join(os.getcwd(), "serviceAccountKey.json")
        
    if not os.path.exists(key_path):
        # We'll allow it to fail later or use environment variables if needed, 
        # but for now, we expect the file.
        print(f"WARNING: Firebase key not found at {key_path}")
        return None, None, None

    cred = credentials.Certificate(key_path)
    # bucket name should be project-id.appspot.com
    firebase_admin.initialize_app(cred, {
        'storageBucket': settings.FIREBASE_STORAGE_BUCKET
    })

    db = firestore.client()
    bucket = storage.bucket()
    
    return firebase_admin, db, bucket

# Initialize once
try:
    _app, firestore_db, storage_bucket = initialize_firebase()
except Exception as e:
    print(f"Error initializing Firebase: {e}")
    firestore_db, storage_bucket = None, None
