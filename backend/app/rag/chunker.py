import fitz

def extract_text_by_page(filepath: str) -> list[dict]:
    doc = fitz.open(filepath)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text()
        if text.strip():
            pages.append({"page_number": i+1, "text": text})
    doc.close()
    return pages

def chunk_text(text: str, chunk_size: int = 1000, overlap:int = 200) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks

def chunk_document(filepath: str, chunk_size: int = 1000, overlap: int = 200) -> list[dict]:
    pages = extract_text_by_page(filepath)
    all_chunks = []

    for page in pages:
        page_chunks = chunk_text(page["text"], chunk_size, overlap)
        for chunk in page_chunks:
            all_chunks.append({
                "text": chunk,
                "page_number": page["page_number"]
            })
    return all_chunks
