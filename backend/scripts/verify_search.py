import requests
import json
import time
import sys
import os

# Add parent directory to path to allow importing app modules
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.all_models import User
from app.core.security import get_password_hash

BASE_URL = "http://localhost:8000/api/v1"

def setup_test_user():
    db = SessionLocal()
    email = "test_hybrid@example.com"
    password = "testpassword123"
    
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Creating test user: {email}")
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                role="admin",
                is_active=True,
                is_first_login=False
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            print(f"Test user already exists: {email}")
            
        return email, password
    except Exception as e:
        print(f"Database error during user setup: {e}")
        return None, None
    finally:
        db.close()

def get_auth_token(email, password):
    url = f"{BASE_URL}/auth/login"
    data = {"username": email, "password": password}
    
    try:
        response = requests.post(url, data=data)
        if response.status_code == 200:
            return response.json().get("access_token")
        else:
            print(f"Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"Login request failed: {e}")
        return None

def test_upload_and_search():
    # 0. Setup User & Auth
    email, password = setup_test_user()
    if not email:
        return
        
    token = get_auth_token(email, password)
    if not token:
        print("Could not get auth token. Aborting.")
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    print("Authentication successful.")

    # 1. Create a dummy file
    filename = "test_hybrid_search_doc.txt"
    unique_keyword = "ANTIGRAVITY_SECRET_KEYWORD_12345"
    content = f"This is a test document for hybrid search. It contains a unique keyword: {unique_keyword}. End of document."
    
    with open(filename, "w") as f:
        f.write(content)
        
    print(f"Created test file: {filename}")

    # 2. Upload the file
    print("Uploading file...")
    try:
        with open(filename, "rb") as f:
            files = {"file": (filename, f, "text/plain")}
            response = requests.post(f"{BASE_URL}/documents/upload", files=files, headers=headers)
            
        if response.status_code != 200:
            print(f"Upload failed: {response.text}")
            return
            
        doc_data = response.json()
        doc_id = doc_data.get("document_id")
        print(f"Upload successful. Doc ID: {doc_id}")
    except Exception as e:
        print(f"Upload request failed. Ensure backend is running. Error: {e}")
        return

    # 3. Wait for ingestion
    print("Waiting for ingestion...")
    time.sleep(2)

    # 4. Search by Content Keyword
    print(f"Searching for keyword: {unique_keyword}")
    try:
        search_res = requests.get(f"{BASE_URL}/search/query", params={"q": unique_keyword}, headers=headers)
        
        if search_res.status_code != 200:
            print(f"Search failed: {search_res.text}")
            return
            
        results = search_res.json()
        print(f"Search Results: {json.dumps(results, indent=2)}")
        
        found = False
        for res in results:
            if res["id"] == doc_id:
                found = True
                print("SUCCESS: Document found via content keyword search!")
                print(f"Match Type: {res.get('match_type')}")
                break
        
        if not found:
            print("FAILURE: Document NOT found by content keyword.")

    except Exception as e:
        print(f"Search request failed. Error: {e}")
        
    # Cleanup (Optional)
    if os.path.exists(filename):
        os.remove(filename)

if __name__ == "__main__":
    test_upload_and_search()
