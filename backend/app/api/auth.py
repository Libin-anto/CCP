
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app.db.session import get_db
from app.core import security
from app.core.config import settings
from app.models.all_models import User
from app.schemas.auth import Token, UserLogin, PasswordChange
from app.api import deps

router = APIRouter()

@router.get("/me")
def get_me(current_user: User = Depends(deps.get_current_active_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "department": current_user.department,
        "is_first_login": current_user.is_first_login,
    }

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_first_login": user.is_first_login,
        "role": user.role
    }

@router.post("/change-password")
def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Change password for the current user. sets is_first_login to False.
    """
    if not security.verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    current_user.hashed_password = security.get_password_hash(password_data.new_password)
    current_user.is_first_login = False
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Password updated successfully"}
