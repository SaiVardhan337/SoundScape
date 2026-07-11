from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime
from typing import List, Dict

import models
from database import engine, get_db

# Create the SQLite tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SoundScape API")

# Enable CORS for local development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Notes Endpoints
@app.get("/api/notes")
def get_note(db: Session = Depends(get_db)):
    # SoundScape maintains a single, persistent workspace note for simplicity.
    # Create it if it doesn't exist yet.
    note = db.query(models.MarkdownNote).first()
    if not note:
        note = models.MarkdownNote(title="Workspace Note", content="# Welcome to SoundScape\n\nStart typing your thoughts, tasks, or code snippets here...")
        db.add(note)
        db.commit()
        db.refresh(note)
    return {"id": note.id, "title": note.title, "content": note.content, "updated_at": note.updated_at}

@app.post("/api/notes")
def update_note(payload: Dict[str, str], db: Session = Depends(get_db)):
    content = payload.get("content", "")
    note = db.query(models.MarkdownNote).first()
    if not note:
        note = models.MarkdownNote(title="Workspace Note", content=content)
        db.add(note)
    else:
        note.content = content
        note.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(note)
    return {"status": "success", "updated_at": note.updated_at}

# Focus Sessions Endpoints
@app.get("/api/sessions")
def get_sessions(db: Session = Depends(get_db)):
    sessions = db.query(models.FocusSession).order_by(models.FocusSession.completed_at.desc()).all()
    return sessions

@app.post("/api/sessions")
def log_session(payload: Dict[str, int], db: Session = Depends(get_db)):
    duration = payload.get("duration_minutes")
    if not duration or duration <= 0:
        raise HTTPException(status_code=400, detail="Invalid session duration.")
    
    session = models.FocusSession(duration_minutes=duration)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"status": "success", "session_id": session.id, "completed_at": session.completed_at}

@app.get("/api/stats")
def get_focus_stats(db: Session = Depends(get_db)):
    # Group sessions by date for the last 7 days and sum duration
    today = datetime.date.today()
    seven_days_ago = today - datetime.timedelta(days=7)
    
    # We query the database, converting the completed_at timestamp to date for grouping.
    # Note: SQLite date() function helps convert datetime strings
    results = db.query(
        func.date(models.FocusSession.completed_at).label("date"),
        func.sum(models.FocusSession.duration_minutes).label("total_minutes")
    ).filter(models.FocusSession.completed_at >= seven_days_ago)\
     .group_by(func.date(models.FocusSession.completed_at))\
     .order_by(func.date(models.FocusSession.completed_at))\
     .all()

    # Fill in zeros for days in the last week that had no sessions
    stats_dict = { (today - datetime.timedelta(days=i)).strftime("%Y-%m-%d"): 0 for i in range(7) }
    for res in results:
        if res.date in stats_dict:
            stats_dict[res.date] = int(res.total_minutes)
            
    # Sort chronological
    sorted_stats = [{"date": k, "minutes": v} for k, v in sorted(stats_dict.items())]
    return sorted_stats

# Mount the static site directories
app.mount("/", StaticFiles(directory="static", html=True), name="static")
