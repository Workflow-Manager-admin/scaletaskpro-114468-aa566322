from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from .database import engine, get_db
from .models import Base
from .routers import auth, teams, projects, tasks, health
from sqlalchemy.orm import Session


app = FastAPI(
    title="Task Manager API",
    description=(
        "API backend for scalable task manager (user authentication, "
        "project/team/task organization, status updates)."
    ),
    version="1.0.0",
    openapi_tags=[
        {"name": "Authentication", "description": "Register and login users"},
        {"name": "Teams", "description": "Team creation/listing"},
        {"name": "Projects", "description": "Project CRUD and organization"},
        {"name": "Tasks", "description": "Task CRUD operations"},
        {"name": "Misc", "description": "Health and utility endpoints"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create DB tables
Base.metadata.create_all(bind=engine)


# Health check (API and DB)
@app.get("/", tags=["Misc"])
def health_check(db: Session = Depends(get_db)):
    """
    Returns API and database health status.
    """
    try:
        db.execute("SELECT 1")
        db_status = "ok"
    except OperationalError:
        db_status = "unhealthy"
    return {"status": "ok", "db_status": db_status}


app.include_router(auth.router)
app.include_router(teams.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(health.router)
