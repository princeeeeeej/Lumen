from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship, Mapped, mapped_column

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    documents = relationship("Document", back_populates="owner")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="uploaded")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner = relationship("User", back_populates="documents")

    messages = relationship("Message", back_populates="document", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    sources: Mapped[list[int]] = mapped_column(JSON,default=list,nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="messages")
