from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
import os
import uuid
import fitz
import re
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, Document
from app.database import get_db
from app.auth import get_current_user
from app.schemas import DocumentOut

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

    return document
