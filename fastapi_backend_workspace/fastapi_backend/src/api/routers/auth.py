from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas, models, database
from passlib.context import CryptContext


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# PUBLIC_INTERFACE
@router.post(
    "/register",
    response_model=schemas.UserOut,
    summary="Register new user",
    description="Create a new user account.",
)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """Register a new user."""
    user_in_db = (
        db.query(models.User)
        .filter(
            (models.User.email == user.email)
            | (models.User.username == user.username)
        )
        .first()
    )
    if user_in_db:
        raise HTTPException(
            status_code=400, detail="Email or username already registered"
        )
    hashed = get_password_hash(user.password)
    db_user = models.User(
        email=user.email, username=user.username, hashed_password=hashed
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# PUBLIC_INTERFACE
@router.post(
    "/login",
    response_model=schemas.UserOut,
    summary="User login",
    description="Authenticate and login a user.",
)
def login(credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
    """User login endpoint."""
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=401, detail="Incorrect email or password"
        )
    return user
