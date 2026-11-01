from fastapi import APIRouter

from app.schemas.model import ModelProvider
from app.services.model_service import get_model_catalog

router = APIRouter()


@router.get("/models", response_model=list[ModelProvider])
def list_models() -> list[ModelProvider]:
    return get_model_catalog()
