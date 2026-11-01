from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import to_camel


class Workflow(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    name: str
    description: str
    status: Literal["Active", "Draft", "Paused"]
    runs: int
    updated_at: str
    icon: Literal["bot", "branch", "gauge"]
    version: int
    nodes: list[dict[str, object]]
    edges: list[dict[str, object]]


class WorkflowGenerationRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    goal: str = Field(min_length=20, max_length=5000)
    provider: str = Field(pattern=r"^(ollama|groq|deepseek|gemini)$")
    model: str = Field(min_length=1, max_length=120)
    allow_external_api: bool = False
