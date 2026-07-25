from fastapi import FastAPI
from app.config import settings
from app.database import engine, Base
from app.routes import auth as auth_routes
from app.routes import documents as document_routes
from app.routes import chat as chat_routes


app = FastAPI(title=settings.app_name)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(auth_routes.router)
app.include_router(document_routes.router)
app.include_router(chat_routes.router)
