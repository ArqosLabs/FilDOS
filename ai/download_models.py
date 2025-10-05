import os
import torch
from sentence_transformers import SentenceTransformer
from transformers import CLIPProcessor, CLIPModel, AutoProcessor, AutoModel

def download_models():
    """Download and cache all required AI models"""
    print("Starting model download process...")
    
    # Create models directory
    MODEL_CACHE_DIR = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(MODEL_CACHE_DIR, exist_ok=True)
    
    # Check device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    
    try:
        # Download CLIP model and processor
        print("\n1. Downloading CLIP model (openai/clip-vit-base-patch32)...")
        clip_cache_dir = os.path.join(MODEL_CACHE_DIR, "clip-vit-base-patch32")
        
        clip_model = CLIPModel.from_pretrained(
            "openai/clip-vit-base-patch32",
            cache_dir=clip_cache_dir
        )
        clip_processor = CLIPProcessor.from_pretrained(
            "openai/clip-vit-base-patch32",
            cache_dir=clip_cache_dir
        )
        print("✓ CLIP model downloaded successfully")
        
        # Download SigLIP model for better image understanding
        print("\n2. Downloading SigLIP model (google/siglip-base-patch16-224)...")
        siglip_cache_dir = os.path.join(MODEL_CACHE_DIR, "siglip-base-patch16-224")
        
        siglip_model = AutoModel.from_pretrained(
            "google/siglip-base-patch16-224",
            cache_dir=siglip_cache_dir
        )
        siglip_processor = AutoProcessor.from_pretrained(
            "google/siglip-base-patch16-224",
            cache_dir=siglip_cache_dir
        )
        print("✓ SigLIP model downloaded successfully")
        
        # Download SentenceTransformer model
        print("\n3. Downloading SentenceTransformer model (all-MiniLM-L6-v2)...")
        sbert_cache_dir = os.path.join(MODEL_CACHE_DIR, "all-MiniLM-L6-v2")
        
        text_model = SentenceTransformer(
            "all-MiniLM-L6-v2",
            cache_folder=sbert_cache_dir
        )
        print("✓ SentenceTransformer model downloaded successfully")
        
        # Download multilingual E5 model for better multilingual text embeddings
        print("\n4. Downloading Multilingual E5 model (intfloat/multilingual-e5-base)...")
        e5_cache_dir = os.path.join(MODEL_CACHE_DIR, "multilingual-e5-base")
        
        e5_model = SentenceTransformer(
            "intfloat/multilingual-e5-base",
            cache_folder=e5_cache_dir
        )
        print("✓ Multilingual E5 model downloaded successfully")
        print(f"\n✓ All models downloaded and cached successfully!")
        print(f"Models cached in: {MODEL_CACHE_DIR}")
        print(f"  - CLIP cache: {clip_cache_dir}")
        print(f"  - SigLIP cache: {siglip_cache_dir}")
        print(f"  - SentenceTransformer (MiniLM) cache: {sbert_cache_dir}")
        print(f"  - Multilingual E5 cache: {e5_cache_dir}")
        
        # Show cache size
        total_size = get_directory_size(MODEL_CACHE_DIR)
        print(f"Total cache size: {format_size(total_size)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error downloading models: {e}")
        return False

def get_directory_size(path):
    """Get the total size of a directory"""
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(path):
        for filename in filenames:
            file_path = os.path.join(dirpath, filename)
            if os.path.exists(file_path):
                total_size += os.path.getsize(file_path)
    return total_size

def format_size(size_bytes):
    """Format bytes to human readable format"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    import math
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_names[i]}"

def check_models_exist():
    """Check if models are already downloaded"""
    MODEL_CACHE_DIR = os.path.join(os.path.dirname(__file__), "models")
    clip_cache_dir = os.path.join(MODEL_CACHE_DIR, "clip-vit-base-patch32")
    siglip_cache_dir = os.path.join(MODEL_CACHE_DIR, "siglip-base-patch16-224")
    sbert_cache_dir = os.path.join(MODEL_CACHE_DIR, "all-MiniLM-L6-v2")
    e5_cache_dir = os.path.join(MODEL_CACHE_DIR, "multilingual-e5-base")
    
    clip_exists = os.path.exists(clip_cache_dir) and os.listdir(clip_cache_dir)
    siglip_exists = os.path.exists(siglip_cache_dir) and os.listdir(siglip_cache_dir)
    sbert_exists = os.path.exists(sbert_cache_dir) and os.listdir(sbert_cache_dir)
    e5_exists = os.path.exists(e5_cache_dir) and os.listdir(e5_cache_dir)
    
    return clip_exists and siglip_exists and sbert_exists and e5_exists

def main():
    """Main function"""
    print("=" * 50)
    print("FilDOS AI API - Model Downloader")
    print("=" * 50)
    
    if check_models_exist():
        MODEL_CACHE_DIR = os.path.join(os.path.dirname(__file__), "models")
        total_size = get_directory_size(MODEL_CACHE_DIR)
        print(f"Models already exist in cache ({format_size(total_size)})")
        print(f"Cache location: {MODEL_CACHE_DIR}")
        return
    
    success = download_models()
    
    if success:
        print("python app.py")
        print("\nThe models will load quickly from cache!")
    else:
        print("\nModel download failed. Please check your internet connection and try again.")

if __name__ == "__main__":
    main()
