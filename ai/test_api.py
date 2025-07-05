import requests
import json

BASE_URL = "http://localhost:5001"

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{BASE_URL}/api/health")
    print("Health Check:")
    print(json.dumps(response.json(), indent=2))
    print()

def test_embed_file(file_path):
    """Test embedding a file"""
    data = {"file_path": file_path}
    response = requests.post(f"{BASE_URL}/api/embed", json=data)
    print(f"Embed File ({file_path}):")
    print(json.dumps(response.json(), indent=2))
    print()

def test_search(query, top_k=3):
    """Test searching"""
    data = {"query": query, "top_k": top_k}
    response = requests.post(f"{BASE_URL}/api/search", json=data)
    print(f"Search ({query}):")
    print(json.dumps(response.json(), indent=2))
    print()

def test_get_embeddings():
    """Test getting embeddings info"""
    response = requests.get(f"{BASE_URL}/api/embeddings")
    print("Get Embeddings:")
    print(json.dumps(response.json(), indent=2))
    print()

if __name__ == "__main__":
    try:
        print("Testing FILDOS AI API...")
        print("=" * 50)
        
        # Test health
        test_health()
        
        # Test embedding (you'll need to provide actual file paths)
        # test_embed_file("path/to/your/file.txt")
        # test_embed_file("path/to/your/image.jpg")
        
        # Test search
        # test_search("your search query")
        
        # Test get embeddings
        test_get_embeddings()
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to API. Make sure the Flask app is running on port 5001.")
    except Exception as e:
        print(f"Error: {e}")
