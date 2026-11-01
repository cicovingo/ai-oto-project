import logging
import os

import httpx

from app.schemas.model import ModelOption, ModelProvider

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
logger = logging.getLogger(__name__)


def _get_ollama_models() -> list[ModelOption] | None:
    try:
        response = httpx.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=0.5)
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError):
        logger.info("Ollama model catalog is unavailable.", exc_info=True)
        return None

    raw_models = payload.get("models") if isinstance(payload, dict) else None
    if not isinstance(raw_models, list):
        logger.warning("Ollama returned an unexpected model catalog format.")
        return []

    return [
        ModelOption(
            id=model["name"],
            name=model["name"],
            capabilities=["text", "tool_use"],
        )
        for model in raw_models
        if isinstance(model, dict) and isinstance(model.get("name"), str)
    ]


def get_model_catalog() -> list[ModelProvider]:
    ollama_models = _get_ollama_models()
    return [
        ModelProvider(
            id="ollama",
            name="Ollama (Yerel)",
            is_configured=ollama_models is not None,
            is_free=True,
            requires_api_key=False,
            access_note=(
                "API anahtarı gerekmez. Ollama'da yüklü modeller listelenir; "
                "yeni model için ollama pull <model> komutunu kullanın."
            ),
            models=(
                ollama_models
                if ollama_models is not None
                else [
                    ModelOption(
                        id="llama3.2",
                        name="Llama 3.2",
                        capabilities=["text", "tool_use"],
                    ),
                    ModelOption(
                        id="qwen2.5:3b",
                        name="Qwen 2.5 3B",
                        capabilities=["text", "tool_use"],
                    ),
                ]
            ),
        ),
        ModelProvider(
            id="groq",
            name="Groq",
            is_configured=bool(os.getenv("GROQ_API_KEY")),
            is_free=True,
            requires_api_key=True,
            access_note=(
                "Ücretsiz kullanım kotası için GROQ_API_KEY gerekir. "
                "Kota ve model erişimi sağlayıcı tarafından değiştirilebilir."
            ),
            models=[
                ModelOption(
                    id="openai/gpt-oss-20b",
                    name="GPT OSS 20B",
                    capabilities=["text", "tool_use"],
                ),
            ],
        ),
        ModelProvider(
            id="deepseek",
            name="DeepSeek",
            is_configured=bool(os.getenv("DEEPSEEK_API_KEY")),
            is_free=False,
            requires_api_key=True,
            access_note=(
                "DEEPSEEK_API_KEY gerekir. API token bazında ücretlidir; "
                "maliyet ve güncel fiyatı DeepSeek hesabında kontrol edin. "
                "Düşük maliyet için deepseek-flash kullanın."
            ),
            models=[
                ModelOption(
                    id="deepseek-flash",
                    name="DeepSeek Flash (ekonomik)",
                    capabilities=["text", "tool_use"],
                ),
                ModelOption(
                    id="deepseek-v4-pro",
                    name="DeepSeek V4 Pro (güçlü)",
                    capabilities=["text", "tool_use"],
                ),
            ],
        ),
        ModelProvider(
            id="gemini",
            name="Google Gemini",
            is_configured=bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")),
            is_free=False,
            requires_api_key=True,
            access_note=(
                "GEMINI_API_KEY gerekir (GOOGLE_API_KEY de kabul edilir). "
                "Ücretsiz kota yalnızca uygun modeller/hesaplar için geçerlidir; "
                "karmaşık görevlerde Gemini Pro ücretli olabilir. Güncel kota ve "
                "fiyatı Google AI Studio'dan kontrol edin."
            ),
            models=[
                ModelOption(
                    id="gemini-3.1-flash-lite",
                    name="Gemini 3.1 Flash-Lite (ekonomik)",
                    capabilities=["text", "tool_use", "vision"],
                ),
                ModelOption(
                    id="gemini-3-flash-preview",
                    name="Gemini 3 Flash (hızlı)",
                    capabilities=["text", "tool_use", "vision"],
                ),
                ModelOption(
                    id="gemini-3.1-pro-preview",
                    name="Gemini 3.1 Pro (karmaşık işler)",
                    capabilities=["text", "tool_use", "vision"],
                ),
            ],
        ),
    ]
