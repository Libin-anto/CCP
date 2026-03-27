from fastapi import APIRouter, Depends, HTTPException
import os
from sqlalchemy.orm import Session
from app.services.nlp import nlp_service
from app.core.firebase_client import firestore_db
from app.db.session import get_db
from app.models.all_models import Document

router = APIRouter()

from app.api import deps
from app.models.all_models import User

@router.get("/query")
def search_documents(q: str, current_user: User = Depends(deps.get_current_active_user), db: Session = Depends(get_db)):
    if not q:
        return []
    
    # Combined results dictionary to deduplicate by ID
    combined_results = {}

    # 1. Semantic Search (Content)
    try:
        nlp_results = nlp_service.search(q, top_k=5)
        for res in nlp_results:
            # Filter low relevance if needed
            if res['score'] < 1.5: 
                 combined_results[res['doc_id']] = {
                     "score": res['score'],
                     "source": "semantic"
                 }
    except Exception as e:
        print(f"NLP Search failed: {e}")

    # 2. Content Keyword Search (SQL ILIKE)
    try:
        from app.models.all_models import DocumentContent
        
        # Search for keyword in extracted text
        # Using a join or direct query depending on needs. 
        # Here we query DocumentContent directly.
        content_results = db.query(DocumentContent).filter(DocumentContent.extracted_text.ilike(f"%{q}%")).limit(10).all()
        
        for content in content_results:
            doc_id = content.document_id
            if doc_id not in combined_results:
                combined_results[doc_id] = {
                    "score": 0.5, # Better than semantic (usually > 0.8), worse than exact filename (0.0)
                    "source": "content_keyword"
                }
            else:
                # If found by semantic, upgrade source to indicate both
                combined_results[doc_id]["source"] += "+content_keyword"
                # Improve score if it was just semantic
                if combined_results[doc_id]["score"] > 0.5:
                     combined_results[doc_id]["score"] = 0.5

    except Exception as e:
        print(f"Content Keyword Search failed: {e}")

    # 3. Filename Search (SQL ILIKE)
    try:
        if firestore_db:
             pass 
        else:
            # SQL Fallback
            sql_results = db.query(Document).filter(Document.original_filename.ilike(f"%{q}%")).all()
            for doc in sql_results:
                if doc.id not in combined_results:
                    combined_results[doc.id] = {
                        "score": 0.0, # Highest priority
                        "source": "filename"
                    }
                else:
                    combined_results[doc.id]["source"] += "+filename"
                    combined_results[doc.id]["score"] = 0.0
    except Exception as e:
         print(f"SQL Search failed: {e}")

    # 4. Enrich & Format Response
    response = []
    
    # Iterate over unique doc IDs found
    for doc_id, meta in combined_results.items():
        doc_info = {}
        
        if firestore_db:
             doc_ref = firestore_db.collection("documents").document(doc_id).get()
             if doc_ref.exists:
                 doc = doc_ref.to_dict()
                 doc_info = {
                     "id": doc.get("id"),
                     "title": doc.get("original_filename"),
                     "score": meta['score'],
                     "match_type": meta['source'],
                     "department": doc.get("department", "Global"),
                     "classification": doc.get("classification"),
                     "url": doc.get("file_url"),
                     "approval_status": doc.get("approval_status", "approved")
                 }
        else:
            # SQL Retrieval
            doc = db.query(Document).filter(Document.id == doc_id).first()
            if doc:
                 url = doc.file_path
                 if "storage" in url and not url.startswith("http"):
                     filename = os.path.basename(doc.file_path)
                     url = f"http://localhost:8000/static/documents/{filename}"

                 doc_info = {
                     "id": doc.id,
                     "title": doc.original_filename,
                     "score": meta['score'],
                     "match_type": meta['source'],
                     "department": doc.department or "Global",
                     "classification": doc.classification,
                     "url": url,
                     "approval_status": getattr(doc, "approval_status", "approved")
                 }
        
        if doc_info:
            # RBAC Filtering
            allowed = False
            if current_user.role == "admin":
                allowed = True
            elif current_user.role == "manager":
                allowed = (doc_info["department"] == current_user.department) or (doc_info["department"] in ["Global", "General"])
            elif current_user.role == "employee":
                allowed = ((doc_info["department"] == current_user.department) and (doc_info.get("approval_status") == "approved")) or \
                          (doc_info["department"] in ["Global", "General"] and doc_info.get("approval_status") == "approved")
            
            if allowed:
                response.append(doc_info)
            
    # Sort by score (ascending for L2 distance, so 0.0 is best)
    response.sort(key=lambda x: x['score'])
            
    return response
