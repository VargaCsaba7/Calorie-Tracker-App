import datetime as dt

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

password_hash = PasswordHash.recommended()  # Argon2

# Verified against when the user doesn't exist, so a failed login takes the same
# time either way and doesn't reveal which usernames are registered.
DUMMY_HASH = password_hash.hash("dummy-password")


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def create_access_token(subject: str | int) -> str:
    expire = dt.datetime.now(dt.UTC) + dt.timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> str | None:
    """Return the token's subject (the user id), or None if invalid or expired."""
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
    except jwt.InvalidTokenError:
        return None
    return payload.get("sub")
