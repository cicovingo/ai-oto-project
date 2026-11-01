import logging
import os

from fastapi import HTTPException

from app.schemas.agent import AgentRunRequest
from app.services.model_service import get_model_catalog

logger = logging.getLogger(__name__)


def _make_model(
    provider: str,
    model_id: str,
    temperature: float,
    max_tokens: int,
    top_p: float,
) -> object:
    if provider == "ollama":
        from agno.models.ollama import Ollama

        return Ollama(
            id=model_id,
            host=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            api_key=None,
            options={
                "temperature": temperature,
                "num_predict": max_tokens,
                "top_p": top_p,
            },
        )
    if provider == "groq":
        from agno.models.groq import Groq

        return Groq(
            id=model_id,
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p,
        )
    if provider == "deepseek":
        from agno.models.deepseek import DeepSeek

        return DeepSeek(
            id=model_id,
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p,
        )
    if provider == "gemini":
        from agno.models.google import Gemini

        return Gemini(
            id=model_id,
            api_key=os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"),
            temperature=temperature,
            max_output_tokens=max_tokens,
            thinking_level=(
                "high" if model_id == "gemini-3.1-pro-preview" else "low"
            ),
        )
    raise HTTPException(status_code=422, detail="Unsupported model provider")


def run_agent(request: AgentRunRequest) -> str:
    provider = next(
        (
            item
            for item in get_model_catalog()
            if item.id == request.provider
        ),
        None,
    )
    if provider is None or request.model not in {model.id for model in provider.models}:
        raise HTTPException(status_code=422, detail="Unsupported model")

    if request.provider == "groq" and not os.getenv("GROQ_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail="Groq seçeneği için sunucuda GROQ_API_KEY yapılandırılmalıdır.",
        )
    if request.provider == "deepseek" and not os.getenv("DEEPSEEK_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail=(
                "DeepSeek seçeneği için sunucuda DEEPSEEK_API_KEY "
                "yapılandırılmalıdır."
            ),
        )
    if request.provider == "gemini" and not (
        os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    ):
        raise HTTPException(
            status_code=503,
            detail=(
                "Gemini seçeneği için sunucuda GEMINI_API_KEY veya "
                "GOOGLE_API_KEY yapılandırılmalıdır."
            ),
        )
    if request.provider == "ollama" and not provider.is_configured:
        raise HTTPException(
            status_code=503,
            detail=(
                "Ollama sunucusuna ulaşılamıyor. Ollama'yı başlatıp "
                "seçilen modeli indirin."
            ),
        )

    try:
        from agno.agent import Agent

        agent = Agent(
            model=_make_model(
                request.provider,
                request.model,
                request.temperature,
                request.max_tokens,
                request.top_p,
            ),
            instructions=request.instructions,
            markdown=False,
        )
        result = agent.run(request.prompt)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(
            "Agno agent run failed (provider=%s, model=%s)",
            request.provider,
            request.model,
        )
        raise HTTPException(
            status_code=502,
            detail="Model sağlayıcısı yanıt üretirken hata verdi.",
        ) from exc

    if not isinstance(result.content, str):
        raise HTTPException(
            status_code=502,
            detail="Model beklenmeyen bir yanıt biçimi döndürdü.",
        )
    return result.content
