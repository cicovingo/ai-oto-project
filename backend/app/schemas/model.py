from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.common import to_camel

ModelCapability = Literal["text", "vision", "tool_use"]


class ModelOption(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    name: str
    capabilities: list[ModelCapability]


class ModelProvider(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    name: str
    is_configured: bool
    is_free: bool
    requires_api_key: bool
    access_note: str
    models: list[ModelOption]
