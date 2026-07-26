from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, Document
from app.schemas import ChatRequest, ChatResponse
from app.auth import get_current_user
from app.rag.graph import build_rag_graph, run_rag_stream
from fastapi.responses import StreamingResponse
import json


router = APIRouter(prefix="/api/chat", tags=["chat"])

_rag_app = None

def get_rag_app():
    global _rag_app
    if _rag_app is None:
        _rag_app = build_rag_graph()
    return _rag_app

@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Document).where(
        Document.id == request.document_id,
        Document.owner_id == current_user.id
    ))
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.status != "indexed":
        raise HTTPException(status_code=400, detail=f"Document is not ready (status: {document.status})")

    rag_app = get_rag_app()
    result = rag_app.invoke({
        "question": request.question,
        "document_id": document.id
    })

    return ChatResponse(answer=result["answer"], sources=result.get("sources", []))

@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document).where(
            Document.id == request.document_id,
            Document.owner_id == current_user.id
        )
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.status != "indexed":
        raise HTTPException(status_code=400, detail=f"Document is not ready (status: {document.status})")

    def event_generator():
        for event in run_rag_stream(request.question, document.id):
            if event["type"] == "token":
                yield f"data: {json.dumps({'token': event['content']})}\n\n"
            elif event["type"] == "sources":
                yield f"data: {json.dumps({'sources': event['content']})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
