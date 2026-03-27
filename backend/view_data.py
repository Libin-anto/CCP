
from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        print("\n--- Documents Table ---")
        result = conn.execute(text("SELECT id, original_filename, file_path, upload_date FROM documents"))
        rows = result.fetchall()
        if not rows:
            print("No documents found.")
        else:
            for row in rows:
                print(row)
                
        print("\n--- Document Content Table (Snippet) ---")
        result = conn.execute(text("SELECT document_id, substr(extracted_text, 1, 50) as snippet FROM document_content"))
        rows = result.fetchall()
        if not rows:
            print("No content found.")
        else:
            for row in rows:
                print(row)

    except Exception as e:
        print(f"Error querying database: {e}")
