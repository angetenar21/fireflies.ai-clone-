from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth_utils import DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD, ensure_demo_user
from app.db.session import get_db
from app.models import Meeting, User

router = APIRouter(prefix="/auth", tags=["auth"])


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    meeting_count: int = 0

    model_config = {"from_attributes": True}


def _user_out(db: Session, user: User) -> UserOut:
    count = db.query(Meeting).filter(Meeting.owner_id == user.id).count()
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        meeting_count=count,
    )


def get_current_user(
    db: Session = Depends(get_db),
) -> User:
    return ensure_demo_user(db)


def get_optional_user(
    db: Session = Depends(get_db),
) -> User | None:
    return ensure_demo_user(db)


@router.get("/me", response_model=UserOut)
def me(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserOut:
    return _user_out(db, user)


@router.post("/logout")
def logout() -> dict:
    return {"status": "ok"}


@router.get("/demo-account")
def demo_account() -> dict:
    """Public hint for evaluators — demo login credentials."""
    return {
        "name": DEMO_NAME,
        "email": DEMO_EMAIL,
        "password": DEMO_PASSWORD,
        "note": "This account is seeded with 6 full sample meetings.",
    }
