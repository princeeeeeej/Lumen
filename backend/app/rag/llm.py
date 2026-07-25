from huggingface_hub import InferenceClient
from app.config import settings

_client = None

def get_llm_client():
    global _client
    if _client is None:
        _client = InferenceClient(token=settings.hf_token)
    return _client

def generate_answer(context: str, question: str) -> str:
    from app.rag.prompts import RAG_PROMPT_TEMPLATE

    prompt = RAG_PROMPT_TEMPLATE.format(context=context, question=question)
    client = get_llm_client()

    response = client.chat_completion(
        messages=[{"role": "user", "content": prompt}],
        model="Qwen/Qwen2.5-72B-Instruct",
        max_tokens=512
    )
    return response.choices[0].message.content
