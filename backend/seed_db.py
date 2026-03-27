
from app.db.session import SessionLocal, engine
from app.models.all_models import User
from app.core.security import get_password_hash
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_db():
    db = SessionLocal()
    try:
        # 1. Migration: Add is_first_login column if not exists
        # This is a simple migration for SQLite/Postgres compatibility
        try:
            logger.info("Checking for is_first_login column...")
            db.execute(text("SELECT is_first_login FROM users LIMIT 1"))
            logger.info("Column is_first_login exists.")
        except Exception:
            logger.info("Column is_first_login not found. Adding it...")
            # Note: SQLite doesn't support IF EXISTS in ADD COLUMN usually, but we are in the except block
            # For SQLite
            try:
                db.execute(text("ALTER TABLE users ADD COLUMN is_first_login BOOLEAN DEFAULT 1"))
                db.commit()
                logger.info("Added is_first_login column.")
            except Exception as e:
                logger.error(f"Failed to add column: {e}")
                db.rollback()

        # 2. Seed Admin User
        admin_email = "admin@kmrl.co.in"
        admin_password = "admin"  # Initial password
        
        user = db.query(User).filter(User.email == admin_email).first()
        if not user:
            logger.info(f"Creating admin user: {admin_email}")
            user = User(
                email=admin_email,
                hashed_password=get_password_hash(admin_password),
                role="admin",
                is_active=True,
                is_first_login=True
            )
            db.add(user)
            db.commit()
            logger.info("Admin user created.")
        else:
            logger.info(f"Admin user {admin_email} already exists.")
            # Optional: Reset admin for testing if needed, but safer to leave as is
            
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
