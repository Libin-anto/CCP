from app.db.session import engine, Base
from app.models.all_models import User, Document, DocumentContent, AuditLog

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

if __name__ == "__main__":
    init_db()
