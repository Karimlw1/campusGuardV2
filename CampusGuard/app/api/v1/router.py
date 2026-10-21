from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, gates, misc, features

router = APIRouter()
router.include_router(auth.router)
router.include_router(users.router)
router.include_router(gates.router)
router.include_router(misc.router)
router.include_router(features.router)
