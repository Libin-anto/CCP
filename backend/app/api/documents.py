from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.services.ingestion import ingestion_service
from app.api import deps
from app.models.all_models import User, Document
from app.db.session import get_db
import traceback, os

router = APIRouter()

def enrich_doc(doc):
    d = {c.name: getattr(doc, c.name) for c in doc.__table__.columns}
    if doc.file_path:
        filename = os.path.basename(doc.file_path)
        d["url"] = f"http://localhost:8000/static/documents/{filename}"
    else:
        d["url"] = "#"
    if doc.uploader:
        d["uploaded_by_email"] = doc.uploader.email
    return d

@router.get("/")
def list_documents(
    skip: int = 0,
    limit: int = 20,
    q: str = None,
    status: str = None,
    department: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    query = db.query(Document)

    # Role-based filtering
    if current_user.role == "employee":
        from sqlalchemy import or_
        query = query.filter(
            or_(
                Document.uploaded_by == current_user.id,
                (Document.department == current_user.department) & (Document.approval_status == "approved")
            )
        )
    elif current_user.role == "manager":
        query = query.filter(Document.department == current_user.department)
    # admin sees all

    if q:
        query = query.filter(Document.original_filename.ilike(f"%{q}%"))
    if status:
        query = query.filter(Document.approval_status == status)
    if department and current_user.role == "admin":
        query = query.filter(Document.department == department)

    total = query.count()
    docs = query.order_by(Document.upload_date.desc()).offset(skip).limit(limit).all()
    return {"items": [enrich_doc(d) for d in docs], "total": total, "skip": skip, "limit": limit}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        doc_data = ingestion_service.process_upload(file, current_user.id, db)
        # Set department from user
        doc = db.query(Document).filter(Document.id == doc_data["id"]).first()
        if doc:
            doc.department = current_user.department
            doc.approval_status = "pending"
            db.commit()
        return {"status": "success", "document_id": doc_data["id"], "filename": doc_data["original_filename"], "approval_status": "pending"}
    except Exception as e:
        print(f"Error in upload_document: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


class RejectData(BaseModel):
    reason: Optional[str] = None

@router.put("/{doc_id}/approve")
def approve_document(
    doc_id: str,
    current_user: User = Depends(deps.get_current_manager_or_admin),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if current_user.role == "manager" and doc.department != current_user.department:
        raise HTTPException(status_code=403, detail="Cannot approve documents outside your department")
    doc.approval_status = "approved"
    doc.approved_by = current_user.id
    doc.rejection_reason = None
    db.commit()
    return {"status": "success", "message": "Document approved"}


@router.put("/{doc_id}/reject")
def reject_document(
    doc_id: str,
    data: RejectData,
    current_user: User = Depends(deps.get_current_manager_or_admin),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if current_user.role == "manager" and doc.department != current_user.department:
        raise HTTPException(status_code=403, detail="Cannot reject documents outside your department")
    doc.approval_status = "rejected"
    doc.rejection_reason = data.reason
    db.commit()
    return {"status": "success", "message": "Document rejected"}


@router.delete("/all")
def delete_all_documents(
    current_user: User = Depends(deps.get_current_manager_or_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if current_user.role == "manager":
        query = query.filter(Document.department == current_user.department)
        
    docs = query.all()
    deleted_count = 0
    for doc in docs:
        try:
            if doc.file_path and os.path.exists(doc.file_path):
                os.remove(doc.file_path)
            deleted_count += 1
        except Exception as e:
            print(f"Error deleting file from disk: {e}")
    try:
        # We delete the specific retrieved documents
        for doc in docs:
            db.delete(doc)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database delete all failed: {str(e)}")
    return {"status": "success", "message": f"Deleted {deleted_count} documents"}


@router.delete("/{doc_id}")
def delete_document(
    doc_id: str,
    current_user: User = Depends(deps.get_current_manager_or_admin),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if current_user.role == "manager" and doc.department != current_user.department:
        raise HTTPException(status_code=403, detail="Cannot delete documents outside your department")
        
    try:
        if doc.file_path and os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except Exception as e:
        print(f"Error deleting file from disk: {e}")
    try:
        db.delete(doc)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database delete failed: {str(e)}")
    return {"status": "success", "message": "Document deleted"}
