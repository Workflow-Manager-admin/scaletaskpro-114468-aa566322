from fastapi import APIRouter, Depends
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from ..database import get_db

router = APIRouter(
    prefix="/health",
    tags=["Misc"],
)

# PUBLIC_INTERFACE


@router.get(
    "/db",
    summary="Health check - Database",
    description="Check if the application can connect to the SQLite database.",
    response_model=dict,
    responses={
        200: {
            "description": "DB connection successful",
            "content": {"application/json": {}},
        },
        500: {
            "description": "DB connection failed",
            "content": {"application/json": {}},
        }
    }
)
def db_health_check(db: Session = Depends(get_db)):
    """
    Checks database connectivity by running a simple SELECT statement.

    Returns:
        JSON indicating DB status:
        - {"status": "ok"} if DB connection works.
        - {"status": "error", "detail": <error>} if not.
    """
    try:
        db.execute("SELECT 1")
        return {"status": "ok"}
    except OperationalError as e:
        return {"status": "error", "detail": str(e)}
