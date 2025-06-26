from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
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
        # Use SQLAlchemy's text() for raw SQL to avoid ArgumentError
        db.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as e:
        # Catch all exceptions to handle unexpected DB errors and avoid 500
        return {"status": "error", "detail": str(e)}
