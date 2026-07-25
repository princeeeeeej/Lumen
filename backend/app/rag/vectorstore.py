import chromadb
from chromadb.config import Settings as ChromaSettings

_client = None

def get_chroma_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path="data/chroma")
    return _client

def get_or_create_collection(name: str = "documents"):
    client = get_chroma_client()
    return client.get_or_create_collection(name=name)

def add_chunks_to_store(
        document_id: int,
        chunks: list[dict],
        embeddings: list[list[float]]
):
    collection = get_or_create_collection()

    ids = [f"{document_id}_chunk{i}" for i in range(len(chunks))]
    documents = [c["text"] for c in chunks]
    metadatas = [
        {"document_id": document_id, "page_number": c["page_number"]}
        for c in chunks
    ]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas
    )

def query_store(query_embeddings: list[float], document_id: int = None, top_k: int = 5):
    collection = get_or_create_collection()

    where_filter = {"document_id": document_id} if document_id else None

    results = collection.query(
        query_embeddings=[query_embeddings],
        n_results = top_k,
        where = where_filter
    )
    return results
