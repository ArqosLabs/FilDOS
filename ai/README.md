# FILDOS AI API - Stateless Document Embedding Service

A Flask-based API service for creating and searching document embeddings using CLIP (for images) and SentenceTransformers (for text). This service is designed to be stateless, making it perfect for multi-user applications where each user manages their own embeddings.

## 🚀 Features

- **Stateless Design**: No server-side database, all embeddings are passed in requests
- **Multi-format Support**: Images (JPEG, PNG, BMP, WebP), Text (PDF, DOCX, TXT, MD)
- **Dual Embedding Models**: CLIP for images, SentenceTransformers for text
- **Pickle-based Storage**: Embeddings serialized as base64-encoded pickle data
- **Semantic Search**: Vector similarity search across all content types
- **URL-based Processing**: Process files directly from URLs (IPFS, HTTP, etc.)
- **Batch Processing**: Handle multiple files in a single request
- **CORS Enabled**: Ready for cross-origin requests from web applications

## 🏗️ Architecture

### AI Models

- **CLIP (openai/clip-vit-base-patch32)**: Multi-modal embeddings for images
- **SentenceTransformers (all-MiniLM-L6-v2)**: High-quality text embeddings
- **Device Support**: Automatic GPU detection with CPU fallback

### API Endpoints

- `POST /embed`: Create embeddings for files from URLs
- `POST /search`: Search through existing embeddings
- `GET /health`: Health check and model status
- `GET /create-embed`: Create empty embeddings file

## 🛠️ Installation

### Prerequisites

- Python 3.8+
- pip or conda
- (Optional) CUDA-compatible GPU for acceleration

### Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Download models** (automatic on first run):
   ```bash
   python download_models.py
   ```

3. **Start the service**:
   ```bash
   python start.py
   ```

The service will be available at `http://localhost:5001`


## 🔧 API Reference

### POST /embed

Create embeddings for files from URLs and return a downloadable embeddings file.

**Request Body**:
```json
{
  "file_urls": [
    "https://example.com/image.jpg",
    "https://ipfs.io/ipfs/QmHash/document.pdf"
  ]
}
```

**Response**: Binary pickle file download containing embeddings

**Example**:
```bash
curl -X POST http://localhost:5001/embed \
  -H "Content-Type: application/json" \
  -d '{"file_urls": ["https://example.com/image.jpg"]}' \
  --output embeddings.pkl
```

### POST /search

Search through embeddings using natural language queries.

**Request Body**:
```json
{
  "query": "meeting notes from last week",
  "embed_file_url": "https://example.com/embeddings.pkl"
}
```

**Response**:
```json
{
  "query": "meeting notes from last week",
  "results": [
    {
      "score": 0.89,
      "type": "text",
      "filename": "meeting_notes.pdf",
      "url": "https://example.com/meeting_notes.pdf",
      "excerpt": "Meeting notes from January 15th..."
    }
  ],
  "total_embeddings": 42
}
```

### GET /health

Check service health and model status.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-07T12:00:00Z",
  "models_loaded": true
}
```

## 📁 File Format Support

### Images
- **JPEG/JPG**: Full support
- **PNG**: Full support including transparency
- **BMP**: Basic bitmap support
- **WebP**: Modern web format support

### Text Documents
- **PDF**: Full text extraction with pdfplumber
- **DOCX**: Microsoft Word document support
- **TXT**: Plain text files
- **MD**: Markdown files
