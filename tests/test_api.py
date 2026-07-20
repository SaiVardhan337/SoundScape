import os
import tempfile
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import api.models as models
from api.database import Base, get_db
from api.index import app


@pytest.fixture(scope="session")
def test_db():
    db_fd, db_path = tempfile.mkstemp()
    engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    yield

    os.close(db_fd)
    os.unlink(db_path)


client = TestClient(app)


def test_get_initial_note(test_db):
    response = client.get("/api/notes")
    assert response.status_code == 200
    data = response.json()
    assert "title" in data
    assert "content" in data
    assert "Welcome to SoundScape" in data["content"]


def test_update_note(test_db):
    payload = {"content": "# Updated Test Note\n\nTesting FastAPI endpoint."}
    response = client.post("/api/notes", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"

    get_res = client.get("/api/notes")
    assert get_res.status_code == 200
    assert get_res.json()["content"] == "# Updated Test Note\n\nTesting FastAPI endpoint."


def test_log_focus_session(test_db):
    payload = {"duration_minutes": 25}
    response = client.post("/api/sessions", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert "session_id" in response.json()

    sessions_res = client.get("/api/sessions")
    assert sessions_res.status_code == 200
    sessions_list = sessions_res.json()
    assert len(sessions_list) >= 1
    assert any(s["duration_minutes"] == 25 for s in sessions_list)


def test_invalid_focus_session(test_db):
    payload = {"duration_minutes": 0}
    response = client.post("/api/sessions", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid session duration."


def test_get_focus_stats(test_db):
    client.post("/api/sessions", json={"duration_minutes": 30})

    response = client.get("/api/stats")
    assert response.status_code == 200
    stats = response.json()
    assert isinstance(stats, list)
    assert len(stats) == 7


def test_serve_static_index(test_db):
    response = client.get("/")
    assert response.status_code == 200
    assert "SoundScape" in response.text
