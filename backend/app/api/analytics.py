from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.all_models import Document, User
from app.api.deps import get_current_active_user
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Role-based document query base
    doc_query = db.query(Document)
    if current_user.role == "manager":
        doc_query = doc_query.filter(Document.department == current_user.department)
    elif current_user.role == "employee":
        from sqlalchemy import or_
        doc_query = doc_query.filter(
            or_(
                Document.uploaded_by == current_user.id,
                (Document.department == current_user.department) & (Document.approval_status == "approved")
            )
        )

    total_docs = doc_query.count()
    total_size_bytes = db.query(func.sum(Document.file_size)).scalar() or 0

    def format_size(size):
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"

    storage_usage = format_size(total_size_bytes)

    from app.models.all_models import AuditLog
    total_searches = db.query(AuditLog).filter(AuditLog.action == "search").count()

    failed_docs = doc_query.filter(Document.processing_status == 'failed').count()
    processing_docs = doc_query.filter(Document.processing_status == 'processing').count()

    if failed_docs > 0:
        health_status = "Attention Needed"
        health_color = "text-red-600"
    elif processing_docs > 5:
        health_status = "High Load"
        health_color = "text-yellow-600"
    else:
        health_status = "Operational"
        health_color = "text-green-600"

    seven_days_ago = datetime.utcnow() - timedelta(days=6)
    daily_stats = db.query(
        func.date(Document.upload_date).label('date'),
        func.count(Document.id)
    ).filter(Document.upload_date >= seven_days_ago)\
     .group_by(func.date(Document.upload_date))\
     .all()

    trend_data = []
    stats_dict = {str(day[0]): day[1] for day in daily_stats}
    for i in range(7):
        date = (seven_days_ago + timedelta(days=i)).date()
        trend_data.append({"date": date.strftime("%a"), "count": stats_dict.get(str(date), 0)})

    mime_counts = db.query(Document.mime_type, func.count(Document.id)).group_by(Document.mime_type).all()
    file_type_data = [{"type": m[0] or "Unknown", "count": m[1]} for m in mime_counts]

    recent_docs = doc_query.order_by(Document.upload_date.desc()).limit(5).all()
    recent_list = [{
        "id": doc.id,
        "filename": doc.original_filename,
        "upload_date": doc.upload_date,
        "size": format_size(doc.file_size or 0),
        "status": doc.processing_status,
        "approval_status": doc.approval_status,
    } for doc in recent_docs]

    pending_approvals = doc_query.filter(Document.approval_status == "pending").count()

    result = {
        "total_documents": total_docs,
        "storage_usage": storage_usage,
        "total_searches": total_searches,
        "pending_approvals": pending_approvals,
        "system_health": {"status": health_status, "color": health_color},
        "activity_trend": trend_data,
        "file_types": file_type_data,
        "recent_uploads": recent_list,
    }

    if current_user.role == "admin":
        result["total_users"] = db.query(User).count()
        dept_counts = db.query(Document.department, func.count(Document.id)).group_by(Document.department).all()
        result["department_overview"] = [{"department": d[0] or "Unassigned", "count": d[1]} for d in dept_counts]

    return result
