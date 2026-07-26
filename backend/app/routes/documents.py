from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import os
import uuid
import fitz
import re
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, Document, Message
from app.database import get_db
from app.auth import get_current_user
from app.schemas import DocumentOut, MessageOut
from app.rag.ingestion import process_document
from sqlalchemy import select
from typing import List

router = APIRouter(prefix="/api/documents", tags=["documents"])

UPLOAD_DIR = "data/uploads"

def sanitize_filename(filename: str) -> str:
    return re.sub(r'[<>:"/\\|?*]', '_', filename)

@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User =Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    clean_name = sanitize_filename(file.filename)
    safe_name = f"{uuid.uuid4()}_{clean_name}"
    filepath = os.path.join(UPLOAD_DIR, safe_name)

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    try:
        doc = fitz.open(filepath)
        page_count = doc.page_count
        doc.close()
    except:
        os.remove(filepath)
        raise HTTPException(status_code=400, detail="Invalid or corrupted PDF")

    document = Document(
        filename = file.filename,
        filepath = filepath,
        owner_id = current_user.id,
        status = "uploaded"
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    try:
        process_document(document_id=document.id, filepath=filepath)
        document.status = "indexed"
    except Exception as e:
        document.status = "failed"
        print(f"Processing failed for document {document.id}: {e}")

    await db.commit()
    await db.refresh(document)

    return document

@router.get("", response_model=List[DocumentOut])
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document).where(Document.owner_id == current_user.id)
    )
    documents = result.scalars().all()
    return documents

@router.get("/{document_id}", response_model=DocumentOut)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.owner_id == current_user.id
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.get("/{document_id}/file")
async def get_document_file(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.owner_id == current_user.id
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return FileResponse(document.filepath, media_type="application/pdf")


@router.get("/{document_id}/history", response_model=List[MessageOut])
async def get_chat_history(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    doc_result = await db.execute(select(Document).where(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ))

    if not doc_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Document not found")

    result = await db.execute(
        select(Message).where(Message.document_id == document_id).order_by(Message.created_at)
    )

    return result.scalars().all()
