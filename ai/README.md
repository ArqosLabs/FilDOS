# FilDOS AI API - Document Embedding Service with Weaviate

A Flask-based API service for creating and searching document embeddings using state-of-the-art AI models. This service uses Weaviate vector database for efficient storage and retrieval of embeddings.

## 🚀 Features

- **Vector Database**: Weaviate for persistent, scalable embedding storage
- **Multi-format Support**: Images (JPEG, PNG, BMP, WebP), Text (PDF, DOCX, TXT, MD)
- **Advanced AI Models**: 
  - **SigLIP** (google/siglip-base-patch16-224): Superior image understanding
  - **Multilingual E5** (intfloat/multilingual-e5-base): Advanced multilingual text embeddings
  - **CLIP** (openai/clip-vit-base-patch32): Multi-modal embeddings
  - **MiniLM** (all-MiniLM-L6-v2): Fast text embeddings
- **OCR Support**: Extract and embed text from images using EasyOCR
- **Semantic Search**: Fast vector similarity search across all content types
- **URL-based Processing**: Process files directly from URLs (IPFS, HTTP, etc.)
- **Batch Processing**: Handle multiple files in a single request
- **Collection Management**: Organize embeddings in named collections
- **CORS Enabled**: Ready for cross-origin requests from web applications

## 🏗️ Architecture

### AI Models

#### Image Models
- **SigLIP (google/siglip-base-patch16-224)**: State-of-the-art image understanding model
  - Better than CLIP for most vision tasks
  - 768-dimensional embeddings
  - Superior zero-shot classification
- **CLIP (openai/clip-vit-base-patch32)**: Multi-modal embeddings fallback
  - 512-dimensional embeddings

#### Text Models
- **Multilingual E5 (intfloat/multilingual-e5-base)**: Advanced multilingual text embeddings
  - 768-dimensional embeddings
  - Supports 100+ languages
  - State-of-the-art performance on multilingual retrieval
  - Requires "query:" prefix for queries and "passage:" for documents
- **SentenceTransformers (all-MiniLM-L6-v2)**: Fast and efficient text embeddings
  - 384-dimensional embeddings
  - Used for OCR text from images

#### OCR Engine
- **EasyOCR**: Extract text from images
  - Supports 80+ languages
  - GPU acceleration support
  - Used to extract text from images, which is then embedded using MiniLM

### Device Support
- Automatic GPU detection with CPU fallback
- CUDA support for PyTorch models
- GPU-accelerated OCR when available

### Vector Database

- **Weaviate**: High-performance vector database for storing and querying embeddings
- **Collections**: Organize embeddings by user, project, or dataset
- **Hybrid Search**: Combines image and text embeddings for comprehensive results

### API Endpoints

- `POST /embed`: Create embeddings for files and store in Weaviate
- `POST /search`: Search through Weaviate collections
- `GET /collections`: List all collections
- `GET /collections/<name>`: Get collection details
- `DELETE /collections/<name>`: Delete a collection
- `GET /health`: Health check and model status

## 🛠️ Installation

### Prerequisites

- Python 3.8+
- pip or conda
- Docker (for running Weaviate)
- (Optional) CUDA-compatible GPU for acceleration

### Setup

1. **Start Weaviate** (using Docker):
   ```bash
   docker run -d \
     -p 8080:8080 \
     --name weaviate \
     semitechnologies/weaviate:latest
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment** (copy and edit):
   ```bash
   cp env.example .env
   ```

4. **Download models** (automatic on first run):
   ```bash
   python download_models.py
   ```

5. **Start the service**:
   ```bash
   python start.py
   ```

The service will be available at `http://localhost:5001`


## 🔧 API Reference

### POST /embed

Create embeddings for files from URLs and store in Weaviate.

**Collection Name Rules:**
- Collection names are automatically sanitized to meet Weaviate requirements
- Names starting with numbers will be prefixed with "Collection" (e.g., "1" becomes "Collection1")
- Special characters are removed
- Names must start with an uppercase letter

**Request Body**:
```json
{
  "file_urls": [
    "https://example.com/image.jpg",
    "https://ipfs.io/ipfs/QmHash/document.pdf"
  ],
  "collection_name": "MyFiles"
}
```

**Response**:
```json
{
  "collection_name": "MyFiles",
  "original_collection_name": "MyFiles",
  "processed_files": [
    {
      "url": "https://example.com/image.jpg",
      "filename": "image.jpg",
      "status": "success"
    }
  ],
  "skipped_files": [
    {
      "url": "https://example.com/duplicate.jpg",
      "filename": "duplicate.jpg",
      "reason": "File already exists in collection"
    }
  ],
  "failed_files": [],
  "total_processed": 1,
  "total_skipped": 1,
  "total_failed": 0
}
```

**Notes:**
- URLs without a scheme (http:// or https://) will automatically have https:// prepended
- The response includes both the sanitized `collection_name` used in Weaviate and the `original_collection_name` you provided
- **Duplicate Detection**: Files with the same URL are automatically skipped if they already exist in the collection
- Skipped files appear in the `skipped_files` array with the reason

**Example**:
```bash
curl -X POST http://localhost:5001/embed \
  -H "Content-Type: application/json" \
  -d '{
    "file_urls": ["https://example.com/image.jpg"],
    "collection_name": "MyFiles"
  }'
```

### POST /search

Search through Weaviate collections using natural language queries.

**Request Body**:
```json
{
  "query": "meeting notes from last week",
  "collection_name": "MyFiles",
  "top_k": 5
}
```

**Response**:
```json
{
  "query": "meeting notes from last week",
  "collection_name": "MyFiles",
  "original_collection_name": "MyFiles",
  "results": [
    {
      "score": 0.89,
      "type": "text",
      "filename": "notes.pdf",
      "url": "https://example.com/notes.pdf",
      "excerpt": "Meeting notes from..."
    }
  ],
  "total_results": 1
}
```

**Notes:**
- Collection names are automatically sanitized (same as `/embed` endpoint)
- `top_k` defaults to 5 if not specified

**Example**:
```bash
curl -X POST http://localhost:5001/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "cat pictures",
    "collection_name": "MyFiles",
    "top_k": 5
  }'
```

### GET /collections

List all available collections in Weaviate.

**Response**:
```json
{
  "collections": ["MyFiles", "UserData", "Archive"],
  "total": 3
}
```

**Example**:
```bash
curl -X GET http://localhost:5001/collections
```

### GET /collections/<collection_name>

Get details about a specific collection.

**Response**:
```json
{
  "name": "MyFiles",
  "original_name": "my-files",
  "count": 42,
  "exists": true
}
```

**Example**:
```bash
curl -X GET http://localhost:5001/collections/MyFiles
```

### DELETE /collections/<collection_name>

Delete a collection and all its embeddings.

**Response**:
```json
{
  "message": "Collection MyFiles deleted successfully"
}
```

**Example**:
```bash
curl -X DELETE http://localhost:5001/collections/MyFiles
```

### GET /health

Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-05T12:00:00",
  "models_loaded": true,
  "weaviate_connected": true
}
```

## 📁 File Format Support

### Images
- **JPEG/JPG**: Full support with SigLIP embeddings + OCR text extraction
- **PNG**: Full support including transparency + OCR text extraction
- **BMP**: Basic bitmap support + OCR text extraction
- **WebP**: Modern web format support + OCR text extraction

### Text Documents
- **PDF**: Full text extraction with pdfplumber + Multilingual E5 embeddings
- **DOCX**: Microsoft Word document support + Multilingual E5 embeddings
- **TXT**: Plain text files + Multilingual E5 embeddings
- **MD**: Markdown files + Multilingual E5 embeddings

## 🤖 How It Works

### Image Processing Pipeline
1. **Image Embedding**: Images are processed using SigLIP to create 768-dimensional visual embeddings
2. **OCR Text Extraction**: EasyOCR extracts any text visible in the image (supports 80+ languages)
3. **Text Embedding**: If meaningful text is found (>10 characters), a separate text embedding is created using MiniLM
4. **Dual Indexing**: Both visual and textual embeddings are stored, enabling:
   - Visual search: "Find images of cats"
   - Text search: "Find images containing the word 'invoice'"
   - Hybrid search: Search works on both visual content and visible text

### Text Processing Pipeline
1. **Text Extraction**: Content is extracted from PDFs, DOCX, TXT, or MD files
2. **Multilingual Embedding**: Text is embedded using Multilingual E5 with "passage:" prefix
3. **Storage**: Embeddings stored with text preview for quick reference

### Search Pipeline
1. **Query Processing**: 
   - Visual queries use SigLIP text encoder to create image-compatible embeddings
   - Text queries use Multilingual E5 with "query:" prefix
2. **Vector Search**: Weaviate performs fast approximate nearest neighbor search
3. **Result Merging**: Results from both image and text vectors are combined and ranked
4. **Score Calculation**: Distance scores converted to similarity scores (0-1 range)
