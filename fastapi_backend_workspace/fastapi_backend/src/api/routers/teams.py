from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas, models, database


router = APIRouter(
    prefix="/teams",
    tags=["Teams"]
)


# PUBLIC_INTERFACE
@router.post(
    "/",
    response_model=schemas.TeamOut,
    summary="Create team",
    description="Create a new team"
)
def create_team(team: schemas.TeamCreate, db: Session = Depends(database.get_db)):
    db_team = models.Team(name=team.name, description=team.description)
    db.add(db_team)
    try:
        db.commit()
        db.refresh(db_team)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=400, detail="Team with this name already exists"
        )
    return db_team


# PUBLIC_INTERFACE
@router.get(
    "/",
    response_model=list[schemas.TeamOut],
    summary="List teams",
    description="List all teams"
)
def list_teams(db: Session = Depends(database.get_db)):
    return db.query(models.Team).all()


# PUBLIC_INTERFACE
@router.get(
    "/{team_id}",
    response_model=schemas.TeamOut,
    summary="Get team",
    description="Get a team by ID"
)
def get_team(team_id: int, db: Session = Depends(database.get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=404, detail="Team not found"
        )
    return team
