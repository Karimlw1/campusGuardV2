from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.router import router
from app.db.session import Base, engine
from app.core.config import settings
import os
import logging

class PhotoFilter(logging.Filter):
    def filter(self, record):
        return "/photo" not in record.getMessage()

logging.getLogger("uvicorn.access").addFilter(PhotoFilter())

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CampusGuard API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static/qr_codes", exist_ok=True)
os.makedirs("static/photos",   exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(router)

@app.get("/")
def root():
    return {"status": "CampusGuard API v2.0 running", "docs": "/docs"}
