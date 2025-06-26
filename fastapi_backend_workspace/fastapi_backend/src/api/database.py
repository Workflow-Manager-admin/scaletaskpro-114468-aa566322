from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os


# SQLite DB path (can be customized via env)
DATABASE_URL = os.environ.get("TASKAPP_DB_URL", "sqlite:///./taskapp.db")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# PUBLIC_INTERFACE
def get_db():
    """Dependency for getting DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
