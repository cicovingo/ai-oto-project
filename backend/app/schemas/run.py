from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import to_camel


class WorkflowRunStep(BaseModel):
    id: str
    name: str
    status: Literal["queued", "running", "completed", "failed", "skipped"]
    duration: str
    detail: str


class WorkflowRun(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    workflow_id: str
    workflow_name: str
    status: Literal["queued", "running", "completed", "failed", "cancelled"]
    started_at: str
    duration: str
    score: float | None
    trigger: Literal["Manual", "Scheduled"]
    steps: list[WorkflowRunStep]
    outputs: dict[str, object] | None = None


class WorkflowRunRequest(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

    inputs: dict[str, object] = Field(default_factory=dict)
    allow_external_api: bool = False
