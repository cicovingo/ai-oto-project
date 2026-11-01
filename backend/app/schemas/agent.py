from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import to_camel


class AgentRunRequest(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

    provider: str = Field(pattern=r"^(ollama|groq|deepseek|gemini)$")
    model: str = Field(min_length=1, max_length=120)
    prompt: str = Field(min_length=1, max_length=20_000)
    instructions: str | None = Field(default=None, max_length=4_000)
    temperature: float = Field(default=0.3, ge=0, le=2)
    max_tokens: int = Field(default=1024, ge=1, le=32_768)
    top_p: float = Field(default=1, ge=0, le=1)


class AgentRunResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

    provider: str
    model: str
    response: str
