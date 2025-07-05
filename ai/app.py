from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import torch
from PIL import Image
from sentence_transformers import SentenceTransformer, util
from transformers import CLIPProcessor, CLIPModel
import pdfplumber
from docx import Document
import base64
import io
import json

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')

# Initialize AI models
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Load CLIP for images
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Load Sentence-BERT for text
text_model = SentenceTransformer("all-MiniLM-L6-v2").to(device)

# Store all embeddings and metadata
embedding_db = []

# Helper functions
def extract_text(file_path):
    """Extract text from various file formats"""
    ext = file_path.lower().split(".")[-1]
    if ext == "pdf":
        with pdfplumber.open(file_path) as pdf:
            return "\n".join(page.extract_text() or '' for page in pdf.pages)
    elif ext == "docx":
        doc = Document(file_path)
        return "\n".join(p.text for p in doc.paragraphs)
    elif ext in {"txt", "md"}:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    else:
        return None

def embed_file(file_path):
    """Create embeddings for a file"""
    ext = file_path.lower().split(".")[-1]

    if ext in {"jpg", "jpeg", "png", "bmp", "webp"}:
        # Image Embedding using CLIP
        image = Image.open(file_path).convert("RGB")
        inputs = clip_processor(images=image, return_tensors="pt").to(device)
        with torch.no_grad():
            image_emb = clip_model.get_image_features(**inputs)
        image_emb = image_emb / image_emb.norm(p=2)
        embedding_db.append({
            "type": "image",
            "path": file_path,
            "embedding": image_emb.cpu()
        })
        print(f"Image embedded: {file_path}")
        return True

    elif ext in {"pdf", "docx", "txt", "md"}:
        # Text Embedding using BERT
        text = extract_text(file_path)
        if text:
            text_emb = text_model.encode(text, convert_to_tensor=True)
            embedding_db.append({
                "type": "text",
                "path": file_path,
                "text": text,
                "embedding": text_emb.cpu()
            })
            print(f"Text embedded: {file_path}")
            return True
        else:
            print(f"Could not extract text: {file_path}")
            return False
    else:
        print(f"Unsupported file type: {file_path}")
        return False

def search_embeddings(query, top_k=3):
    """Search through embeddings for relevant files"""
    # Process query for CLIP
    clip_inputs = clip_processor(text=query, return_tensors="pt").to(device)
    with torch.no_grad():
        query_emb_img = clip_model.get_text_features(**clip_inputs)
    query_emb_img = query_emb_img / query_emb_img.norm(p=2)
    query_emb_img = query_emb_img.cpu()

    # Process query for SentenceTransformer
    query_emb_txt = text_model.encode(query, convert_to_tensor=True).cpu()

    results = []
    for item in embedding_db:
        if item["type"] == "image":
            score = util.pytorch_cos_sim(query_emb_img, item["embedding"])[0][0].item()
        elif item["type"] == "text":
            score = util.pytorch_cos_sim(query_emb_txt, item["embedding"])[0][0].item()
        else:
            continue
        results.append((score, item))

    top_results = sorted(results, key=lambda x: x[0], reverse=True)[:top_k]
    
    # Format results for API response
    formatted_results = []
    for score, item in top_results:
        result = {
            "score": score,
            "type": item["type"],
            "path": item["path"],
            "filename": os.path.basename(item["path"])
        }
        if item["type"] == "text" and "text" in item:
            result["excerpt"] = item["text"][:500] + "..." if len(item["text"]) > 500 else item["text"]
        formatted_results.append(result)
    
    return formatted_results

# Routes
@app.route('/')
def hello():
    """Basic health check endpoint"""
    return jsonify({
        'message': 'FILDOS AI API is running!',
        'status': 'healthy'
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'FILDOS AI API is operational',
        'device': device,
        'embedding_count': len(embedding_db)
    })

@app.route('/api/embed', methods=['POST'])
def embed_file_endpoint():
    """Embed a file endpoint"""
    try:
        data = request.get_json()
        if not data or 'file_path' not in data:
            return jsonify({'error': 'file_path is required'}), 400
        
        file_path = data['file_path']
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        success = embed_file(file_path)
        
        if success:
            return jsonify({
                'message': 'File embedded successfully',
                'file_path': file_path,
                'total_embeddings': len(embedding_db)
            })
        else:
            return jsonify({'error': 'Failed to embed file'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Error embedding file: {str(e)}'}), 500

@app.route('/api/search', methods=['POST'])
def search_endpoint():
    """Search through embedded files"""
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'query is required'}), 400
        
        query = data['query']
        top_k = data.get('top_k', 3)
        
        if len(embedding_db) == 0:
            return jsonify({
                'message': 'No files have been embedded yet',
                'results': []
            })
        
        results = search_embeddings(query, top_k)
        
        return jsonify({
            'query': query,
            'results': results,
            'total_embeddings': len(embedding_db)
        })
        
    except Exception as e:
        return jsonify({'error': f'Error searching: {str(e)}'}), 500

@app.route('/api/embeddings', methods=['GET'])
def get_embeddings():
    """Get information about all embeddings"""
    embeddings_info = []
    for item in embedding_db:
        info = {
            'type': item['type'],
            'path': item['path'],
            'filename': os.path.basename(item['path'])
        }
        if item['type'] == 'text' and 'text' in item:
            info['text_length'] = len(item['text'])
        embeddings_info.append(info)
    
    return jsonify({
        'total_embeddings': len(embedding_db),
        'embeddings': embeddings_info
    })

@app.route('/api/embeddings', methods=['DELETE'])
def clear_embeddings():
    """Clear all embeddings"""
    global embedding_db
    embedding_db = []
    return jsonify({
        'message': 'All embeddings cleared',
        'total_embeddings': len(embedding_db)
    })

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Run the app
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )