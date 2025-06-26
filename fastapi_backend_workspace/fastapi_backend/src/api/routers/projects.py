from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas, models, database


router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)


# PUBLIC_INTERFACE
@router.post(
    "/",
    response_model=schemas.ProjectOut,
    summary="Create project",
    description="Create a new project in a team"
)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(database.get_db)):
    team = db.query(models.Team).filter(models.Team.id == project.team_id).first()
    if not team:
        raise HTTPException(
            status_code=400, detail="Team does not exist"
        )
    db_project = models.Project(
        name=project.name, description=project.description, team_id=project.team_id
    )
    db.add(db_project)
    try:
        db.commit()
        db.refresh(db_project)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=400, detail="Project with this name already exists"
        )
    return db_project


# PUBLIC_INTERFACE
@router.get(
    "/",
    response_model=list[schemas.ProjectOut],
    summary="List projects",
    description="List all projects (optionally filter by team)"
)
def list_projects(team_id: int = None, db: Session = Depends(database.get_db)):
    q = db.query(models.Project)
    if team_id:
        q = q.filter(models.Project.team_id == team_id)
    return q.all()


# PUBLIC_INTERFACE
@router.get(
    "/{project_id}",
    response_model=schemas.ProjectOut,
    summary="Get project",
    description="Get a project by ID"
)
def get_project(project_id: int, db: Session = Depends(database.get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=404, detail="Project not found"
        )
    return project
