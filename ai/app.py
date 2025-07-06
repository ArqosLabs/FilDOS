from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import torch
from PIL import Image
from sentence_transformers import SentenceTransformer, util
from transformers import CLIPProcessor, CLIPModel
import pdfplumber
from docx import Document
import pickle
import tempfile
import requests
from datetime import datetime
import io
from urllib.parse import urlparse

# Suppress tokenizers warning
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
TEMP_FOLDER = 'temp_files'
EMBEDDINGS_FOLDER = 'embeddings'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

# Create directories
os.makedirs(TEMP_FOLDER, exist_ok=True)
os.makedirs(EMBEDDINGS_FOLDER, exist_ok=True)

app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Allowed file extensions
ALLOWED_EXTENSIONS = {
    'image': {'jpg', 'jpeg', 'png', 'bmp', 'webp'},
    'text': {'pdf', 'docx', 'txt', 'md'}
}

def is_allowed_file_type(filename):
    """Check if file extension is allowed"""
    if not filename:
        return False
    
    # Remove any query parameters or fragments
    filename = filename.split('?')[0].split('#')[0]
    
    if '.' not in filename:
        return False
    
    ext = filename.rsplit('.', 1)[1].lower()
    all_extensions = set()
    for extensions in ALLOWED_EXTENSIONS.values():
        all_extensions.update(extensions)
    
    print(f"Checking file type for '{filename}', extension: '{ext}', allowed: {ext in all_extensions}")
    return ext in all_extensions

# Initialize AI models
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Model cache directory
MODEL_CACHE_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_CACHE_DIR, exist_ok=True)

# Load CLIP for images
clip_cache_dir = os.path.join(MODEL_CACHE_DIR, "clip-vit-base-patch32")
print("Loading CLIP model...")
try:
    clip_model = CLIPModel.from_pretrained(
        "openai/clip-vit-base-patch32",
        cache_dir=clip_cache_dir
    ).to(device)
    clip_processor = CLIPProcessor.from_pretrained(
        "openai/clip-vit-base-patch32",
        cache_dir=clip_cache_dir,
        use_fast=True
    )
    print("CLIP model loaded successfully")
except Exception as e:
    print(f"Error loading CLIP model: {e}")
    raise

# Load Sentence-BERT for text
sbert_cache_dir = os.path.join(MODEL_CACHE_DIR, "all-MiniLM-L6-v2")
print("Loading SentenceTransformer model...")
try:
    text_model = SentenceTransformer(
        "all-MiniLM-L6-v2",
        cache_folder=sbert_cache_dir
    ).to(device)
    print("SentenceTransformer model loaded successfully")
except Exception as e:
    print(f"Error loading SentenceTransformer model: {e}")
    raise

print("All models loaded successfully!")

# Helper functions
def download_file_from_url(url, temp_dir):
    """Download file from URL and save to temp directory"""
    try:
        print(f"Downloading file from URL: {url}")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        # Get filename from URL or use a default
        parsed_url = urlparse(url)
        filename = os.path.basename(parsed_url.path)
        
        # Try to get filename from Content-Disposition header first
        content_disposition = response.headers.get('Content-Disposition', '')
        if 'filename=' in content_disposition:
            # Handle both simple and UTF-8 encoded filenames
            if 'filename*=' in content_disposition:
                # Extract UTF-8 encoded filename
                parts = content_disposition.split("filename*=UTF-8''")
                if len(parts) > 1:
                    filename = parts[1].strip()
            else:
                filename = content_disposition.split('filename=')[1].strip('"')
        
        # If we still don't have a good filename, create one
        if not filename or not is_allowed_file_type(filename):
            # Try to detect file type from content-type
            content_type = response.headers.get('Content-Type', '')
            if 'image' in content_type:
                if 'png' in content_type:
                    ext = 'png'
                elif 'jpeg' in content_type or 'jpg' in content_type:
                    ext = 'jpg'
                else:
                    ext = 'png'  # default
            elif 'pdf' in content_type:
                ext = 'pdf'
            elif 'text' in content_type:
                ext = 'txt'
            else:
                ext = 'bin'
            
            # Use the CID from URL as filename
            url_parts = url.split('/')
            if len(url_parts) > 0:
                cid = url_parts[-1]
                filename = f"{cid}.{ext}"
            else:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"file_{timestamp}.{ext}"
        
        filepath = os.path.join(temp_dir, filename)
        print(f"Saving file as: {filename}")
        
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        print(f"Successfully downloaded: {filename}")
        return filepath, filename
    except Exception as e:
        print(f"Error downloading file from {url}: {e}")
        return None, None

def load_embeddings_from_url(url):
    """Load embeddings from URL"""
    try:
        print(f"Loading embeddings from URL: {url}")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        # Load pickle data from response content
        embeddings = pickle.loads(response.content)
        print(f"Successfully loaded {len(embeddings)} embeddings from URL")
        
        # Log the structure of the first embedding for debugging
        if embeddings:
            first_embedding = embeddings[0]
            print(f"First embedding structure: {list(first_embedding.keys())}")
            
        return embeddings
    except Exception as e:
        print(f"Error loading embeddings from {url}: {e}")
        return []

def extract_text(file_path):
    """Extract text from various file formats"""
    ext = file_path.lower().split(".")[-1]
    try:
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
    except Exception as e:
        print(f"Error extracting text from {file_path}: {e}")
        return None

def embed_file(file_path, file_url, existing_embeddings=None):
    """Create embeddings for a file and add to existing embeddings"""
    if existing_embeddings is None:
        existing_embeddings = []
    
    ext = file_path.lower().split(".")[-1]
    filename = os.path.basename(file_path)

    try:
        if ext in {"jpg", "jpeg", "png", "bmp", "webp"}:
            # Image Embedding using CLIP
            image = Image.open(file_path).convert("RGB")
            inputs = clip_processor(images=image, return_tensors="pt").to(device)
            with torch.no_grad():
                image_emb = clip_model.get_image_features(**inputs)
            image_emb = image_emb / image_emb.norm(p=2)
            existing_embeddings.append({
                "type": "image",
                "filename": filename,
                "url": file_url,
                "embedding": image_emb.cpu()
            })
            print(f"Image embedded: {filename}")
            return existing_embeddings

        elif ext in {"pdf", "docx", "txt", "md"}:
            # Text Embedding using BERT
            text = extract_text(file_path)
            if text:
                text_emb = text_model.encode(text, convert_to_tensor=True)
                existing_embeddings.append({
                    "type": "text",
                    "filename": filename,
                    "url": file_url,
                    "text": text[:1000],  # Store first 1000 chars for preview
                    "embedding": text_emb.cpu()
                })
                print(f"Text embedded: {filename}")
                return existing_embeddings
            else:
                print(f"Could not extract text: {filename}")
                return existing_embeddings
        else:
            print(f"Unsupported file type: {filename}")
            return existing_embeddings
    except Exception as e:
        print(f"Error embedding file {filename}: {e}")
        return existing_embeddings

def search_embeddings(query, embeddings, top_k=3):
    """Search through embeddings for relevant files"""
    try:
        # Ensure top_k is an integer
        if not isinstance(top_k, int):
            top_k = int(top_k)
        
        print(f"Searching with query: '{query}', top_k: {top_k} (type: {type(top_k)})")
        
        # Process query for CLIP
        clip_inputs = clip_processor(text=query, return_tensors="pt").to(device)
        with torch.no_grad():
            query_emb_img = clip_model.get_text_features(**clip_inputs)
        query_emb_img = query_emb_img / query_emb_img.norm(p=2)
        query_emb_img = query_emb_img.cpu()

        # Process query for SentenceTransformer
        query_emb_txt = text_model.encode(query, convert_to_tensor=True).cpu()

        results = []
        for item in embeddings:
            try:
                if item["type"] == "image":
                    score = util.pytorch_cos_sim(query_emb_img, item["embedding"])[0][0].item()
                elif item["type"] == "text":
                    score = util.pytorch_cos_sim(query_emb_txt, item["embedding"])[0][0].item()
                else:
                    continue
                results.append((score, item))
            except Exception as e:
                print(f"Error computing similarity for {item.get('filename', 'unknown')}: {e}")
                continue

        print(f"Found {len(results)} total results before filtering")
        top_results = sorted(results, key=lambda x: x[0], reverse=True)[:top_k]
        print(f"Returning top {len(top_results)} results")
        
        # Format results for API response - return original online URLs
        formatted_results = []
        for score, item in top_results:
            result = {
                "score": score,
                "type": item["type"],
                "filename": item.get("filename", "unknown"),
                "url": item.get("url", "unknown")  # This should be the original online URL
            }
            if item["type"] == "text" and "text" in item:
                result["excerpt"] = item["text"]
            formatted_results.append(result)
        
        return formatted_results
    except Exception as e:
        print(f"Error in search: {e}")
        return []


def create_embed_file():
    """Create a new empty embeddings file"""
    try:
        # Create empty embeddings list
        embeddings = []
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"embeddings_{timestamp}.pkl"
        
        # Create pickle file in memory
        pickle_data = pickle.dumps(embeddings)
        
        # Return the file as download
        return send_file(
            io.BytesIO(pickle_data),
            mimetype='application/octet-stream',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({'error': f'Error creating embeddings file: {str(e)}'}), 500

@app.route('/embed', methods=['POST'])
def embed_endpoint():
    """Embed multiple files from URLs and return embeddings file"""
    try:
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
            # Handle multiple URLs in form data
            if 'file_urls' in request.form:
                data['file_urls'] = request.form.getlist('file_urls')

        print(f"Received data: {data}")
        
        if not data:
            return jsonify({'error': 'JSON data or form data required'}), 400
        
        file_urls = data.get('file_urls', [])
        
        # Handle single file_url for backward compatibility
        if not file_urls and data.get('file_url'):
            file_urls = [data.get('file_url')]
        
        if not file_urls:
            return jsonify({'error': 'file_urls array is required'}), 400
        
        # Create temp directory for this request
        with tempfile.TemporaryDirectory() as temp_dir:
            # Start with empty embeddings
            embeddings = []
            processed_files = []
            failed_files = []
            
            # Process each file URL
            for i, file_url in enumerate(file_urls):
                print(f"Processing file {i+1}/{len(file_urls)}: {file_url}")
                try:
                    # Download the file to embed
                    file_path, filename = download_file_from_url(file_url, temp_dir)
                    if not file_path:
                        print(f"Failed to download file {i+1}: {file_url}")
                        failed_files.append({
                            'url': file_url,
                            'error': 'Failed to download file from URL'
                        })
                        continue
                    
                    # Check if file type is allowed
                    if not is_allowed_file_type(filename):
                        print(f"File type not supported for {filename}")
                        failed_files.append({
                            'url': file_url,
                            'error': 'File type not supported'
                        })
                        continue
                    
                    # Embed the file
                    print(f"Embedding file: {filename}")
                    embeddings = embed_file(file_path, file_url, embeddings)
                    processed_files.append({
                        'url': file_url,
                        'filename': filename,
                        'status': 'success'
                    })
                    print(f"Successfully processed {filename}")
                    
                except Exception as e:
                    print(f"Error processing file {i+1}: {e}")
                    failed_files.append({
                        'url': file_url,
                        'error': str(e)
                    })
            
            print(f"Processing complete: {len(processed_files)} successful, {len(failed_files)} failed, {len(embeddings)} total embeddings")
            
            # Create pickle file
            pickle_data = pickle.dumps(embeddings)
            
            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"embeddings_{timestamp}.pkl"
            
            # Create response with metadata
            response = send_file(
                io.BytesIO(pickle_data),
                mimetype='application/octet-stream',
                as_attachment=True,
                download_name=filename
            )
            
            # Add metadata to response headers
            response.headers['X-Processed-Files'] = str(len(processed_files))
            response.headers['X-Failed-Files'] = str(len(failed_files))
            response.headers['X-Total-Embeddings'] = str(len(embeddings))
            
            return response
            
    except Exception as e:
        return jsonify({'error': f'Error embedding files: {str(e)}'}), 500

@app.route('/search', methods=['POST'])
def search_endpoint():
    """Search through embeddings and return file URLs"""
    try:
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        if not data:
            return jsonify({'error': 'JSON data or form data required'}), 400
        
        query = data.get('query')
        embed_file_url = data.get('embed_file_url')
        top_k = 5

        if not query:
            return jsonify({'error': 'query is required'}), 400
        
        if not embed_file_url:
            return jsonify({'error': 'embed_file_url is required'}), 400
        
        # Load embeddings from URL
        embeddings = load_embeddings_from_url(embed_file_url)
        
        if len(embeddings) == 0:
            return jsonify({
                'query': query,
                'results': [],
                'message': 'No embeddings found'
            })
        
        # Search embeddings
        results = search_embeddings(query, embeddings, top_k)

        print(f"Search completed. Found {len(results)} results for query: '{query}'")
        
        return jsonify({
            'query': query,
            'results': results,
            'total_embeddings': len(embeddings)
        })
        
    except Exception as e:
        return jsonify({'error': f'Error searching: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'models_loaded': True
    })

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({'error': 'File too large. Maximum size is 16MB'}), 413

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