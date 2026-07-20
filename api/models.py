import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from api.database import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class MarkdownNote(Base):
    __tablename__ = "markdown_notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="Workspace Note", index=True)
    content = Column(Text, default="")
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True, index=True)
    duration_minutes = Column(Integer, nullable=False)
    completed_at = Column(DateTime, default=utc_now)

