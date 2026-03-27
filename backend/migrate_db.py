import sqlite3

def migrate():
    conn = sqlite3.connect('kmrl_docs.db')
    cursor = conn.cursor()
    
    try:
        # Check if columns exist
        cursor.execute("PRAGMA table_info(documents)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'approval_status' not in columns:
            cursor.execute("ALTER TABLE documents ADD COLUMN approval_status VARCHAR DEFAULT 'pending'")
            print("Added approval_status column")
            
        if 'approved_by' not in columns:
            cursor.execute("ALTER TABLE documents ADD COLUMN approved_by VARCHAR")
            print("Added approved_by column")
            
        if 'rejection_reason' not in columns:
            cursor.execute("ALTER TABLE documents ADD COLUMN rejection_reason TEXT")
            print("Added rejection_reason column")
            
        conn.commit()
        print("Migration successful")
    except Exception as e:
        print(f"Error migrating: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
