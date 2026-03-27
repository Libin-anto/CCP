from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.db.session import get_db
from app.api.deps import get_current_admin, get_current_active_user
from app.models.all_models import User
from app.core.security import get_password_hash
import uuid

router = APIRouter()

class UserCreate(BaseModel):
    email: str
    password: str
    role: str  # admin, manager, employee
    department: Optional[str] = None

class UserUpdate(BaseModel):
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

def user_to_dict(u: User):
    return {
        "id": u.id,
        "email": u.email,
        "role": u.role,
        "department": u.department,
        "is_active": u.is_active,
        "is_first_login": u.is_first_login,
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_active_user)):
    return user_to_dict(current_user)

@router.get("/")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    users = db.query(User).all()
    return [user_to_dict(u) for u in users]

@router.post("/", status_code=201)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        id=str(uuid.uuid4()),
        email=data.email,
        hashed_password=get_password_hash(data.password),
        role=data.role,
        department=data.department,
        is_active=True,
        is_first_login=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_to_dict(user)

@router.put("/{user_id}")
def update_user(
    user_id: str,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.role is not None:
        user.role = data.role
    if data.department is not None:
        user.department = data.department
    if data.is_active is not None:
        user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user_to_dict(user)

@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.delete(user)
    db.commit()
    return {"status": "success", "message": "User deleted"}
