from groq import Groq
from app.config import settings

_client = None

def get_llm_client():
    global _client
    if _client is None:
        _client = Groq(api_key=settings.groq_api_key)
    return _client

def generate_answer(context: str, question: str) -> str:
    from app.rag.prompts import RAG_PROMPT_TEMPLATE

    prompt = RAG_PROMPT_TEMPLATE.format(context=context, question=question)
    client = get_llm_client()

    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        max_tokens=512
    )
    return response.choices[0].message.content
