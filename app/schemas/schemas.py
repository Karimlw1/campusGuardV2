from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime

# ── Auth ──────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: dict

class RefreshRequest(BaseModel):
    refresh_token: str

# ── User ──────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    full_name:  str
    email:      EmailStr
    reg_number: str
    role:       Literal["admin","guard","student","staff","lecturer"]
    password:   str

class UserUpdate(BaseModel):
    full_name:  Optional[str] = None
    email:      Optional[EmailStr] = None
    status:     Optional[Literal["active","inactive","blacklisted"]] = None

class UserOut(BaseModel):
    id:          int
    full_name:   str
    email:       str
    reg_number:  str
    role:        str
    qr_code:     Optional[str] = None
    qr_expires:  Optional[datetime] = None
    photo:       Optional[str] = None
    status:      str
    created_at:  datetime
    class Config: from_attributes = True

# UserPublic — minimal info for portal and gate display
class UserPublic(BaseModel):
    id:         int
    full_name:  str
    reg_number: str
    role:       str
    photo:      Optional[str] = None
    class Config: from_attributes = True

# ── Gate ──────────────────────────────────────────────────────────
class ScanRequest(BaseModel):
    qr_code: str
    gate_id: int
    mode:    Literal["guarded","auto"] = "guarded"

class AdmitRequest(BaseModel):
    user_id:   int
    gate_id:   int
    direction: Literal["in","out"]
    mode:      Literal["guarded","auto"] = "guarded"

class EntryOut(BaseModel):
    id:         int
    user_id:    int
    gate_id:    Optional[int] = None
    direction:  str
    scanned_at: datetime
    class Config: from_attributes = True

# ── Visitor ───────────────────────────────────────────────────────
class VisitorCreate(BaseModel):
    name:          str
    id_number:     Optional[str] = None
    phone:         Optional[str] = None
    reason:        Optional[str] = None
    host:          Optional[str] = None
    expected_exit: Optional[str] = None   # "HH:MM" string from frontend

class VisitorOut(BaseModel):
    id:            int
    name:          str
    id_number:     Optional[str] = None
    reason:        Optional[str] = None
    host:          Optional[str] = None
    time_in:       Optional[datetime] = None
    expected_exit: Optional[datetime] = None
    checked_out:   bool
    class Config: from_attributes = True

# ── Alert ─────────────────────────────────────────────────────────
class AlertOut(BaseModel):
    id:          int
    type:        str
    description: Optional[str] = None
    resolved:    bool
    timestamp:   datetime
    class Config: from_attributes = True
