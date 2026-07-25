from app.rag.chunker import chunk_document
from app.rag.embeddings import embed_texts
from app.rag.vectorstore import add_chunks_to_store

def process_document(document_id: int, filepath: str) -> int:
    chunks = chunk_document(filepath)
    if not chunks:
        raise ValueError("No extractable text found in document")
    texts = [c["text"] for c in chunks]
    embeddings = embed_texts(texts)
    add_chunks_to_store(document_id=document_id, chunks=chunks, embeddings=embeddings)
    return len(chunks)
