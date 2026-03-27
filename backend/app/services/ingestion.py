import os
import uuid
import datetime
import shutil
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.services.ocr import content_extractor
from app.services.nlp import nlp_service
from app.core.firebase_client import firestore_db, storage_bucket
from app.models.all_models import Document, DocumentContent

class IngestionService:
    def process_upload(self, file: UploadFile, user_id: str, db: Session = None):
        # 1. Prepare File ID
        file_ext = os.path.splitext(file.filename)[1]
        file_uuid = str(uuid.uuid4())
        safe_filename = f"{file_uuid}{file_ext}"
        
        file_url = ""
        storage_path = ""
        
        # 2. Upload Logic (Firebase vs Local)
        if firestore_db and storage_bucket:
            # Firebase Storage
            blob = storage_bucket.blob(f"documents/{safe_filename}")
            blob.upload_from_file(file.file, content_type=file.content_type)
            file_url = blob.public_url
            storage_path = f"documents/{safe_filename}"
            # Reset file pointer for local extraction if needed, or use the temp file approach below
            file.file.seek(0)
        else:
            # Local Storage Fallback
            upload_dir = os.path.join(os.getcwd(), "storage", "documents")
            os.makedirs(upload_dir, exist_ok=True)
            local_path = os.path.join(upload_dir, safe_filename)
            
            with open(local_path, "wb") as f:
                file.file.seek(0)
                shutil.copyfileobj(file.file, f)
            
            file_url = f"/static/documents/{safe_filename}" # Assuming we serve this via static files
            storage_path = local_path
            file.file.seek(0)

        # 3. Extract Content
        temp_path = f"temp_{safe_filename}"
        with open(temp_path, "wb") as f:
            file.file.seek(0)
            shutil.copyfileobj(file.file, f)
            
        try:
            extracted_text = content_extractor.extract_text(temp_path, file.content_type or "")
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
        # 4. Generate Embeddings & Index
        # Improved Summary: Take first 3 lines or first 300 chars, whichever is cleaner
        lines = [line.strip() for line in extracted_text.split('\n') if line.strip()]
        summary_text = ' '.join(lines[:3])
        if len(summary_text) > 300:
            summary_text = summary_text[:300] + "..."
            
        idx_id = nlp_service.add_to_index(file_uuid, summary_text)
        
        # 4b. Auto-Categorization
        classification = "Unclassified"
        lower_text = extracted_text.lower()
        if any(x in lower_text for x in ["invoice", "bill", "receipt", "payment"]):
             classification = "Finance"
        elif any(x in lower_text for x in ["contract", "agreement", "nda", "legal"]):
             classification = "Legal"
        elif any(x in lower_text for x in ["resume", "cv", "application", "candidate"]):
             classification = "HR"
        elif any(x in lower_text for x in ["report", "audit", "analysis"]):
             classification = "Reports"
        elif any(x in lower_text for x in ["meeting", "minutes", "agenda"]):
             classification = "Meeting"
        
        # 5. Save Metadata (Firestore vs SQL)
        doc_data = {
            "id": file_uuid,
            "original_filename": file.filename,
            "file_url": file_url,
            "storage_path": storage_path,
            "mime_type": file.content_type,
            "uploaded_by": user_id,
            "classification": classification,
            "upload_date": datetime.datetime.utcnow().isoformat(),
            "processing_status": "completed",
            "embedding_index_id": idx_id,
            "extracted_text": extracted_text
        }

        if firestore_db:
             firestore_db.collection("documents").document(file_uuid).set(doc_data)
        elif db:
            # SQL Fallback
            new_doc = Document(
                id=file_uuid,
                original_filename=file.filename,
                file_path=storage_path, # Local path
                mime_type=file.content_type,
                uploaded_by=user_id,
                processing_status="completed",
                classification=classification,
                upload_date=datetime.datetime.utcnow()
            )
            # Create Content
            new_content = DocumentContent(
                document_id=file_uuid,
                extracted_text=extracted_text,
                embedding_index_id=idx_id,
                processing_status="completed"
            )
            db.add(new_doc)
            db.add(new_content)
            db.commit()
            db.refresh(new_doc)
        else:
            print("WARNING: No DB session provided and Firebase not initialized. Metadata not saved persistently.")
        
        return doc_data

ingestion_service = IngestionService()
