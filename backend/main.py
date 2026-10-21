import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
from api.learn import router as learn_router
from api.practice import router as practice_router
from api.news import router as news_router
from api.academy import router as academy_router
from api.lab import router as lab_router
from database.db import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TradeMind AI",
    version="4.0.0",
    description="Trading Academy and research-oriented AI Investment Lab"
)

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(learn_router, prefix="/api")
app.include_router(practice_router, prefix="/api")
app.include_router(news_router, prefix="/api")
app.include_router(academy_router, prefix="/api")
app.include_router(lab_router, prefix="/api")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "version": "4.0.0",
        "modules": ["trading-academy", "ai-investment-lab"],
        "academy_data": "simulated practice candles and RSS news",
        "lab_data": "unavailable"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
