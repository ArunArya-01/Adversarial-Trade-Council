from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.learn import router as learn_router
from api.practice import router as practice_router
from api.news import router as news_router
from database.db import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TradeMind AI Institutional Platform",
    version="3.0.0",
    description="Educational Financial Ecosystem: Learning Academy, Decision Arena & Live Financial Terminal"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(learn_router, prefix="/api")
app.include_router(practice_router, prefix="/api")
app.include_router(news_router, prefix="/api")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "version": "3.0.0",
        "ecosystem": "Learn / Practice / News",
        "live_news_rss": "Active (5-min refresh)",
        "database": "SQLite Initialized"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
