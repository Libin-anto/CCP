"""
Seed demo users for KMRL RBAC system.
Run from: c:/Users/Libin/PROJECT/CCP/backend
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.all_models import User, Document
from app.core.security import get_password_hash
import uuid

db = SessionLocal()

DEMO_USERS = [
    {"email": "admin@kmrl.co.in",    "password": "Admin@123",    "role": "admin",    "department": None},
    {"email": "manager@kmrl.co.in",  "password": "Manager@123",  "role": "manager",  "department": "IT"},
    {"email": "employee@kmrl.co.in", "password": "Employee@123", "role": "employee", "department": "IT"},
]

for u in DEMO_USERS:
    existing = db.query(User).filter(User.email == u["email"]).first()
    if existing:
        # Update password and role in case they changed
        existing.hashed_password = get_password_hash(u["password"])
        existing.role = u["role"]
        existing.department = u["department"]
        existing.is_active = True
        print(f"Updated: {u['email']}")
    else:
        user = User(
            id=str(uuid.uuid4()),
            email=u["email"],
            hashed_password=get_password_hash(u["password"]),
            role=u["role"],
            department=u["department"],
            is_active=True,
            is_first_login=False,
        )
        db.add(user)
        print(f"Created: {u['email']}")

# Set existing documents to 'approved' so they remain visible
updated = db.query(Document).filter(Document.approval_status == None).update({"approval_status": "approved"})
print(f"Set {updated} existing documents to 'approved'")

db.commit()
db.close()
print("\n✅ Demo users seeded successfully!")
print("  Admin:    admin@kmrl.co.in    / Admin@123")
print("  Manager:  manager@kmrl.co.in  / Manager@123")
print("  Employee: employee@kmrl.co.in / Employee@123")
