
import requests
import time

base_url = "http://127.0.0.1:8000/api/v1"

def upload_file(filename, content):
    url = f"{base_url}/documents/upload"
    files = {'file': (filename, content.encode('utf-8'), 'text/plain')}
    try:
        response = requests.post(url, files=files)
        if response.status_code == 200:
            print(f"Upload '{filename}' Success")
            return True
        else:
            print(f"Upload '{filename}' Failed: {response.text}")
            return False
    except Exception as e:
        print(f"Upload Error: {e}")
        return False

def search(query, expected_doc_title):
    url = f"{base_url}/search/query"
    params = {"q": query}
    try:
        response = requests.get(url, params=params)
        results = response.json()
        print(f"Search for '{query}': Found {len(results)} results")
        
        found = False
        for res in results:
            print(f" - Found: {res['title']} (Score: {res['score']}, Type: {res.get('match_type')})")
            if res['title'] == expected_doc_title:
                found = True
        
        if found:
            print(f"SUCCESS: Found '{expected_doc_title}'")
            return True
        else:
            print(f"FAILURE: Did not find '{expected_doc_title}'")
            return False
            
    except Exception as e:
        print(f"Search Error: {e}")
        return False

if __name__ == "__main__":
    success_count = 0
    total_tests = 2

    # 1. Test Filename Match
    print("\n--- TEST 1: Filename Match ---")
    if upload_file("unique_filename_123.txt", "Generic content about nothing special."):
        time.sleep(1)
        if search("unique_filename", "unique_filename_123.txt"):
            success_count += 1

    # 2. Test Content Match
    print("\n--- TEST 2: Content Match ---")
    if upload_file("generic_doc.txt", "This content contains the keyword Supercalifragilisticexpialidocious."):
        time.sleep(1)
        if search("Supercalifragilisticexpialidocious", "generic_doc.txt"):
            success_count += 1
            
    print("\n==============================")
    if success_count == total_tests:
        print("ALL TESTS PASSED")
    else:
        print(f"TESTS FAILED: {success_count}/{total_tests} passed")
    print("==============================")
