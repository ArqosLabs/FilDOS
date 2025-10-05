# AI Models Reference Guide

## Overview

FilDOS uses multiple specialized AI models for optimal search and embedding performance:

| Model | Purpose | Dimensions | Use Case |
|-------|---------|------------|----------|
| **SigLIP** | Image embeddings | 768 | Images & cross-modal search |
| **Multilingual E5** | Text embeddings | 768 | Multilingual documents |
| **MiniLM** | OCR text embeddings | 384 | Text extracted from images |
| **CLIP** | Backup image model | 512 | Fallback for SigLIP |
| **EasyOCR** | Text extraction | - | Extract text from images |

---

## Model Details

### 1. SigLIP (google/siglip-base-patch16-224)

**What it does:**
- Encodes images into 768-dimensional vectors
- Encodes text queries for image search
- Better than CLIP for most tasks

**When to use:**
- Primary model for all image embeddings
- Text queries searching for images
- Cross-modal retrieval (text → image)

**Key advantages:**
- ✅ Better zero-shot accuracy than CLIP
- ✅ More robust to noisy/ambiguous text
- ✅ Sigmoid loss (better than softmax)
- ✅ Multilingual support

**Usage:**
```python
# For images
image_features = siglip_model.get_image_features(**image_inputs)
image_features = image_features / image_features.norm(p=2, dim=-1, keepdim=True)

# For text queries (when searching images)
text_features = siglip_model.get_text_features(**text_inputs)
text_features = text_features / text_features.norm(p=2, dim=-1, keepdim=True)
```

---

### 2. Multilingual E5 (intfloat/multilingual-e5-base)

**What it does:**
- Encodes text documents into 768-dimensional vectors
- Optimized for 100+ languages
- State-of-the-art multilingual retrieval

**When to use:**
- All text documents (PDF, DOCX, TXT, MD)
- Multilingual content
- Semantic text search

**Key advantages:**
- ✅ Best multilingual performance
- ✅ 768 dims (same as SigLIP for consistency)
- ✅ State-of-the-art retrieval accuracy
- ✅ Works with query/passage prefixes

**Important: Requires Prefixes!**
```python
# For documents (storage):
text_emb = e5_model.encode(
    f"passage: {text}",
    normalize_embeddings=True
)

# For search queries:
query_emb = e5_model.encode(
    f"query: {query}",
    normalize_embeddings=True
)
```

**Why prefixes?**
- E5 was trained with "query:" and "passage:" prefixes
- Improves retrieval accuracy by 5-10%
- Helps model distinguish between queries and documents

---

### 3. MiniLM (all-MiniLM-L6-v2)

**What it does:**
- Encodes short text into 384-dimensional vectors
- Fast and efficient
- Perfect for OCR-extracted text

**When to use:**
- Text extracted from images via OCR
- When you need smaller embeddings
- Fast embedding generation

**Key advantages:**
- ✅ Small model (~80MB)
- ✅ Fast inference
- ✅ Good for short texts
- ✅ Lower dimensionality (384 vs 768)

---

### 4. CLIP (openai/clip-vit-base-patch32)

**What it does:**
- Legacy image/text encoder
- 512-dimensional embeddings
- Kept for backward compatibility

**When to use:**
- Fallback if SigLIP fails
- When you need 512-dim embeddings specifically
- Compatibility with existing CLIP-based systems

**Note:** We primarily use SigLIP now, but CLIP is still loaded as a backup.

---

### 5. EasyOCR

**What it does:**
- Extracts text from images
- Supports 80+ languages
- GPU-accelerated

**When to use:**
- Images with text (screenshots, documents, signs)
- Scanned documents
- Memes with text overlays

**Process:**
1. Extract text from image using OCR
2. If substantial text found (>10 chars)
3. Embed with MiniLM
4. Store both image vector (SigLIP) and text vector (MiniLM)


---

## Model Selection Flow

### For Image Files (JPG, PNG, etc.)

```
1. Load image
   ↓
2. Encode with SigLIP → 768-dim vector (image_vector)
   ↓
3. Try OCR to extract text
   ↓
4. If text found (>10 chars):
   - Encode with MiniLM → 384-dim vector (text_vector)
   ↓
5. Store both vectors in Weaviate
```

### For Text Files (PDF, DOCX, TXT, MD)

```
1. Extract text content
   ↓
2. Add "passage: " prefix
   ↓
3. Encode with E5 → 768-dim vector (text_vector)
   ↓
4. Store in Weaviate
   (image_vector = dummy zero vector)
```

### For Search Queries

```
Query text input
   ↓
Split into two searches:
   ↓
┌─────────────────────┬────────────────────┐
│  Image Search       │  Text Search       │
│  (for image files)  │  (for text files)  │
├─────────────────────┼────────────────────┤
│  Use SigLIP text    │  Use E5 with       │
│  encoder            │  "query:" prefix   │
│  → 768-dim          │  → 768-dim         │
│                     │                    │
│  Search against     │  Search against    │
│  image_vector       │  text_vector       │
└─────────────────────┴────────────────────┘
   ↓                      ↓
Combine & rank results by similarity score
```

## Storage in Weaviate

### Named Vectors

We use Weaviate's **named vectors** feature to store multiple embeddings per file:

```python
{
  "filename": "document.pdf",
  "url": "https://...",
  "type": "text",
  "text_preview": "First 1000 chars...",
  "timestamp": "2025-10-05T...",
  
  # Named vectors
  "image_vector": [0, 0, 0, ...],  # 768 dims (dummy for text files)
  "text_vector": [0.12, -0.34, ...]  # 768 dims (E5 embedding)
}
```



---


## References

- [SigLIP Paper](https://arxiv.org/abs/2303.15343)
- [Multilingual E5 Paper](https://arxiv.org/abs/2402.05672)
- [Sentence-BERT Paper](https://arxiv.org/abs/1908.10084)
- [CLIP Paper](https://arxiv.org/abs/2103.00020)
- [EasyOCR GitHub](https://github.com/JaidedAI/EasyOCR)
