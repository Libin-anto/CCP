from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text, JSON, LargeBinary, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="officer") # admin, department_head, officer
    department = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_first_login = Column(Boolean, default=True)
    
    documents_uploaded = relationship("Document", foreign_keys="[Document.uploaded_by]", back_populates="uploader")
    audit_logs = relationship("AuditLog", back_populates="user")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)
    
    classification = Column(String, index=True, nullable=True) # tender, contract, etc
    department = Column(String, index=True, nullable=True)
    
    # Enhanced fields for processing status tracking
    processing_status = Column(String, default="pending", index=True) # pending, processing, completed, failed
    processing_started_at = Column(DateTime, nullable=True)
    processing_completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    file_hash = Column(String, index=True, nullable=True)
    upload_progress = Column(Float, default=0.0)

    # Approval workflow
    approval_status = Column(String, default="pending", index=True)  # pending, approved, rejected
    approved_by = Column(String, ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    uploaded_by = Column(String, ForeignKey("users.id"))
    uploader = relationship("User", foreign_keys=[uploaded_by], back_populates="documents_uploaded")
    
    content_data = relationship("DocumentContent", uselist=False, back_populates="document", cascade="all, delete-orphan")
    processing_logs = relationship("DocumentProcessingLog", back_populates="document", cascade="all, delete-orphan")

class DocumentContent(Base):
    __tablename__ = "document_content"
    
    document_id = Column(String, ForeignKey("documents.id"), primary_key=True)
    extracted_text = Column(Text)
    summary = Column(Text)
    keywords = Column(JSON) # List of keywords
    entities = Column(JSON) # Extracted entities
    embedding_index_id = Column(Integer, nullable=True) # ID in FAISS index (if using integer mapping)
    processing_status = Column(String, default="pending") # pending, processing, completed, failed
    
    document = relationship("Document", back_populates="content_data")

class DocumentProcessingLog(Base):
    __tablename__ = "document_processing_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"), index=True)
    stage = Column(String, index=True)  # upload, ocr, nlp, indexing
    status = Column(String, index=True)  # started, completed, failed
    message = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    document = relationship("Document", back_populates="processing_logs")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    action = Column(String) # view, search, upload
    details = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="audit_logs")
