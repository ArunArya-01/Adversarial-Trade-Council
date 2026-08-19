from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from datetime import datetime
from .db import Base

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="default_user", index=True)
    completed_lessons = Column(JSON, default=list)
    completed_scenarios = Column(JSON, default=list)
    total_xp = Column(Integer, default=0)
    virtual_cash = Column(Float, default=15000.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
