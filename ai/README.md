# FILDOS AI API

This Flask API provides intelligent file search capabilities using AI embeddings for both text and image files.

## Features

- **Text Search**: Search through PDF, DOCX, TXT, and MD files using semantic similarity
- **Image Search**: Search through images (JPG, PNG, BMP, WEBP) using CLIP embeddings
- **Multi-modal**: Supports both text and image content with unified search interface

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the Flask app:
```bash
python app.py
```

The API will be available at `http://localhost:5001`

## API Endpoints

### Health Check
```
GET /api/health
```
Returns API status and embedding count.

### Embed File
```
POST /api/embed
Content-Type: application/json

{
  "file_path": "/path/to/your/file"
}
```
Embeds a file for future searching. Supports:
- Images: JPG, JPEG, PNG, BMP, WEBP
- Documents: PDF, DOCX, TXT, MD

### Search
```
POST /api/search
Content-Type: application/json

{
  "query": "your search query",
  "top_k": 3
}
```
Searches through embedded files and returns the most relevant results.

### Get Embeddings
```
GET /api/embeddings
```
Returns information about all embedded files.

### Clear Embeddings
```
DELETE /api/embeddings
```
Clears all embedded files from memory.

## Example Usage

```python
import requests

# Embed a file
response = requests.post("http://localhost:5001/api/embed", 
                        json={"file_path": "/path/to/document.pdf"})

# Search
response = requests.post("http://localhost:5001/api/search", 
                        json={"query": "machine learning", "top_k": 5})
```

## Testing

Run the test script to verify the API is working:

```bash
python test_api.py
```

## Notes

- The API uses CPU by default. GPU acceleration is available if CUDA is installed.
- Embeddings are stored in memory and will be lost when the API is restarted.
- Large files may take time to embed initially.
