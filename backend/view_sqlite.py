
import sqlite3
import os

db_path = "kmrl_docs.db"

if not os.path.exists(db_path):
    print(f"Error: Database file '{db_path}' not found.")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("\n--- Tables ---")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(tables)
        
        print("\n--- Documents Table Schema ---")
        cursor.execute("PRAGMA table_info(documents);")
        schema = cursor.fetchall()
        for col in schema:
            print(col)
        
        print("\n--- Documents ---")
        cursor.execute("SELECT id, original_filename, file_path FROM documents")
        rows = cursor.fetchall()
        if not rows:
            print("No documents found.")
        else:
            for row in rows:
                print(row)

        conn.close()
    except Exception as e:
        print(f"SQLite Error: {e}")
