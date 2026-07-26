from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from app.rag.embeddings import embed_texts
from app.rag.vectorstore import query_store
from app.rag.llm import generate_answer, get_llm_client

class RAGState(TypedDict):
    question: str
    document_id: int
    needs_retrieval: bool
    retrieved_chunks: Optional[list]
    retrieved_metadata: Optional[list]
    context: Optional[str]
    is_relevant: bool
    answer: Optional[str]
    sources: Optional[list]

def router_node(state: RAGState) -> RAGState:
    question = state["question"].lower().strip()
    greetings = ["hi", "hello", "hey", "thanks", "thank you"]
    state["needs_retrieval"] = question not in greetings
    return state

def retrieve_node(state: RAGState) -> RAGState:
    query_vec = embed_texts([state["question"]])[0]
    results = query_store(query_vec, document_id=state["document_id"], top_k=3)
    state["retrieved_chunks"] = results["documents"][0] if results["documents"] else []
    state["retrieved_metadata"] = results["metadatas"][0] if results["metadatas"] else []
    state["context"] = "\n\n".join(state["retrieved_chunks"])
    return state

def grade_node(state: RAGState) -> RAGState:
    if not state["retrieved_chunks"]:
        state["is_relevant"] = False
        return state

    client = get_llm_client()
    grading_prompt = f"""Given the question and retrieved context, answer only "yes" or "no": is this context relevant enough to answer the question?

        Question: {state["question"]}
        Context: {state["context"]}

        Relevant (yes/no):"""

    response = client.chat.completions.create(
        messages=[{"role": "user", "content": grading_prompt}],
        model="llama-3.3-70b-versatile",
        max_tokens=20
    )
    verdict = response.choices[0].message.content.strip().lower()
    print(f"DEBUG grading verdict: '{verdict}'")
    state["is_relevant"] = "yes" in verdict
    return state

def generate_node(state: RAGState) -> RAGState:
    if not state.get("needs_retrieval", True):
        state["answer"] = "Hello! Ask me anything about your document."
        state["sources"] = []
        return state

    if not state.get("is_relevant", False):
        state["answer"] = "I couldn't find relevant information in the document to answer that."
        state["sources"] = []
        return state

    state["answer"] = generate_answer(state["context"], state["question"])
    pages = sorted(set(m["page_number"] for m in state.get("retrieved_metadata", [])))
    state["sources"] = pages
    return state

def route_after_router(state: RAGState) -> str:
    return "retrieve" if state["needs_retrieval"] else "generate"

def route_after_grade(state: RAGState) -> str:
    return "generate"

def run_rag_stream(question: str, document_id: int):
    from app.rag.embeddings import embed_texts
    from app.rag.vectorstore import query_store
    from app.rag.llm import generate_answer_stream, get_llm_client

    question_lower = question.lower().strip()
    greetings = ["hi", "hello", "hey", "thanks", "thank you"]

    if question_lower in greetings:
        yield {"type": "token", "content": "Hello! Ask me anything about your document."}
        yield {"type": "sources", "content": []}
        return

    query_vec = embed_texts([question])[0]
    results = query_store(query_vec, document_id=document_id, top_k=3)
    chunks = results["documents"][0] if results["documents"] else []
    metadatas = results["metadatas"][0] if results["metadatas"] else []
    context = "\n\n".join(chunks)

    if not chunks:
        yield {"type": "token", "content": "I couldn't find relevant information in the document to answer that."}
        yield {"type": "sources", "content": []}
        return

    client = get_llm_client()
    grading_prompt = f"""Given the question and retrieved context, answer only "yes" or "no": is this context relevant enough to answer the question?

        Question: {question}
        Context: {context}

        Relevant (yes/no):"""

    response = client.chat.completions.create(
        messages=[{"role": "user", "content": grading_prompt}],
        model="llama-3.3-70b-versatile",
        max_tokens=20
    )

    verdict = response.choices[0].message.content.strip().lower()

    if "yes" not in verdict:
        yield {"type": "token", "content": "I couldn't find relevant information in the document to answer that."}
        yield {"type": "sources", "content": []}
        return

    for token in generate_answer_stream(context, question):
        yield {"type": "token", "content": token}

    pages = sorted(set(m["page_number"] for m in metadatas))
    yield {"type": "sources", "content": pages}


def build_rag_graph():
    graph = StateGraph(RAGState)

    graph.add_node("router", router_node)
    graph.add_node("retrieve", retrieve_node)
    graph.add_node("grade", grade_node)
    graph.add_node("generate", generate_node)

    graph.set_entry_point("router")
    graph.add_conditional_edges("router", route_after_router, {
        "retrieve": "retrieve",
        "generate": "generate"
    })
    graph.add_edge("retrieve", "grade")
    graph.add_edge("grade", "generate")
    graph.add_edge("generate",END)

    return graph.compile()
