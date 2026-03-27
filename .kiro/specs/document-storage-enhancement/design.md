# Design Document: Document Storage Enhancement

## Overview

This design enhances the existing KMRL Document Intelligence System by improving the user interface for document uploads and extending the database functionality to provide better document management, real-time status tracking, and upload history.

The current system already has a solid foundation with SQLAlchemy models, FastAPI backend, and React frontend. This enhancement builds upon that foundation to provide a more robust and user-friendly document management experience.

## Architecture

### Current System Analysis
- **Backend**: FastAPI with SQLAlchemy ORM, SQLite database
- **Models**: Document, DocumentContent, User, AuditLog tables already exist
- **Processing**: Synchronous upload processing with OCR and NLP services
- **Frontend**: React with file upload component

### Enhanced Architecture Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React UI      │    │   FastAPI API    │    │   Database      │
│   Enhanced      │◄──►│   Enhanced       │◄──►│   Enhanced      │
│   Upload        │    │   Endpoints      │    │   Schema        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────▼────────┐             │
         │              │  Background     │             │
         └──────────────►│  Processing     │◄────────────┘
                        │  Queue          │
                        └─────────────────┘
```

## Components and Interfaces

### 1. Enhanced Database Schema

**New Fields for Document Model:**
- `processing_status`: Enum (pending, processing, completed, failed)
- `processing_started_at`: DateTime
- `processing_completed_at`: DateTime
- `error_message`: Text (for failed uploads)
- `file_hash`: String (for duplicate detection)

**New DocumentProcessingLog Model:**
```python
class DocumentProcessingLog(Base):
    __tablename__ = "document_processing_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"))
    stage = Column(String)  # upload, ocr, nlp, indexing
    status = Column(String)  # started, completed, failed
    message = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("Document")
```

### 2. Enhanced API Endpoints

**New Endpoints:**
- `GET /api/v1/documents/` - List all documents with pagination and filtering
- `GET /api/v1/documents/{id}/status` - Get processing status for specific document
- `DELETE /api/v1/documents/{id}` - Delete document and associated files
- `GET /api/v1/documents/stats` - Get upload statistics and counts

**Enhanced Endpoints:**
- `POST /api/v1/documents/upload` - Enhanced with better error handling and status tracking
- `GET /api/v1/documents/{id}` - Include processing logs and detailed metadata

### 3. Background Processing System

**Asynchronous Processing Pipeline:**
```python
class AsyncIngestionService:
    async def process_upload_async(self, document_id: str, db: Session):
        # Update status to processing
        # Extract content in background
        # Generate embeddings
        # Update status to completed/failed
        # Log each step
```

**Processing Stages:**
1. File validation and storage
2. Content extraction (OCR/text parsing)
3. NLP processing and entity extraction
4. Vector embedding generation
5. Search index updating

### 4. Enhanced Frontend Components

**DocumentUploadManager Component:**
- Real-time progress tracking
- Batch upload management
- Upload history display
- Status polling mechanism

**DocumentList Component:**
- Paginated document history
- Filter and search capabilities
- Status indicators with progress bars
- Action buttons (view, delete, reprocess)

**UploadProgress Component:**
- Individual file progress bars
- Estimated time remaining
- Cancel upload functionality
- Error message display

## Data Models

### Enhanced Document Model
```python
class Document(Base):
    # Existing fields...
    processing_status = Column(String, default="pending")
    processing_started_at = Column(DateTime, nullable=True)
    processing_completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    file_hash = Column(String, index=True, nullable=True)
    upload_progress = Column(Float, default=0.0)
```

### Document Processing Response Schema
```python
class DocumentResponse(BaseModel):
    id: str
    original_filename: str
    file_size: int
    upload_date: datetime
    processing_status: str
    processing_progress: float
    error_message: Optional[str]
    uploader_email: str
```

## Error Handling

### Backend Error Handling
- **File Validation**: Size limits, file type validation, virus scanning
- **Processing Errors**: OCR failures, NLP service timeouts, database connection issues
- **Storage Errors**: Disk space, permission issues, file corruption
- **Graceful Degradation**: Partial processing completion, retry mechanisms

### Frontend Error Handling
- **Upload Errors**: Network timeouts, file size exceeded, invalid file types
- **Status Polling**: Connection failures, server errors, timeout handling
- **User Feedback**: Clear error messages, retry options, support contact information

## Testing Strategy

### Backend Testing
- **Unit Tests**: Model validation, service layer logic, API endpoint responses
- **Integration Tests**: Database operations, file storage, external service integration
- **Performance Tests**: Large file uploads, concurrent processing, database queries

### Frontend Testing
- **Component Tests**: Upload component behavior, progress tracking, error states
- **Integration Tests**: API communication, real-time updates, user workflows
- **E2E Tests**: Complete upload workflow, error scenarios, browser compatibility

### Test Data Management
- **Mock Services**: OCR and NLP service mocking for consistent testing
- **Test Files**: Sample documents of various types and sizes
- **Database Fixtures**: Predefined test data for consistent test scenarios

## Performance Considerations

### Database Optimization
- **Indexing**: Add indexes on frequently queried fields (status, upload_date, user_id)
- **Pagination**: Implement cursor-based pagination for large document lists
- **Connection Pooling**: Optimize database connection management

### File Storage Optimization
- **Storage Tiers**: Move old documents to cheaper storage after processing
- **Compression**: Compress stored files to save space
- **CDN Integration**: Serve files through CDN for better performance

### Frontend Optimization
- **Lazy Loading**: Load document lists on demand
- **Caching**: Cache document metadata and status information
- **Debounced Updates**: Limit status polling frequency to reduce server load

## Security Considerations

### File Upload Security
- **File Type Validation**: Strict MIME type checking and file signature validation
- **Size Limits**: Enforce maximum file size limits
- **Virus Scanning**: Integrate antivirus scanning for uploaded files
- **Sandboxing**: Process files in isolated environment

### Data Protection
- **Access Control**: Ensure users can only access their own documents
- **Audit Logging**: Log all document access and modifications
- **Data Encryption**: Encrypt sensitive document content at rest
- **Secure Deletion**: Properly delete files and database records when requested