import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base

class MarkdownNote(Base):
    __tablename__ = "markdown_notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="Workspace Note", index=True)
    content = Column(Text, default="")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True, index=True)
    duration_minutes = Column(Integer, nullable=False)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)
