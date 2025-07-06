# FILDOS AI API - Stateless Document Embedding Service

A Flask-based API service for creating and searching document embeddings using CLIP (for images) and SentenceTransformers (for text). This service is designed to be stateless, making it perfect for multi-user applications where each user manages their own embeddings.

## Features

- **Stateless Design**: No server-side database, all embeddings are passed in requests
- **Multi-format Support**: Images (JPEG, PNG, BMP, WebP), Text (PDF, DOCX, TXT, MD)
- **Dual Embedding Models**: CLIP for images, SentenceTransformers for text
- **Pickle-based Storage**: Embeddings serialized as base64-encoded pickle data


### Startup

```bash
# Use the startup script (checks for models automatically)
python start.py
```

## Notes

- The API uses CPU by default. GPU acceleration is available if CUDA is installed.
- Embeddings are stored in memory and will be lost when the API is restarted.
