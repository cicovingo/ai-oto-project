from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.common import to_camel


class ProjectTaskRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    project_path: str = Field(min_length=3, max_length=2048)
    goal: str = Field(min_length=20, max_length=5000)
    provider: Literal["ollama", "groq", "deepseek", "gemini"]
    model: str = Field(min_length=1, max_length=120)
    token_budget: int = Field(default=8192, ge=2048, le=16384)
    allow_external_api: bool = False

    @field_validator("goal")
    @classmethod
    def strip_goal(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 20:
            raise ValueError("Goal must contain at least 20 non-whitespace characters.")
        return normalized


class ProjectTaskPlanItem(BaseModel):
    id: str
    role: str
    objective: str
    files: list[str]


class ProjectTaskStep(BaseModel):
    id: str
    name: str
    status: Literal["queued", "running", "completed", "failed", "skipped"]
    detail: str


class ProjectTaskFileChange(BaseModel):
    path: str
    action: Literal["created", "updated"]
    description: str


class ProjectTaskValidation(BaseModel):
    name: str
    status: Literal["passed", "failed", "skipped"]
    detail: str


class ProjectTask(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    project_name: str
    project_path: str
    goal: str
    provider: str
    model: str
    token_budget: int
    allow_external_api: bool = False
    estimated_tokens: int = 0
    status: Literal[
        "queued", "running", "completed", "failed", "needs_configuration"
    ]
    stage: str
    task_type: Literal[
        "software",
        "game_development",
        "article_writing",
        "web_search",
        "image_generation",
        "audio_generation",
        "video_generation",
    ] = "software"
    complexity: Literal["simple", "moderate", "complex"] = "moderate"
    routing_summary: str | None = None
    required_integrations: list[str] = Field(default_factory=list)
    plan_summary: str | None = None
    plan: list[ProjectTaskPlanItem] = Field(default_factory=list)
    steps: list[ProjectTaskStep] = Field(default_factory=list)
    file_changes: list[ProjectTaskFileChange] = Field(default_factory=list)
    validations: list[ProjectTaskValidation] = Field(default_factory=list)
    result: str | None = None
    error: str | None = None
    created_at: str
    updated_at: str


class ProjectTaskConfig(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    allowed_project_root: str
    web_search_configured: bool = False
    image_generation_configured: bool = False
