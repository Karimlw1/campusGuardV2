from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    id          = Column(Integer, primary_key=True, index=True)
    full_name   = Column(String(120), nullable=False)
    email       = Column(String(120), unique=True, index=True)
    reg_number  = Column(String(60), unique=True, index=True)
    role        = Column(Enum("admin","guard","student","staff","lecturer"), nullable=False)
    password    = Column(String(255), nullable=False)
    qr_code     = Column(String(120), unique=True, index=True)
    qr_expires  = Column(DateTime, nullable=True)           # Feature 12: QR expiry
    photo       = Column(String(255), nullable=True)        # Feature 3: photo
    status      = Column(Enum("active","inactive","blacklisted"), default="active")
    created_at  = Column(DateTime, server_default=func.now())
    entries     = relationship("Entry", foreign_keys="Entry.user_id", back_populates="user")

class Gate(Base):
    __tablename__ = "gates"
    id        = Column(Integer, primary_key=True)
    name      = Column(String(80), nullable=False)
    location  = Column(String(120))
    mode      = Column(Enum("guarded","auto"), default="guarded")
    active    = Column(Boolean, default=True)
    locked    = Column(Boolean, default=False)              # Feature 2: lockdown

class Entry(Base):
    __tablename__ = "entries"
    id          = Column(Integer, primary_key=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"))
    gate_id     = Column(Integer, ForeignKey("gates.id", ondelete="SET NULL"), nullable=True)
    direction   = Column(Enum("in","out"), nullable=False)
    mode        = Column(Enum("guarded","auto"), default="guarded")
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    scanned_at  = Column(DateTime, server_default=func.now(), index=True)
    user        = relationship("User", foreign_keys=[user_id], back_populates="entries")

class Visitor(Base):
    __tablename__ = "visitors"
    id            = Column(Integer, primary_key=True)
    name          = Column(String(120), nullable=False)
    id_number     = Column(String(60))
    phone         = Column(String(20))
    email         = Column(String(120), nullable=True)      # Feature 7: pre-reg
    reason        = Column(String(200))
    host          = Column(String(120))
    host_user_id  = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    temp_pass     = Column(String(120), unique=True)
    pre_registered= Column(Boolean, default=False)          # Feature 7
    prereg_token  = Column(String(64), unique=True, nullable=True)
    time_in       = Column(DateTime, server_default=func.now())
    expected_exit = Column(DateTime, nullable=True)
    checked_out   = Column(Boolean, default=False)
    checkout_time = Column(DateTime, nullable=True)

class Alert(Base):
    __tablename__ = "alerts"
    id          = Column(Integer, primary_key=True)
    gate_id     = Column(Integer, ForeignKey("gates.id", ondelete="SET NULL"), nullable=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    type        = Column(Enum("invalid_qr","blacklisted","overstay","repeated_fail","lockdown","qr_expired","qr_compromised","manual"), nullable=False)
    description = Column(Text)
    resolved    = Column(Boolean, default=False)
    timestamp   = Column(DateTime, server_default=func.now(), index=True)

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    token      = Column(String(512), unique=True, index=True)
    expires_at = Column(DateTime)
    revoked    = Column(Boolean, default=False)

class AuditLog(Base):                                       # Feature 9
    __tablename__ = "audit_logs"
    id          = Column(Integer, primary_key=True)
    actor_id    = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_name  = Column(String(120))
    action      = Column(String(80), nullable=False)        # e.g. "user.blacklist", "gate.lockdown"
    target_type = Column(String(40), nullable=True)         # "user", "gate", "visitor"
    target_id   = Column(Integer, nullable=True)
    detail      = Column(Text, nullable=True)               # JSON string with before/after
    timestamp   = Column(DateTime, server_default=func.now(), index=True)

class SystemState(Base):                                    # Feature 2: global lockdown
    __tablename__ = "system_state"
    id          = Column(Integer, primary_key=True)
    key         = Column(String(60), unique=True, nullable=False)
    value       = Column(String(255))
    updated_by  = Column(Integer, nullable=True)
    updated_at  = Column(DateTime, server_default=func.now(), onupdate=func.now())
