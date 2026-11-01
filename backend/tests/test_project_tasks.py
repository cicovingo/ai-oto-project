import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.model import ModelOption, ModelProvider
from app.schemas.project_task import ProjectTask, ProjectTaskValidation
from app.services import project_task_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolate_database(tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("FLOWMIND_DB_PATH", str(tmp_path / "flowmind.sqlite3"))
    monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")


def _request(project_path: str) -> dict[str, object]:
    return {
        "projectPath": project_path,
        "goal": "Update the value and preserve the existing application behavior.",
        "provider": "groq",
        "model": "openai/gpt-oss-20b",
        "tokenBudget": 4096,
        "allowExternalApi": True,
    }


def _mock_agent_run(request) -> str:
    if "token-efficient software architect" in request.instructions:
        return json.dumps(
            {
                "summary": "Update the application value.",
                "tasks": [
                    {
                        "id": "update-value",
                        "role": "Python engineer",
                        "objective": "Change the application value from 1 to 2.",
                        "files": ["app.py"],
                    }
                ],
            }
        )
    if "skeptical code reviewer" in request.instructions:
        return json.dumps(
            {
                "accepted": True,
                "summary": "Updated the value and validated the change.",
                "issues": [],
            }
        )
    return json.dumps(
        {
            "edits": [
                {
                    "path": "app.py",
                    "find": "VALUE = 1",
                    "replace": "VALUE = 2",
                    "description": "Update the value.",
                }
            ]
        }
    )


def _skip_validation(
    project_path: Path,
    changed_paths: list[str],
) -> list[ProjectTaskValidation]:
    assert project_path.is_dir()
    assert changed_paths
    return []


def test_project_task_config_and_project_root_confinement(tmp_path, monkeypatch) -> None:
    allowed = tmp_path / "allowed"
    outside = tmp_path / "outside"
    allowed.mkdir()
    outside.mkdir()
    monkeypatch.setenv("FLOWMIND_PROJECT_ROOT", str(allowed))

    config = client.get("/api/v1/workspaces/demo/project-tasks/config")
    rejected = client.post(
        "/api/v1/workspaces/demo/project-tasks",
        json=_request(str(outside)),
    )

    assert config.status_code == 200
    assert config.json()["allowedProjectRoot"] == str(allowed)
    assert rejected.status_code == 403


def test_deepseek_project_task_waits_for_api_key(tmp_path, monkeypatch) -> None:
    project = tmp_path / "sample"
    project.mkdir()
    monkeypatch.setenv("FLOWMIND_PROJECT_ROOT", str(tmp_path))
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)

    response = client.post(
        "/api/v1/workspaces/demo/project-tasks",
        json={
            **_request(str(project)),
            "provider": "deepseek",
            "model": "deepseek-flash",
        },
    )

    assert response.status_code == 202
    assert response.json()["status"] == "needs_configuration"
    assert any("DEEPSEEK_API_KEY" in item for item in response.json()["requiredIntegrations"])


def test_gemini_project_task_waits_for_api_key(tmp_path, monkeypatch) -> None:
    project = tmp_path / "sample"
    project.mkdir()
    monkeypatch.setenv("FLOWMIND_PROJECT_ROOT", str(tmp_path))
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)

    response = client.post(
        "/api/v1/workspaces/demo/project-tasks",
        json={
            **_request(str(project)),
            "provider": "gemini",
            "model": "gemini-3.1-flash-lite",
        },
    )

    assert response.status_code == 202
    assert response.json()["status"] == "needs_configuration"
    assert any("GEMINI_API_KEY" in item for item in response.json()["requiredIntegrations"])


def test_cloud_model_requires_explicit_external_api_consent(tmp_path, monkeypatch) -> None:
    project = tmp_path / "sample"
    project.mkdir()
    monkeypatch.setenv("FLOWMIND_PROJECT_ROOT", str(tmp_path))

    response = client.post(
        "/api/v1/workspaces/demo/project-tasks",
        json={
            **_request(str(project)),
            "allowExternalApi": False,
        },
    )

    assert response.status_code == 202
    assert response.json()["status"] == "needs_configuration"
    assert any("proje kaynaklarının" in item for item in response.json()["requiredIntegrations"])


@pytest.mark.parametrize(
    ("complexity", "requested_model", "expected_model"),
    [
        ("simple", "gemini-3.1-flash-lite", "gemini-3.1-flash-lite"),
        ("moderate", "gemini-3.1-flash-lite", "gemini-3-flash-preview"),
        ("complex", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"),
        ("simple", "gemini-3.1-pro-preview", "gemini-3.1-pro-preview"),
    ],
)
def test_gemini_model_routing_upgrades_with_task_complexity(
    monkeypatch,
    complexity: str,
    requested_model: str,
    expected_model: str,
) -> None:
    monkeypatch.setattr(
        project_task_service,
        "get_model_catalog",
        lambda: [
            ModelProvider(
                id="gemini",
                name="Google Gemini",
                is_configured=True,
                is_free=False,
                requires_api_key=True,
                access_note="test",
                models=[
                    ModelOption(id="gemini-3.1-flash-lite", name="Flash-Lite", capabilities=["text"]),
                    ModelOption(id="gemini-3-flash-preview", name="Flash", capabilities=["text"]),
                    ModelOption(id="gemini-3.1-pro-preview", name="Pro", capabilities=["text"]),
                ],
            )
        ],
    )
    task = ProjectTask(
        id="route-test",
        project_name="sample",
        project_path="C:\\sample",
        goal="Implement a feature and preserve behavior.",
        provider="gemini",
        model=requested_model,
        token_budget=4096,
        status="queued",
        stage="Sırada",
        complexity=complexity,
        created_at="2026-10-31T00:00:00+00:00",
        updated_at="2026-10-31T00:00:00+00:00",
    )

    routed_model, summary = project_task_service._route_model(task)

    assert routed_model == expected_model
    assert expected_model in summary


def test_deepseek_model_routing_uses_pro_only_for_complex_tasks(monkeypatch) -> None:
    monkeypatch.setattr(
        project_task_service,
        "get_model_catalog",
        lambda: [
            ModelProvider(
                id="deepseek",
                name="DeepSeek",
                is_configured=True,
                is_free=False,
                requires_api_key=True,
                access_note="test",
                models=[
                    ModelOption(id="deepseek-flash", name="Flash", capabilities=["text"]),
                    ModelOption(id="deepseek-v4-pro", name="Pro", capabilities=["text"]),
                ],
            )
        ],
    )
    task = ProjectTask(
        id="route-test",
        project_name="sample",
        project_path="C:\\sample",
        goal="Implement a feature and preserve behavior.",
        provider="deepseek",
        model="deepseek-flash",
        token_budget=4096,
        status="queued",
        stage="Sırada",
        complexity="complex",
        created_at="2026-10-31T00:00:00+00:00",
        updated_at="2026-10-31T00:00:00+00:00",
    )

    routed_model, routing_summary = project_task_service._route_model(task)

    assert routed_model == "deepseek-v4-pro"
    assert "ücret" in routing_summary


def test_project_task_runs_plan_implement_validate_and_review(tmp_path, monkeypatch) -> None:
    project = tmp_path / "sample"
    project.mkdir()
    (project / "app.py").write_text("VALUE = 1\n", encoding="utf-8")
    monkeypatch.setenv("FLOWMIND_PROJECT_ROOT", str(tmp_path))
    monkeypatch.setattr(project_task_service, "run_agent", _mock_agent_run)
    monkeypatch.setattr(project_task_service, "_validate_project", _skip_validation)

    response = client.post(
        "/api/v1/workspaces/demo/project-tasks",
        json=_request(str(project)),
    )

    assert response.status_code == 202
    task_id = response.json()["id"]
    task = client.get(f"/api/v1/workspaces/demo/project-tasks/{task_id}")

    assert task.status_code == 200
    assert task.json()["status"] == "completed"
    assert task.json()["planSummary"] == "Update the application value."
    assert task.json()["fileChanges"][0]["path"] == "app.py"
    assert task.json()["estimatedTokens"] <= task.json()["tokenBudget"]
    assert (project / "app.py").read_text(encoding="utf-8") == "VALUE = 2\n"
    assert client.get("/api/v1/workspaces/demo/project-tasks").json()[0]["id"] == task_id


def test_project_task_rolls_back_changes_when_validation_fails(tmp_path, monkeypatch) -> None:
    project = tmp_path / "sample"
    project.mkdir()
    source = project / "app.py"
    source.write_bytes(b"VALUE = 1\r\n")
    monkeypatch.setenv("FLOWMIND_PROJECT_ROOT", str(tmp_path))
    monkeypatch.setattr(project_task_service, "run_agent", _mock_agent_run)

    def failed_validation(
        project_path: Path,
        changed_paths: list[str],
    ) -> list[ProjectTaskValidation]:
        assert project_path.is_dir()
        assert changed_paths
        return [
            ProjectTaskValidation(
                name="tests",
                status="failed",
                detail="test failure",
            )
        ]

    monkeypatch.setattr(project_task_service, "_validate_project", failed_validation)

    response = client.post(
        "/api/v1/workspaces/demo/project-tasks",
        json=_request(str(project)),
    )
    task = client.get(
        f"/api/v1/workspaces/demo/project-tasks/{response.json()['id']}"
    ).json()

    assert task["status"] == "failed"
    assert task["fileChanges"] == []
    assert "geri alındı" in task["error"]
    assert source.read_bytes() == b"VALUE = 1\r\n"


def test_project_task_can_create_a_file_in_an_empty_project(tmp_path, monkeypatch) -> None:
    project = tmp_path / "empty"
    project.mkdir()
    monkeypatch.setenv("FLOWMIND_PROJECT_ROOT", str(tmp_path))

    def create_file_agent(request) -> str:
        if "token-efficient software architect" in request.instructions:
            return json.dumps(
                {
                    "summary": "Create a minimal Python entry point.",
                    "tasks": [
                        {
                            "id": "create-entry",
                            "role": "Python engineer",
                            "objective": "Create a minimal application entry point.",
                            "files": ["main.py"],
                        }
                    ],
                }
            )
        if "skeptical code reviewer" in request.instructions:
            return json.dumps(
                {"accepted": True, "summary": "Created the entry point.", "issues": []}
            )
        return json.dumps(
            {
                "edits": [
                    {
                        "path": "main.py",
                        "find": "",
                        "replace": 'print("hello")\n',
                        "description": "Create the app entry point.",
                    }
                ]
            }
        )

    monkeypatch.setattr(project_task_service, "run_agent", create_file_agent)
    monkeypatch.setattr(project_task_service, "_validate_project", _skip_validation)

    response = client.post(
        "/api/v1/workspaces/demo/project-tasks",
        json=_request(str(project)),
    )
    task = client.get(
        f"/api/v1/workspaces/demo/project-tasks/{response.json()['id']}"
    ).json()

    assert task["status"] == "completed"
    assert task["fileChanges"][0]["action"] == "created"
    assert (project / "main.py").read_text(encoding="utf-8") == 'print("hello")\n'


def test_article_task_creates_reviewed_markdown_without_a_planning_call(
    tmp_path,
    monkeypatch,
) -> None:
    project = tmp_path / "article-project"
    project.mkdir()
    monkeypatch.setenv("FLOWMIND_PROJECT_ROOT", str(tmp_path))
    instructions_seen: list[str] = []

    def article_agent(request) -> str:
        instructions_seen.append(request.instructions)
        if "skeptical content reviewer" in request.instructions:
            return json.dumps(
                {"accepted": True, "summary": "Makale yazıldı ve gözden geçirildi.", "issues": []}
            )
        assert "professional article writer" in request.instructions
        prompt = json.loads(request.prompt)
        article_path = prompt["task"]["files"][0]
        assert article_path.startswith("generated-content/task-")
        return json.dumps(
            {
                "edits": [
                    {
                        "path": article_path,
                        "find": "",
                        "replace": "# Sorumlu Yapay Zekâ\n\nBu makale eğitimde sorumlu kullanım ilkelerini açıklar.\n",
                        "description": "Write the requested article.",
                    }
                ]
            }
        )

    monkeypatch.setattr(project_task_service, "run_agent", article_agent)
    monkeypatch.setattr(project_task_service, "_validate_project", _skip_validation)

    response = client.post(
        "/api/v1/workspaces/demo/project-tasks",
        json={
            **_request(str(project)),
            "goal": "Write an article about responsible AI in education.",
        },
    )
    task = client.get(
        f"/api/v1/workspaces/demo/project-tasks/{response.json()['id']}"
    ).json()

    assert response.status_code == 202
    assert task["status"] == "completed"
    assert task["taskType"] == "article_writing"
    assert len(task["plan"]) == 1
    assert task["fileChanges"][0]["action"] == "created"
    assert (project / task["fileChanges"][0]["path"]).read_text(
        encoding="utf-8"
    ).startswith("# Sorumlu Yapay Zekâ")
    assert len(instructions_seen) == 2
    assert all("software architect" not in item for item in instructions_seen)


def test_agent_source_redacts_secret_assignments_and_rejects_traversal(tmp_path) -> None:
    project = tmp_path / "sample"
    project.mkdir()
    (project / "settings.py").write_text(
        'API_KEY = "do-not-send"\nPASSWORD: hunter2\n'
        'GITHUB_TOKEN = "private-token"\n'
        'DATABASE_URL = "postgresql://alice:url-password@db.example/app"\n',
        encoding="utf-8",
    )

    source = project_task_service._read_sources(project, ["settings.py"])

    assert "do-not-send" not in source["settings.py"]
    assert "hunter2" not in source["settings.py"]
    assert "private-token" not in source["settings.py"]
    assert "url-password" not in source["settings.py"]
    assert "postgresql://<redacted>@db.example/app" in source["settings.py"]
    assert 'API_KEY = "<redacted>"' in source["settings.py"]
    with pytest.raises(ValueError):
        project_task_service._safe_relative_path("../outside.py")
    with pytest.raises(ValueError):
        project_task_service._safe_relative_path("credentials/settings.json")


def test_project_task_rejects_blank_goal() -> None:
    request = _request("C:\\project")
    request["goal"] = "                     "

    response = client.post("/api/v1/workspaces/demo/project-tasks", json=request)

    assert response.status_code == 422


@pytest.mark.parametrize(
    ("goal", "expected_type"),
    [
        ("Internetten araştır ve güncel kaynakları bul.", "web_search"),
        ("Research the market and find trustworthy sources.", "web_search"),
        ("Write an article about responsible AI.", "article_writing"),
        ("Makale yaz: yapay zekânın eğitimde kullanımı.", "article_writing"),
        ("Make an indie game with keyboard controls.", "game_development"),
        ("Yeni bir oyun geliştir ve karakter hareketi ekle.", "game_development"),
        ("Create a logo image for my new brand.", "image_generation"),
        ("Create a logo image for my application.", "image_generation"),
        ("Generate a spoken audio narration of this script.", "audio_generation"),
        ("Bu metni seslendir ve ses dosyası oluştur.", "audio_generation"),
        ("Make a short video about Flowmind.", "video_generation"),
        ("Create a video game with keyboard controls.", "game_development"),
        ("Add a web search component to the application.", "software"),
        ("Implement an image generation endpoint.", "software"),
        ("Implement an article export endpoint.", "software"),
    ],
)
def test_task_category_routing_prioritizes_software_changes(
    goal: str,
    expected_type: str,
) -> None:
    assert project_task_service._classify_task(goal) == expected_type


def test_non_coding_tasks_are_blocked_with_integration_requirements(
    tmp_path,
    monkeypatch,
) -> None:
    project = tmp_path / "sample"
    project.mkdir()
    monkeypatch.setenv("FLOWMIND_PROJECT_ROOT", str(tmp_path))
    monkeypatch.delenv("TAVILY_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    for goal, category, expected_key in [
        (
            "Internetten araştır ve güncel kaynakları bul.",
            "web_search",
            "Tavily yedeklemesi",
        ),
        (
            "Create a logo image for my new brand.",
            "image_generation",
            "OPENAI_API_KEY",
        ),
        (
            "Generate a spoken audio narration of this script.",
            "audio_generation",
            "OPENAI_API_KEY",
        ),
    ]:
        response = client.post(
            "/api/v1/workspaces/demo/project-tasks",
            json={
                **_request(str(project)),
                "goal": goal,
                "allowExternalApi": False,
            },
        )

        assert response.status_code == 202
        task = response.json()
        assert task["status"] == "needs_configuration"
        assert task["taskType"] == category
        assert task["requiredIntegrations"]
        if expected_key == "Tavily yedeklemesi":
            assert not any(
                "TAVILY_API_KEY" in requirement
                for requirement in task["requiredIntegrations"]
            )
        else:
            assert any(
                expected_key in requirement
                for requirement in task["requiredIntegrations"]
            )
        assert "onay" in task["error"]
        assert all(step["status"] == "skipped" for step in task["steps"])


def test_video_requests_are_explicitly_blocked_until_provider_is_supported(
    tmp_path,
    monkeypatch,
) -> None:
    project = tmp_path / "video-project"
    project.mkdir()
    monkeypatch.setenv("FLOWMIND_PROJECT_ROOT", str(tmp_path))

    response = client.post(
        "/api/v1/workspaces/demo/project-tasks",
        json={
            **_request(str(project)),
            "goal": "Make a short video about Flowmind features.",
            "allowExternalApi": True,
        },
    )

    assert response.status_code == 202
    task = response.json()
    assert task["status"] == "needs_configuration"
    assert task["taskType"] == "video_generation"
    assert "henüz yok" in task["error"]
    assert all(step["status"] == "skipped" for step in task["steps"])


def test_web_search_uses_tavily_and_returns_cited_summary(tmp_path, monkeypatch) -> None:
    project = tmp_path / "research-project"
    project.mkdir()
    monkeypatch.setenv("FLOWMIND_PROJECT_ROOT", str(tmp_path))
    monkeypatch.setenv("TAVILY_API_KEY", "test-tavily-key")

    def fake_run_agent(request) -> str:
        assert request.provider == "groq"
        return "Source [1] reports the requested current fact."

    monkeypatch.setattr(project_task_service, "run_agent", fake_run_agent)
    captured_request = {}

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return {
                "results": [
                    {
                        "title": "Official source",
                        "url": "https://example.com/fact",
                        "content": "Relevant untrusted source excerpt.",
                    }
                ]
            }

    def fake_post(url: str, *, json: dict[str, object], timeout: int):
        captured_request.update({"url": url, "json": json, "timeout": timeout})
        return FakeResponse()

    monkeypatch.setattr(project_task_service.httpx, "post", fake_post)
    response = client.post(
        "/api/v1/workspaces/demo/project-tasks",
        json={
            **_request(str(project)),
            "goal": "Internetten araştır ve güncel kaynakları bul.",
            "allowExternalApi": True,
        },
    )
    task = client.get(
        f"/api/v1/workspaces/demo/project-tasks/{response.json()['id']}"
    ).json()

    assert task["status"] == "completed"
    assert task["taskType"] == "web_search"
    assert "Source [1]" in task["result"]
    assert "https://example.com/fact" in task["result"]
    report_path = project / task["fileChanges"][0]["path"]
    assert task["fileChanges"][0]["path"].startswith("generated-research/")
    assert "# Research report" in report_path.read_text(encoding="utf-8")
    assert "https://example.com/fact" in report_path.read_text(encoding="utf-8")
    assert captured_request["url"] == "https://api.tavily.com/search"
    assert captured_request["json"]["api_key"] == "test-tavily-key"
    assert captured_request["json"]["search_depth"] == "basic"


def test_web_research_falls_back_to_agent_without_fabricated_sources(
    tmp_path,
    monkeypatch,
) -> None:
    project = tmp_path / "offline-research-project"
    project.mkdir()
    monkeypatch.setenv("FLOWMIND_PROJECT_ROOT", str(tmp_path))
    monkeypatch.delenv("TAVILY_API_KEY", raising=False)
    monkeypatch.setattr(
        project_task_service,
        "run_agent",
        lambda request: "Araştırma taslağı; kaynaklar canlı olarak doğrulanmadı.",
    )

    response = client.post(
        "/api/v1/workspaces/demo/project-tasks",
        json={
            **_request(str(project)),
            "goal": "Research the history of renewable energy.",
            "allowExternalApi": True,
        },
    )
    task = client.get(
        f"/api/v1/workspaces/demo/project-tasks/{response.json()['id']}"
    ).json()

    assert task["status"] == "completed"
    assert task["taskType"] == "web_search"
    assert "canlı web aramasıyla doğrulanmadı" in task["result"]
    assert task["validations"][0]["status"] == "skipped"
    report = project / task["fileChanges"][0]["path"]
    assert "TAVILY_API_KEY bulunmadığı" in task["validations"][0]["detail"]
    assert "kaynaklar canlı olarak doğrulanmadı" in report.read_text(encoding="utf-8")


def test_image_generation_saves_png_only_after_user_consent(tmp_path, monkeypatch) -> None:
    project = tmp_path / "image-project"
    project.mkdir()
    monkeypatch.setenv("FLOWMIND_PROJECT_ROOT", str(tmp_path))
    monkeypatch.setenv("OPENAI_API_KEY", "test-openai-key")
    png = b"\x89PNG\r\n\x1a\n" + b"test-image-bytes"
    import base64

    captured_request = {}

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return {"data": [{"b64_json": base64.b64encode(png).decode("ascii")}]}

    def fake_post(url: str, *, headers: dict[str, str], json: dict[str, object], timeout: int):
        captured_request.update(
            {"url": url, "headers": headers, "json": json, "timeout": timeout}
        )
        return FakeResponse()

    monkeypatch.setattr(project_task_service.httpx, "post", fake_post)

    consent_response = client.post(
        "/api/v1/workspaces/demo/project-tasks",
        json={
            **_request(str(project)),
            "goal": "Create a logo image for my new brand.",
            "allowExternalApi": True,
        },
    )
    completed = client.get(
        f"/api/v1/workspaces/demo/project-tasks/{consent_response.json()['id']}"
    ).json()

    assert completed["status"] == "completed"
    assert completed["provider"] == "openai-images"
    output = project / completed["fileChanges"][0]["path"]
    assert output.read_bytes() == png
    assert captured_request["url"] == "https://api.openai.com/v1/images/generations"
    assert captured_request["headers"]["Authorization"] == "Bearer test-openai-key"
    assert captured_request["json"]["quality"] == "low"

    no_consent_response = client.post(
        "/api/v1/workspaces/demo/project-tasks",
        json={
            **_request(str(project)),
            "goal": "Create an illustration for my presentation.",
            "allowExternalApi": False,
        },
    )
    no_consent = client.get(
        f"/api/v1/workspaces/demo/project-tasks/{no_consent_response.json()['id']}"
    ).json()

    assert no_consent["status"] == "needs_configuration"
    assert len(list((project / "generated-assets").glob("*.png"))) == 1


def test_audio_generation_creates_validated_mp3_after_user_consent(
    tmp_path,
    monkeypatch,
) -> None:
    project = tmp_path / "audio-project"
    project.mkdir()
    monkeypatch.setenv("FLOWMIND_PROJECT_ROOT", str(tmp_path))
    monkeypatch.setenv("OPENAI_API_KEY", "test-openai-key")
    audio = b"ID3" + b"test-mp3-data"
    captured_request: dict[str, object] = {}

    class FakeResponse:
        content = audio

        def raise_for_status(self) -> None:
            return None

    def fake_post(
        url: str,
        *,
        headers: dict[str, str],
        json: dict[str, object],
        timeout: int,
    ):
        captured_request.update(
            {"url": url, "headers": headers, "json": json, "timeout": timeout}
        )
        return FakeResponse()

    monkeypatch.setattr(project_task_service.httpx, "post", fake_post)
    response = client.post(
        "/api/v1/workspaces/demo/project-tasks",
        json={
            **_request(str(project)),
            "goal": "Generate a spoken audio narration of this script.",
            "allowExternalApi": True,
        },
    )
    task = client.get(
        f"/api/v1/workspaces/demo/project-tasks/{response.json()['id']}"
    ).json()

    assert task["status"] == "completed"
    assert task["taskType"] == "audio_generation"
    assert task["provider"] == "openai-audio"
    assert captured_request["url"] == "https://api.openai.com/v1/audio/speech"
    assert captured_request["headers"]["Authorization"].startswith("Bearer ")
    assert captured_request["json"]["response_format"] == "mp3"
    output_path = task["fileChanges"][0]["path"]
    assert output_path.startswith("generated-audio/")
    assert (project / output_path).read_bytes() == audio


def test_complexity_limits_parallel_agents_and_routes_available_model(
    monkeypatch,
) -> None:
    provider = ModelProvider(
        id="ollama",
        name="Ollama",
        is_configured=True,
        is_free=True,
        requires_api_key=False,
        access_note="local",
        models=[
            ModelOption(id="qwen:3b", name="small", capabilities=["text"]),
            ModelOption(id="qwen:14b", name="large", capabilities=["text"]),
        ],
    )
    monkeypatch.setattr(project_task_service, "get_model_catalog", lambda: [provider])

    assert project_task_service._implementation_agent_limit("simple") == 1
    assert project_task_service._implementation_agent_limit("moderate") == 2
    assert project_task_service._implementation_agent_limit("complex") == 3

    task = project_task_service.ProjectTask(
        id="task-routing",
        project_name="project",
        project_path="C:\\project",
        goal="Implement a small change.",
        provider="ollama",
        model="qwen:3b",
        token_budget=4096,
        status="queued",
        stage="queued",
        complexity="complex",
        created_at="2026-01-01T00:00:00Z",
        updated_at="2026-01-01T00:00:00Z",
    )

    model, summary = project_task_service._route_model(task)

    assert model == "qwen:14b"
    assert "complex" in summary
