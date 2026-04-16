from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional
import json
import os
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

router = APIRouter()

SECRET_KEY = "SUPER_SECRET_COPILOT_KEY_CHANGE_ME"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

USER_DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    'data',
    'users.json'
)

# Ensure data directory exists
os.makedirs(os.path.dirname(USER_DB_PATH), exist_ok=True)

# Create file if not exists
if not os.path.exists(USER_DB_PATH):
    with open(USER_DB_PATH, 'w') as f:
        json.dump({}, f)


class UserAuth(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


def get_users():
    with open(USER_DB_PATH, 'r') as f:
        return json.load(f)


def save_users(users):
    with open(USER_DB_PATH, 'w') as f:
        json.dump(users, f, indent=4)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# 🔐 SAFE PASSWORD HANDLING FUNCTION
def hash_password(password: str):
    password_bytes = password.encode('utf-8')

    if len(password_bytes) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password too long (max 72 bytes allowed)"
        )

    return pwd_context.hash(password_bytes)


def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return username
    except Exception:
        raise credentials_exception


# ---------------- SIGNUP ----------------
@router.post("/signup")
async def signup(user: UserAuth):
    users = get_users()

    if user.username in users:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_password = hash_password(user.password)

    users[user.username] = {
        "password": hashed_password,
        "created_at": datetime.utcnow().isoformat()
    }

    save_users(users)

    access_token = create_access_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username
    }


# ---------------- LOGIN ----------------
@router.post("/login")
async def login(user: UserAuth):
    users = get_users()
    db_user = users.get(user.username)

    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username
    }